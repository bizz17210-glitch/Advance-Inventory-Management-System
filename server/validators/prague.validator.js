// CRUD_Project/server/validators/customer.validator.js
const {
  body: v42jiv,
  param: mkr2,
  validationResult: p5y3m
} = require("express-validator");
const y86b00 = xbdwzu => {
  const b5qa = p5y3m(xbdwzu);
  if (!b5qa.isEmpty()) {
    return b5qa.array().map(hdszbz => ({
      field: hdszbz.path,
      message: hdszbz.msg
    }));
  }
  return null;
};
const a33n = [mkr2("id").isMongoId().withMessage("Invalid customer ID")];

// 🔹 Address validation
const h8o2i = [v42jiv("address.street").optional().trim().isLength({
  max: 200
}), v42jiv("address.city").optional().trim().isLength({
  max: 100
}), v42jiv("address.state").optional().trim().isLength({
  max: 100
}), v42jiv("address.zipCode").optional().trim().isLength({
  max: 20
}), v42jiv("address.country").optional().trim().isLength({
  max: 100
})];

// 🔹 Shared customer fields
const hqcl = [v42jiv("firstName").trim().isLength({
  min: 1,
  max: 100
}).withMessage("First name required (max 100 chars)"), v42jiv("lastName").trim().isLength({
  min: 1,
  max: 100
}).withMessage("Last name required (max 100 chars)"), v42jiv("email").optional().trim().normalizeEmail().isEmail().withMessage("Valid email required"), v42jiv("phone").optional().trim().matches(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/).withMessage("Valid phone required"), v42jiv("source").optional().isIn(["WhatsApp", "Shopify", "Manual", "Instagram", "Facebook", "Website"]).withMessage("Invalid source"), ...h8o2i];

// GET /api/customers - List (no body validation)
exports.listCustomersValidation = [];

// GET /api/customers/:id - Get details
exports.getCustomerValidation = [...a33n];

// POST /api/customers - Create
exports.createCustomerValidation = [...hqcl,
// At least email or phone required
v42jiv().custom((c872bq, {
  req: rjc5
}) => {
  if (!rjc5.body.email && !rjc5.body.phone) {
    throw new Error("Customer must have at least an email or phone number");
  }
  return true;
})];

// PUT /api/customers/:id - Update (all optional)
exports.updateCustomerValidation = [...a33n, v42jiv("firstName").optional().trim().isLength({
  min: 1,
  max: 100
}), v42jiv("lastName").optional().trim().isLength({
  min: 1,
  max: 100
}), v42jiv("email").optional().trim().normalizeEmail().isEmail(), v42jiv("phone").optional().trim().matches(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/), v42jiv("source").optional().isIn(["WhatsApp", "Shopify", "Manual", "Instagram", "Facebook", "Website"]), ...h8o2i];

// PATCH /api/customers/:id/segment - Manual segment override
exports.updateSegmentValidation = [...a33n, v42jiv("segment").isIn(["VIP", "New", "Regular", "Inactive"]).withMessage("Segment must be VIP, New, Regular, or Inactive"), v42jiv("reason").optional().trim().isLength({
  max: 500
})];

// DELETE /api/customers/:id - Soft delete/anonymize
exports.deleteCustomerValidation = [...a33n];

// GET /api/customers/analytics/segments - Analytics
exports.getSegmentAnalyticsValidation = [];

// ✅ Export error handler
exports.handleValidationErrors = (qw42o, en74, gpm4) => {
  const p0l6 = y86b00(qw42o);
  if (p0l6) return en74.status(400).json({
    success: false,
    message: "Validation failed",
    errors: p0l6
  });
  gpm4();
};