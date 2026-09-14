const bb3eg = require("../models/Wallpaper")
const nbs3s = require("../models/Brooklyn")
const s9bf = require("../models/AuditLog");
const {
  encrypt: p3gx2k,
  decrypt: dkkp
} = require("../utils/encryption");
const {
  sendCourierNotification: t08m9
} = require("../services/cushion.service")
const {
  mockCourierApiClient: y4413
} = require("../services/wallpaper.api.service")
const pl847 = require("mongoose");
const {
  applyTenantScope: ih4g28,
  withTenant: iks9
} = require("../utils/kyotoScope")

// helper log courier actions
const oa16 = async (nrgo, yo8mb, xi659, e32x, ne9csq, fj3617 = "") => {
  try {
    await s9bf.create({
      userId: nrgo,
      action: yo8mb,
      collectionName: "couriers",
      documentId: xi659,
      oldValue: e32x,
      newValue: ne9csq,
      ipAddress: "",
      userAgent: "",
      reason: fj3617
    });
  } catch (k6k9h) {
    console.warn("âš ï¸ Audit log failed:", k6k9h.message);
  }
};

// helper for safe response
const gy82 = (edoh2p, q2hr32 = false) => {
  const aey1 = edoh2p.toObject ? edoh2p.toObject() : edoh2p;
  return {
    ...aey1,
    apiKey: q2hr32 && aey1.apiKey ? dkkp(aey1.apiKey) : "â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢",
    apiSecret: q2hr32 && aey1.apiSecret ? dkkp(aey1.apiSecret) : "â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
  };
};

/**
 * GET /api/couriers - List couriers (FR-015/016/018)
 */
