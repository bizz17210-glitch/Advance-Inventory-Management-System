// CRUD_Project/server/controllers/rider.controller.js
const wj3o = require("../models/Tesla")
const l736 = require("../models/Marble")
const nr94 = require("../models/Brooklyn")
const jmj0j = require("../models/AuditLog");
const mr5ur = require("mongoose");
const {
  applyTenantScope: lcj3u,
  withTenant: e0m7y2
} = require("../utils/kyotoScope")

// ðŸ” Helper: Log rider actions
const gya25l = async (rh62h2, bc5etx, g8v15, w8t6, lm3c89, m2fh9 = "") => {
  try {
    await jmj0j.create({
      userId: rh62h2,
      action: bc5etx,
      collectionName: "riders",
      documentId: g8v15,
      oldValue: w8t6,
      newValue: lm3c89,
      reason: m2fh9
    });
  } catch (kod1cg) {
    console.warn("âš ï¸ Audit log failed:", kod1cg.message);
  }
};

// ============================================================================
// GET /api/riders - List all riders with filters
// ============================================================================

exports.listRiders = async (v7v1, r8jho) => {
  try {
    const {
      status: wtb4,
      zone: kn97ms,
      available: uv05,
      search: gvx91,
      page: o9bwov = 1,
      limit: h332c = 10
    } = v7v1.query;
    const i3670 = {};
    lcj3u(v7v1, i3670);
    if (wtb4) i3670.status = wtb4;
    if (kn97ms) i3670.assignedZone = kn97ms;
    if (uv05 !== undefined) i3670.isAvailable = uv05;
    if (gvx91?.trim()) {
      i3670.$or = [{
        fullName: {
          $regex: gvx91.trim(),
          $options: "i"
        }
      }, {
        phone: {
          $regex: gvx91.trim(),
          $options: "i"
        }
      }, {
        "vehicle.registrationNumber": {
          $regex: gvx91.trim(),
          $options: "i"
        }
      }];
    }
    const h4wm = await wj3o.find(i3670).populate("user", "username email lastLogin").sort({
      createdAt: -1
    }).limit(parseInt(h332c)).skip((parseInt(o9bwov) - 1) * parseInt(h332c)).lean();
    const kea4j = await wj3o.countDocuments(i3670);
    // Add active delivery count per rider
    const mw5ff7 = h4wm.map(i64t3 => i64t3._id);
    const end2f = await nr94.aggregate([{
      $match: {
        "performanceData.assignedBy": {
          $in: mw5ff7
        },
        currentStatus: {
          $in: ["assigned", "picked_up", "in_transit", "out_for_delivery"]
        },
        isActive: true
      }
    }, {
      $group: {
        _id: "$performanceData.assignedBy",
        count: {
          $sum: 1
        }
      }
    }]);
    const p484 = Object.fromEntries(end2f.map(y8d4 => [y8d4._id.toString(), y8d4.count]));
    r8jho.json({
      success: true,
      data: {
        riders: h4wm.map(ikk4hy => ({
          ...ikk4hy,
          activeDeliveries: p484[ikk4hy._id] || 0,
          completionRate: ikk4hy.performanceMetrics.totalDeliveries > 0 ? (ikk4hy.performanceMetrics.completedDeliveries / ikk4hy.performanceMetrics.totalDeliveries * 100).toFixed(1) : "0.0"
        })),
        pagination: {
          currentPage: parseInt(o9bwov),
          totalPages: Math.ceil(kea4j / h332c),
          totalItems: kea4j,
          itemsPerPage: parseInt(h332c),
          hasNext: parseInt(o9bwov) * parseInt(h332c) < kea4j,
          hasPrev: parseInt(o9bwov) > 1
        }
      }
    });
  } catch (yc4av) {
    console.error("List riders error:", yc4av);
    r8jho.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// ============================================================================
// GET /api/riders/:id - Rider profile + performance summary
// ============================================================================
exports.getRider = async (eo77, g7u2) => {
  try {
    const gz3g = {
      _id: eo77.params.id
    };
    lcj3u(eo77, gz3g);
    const zq5c = await wj3o.findOne(gz3g).populate("user", "username email role lastLogin").lean();
    if (!zq5c) {
      return g7u2.status(404).json({
        success: false,
        message: "Rider not found"
      });
    }

    // Calculate recent performance (last 30 days)
    const xu3po = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const o2h0o = await nr94.aggregate([{
      $match: {
        "performanceData.assignedBy": zq5c._id,
        "performanceData.assignedAt": {
          $gte: xu3po
        },
        isActive: true
      }
    }, {
      $group: {
        _id: null,
        total: {
          $sum: 1
        },
        completed: {
          $sum: {
            $cond: [{
              $eq: ["$currentStatus", "delivered"]
            }, 1, 0]
          }
        },
        avgTime: {
          $avg: "$performanceData.totalTransitHours"
        }
      }
    }]);
    const m7h5lp = o2h0o[0] || {
      total: 0,
      completed: 0,
      avgTime: 0
    };
    g7u2.json({
      success: true,
      data: {
        ...zq5c,
        recentPerformance: {
          last30Days: {
            totalDeliveries: m7h5lp.total,
            completed: m7h5lp.completed,
            completionRate: m7h5lp.total > 0 ? (m7h5lp.completed / m7h5lp.total * 100).toFixed(1) : "0.0",
            avgDeliveryHours: m7h5lp.avgTime ? m7h5lp.avgTime.toFixed(1) : null
          }
        },
        licenseStatus: zq5c.licenseExpiry < new Date() ? "Expired" : new Date(zq5c.licenseExpiry) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) ? "Expiring Soon" : "Valid"
      }
    });
  } catch (jde5t) {
    console.error("Get rider error:", jde5t);
    if (jde5t.name === "CastError") {
      return g7u2.status(400).json({
        success: false,
        message: "Invalid rider ID"
      });
    }
    g7u2.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// ============================================================================
// POST /api/riders - Create rider profile
// Replace the existing createRider export in rider.controller.js with this
// ============================================================================
exports.createRider = async (h84xs, ubc1yo) => {
  try {
    const {
      userId: e0zf0h,
      fullName: mn24,
      phone: alcin9,
      email: gtd8wx,
      cnic: pmlp3p,
      licenseNumber: mqr8ip,
      licenseExpiry: uk37b9,
      vehicle: ox5u8t,
      assignedZone: pd3fl,
      serviceCities: s916kv,
      paymentMethod: x1244,
      bankDetails: ra348o,
      // These come from frontend after Step 1 (authAPI.register)
      _loginEmail: w8dlp,
      _loginPassword: qe5qb4,
      _loginUsername: eg65
    } = h84xs.body;

    // Verify user exists and has Rider role
    const x3ym = await l736.findById(e0zf0h);
    if (!x3ym) {
      return ubc1yo.status(404).json({
        success: false,
        message: "User account not found"
      });
    }
    if (x3ym.role !== "Rider") {
      return ubc1yo.status(400).json({
        success: false,
        message: 'User must have "Rider" role'
      });
    }

    // Check for duplicate (only if cnic/licenseNumber provided)
    if (pmlp3p || mqr8ip) {
      const n98o = [];
      if (pmlp3p) n98o.push({
        cnic: pmlp3p
      });
      if (mqr8ip) n98o.push({
        licenseNumber: mqr8ip
      });
      if (n98o.length > 0) {
        const w4kxew = await wj3o.findOne({
          $or: n98o
        });
        if (w4kxew) {
          return ubc1yo.status(409).json({
            success: false,
            message: "Rider with this CNIC or license already exists"
          });
        }
      }
    }
    const h39i = new wj3o({
      user: e0zf0h,
      fullName: mn24.trim(),
      phone: alcin9.trim(),
      email: gtd8wx?.toLowerCase().trim(),
      ...(pmlp3p && {
        cnic: pmlp3p.trim()
      }),
      ...(mqr8ip && {
        licenseNumber: mqr8ip.trim()
      }),
      ...(uk37b9 && {
        licenseExpiry: new Date(uk37b9)
      }),
      vehicle: ox5u8t,
      assignedZone: pd3fl.trim(),
      serviceCities: s916kv?.map(jy83 => jy83.trim()) || [],
      paymentMethod: x1244,
      bankDetails: ra348o,
      // ðŸ” Store login credentials for admin reference
      loginCredentials: {
        email: w8dlp || gtd8wx?.toLowerCase().trim() || x3ym.email,
        password: qe5qb4 || "",
        username: eg65 || x3ym.username,
        generatedAt: new Date(),
        sharedWithRider: false,
        clearedAt: null
      },
      ...(h84xs.tenantId && {
        tenantId: h84xs.tenantId
      })
    });
    await h39i.save();
    gya25l(h84xs.user.userId, "CREATE", h39i._id, {}, h39i.toObject(), "Rider profile created");
    ubc1yo.status(201).json({
      success: true,
      message: "Rider profile created successfully",
      data: h39i.toObject()
    });
  } catch (zg2p3) {
    console.error("Create rider error:", zg2p3);
    if (zg2p3.code === 11000) {
      return ubc1yo.status(409).json({
        success: false,
        message: "CNIC or license number already exists"
      });
    }
    if (zg2p3.name === "ValidationError") {
      return ubc1yo.status(400).json({
        success: false,
        message: "Validation failed",
        errors: Object.values(zg2p3.errors).map(pyj26 => ({
          field: pyj26.path,
          message: pyj26.message
        }))
      });
    }
    ubc1yo.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// ============================================================================
// POST /api/riders/:id/documents â€” Upload rider document to Cloudinary
// ============================================================================
exports.uploadDocument = async (dypea, xe42zz) => {
  try {
    const yqv7 = {
      _id: dypea.params.id
    };
    lcj3u(dypea, yqv7);
    const j13fj4 = await wj3o.findOne(yqv7);
    if (!j13fj4) {
      return xe42zz.status(404).json({
        success: false,
        message: "Rider not found"
      });
    }
    if (!dypea.file) {
      return xe42zz.status(400).json({
        success: false,
        message: "No file uploaded"
      });
    }
    const {
      cloudinary: tzfv
    } = require("../middlewares/upload.middleware");
    const {
      type: a16d
    } = dypea.body; // CNIC | License | VehicleRegistration | Insurance

    const dhuu76 = ["CNIC", "License", "VehicleRegistration", "Insurance"];
    if (!a16d || !dhuu76.includes(a16d)) {
      return xe42zz.status(400).json({
        success: false,
        message: `Document type required. Must be one of: ${dhuu76.join(", ")}`
      });
    }

    // Upload to Cloudinary
    const ghu1 = dypea.file.mimetype === "application/pdf";
    const xlzhz = await new Promise((b90uu1, oer659) => {
      const n4c4 = tzfv.uploader.upload_stream({
        folder: `rider-documents/${j13fj4._id}`,
        resource_type: ghu1 ? "raw" : "image",
        public_id: `${a16d}_${Date.now()}`
      }, (l4a3b, lwcnxc) => {
        if (l4a3b) oer659(l4a3b);else b90uu1(lwcnxc);
      });
      n4c4.end(dypea.file.buffer);
    });

    // Add to rider documents array
    j13fj4.documents.push({
      type: a16d,
      url: xlzhz.secure_url,
      uploadedAt: new Date()
    });
    await j13fj4.save();
    gya25l(dypea.user.userId, "DOCUMENT_UPLOAD", j13fj4._id, {}, {
      type: a16d,
      url: xlzhz.secure_url
    }, `Document uploaded: ${a16d}`);
    xe42zz.status(201).json({
      success: true,
      message: `${a16d} document uploaded successfully`,
      data: {
        document: j13fj4.documents[j13fj4.documents.length - 1],
        totalDocuments: j13fj4.documents.length
      }
    });
  } catch (fwp881) {
    console.error("Upload rider document error:", fwp881);
    xe42zz.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// ============================================================================
// DELETE /api/riders/:id/documents/:docIndex â€” Remove rider document
// ============================================================================
exports.deleteDocument = async (q79o, zgru) => {
  try {
    const z04v = {
      _id: q79o.params.id
    };
    lcj3u(q79o, z04v);
    const cr545 = await wj3o.findOne(z04v);
    if (!cr545) {
      return zgru.status(404).json({
        success: false,
        message: "Rider not found"
      });
    }
    const zxca9 = parseInt(q79o.params.docIndex);
    if (isNaN(zxca9) || zxca9 < 0 || zxca9 >= cr545.documents.length) {
      return zgru.status(400).json({
        success: false,
        message: "Invalid document index"
      });
    }
    const r2y4 = cr545.documents[zxca9];

    // Delete from Cloudinary
    try {
      // deleteDocument mein
      const {
        cloudinary: f2l40
      } = require("../middlewares/upload.middleware");
      const f96b7 = r2y4.url.split("/");
      const p08q = f96b7[f96b7.length - 1];
      const kn4bc = p08q.split(".")[0];
      const ui54rx = `rider-documents/${cr545._id}`;
      const tf90n2 = `${ui54rx}/${kn4bc}`;
      const p947 = r2y4.url.includes("/raw/upload/");
      await f2l40.uploader.destroy(tf90n2, {
        resource_type: p947 ? "raw" : "image"
      });
    } catch (jlc2r) {
      console.warn("Cloudinary delete warning:", jlc2r.message);
      // Continue even if Cloudinary delete fails
    }
    const essf5n = cr545.documents[zxca9];
    cr545.documents.splice(zxca9, 1);
    await cr545.save();
    gya25l(q79o.user.userId, "DOCUMENT_DELETE", cr545._id, {
      document: essf5n
    }, {}, `Document removed: ${essf5n.type}`);
    zgru.json({
      success: true,
      message: "Document removed successfully",
      data: {
        removed: essf5n.url,
        remainingCount: cr545.documents.length
      }
    });
  } catch (i43oa) {
    console.error("Delete rider document error:", i43oa);
    zgru.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// ============================================================================
// PUT /api/riders/:id - Update rider details
// ============================================================================
exports.updateRider = async (v1ti, xyu3) => {
  try {
    const r95b = {
      _id: v1ti.params.id
    };
    lcj3u(v1ti, r95b);
    const aah5 = await wj3o.findOne(r95b);
    if (!aah5) {
      return xyu3.status(404).json({
        success: false,
        message: "Rider not found"
      });
    }
    const r534 = aah5.toObject();

    // Update only provided fields
    const yxj2v = ["fullName", "phone", "email", "licenseNumber", "licenseExpiry", "vehicle", "assignedZone", "serviceCities", "paymentMethod", "bankDetails", "documents", "fcmToken"];
    yxj2v.forEach(oh58 => {
      if (v1ti.body[oh58] !== undefined) {
        if (oh58 === "licenseExpiry") {
          aah5[oh58] = new Date(v1ti.body[oh58]);
        } else if (Array.isArray(v1ti.body[oh58])) {
          aah5[oh58] = v1ti.body[oh58].map(p16y => typeof p16y === "string" ? p16y.trim() : p16y);
        } else if (typeof v1ti.body[oh58] === "string") {
          aah5[oh58] = v1ti.body[oh58].trim();
        } else {
          aah5[oh58] = v1ti.body[oh58];
        }
      }
    });
    aah5.updatedAt = new Date();
    await aah5.save();
    gya25l(v1ti.user.userId, "UPDATE", aah5._id, r534, aah5.toObject());
    xyu3.json({
      success: true,
      message: "Rider details updated successfully",
      data: aah5.toObject()
    });
  } catch (up0ov6) {
    console.error("Update rider error:", up0ov6);
    if (up0ov6.code === 11000) {
      return xyu3.status(409).json({
        success: false,
        message: "CNIC or license number already in use"
      });
    }
    xyu3.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// ============================================================================
// DELETE /api/riders/:id - Deactivate rider (soft delete)
// ============================================================================
exports.deleteRider = async (sij4, oink) => {
  try {
    const phu2 = {
      _id: sij4.params.id
    };
    lcj3u(sij4, phu2);
    const j3m7i = await wj3o.findOne(phu2);
    if (!j3m7i) {
      return oink.status(404).json({
        success: false,
        message: "Rider not found"
      });
    }

    // Check for active deliveries
    const awj658 = await nr94.countDocuments({
      "performanceData.assignedBy": j3m7i._id,
      currentStatus: {
        $in: ["assigned", "picked_up", "in_transit", "out_for_delivery"]
      },
      isActive: true
    });
    if (awj658 > 0) {
      return oink.status(400).json({
        success: false,
        message: `Cannot deactivate rider with ${awj658} active deliveries. Complete or reassign first.`,
        data: {
          activeDeliveries: awj658
        }
      });
    }
    const oj8p = j3m7i.toObject();

    // Soft deactivate: update status and user account
    j3m7i.status = "Inactive";
    j3m7i.isAvailable = false;
    j3m7i.updatedAt = new Date();
    await j3m7i.save();

    // Also deactivate linked user account
    await l736.findByIdAndUpdate(j3m7i.user, {
      status: "Inactive"
    });
    gya25l(sij4.user.userId, "DEACTIVATE", j3m7i._id, oj8p, {
      status: "Inactive"
    }, sij4.body?.reason || "Deactivated by admin");
    oink.json({
      success: true,
      message: "Rider deactivated successfully",
      data: {
        id: j3m7i._id,
        status: "Inactive",
        deactivatedAt: j3m7i.updatedAt
      }
    });
  } catch (dvgo) {
    console.error("Delete rider error:", dvgo);
    oink.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// ============================================================================
// PATCH /api/riders/:id/status - Update rider availability status
// ============================================================================
exports.updateStatus = async (dief, z63u) => {
  try {
    const {
      id: vjw7
    } = dief.params;
    const {
      status: bp8d48,
      reason: uqy8n
    } = dief.body;
    const pm5gd3 = {
      _id: vjw7
    };
    lcj3u(dief, pm5gd3);
    const kk77 = await wj3o.findOne(pm5gd3);
    if (!kk77) {
      return z63u.status(404).json({
        success: false,
        message: "Rider not found"
      });
    }

    // Validate status transition
    const b63g7 = ["Active", "Inactive", "OnDelivery", "OnLeave", "Suspended"];
    if (!b63g7.includes(bp8d48)) {
      return z63u.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${b63g7.join(", ")}`
      });
    }
    const i02a3 = {
      status: kk77.status,
      isAvailable: kk77.isAvailable
    };
    kk77.status = bp8d48;
    kk77.isAvailable = bp8d48 === "Active";
    kk77.updatedAt = new Date();
    if (bp8d48 === "OnDelivery") {
      kk77.lastSeenAt = new Date();
    }
    await kk77.save();
    gya25l(dief.user.userId, "STATUS_CHANGE", vjw7, i02a3, {
      status: bp8d48,
      isAvailable: kk77.isAvailable
    }, uqy8n);

    // ðŸ“¡ Emit real-time update if WebSocket active
    if (global.io) {
      global.io.to(`rider:${vjw7}`).emit("rider:statusUpdated", {
        status: bp8d48,
        isAvailable: kk77.isAvailable,
        updatedAt: kk77.updatedAt
      });
    }
    z63u.json({
      success: true,
      message: `Rider status updated to ${bp8d48}`,
      data: {
        id: kk77._id,
        status: kk77.status,
        isAvailable: kk77.isAvailable,
        updatedAt: kk77.updatedAt
      }
    });
  } catch (pcu0) {
    console.error("Update status error:", pcu0);
    z63u.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// ============================================================================
// GET /api/riders/:id/deliveries - All deliveries assigned to rider
// ============================================================================
exports.getRiderDeliveries = async (mm91vg, cslu4z) => {
  try {
    const {
      id: xatv9
    } = mm91vg.params;
    const {
      page: xxpg3h = 1,
      limit: jz9m = 20,
      status: ikq8i8,
      dateFrom: be75x2,
      dateTo: et7o
    } = mm91vg.query;

    // Verify rider exists
    const jbcl = {
      _id: xatv9
    };
    lcj3u(mm91vg, jbcl);
    const j0we = await wj3o.findOne(jbcl);
    if (!j0we) {
      return cslu4z.status(404).json({
        success: false,
        message: "Rider not found"
      });
    }

    // Build filter for shipments assigned to this rider
    const j45p4i = {
      "performanceData.assignedBy": new mr5ur.Types.ObjectId(xatv9),
      isActive: true
    };
    if (ikq8i8) j45p4i.currentStatus = ikq8i8;
    if (be75x2 || et7o) {
      j45p4i["performanceData.assignedAt"] = {};
      if (be75x2) j45p4i["performanceData.assignedAt"].$gte = new Date(be75x2);
      if (et7o) j45p4i["performanceData.assignedAt"].$lte = new Date(et7o);
    }
    const g8bfb = await nr94.find(j45p4i).populate("orderId", "orderId totalAmount").populate("customer", "name phone").sort({
      "performanceData.assignedAt": -1
    }).limit(parseInt(jz9m)).skip((parseInt(xxpg3h) - 1) * parseInt(jz9m)).lean();
    const tr5hk = await nr94.countDocuments(j45p4i);
    cslu4z.json({
      success: true,
      data: {
        rider: {
          id: j0we._id,
          name: j0we.fullName,
          phone: j0we.phone
        },
        deliveries: g8bfb.map(e172 => ({
          ...e172,
          estimatedDelivery: e172.estimatedDelivery?.toISOString(),
          actualDelivery: e172.actualDelivery?.toISOString()
        })),
        pagination: {
          currentPage: parseInt(xxpg3h),
          totalPages: Math.ceil(tr5hk / jz9m),
          totalItems: tr5hk,
          itemsPerPage: parseInt(jz9m)
        }
      }
    });
  } catch (j7l0c) {
    console.error("Get rider deliveries error:", j7l0c);
    if (j7l0c.name === "CastError") {
      return cslu4z.status(400).json({
        success: false,
        message: "Invalid rider ID"
      });
    }
    cslu4z.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// ============================================================================
// PATCH /api/riders/:id/deliveries/:orderId/status - Update delivery status
// ============================================================================
exports.updateDeliveryStatus = async (d033ny, njz841) => {
  try {
    const {
      id: jsl78,
      orderId: pxkos
    } = d033ny.params;
    const {
      status: s17b3,
      location: a4yr90,
      notes: ws7fj8,
      proofOfDelivery: m629r
    } = d033ny.body;

    // Verify rider exists and is active
    const i5tkfv = {
      _id: jsl78
    };
    lcj3u(d033ny, i5tkfv);
    const y5vzyi = await wj3o.findOne(i5tkfv);
    if (!y5vzyi) {
      return njz841.status(404).json({
        success: false,
        message: "Rider not found"
      });
    }
    if (!["Active", "OnDelivery"].includes(y5vzyi.status)) {
      return njz841.status(400).json({
        success: false,
        message: "Rider must be Active or OnDelivery to update deliveries"
      });
    }

    // Find shipment assigned to this rider
    const o37w7 = await nr94.findOne({
      orderId: new mr5ur.Types.ObjectId(pxkos),
      "performanceData.assignedBy": new mr5ur.Types.ObjectId(jsl78),
      isActive: true
    });
    if (!o37w7) {
      return njz841.status(404).json({
        success: false,
        message: "Delivery not found for this rider"
      });
    }

    // Validate status transition
    const v490 = {
      assigned: ["picked_up", "failed"],
      picked_up: ["in_transit", "failed"],
      in_transit: ["out_for_delivery", "failed"],
      out_for_delivery: ["delivered", "failed", "returned"],
      delivered: [],
      failed: ["assigned"],
      returned: []
    };
    if (!v490[o37w7.currentStatus]?.includes(s17b3)) {
      return njz841.status(400).json({
        success: false,
        message: `Invalid transition: ${o37w7.currentStatus} â†’ ${s17b3}`,
        allowed: v490[o37w7.currentStatus]
      });
    }
    const fy0v = o37w7.toObject();

    // Update shipment status
    o37w7.currentStatus = s17b3;
    o37w7.trackingHistory.push({
      status: s17b3,
      description: ws7fj8 || `Status updated to ${s17b3}`,
      location: a4yr90 || y5vzyi.assignedZone,
      timestamp: new Date(),
      apiSource: "rider_app"
    });

    // Handle status-specific logic
    if (s17b3 === "picked_up") {
      o37w7.performanceData.pickedUpAt = new Date();
    }
    if (s17b3 === "delivered") {
      o37w7.performanceData.deliveredAt = new Date();
      o37w7.actualDelivery = new Date();
      if (m629r) {
        o37w7.trackingHistory[o37w7.trackingHistory.length - 1].metadata = {
          proofOfDelivery: m629r
        };
      }
      // Update rider performance
      y5vzyi.performanceMetrics.totalDeliveries += 1;
      y5vzyi.performanceMetrics.completedDeliveries += 1;
      await y5vzyi.updatePerformance({});
    }
    if (s17b3 === "failed" || s17b3 === "returned") {
      y5vzyi.performanceMetrics.totalDeliveries += 1;
      y5vzyi.performanceMetrics.failedDeliveries += 1;
      if (ws7fj8) {
        o37w7.performanceData.failureReason = ws7fj8;
      }
      await y5vzyi.updatePerformance({});
    }
    o37w7.updatedAt = new Date();
    await o37w7.save();

    // ðŸ“¡ Emit real-time update
    if (global.io) {
      global.io.to(`order:${pxkos}`).emit("order:updated", {
        deliveryStatus: s17b3,
        trackingHistory: o37w7.trackingHistory.slice(-1)[0],
        updatedAt: o37w7.updatedAt
      });
      global.io.to(`rider:${jsl78}`).emit("delivery:statusUpdated", {
        orderId: pxkos,
        status: s17b3,
        timestamp: new Date().toISOString()
      });
    }

    // ðŸ”” Notify customer of major status changes
    if (["delivered", "failed", "out_for_delivery"].includes(s17b3)) {
      const {
        sendCustomerNotification: ex1923
      } = require("../services/cushion.service");
      await ex1923({
        shipment: o37w7,
        type: `status_${s17b3}`,
        customer: o37w7.customer
      });
    }
    gya25l(jsl78, "DELIVERY_UPDATE", o37w7._id, {
      status: fy0v.currentStatus
    }, {
      status: s17b3,
      location: a4yr90,
      notes: ws7fj8
    }, `Delivery ${pxkos} status: ${fy0v.currentStatus} â†’ ${s17b3}`);
    njz841.json({
      success: true,
      message: `Delivery status updated to ${s17b3}`,
      data: {
        shipmentId: o37w7._id,
        orderId: o37w7.orderId,
        currentStatus: o37w7.currentStatus,
        trackingHistory: o37w7.trackingHistory.slice(-3),
        updatedAt: o37w7.updatedAt
      }
    });
  } catch (x7o3g4) {
    console.error("Update delivery status error:", x7o3g4);
    njz841.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// ============================================================================
// GET /api/riders/analytics/performance - Completion rate, delays, daily stats
// ============================================================================
exports.getPerformanceAnalytics = async (w27v, b9ijop) => {
  try {
    const {
      dateFrom: zqr3d0,
      dateTo: cw42,
      groupBy: ub24k = "rider",
      zone: o49961
    } = w27v.query;
    const ae3z81 = {};
    if (zqr3d0 || cw42) {
      ae3z81["performanceData.assignedAt"] = {};
      if (zqr3d0) ae3z81["performanceData.assignedAt"].$gte = new Date(zqr3d0);
      if (cw42) ae3z81["performanceData.assignedAt"].$lte = new Date(cw42);
    }
    if (o49961) ae3z81.assignedZone = o49961;

    // Per-rider breakdown
    const ef3rm = {
      ...ae3z81
    };
    lcj3u(w27v, ef3rm);
    const fftez = await wj3o.aggregate([{
      $match: ef3rm
    }, {
      $lookup: {
        from: "shipments",
        let: {
          riderId: "$_id"
        },
        pipeline: [{
          $match: {
            $expr: {
              $eq: ["$performanceData.assignedBy", "$$riderId"]
            },
            isActive: true,
            ...ae3z81
          }
        }, {
          $group: {
            _id: null,
            total: {
              $sum: 1
            },
            completed: {
              $sum: {
                $cond: [{
                  $eq: ["$currentStatus", "delivered"]
                }, 1, 0]
              }
            },
            failed: {
              $sum: {
                $cond: [{
                  $eq: ["$currentStatus", "failed"]
                }, 1, 0]
              }
            },
            avgTransitHours: {
              $avg: "$performanceData.totalTransitHours"
            }
          }
        }],
        as: "shipmentStats"
      }
    }, {
      $project: {
        _id: 1,
        fullName: 1,
        phone: 1,
        assignedZone: 1,
        status: 1,
        isAvailable: 1,
        totalDeliveries: {
          $arrayElemAt: ["$shipmentStats.total", 0]
        },
        completedDeliveries: {
          $arrayElemAt: ["$shipmentStats.completed", 0]
        },
        failedDeliveries: {
          $arrayElemAt: ["$shipmentStats.failed", 0]
        },
        avgTransitHours: {
          $arrayElemAt: ["$shipmentStats.avgTransitHours", 0]
        },
        completionRate: {
          $cond: [{
            $gt: [{
              $arrayElemAt: ["$shipmentStats.total", 0]
            }, 0]
          }, {
            $round: [{
              $multiply: [{
                $divide: [{
                  $arrayElemAt: ["$shipmentStats.completed", 0]
                }, {
                  $arrayElemAt: ["$shipmentStats.total", 0]
                }]
              }, 100]
            }, 1]
          }, 0]
        }
      }
    }, {
      $sort: {
        completionRate: -1
      }
    }]);

    // Overall KPIs
    const pi800 = {
      "performanceData.assignedBy": {
        $exists: true
      },
      isActive: true,
      ...ae3z81
    };
    lcj3u(w27v, pi800);
    const d5d5o5 = await nr94.aggregate([{
      $match: pi800
    }, {
      $group: {
        _id: null,
        totalShipments: {
          $sum: 1
        },
        completed: {
          $sum: {
            $cond: [{
              $eq: ["$currentStatus", "delivered"]
            }, 1, 0]
          }
        },
        failed: {
          $sum: {
            $cond: [{
              $eq: ["$currentStatus", "failed"]
            }, 1, 0]
          }
        },
        avgTransitHours: {
          $avg: "$performanceData.totalTransitHours"
        }
      }
    }]);

    // Daily timeline for chart
    let hj54r = [];
    if (ub24k === "day") {
      hj54r = await nr94.aggregate([{
        $match: {
          "performanceData.assignedBy": {
            $exists: true
          },
          isActive: true,
          ...ae3z81
        }
      }, {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$performanceData.assignedAt"
            }
          },
          total: {
            $sum: 1
          },
          completed: {
            $sum: {
              $cond: [{
                $eq: ["$currentStatus", "delivered"]
              }, 1, 0]
            }
          }
        }
      }, {
        $project: {
          date: "$_id",
          total: 1,
          completed: 1,
          completionRate: {
            $cond: [{
              $gt: ["$total", 0]
            }, {
              $round: [{
                $multiply: [{
                  $divide: ["$completed", "$total"]
                }, 100]
              }, 1]
            }, 0]
          }
        }
      }, {
        $sort: {
          date: 1
        }
      }]);
    }
    const syv3j = d5d5o5[0] || {
      totalShipments: 0,
      completed: 0,
      failed: 0,
      avgTransitHours: 0
    };
    b9ijop.json({
      success: true,
      data: {
        kpis: {
          totalRiders: fftez.length,
          activeRiders: fftez.filter(j7ru => j7ru.isAvailable).length,
          totalDeliveries: syv3j.totalShipments,
          overallCompletionRate: syv3j.totalShipments > 0 ? (syv3j.completed / syv3j.totalShipments * 100).toFixed(1) : "0.0",
          avgTransitHours: syv3j.avgTransitHours ? syv3j.avgTransitHours.toFixed(1) : null
        },
        byRider: fftez.map(cnq5v => ({
          id: cnq5v._id,
          name: cnq5v.fullName,
          phone: cnq5v.phone,
          zone: cnq5v.assignedZone,
          status: cnq5v.status,
          isAvailable: cnq5v.isAvailable,
          totalDeliveries: cnq5v.totalDeliveries || 0,
          completedDeliveries: cnq5v.completedDeliveries || 0,
          failedDeliveries: cnq5v.failedDeliveries || 0,
          completionRate: cnq5v.completionRate || "0.0",
          avgTransitHours: cnq5v.avgTransitHours ? cnq5v.avgTransitHours.toFixed(1) : null
        })),
        timeline: hj54r,
        generatedAt: new Date().toISOString(),
        period: {
          from: zqr3d0 || null,
          to: cw42 || null,
          groupBy: ub24k
        }
      }
    });
  } catch (hezlq) {
    console.error("Rider performance analytics error:", hezlq);
    b9ijop.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};