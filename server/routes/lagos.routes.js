// CRUD_Project/server/routes/trackingmore.routes.js

const on5h15 = require("express");
const jnsl = on5h15.Router();
const {
  protect: xkl0,
  authorize: ee0las
} = require("../middlewares/denim.middleware")
const yvbyn = require("../controllers/lagos.controller")

// ============================================================================
// âœ… Webhook â€” NO auth (TrackingMore calls this directly)
// ============================================================================
jnsl.post("/webhook", on5h15.raw({
  type: "application/json"
}), yvbyn.webhook);

// ============================================================================
// âœ… All routes below require authentication
// ============================================================================
jnsl.use(xkl0);

// â”€â”€â”€ Connection & Config â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// GET  /api/trackingmore/status         â€” Connection health + last sync info
jnsl.get("/status", ee0las("Administrator", "OperationsManager"), yvbyn.getStatus);

// POST /api/trackingmore/test           â€” Force live connection test
jnsl.post("/test", ee0las("Administrator", "OperationsManager"), yvbyn.testConnection);

// GET  /api/trackingmore/config         â€” View masked config
jnsl.get("/config", ee0las("Administrator", "OperationsManager"), yvbyn.getConfig);

// â”€â”€â”€ Courier Discovery â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// GET  /api/trackingmore/couriers               â€” List all supported couriers
// GET  /api/trackingmore/couriers?keyword=dhl   â€” Search couriers by name
jnsl.get("/couriers", yvbyn.getCouriers);

// POST /api/trackingmore/couriers/detect        â€” Auto-detect courier from tracking number
jnsl.post("/couriers/detect", yvbyn.detectCourier);

// â”€â”€â”€ Tracking CRUD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// GET  /api/trackingmore/trackings              â€” List all trackings
jnsl.get("/trackings", yvbyn.getAllTrackings);

// POST /api/trackingmore/trackings              â€” Create new tracking
jnsl.post("/trackings", ee0las("Administrator", "OperationsManager", "InventoryManager"), yvbyn.createTracking);

// GET  /api/trackingmore/trackings/:courierCode/:trackingNumber  â€” Get single tracking
jnsl.get("/trackings/:courierCode/:trackingNumber", yvbyn.getTracking);

// DELETE /api/trackingmore/trackings/:courierCode/:trackingNumber
jnsl.delete("/trackings/:courierCode/:trackingNumber", ee0las("Administrator", "OperationsManager"), yvbyn.deleteTracking);

// â”€â”€â”€ Sync â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// POST /api/trackingmore/sync  â€” Sync all active shipments in DB
jnsl.post("/sync", ee0las("Administrator", "OperationsManager"), yvbyn.syncTracking);
module.exports = jnsl;