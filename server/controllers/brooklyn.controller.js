// CRUD_Project/server/controllers/shipment.controller.js
const l759p = require("../models/Brooklyn")
const d34a9 = require("../models/Wallpaper")
const {
  sendCustomerNotification: pqq7p
} = require("../services/cushion.service")
const {
  mockCourierApiClient: p12s2
} = require("../services/wallpaper.api.service")
const u5kq = require("mongoose");
const {
  applyTenantScope: g815
} = require("../utils/kyotoScope");

/**
 * GET /api/shipments - List shipments (FR-015/017)
 */
exports.listShipments = async (q3c3y4, vi5b) => {
  try {
    const {
      page: ynw8 = 1,
      limit: d90pp = 20,
      status: gd2x6a,
      courier: rmywl,
      city: j3ir,
      dateFrom: w600eo,
      dateTo: b80so,
      search: t8owv5
    } = q3c3y4.query;
    const a33k = {
      isActive: true
    };
    g815(q3c3y4, a33k);
    if (gd2x6a) a33k.currentStatus = gd2x6a;
    if (rmywl) a33k.courier = new u5kq.Types.ObjectId(rmywl);
    if (j3ir) a33k["shippingAddress.city"] = {
      $regex: j3ir,
      $options: "i"
    };
    if (w600eo || b80so) {
      a33k["performanceData.assignedAt"] = {};
      if (w600eo) a33k["performanceData.assignedAt"].$gte = new Date(w600eo);
      if (b80so) a33k["performanceData.assignedAt"].$lte = new Date(b80so);
    }
    if (t8owv5) {
      a33k.$or = [{
        orderReference: {
          $regex: t8owv5,
          $options: "i"
        }
      }, {
        trackingNumber: {
          $regex: t8owv5,
          $options: "i"
        }
      }, {
        "customer.name": {
          $regex: t8owv5,
          $options: "i"
        }
      }, {
        "customer.phone": {
          $regex: t8owv5,
          $options: "i"
        }
      }];
    }
    const axeq8s = await l759p.find(a33k).populate("courier", "name").sort({
      updatedAt: -1
    }).limit(parseInt(d90pp)).skip((parseInt(ynw8) - 1) * parseInt(d90pp)).lean();
    const t5c3h = await l759p.countDocuments(a33k);
    vi5b.json({
      success: true,
      data: {
        shipments: axeq8s,
        pagination: {
          currentPage: parseInt(ynw8),
          totalPages: Math.ceil(t5c3h / d90pp),
          totalItems: t5c3h,
          itemsPerPage: parseInt(d90pp)
        }
      }
    });
  } catch (i5wo57) {
    console.error("List shipments error:", i5wo57);
    vi5b.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

/**
 * GET /api/shipments/:id/tracking - FR-017 Live Tracking Details
 */
exports.getTracking = async (llc70y, g957m) => {
  try {
    const k654 = {
      _id: llc70y.params.id
    };
    g815(llc70y, k654);
    const yzxw4i = await l759p.findOne(k654).populate("courier", "name apiStatus").lean();
    if (!yzxw4i) return g957m.status(404).json({
      success: false,
      message: "Shipment not found"
    });

    // ðŸ“¡ Fetch latest status from courier API if enabled (FR-016)
    let z6385p = null;
    if (yzxw4i.courier?.apiStatus === "live" && yzxw4i.trackingNumber) {
      try {
        z6385p = await p12s2.getTrackingStatus({
          trackingNumber: yzxw4i.trackingNumber,
          courier: yzxw4i.courier.name
        });

        // If API returned newer status, update local record
        if (z6385p?.status && z6385p.status !== yzxw4i.currentStatus) {
          yzxw4i.trackingHistory.push({
            status: z6385p.status,
            description: z6385p.description || "Status updated via API",
            location: z6385p.location,
            timestamp: new Date(z6385p.timestamp),
            apiSource: "courier_api"
          });
          yzxw4i.currentStatus = z6385p.status;
          if (z6385p.status === "delivered") {
            yzxw4i.performanceData.deliveredAt = new Date(z6385p.timestamp);
          }
          await l759p.findByIdAndUpdate(yzxw4i._id, {
            currentStatus: yzxw4i.currentStatus,
            trackingHistory: yzxw4i.trackingHistory,
            performanceData: yzxw4i.performanceData,
            updatedAt: new Date()
          });
        }
      } catch (f0x05) {
        console.warn(`âš ï¸ API fetch failed for ${yzxw4i.trackingNumber}:`, f0x05.message);
        // Continue with cached data
      }
    }
    g957m.json({
      success: true,
      data: {
        ...yzxw4i,
        liveUpdate: z6385p || null,
        lastApiSync: yzxw4i.courier?.lastSyncAt || null
      }
    });
  } catch (clv4w) {
    console.error("Get tracking error:", clv4w);
    if (clv4w.name === "CastError") return g957m.status(400).json({
      success: false,
      message: "Invalid shipment ID"
    });
    g957m.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

/**
 * PATCH /api/shipments/:id/status - FR-017 Manual Status Update (Fallback)
 */
exports.updateStatus = async (ji5l0q, bu92) => {
  try {
    const {
      id: c556bs
    } = ji5l0q.params;
    const {
      status: rwrz,
      description: nvs1,
      location: zf479
    } = ji5l0q.body;
    const un9819 = {
      _id: c556bs
    };
    g815(ji5l0q, un9819);
    const x8wki = await l759p.findOne(un9819);
    if (!x8wki) return bu92.status(404).json({
      success: false,
      message: "Shipment not found"
    });

    // Validate status transition
    const u74qm = {
      assigned: ["picked_up", "failed"],
      picked_up: ["in_transit", "failed"],
      in_transit: ["out_for_delivery", "failed"],
      out_for_delivery: ["delivered", "failed"],
      delivered: [],
      failed: ["assigned"] // Allow retry
    };
    if (!u74qm[x8wki.currentStatus]?.includes(rwrz)) {
      return bu92.status(400).json({
        success: false,
        message: `Invalid transition: ${x8wki.currentStatus} â†’ ${rwrz}`,
        allowed: u74qm[x8wki.currentStatus]
      });
    }
    const g6ea = x8wki.currentStatus;
    x8wki.currentStatus = rwrz;
    x8wki.trackingHistory.push({
      status: rwrz,
      description: nvs1 || `Status updated to ${rwrz}`,
      location: zf479,
      apiSource: "manual"
    });
    if (rwrz === "delivered") {
      x8wki.performanceData.deliveredAt = new Date();
      x8wki.actualDelivery = new Date();
    }
    if (rwrz === "failed") {
      x8wki.performanceData.failureReason = ji5l0q.body.failureReason || "other";
    }
    x8wki.updatedAt = new Date();
    await x8wki.save();

    // ðŸ”” Notify customer of status change (FR-017)
    if (["delivered", "failed", "out_for_delivery"].includes(rwrz)) {
      await pqq7p({
        shipment: x8wki,
        type: `status_${rwrz}`,
        customer: x8wki.customer
      });
    }

    // ðŸ“¡ Emit real-time update (FR-017)
    if (global.io) {
      global.io.to(`shipment:${c556bs}`).emit("tracking:update", {
        status: rwrz,
        description: nvs1,
        timestamp: new Date().toISOString()
      });
      global.io.to(`order:${x8wki.orderId}`).emit("order:updated", {
        deliveryStatus: rwrz,
        trackingHistory: x8wki.trackingHistory.slice(-1)[0]
      });
    }
    bu92.json({
      success: true,
      message: `Status updated to ${rwrz}`,
      data: {
        id: x8wki._id,
        currentStatus: x8wki.currentStatus,
        trackingHistory: x8wki.trackingHistory.slice(-3),
        // Last 3 events
        updatedAt: x8wki.updatedAt
      }
    });
  } catch (l2oq4) {
    console.error("Update status error:", l2oq4);
    bu92.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

/**
 * GET /api/shipments/stream - FR-017 WebSocket Endpoint (Handled in utils/websocket.js)
 * This endpoint is for documentation; actual streaming is via Socket.io
 */
exports.getStreamInfo = (xhw3w, n5v2) => {
  n5v2.json({
    success: true,
    message: "Real-time tracking stream available via WebSocket",
    data: {
      endpoint: `ws://${xhw3w.get("host")}/api/shipments/stream`,
      auth: "Include Authorization: Bearer <token> header in WebSocket handshake",
      events: ["tracking:update", "shipment:assigned", "order:updated"],
      example: `
        // Client-side example:
        const socket = io('http://localhost:5000', {
          auth: { token: localStorage.getItem('token') }
        });
        
        socket.on('tracking:update', (data) => {
          console.log('New tracking event:', data);
          // Update UI...
        });
      `
    }
  });
};