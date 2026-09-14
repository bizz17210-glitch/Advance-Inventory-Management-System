// CRUD_Project/server/validators/rider.validator.js
const {
  body: hzuq,
  param: mn1h0d,
  query: kpvvod,
  validationResult: r490r6
} = require("express-validator");

// ============================================================================
// Validation Rules
// ============================================================================

const zduc = [kpvvod("page").optional().isInt({
  min: 1
}).withMessage("Page must be a positive integer"), kpvvod("limit").optional().isInt({
  min: 1,
  max: 100
}).withMessage("Limit must be between 1 and 100"), kpvvod("status").optional().isIn(["Active", "Inactive", "OnDelivery", "OnLeave", "Suspended"]), kpvvod("zone").optional().isString().trim(), kpvvod("search").optional().isString().trim(), kpvvod("available").optional().isBoolean()];
const asuy = [mn1h0d("id").isMongoId().withMessage("Invalid rider ID format")];
const o87g6u = [hzuq("userId").isMongoId().withMessage("Valid user ID required"), hzuq("fullName").notEmpty().trim().isLength({
  min: 2,
  max: 100
}).withMessage("Full name must be 2-100 characters"), hzuq("phone").notEmpty().trim().matches(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/).withMessage("Invalid phone format"), hzuq("email").optional().isEmail().normalizeEmail(), hzuq("cnic").notEmpty().trim().isLength({
  min: 13,
  max: 15
}).withMessage("CNIC must be 13-15 characters"), hzuq("licenseNumber").notEmpty().trim().withMessage("License number required"), hzuq("licenseExpiry").isISO8601().withMessage("License expiry must be a valid date"), hzuq("vehicle.type").isIn(["Motorcycle", "Bicycle", "Van", "Car"]).withMessage("Invalid vehicle type"), hzuq("vehicle.registrationNumber").notEmpty().trim().withMessage("Vehicle registration required"), hzuq("assignedZone").notEmpty().trim().withMessage("Assigned zone required"), hzuq("serviceCities").optional().isArray(), hzuq("serviceCities.*").optional().isString().trim(), hzuq("paymentMethod").optional().isIn(["BankTransfer", "JazzCash", "EasyPaisa", "Cash"]), hzuq("bankDetails").optional().isObject()];
const uxd7 = [mn1h0d("id").isMongoId().withMessage("Invalid rider ID format"), hzuq("fullName").optional().trim().isLength({
  min: 2,
  max: 100
}), hzuq("phone").optional().trim().matches(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/), hzuq("email").optional().isEmail().normalizeEmail(), hzuq("licenseNumber").optional().trim(), hzuq("licenseExpiry").optional().isISO8601(), hzuq("vehicle").optional().isObject(), hzuq("assignedZone").optional().trim(), hzuq("serviceCities").optional().isArray(), hzuq("serviceCities.*").optional().isString().trim(), hzuq("paymentMethod").optional().isIn(["BankTransfer", "JazzCash", "EasyPaisa", "Cash"]), hzuq("bankDetails").optional().isObject(), hzuq("documents").optional().isArray(), hzuq("fcmToken").optional().trim()];
const mv275h = [mn1h0d("id").isMongoId().withMessage("Invalid rider ID format"), hzuq("reason").optional().trim().isLength({
  max: 500
})];
const ct45 = [mn1h0d("id").isMongoId().withMessage("Invalid rider ID format"), hzuq("status").isIn(["Active", "Inactive", "OnDelivery", "OnLeave", "Suspended"]).withMessage("Invalid status value"), hzuq("reason").optional().trim().isLength({
  max: 500
})];
const vn2vyq = [mn1h0d("id").isMongoId().withMessage("Invalid rider ID format"), kpvvod("page").optional().isInt({
  min: 1
}), kpvvod("limit").optional().isInt({
  min: 1,
  max: 100
}), kpvvod("status").optional().isIn(["assigned", "picked_up", "in_transit", "out_for_delivery", "delivered", "failed", "returned"]), kpvvod("dateFrom").optional().isISO8601(), kpvvod("dateTo").optional().isISO8601()];
const own8 = [mn1h0d("id").isMongoId().withMessage("Invalid rider ID format"), mn1h0d("orderId").isMongoId().withMessage("Invalid order ID format"), hzuq("status").isIn(["picked_up", "in_transit", "out_for_delivery", "delivered", "failed", "returned"]).withMessage("Invalid delivery status"), hzuq("location").optional().trim(), hzuq("notes").optional().trim().isLength({
  max: 500
}), hzuq("proofOfDelivery").optional().isURL().withMessage("Proof of delivery must be a valid URL")];
const bzb6 = [kpvvod("dateFrom").optional().isISO8601(), kpvvod("dateTo").optional().isISO8601(), kpvvod("groupBy").optional().isIn(["rider", "day", "zone"]), kpvvod("zone").optional().trim()];

// ============================================================================
// Error Handler - MUST be defined BEFORE module.exports
// ============================================================================
const d70cw = (le3se, h0r27w, e1q7) => {
  const kp33sd = r490r6(le3se);
  if (!kp33sd.isEmpty()) {
    return h0r27w.status(400).json({
      success: false,
      message: "Validation failed",
      errors: kp33sd.array().map(sgxkp => ({
        field: sgxkp.path,
        message: sgxkp.msg
      }))
    });
  }
  e1q7();
};

// ============================================================================
// Exports - SINGLE module.exports object (NO mixed exports.*)
// ============================================================================
module.exports = {
  listRidersValidation: zduc,
  getRiderValidation: asuy,
  createRiderValidation: o87g6u,
  updateRiderValidation: uxd7,
  deleteRiderValidation: mv275h,
  updateStatusValidation: ct45,
  getDeliveriesValidation: vn2vyq,
  updateDeliveryStatusValidation: own8,
  performanceAnalyticsValidation: bzb6,
  handleValidationErrors: d70cw
};