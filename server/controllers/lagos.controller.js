// CRUD_Project/server/controllers/trackingmore.controller.js

const hl0210 = require("../services/lagos.service")
const qb5s4 = require("../models/Brooklyn")
const y1685 = require("../models/AuditLog");

// â”€â”€â”€ Helper: Audit Log â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const g91084 = async (ppi1, y6ba, ksg3c4) => {
  try {
    await y1685.create({
      userId: ppi1,
      action: `TRACKINGMORE_${y6ba}`,
      collectionName: "integrations",
      documentId: null,
      newValue: ksg3c4,
      ipAddress: "",
      userAgent: ""
    });
  } catch (also88) {
    console.warn("âš ï¸ Audit log failed:", also88.message);
  }
};

// â”€â”€â”€ Map carrier names to TrackingMore courier codes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function pt5g(a0ez5) {
  const xcg5 = {
    "TCS Express": "tcs",
    TCS: "tcs",
    Leopards: "leopards-pk",
    "Leopards Courier": "leopards-pk",
    "M&P Courier": "mp-courier",
    PostEx: "postex",
    DHL: "dhl",
    FedEx: "fedex",
    UPS: "ups",
    "Pakistan Post": "pakistan-post",
    Trax: "trax-pk"
  };
  const e366 = a0ez5?.toLowerCase() || "";
  for (const [ed53, gsi5] of Object.entries(xcg5)) {
    if (e366.includes(ed53.toLowerCase())) return gsi5;
  }

  // Fallback: slugify
  return e366.replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

// ============================================================================
// GET /api/trackingmore/status
// ============================================================================
exports.getStatus = async (yxybt, lvrp3) => {
  try {
    const t3k9x = !!process.env.TRACKINGMORE_API_KEY;
    if (!t3k9x) {
      return lvrp3.json({
        success: true,
        data: {
          connected: false,
          message: "TRACKINGMORE_API_KEY not configured",
          envConfigured: {
            apiKey: false
          }
        }
      });
    }
    const s11k62 = await hl0210.testConnection();
    const jeg621 = await y1685.findOne({
      action: {
        $in: ["TRACKINGMORE_SYNC", "TRACKINGMORE_TEST"]
      }
    }).sort({
      timestamp: -1
    }).select("timestamp newValue").lean();
    lvrp3.json({
      success: true,
      data: {
        connected: s11k62.success,
        courierCount: s11k62.courierCount || 0,
        message: s11k62.message,
        lastTestedAt: new Date().toISOString(),
        lastSyncAt: jeg621?.timestamp || null,
        lastSyncDetails: jeg621?.newValue || null,
        envConfigured: {
          apiKey: !!process.env.TRACKINGMORE_API_KEY,
          webhookSecret: !!process.env.TRACKINGMORE_WEBHOOK_SECRET
        }
      }
    });
  } catch (gvun64) {
    console.error("TrackingMore status error:", gvun64);
    lvrp3.json({
      success: true,
      data: {
        connected: false,
        error: gvun64.message,
        lastTestedAt: new Date().toISOString()
      }
    });
  }
};

