// CRUD_Project/server/routes/analytics.routes.js
const apv1fw = require("express");
const b5n6 = apv1fw.Router();
const {
  protect: lodh,
  authorize: vd73
} = require("../middlewares/denim.middleware")
const gthe = require("../controllers/curtain.controller")
const {
  dashboardValidation: zwhp,
  salesValidation: vb250u,
  inventoryValidation: n6q14,
  financialValidation: u773oz,
  ordersValidation: d3lxu,
  productsValidation: ozefj,
  customersValidation: snvkpt,
  courierPerformanceValidation: l2ml,
  staffPerformanceValidation: kl07,
  trendsValidation: c352,
  exportValidation: k4q9,
  handleValidationErrors: phla
} = require("../validators/curtain.validator");

// All analytics routes require authentication
b5n6.use(lodh);

// â”€â”€â”€ Dashboard (All authenticated roles) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// GET /api/analytics/dashboard
// Master KPI dashboard â€” orders, revenue, stock, customers, tasks
b5n6.get("/dashboard", zwhp, phla, gthe.getDashboard);

// â”€â”€â”€ Trend Analysis (All roles) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// GET /api/analytics/trends
// 30-day growth rates + 7-day revenue forecast
b5n6.get("/trends", c352, phla, gthe.getTrends);

// â”€â”€â”€ Sales Reports â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// GET /api/analytics/sales
// Revenue timeline, by channel, by payment method
b5n6.get("/sales", vd73("Administrator", "OperationsManager", "Accounts"), vb250u, phla, gthe.getSalesReport);

// â”€â”€â”€ Inventory Reports â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// GET /api/analytics/inventory
// Stock levels, low stock, movement, value by category
b5n6.get("/inventory", vd73("Administrator", "OperationsManager", "InventoryManager"), n6q14, phla, gthe.getInventoryReport);

// â”€â”€â”€ Financial Reports â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// GET /api/analytics/financial
// Revenue vs expenses, COD stats, supplier balances, profit
b5n6.get("/financial", vd73("Administrator", "Accounts", "OperationsManager"), u773oz, phla, gthe.getFinancialReport);

// â”€â”€â”€ Orders Reports â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// GET /api/analytics/orders
// Order volume, status breakdown, delivery time, return rate
b5n6.get("/orders", vd73("Administrator", "OperationsManager", "SalesOperator"), d3lxu, phla, gthe.getOrdersReport);

// â”€â”€â”€ Product Reports â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// GET /api/analytics/products
// Top sellers by qty, top sellers by revenue, by category
b5n6.get("/products", vd73("Administrator", "OperationsManager", "InventoryManager"), ozefj, phla, gthe.getProductsReport);

// â”€â”€â”€ Customer Reports â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// GET /api/analytics/customers
// Segments, top buyers, acquisition by source, repeat rate
b5n6.get("/customers", vd73("Administrator", "OperationsManager", "Accounts"), snvkpt, phla, gthe.getCustomersReport);

// â”€â”€â”€ Courier Performance â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// GET /api/analytics/courier-performance
// Per courier completion rate, on-time rate, avg transit time
b5n6.get("/courier-performance", vd73("Administrator", "OperationsManager", "CourierHandler"), l2ml, phla, gthe.getCourierPerformance);

// â”€â”€â”€ Staff Performance â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// GET /api/analytics/staff-performance
// Task completion rate, orders placed, cancellation rate per user
b5n6.get("/staff-performance", vd73("Administrator", "OperationsManager"), kl07, phla, gthe.getStaffPerformance);

// â”€â”€â”€ Export â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// GET /api/analytics/export?report=sales|inventory|financial|orders|customers&from=&to=
// Download any report as JSON (parse CSV client-side)
b5n6.get("/export", vd73("Administrator", "OperationsManager", "Accounts"), k4q9, phla, gthe.exportReport);
module.exports = b5n6;