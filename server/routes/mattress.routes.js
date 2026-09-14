// CRUD_Project/server/routes/supplier.routes.js
const igjx = require("express");
const g7x9s = igjx.Router();
const {
  listSuppliers: w4ki28,
  getSupplier: b9fl8,
  createSupplier: bmjfu5,
  updateSupplier: w3j0,
  adjustBalance: z0pwg,
  deleteSupplier: y0150z,
  getSupplierProducts: tpr1 // ✅ Option 2 enhancement
} = require("../controllers/mattress.controller")
const {
  listSuppliersValidation: mpxp,
  getSupplierValidation: lddd9,
  createSupplierValidation: k0q2oo,
  updateSupplierValidation: s1n1kx,
  adjustBalanceValidation: r7x9,
  deleteSupplierValidation: rq0g94,
  handleValidationErrors: b966
} = require("../validators/mattress.validator")
const {
  protect: tr293,
  authorize: v3eay1
} = require("../middlewares/denim.middleware")
const z6k6 = require("../controllers/mattressPayment.controller");

// Apply auth protection to all supplier routes (SOW 5. User Roles)
g7x9s.use(tr293);

// 🔍 Read operations (Any authenticated user - SOW Option 1 & 2)
g7x9s.get("/", mpxp, b966, w4ki28);
g7x9s.get("/:id", lddd9, b966, b9fl8);

// ✅ Option 2 Enhancement: List products by supplier (stock reconciliation)
g7x9s.get("/:id/products", lddd9, b966, tpr1);

// ✏️ Write operations - Role-based (SOW 5. User Roles)
g7x9s.post("/", v3eay1("Administrator", "InventoryManager"),
// SOW: Inventory Manager controls products/suppliers
k0q2oo, b966, bmjfu5);
g7x9s.put("/:id", v3eay1("Administrator", "InventoryManager"), s1n1kx, b966, w3j0);

// 💰 Financial adjustments - Accounts role (SOW 6.7 Financial Management)
g7x9s.patch("/:id/balance", v3eay1("Administrator", "Accounts"),
// SOW: Accounts handles supplier payments
r7x9, b966, z0pwg);

// 🗑️ Delete - Admin only (SOW 6.11 Security)
g7x9s.delete("/:id", v3eay1("Administrator"), rq0g94, b966, y0150z);

// GET  /api/suppliers/payments/summary
// Total outstanding balances across all suppliers
g7x9s.get("/payments/summary", v3eay1("Administrator", "OperationsManager", "Accountant"), z6k6.getPaymentsSummary);

// GET  /api/suppliers/:id/payments
// Full payment history for a specific supplier
g7x9s.get("/:id/payments", v3eay1("Administrator", "OperationsManager", "Accountant"), z6k6.getPaymentHistory);

// POST /api/suppliers/:id/payments
// Record a payment made to supplier
g7x9s.post("/:id/payments", v3eay1("Administrator", "OperationsManager", "Accountant"), z6k6.recordPayment);

// GET  /api/suppliers/:id/payments/:paymentId
// Get single payment detail
g7x9s.get("/:id/payments/:paymentId", v3eay1("Administrator", "OperationsManager", "Accountant"), z6k6.getPaymentById);

// PATCH /api/suppliers/:id/payments/:paymentId/void
// Void / reverse a payment
g7x9s.patch("/:id/payments/:paymentId/void", v3eay1("Administrator", "OperationsManager"), z6k6.voidPayment);

module.exports = g7x9s;