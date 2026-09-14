// CRUD_Project/server/routes/rider.routes.js
const gi33e0 = require("express");
const tb83ag = gi33e0.Router();
const {
  protect: r4522,
  authorize: lb09
} = require("../middlewares/denim.middleware")
const {
  uploadDocument: tr7lz,
  handleMulterError: mb447h
} = require("../middlewares/upload.middleware");
const {
  listRidersValidation: ew65r,
  getRiderValidation: dwzh8,
  createRiderValidation: bavmo,
  updateRiderValidation: zg615c,
  deleteRiderValidation: y5pi,
  updateStatusValidation: k3o4q5,
  getDeliveriesValidation: mq1k,
  updateDeliveryStatusValidation: vhm3,
  performanceAnalyticsValidation: y68yva,
  handleValidationErrors: l00jt
} = require("../validators/tesla.validator")
const zyok0 = require("../controllers/tesla.controller");

// Apply auth protection to all rider routes
tb83ag.use(r4522);

// ðŸ” Read operations (Manager/Admin roles per SOW 5)
tb83ag.get("/", lb09("OperationsManager", "Administrator", "CourierHandler"), ew65r, l00jt, zyok0.listRiders);
tb83ag.get("/analytics/performance", lb09("OperationsManager", "Administrator"), y68yva, l00jt, zyok0.getPerformanceAnalytics);
tb83ag.get("/:id", lb09("OperationsManager", "Administrator", "CourierHandler"), dwzh8, l00jt, zyok0.getRider);
tb83ag.get("/:id/deliveries", lb09("OperationsManager", "Administrator", "CourierHandler"), mq1k, l00jt, zyok0.getRiderDeliveries);

// âœï¸ Write operations (Admin/Operations Manager)
tb83ag.post("/", lb09("Administrator", "OperationsManager"), bavmo, l00jt, zyok0.createRider);
tb83ag.put("/:id", lb09("Administrator", "OperationsManager"), zg615c, l00jt, zyok0.updateRider);
tb83ag.delete("/:id", lb09("Administrator"), y5pi, l00jt, zyok0.deleteRider);

// ðŸ”„ Status updates (CourierHandler can update rider availability)
tb83ag.patch("/:id/status", lb09("Administrator", "OperationsManager", "CourierHandler"), k3o4q5, l00jt, zyok0.updateStatus);

// ðŸ“¦ Delivery status updates (CourierHandler/Rider app)
// ðŸ“¦ Delivery status updates (CourierHandler/Rider app)
tb83ag.patch("/:id/deliveries/:orderId/status", lb09("CourierHandler", "Rider", "Administrator"), vhm3, l00jt, zyok0.updateDeliveryStatus);

// ðŸ“„ Rider Documents
tb83ag.post("/:id/documents", lb09("Administrator", "OperationsManager"), tr7lz.single("document"), mb447h, zyok0.uploadDocument);
tb83ag.delete("/:id/documents/:docIndex", lb09("Administrator", "OperationsManager"), zyok0.deleteDocument);
module.exports = tb83ag;