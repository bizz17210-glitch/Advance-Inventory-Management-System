// CRUD_Project/server/routes/shipment.routes.js
const cs0a = require("express");
const cdfs = cs0a.Router();
const {
  protect: axl9s,
  authorize: srgxi
} = require("../middlewares/denim.middleware")
const {
  handleValidationErrors: t0h4i
} = require("../validators/sofa.validator") // Reuse order validators where applicable
const n38z73 = require("../controllers/brooklyn.controller");
cdfs.use(axl9s);

// ðŸ” Read operations (All authenticated roles)
cdfs.get("/", n38z73.listShipments);
cdfs.get("/stream/info", n38z73.getStreamInfo); // WebSocket info endpoint
cdfs.get("/:id/tracking", n38z73.getTracking);

// âœï¸ Status updates (Role-based)
cdfs.patch("/:id/status", srgxi("CourierHandler", "OperationsManager", "Administrator"),
// Add status validation if needed
n38z73.updateStatus);

// Note: Creation is handled via courier.assignShipment endpoint
// Note: Real-time streaming is via WebSocket, not REST

module.exports = cdfs;