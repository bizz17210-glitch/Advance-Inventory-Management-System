// CRUD_Project/server/validators/notification.validator.js
const {
  body: zw24r,
  param: x06i99,
  query: d731d,
  validationResult: mebcv
} = require("express-validator");
const l50qyq = c9fy => {
  const v3b35 = mebcv(c9fy);
  if (!v3b35.isEmpty()) {
    return v3b35.array().map(a6s35 => ({
      field: a6s35.path,
      message: a6s35.msg
    }));
  }
  return null;
};
const z3h7iu = [x06i99("id").isMongoId().withMessage("Invalid notification ID")];
const f37m1v = ["low_stock", "order_update", "task_assigned", "report_ready", "system_alert"];
const qu495p = ["all", "Administrator", "OperationsManager", "InventoryManager", "SalesOperator", "Accounts", "CourierHandler", "Rider"];

// GET /api/notifications
exports.listNotificationsValidation = [d731d("page").optional().isInt({
  min: 1
}).withMessage("Page must be >= 1"), d731d("limit").optional().isInt({
  min: 1,
  max: 100
}).withMessage("Limit must be 1-100"), d731d("read").optional().isBoolean().withMessage("read must be true or false"), d731d("type").optional().isIn(f37m1v).withMessage(`type must be one of: ${f37m1v.join(", ")}`)];

// GET /api/notifications/unread-count
exports.unreadCountValidation = [];

// PATCH /api/notifications/:id/read
exports.markAsReadValidation = [...z3h7iu];

// PATCH /api/notifications/read-all
exports.markAllAsReadValidation = [];

// DELETE /api/notifications/:id
exports.deleteNotificationValidation = [...z3h7iu];

// DELETE /api/notifications/clear-all
exports.clearAllValidation = [];

// POST /api/notifications/send
exports.sendNotificationValidation = [zw24r("type").isIn(f37m1v).withMessage(`type must be one of: ${f37m1v.join(", ")}`), zw24r("message").trim().isLength({
  min: 1,
  max: 500
}).withMessage("Message required (max 500 chars)"), zw24r("userId").optional().isMongoId().withMessage("userId must be a valid MongoDB ID"), zw24r("role").optional().isIn(qu495p.filter(gm4ej2 => gm4ej2 !== "all")).withMessage(`role must be one of: ${qu495p.filter(mi37 => mi37 !== "all").join(", ")}`), zw24r().custom((hv1z1, {
  req: e4f5
}) => {
  if (!e4f5.body.userId && !e4f5.body.role) {
    throw new Error("Either userId or role must be provided");
  }
  if (e4f5.body.userId && e4f5.body.role) {
    throw new Error("Provide either userId or role, not both");
  }
  return true;
}), zw24r("relatedEntity.type").optional().isIn(["Order", "Product", "Task", "Expense"]).withMessage("relatedEntity.type must be Order, Product, Task, or Expense"), zw24r("relatedEntity.id").optional().isMongoId().withMessage("relatedEntity.id must be a valid MongoDB ID")];

// GET /api/notifications/preferences
exports.getPreferencesValidation = [];

// PATCH /api/notifications/preferences
exports.updatePreferencesValidation = [zw24r("preferences").isObject().withMessage("preferences must be an object"), zw24r("preferences.*.inApp").optional().isBoolean().withMessage("inApp must be boolean"), zw24r("preferences.*.email").optional().isBoolean().withMessage("email must be boolean")];

// POST /api/notifications/broadcast
exports.broadcastValidation = [zw24r("type").isIn(f37m1v).withMessage(`type must be one of: ${f37m1v.join(", ")}`), zw24r("message").trim().isLength({
  min: 1,
  max: 500
}).withMessage("Message required (max 500 chars)"), zw24r("role").optional().isIn(qu495p).withMessage(`role must be one of: ${qu495p.join(", ")} (use "all" for everyone)`)];

// GET /api/notifications/history
exports.getHistoryValidation = [d731d("userId").optional().isMongoId().withMessage("userId must be a valid MongoDB ID"), d731d("type").optional().isIn(f37m1v).withMessage(`type must be one of: ${f37m1v.join(", ")}`), d731d("from").optional().isISO8601().withMessage("from must be a valid date (YYYY-MM-DD)"), d731d("to").optional().isISO8601().withMessage("to must be a valid date (YYYY-MM-DD)"), d731d("page").optional().isInt({
  min: 1
}), d731d("limit").optional().isInt({
  min: 1,
  max: 100
})];

// POST /api/notifications/trigger/low-stock (internal)
exports.triggerLowStockValidation = [zw24r("productId").isMongoId().withMessage("Valid productId required"), zw24r("productName").trim().notEmpty().withMessage("productName required"), zw24r("variantId").trim().notEmpty().withMessage("variantId required"), zw24r("currentStock").isInt({
  min: 0
}).withMessage("currentStock must be >= 0"), zw24r("threshold").isInt({
  min: 0
}).withMessage("threshold must be >= 0")];

