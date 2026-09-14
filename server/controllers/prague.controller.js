// CRUD_Project/server/controllers/customer.controller.js
const iv08f = require("../models/Prague")
const vcfrx8 = require("../models/Sofa")
const hk0gac = require("../models/AuditLog");
const rb13 = require("mongoose");
const {
  applyTenantScope: bp63ie,
  withTenant: rb3b1
} = require("../utils/kyotoScope")

// ðŸ” Helper: Log customer actions (SOW 6.11 Security)
const v9nqen = async (s600, hqfmhc, b94axm, c58w3, i2ais, m5555t = "", vr9v4 = "", gu07 = "") => {
  try {
    await hk0gac.create({
      userId: s600,
      action: hqfmhc,
      collectionName: "customers",
      documentId: b94axm,
      oldValue: c58w3,
      newValue: i2ais,
      ipAddress: m5555t,
      userAgent: vr9v4,
      ...(gu07 && {
        reason: gu07
      })
    });
  } catch (w2c8) {
    console.warn("âš ï¸ Audit log failed:", w2c8.message);
  }
};

// ðŸ” Helper: Auto-segment based on SOW 6.4 business logic
const z88j = (p5c1u9, bgo4, lj3v37) => {
  if (p5c1u9 === 0) return "New";
  if (bgo4 > 10000) return "VIP";
  if (p5c1u9 >= 5) return "Regular";
  if (lj3v37 && Date.now() - new Date(lj3v37).getTime() > 90 * 24 * 60 * 60 * 1000) return "Inactive";
  return "Regular";
};
/**
 * GET /api/customers - List with advanced filters (SOW 6.4)
 */
