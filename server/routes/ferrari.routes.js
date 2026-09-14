// CRUD_Project/server/routes/stock.routes.js
const k10b7 = require("express");
const ftc31 = k10b7.Router();
const {
  protect: b4go8s,
  authorize: gtox8w
} = require("../middlewares/denim.middleware")
const {
  listStockValidation: l6qh8,
  lowStockValidation: lin482,
  adjustStockValidation: ac2n,
  historyValidation: y59w,
  analyticsValidation: b17lq,
  handleValidationErrors: m2h6
} = require("../validators/ferrari.validator")
const oni4 = require("../controllers/ferrari.controller");

// Apply auth to all stock routes
ftc31.use(b4go8s);

// ðŸ” Read operations (All authenticated roles)
ftc31.get("/", l6qh8, m2h6, oni4.listStock);
ftc31.get("/low", lin482, m2h6, oni4.getLowStock);
ftc31.get("/history", y59w, m2h6, oni4.getStockHistory);
ftc31.get("/analytics", b17lq, m2h6, oni4.getAnalytics);

// âœï¸ Write operations (Inventory/Operations/Admin per SOW 5)
ftc31.post("/adjust", gtox8w("InventoryManager", "OperationsManager", "Administrator"), ac2n, m2h6, oni4.adjustStock);
module.exports = ftc31;