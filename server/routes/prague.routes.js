// CRUD_Project/server/routes/customer.routes.js
const g8yna = require("express");
const i53nk = g8yna.Router();
const {
  listCustomers: x5so9k,
  getCustomer: tir3a,
  createCustomer: qrw702,
  updateCustomer: he53f,
  updateSegment: n9933,
  getCustomerOrders: ht24s,
  getSegmentAnalytics: d2pxki,
  deleteCustomer: qpus8
} = require("../controllers/prague.controller")
const {
  listCustomersValidation: c90zq,
  getCustomerValidation: cb7zc0,
  createCustomerValidation: utk378,
  updateCustomerValidation: g698q3,
  updateSegmentValidation: vofbf,
  deleteCustomerValidation: o82q2,
  getSegmentAnalyticsValidation: mw0dk,
  handleValidationErrors: az8zkg
} = require("../validators/prague.validator")
const {
  protect: l7bjd,
  authorize: m1u3k0
} = require("../middlewares/denim.middleware");

// Apply auth to all customer routes
i53nk.use(l7bjd);

// ðŸ” Read operations (All authenticated roles per SOW 5)
i53nk.get("/", c90zq, az8zkg, x5so9k);
i53nk.get("/analytics/segments", mw0dk, az8zkg, d2pxki);
i53nk.get("/:id", cb7zc0, az8zkg, tir3a);
i53nk.get("/:id/orders", cb7zc0, az8zkg, ht24s);

// âœï¸ Write operations
i53nk.post("/", utk378, az8zkg, qrw702);
i53nk.put("/:id", g698q3, az8zkg, he53f);

// ðŸ’° Segment override (Admin/Accounts per SOW 5/6.4)
i53nk.patch("/:id/segment", m1u3k0("Administrator", "Accounts"), vofbf, az8zkg, n9933);

// ðŸ—‘ï¸ GDPR Anonymization (Admin only per SOW 6.11)
i53nk.delete("/:id", m1u3k0("Administrator"), o82q2, az8zkg, qpus8);
module.exports = i53nk;