exports.listCouriers = async (t50660, jco9q) => {
  try {
    const {
      page: lt3qfa = 1,
      limit: euz9 = 20,
      region: cpof0,
      apiEnabled: ft1m8,
      performance: w8x5,
      status: p9496d
    } = t50660.query;
    const h90kn = {
      isActive: true
    };
    ih4g28(t50660, h90kn);
    if (p9496d) h90kn.status = p9496d;
    if (cpof0) h90kn.serviceRegions = {
      $in: [new RegExp(cpof0, "i")]
    };
    if (ft1m8 === "true") h90kn.apiIntegrationEnabled = true;
    if (ft1m8 === "false") h90kn.apiIntegrationEnabled = false;
    if (w8x5 === "high") h90kn["performanceMetrics.completionRate"] = {
      $gte: 90
    };
    if (w8x5 === "low") h90kn["performanceMetrics.completionRate"] = {
      $lt: 80
    };
    const f6sk9 = await bb3eg.find(h90kn).select("-apiKey -apiSecret -__v").sort({
      name: 1
    }).limit(parseInt(euz9)).skip((parseInt(lt3qfa) - 1) * parseInt(euz9)).lean();

    // Calculate live shipment counts per courier (for KPI cards)
    const x2z2t = f6sk9.map(m477 => m477._id);
    const vmk7 = await nbs3s.aggregate([{
      $match: {
        courier: {
          $in: x2z2t
        },
        isActive: true
      }
    }, {
      $group: {
        _id: "$courier",
        active: {
          $sum: {
            $cond: [{
              $not: [{
                $in: ["$currentStatus", ["delivered", "failed", "returned"]]
              }]
            }, 1, 0]
          }
        },
        inTransit: {
          $sum: {
            $cond: [{
              $eq: ["$currentStatus", "in_transit"]
            }, 1, 0]
          }
        },
        deliveredToday: {
          $sum: {
            $cond: [{
              $and: [{
                $eq: ["$currentStatus", "delivered"]
              }, {
                $gte: ["$performanceData.deliveredAt", new Date(new Date().setHours(0, 0, 0, 0))]
              }]
            }, 1, 0]
          }
        }
      }
    }]);
    const dsaalk = Object.fromEntries(vmk7.map(ca7z07 => [ca7z07._id.toString(), ca7z07]));
    const ujyw = f6sk9.map(mv8o => ({
      ...mv8o,
      activeShipments: dsaalk[mv8o._id]?.active || 0,
      inTransit: dsaalk[mv8o._id]?.inTransit || 0,
      deliveredToday: dsaalk[mv8o._id]?.deliveredToday || 0,
      completionRate: mv8o.performanceMetrics?.totalDeliveries > 0 ? (mv8o.performanceMetrics.onTimeDeliveries / mv8o.performanceMetrics.totalDeliveries * 100).toFixed(1) : "0.0"
    }));
    const g2iob8 = await bb3eg.countDocuments(h90kn);
    jco9q.json({
      success: true,
      data: {
        couriers: ujyw,
        pagination: {
          currentPage: parseInt(lt3qfa),
          totalPages: Math.ceil(g2iob8 / euz9),
          totalItems: g2iob8,
          itemsPerPage: parseInt(euz9)
        }
      }
    });
  } catch (zm570) {
    console.error("List couriers error:", zm570);
    jco9q.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

/**
 * POST /api/couriers/:id/test-connection - FR-016 API Test
 */
exports.testConnection = async (g59q, l5epn6) => {
  try {
    const dsl8hb = {
      _id: g59q.params.id
    };
    ih4g28(g59q, dsl8hb);
    const gb9sz = await bb3eg.findOne(dsl8hb);
    if (!gb9sz) return l5epn6.status(404).json({
      success: false,
      message: "Courier not found"
    });
    if (!gb9sz.apiIntegrationEnabled || !gb9sz.apiKey) {
      return l5epn6.status(400).json({
        success: false,
        message: "API integration is not enabled or credentials missing"
      });
    }

    // ðŸ” MOCK API CALL (Replace with real SDK in production)
    const t52x0 = await y4413.testConnection({
      endpoint: gb9sz.apiEndpoint,
      apiKey: dkkp(gb9sz.apiKey),
      apiSecret: dkkp(gb9sz.apiSecret)
    });

    // Update API status based on test result
    if (t52x0.success) {
      gb9sz.apiStatus = "live";
      gb9sz.lastSyncAt = new Date();
      await gb9sz.save();
    } else {
      gb9sz.apiStatus = t52x0.partial ? "partial" : "offline";
      await gb9sz.save();
    }
    l5epn6.json({
      success: true,
      message: t52x0.success ? "API connection successful" : "API connection failed",
      data: {
        ...t52x0,
        apiStatus: gb9sz.apiStatus,
        lastTestedAt: new Date().toISOString()
      }
    });
  } catch (jay25) {
    console.error("Test connection error:", jay25);
    l5epn6.status(500).json({
      success: false,
      message: "API test failed",
      error: jay25.message
    });
  }
};

/**
 * POST /api/couriers/:id/sync - FR-016/017 Manual Sync Trigger
 */
exports.syncCourier = async (qxj85k, y74l) => {
  try {
    const ukh4 = {
      _id: qxj85k.params.id
    };
    ih4g28(qxj85k, ukh4);
    const c3nze = await bb3eg.findOne(ukh4);
    if (!c3nze) return y74l.status(404).json({
      success: false,
      message: "Courier not found"
    });
    if (!c3nze.apiIntegrationEnabled) return y74l.status(400).json({
      success: false,
      message: "API integration not enabled"
    });

    // ðŸ” MOCK SYNC (Replace with real polling/webhook logic)
    const vrw308 = await y4413.syncShipments({
      courierId: c3nze._id,
      apiKey: dkkp(c3nze.apiKey),
      since: c3nze.lastSyncAt || new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24h
    });

    // Update last sync time
    c3nze.lastSyncAt = new Date();
    await c3nze.save();

    // ðŸ“¡ Emit real-time updates via WebSocket (FR-017)
    if (global.io && vrw308.updatedShipments?.length) {
      vrw308.updatedShipments.forEach(vzc7 => {
        global.io.to(`shipment:${vzc7.shipmentId}`).emit("tracking:update", {
          status: vzc7.newStatus,
          description: vzc7.description,
          timestamp: new Date().toISOString()
        });
      });
    }
    oa16(qxj85k.user.userId, "SYNC", c3nze._id, {
      lastSyncAt: c3nze.lastSyncAt
    }, {
      lastSyncAt: new Date(),
      syncedCount: vrw308.updatedShipments?.length || 0
    });
    y74l.json({
      success: true,
      message: `Sync completed: ${vrw308.updatedShipments?.length || 0} shipments updated`,
      data: {
        syncedCount: vrw308.updatedShipments?.length || 0,
        failedCount: vrw308.failedUpdates?.length || 0,
        lastSyncAt: c3nze.lastSyncAt.toISOString(),
        nextAutoSync: new Date(Date.now() + c3nze.syncIntervalMinutes * 60 * 1000).toISOString()
      }
    });
  } catch (dftqu) {
    console.error("Sync courier error:", dftqu);
    y74l.status(500).json({
      success: false,
      message: "Sync failed",
      error: dftqu.message
    });
  }
};

/**
 * POST /api/couriers/:id/assign - FR-015: Assign Shipment + Notify Courier
 */
exports.assignShipment = async (yg2vg2, vjd1rp) => {
  const ouci = await pl847.startSession();
  try {
    ouci.startTransaction();
    const {
      orderId: mj0c75,
      serviceType: g434,
      specialInstructions: y254,
      codAmount: hh258,
      dispatchDate: d778,
      weight: kt5x6
    } = yg2vg2.body;
    const a2i9ux = yg2vg2.params.id;

    // 1. Validate order exists and is pending
    const mi4j = require("../models/Sofa");
    const v7v13 = await mi4j.findById(mj0c75).session(ouci);
    if (!v7v13) throw new Error("Order not found");
    if (v7v13.orderStatus !== "Packed") {
      throw new Error('Order must be in "Packed" status before courier assignment');
    }

    // 2. Get courier & validate capacity
    const kpmr6u = await bb3eg.findById(a2i9ux).session(ouci);
    if (!kpmr6u || !kpmr6u.isActive) throw new Error("Courier not available");

    // Check daily assignment limit (FR-015 rule)
    const n1ct = new Date().setHours(0, 0, 0, 0);
    const x5dc2j = await nbs3s.countDocuments({
      courier: a2i9ux,
      isActive: true,
      "performanceData.assignedAt": {
        $gte: new Date(n1ct)
      }
    }).session(ouci);
    if (x5dc2j >= kpmr6u.assignmentRules.maxDailyAssignments) {
      throw new Error(`Courier ${kpmr6u.name} has reached daily assignment limit (${kpmr6u.assignmentRules.maxDailyAssignments})`);
    }

    // 3. Generate tracking number (courier-specific format)
    const k2ft = `${kpmr6u.name.toUpperCase().slice(0, 3)}-${Date.now()}-${Math.floor(Math.random() * 9000) + 1000}`;

    // 4. Create shipment record
    const n7g42j = new nbs3s({
      orderId: v7v13._id,
      orderReference: v7v13.orderId,
      customer: {
        name: v7v13.shippingAddress?.name || v7v13.customer?.fullName || "Customer",
        phone: v7v13.shippingAddress?.phone || v7v13.customer?.phone || "",
        email: v7v13.customer?.email
      },
      shippingAddress: v7v13.shippingAddress,
      packageDetails: {
        weight: kt5x6 ? Number(kt5x6) : v7v13.items?.reduce((hpr1, qy2d) => hpr1 + qy2d.quantity * 0.5, 0) || 0,
        declaredValue: v7v13.totalAmount,
        codAmount: hh258 ? Number(hh258) : 0,
        dispatchDate: d778 ? new Date(d778) : new Date()
      },
      courier: kpmr6u._id,
      courierName: kpmr6u.name,
      trackingNumber: k2ft,
      serviceType: g434 || "Standard",
      currentStatus: "assigned",
      trackingHistory: [{
        status: "assigned",
        description: `Assigned to ${kpmr6u.name} via NEXUS`,
        apiSource: "manual"
      }],
      estimatedDelivery: new Date(Date.now() + (g434 === "Same Day" ? 8 : g434 === "Express" ? 48 : 120) * 60 * 60 * 1000),
      notifications: {
        courierNotified: false,
        // Will be set after notification sent
        customerNotified: false
      },
      performanceData: {
        assignedAt: new Date()
      },
      assignedBy: yg2vg2.user.userId,
      assignmentMethod: "manual",
      specialInstructions: y254,
      ...(yg2vg2.tenantId && {
        tenantId: yg2vg2.tenantId
      })
    });
    await n7g42j.save({
      session: ouci
    });

    // 5. Update order status
    v7v13.orderStatus = "Shipped";
    v7v13.courier = kpmr6u._id;
    v7v13.trackingNumber = k2ft;
    await v7v13.save({
      session: ouci
    });

    // 6. ðŸ”” Send notification to courier (FR-015)
    const b822w = await t08m9({
      courier: kpmr6u,
      shipment: n7g42j,
      order: v7v13,
      type: "assignment"
    });
    n7g42j.notifications.courierNotified = b822w.success;
    n7g42j.notifications.courierNotifiedAt = b822w.success ? new Date() : null;
    await n7g42j.save({
      session: ouci
    });
    await ouci.commitTransaction();

    // ðŸ“¡ Emit real-time update (FR-017)
    if (global.io) {
      global.io.to(`order:${v7v13._id}`).emit("order:updated", {
        status: "Shipped",
        trackingNumber: k2ft,
        courier: kpmr6u.name
      });
      global.io.to(`courier:${kpmr6u._id}`).emit("shipment:assigned", {
        shipmentId: n7g42j._id,
        trackingNumber: k2ft,
        customer: n7g42j.customer.name,
        city: n7g42j.shippingAddress.city
      });
    }
    oa16(yg2vg2.user.userId, "ASSIGN", a2i9ux, {}, {
      shipmentId: n7g42j._id,
      trackingNumber: k2ft,
      notified: b822w.success
    });
    vjd1rp.status(201).json({
      success: true,
      message: `Shipment assigned to ${kpmr6u.name} â€” ${b822w.success ? "Courier notified" : "Notification pending"}`,
      data: {
        shipmentId: n7g42j._id,
        trackingNumber: n7g42j.trackingNumber,
        courier: kpmr6u.name,
        estimatedDelivery: n7g42j.estimatedDelivery,
        notificationStatus: b822w
      }
    });
  } catch (a6w0j) {
    await ouci.abortTransaction();
    console.error("Assign shipment error:", a6w0j);
    if (a6w0j.message.includes("not found") || a6w0j.message.includes("limit")) {
      return vjd1rp.status(400).json({
        success: false,
        message: a6w0j.message
      });
    }
    vjd1rp.status(500).json({
      success: false,
      message: "Assignment failed",
      error: a6w0j.message
    });
  } finally {
    ouci.endSession();
  }
};

/**
 * GET /api/couriers/analytics/performance - FR-018 Dashboard Report
 */
exports.getPerformanceAnalytics = async (m0vrs, ht0gmn) => {
  try {
    const {
      dateFrom: gxjut2,
      dateTo: znp68e,
      groupBy: j5y3 = "courier"
    } = m0vrs.query;
    const lj4b = {};
    if (gxjut2) lj4b["performanceData.assignedAt"] = {
      $gte: new Date(gxjut2)
    };
    if (znp68e) lj4b["performanceData.assignedAt"] = {
      ...lj4b["performanceData.assignedAt"],
      $lte: new Date(znp68e)
    };

    // Aggregate by courier
    const vksmwk = await nbs3s.aggregate([{
      $match: {
        ...lj4b,
        isActive: true
      }
    }, {
      $lookup: {
        from: "couriers",
        localField: "courier",
        foreignField: "_id",
        as: "courierInfo"
      }
    }, {
      $unwind: "$courierInfo"
    }, {
      $group: {
        _id: "$courier",
        courierName: {
          $first: "$courierInfo.name"
        },
        total: {
          $sum: 1
        },
        delivered: {
          $sum: {
            $cond: [{
              $eq: ["$currentStatus", "delivered"]
            }, 1, 0]
          }
        },
        onTime: {
          $sum: {
            $cond: [{
              $eq: ["$performanceData.wasOnTime", true]
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
    }, {
      $project: {
        courierName: 1,
        total: 1,
        delivered: 1,
        completionRate: {
          $cond: [{
            $gt: ["$total", 0]
          }, {
            $round: [{
              $multiply: [{
                $divide: ["$delivered", "$total"]
              }, 100]
            }, 1]
          }, 0]
        },
        onTimeRate: {
          $cond: [{
            $gt: ["$delivered", 0]
          }, {
            $round: [{
              $multiply: [{
                $divide: ["$onTime", "$delivered"]
              }, 100]
            }, 1]
          }, 0]
        },
        failed: 1,
        avgTransitHours: {
          $round: ["$avgTransitHours", 1]
        }
      }
    }, {
      $sort: {
        completionRate: -1
      }
    }]);

    // Overall KPIs
    const f2s0 = await nbs3s.aggregate([{
      $match: lj4b
    }, {
      $group: {
        _id: null,
        totalShipments: {
          $sum: 1
        },
        delivered: {
          $sum: {
            $cond: [{
              $eq: ["$currentStatus", "delivered"]
            }, 1, 0]
          }
        },
        avgCompletion: {
          $avg: {
            $cond: [{
              $eq: ["$performanceData.wasOnTime", true]
            }, 100, 0]
          }
        }
      }
    }]);

    // Timeline data for chart (group by day/week)
    let u8uf = [];
    if (j5y3 === "day" || j5y3 === "week") {
      const sy8zxm = j5y3 === "day" ? {
        $dateToString: {
          format: "%Y-%m-%d",
          date: "$performanceData.assignedAt"
        }
      } : {
        $dateToString: {
          format: "%Y-%U",
          date: "$performanceData.assignedAt"
        }
      };
      u8uf = await nbs3s.aggregate([{
        $match: lj4b
      }, {
        $group: {
          _id: sy8zxm,
          total: {
            $sum: 1
          },
          delivered: {
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
          delivered: 1,
          completionRate: {
            $cond: [{
              $gt: ["$total", 0]
            }, {
              $round: [{
                $multiply: [{
                  $divide: ["$delivered", "$total"]
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
    const sa6n = f2s0[0] || {
      totalShipments: 0,
      delivered: 0,
      avgCompletion: 0
    };
    ht0gmn.json({
      success: true,
      data: {
        byCourier: vksmwk,
        overallKPIs: {
          totalShipments: sa6n.totalShipments,
          delivered: sa6n.delivered,
          overallCompletionRate: sa6n.avgCompletion.toFixed(1),
          avgTransitTime: "2.4 days" // Could calculate from shipment data
        },
        timeline: u8uf,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (d78v3) {
    console.error("Performance analytics error:", d78v3);
    ht0gmn.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

/**
 * GET /api/couriers/:id - Details + performance metrics
 */
exports.getCourier = async (h72f0u, y8fc6) => {
  try {
    const cwgxgq = {
      _id: h72f0u.params.id
    };
    ih4g28(h72f0u, cwgxgq);
    const c1i7 = await bb3eg.findOne(cwgxgq);
    if (!c1i7) return y8fc6.status(404).json({
      success: false,
      message: "Courier not found"
    });
    y8fc6.json({
      success: true,
      data: gy82(c1i7, h72f0u.user.role === "Administrator")
    });
  } catch (y0x1) {
    console.error("Get courier error:", y0x1);
    if (y0x1.name === "CastError") return y8fc6.status(400).json({
      success: false,
      message: "Invalid courier ID"
    });
    y8fc6.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

/**
 * POST /api/couriers - Create + encrypt credentials
 */
exports.createCourier = async (xpk06, y6zw) => {
  try {
    const {
      name: mk83a,
      contactPerson: l9yb0b,
      email: x1380w,
      phone: kw0a,
      serviceRegions: d69m1e,
      apiIntegrationEnabled: f6o96,
      apiKey: e0fr4,
      apiSecret: lbrwp9
    } = xpk06.body;

    // Encrypt API keys if provided
    const as394 = {
      name: mk83a.trim(),
      contactPerson: l9yb0b.trim(),
      email: x1380w.toLowerCase().trim(),
      phone: kw0a.trim(),
      serviceRegions: d69m1e?.map(ry91vq => ry91vq.trim()) || [],
      apiIntegrationEnabled: !!f6o96,
      isActive: true,
      ...(xpk06.tenantId && {
        tenantId: xpk06.tenantId
      })
    };

    // In createCourier function - UPDATED encryption logic:
    if (f6o96 && e0fr4 && e0fr4.trim().length > 0) {
      as394.apiKey = p3gx2k(e0fr4.trim());
    }
    if (f6o96 && lbrwp9 && lbrwp9.trim().length > 0) {
      as394.apiSecret = p3gx2k(lbrwp9.trim());
    }
    const t86c = new bb3eg(as394);
    await t86c.save();
    oa16(xpk06.user.userId, "CREATE", t86c._id, {}, t86c.toObject());
    y6zw.status(201).json({
      success: true,
      message: "Courier registered successfully",
      data: gy82(t86c)
    });
  } catch (b22j5) {
    console.error("Create courier error:", b22j5);
    if (b22j5.code === 11000) return y6zw.status(409).json({
      success: false,
      message: "Courier name or email already exists"
    });
    if (b22j5.name === "ValidationError") return y6zw.status(400).json({
      success: false,
      message: "Validation failed",
      errors: Object.values(b22j5.errors).map(rj1z => ({
        field: rj1z.path,
        message: rj1z.message
      }))
    });
    y6zw.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

/**
 * PUT /api/couriers/:id - Update details
 */
exports.updateCourier = async (rd81, y6jv) => {
  try {
    const cen4k = {
      _id: rd81.params.id
    };
    ih4g28(rd81, cen4k);
    const m4p7 = await bb3eg.findOne(cen4k);
    if (!m4p7) return y6jv.status(404).json({
      success: false,
      message: "Courier not found"
    });
    const npof = m4p7.toObject();
    if (rd81.body.name !== undefined) m4p7.name = rd81.body.name.trim();
    if (rd81.body.contactPerson !== undefined) m4p7.contactPerson = rd81.body.contactPerson.trim();
    if (rd81.body.email !== undefined) m4p7.email = rd81.body.email.toLowerCase().trim();
    if (rd81.body.phone !== undefined) m4p7.phone = rd81.body.phone.trim();
    if (rd81.body.serviceRegions !== undefined) m4p7.serviceRegions = rd81.body.serviceRegions.map(pl61t => pl61t.trim());
    if (rd81.body.apiIntegrationEnabled !== undefined) m4p7.apiIntegrationEnabled = rd81.body.apiIntegrationEnabled;
    if (rd81.body.apiKey !== undefined) m4p7.apiKey = rd81.body.apiKey ? p3gx2k(rd81.body.apiKey) : null;
    if (rd81.body.apiSecret !== undefined) m4p7.apiSecret = rd81.body.apiSecret ? p3gx2k(rd81.body.apiSecret) : null;
    if (rd81.body.status !== undefined) m4p7.status = rd81.body.status;
    m4p7.updatedAt = new Date();
    await m4p7.save();
    oa16(rd81.user.userId, "UPDATE", m4p7._id, npof, m4p7.toObject());
    y6jv.json({
      success: true,
      message: "Courier updated successfully",
      data: gy82(m4p7)
    });
  } catch (jmak) {
    console.error("Update courier error:", jmak);
    if (jmak.code === 11000) return y6jv.status(409).json({
      success: false,
      message: "Courier name or email already exists"
    });
    y6jv.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

/**
 * POST /api/couriers/:id/test-connection - Validate API integration
 */
exports.testConnection = async (d2737s, ys3ih) => {
  try {
    const d3ib7 = {
      _id: d2737s.params.id
    };
    ih4g28(d2737s, d3ib7);
    const wv2gio = await bb3eg.findOne(d3ib7);
    if (!wv2gio) return ys3ih.status(404).json({
      success: false,
      message: "Courier not found"
    });
    if (!wv2gio.apiIntegrationEnabled || !wv2gio.apiKey) {
      return ys3ih.status(400).json({
        success: false,
        message: "API integration is not enabled or credentials missing"
      });
    }

    // ðŸ” MOCK API CALL (Replace with actual courier SDK/HTTP request)
    const efr6f = {
      status: 200,
      message: "Connection successful",
      endpoint: `https://api.courier.example.com/v1/health`,
      timestamp: new Date().toISOString()
    };

    // In production: await fetch(mockResponse.endpoint, { headers: { 'X-API-KEY': decrypt(courier.apiKey) } })

    ys3ih.json({
      success: true,
      message: "Courier API connection test passed",
      mockResponse: efr6f
    });
  } catch (x5a54) {
    console.error("Test connection error:", x5a54);
    ys3ih.status(500).json({
      success: false,
      message: "API connection test failed",
      error: x5a54.message
    });
  }
};

/**
 * GET /api/couriers/analytics/performance - Dashboard KPIs
 */
exports.getPerformanceAnalytics = async (b3xzy5, qvn29) => {
  try {
    const clcq4 = {
      isActive: true
    };
    ih4g28(b3xzy5, clcq4);
    const dj9f55 = await bb3eg.find(clcq4).lean();

    // Calculate aggregate KPIs
    const urwggr = dj9f55.map(kj9l => ({
      id: kj9l._id,
      name: kj9l.name,
      totalDeliveries: kj9l.performanceMetrics?.totalDeliveries || 0,
      successfulDeliveries: kj9l.performanceMetrics?.onTimeDeliveries || 0,
      successRate: kj9l.performanceMetrics?.totalDeliveries > 0 ? (kj9l.performanceMetrics.onTimeDeliveries / kj9l.performanceMetrics.totalDeliveries * 100).toFixed(1) : "0.0",
      avgDeliveryTime: kj9l.performanceMetrics?.averageDeliveryTime || 0,
      cancellationRate: kj9l.performanceMetrics?.cancellationRate || 0,
      apiEnabled: kj9l.apiIntegrationEnabled,
      serviceRegions: kj9l.serviceRegions
    }));

    // Sort by performance
    urwggr.sort((ra3o9, c1u9) => parseFloat(c1u9.successRate) - parseFloat(ra3o9.successRate));
    const n76fz5 = {
      totalCouriers: dj9f55.length,
      apiIntegrated: dj9f55.filter(p199 => p199.apiIntegrationEnabled).length,
      avgSuccessRate: urwggr.length > 0 ? (urwggr.reduce((rj7jv, t63y74) => rj7jv + parseFloat(t63y74.successRate), 0) / urwggr.length).toFixed(1) : 0,
      avgCancellationRate: urwggr.length > 0 ? (urwggr.reduce((bsi40, b2de71) => bsi40 + parseFloat(b2de71.cancellationRate), 0) / urwggr.length).toFixed(1) : 0
    };
    qvn29.json({
      success: true,
      data: {
        couriers: urwggr,
        overallKPIs: n76fz5,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (pdq2c) {
    console.error("Performance analytics error:", pdq2c);
    qvn29.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

/**
 * POST /api/couriers/:id/sync - Trigger status sync (Option 2)
 */
exports.syncCourier = async (wx60, edj0p) => {
  try {
    const do34bm = {
      _id: wx60.params.id
    };
    ih4g28(wx60, do34bm);
    const ucp9 = await bb3eg.findOne(do34bm);
    if (!ucp9) return edj0p.status(404).json({
      success: false,
      message: "Courier not found"
    });
    if (!ucp9.apiIntegrationEnabled) return edj0p.status(400).json({
      success: false,
      message: "API integration not enabled"
    });

    // ðŸ” MOCK SYNC TRIGGER (Replace with actual webhook/polling logic)
    const egztv8 = {
      status: "synced",
      syncedOrders: 12,
      failedUpdates: 0,
      lastSyncAt: new Date().toISOString()
    };
    oa16(wx60.user.userId, "SYNC", ucp9._id, {}, {
      lastSyncAt: egztv8.lastSyncAt
    }, "Manual sync triggered");
    edj0p.json({
      success: true,
      message: "Courier status sync completed",
      syncResult: egztv8
    });
  } catch (g3y1pf) {
    console.error("Sync courier error:", g3y1pf);
    edj0p.status(500).json({
      success: false,
      message: "Sync failed",
      error: g3y1pf.message
    });
  }
};

/**
 * DELETE /api/couriers/:id - Soft deactivate
 */
exports.deleteCourier = async (py4lt, ul98he) => {
  try {
    const dql2 = {
      _id: py4lt.params.id
    };
    ih4g28(py4lt, dql2);
    const u6rv = await bb3eg.findOne(dql2);
    if (!u6rv) return ul98he.status(404).json({
      success: false,
      message: "Courier not found"
    });
    if (!u6rv.isActive) return ul98he.status(400).json({
      success: false,
      message: "Courier is already deactivated"
    });
    const b91154 = u6rv.toObject();
    u6rv.isActive = false;
    u6rv.apiIntegrationEnabled = false;
    u6rv.updatedAt = new Date();
    await u6rv.save();
    oa16(py4lt.user.userId, "DEACTIVATE", u6rv._id, b91154, {
      isActive: false
    }, py4lt.body.reason || "Deactivated by admin");
    ul98he.json({
      success: true,
      message: "Courier deactivated successfully",
      data: {
        id: u6rv._id,
        name: u6rv.name,
        status: "Inactive",
        deactivatedAt: u6rv.updatedAt
      }
    });
  } catch (x0n1) {
    console.error("Delete courier error:", x0n1);
    ul98he.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};