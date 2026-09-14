// CRUD_Project/server/validators/expense.validator.js
const {
  body: wxh541,
  param: p2gb54,
  query: thi2,
  validationResult: e14185
} = require("express-validator");
const pl2u9v = nwzod4 => {
  const bz71 = e14185(nwzod4);
  if (!bz71.isEmpty()) {
    return bz71.array().map(bl49 => ({
      field: bl49.path,
      message: bl49.msg
    }));
  }
  return null;
};
const yhc81 = [p2gb54("id").isMongoId().withMessage("Invalid expense ID")];

// const validCategories = [
//   "Shipping",
//   "Marketing",
//   "Utilities",
//   "Salaries",
//   "Supplies",
//   "Software",
//   "Other",
// ];

// 🔹 Shared expense fields
const tecr0 = [wxh541("date").isISO8601().withMessage("Valid date required (YYYY-MM-DD)"), wxh541("amount").isFloat({
  min: 0.01
}).withMessage("Amount must be > 0"), wxh541("category").isString().trim().isLength({
  min: 2,
  max: 50
}).withMessage("Category must be 2-50 characters"), wxh541("description").optional().trim().isLength({
  min: 3,
  max: 1000
}), wxh541("attachments").optional().isArray(), wxh541("attachments.*").isURL({
  protocols: ["http", "https"]
}).withMessage("Attachment must be a valid HTTP/HTTPS URL")];

// GET /api/expenses
exports.listExpensesValidation = [thi2("page").optional().isInt({
  min: 1
}), thi2("limit").optional().isInt({
  min: 1,
  max: 100
}), thi2("category").optional().isString().trim(), thi2("dateFrom").optional().isISO8601(), thi2("dateTo").optional().isISO8601(), thi2("status").optional().isIn(["Active", "Cancelled"])];

// GET /api/expenses/:id
exports.getExpenseValidation = [...yhc81];

// POST /api/expenses
exports.createExpenseValidation = [...tecr0];

// PUT /api/expenses/:id
exports.updateExpenseValidation = [...yhc81, wxh541("date").optional().isISO8601(), wxh541("amount").optional().isFloat({
  min: 0.01
}), wxh541("category").optional().isString().trim().isLength({
  min: 2,
  max: 50
}), wxh541("description").optional().trim().isLength({
  min: 3,
  max: 1000
}), wxh541("attachments").optional().isArray(), wxh541("attachments.*").isURL({
  protocols: ["http", "https"]
})];

// DELETE /api/expenses/:id (soft delete)
exports.deleteExpenseValidation = [...yhc81, wxh541("reason").optional().trim().isLength({
  max: 500
})];

// GET /api/expenses/categories
exports.getCategoriesValidation = [];

// GET /api/expenses/analytics/summary
exports.getAnalyticsValidation = [thi2("dateFrom").optional().isISO8601(), thi2("dateTo").optional().isISO8601(), thi2("groupBy").optional().isIn(["day", "month", "category"]).withMessage("groupBy must be day, month, or category")];

// ✅ Export error handler
exports.handleValidationErrors = (vzq68, h6oj, b56e3n) => {
  const dqd1j = pl2u9v(vzq68);
  if (dqd1j) return h6oj.status(400).json({
    success: false,
    message: "Validation failed",
    errors: dqd1j
  });
  b56e3n();
};