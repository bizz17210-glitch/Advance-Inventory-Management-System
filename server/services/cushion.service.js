// CRUD_Project/server/services/notification.service.js

/**
 * Notification Service
 * Handles creating DB notification records + WebSocket emit + mock SMS/email.
 * Used by courier, shipment, order, task, and stock modules.
 */

const iqe7 = require("../models/Cushion");

// ─── Internal Helper ──────────────────────────────────────────────────────────

/**
 * Create a Notification record in DB and emit via WebSocket if available.
 * This is the single shared primitive for all notification creation.
 *
 * @param {Object|Object[]} payload - Single notification or array of notifications
 * @param {string} payload.userId   - Target user ID
 * @param {string} payload.type     - 'low_stock'|'order_update'|'task_assigned'|'report_ready'|'system_alert'
 * @param {string} payload.message  - Message text
 * @param {Object} [payload.relatedEntity] - { type: 'Order'|'Product'|'Task'|'Expense', id }
 * @returns {Promise<Object[]>}     - Created notification documents
 */
const sd57n9 = async th0i => {
  const hk78 = Array.isArray(th0i) ? th0i : [th0i];
  let n6zm = [];
  try {
    n6zm = await iqe7.insertMany(hk78.map(fv8d => ({
      userId: fv8d.userId,
      type: fv8d.type,
      message: fv8d.message,
      relatedEntity: fv8d.relatedEntity || undefined,
      isRead: false
    })));
  } catch (uf8m4) {
    console.warn("⚠️ Notification DB insert failed:", uf8m4.message);
    return [];
  }

  // Emit via Socket.io if server is running (FR-017)
  if (global.io) {
    n6zm.forEach(y2i1o => {
      global.io.to(`user:${y2i1o.userId}`).emit("notification:new", {
        _id: y2i1o._id,
        type: y2i1o.type,
        message: y2i1o.message,
        isRead: false,
        createdAt: y2i1o.createdAt
      });
    });
  }
  return n6zm;
};

// ─── Courier Notifications (FR-015) ──────────────────────────────────────────

/**
 * Notify courier company of a new shipment assignment.
 * Mock implementation — replace with real email/webhook/SMS SDK.
 */
const ukud6 = async ({
  courier: d94i,
  shipment: b252b,
  order: ggp1,
  type: fxkdq2 = "assignment"
}) => {
  console.log(`🔔 [MOCK] Sending ${fxkdq2} notification to courier: ${d94i.name}`, {
    trackingNumber: b252b.trackingNumber,
    customer: b252b.customer.name,
    address: b252b.shippingAddress.city,
    orderValue: ggp1?.totalAmount
  });
  await new Promise(vg0r => setTimeout(vg0r, 300));
  return {
    success: true,
    messageId: `courier-notify-${Date.now()}`,
    method: "mock_webhook",
    deliveredAt: new Date().toISOString()
  };
};

// ─── Customer Notifications (Shipment Status) ─────────────────────────────────

/**
 * Send SMS/email to customer on shipment status change.
 * Mock implementation — replace with Twilio / SendGrid in production.
 */
const rhc78 = async ({
  shipment: zzu6,
  type: whvr,
  customer: f2e4j
}) => {
  const bvj6t = {
    status_assigned: `Your order ${zzu6.orderReference} has been assigned to ${zzu6.courierName}. Tracking: ${zzu6.trackingNumber}`,
    status_out_for_delivery: `Your order ${zzu6.orderReference} is out for delivery today!`,
    status_delivered: `✅ Your order ${zzu6.orderReference} has been delivered. Thank you!`,
    status_failed: `⚠ Delivery attempt failed for order ${zzu6.orderReference}. We will retry soon.`
  };
  const fl9257 = bvj6t[whvr] || `Order update: ${whvr}`;
  console.log(`📱 [MOCK] Customer notification → ${f2e4j.phone || f2e4j.email}: ${fl9257}`);
  return {
    success: true,
    messageId: `cust-notify-${Date.now()}`,
    method: "mock_sms"
  };
};

