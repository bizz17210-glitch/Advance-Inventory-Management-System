// CRUD_Project/server/routes/courier.routes.js
const mn1ap = require("express");
const ma8nv = mn1ap.Router();
const {
  protect: zef6,
  authorize: t4z1
} = require("../middlewares/denim.middleware")
const {
  listCouriersValidation: nvkd3,
  getCourierValidation: y88j,
  createCourierValidation: r66en,
  updateCourierValidation: cck27,
  testConnectionValidation: rway9,
  syncCourierValidation: dq7o,
  deleteCourierValidation: iay62z,
  handleValidationErrors: uy0miz
} = require("../validators/wallpaper.validator")
const vck03z = require("../controllers/wallpaper.controller");
ma8nv.use(zef6);

// ðŸ” Read operations
ma8nv.get("/", nvkd3, uy0miz, vck03z.listCouriers);
ma8nv.get("/analytics/performance", vck03z.getPerformanceAnalytics);
ma8nv.get("/:id", y88j, uy0miz, vck03z.getCourier);

// ðŸ”— API Integration (FR-016)
ma8nv.post("/:id/test-connection", t4z1("CourierHandler", "Administrator"), rway9, uy0miz, vck03z.testConnection);
ma8nv.post("/:id/sync", t4z1("CourierHandler", "OperationsManager", "Administrator"), dq7o, uy0miz, vck03z.syncCourier);

// ðŸšš Assignment & Fulfillment (FR-015)
ma8nv.post("/:id/assign", t4z1("CourierHandler", "OperationsManager", "Administrator"),
// Add validation for assign body if needed
vck03z.assignShipment);

// âœï¸ Write operations
ma8nv.post("/", t4z1("CourierHandler", "OperationsManager", "Administrator"), r66en, uy0miz, vck03z.createCourier);
ma8nv.put("/:id", t4z1("CourierHandler", "OperationsManager", "Administrator"), cck27, uy0miz, vck03z.updateCourier);
ma8nv.delete("/:id", t4z1("OperationsManager", "Administrator"), iay62z, uy0miz, vck03z.deleteCourier);
module.exports = ma8nv;