exports.listCustomers = async (d7v8, ru5zta) => {
  try {
    const {
      page: vg8j9 = 1,
      limit: a613r6 = 20,
      search: uv36s1,
      segment: i1p9sj,
      source: l7491q,
      city: w6x6qs,
      minSpent: p9top0,
      maxSpent: zjzzk1
    } = d7v8.query;
    const l1x5x9 = {};
    bp63ie(d7v8, l1x5x9);

    // ðŸ” Search logic - FIXED: Use $text OR $or with regex, not both
    if (uv36s1?.trim()) {
      const rqa5h = uv36s1.trim();
      // Try $text search first (requires text index on schema)
      try {
        l1x5x9.$text = {
          $search: rqa5h
        };
      } catch (n5o9ac) {
        // Fallback to $or with regex if text search fails
        l1x5x9.$or = [{
          firstName: {
            $regex: rqa5h,
            $options: "i"
          }
        }, {
          lastName: {
            $regex: rqa5h,
            $options: "i"
          }
        }, {
          email: {
            $regex: rqa5h,
            $options: "i"
          }
        }, {
          phone: {
            $regex: rqa5h,
            $options: "i"
          }
        }];
      }
    }

    // Other filters
    if (i1p9sj) l1x5x9.segment = i1p9sj;
    if (l7491q) l1x5x9.source = l7491q;
    if (w6x6qs?.trim()) l1x5x9["address.city"] = {
      $regex: w6x6qs.trim(),
      $options: "i"
    };
    if (p9top0) l1x5x9.totalSpent = {
      $gte: parseFloat(p9top0)
    };
    if (zjzzk1) {
      l1x5x9.totalSpent = {
        ...l1x5x9.totalSpent,
        $lte: parseFloat(zjzzk1)
      };
    }
    const q80w8 = await iv08f.find(l1x5x9).select("-__v").sort({
      lastOrderDate: -1
    }).limit(parseInt(a613r6)).skip((parseInt(vg8j9) - 1) * parseInt(a613r6)).lean();
    const c81fk0 = await iv08f.countDocuments(l1x5x9);
    ru5zta.json({
      success: true,
      data: {
        customers: q80w8,
        pagination: {
          currentPage: parseInt(vg8j9),
          totalPages: Math.ceil(c81fk0 / a613r6),
          totalItems: c81fk0,
          itemsPerPage: parseInt(a613r6),
          hasNext: parseInt(vg8j9) * parseInt(a613r6) < c81fk0,
          hasPrev: parseInt(vg8j9) > 1
        }
      }
    });
  } catch (rs708) {
    console.error("List customers error:", rs708);

    // âœ… Handle $regex errors specifically
    if (rs708.code === 2 && rs708.message?.includes("$regex has to be a string")) {
      return ru5zta.status(400).json({
        success: false,
        message: "Invalid search parameter - must be a string"
      });
    }
    ru5zta.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

/**
 * GET /api/customers/:id - Details + Purchase Patterns (SOW 6.4 Option 2)
 */
exports.getCustomer = async (o0vqx7, xqg2x8) => {
  try {
    const lquiq = {
      _id: o0vqx7.params.id
    };
    bp63ie(o0vqx7, lquiq);
    const n7j17p = await iv08f.findOne(lquiq).lean();
    if (!n7j17p) return xqg2x8.status(404).json({
      success: false,
      message: "Customer not found"
    });

    // Calculate purchase patterns for Option 2 dashboard
    const ks5bh = n7j17p.totalOrders > 0 ? (n7j17p.totalSpent / n7j17p.totalOrders).toFixed(2) : 0;
    const bxh004 = n7j17p.lastOrderDate ? Math.floor((Date.now() - new Date(n7j17p.lastOrderDate)) / (1000 * 60 * 60 * 24)) : null;
    xqg2x8.json({
      success: true,
      data: {
        ...n7j17p,
        purchasePatterns: {
          avgOrderValue: parseFloat(ks5bh),
          daysSinceLastOrder: bxh004,
          lifetimeValue: n7j17p.totalSpent,
          orderFrequency: n7j17p.totalOrders > 0 ? "Active" : "Dormant"
        }
      }
    });
  } catch (kuo3za) {
    console.error("Get customer error:", kuo3za);
    if (kuo3za.name === "CastError") return xqg2x8.status(400).json({
      success: false,
      message: "Invalid customer ID"
    });
    xqg2x8.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

/**
 * POST /api/customers - Create (Manual or Auto from Order)
 */
exports.createCustomer = async (wl6q, z78a) => {
  try {
    const {
      firstName: qa24,
      lastName: y537,
      email: yv10l1,
      phone: tu3ft,
      address: rvmk2q,
      source: q1s81
    } = wl6q.body;

    // Check duplicate email/phone
    const rw3j6x = await iv08f.findOne({
      $or: [...(yv10l1 ? [{
        email: yv10l1.toLowerCase()
      }] : []), ...(tu3ft ? [{
        phone: tu3ft
      }] : [])]
    });
    if (rw3j6x) {
      return z78a.status(409).json({
        success: false,
        message: "Customer already exists",
        data: {
          id: rw3j6x._id,
          email: rw3j6x.email,
          phone: rw3j6x.phone
        }
      });
    }
    const gv6i40 = new iv08f({
      firstName: qa24,
      lastName: y537,
      email: yv10l1?.toLowerCase(),
      phone: tu3ft,
      address: rvmk2q || {},
      source: q1s81 || "Manual",
      segment: "New",
      ...(wl6q.tenantId && {
        tenantId: wl6q.tenantId
      })
    });
    await gv6i40.save();
    v9nqen(wl6q.user.userId, "CREATE", gv6i40._id, {}, gv6i40.toObject(), wl6q.ip, wl6q.get("User-Agent"));
    z78a.status(201).json({
      success: true,
      message: "Customer created successfully",
      data: gv6i40.toObject()
    });
  } catch (nhfn) {
    console.error("Create customer error:", nhfn);
    if (nhfn.code === 11000) return z78a.status(409).json({
      success: false,
      message: "Email or phone already exists"
    });
    if (nhfn.name === "ValidationError") return z78a.status(400).json({
      success: false,
      message: "Validation failed",
      errors: Object.values(nhfn.errors).map(vjdat => ({
        field: vjdat.path,
        message: vjdat.message
      }))
    });
    z78a.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

/**
 * PUT /api/customers/:id - Update details
 */
exports.updateCustomer = async (w4l6, ik51) => {
  try {
    const h02e8 = await iv08f.findById(w4l6.params.id);
    if (!h02e8) return ik51.status(404).json({
      success: false,
      message: "Customer not found"
    });
    const unz06 = h02e8.toObject();
    const ekb8 = {};
    if (w4l6.body.firstName) ekb8.firstName = w4l6.body.firstName.trim();
    if (w4l6.body.lastName) ekb8.lastName = w4l6.body.lastName.trim();
    if (w4l6.body.email) ekb8.email = w4l6.body.email.toLowerCase().trim();
    if (w4l6.body.phone) ekb8.phone = w4l6.body.phone.trim();
    if (w4l6.body.source) ekb8.source = w4l6.body.source;
    if (w4l6.body.address) ekb8.address = {
      ...h02e8.address,
      ...w4l6.body.address
    };
    Object.assign(h02e8, ekb8);
    h02e8.updatedAt = new Date();
    await h02e8.save();
    v9nqen(w4l6.user.userId, "UPDATE", h02e8._id, unz06, h02e8.toObject(), w4l6.ip, w4l6.get("User-Agent"));
    ik51.json({
      success: true,
      message: "Customer updated successfully",
      data: h02e8.toObject()
    });
  } catch (jwu0) {
    console.error("Update customer error:", jwu0);
    if (jwu0.code === 11000) return ik51.status(409).json({
      success: false,
      message: "Email or phone already in use"
    });
    ik51.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

/**
 * PATCH /api/customers/:id/segment - Manual segment override
 */
exports.updateSegment = async (k2n2ye, mx3zt) => {
  try {
    const {
      id: f0g865
    } = k2n2ye.params;
    const {
      segment: tp3z,
      reason: o3c9
    } = k2n2ye.body;
    const t8fbu5 = await iv08f.findByIdAndUpdate(f0g865, {
      $set: {
        segment: tp3z,
        updatedAt: new Date()
      }
    }, {
      new: true,
      runValidators: true
    }).lean();
    //Lean is used to clean the data and just required the data which is required.

    if (!t8fbu5) return mx3zt.status(404).json({
      success: false,
      message: "Customer not found"
    });
    await hk0gac.create({
      userId: k2n2ye.user.userId,
      action: "UPDATE",
      collectionName: "customers",
      documentId: f0g865,
      oldValue: {
        segment: t8fbu5.segment
      },
      newValue: {
        segment: tp3z
      },
      ipAddress: k2n2ye.ip,
      userAgent: k2n2ye.get("User-Agent"),
      reason: `Manual segment override: ${o3c9 || "N/A"}`
    });
    mx3zt.json({
      success: true,
      message: `Customer segment updated to ${tp3z}`,
      data: {
        id: t8fbu5._id,
        segment: t8fbu5.segment,
        updatedAt: t8fbu5.updatedAt
      }
    });
  } catch (gttc) {
    console.error("Update segment error:", gttc);
    mx3zt.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

/**
 * GET /api/customers/:id/orders - Order History (SOW 6.4)
 */
exports.getCustomerOrders = async (mp642, e1z79) => {
  try {
    const {
      id: jzay8r
    } = mp642.params;
    const {
      page: g16zd8 = 1,
      limit: u16xq0 = 20
    } = mp642.query;

    // Verify customer exists
    const qgtc0w = await iv08f.findById(jzay8r);
    if (!qgtc0w) return e1z79.status(404).json({
      success: false,
      message: "Customer not found"
    });
    const tpo5 = {
      customer: jzay8r
    };
    bp63ie(mp642, tpo5);
    const zn17 = await vcfrx8.find(tpo5).sort({
      createdAt: -1
    }).limit(parseInt(u16xq0)).skip((parseInt(g16zd8) - 1) * parseInt(u16xq0)).lean();
    const q9a0yg = await vcfrx8.countDocuments(tpo5);
    e1z79.json({
      success: true,
      data: {
        customer: {
          id: qgtc0w._id,
          name: qgtc0w.fullName
        },
        orders: zn17,
        pagination: {
          currentPage: parseInt(g16zd8),
          totalPages: Math.ceil(q9a0yg / u16xq0),
          totalItems: q9a0yg
        }
      }
    });
  } catch (mbgk) {
    console.error("Get customer orders error:", mbgk);
    e1z79.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

/**
 * GET /api/customers/analytics/segments - Segmentation Report (Option 2)
 */
exports.getSegmentAnalytics = async (vn55, xto59) => {
  try {
    const dnzrf = {};
    bp63ie(vn55, dnzrf);
    const f4ko9l = await iv08f.aggregate([{
      $match: dnzrf
    }, {
      $group: {
        _id: "$segment",
        count: {
          $sum: 1
        },
        totalSpent: {
          $sum: "$totalSpent"
        },
        avgOrderValue: {
          $avg: {
            $cond: [{
              $gt: ["$totalOrders", 0]
            }, {
              $divide: ["$totalSpent", "$totalOrders"]
            }, 0]
          }
        }
      }
    }, {
      $sort: {
        count: -1
      }
    }]);
    const ps8me = f4ko9l.reduce((ak3ss7, an0l) => ak3ss7 + an0l.count, 0);
    const oh817 = f4ko9l.map(a8v0 => ({
      segment: a8v0._id || "Unsegmented",
      count: a8v0.count,
      percentage: ps8me > 0 ? (a8v0.count / ps8me * 100).toFixed(1) : 0,
      totalRevenue: a8v0.totalSpent.toFixed(2),
      avgOrderValue: a8v0.avgOrderValue.toFixed(2)
    }));
    xto59.json({
      success: true,
      data: {
        segments: oh817,
        totalCustomers: ps8me,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (e03wkb) {
    console.error("Segment analytics error:", e03wkb);
    xto59.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

/**
 * DELETE /api/customers/:id - Soft Delete + GDPR Anonymization
 */
exports.deleteCustomer = async (gpyd6, rg9a2) => {
  try {
    const {
      id: mco1
    } = gpyd6.params;
    const m0177e = await iv08f.findById(mco1);
    if (!m0177e) return rg9a2.status(404).json({
      success: false,
      message: "Customer not found"
    });
    const q1th = m0177e.toObject();

    // GDPR-compliant anonymization: clear PII but keep order history for accounting
    m0177e.firstName = "Deleted";
    m0177e.lastName = "User";
    m0177e.email = `deleted_${m0177e._id}@anonymized.local`;
    m0177e.phone = "000-000-0000";
    m0177e.address = {
      street: "N/A",
      city: "N/A",
      country: "N/A"
    };
    m0177e.segment = "Inactive";
    m0177e.updatedAt = new Date();
    await m0177e.save();
    v9nqen(gpyd6.user.userId, "DELETE", mco1, q1th, {
      ...m0177e.toObject(),
      note: "PII anonymized for GDPR compliance"
    }, gpyd6.ip, gpyd6.get("User-Agent"));
    rg9a2.json({
      success: true,
      message: "Customer anonymized successfully (GDPR compliant)",
      data: {
        id: m0177e._id,
        status: "Anonymized",
        anonymizedAt: m0177e.updatedAt
      }
    });
  } catch (h50b) {
    console.error("Delete customer error:", h50b);
    rg9a2.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};