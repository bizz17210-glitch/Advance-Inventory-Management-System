// CRUD_Project/server/routes/notification.routes.js
const i10k = require("express");
const z48efo = i10k.Router();
const {
  protect: e52221,
  authorize: m3751b
} = require("../middlewares/denim.middleware")
const uj8l = require("../controllers/cushion.controller")
const {
  listNotificationsValidation: og1aq6,
  unreadCountValidation: k3719,
  markAsReadValidation: eb414i,
  markAllAsReadValidation: yjqp4d,
  deleteNotificationValidation: h5z39,
  clearAllValidation: ccl4q,
  sendNotificationValidation: d91r86,
  getPreferencesValidation: hm17,
  updatePreferencesValidation: gyrq2m,
  getTemplatesValidation: y51gcs,
  updateTemplateValidation: n5ml,
  scheduleNotificationValidation: i18e,
  cancelScheduledNotificationValidation: j4e7fc,
  listScheduledNotificationsValidation: q0ed3,
  broadcastValidation: hg7k1,
  getHistoryValidation: w4l2c,
  triggerLowStockValidation: pixo6x,
  triggerOrderStatusValidation: t4g1rg,
  triggerTaskAssignedValidation: a328a,
  triggerPaymentDueValidation: rj3v,
  triggerRiderAssignedValidation: w7z9g,
  handleValidationErrors: em5u0,
  processDueScheduledValidation: po13ux
} = require("../validators/cushion.validator")

// ============================================================================
// INTERNAL TRIGGER ROUTES
// These MUST be defined BEFORE router.use(protect) because they are called
// server-to-server by other modules (no user JWT token).
// Protected by internal secret header instead.
// ============================================================================
const l90i65 = (aymf8l, yf6s1, zbd4cm) => {
  const bcy3x = aymf8l.headers["x-internal-secret"];
  const n8a0 = process.env.INTERNAL_API_SECRET || "nexus-internal-secret";
  if (bcy3x !== n8a0) {
    return yf6s1.status(403).json({
      success: false,
      message: "Access denied. Invalid internal secret."
    });
  }
  zbd4cm();
};
z48efo.post("/trigger/low-stock", l90i65, pixo6x, em5u0, uj8l.triggerLowStock);
z48efo.post("/trigger/order-status", l90i65, t4g1rg, em5u0, uj8l.triggerOrderStatus);
z48efo.post("/trigger/task-assigned", l90i65, a328a, em5u0, uj8l.triggerTaskAssigned);
z48efo.post("/trigger/payment-due", l90i65, rj3v, em5u0, uj8l.triggerPaymentDue);
z48efo.post("/trigger/rider-assigned", l90i65, w7z9g, em5u0, uj8l.triggerRiderAssigned);

// ============================================================================
// ALL ROUTES BELOW REQUIRE JWT AUTHENTICATION
// ============================================================================
z48efo.use(e52221);

// â”€â”€â”€ Read Operations (Any authenticated user) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// GET /api/notifications
// Get current user's notifications. Filters: ?read=true|false&type=low_stock|...
z48efo.get("/", og1aq6, em5u0, uj8l.listNotifications);

// GET /api/notifications/unread-count
// Returns count for the bell badge in UI header
z48efo.get("/unread-count", k3719, em5u0, uj8l.getUnreadCount);

// GET /api/notifications/preferences
// Get current user's in-app / email toggle preferences
z48efo.get("/preferences", hm17, em5u0, uj8l.getPreferences);

// â”€â”€â”€ Admin / Manager Only Operations â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// GET /api/notifications/history
// Full notification log across all users (Admin/OperationsManager)
z48efo.get("/history", m3751b("Administrator", "OperationsManager"), w4l2c, em5u0, uj8l.getHistory);

// POST /api/notifications/send
// Manually send a notification to a specific user or all users of a role
z48efo.post("/send", m3751b("Administrator", "OperationsManager"), d91r86, em5u0, uj8l.sendNotification);

// POST /api/notifications/broadcast
// Broadcast a notification to all users or all users of a given role
z48efo.post("/broadcast", m3751b("Administrator"), hg7k1, em5u0, uj8l.broadcast);

// â”€â”€â”€ Write Operations (Any authenticated user â€” own notifications only) â”€â”€â”€â”€â”€â”€â”€

// PATCH /api/notifications/read-all
// MUST come before /:id routes to avoid "read-all" being treated as an ID
z48efo.patch("/read-all", yjqp4d, em5u0, uj8l.markAllAsRead);

// DELETE /api/notifications/clear-all
// MUST come before /:id routes
z48efo.delete("/clear-all", ccl4q, em5u0, uj8l.clearAll);

// PATCH /api/notifications/preferences
// Update current user's notification type toggles
z48efo.patch("/preferences", gyrq2m, em5u0, uj8l.updatePreferences);

// â”€â”€â”€ Template Management (Admin only) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// GET /api/notifications/templates
z48efo.get("/templates", m3751b("Administrator", "OperationsManager"), y51gcs, em5u0, uj8l.getTemplates);

// PATCH /api/notifications/templates/:id
z48efo.patch("/templates/:id", m3751b("Administrator"), n5ml, em5u0, uj8l.updateTemplate);

// PATCH /api/notifications/:id/read
z48efo.patch("/:id/read", eb414i, em5u0, uj8l.markAsRead);

// DELETE /api/notifications/:id
z48efo.delete("/:id", h5z39, em5u0, uj8l.deleteNotification);

// â”€â”€â”€ Scheduled Notifications â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// GET /api/notifications/schedule - List user's scheduled notifications
z48efo.get("/schedule", q0ed3, em5u0, uj8l.listScheduledNotifications);

// POST /api/notifications/schedule - Schedule a new notification
z48efo.post("/schedule", m3751b("Administrator", "OperationsManager"), i18e, em5u0, uj8l.scheduleNotification);

// DELETE /api/notifications/schedule/:id - Cancel a scheduled notification
z48efo.delete("/schedule/:id", j4e7fc, em5u0, uj8l.cancelScheduledNotification);

// â”€â”€â”€ Internal: Scheduler Worker (cron job calls this) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

z48efo.post("/schedule/process-due", l90i65,
// Uses the same internalAuth middleware defined earlier
po13ux, em5u0, uj8l.processDueScheduledNotifications);
module.exports = z48efo;