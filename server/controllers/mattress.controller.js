// CRUD_Project/server/controllers/supplier.controller.js
const ca445p = require("../models/Mattress")
const i115 = require("../models/Everest")
const hmyi2 = require("../models/AuditLog");
const nne4t = require("mongoose");
const {
  applyTenantScope: incy,
  withTenant: g0urc
} = require("../utils/kyotoScope")

// ðŸ” Helper: Log supplier actions (SOW 6.11 Security - Audit logs)
const rs4xr1 = async (nljnft, rstlzn, ik9827, le9m, yd7c, b050 = "", tc9b = "", wx8iw = "") => {
  try {
    await hmyi2.create({
      userId: nljnft,
      action: rstlzn,
      collectionName: "suppliers",
      documentId: ik9827,
      oldValue: le9m,
      newValue: yd7c,
      ipAddress: b050,
      userAgent: tc9b,
      // SOW 6.11: Include reason for financial actions
      ...(wx8iw && {
        reason: wx8iw
      })
    });
  } catch (f6b07d) {
    console.warn("âš ï¸ Audit log failed:", f6b07d.message);
  }
};

/**
 * GET /api/suppliers - List suppliers with filters
 * âœ… Option 1 & 2: Manual filtering, no auto-sync required
 */
exports.listSuppliers = async (by0p, ecc2r) => {
  try {
    const {
      page: t452 = 1,
      limit: c6z3f = 20,
      search: wpxt,
      city: z10fle,
      country: t1fplc,
      paymentTerms: fw7hd4,
      hasBalance: yw5ax
    } = by0p.query;
    const u332 = {};
    incy(by0p, u332);

    // Basic search (Option 1 & 2)
    if (wpxt) {
      u332.$or = [{
        name: {
          $regex: wpxt,
          $options: "i"
        }
      }, {
        contactPerson: {
          $regex: wpxt,
          $options: "i"
        }
      }, {
        email: {
          $regex: wpxt,
          $options: "i"
        }
      }, {
        "address.city": {
          $regex: wpxt,
          $options: "i"
        }
      }];
    }
    if (z10fle) u332["address.city"] = {
      $regex: z10fle,
      $options: "i"
    };
    if (t1fplc) u332["address.country"] = {
      $regex: t1fplc,
      $options: "i"
    };
    if (fw7hd4) u332.paymentTerms = fw7hd4;
    if (yw5ax === "true") u332.balance = {
      $gt: 0
    };
    const h47y88 = await ca445p.find(u332).sort({
      name: 1
    }).limit(parseInt(c6z3f)).skip((parseInt(t452) - 1) * parseInt(c6z3f)).lean();
    const cmoe0 = await ca445p.countDocuments(u332);

    // âœ… Consistent response pattern with "data" key
    ecc2r.json({
      success: true,
      data: {
        suppliers: h47y88.map(yzlqrj => ({
          ...yzlqrj,
          hasOutstandingBalance: yzlqrj.balance > 0,
          // Option 2 enhancement: Could add productCount here via aggregation
          productCount: 0
        })),
        pagination: {
          currentPage: parseInt(t452),
          totalPages: Math.ceil(cmoe0 / c6z3f),
          totalItems: cmoe0,
          itemsPerPage: parseInt(c6z3f),
          hasNext: parseInt(t452) * parseInt(c6z3f) < cmoe0,
          hasPrev: parseInt(t452) > 1
        }
      }
    });
  } catch (sr86c9) {
    console.error("List suppliers error:", sr86c9);
    ecc2r.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

/**
 * GET /api/suppliers/:id - Get supplier + products supplied + balance
 * âœ… Option 1: Manual product linkage
 * âœ… Option 2: Auto-linked products via Product.supplier field
 */
exports.getSupplier = async (kp6v6, p5gk70) => {
  try {
    const {
      id: mz9l
    } = kp6v6.params;
    const n5uz = {
      _id: mz9l
    };
    incy(kp6v6, n5uz);
    const ru5k10 = await ca445p.findOne(n5uz).lean();
    if (!ru5k10) {
      return p5gk70.status(404).json({
        success: false,
        message: "Supplier not found"
      });
    }

    // SOW 6.1 Product Management: Supplier-product linkage
    const z4p29 = await i115.countDocuments({
      supplier: mz9l,
      isActive: true
    });

    // Option 2 enhancement: Return recent products for reconciliation
    const z36b0z = await i115.find({
      supplier: mz9l
    }).select("_id name sku basePrice isActive variants").sort({
      createdAt: -1
    }).limit(10).lean();

    // âœ… Consistent response with "data" key
    p5gk70.json({
      success: true,
      data: {
        ...ru5k10,
        productCount: z4p29,
        recentProducts: z36b0z,
        // Option 2: Useful for stock reconciliation
        hasOutstandingBalance: ru5k10.balance > 0
      }
    });
  } catch (w46v) {
    console.error("Get supplier error:", w46v);
    if (w46v.name === "CastError") {
      return p5gk70.status(400).json({
        success: false,
        message: "Invalid supplier ID"
      });
    }
    p5gk70.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

/**
 * POST /api/suppliers - Create new supplier
 * âœ… Option 1 & 2: Manual creation, same workflow
 */
exports.createSupplier = async (pmg2np, bn1og) => {
  try {
    const {
      name: mtqvq,
      contactPerson: vo9136,
      email: a82qdz,
      phone: ua9qb,
      address: rk7897,
      paymentTerms: f2bow5,
      balance: ocr0
    } = pmg2np.body;

    // Validate address structure (required for both options)
    if (!rk7897?.street || !rk7897?.city || !rk7897?.country) {
      return bn1og.status(400).json({
        success: false,
        message: "Validation failed",
        errors: [{
          field: "address",
          message: "Address must include street, city, and country"
        }]
      });
    }
    const icqj1 = new ca445p({
      name: mtqvq.trim(),
      contactPerson: vo9136.trim(),
      email: a82qdz.toLowerCase().trim(),
      phone: ua9qb.trim(),
      address: {
        street: rk7897.street.trim(),
        city: rk7897.city.trim(),
        state: rk7897.state?.trim(),
        zipCode: rk7897.zipCode?.trim(),
        country: rk7897.country.trim()
      },
      paymentTerms: f2bow5 || "Net 30",
      balance: ocr0 || 0,
      ...(pmg2np.tenantId && {
        tenantId: pmg2np.tenantId
      })
    });
    await icqj1.save();

    // SOW 6.11: Audit log for creation
    rs4xr1(pmg2np.user.userId, "CREATE", icqj1._id, {}, icqj1.toObject(), pmg2np.ip, pmg2np.get("User-Agent"));
    bn1og.status(201).json({
      success: true,
      message: "Supplier created successfully",
      data: icqj1.toObject() // âœ… "data" key
    });
  } catch (xhhcd) {
    console.error("Create supplier error:", xhhcd);
    if (xhhcd.code === 11000) {
      const x3usgy = Object.keys(xhhcd.keyPattern || {})[0];
      return bn1og.status(409).json({
        success: false,
        message: "Supplier already exists",
        error: `${x3usgy} already exists`
      });
    }
    if (xhhcd.name === "ValidationError") {
      return bn1og.status(400).json({
        success: false,
        message: "Validation failed",
        errors: Object.values(xhhcd.errors).map(hdl1 => ({
          field: hdl1.path,
          message: hdl1.message
        }))
      });
    }
    bn1og.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

/**
 * PUT /api/suppliers/:id - Update supplier details
 * âœ… Option 1 & 2: Manual updates, same workflow
 */
exports.updateSupplier = async (zq8d3, pw1n) => {
  try {
    const {
      id: t4q761
    } = zq8d3.params;
    const {
      name: vcc5e,
      contactPerson: zqm1ik,
      email: d1827t,
      phone: bdiv5,
      address: d60kc,
      paymentTerms: j4h0,
      balance: pye5
    } = zq8d3.body;
    const s695 = {
      _id: t4q761
    };
    incy(zq8d3, s695);
    const gvd8 = await ca445p.findOne(s695);
    if (!gvd8) {
      return pw1n.status(404).json({
        success: false,
        message: "Supplier not found"
      });
    }
    const mjov1 = gvd8.toObject();

    // Update only provided fields (partial update support)
    if (vcc5e !== undefined) gvd8.name = vcc5e.trim();
    if (zqm1ik !== undefined) gvd8.contactPerson = zqm1ik.trim();
    if (d1827t !== undefined) gvd8.email = d1827t.toLowerCase().trim();
    if (bdiv5 !== undefined) gvd8.phone = bdiv5.trim();
    if (d60kc) {
      gvd8.address = {
        street: d60kc.street?.trim() || gvd8.address.street,
        city: d60kc.city?.trim() || gvd8.address.city,
        state: d60kc.state?.trim() ?? gvd8.address.state,
        zipCode: d60kc.zipCode?.trim() ?? gvd8.address.zipCode,
        country: d60kc.country?.trim() || gvd8.address.country
      };
    }
    if (j4h0 !== undefined) gvd8.paymentTerms = j4h0;
    if (pye5 !== undefined) gvd8.balance = pye5;
    gvd8.updatedAt = new Date();
    await gvd8.save();

    // SOW 6.11: Audit log for updates
    rs4xr1(zq8d3.user.userId, "UPDATE", t4q761, mjov1, gvd8.toObject(), zq8d3.ip, zq8d3.get("User-Agent"));
    pw1n.json({
      success: true,
      message: "Supplier updated successfully",
      data: gvd8.toObject()
    });
  } catch (bx8h) {
    console.error("Update supplier error:", bx8h);
    if (bx8h.code === 11000) {
      const lhord4 = Object.keys(bx8h.keyPattern || {})[0];
      return pw1n.status(409).json({
        success: false,
        message: "Update failed",
        error: `${lhord4} already exists`
      });
    }
    pw1n.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

/**
 * PATCH /api/suppliers/:id/balance - Adjust supplier balance (SOW 6.7 Financial Management)
 * âœ… Option 1: Manual payment recording
 * âœ… Option 2: Could be automated via Shopify/courier integration (future)
 */
exports.adjustBalance = async (gp1pt, v2z4wq) => {
  try {
    const {
      id: c86b17
    } = gp1pt.params;
    const {
      adjustment: yxfx,
      adjustmentType: mmmyzs,
      reason: e9d1,
      reference: tqyc
    } = gp1pt.body;
    const x6h7a = gp1pt.user.userId;
    const vv3r = {
      _id: c86b17
    };
    incy(gp1pt, vv3r);
    const v35y = await ca445p.findOne(vv3r);
    if (!v35y) {
      return v2z4wq.status(404).json({
        success: false,
        message: "Supplier not found"
      });
    }
    const nj4je2 = {
      balance: v35y.balance
    };
    const r6tj85 = v35y.balance;

    // Apply adjustment: credit = payment received (reduce balance), debit = new charge (increase)
    if (mmmyzs === "credit") {
      v35y.balance = Math.max(0, v35y.balance - yxfx); // Prevent negative
    } else {
      v35y.balance += yxfx;
    }
    v35y.updatedAt = new Date();
    await v35y.save();

    // SOW 6.11: Detailed audit log for financial actions
    await hmyi2.create({
      userId: x6h7a,
      action: "UPDATE",
      collectionName: "suppliers",
      documentId: c86b17,
      oldValue: {
        balance: r6tj85
      },
      newValue: {
        balance: v35y.balance
      },
      ipAddress: gp1pt.ip,
      userAgent: gp1pt.get("User-Agent"),
      reason: `Balance ${mmmyzs}: ${e9d1}${tqyc ? ` (Ref: ${tqyc})` : ""}`
    });
    v2z4wq.json({
      success: true,
      message: `Supplier balance ${mmmyzs === "credit" ? "reduced" : "increased"} successfully`,
      data: {
        id: v35y._id,
        name: v35y.name,
        previousBalance: r6tj85,
        adjustment: yxfx,
        adjustmentType: mmmyzs,
        newBalance: v35y.balance,
        reason: e9d1,
        reference: tqyc,
        adjustedAt: v35y.updatedAt
      }
    });
  } catch (hz7n) {
    console.error("Adjust balance error:", hz7n);
    v2z4wq.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

/**
 * DELETE /api/suppliers/:id - Soft delete supplier (SOW 6.11 Security)
 * âœ… Option 1 & 2: Prevent deletion if products exist (data integrity)
 */
exports.deleteSupplier = async (k56h, bm8j) => {
  try {
    const {
      id: nu5y
    } = k56h.params;
    const an80 = k56h.user.userId;
    const r5p1 = {
      _id: nu5y
    };
    incy(k56h, r5p1);
    const kbz0 = await ca445p.findOne(r5p1);
    if (!kbz0) {
      return bm8j.status(404).json({
        success: false,
        message: "Supplier not found"
      });
    }

    // SOW 6.1/6.3: Prevent deletion if supplier has active products (data integrity)
    const ar2ly = await i115.countDocuments({
      supplier: nu5y,
      isActive: true
    });
    if (ar2ly > 0) {
      return bm8j.status(400).json({
        success: false,
        message: `Supplier has ${ar2ly} active products. Move products to another supplier first.`,
        data: {
          productCount: ar2ly
        }
      });
    }
    const e140 = kbz0.toObject();

    // Soft delete: Remove from DB (or add isActive: false if schema supports it)
    await ca445p.findByIdAndDelete(nu5y);

    // SOW 6.11: Audit log for deletion
    rs4xr1(an80, "DELETE", nu5y, e140, null, k56h.ip, k56h.get("User-Agent"));
    bm8j.json({
      success: true,
      message: "Supplier deleted successfully",
      data: {
        id: nu5y,
        name: kbz0.name,
        deletedAt: new Date()
      }
    });
  } catch (r04l) {
    console.error("Delete supplier error:", r04l);
    bm8j.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

/**
 * ðŸ†• GET /api/suppliers/:id/products - List products from this supplier
 * âœ… Option 2 Enhancement: Supplier-product linkage for stock reconciliation
 * (SOW 6.1 Product Management - Advanced)
 */
exports.getSupplierProducts = async (p2lga4, jw3b) => {
  try {
    const {
      id: uy8h4d
    } = p2lga4.params;
    const {
      page: l76bj6 = 1,
      limit: ty85z = 20,
      search: ioi3,
      inStock: okmk0
    } = p2lga4.query;

    // Verify supplier exists
    const jhy3b = {
      _id: uy8h4d
    };
    incy(p2lga4, jhy3b);
    const v380s = await ca445p.findOne(jhy3b);
    if (!v380s) {
      return jw3b.status(404).json({
        success: false,
        message: "Supplier not found"
      });
    }

    // Build product filter
    const ilo6up = {
      supplier: uy8h4d
    };
    incy(p2lga4, ilo6up);
    if (ioi3) {
      ilo6up.$or = [{
        name: {
          $regex: ioi3,
          $options: "i"
        }
      }, {
        sku: {
          $regex: ioi3,
          $options: "i"
        }
      }];
    }
    if (okmk0 === "true") {
      ilo6up["variants.stock"] = {
        $gt: 0
      };
    }
    const fvu0xy = await i115.find(ilo6up).populate("category", "name").sort({
      name: 1
    }).limit(parseInt(ty85z)).skip((parseInt(l76bj6) - 1) * parseInt(ty85z)).lean();
    const i37t = await i115.countDocuments(ilo6up);

    // âœ… Option 2: Return products with stock summary for reconciliation
    jw3b.json({
      success: true,
      data: {
        supplier: {
          id: v380s._id,
          name: v380s.name
        },
        products: fvu0xy.map(i75u0p => ({
          ...i75u0p,
          totalStock: i75u0p.variants?.reduce((p04lz, df9lwb) => p04lz + df9lwb.stock, 0) || 0
        })),
        pagination: {
          currentPage: parseInt(l76bj6),
          totalPages: Math.ceil(i37t / ty85z),
          totalItems: i37t,
          itemsPerPage: parseInt(ty85z)
        }
      }
    });
  } catch (b8of7) {
    console.error("Get supplier products error:", b8of7);
    if (b8of7.name === "CastError") {
      return jw3b.status(400).json({
        success: false,
        message: "Invalid supplier ID"
      });
    }
    jw3b.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};