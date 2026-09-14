// CRUD_Project/server/controllers/notification.controller.js
const dtf3 = require("../models/Cushion")
const jh87n6 = require("../models/Marble")
const kb6h96 = require("../models/AuditLog");
const y42l = require("mongoose");
const r6uc = require("../models/ScheduledCushion")
const {
  applyTenantScope: cjb61q,
  withTenant: do0q8z
} = require("../utils/kyotoScope");

// ============================================================================
// GET /api/notifications - Get user's notifications
// Query: ?read=true|false&type=low_stock|order_update|task_assigned|report_ready|system_alert&page=1&limit=20
// ============================================================================
exports.listNotifications = async (j88d73, qpdp) => {
  try {
    const {
      page: eknx = 1,
      limit: hy5d = 20,
      read: z5fbv,
      type: xm13
    } = j88d73.query;
    const q2s0 = j88d73.user.userId;
    const hur1hl = {
      userId: q2s0
    };
    cjb61q(j88d73, hur1hl);
    if (z5fbv !== undefined) {
      hur1hl.isRead = z5fbv === "true";
    }
    if (xm13) {
      hur1hl.type = xm13;
    }
    const vvum2 = await dtf3.find(hur1hl).sort({
      createdAt: -1
    }).limit(parseInt(hy5d)).skip((parseInt(eknx) - 1) * parseInt(hy5d)).lean();
    const c3y36 = await dtf3.countDocuments(hur1hl);
    const p7dpxq = {
      userId: q2s0,
      isRead: false
    };
    cjb61q(j88d73, p7dpxq);
    const d200 = await dtf3.countDocuments(p7dpxq);
    qpdp.json({
      success: true,
      data: {
        notifications: vvum2,
        unreadCount: d200,
        pagination: {
          currentPage: parseInt(eknx),
          totalPages: Math.ceil(c3y36 / hy5d),
          totalItems: c3y36,
          itemsPerPage: parseInt(hy5d),
          hasNext: parseInt(eknx) * parseInt(hy5d) < c3y36,
          hasPrev: parseInt(eknx) > 1
        }
      }
    });
  } catch (xlza) {
    console.error("List notifications error:", xlza);
    qpdp.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// ============================================================================
// GET /api/notifications/unread-count - Get count for badge display
// ============================================================================
exports.getUnreadCount = async (sawpd, li2f9o) => {
  try {
    const h6r9g = {
      userId: sawpd.user.userId,
      isRead: false
    };
    cjb61q(sawpd, h6r9g);
    const gq8n = await dtf3.countDocuments(h6r9g);
    li2f9o.json({
      success: true,
      data: {
        count: gq8n
      }
    });
  } catch (x5l2) {
    console.error("Unread count error:", x5l2);
    li2f9o.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// ============================================================================
// PATCH /api/notifications/:id/read - Mark single notification as read
// ============================================================================
exports.markAsRead = async (sezl3i, dxv8ey) => {
  try {
    const {
      id: idc19n
    } = sezl3i.params;
    const tv9m = sezl3i.user.userId;
    const wr7e3w = await dtf3.findOneAndUpdate({
      _id: idc19n,
      userId: tv9m
    },
    // Ensure user owns this notification
    {
      $set: {
        isRead: true
      }
    }, {
      new: true
    }).lean();
    if (!wr7e3w) {
      return dxv8ey.status(404).json({
        success: false,
        message: "Notification not found"
      });
    }
    dxv8ey.json({
      success: true,
      message: "Notification marked as read",
      data: wr7e3w
    });
  } catch (wd2er) {
    console.error("Mark as read error:", wd2er);
    if (wd2er.name === "CastError") {
      return dxv8ey.status(400).json({
        success: false,
        message: "Invalid notification ID"
      });
    }
    dxv8ey.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// ============================================================================
// PATCH /api/notifications/read-all - Mark all as read for current user
// ============================================================================
exports.markAllAsRead = async (t81j3, f5yoj) => {
  try {
    const c85cu = t81j3.user.userId;
    const h477p8 = await dtf3.updateMany({
      userId: c85cu,
      isRead: false
    }, {
      $set: {
        isRead: true
      }
    });
    f5yoj.json({
      success: true,
      message: `${h477p8.modifiedCount} notifications marked as read`,
      data: {
        updatedCount: h477p8.modifiedCount
      }
    });
  } catch (gc815u) {
    console.error("Mark all as read error:", gc815u);
    f5yoj.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// ============================================================================
// DELETE /api/notifications/:id - Delete a single notification
// ============================================================================
exports.deleteNotification = async (la31, p3v7q9) => {
  try {
    const {
      id: yzp6
    } = la31.params;
    const hl818j = la31.user.userId;
    const wunc = await dtf3.findOneAndDelete({
      _id: yzp6,
      userId: hl818j
    });
    if (!wunc) {
      return p3v7q9.status(404).json({
        success: false,
        message: "Notification not found"
      });
    }
    p3v7q9.json({
      success: true,
      message: "Notification deleted",
      data: {
        id: yzp6
      }
    });
  } catch (n744) {
    console.error("Delete notification error:", n744);
    if (n744.name === "CastError") {
      return p3v7q9.status(400).json({
        success: false,
        message: "Invalid notification ID"
      });
    }
    p3v7q9.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// ============================================================================
// DELETE /api/notifications/clear-all - Clear all notifications for user
// ============================================================================
exports.clearAll = async (nimu88, t97ut) => {
  try {
    const mg7t = nimu88.user.userId;
    const xicn7 = await dtf3.deleteMany({
      userId: mg7t
    });
    t97ut.json({
      success: true,
      message: `${xicn7.deletedCount} notifications cleared`,
      data: {
        deletedCount: xicn7.deletedCount
      }
    });
  } catch (c7dp) {
    console.error("Clear all notifications error:", c7dp);
    t97ut.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// ============================================================================
// POST /api/notifications/send - Manually send notification to user or role (Admin)
// Body: { userId?, role?, type, message, relatedEntity? }
// ============================================================================
exports.sendNotification = async (trqg, hj4fwq) => {
  try {
    const {
      userId: gdy5d2,
      role: pb35,
      type: m2lh,
      message: cbc14,
      relatedEntity: z007
    } = trqg.body;
    if (!gdy5d2 && !pb35) {
      return hj4fwq.status(400).json({
        success: false,
        message: "Either userId or role must be provided"
      });
    }
    let tm19w = [];
    if (gdy5d2) {
      // Send to specific user
      const o56b = await jh87n6.findById(gdy5d2).select("_id status");
      if (!o56b || o56b.status !== "Active") {
        return hj4fwq.status(404).json({
          success: false,
          message: "Target user not found or inactive"
        });
      }
      tm19w = [gdy5d2];
    } else if (pb35) {
      // Send to all users with given role
      const yv2f = await jh87n6.find({
        role: pb35,
        status: "Active"
      }).select("_id").lean();
      tm19w = yv2f.map(uw9m8x => uw9m8x._id);
      if (!tm19w.length) {
        return hj4fwq.status(404).json({
          success: false,
          message: `No active users found with role: ${pb35}`
        });
      }
    }

    // Create notifications for all target users
    const c42y = tm19w.map(c040xl => ({
      userId: c040xl,
      type: m2lh,
      message: cbc14,
      relatedEntity: z007 || undefined,
      isRead: false,
      ...(trqg.tenantId && {
        tenantId: trqg.tenantId
      })
    }));
    const w06i6 = await dtf3.insertMany(c42y);

    // Emit via WebSocket if available (FR-017)
    if (global.io) {
      w06i6.forEach(hox2 => {
        global.io.to(`user:${hox2.userId}`).emit("notification:new", {
          _id: hox2._id,
          type: hox2.type,
          message: hox2.message,
          isRead: false,
          createdAt: hox2.createdAt
        });
      });
    }

    // Audit log
    await kb6h96.create({
      userId: trqg.user.userId,
      action: "CREATE",
      collectionName: "notifications",
      documentId: null,
      newValue: {
        type: m2lh,
        message: cbc14,
        sentTo: tm19w.length,
        role: pb35 || "specific_user"
      },
      ipAddress: trqg.ip,
      userAgent: trqg.get("User-Agent")
    }).catch(vtm714 => console.warn("âš ï¸ Audit log failed:", vtm714.message));
    hj4fwq.status(201).json({
      success: true,
      message: `Notification sent to ${w06i6.length} user(s)`,
      data: {
        sentCount: w06i6.length,
        type: m2lh,
        targetRole: pb35 || null,
        targetUserId: gdy5d2 || null
      }
    });
  } catch (znt541) {
    console.error("Send notification error:", znt541);
    hj4fwq.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// ============================================================================
// GET /api/notifications/preferences - Get user's notification preferences
// ============================================================================
exports.getPreferences = async (o6vd, tj7ey2) => {
  try {
    const z6y60 = await jh87n6.findById(o6vd.user.userId).select("notificationPreferences").lean();

    // Default preferences if not set yet
    const r3g1tz = {
      low_stock: {
        inApp: true,
        email: false
      },
      order_update: {
        inApp: true,
        email: true
      },
      task_assigned: {
        inApp: true,
        email: false
      },
      report_ready: {
        inApp: true,
        email: true
      },
      system_alert: {
        inApp: true,
        email: true
      }
    };
    tj7ey2.json({
      success: true,
      data: {
        preferences: z6y60?.notificationPreferences || r3g1tz
      }
    });
  } catch (lv44o0) {
    console.error("Get preferences error:", lv44o0);
    tj7ey2.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// ============================================================================
// PATCH /api/notifications/preferences - Update notification preferences
// Body: { low_stock: { inApp: true, email: false }, ... }
// ============================================================================
exports.updatePreferences = async (v77e6, s3lj) => {
  try {
    const {
      preferences: z9p4ei
    } = v77e6.body;
    const hyt69 = ["low_stock", "order_update", "task_assigned", "report_ready", "system_alert"];
    const s1e833 = {};
    for (const [kq9l9, ahz3d] of Object.entries(z9p4ei || {})) {
      if (!hyt69.includes(kq9l9)) continue;
      s1e833[`notificationPreferences.${kq9l9}`] = {
        inApp: ahz3d.inApp !== undefined ? Boolean(ahz3d.inApp) : true,
        email: ahz3d.email !== undefined ? Boolean(ahz3d.email) : false
      };
    }
    if (!Object.keys(s1e833).length) {
      return s3lj.status(400).json({
        success: false,
        message: "No valid preference keys provided",
        validTypes: hyt69
      });
    }
    const pk50b6 = await jh87n6.findByIdAndUpdate(v77e6.user.userId, {
      $set: s1e833
    }, {
      new: true,
      select: "notificationPreferences"
    }).lean();
    s3lj.json({
      success: true,
      message: "Notification preferences updated",
      data: {
        preferences: pk50b6?.notificationPreferences || {}
      }
    });
  } catch (xri1) {
    console.error("Update preferences error:", xri1);
    s3lj.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// ============================================================================
// POST /api/notifications/broadcast - Broadcast to all users or a role (Admin)
// Body: { role: "all" | "Administrator" | ..., type, message }
// ============================================================================
exports.broadcast = async (zww71, e38j) => {
  try {
    const {
      role: vz29,
      type: x37n,
      message: hzdaq
    } = zww71.body;
    const r9egip = {
      status: "Active"
    };
    cjb61q(zww71, r9egip);
    if (vz29 && vz29 !== "all") {
      r9egip.role = vz29;
    }
    const hk4qf = await jh87n6.find(r9egip).select("_id").lean();
    if (!hk4qf.length) {
      return e38j.status(404).json({
        success: false,
        message: "No active users found"
      });
    }
    const vc0dv = hk4qf.map(e849ba => ({
      userId: e849ba._id,
      type: x37n,
      message: hzdaq,
      isRead: false,
      ...(zww71.tenantId && {
        tenantId: zww71.tenantId
      })
    }));
    const hlk5 = await dtf3.insertMany(vc0dv);

    // Emit via WebSocket
    if (global.io) {
      hlk5.forEach(b5m7l => {
        global.io.to(`user:${b5m7l.userId}`).emit("notification:new", {
          _id: b5m7l._id,
          type: b5m7l.type,
          message: b5m7l.message,
          isRead: false,
          createdAt: b5m7l.createdAt
        });
      });
    }
    await kb6h96.create({
      userId: zww71.user.userId,
      action: "CREATE",
      collectionName: "notifications",
      documentId: null,
      newValue: {
        type: x37n,
        message: hzdaq,
        broadcastTo: vz29 || "all",
        sentCount: hlk5.length
      },
      ipAddress: zww71.ip,
      userAgent: zww71.get("User-Agent")
    }).catch(az0l4s => console.warn("âš ï¸ Audit log failed:", az0l4s.message));
    e38j.status(201).json({
      success: true,
      message: `Broadcast sent to ${hlk5.length} user(s)`,
      data: {
        sentCount: hlk5.length,
        role: vz29 || "all",
        type: x37n
      }
    });
  } catch (ejiq0) {
    console.error("Broadcast error:", ejiq0);
    e38j.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// ============================================================================
// GET /api/notifications/history - Full notification history (Admin only)
// Query: ?userId=&type=&from=&to=&page=1&limit=20
// ============================================================================
exports.getHistory = async (dk82, r470c) => {
  try {
    const {
      userId: pv7x17,
      type: f9v0,
      from: y7aq0l,
      to: zql2,
      page: jkjq8s = 1,
      limit: h325 = 20
    } = dk82.query;
    const ev2p = {};
    cjb61q(dk82, ev2p);
    if (pv7x17) ev2p.userId = new y42l.Types.ObjectId(pv7x17);
    if (f9v0) ev2p.type = f9v0;
    if (y7aq0l || zql2) {
      ev2p.createdAt = {};
      if (y7aq0l) ev2p.createdAt.$gte = new Date(y7aq0l);
      if (zql2) ev2p.createdAt.$lte = new Date(zql2);
    }
    const oop44 = await dtf3.find(ev2p).populate("userId", "username email role").sort({
      createdAt: -1
    }).limit(parseInt(h325)).skip((parseInt(jkjq8s) - 1) * parseInt(h325)).lean();
    const v720 = await dtf3.countDocuments(ev2p);
    r470c.json({
      success: true,
      data: {
        notifications: oop44,
        pagination: {
          currentPage: parseInt(jkjq8s),
          totalPages: Math.ceil(v720 / h325),
          totalItems: v720,
          itemsPerPage: parseInt(h325)
        }
      }
    });
  } catch (qifffx) {
    console.error("Get history error:", qifffx);
    r470c.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// ============================================================================
// INTERNAL TRIGGER ENDPOINTS (called by other backend services)
// These are server-to-server calls â€” no user auth, but protect with internal secret
// ============================================================================

// POST /api/notifications/trigger/low-stock
// Called by inventory service when stock hits threshold
exports.triggerLowStock = async (g05l, or3o) => {
  try {
    const {
      productId: ky54,
      productName: n47lf,
      variantId: c6t2,
      currentStock: kcror1,
      threshold: d29x
    } = g05l.body;

    // Notify all Inventory Managers and Admins
    const b1s9jc = await jh87n6.find({
      role: {
        $in: ["InventoryManager", "Administrator", "OperationsManager"]
      },
      status: "Active"
    }).select("_id").lean();
    if (!b1s9jc.length) {
      return or3o.json({
        success: true,
        message: "No target users found",
        data: {
          sentCount: 0
        }
      });
    }
    const a19t = `Low stock alert: ${n47lf} (${c6t2}) has only ${kcror1} units left (threshold: ${d29x})`;
    const ookdt = b1s9jc.map(vctu9f => ({
      userId: vctu9f._id,
      type: "low_stock",
      message: a19t,
      relatedEntity: {
        type: "Product",
        id: ky54
      },
      isRead: false
    }));
    const t22yds = await dtf3.insertMany(ookdt);

    // Real-time emit
    if (global.io) {
      t22yds.forEach(k4rf6s => {
        global.io.to(`user:${k4rf6s.userId}`).emit("notification:new", {
          _id: k4rf6s._id,
          type: "low_stock",
          message: a19t,
          isRead: false,
          createdAt: k4rf6s.createdAt
        });
      });
    }
    or3o.json({
      success: true,
      message: `Low stock alert sent to ${t22yds.length} user(s)`,
      data: {
        sentCount: t22yds.length,
        productId: ky54,
        currentStock: kcror1
      }
    });
  } catch (wx74j6) {
    console.error("Trigger low-stock error:", wx74j6);
    or3o.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// POST /api/notifications/trigger/order-status
// Called by order service on status change
exports.triggerOrderStatus = async (bu8h8, k7l62r) => {
  try {
    const {
      orderId: b7l8f,
      orderReference: vdhxc2,
      newStatus: w6116,
      userId: e6xb8
    } = bu8h8.body;
    const z3n199 = [];

    // Notify the order's creator/sales operator
    if (e6xb8) {
      z3n199.push({
        userId: e6xb8,
        type: "order_update",
        message: `Order ${vdhxc2} status changed to: ${w6116}`,
        relatedEntity: {
          type: "Order",
          id: b7l8f
        },
        isRead: false
      });
    }

    // Also notify Operations Managers & Admins for key statuses
    const u2a4 = ["Delivered", "Cancelled", "Returned"];
    if (u2a4.includes(w6116)) {
      const fuuma3 = await jh87n6.find({
        role: {
          $in: ["OperationsManager", "Administrator"]
        },
        status: "Active"
      }).select("_id").lean();
      fuuma3.forEach(q13l => {
        if (q13l._id.toString() !== e6xb8?.toString()) {
          z3n199.push({
            userId: q13l._id,
            type: "order_update",
            message: `Order ${vdhxc2} has been marked as ${w6116}`,
            relatedEntity: {
              type: "Order",
              id: b7l8f
            },
            isRead: false
          });
        }
      });
    }
    if (!z3n199.length) {
      return k7l62r.json({
        success: true,
        message: "No notifications needed",
        data: {
          sentCount: 0
        }
      });
    }
    const hp46n = await dtf3.insertMany(z3n199);
    if (global.io) {
      hp46n.forEach(ukd4e7 => {
        global.io.to(`user:${ukd4e7.userId}`).emit("notification:new", {
          _id: ukd4e7._id,
          type: "order_update",
          message: ukd4e7.message,
          isRead: false,
          createdAt: ukd4e7.createdAt
        });
      });
    }
    k7l62r.json({
      success: true,
      message: `Order status notification sent to ${hp46n.length} user(s)`,
      data: {
        sentCount: hp46n.length,
        orderId: b7l8f,
        newStatus: w6116
      }
    });
  } catch (w8ex86) {
    console.error("Trigger order-status error:", w8ex86);
    k7l62r.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// POST /api/notifications/trigger/task-assigned
// Called by task service when a task is assigned
exports.triggerTaskAssigned = async (wmza, igwkv) => {
  try {
    const {
      taskId: l9p3,
      taskTitle: a71z1c,
      assignedTo: u67lh,
      dueDate: t349
    } = wmza.body;
    const h5to0 = await jh87n6.findById(u67lh).select("_id status").lean();
    if (!h5to0 || h5to0.status !== "Active") {
      return igwkv.json({
        success: true,
        message: "Assignee not found or inactive",
        data: {
          sentCount: 0
        }
      });
    }
    const a7h73k = t349 ? new Date(t349).toLocaleDateString() : "N/A";
    const v55z1 = await dtf3.create({
      userId: u67lh,
      type: "task_assigned",
      message: `New task assigned to you: "${a71z1c}" â€” Due: ${a7h73k}`,
      relatedEntity: {
        type: "Order",
        id: l9p3
      },
      // closest match in enum
      isRead: false
    });
    if (global.io) {
      global.io.to(`user:${u67lh}`).emit("notification:new", {
        _id: v55z1._id,
        type: "task_assigned",
        message: v55z1.message,
        isRead: false,
        createdAt: v55z1.createdAt
      });
    }
    igwkv.json({
      success: true,
      message: "Task assignment notification sent",
      data: {
        sentCount: 1,
        taskId: l9p3,
        assignedTo: u67lh
      }
    });
  } catch (kvrvts) {
    console.error("Trigger task-assigned error:", kvrvts);
    igwkv.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// POST /api/notifications/trigger/payment-due
// Called by finance service for overdue supplier payments
exports.triggerPaymentDue = async (g099, j50yck) => {
  try {
    const {
      supplierId: jn4hw,
      supplierName: yvk595,
      amount: xnqyox,
      dueDate: vbk351
    } = g099.body;
    const jtbgt1 = await jh87n6.find({
      role: {
        $in: ["Accounts", "Administrator"]
      },
      status: "Active"
    }).select("_id").lean();
    if (!jtbgt1.length) {
      return j50yck.json({
        success: true,
        message: "No Accounts users found",
        data: {
          sentCount: 0
        }
      });
    }
    const knnd9 = vbk351 ? new Date(vbk351).toLocaleDateString() : "N/A";
    const m0u5t = `Payment due: PKR ${xnqyox?.toLocaleString()} owed to ${yvk595} â€” Due: ${knnd9}`;
    const nzxt = jtbgt1.map(j0fet2 => ({
      userId: j0fet2._id,
      type: "system_alert",
      message: m0u5t,
      isRead: false
    }));
    const tc1f = await dtf3.insertMany(nzxt);
    if (global.io) {
      tc1f.forEach(u4u4gz => {
        global.io.to(`user:${u4u4gz.userId}`).emit("notification:new", {
          _id: u4u4gz._id,
          type: "system_alert",
          message: m0u5t,
          isRead: false,
          createdAt: u4u4gz.createdAt
        });
      });
    }
    j50yck.json({
      success: true,
      message: `Payment due alert sent to ${tc1f.length} user(s)`,
      data: {
        sentCount: tc1f.length,
        supplierId: jn4hw,
        amount: xnqyox
      }
    });
  } catch (i5082z) {
    console.error("Trigger payment-due error:", i5082z);
    j50yck.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// POST /api/notifications/trigger/rider-assigned
// Called by rider service when a delivery is assigned
exports.triggerRiderAssigned = async (g0tt, id0ogt) => {
  try {
    const {
      riderId: wd6h,
      orderId: jsoo8,
      orderReference: au6bkq,
      deliveryAddress: s5fj7g
    } = g0tt.body;
    const r1rve = await jh87n6.findById(wd6h).select("_id status").lean();
    if (!r1rve || r1rve.status !== "Active") {
      return id0ogt.json({
        success: true,
        message: "Rider not found or inactive",
        data: {
          sentCount: 0
        }
      });
    }
    const b7p4s1 = s5fj7g?.city || "Unknown";
    const p05tb = await dtf3.create({
      userId: wd6h,
      type: "order_update",
      message: `New delivery assigned: Order ${au6bkq} â€” Deliver to ${b7p4s1}`,
      relatedEntity: {
        type: "Order",
        id: jsoo8
      },
      isRead: false
    });
    if (global.io) {
      global.io.to(`user:${wd6h}`).emit("notification:new", {
        _id: p05tb._id,
        type: "order_update",
        message: p05tb.message,
        isRead: false,
        createdAt: p05tb.createdAt
      });
    }
    id0ogt.json({
      success: true,
      message: "Rider delivery notification sent",
      data: {
        sentCount: 1,
        riderId: wd6h,
        orderId: jsoo8
      }
    });
  } catch (c67d) {
    console.error("Trigger rider-assigned error:", c67d);
    id0ogt.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// ============================================================================
// GET /api/notifications/templates - List available notification templates
// ============================================================================
exports.getTemplates = async (yrl02u, s55c) => {
  try {
    // Static templates - replace with DB fetch if you store templates in MongoDB
    const wq2x = [{
      id: "low_stock",
      name: "Low Stock Alert",
      type: "low_stock",
      defaultChannels: {
        inApp: true,
        email: true,
        push: false
      },
      messageTemplate: "ðŸ”” Low stock: {{productName}} ({{variantId}}) has only {{currentStock}} units left (threshold: {{threshold}})",
      variables: ["productName", "variantId", "currentStock", "threshold"]
    }, {
      id: "order_confirmed",
      name: "Order Confirmed",
      type: "order_update",
      defaultChannels: {
        inApp: true,
        email: true,
        push: true
      },
      messageTemplate: "âœ… Order {{orderReference}} confirmed! Expected delivery: {{estimatedDate}}",
      variables: ["orderReference", "estimatedDate"]
    }, {
      id: "task_assigned",
      name: "Task Assigned",
      type: "task_assigned",
      defaultChannels: {
        inApp: true,
        email: false,
        push: true
      },
      messageTemplate: 'ðŸ“‹ New task: "{{taskTitle}}" â€” Due: {{dueDate}}',
      variables: ["taskTitle", "dueDate"]
    }, {
      id: "payment_due",
      name: "Payment Due Reminder",
      type: "system_alert",
      defaultChannels: {
        inApp: true,
        email: true,
        push: false
      },
      messageTemplate: "ðŸ’° Payment due: PKR {{amount}} to {{supplierName}} â€” Due: {{dueDate}}",
      variables: ["amount", "supplierName", "dueDate"]
    }];
    s55c.json({
      success: true,
      data: {
        templates: wq2x
      }
    });
  } catch (sb62ut) {
    console.error("Get templates error:", sb62ut);
    s55c.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// ============================================================================
// PATCH /api/notifications/templates/:id - Edit a template (Admin only)
// Body: { messageTemplate?, defaultChannels? }
// ============================================================================
exports.updateTemplate = async (dr916, k3rim) => {
  try {
    const {
      id: kyb6
    } = dr916.params;
    const {
      messageTemplate: ax8p1,
      defaultChannels: d6d08
    } = dr916.body;

    // Validate template ID exists
    const do09u6 = ["low_stock", "order_confirmed", "task_assigned", "payment_due"];
    if (!do09u6.includes(kyb6)) {
      return k3rim.status(404).json({
        success: false,
        message: `Template "${kyb6}" not found`,
        validTemplates: do09u6
      });
    }

    // In production: Update in database
    // For now, return the updated template structure
    const unldn = {
      id: kyb6,
      messageTemplate: ax8p1 || "[unchanged]",
      defaultChannels: d6d08 || {
        inApp: true,
        email: true,
        push: false
      },
      updatedAt: new Date().toISOString()
    };

    // Optional: Log to audit trail
    await kb6h96.create({
      userId: dr916.user.userId,
      action: "UPDATE",
      collectionName: "notification_templates",
      documentId: kyb6,
      newValue: unldn,
      ipAddress: dr916.ip,
      userAgent: dr916.get("User-Agent")
    }).catch(rkkw => console.warn("âš ï¸ Audit log failed:", rkkw.message));
    k3rim.json({
      success: true,
      message: `Template "${kyb6}" updated`,
      data: {
        template: unldn
      }
    });
  } catch (fib7d) {
    console.error("Update template error:", fib7d);
    k3rim.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// ============================================================================
// POST /api/notifications/schedule - Schedule a notification for future delivery
// Body: { userId, type, message, sendAt, channels?, relatedEntity? }
// ============================================================================
exports.scheduleNotification = async (zrh5bt, s62mux) => {
  try {
    const {
      userId: nngp9h,
      type: x865,
      message: waud59,
      sendAt: l3m0f,
      channels: lbppa,
      relatedEntity: n7k2c
    } = zrh5bt.body;
    const t6pgb = zrh5bt.user.userId;

    // Validate target user exists and is active
    const s1b1c9 = await jh87n6.findById(nngp9h).select("_id status notificationPreferences");
    if (!s1b1c9 || s1b1c9.status !== "Active") {
      return s62mux.status(404).json({
        success: false,
        message: "Target user not found or inactive"
      });
    }

    // Validate sendAt is in the future
    const ddio = new Date(l3m0f);
    if (isNaN(ddio.getTime()) || ddio <= new Date()) {
      return s62mux.status(400).json({
        success: false,
        message: "sendAt must be a valid future datetime (ISO 8601)"
      });
    }

    // Default channels if not provided
    const z170 = {
      inApp: true,
      email: false,
      push: false
    };
    const lp9x48 = {
      ...z170,
      ...(lbppa || {})
    };

    // Create scheduled notification record
    const v3ok6 = await r6uc.create({
      userId: nngp9h,
      type: x865,
      message: waud59,
      relatedEntity: n7k2c || undefined,
      sendAt: ddio,
      timezone: zrh5bt.body.timezone || "Asia/Karachi",
      channels: lp9x48,
      scheduledBy: t6pgb,
      status: "pending",
      ...(zrh5bt.tenantId && {
        tenantId: zrh5bt.tenantId
      })
    });

    // Populate for response
    const yq44 = await r6uc.findById(v3ok6._id).populate("userId", "username email role").populate("scheduledBy", "username").lean();
    s62mux.status(201).json({
      success: true,
      message: `Notification scheduled for ${yq44.localSendAt}`,
      data: {
        scheduledNotification: yq44,
        willSendIn: Math.round((ddio - new Date()) / 1000 / 60) + " minutes"
      }
    });
  } catch (n2fd13) {
    console.error("Schedule notification error:", n2fd13);
    if (n2fd13.name === "ValidationError") {
      return s62mux.status(400).json({
        success: false,
        message: "Validation failed",
        errors: Object.values(n2fd13.errors).map(b59edl => b59edl.message)
      });
    }
    s62mux.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// ============================================================================
// DELETE /api/notifications/schedule/:id - Cancel a scheduled notification
// ============================================================================
exports.cancelScheduledNotification = async (zd2s, h2qn64) => {
  try {
    const {
      id: f76hp
    } = zd2s.params;
    const e3203 = zd2s.user.userId;
    const ct45 = await r6uc.findOneAndUpdate({
      _id: f76hp,
      scheduledBy: e3203,
      status: "pending"
    },
    // Only allow cancelling own pending schedules
    {
      $set: {
        status: "cancelled",
        cancelledAt: new Date()
      }
    }, {
      new: true
    }).lean();
    if (!ct45) {
      // Check if it exists but belongs to someone else or already processed
      const w64ao3 = await r6uc.findById(f76hp);
      if (!w64ao3) {
        return h2qn64.status(404).json({
          success: false,
          message: "Scheduled notification not found"
        });
      }
      if (w64ao3.status !== "pending") {
        return h2qn64.status(400).json({
          success: false,
          message: `Cannot cancel notification with status: ${w64ao3.status}`
        });
      }
      return h2qn64.status(403).json({
        success: false,
        message: "Not authorized to cancel this scheduled notification"
      });
    }
    h2qn64.json({
      success: true,
      message: "Scheduled notification cancelled",
      data: {
        id: ct45._id,
        status: "cancelled",
        cancelledAt: ct45.cancelledAt
      }
    });
  } catch (kpuckf) {
    console.error("Cancel scheduled notification error:", kpuckf);
    if (kpuckf.name === "CastError") {
      return h2qn64.status(400).json({
        success: false,
        message: "Invalid ID format"
      });
    }
    h2qn64.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// ============================================================================
// GET /api/notifications/schedule - List user's scheduled notifications
// Query: ?status=pending|sent|cancelled&page=1&limit=20
// ============================================================================
exports.listScheduledNotifications = async (b443xg, x9c0) => {
  try {
    const {
      page: dtgvg0 = 1,
      limit: c828y = 20,
      status: qt5vo
    } = b443xg.query;
    const w10j = b443xg.user.userId;
    const mh94a = {
      scheduledBy: w10j
    };
    cjb61q(b443xg, mh94a);
    if (qt5vo && ["pending", "sent", "cancelled", "failed"].includes(qt5vo)) {
      mh94a.status = qt5vo;
    }
    const jc0lj = await r6uc.find(mh94a).populate("userId", "username email").sort({
      sendAt: 1
    }).limit(parseInt(c828y)).skip((parseInt(dtgvg0) - 1) * parseInt(c828y)).lean();
    const kquj7u = await r6uc.countDocuments(mh94a);
    x9c0.json({
      success: true,
      data: {
        scheduledNotifications: jc0lj.map(hf99p => ({
          ...hf99p,
          localSendAt: new Date(hf99p.sendAt).toLocaleString("en-PK", {
            timeZone: hf99p.timezone
          })
        })),
        pagination: {
          currentPage: parseInt(dtgvg0),
          totalPages: Math.ceil(kquj7u / c828y),
          totalItems: kquj7u,
          itemsPerPage: parseInt(c828y)
        }
      }
    });
  } catch (ya3qq8) {
    console.error("List scheduled notifications error:", ya3qq8);
    x9c0.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// ============================================================================
// INTERNAL: Scheduler Worker - Process due notifications (call via cron job)
// POST /api/notifications/schedule/process-due (internal secret auth)
// ============================================================================
exports.processDueScheduledNotifications = async (i22nn4, tr526b) => {
  try {
    const sge0f1 = new Date();
    const p7t0 = 5; // Process notifications due within next 5 mins

    // Find pending notifications that are due
    const v694a = await r6uc.find({
      status: "pending",
      sendAt: {
        $lte: new Date(sge0f1.getTime() + p7t0 * 60 * 1000)
      }
    }).populate("userId", "username email notificationPreferences").lean();
    if (!v694a.length) {
      return tr526b.json({
        success: true,
        message: "No scheduled notifications due",
        data: {
          processedCount: 0,
          dueCount: 0
        }
      });
    }
    let w8kz7p = 0;
    let bq1kh6 = 0;
    for (const h8p8bx of v694a) {
      try {
        // Check user preferences before sending
        const fzt9zc = h8p8bx.userId?.notificationPreferences || {};
        const ky05k = fzt9zc[h8p8bx.type] || {};

        // Skip if all channels are disabled in preferences
        const gn14p6 = h8p8bx.channels.inApp && ky05k.inApp !== false;
        const ni7r8y = h8p8bx.channels.email && ky05k.email;
        if (!gn14p6 && !ni7r8y && !h8p8bx.channels.push) {
          await r6uc.findByIdAndUpdate(h8p8bx._id, {
            status: "cancelled",
            failureReason: "User disabled notification channels"
          });
          bq1kh6++;
          continue;
        }

        // Create actual notification record (in-app)
        if (gn14p6) {
          await dtf3.create({
            userId: h8p8bx.userId._id,
            type: h8p8bx.type,
            message: h8p8bx.message,
            relatedEntity: h8p8bx.relatedEntity,
            isRead: false,
            scheduledFrom: h8p8bx._id
          });
        }

        // TODO: Add email/push sending logic here using your email/push service

        // Emit via WebSocket if available
        if (global.io && gn14p6) {
          global.io.to(`user:${h8p8bx.userId._id}`).emit("notification:new", {
            _id: "scheduled-" + h8p8bx._id,
            type: h8p8bx.type,
            message: h8p8bx.message,
            isRead: false,
            createdAt: new Date(),
            isScheduled: true
          });
        }

        // Mark as sent
        await r6uc.findByIdAndUpdate(h8p8bx._id, {
          status: "sent",
          sentAt: new Date()
        });
        w8kz7p++;
      } catch (lx5t) {
        console.error(`Failed to process scheduled notification ${h8p8bx._id}:`, lx5t.message);
        await r6uc.findByIdAndUpdate(h8p8bx._id, {
          status: "failed",
          failureReason: lx5t.message
        });
        bq1kh6++;
      }
    }
    tr526b.json({
      success: true,
      message: `Processed ${w8kz7p} scheduled notifications (${bq1kh6} failed)`,
      data: {
        processedCount: w8kz7p,
        failedCount: bq1kh6,
        totalDue: v694a.length,
        processedAt: new Date().toISOString()
      }
    });
  } catch (nwb3u) {
    console.error("Process due scheduled notifications error:", nwb3u);
    tr526b.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};