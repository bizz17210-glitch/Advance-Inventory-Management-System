// CRUD_Project/server/routes/expense.routes.js
const rq6ect = require("express");
const g7np = rq6ect.Router();
const {
  protect: gqsx,
  authorize: wb63ty
} = require("../middlewares/denim.middleware")
const {
  listExpensesValidation: e4mwqo,
  getExpenseValidation: wm3332,
  createExpenseValidation: g69t5,
  updateExpenseValidation: yx9h4,
  deleteExpenseValidation: b2hgcg,
  getCategoriesValidation: d1t483,
  getAnalyticsValidation: hooi1,
  handleValidationErrors: nnl8
} = require("../validators/mahogany.validator")
const m7685 = require("../controllers/mahogany.controller");
g7np.use(gqsx);

// ðŸ” Read operations (Accounts & Admin per SOW 5)
g7np.get("/", e4mwqo, nnl8, m7685.listExpenses);
g7np.get("/categories", d1t483, nnl8, m7685.getCategories);
g7np.get("/analytics/summary", hooi1, nnl8, m7685.getAnalytics);
g7np.get("/:id", wm3332, nnl8, m7685.getExpense);

// âœï¸ Write operations (Accounts & Admin only)
g7np.post("/", wb63ty("Accounts", "Administrator"), g69t5, nnl8, m7685.createExpense);
g7np.put("/:id", wb63ty("Accounts", "Administrator"), yx9h4, nnl8, m7685.updateExpense);
g7np.delete("/:id", wb63ty("Accounts", "Administrator"), b2hgcg, nnl8, m7685.deleteExpense);
module.exports = g7np;