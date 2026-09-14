// CRUD_Project/server/validators/stock.validator.js
const {
  body: lz80yi,
  param: ut8rl4,
  query: hbli6,
  validationResult: ukjd3
} = require("express-validator");
const c68x = ir65 => {
  const y2e8 = ukjd3(ir65);
  if (!y2e8.isEmpty()) {
    return y2e8.array().map(svx2ur => ({
      field: svx2ur.path,
      message: svx2ur.msg
    }));
  }
  return null;
};
const c3ggm = [ut8rl4("productId").isMongoId().withMessage("Invalid product ID")];
const a8201 = [ut8rl4("variantId").trim().notEmpty().withMessage("Variant ID required")];

// 🔹 Shared adjustment validation
const y2nc71 = [lz80yi("productId").isMongoId().withMessage("Valid product ID required"), lz80yi("variantId").trim().notEmpty().withMessage("Variant ID required"), lz80yi("changeType").isIn(["Inbound", "Outbound", "Adjustment", "Return", "Damaged", "Audit"]).withMessage("Invalid change type"), lz80yi("quantityChange").isInt({
  min: -99999,
  max: 99999
}).withMessage("Quantity change required"), lz80yi("reason").trim().isLength({
  min: 3,
  max: 500
}).withMessage("Reason required (3-500 chars)"), lz80yi("reference").optional().trim().isLength({
  max: 100
})];

// GET /api/stock - List inventory
exports.listStockValidation = [hbli6("page").optional().isInt({
  min: 1
}), hbli6("limit").optional().isInt({
  min: 1,
  max: 100
}), hbli6("category").optional().isMongoId(), hbli6("supplier").optional().isMongoId(), hbli6("inStock").optional().isBoolean()];

// GET /api/stock/low - Low stock alerts
exports.lowStockValidation = [hbli6("page").optional().isInt({
  min: 1
}), hbli6("limit").optional().isInt({
  min: 1,
  max: 50
}), hbli6("customThreshold").optional().isFloat({
  min: 0
})];

// POST /api/stock/adjust - Manual adjustment
exports.adjustStockValidation = [...y2nc71];

// GET /api/stock/history - Audit trail
exports.historyValidation = [hbli6("page").optional().isInt({
  min: 1
}), hbli6("limit").optional().isInt({
  min: 1,
  max: 100
}), hbli6("changeType").optional().isIn(["Inbound", "Outbound", "Adjustment", "Return", "Damaged", "Audit"]), hbli6("dateFrom").optional().isISO8601(), hbli6("dateTo").optional().isISO8601(), hbli6("productId").optional().isMongoId()];

// GET /api/stock/analytics - Dashboard KPIs
exports.analyticsValidation = [];

// ✅ Export error handler
exports.handleValidationErrors = (b6803, g028bv, a3dh86) => {
  const ug32 = c68x(b6803);
  if (ug32) return g028bv.status(400).json({
    success: false,
    message: "Validation failed",
    errors: ug32
  });
  a3dh86();
};