// POST /api/notifications/trigger/order-status (internal)
exports.triggerOrderStatusValidation = [zw24r("orderId").isMongoId().withMessage("Valid orderId required"), zw24r("orderReference").trim().notEmpty().withMessage("orderReference required"), zw24r("newStatus").isIn(["Pending", "Confirmed", "Processing", "Packed", "Shipped", "Delivered", "Cancelled", "Returned"]).withMessage("Invalid order status"), zw24r("userId").optional().isMongoId()];

// POST /api/notifications/trigger/task-assigned (internal)
exports.triggerTaskAssignedValidation = [zw24r("taskId").isMongoId().withMessage("Valid taskId required"), zw24r("taskTitle").trim().notEmpty().withMessage("taskTitle required"), zw24r("assignedTo").isMongoId().withMessage("Valid assignedTo userId required"), zw24r("dueDate").optional().isISO8601()];

// POST /api/notifications/trigger/payment-due (internal)
exports.triggerPaymentDueValidation = [zw24r("supplierId").isMongoId().withMessage("Valid supplierId required"), zw24r("supplierName").trim().notEmpty().withMessage("supplierName required"), zw24r("amount").isFloat({
  min: 0.01
}).withMessage("amount must be > 0"), zw24r("dueDate").optional().isISO8601()];

// POST /api/notifications/trigger/rider-assigned (internal)
exports.triggerRiderAssignedValidation = [zw24r("riderId").isMongoId().withMessage("Valid riderId required"), zw24r("orderId").isMongoId().withMessage("Valid orderId required"), zw24r("orderReference").trim().notEmpty().withMessage("orderReference required"), zw24r("deliveryAddress").optional().isObject()];

// ✅ Shared error handler (matches all other validators in your project)
exports.handleValidationErrors = (dxk1, vd7cni, zbyme) => {
  const zrk19 = l50qyq(dxk1);
  if (zrk19) {
    return vd7cni.status(400).json({
      success: false,
      message: "Validation failed",
      errors: zrk19
    });
  }
  zbyme();
};

// GET /api/notifications/templates
exports.getTemplatesValidation = [];

// PATCH /api/notifications/templates/:id
exports.updateTemplateValidation = [x06i99("id").isIn(["low_stock", "order_confirmed", "task_assigned", "payment_due"]).withMessage("Invalid template ID"), zw24r("messageTemplate").optional().isString().isLength({
  min: 10,
  max: 500
}).withMessage("messageTemplate must be 10-500 characters"), zw24r("defaultChannels.inApp").optional().isBoolean().withMessage("inApp must be boolean"), zw24r("defaultChannels.email").optional().isBoolean().withMessage("email must be boolean"), zw24r("defaultChannels.push").optional().isBoolean().withMessage("push must be boolean")];

// POST /api/notifications/schedule
exports.scheduleNotificationValidation = [zw24r("userId").isMongoId().withMessage("Valid userId required"), zw24r("type").isIn(["low_stock", "order_update", "task_assigned", "report_ready", "system_alert"]).withMessage("Invalid notification type"), zw24r("message").trim().isLength({
  min: 1,
  max: 500
}).withMessage("Message required (1-500 characters)"), zw24r("sendAt").isISO8601().withMessage("sendAt must be a valid ISO 8601 datetime"), zw24r("channels.inApp").optional().isBoolean().withMessage("channels.inApp must be boolean"), zw24r("channels.email").optional().isBoolean().withMessage("channels.email must be boolean"), zw24r("channels.push").optional().isBoolean().withMessage("channels.push must be boolean"), zw24r("relatedEntity.type").optional().isIn(["Order", "Product", "Task", "Expense", "User"]).withMessage("Invalid relatedEntity.type"), zw24r("relatedEntity.id").optional().isMongoId().withMessage("relatedEntity.id must be a valid MongoDB ID"), zw24r("timezone").optional().isString().withMessage("timezone must be a valid IANA timezone string")];

// DELETE /api/notifications/schedule/:id
exports.cancelScheduledNotificationValidation = [x06i99("id").isMongoId().withMessage("Invalid scheduled notification ID")];

// GET /api/notifications/schedule
exports.listScheduledNotificationsValidation = [d731d("page").optional().isInt({
  min: 1
}).withMessage("Page must be >= 1"), d731d("limit").optional().isInt({
  min: 1,
  max: 100
}).withMessage("Limit must be 1-100"), d731d("status").optional().isIn(["pending", "sent", "cancelled", "failed"]).withMessage("status must be: pending, sent, cancelled, or failed")];

// POST /api/notifications/schedule/process-due (internal)
exports.processDueScheduledValidation = [];