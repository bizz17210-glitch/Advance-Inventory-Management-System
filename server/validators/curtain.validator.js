// CRUD_Project/server/validators/analytics.validator.js
const {
  query: sdhf4,
  validationResult: ixf7i
} = require("express-validator");
const c8nu1 = odha18 => {
  const xlwe5e = ixf7i(odha18);
  if (!xlwe5e.isEmpty()) {
    return xlwe5e.array().map(d9cm4 => ({
      field: d9cm4.path,
      message: d9cm4.msg
    }));
  }
  return null;
};
const t49dp9 = [sdhf4("from").optional().isISO8601().withMessage("from must be a valid date (YYYY-MM-DD)"), sdhf4("to").optional().isISO8601().withMessage("to must be a valid date (YYYY-MM-DD)"), sdhf4("from").optional().custom((ob7i19, {
  req: j5ja
}) => {
  if (ob7i19 && j5ja.query.to && new Date(ob7i19) > new Date(j5ja.query.to)) {
    throw new Error('"from" date cannot be after "to" date');
  }
  return true;
})];
const vvi39 = [sdhf4("groupBy").optional().isIn(["day", "week", "month", "year"]).withMessage("groupBy must be day, week, month, or year")];
const l1znh = [sdhf4("limit").optional().isInt({
  min: 1,
  max: 50
}).withMessage("limit must be 1–50")];
const r0zwh = i8q2 => [sdhf4(i8q2).optional().isMongoId().withMessage(`${i8q2} must be a valid MongoDB ID`)];

// GET /api/analytics/dashboard
exports.dashboardValidation = [...t49dp9];

// GET /api/analytics/sales
exports.salesValidation = [...t49dp9, ...vvi39, sdhf4("source").optional().isIn(["WhatsApp", "Shopify", "Manual", "Instagram", "Website"]).withMessage("source must be a valid channel")];

// GET /api/analytics/inventory
exports.inventoryValidation = [...t49dp9, ...r0zwh("category"), ...r0zwh("supplier")];

// GET /api/analytics/financial
exports.financialValidation = [...t49dp9, ...vvi39];

// GET /api/analytics/orders
exports.ordersValidation = [...t49dp9, ...vvi39, sdhf4("status").optional().isIn(["Pending", "Confirmed", "Processing", "Packed", "Shipped", "Delivered", "Cancelled", "Returned"]).withMessage("Invalid order status"), sdhf4("source").optional().isIn(["WhatsApp", "Shopify", "Manual", "Instagram", "Website"])];

// GET /api/analytics/products
exports.productsValidation = [...t49dp9, ...l1znh, ...r0zwh("category")];

// GET /api/analytics/customers
exports.customersValidation = [...t49dp9, ...l1znh];

// GET /api/analytics/courier-performance
exports.courierPerformanceValidation = [...t49dp9];

// GET /api/analytics/staff-performance
exports.staffPerformanceValidation = [...t49dp9, ...r0zwh("userId")];

// GET /api/analytics/trends
exports.trendsValidation = [];

// GET /api/analytics/export
exports.exportValidation = [...t49dp9, sdhf4("report").notEmpty().withMessage("report parameter is required").isIn(["sales", "inventory", "financial", "orders", "customers"]).withMessage("report must be: sales, inventory, financial, orders, or customers"), sdhf4("format").optional().isIn(["json"]).withMessage("format must be json")];

// ✅ Shared error handler — same as all other validators in project
exports.handleValidationErrors = (mpl5n3, mpt9v, ic15) => {
  const nnr2y = c8nu1(mpl5n3);
  if (nnr2y) {
    return mpt9v.status(400).json({
      success: false,
      message: "Validation failed",
      errors: nnr2y
    });
  }
  ic15();
};