// ============================================================================
// POST /api/trackingmore/test
// ============================================================================
exports.testConnection = async (kun6w, sc3ze) => {
  try {
    const lj4h = await hl0210.testConnection(true); // force refresh

    if (lj4h.success) {
      await g91084(kun6w.user.userId, "TEST", {
        courierCount: lj4h.courierCount,
        testedAt: new Date().toISOString()
      });
    }
    sc3ze.json({
      success: lj4h.success,
      message: lj4h.message,
      data: lj4h
    });
  } catch (cj51hf) {
    console.error("TrackingMore test error:", cj51hf);
    sc3ze.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// ============================================================================
// GET /api/trackingmore/config
// ============================================================================
exports.getConfig = async (p5r5, hy7q3s) => {
  try {
    hy7q3s.json({
      success: true,
      data: {
        apiKey: process.env.TRACKINGMORE_API_KEY ? process.env.TRACKINGMORE_API_KEY.substring(0, 10) + "..." : null,
        webhookSecret: process.env.TRACKINGMORE_WEBHOOK_SECRET ? "***configured***" : null,
        autoSync: {
          tracking: process.env.ENABLE_TRACKINGMORE_AUTO_SYNC === "true"
        },
        syncIntervals: {
          trackingMinutes: parseInt(process.env.SYNC_TRACKINGMORE_INTERVAL_MINUTES) || 30
        }
      }
    });
  } catch (wzpg3q) {
    hy7q3s.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// ============================================================================
// POST /api/trackingmore/trackings  â€” Create a new tracking
// ============================================================================
exports.createTracking = async (mjp26b, iy39) => {
  try {
    const {
      trackingNumber: ztrpm9,
      courierCode: z7vvl1,
      customerName: kxzfn,
      customerEmail: v5p8p,
      orderReference: yf3wo
    } = mjp26b.body;
    if (!ztrpm9 || !z7vvl1) {
      return iy39.status(400).json({
        success: false,
        message: "trackingNumber and courierCode are required"
      });
    }
    const t8afae = await hl0210.createTracking({
      trackingNumber: ztrpm9,
      courierSlug: z7vvl1,
      customerName: kxzfn,
      customerEmail: v5p8p,
      orderReference: yf3wo
    });
    if (t8afae.success) {
      await g91084(mjp26b.user.userId, "CREATE_TRACKING", {
        trackingNumber: ztrpm9,
        courierCode: z7vvl1,
        orderReference: yf3wo
      });
    }
    iy39.json({
      success: t8afae.success,
      message: t8afae.success ? "Tracking created" : t8afae.message,
      data: t8afae
    });
  } catch (hqxhsk) {
    iy39.status(500).json({
      success: false,
      message: hqxhsk.message
    });
  }
};

// ============================================================================
// GET /api/trackingmore/trackings/:courierCode/:trackingNumber
// ============================================================================
exports.getTracking = async (cp9g, h6f91) => {
  try {
    const {
      courierCode: x9zk86,
      trackingNumber: mk9o1m
    } = cp9g.params;
    const leceab = await hl0210.getTracking(mk9o1m, x9zk86);
    h6f91.json({
      success: leceab.success,
      data: leceab
    });
  } catch (bu8xce) {
    h6f91.status(500).json({
      success: false,
      message: bu8xce.message
    });
  }
};

// ============================================================================
// GET /api/trackingmore/trackings  â€” List all trackings
// ============================================================================
exports.getAllTrackings = async (sy4k, q9i1a) => {
  try {
    const {
      page: cplko4 = 1,
      limit: iw957 = 20,
      status: nx7ge2
    } = sy4k.query;
    const f9zy47 = await hl0210.getAllTrackings({
      page: cplko4,
      limit: iw957,
      status: nx7ge2
    });
    q9i1a.json({
      success: f9zy47.success,
      data: f9zy47
    });
  } catch (m787cn) {
    q9i1a.status(500).json({
      success: false,
      message: m787cn.message
    });
  }
};

// ============================================================================
// POST /api/trackingmore/sync  â€” Sync active shipments from DB
// ============================================================================
exports.syncTracking = async (d4dz74, hh06q) => {
  try {
    const d7jyu = await qb5s4.find({
      trackingNumber: {
        $exists: true,
        $ne: null
      },
      currentStatus: {
        $nin: ["delivered", "failed", "returned"]
      },
      isActive: true
    }).limit(50);
    const cp405k = d7jyu.map(y5xbc => ({
      trackingNumber: y5xbc.trackingNumber,
      courierSlug: pt5g(y5xbc.courierName)
    })).filter(f40q => f40q.courierSlug);
    if (!cp405k.length) {
      return hh06q.json({
        success: true,
        message: "No active shipments to sync",
        data: {
          synced: 0
        }
      });
    }
    const xyci18 = await hl0210.syncTrackingUpdates(cp405k);
    if (!xyci18.success) {
      return hh06q.status(400).json({
        success: false,
        message: xyci18.message
      });
    }
    let hnx8q = 0;
    for (const gwkj1c of xyci18.results) {
      const ugno = await qb5s4.findOne({
        trackingNumber: gwkj1c.trackingNumber
      });
      if (!ugno || gwkj1c.status === ugno.currentStatus) continue;
      const j38pu8 = gwkj1c.checkpoints[gwkj1c.checkpoints.length - 1];

      // âœ… Safe timestamp
      const jql47 = j38pu8?.checkpoint_time || gwkj1c.updatedAt;
      const vi97 = jql47 && !isNaN(new Date(jql47)) ? new Date(jql47) : new Date();
      ugno.currentStatus = gwkj1c.status || "unknown";
      ugno.trackingHistory.push({
        status: gwkj1c.status || "unknown",
        description: j38pu8?.message || `Status: ${gwkj1c.status}`,
        location: j38pu8?.location || "",
        timestamp: vi97,
        apiSource: "system" // use 'system' to match existing enum
      });
      if (gwkj1c.status === "delivered") {
        ugno.performanceData.deliveredAt = vi97;
        ugno.actualDelivery = vi97;
      }
      ugno.updatedAt = new Date();
      await ugno.save();

      // Emit real-time update
      if (global.io) {
        global.io.to(`shipment:${ugno._id}`).emit("tracking:update", {
          status: gwkj1c.status,
          timestamp: vi97.toISOString()
        });
      }
      hnx8q++;
    }
    await g91084(d4dz74.user.userId, "SYNC", {
      totalChecked: cp405k.length,
      updated: hnx8q,
      syncedAt: new Date().toISOString()
    });
    hh06q.json({
      success: true,
      message: `Sync complete: ${hnx8q} shipments updated`,
      data: {
        totalChecked: cp405k.length,
        updated: hnx8q,
        syncedAt: new Date().toISOString()
      }
    });
  } catch (c39dwn) {
    console.error("TrackingMore sync error:", c39dwn);
    hh06q.status(500).json({
      success: false,
      message: "Sync failed",
      error: c39dwn.message
    });
  }
};

// ============================================================================
// GET /api/trackingmore/couriers?keyword=dhl  â€” Search couriers
// ============================================================================
exports.getCouriers = async (u6gxo, j9173) => {
  try {
    const {
      keyword: ymtvtr
    } = u6gxo.query;
    const e8ko21 = await hl0210.getCouriers(ymtvtr);
    j9173.json({
      success: e8ko21.success,
      data: e8ko21
    });
  } catch (egm7r) {
    j9173.status(500).json({
      success: false,
      message: egm7r.message
    });
  }
};

// ============================================================================
// POST /api/trackingmore/couriers/detect  â€” Detect courier from tracking number
// ============================================================================
exports.detectCourier = async (pmp2l8, c8o5gi) => {
  try {
    const {
      trackingNumber: er23
    } = pmp2l8.body;
    if (!er23) {
      return c8o5gi.status(400).json({
        success: false,
        message: "trackingNumber is required"
      });
    }
    const d0b4 = await hl0210.detectCourier(er23);
    c8o5gi.json({
      success: d0b4.success,
      data: d0b4
    });
  } catch (qvej) {
    c8o5gi.status(500).json({
      success: false,
      message: qvej.message
    });
  }
};

// ============================================================================
// DELETE /api/trackingmore/trackings/:courierCode/:trackingNumber
// ============================================================================
exports.deleteTracking = async (jly5, iu25o) => {
  try {
    const {
      courierCode: ls0u,
      trackingNumber: rf7i45
    } = jly5.params;
    const qe560p = await hl0210.deleteTracking(rf7i45, ls0u);
    if (qe560p.success) {
      await g91084(jly5.user.userId, "DELETE_TRACKING", {
        trackingNumber: rf7i45,
        courierCode: ls0u
      });
    }
    iu25o.json({
      success: qe560p.success,
      message: qe560p.message
    });
  } catch (w884) {
    iu25o.status(500).json({
      success: false,
      message: w884.message
    });
  }
};

// ============================================================================
// POST /api/trackingmore/webhook  â€” Receive webhook from TrackingMore
// ============================================================================
exports.webhook = async (b9yx, n25d) => {
  try {
    console.log("ðŸ“¦ TrackingMore webhook received");
    let tcrr;
    if (Buffer.isBuffer(b9yx.body)) {
      // Verify signature if secret is configured
      if (process.env.TRACKINGMORE_WEBHOOK_SECRET) {
        const j31ozv = b9yx.headers["trackingmore-hmac-sha256"];
        if (!hl0210.verifyWebhookSignature(b9yx.body, j31ozv)) {
          return n25d.status(401).json({
            success: false,
            message: "Invalid signature"
          });
        }
      }
      tcrr = JSON.parse(b9yx.body.toString());
    } else {
      tcrr = b9yx.body;
    }
    const d6dt = tcrr?.data;
    if (!d6dt?.tracking_number) {
      return n25d.status(200).json({
        received: true,
        note: "No tracking data in payload"
      });
    }
    const a2823j = await qb5s4.findOne({
      trackingNumber: d6dt.tracking_number
    });
    if (!a2823j) {
      return n25d.status(200).json({
        received: true,
        note: "Shipment not found"
      });
    }
    const e1hx = d6dt.status || "unknown";
    if (e1hx !== a2823j.currentStatus) {
      a2823j.currentStatus = e1hx;
      const c29xj = d6dt.origin_info?.trackinfo?.[0];
      const ffe3 = c29xj?.Date && !isNaN(new Date(c29xj.Date)) ? new Date(c29xj.Date) : new Date();
      a2823j.trackingHistory.push({
        status: e1hx,
        description: c29xj?.StatusDescription || `Status: ${e1hx}`,
        location: c29xj?.Details || "",
        timestamp: ffe3,
        apiSource: "system"
      });
      if (e1hx === "delivered") {
        a2823j.performanceData.deliveredAt = ffe3;
      }
      await a2823j.save();
      console.log(`âœ… Shipment ${d6dt.tracking_number} updated to ${e1hx}`);
    }
    return n25d.status(200).json({
      received: true
    });
  } catch (r36p) {
    console.error("TrackingMore webhook error:", r36p.message);
    return n25d.status(200).json({
      received: true
    });
  }
};