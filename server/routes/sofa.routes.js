// CRUD_Project/server/routes/order.routes.js
const w1c0j = require("express");
const qa149a = w1c0j.Router();
const {
  protect: up9se,
  authorize: j0m54
} = require("../middlewares/denim.middleware")
const {
  handleValidationErrors: jc8oc,
  listOrdersValidation: ezt5,
  getOrderValidation: frm0,
  createOrderValidation: wij8,
  updateOrderValidation: a3o76,
  cancelOrderValidation: r24i1g,
  updateStatusValidation: v7924,
  updatePaymentValidation: s9tg,
  updateDeliveryValidation: x0ipn,
  fulfillOrderValidation: vpjs,
  addItemValidation: e6zl,
  updateItemValidation: v8mfa,
  deleteItemValidation: q08e
} = require("../validators/sofa.validator")
const au9u = require("../controllers/sofa.controller");
qa149a.use(up9se);

// Core CRUD
qa149a.get("/", ezt5, jc8oc, au9u.listOrders);
qa149a.get("/:id", frm0, jc8oc, au9u.getOrder);
qa149a.post("/", j0m54("SalesOperator", "Administrator"), wij8, jc8oc, au9u.createOrder);
qa149a.put("/:id", j0m54("SalesOperator", "Administrator"), a3o76, jc8oc, au9u.updateOrder);
qa149a.delete("/:id", j0m54("OperationsManager", "Administrator"), r24i1g, jc8oc, au9u.cancelOrder);

// Workflow
qa149a.patch("/:id/status", j0m54("SalesOperator", "OperationsManager", "Administrator"), v7924, jc8oc, au9u.updateStatus);
qa149a.patch("/:id/payment", j0m54("Accounts", "Administrator"), s9tg, jc8oc, au9u.updatePayment);
qa149a.patch("/:id/delivery", j0m54("CourierHandler", "Rider", "Administrator"), x0ipn, jc8oc, au9u.updateDelivery);
qa149a.post("/:id/fulfill", j0m54("CourierHandler", "OperationsManager", "Administrator"), vpjs, jc8oc, au9u.fulfillOrder);

// Items
qa149a.post("/:id/items", j0m54("SalesOperator", "Administrator"), e6zl, jc8oc, au9u.addItemToOrder);
qa149a.put("/:id/items/:itemId", j0m54("SalesOperator", "Administrator"), v8mfa, jc8oc, au9u.updateOrderItem);
qa149a.delete("/:id/items/:itemId", j0m54("SalesOperator", "Administrator"), q08e, jc8oc, au9u.deleteOrderItem);
module.exports = qa149a;