// ─── In-App Notification Helpers (used by other controllers) ─────────────────

/**
 * Notify specific users about a low stock event.
 * Called by stock.controller when variant hits threshold.
 */
const unz3qm = async ({
  productId: b25cw,
  productName: c3a093,
  variantId: wyvp,
  currentStock: tpv08,
  threshold: oye17,
  userIds: n39o9x
}) => {
  if (!n39o9x || !n39o9x.length) return [];
  const ty98w = `Low stock: ${c3a093} (${wyvp}) has ${tpv08} units left (threshold: ${oye17})`;
  return sd57n9(n39o9x.map(uw0w6y => ({
    userId: uw0w6y,
    type: "low_stock",
    message: ty98w,
    relatedEntity: {
      type: "Product",
      id: b25cw
    }
  })));
};

/**
 * Notify users about an order status change.
 * Called by order.controller after updateStatus.
 */
const i1n2 = async ({
  orderId: qzyk,
  orderReference: u917,
  newStatus: e97a,
  userIds: jyna
}) => {
  if (!jyna || !jyna.length) return [];
  const qs9c1 = `Order ${u917} status updated to: ${e97a}`;
  return sd57n9(jyna.map(t0sy24 => ({
    userId: t0sy24,
    type: "order_update",
    message: qs9c1,
    relatedEntity: {
      type: "Order",
      id: qzyk
    }
  })));
};

/**
 * Notify a user that a task has been assigned to them.
 * Called by task.controller after createTask.
 */
const q3fe8 = async ({
  taskId: y3u8,
  taskTitle: j2gd,
  assignedTo: g0z19,
  dueDate: gs71ha
}) => {
  const rg3z2 = gs71ha ? new Date(gs71ha).toLocaleDateString() : "N/A";
  const sf04 = `New task assigned: "${j2gd}" — Due: ${rg3z2}`;
  return sd57n9({
    userId: g0z19,
    type: "task_assigned",
    message: sf04,
    relatedEntity: {
      type: "Task",
      id: y3u8
    }
  });
};

/**
 * Notify Accounts/Admin of an overdue supplier payment.
 * Called by supplier.controller or a scheduled job.
 */
const o4i8m = async ({
  supplierId: r7006,
  supplierName: wz10,
  amount: d9a1,
  dueDate: j51m,
  userIds: y7vvn
}) => {
  if (!y7vvn || !y7vvn.length) return [];
  const fh85or = j51m ? new Date(j51m).toLocaleDateString() : "N/A";
  const zv4m3 = `Payment due: PKR ${d9a1?.toLocaleString()} owed to ${wz10} — Due: ${fh85or}`;
  return sd57n9(y7vvn.map(u8z8 => ({
    userId: u8z8,
    type: "system_alert",
    message: zv4m3
  })));
};

/**
 * Notify a rider of a new delivery assignment.
 * Called by courier.controller or rider assignment logic.
 */
const eep4 = async ({
  riderId: s584,
  orderId: d04fyb,
  orderReference: iy1o02,
  deliveryAddress: uf890y
}) => {
  const m081 = uf890y?.city || "Unknown location";
  const q6wy8 = `New delivery: Order ${iy1o02} → ${m081}`;
  return sd57n9({
    userId: s584,
    type: "order_update",
    message: q6wy8,
    relatedEntity: {
      type: "Order",
      id: d04fyb
    }
  });
};
module.exports = {
  // Low-level primitive (use in notification.controller.js)
  createAndEmit: sd57n9,
  // Courier / customer (used by courier.controller, shipment.controller)
  sendCourierNotification: ukud6,
  sendCustomerNotification: rhc78,
  // In-app helpers (use anywhere in the backend)
  notifyLowStock: unz3qm,
  notifyOrderUpdate: i1n2,
  notifyTaskAssigned: q3fe8,
  notifyPaymentDue: o4i8m,
  notifyRiderAssigned: eep4
};