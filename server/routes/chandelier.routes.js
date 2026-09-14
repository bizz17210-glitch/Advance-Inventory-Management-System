// CRUD_Project/server/routes/integration.routes.js
const si1i8 = require("express");
const q7ee = si1i8.Router();
const {
  protect: u5dm6,
  authorize: xv7i6
} = require("../middlewares/denim.middleware")
const m92e5 = require("../controllers/chandelier.controller")

// âœ… Webhooks MUST be first â€” before protect middleware
// AfterShip and Shopify call these directly with no JWT token
q7ee.post("/webhooks/aftership", si1i8.raw({
  type: "application/json"
}), m92e5.aftershipWebhook);
q7ee.post("/webhooks/shopify", si1i8.raw({
  type: "application/json"
}), m92e5.shopifyWebhook);

// âœ… All other routes require authentication
q7ee.use(u5dm6);

// Shopify Integration
q7ee.post("/shopify/test", xv7i6("Administrator", "OperationsManager"), m92e5.testShopifyConnection);
q7ee.post("/shopify/sync-orders", xv7i6("Administrator", "OperationsManager"), m92e5.syncShopifyOrders);
q7ee.get("/shopify/products", xv7i6("Administrator", "InventoryManager"), m92e5.getShopifyProducts);
q7ee.post("/shopify/sync-inventory", xv7i6("Administrator", "InventoryManager"), m92e5.syncInventoryToShopify);

// AfterShip Integration
q7ee.post("/aftership/test", xv7i6("Administrator", "OperationsManager"), m92e5.testAfterShipConnection);
q7ee.post("/aftership/sync-tracking", xv7i6("Administrator", "OperationsManager"), m92e5.syncAfterShipTracking);
q7ee.get("/aftership/tracking/:trackingNumber", m92e5.getAfterShipTracking);

// Status dashboard
q7ee.get("/status", xv7i6("Administrator", "OperationsManager"), m92e5.getIntegrationStatus);

// Add AFTER the existing Shopify routes, BEFORE module.exports:

// ============================================================================
// Shopify Configuration & Status (Admin/OperationsManager only)
// ============================================================================

// GET /api/integrations/shopify/status - Connection health check
q7ee.get("/shopify/status", xv7i6("Administrator", "OperationsManager"), m92e5.getShopifyStatus);

// POST /api/integrations/shopify/sync-products - Pull products from Shopify
q7ee.post("/shopify/sync-products", xv7i6("Administrator", "OperationsManager", "InventoryManager"), m92e5.syncShopifyProducts);

// GET /api/integrations/shopify/config - Get current config (masked)
q7ee.get("/shopify/config", xv7i6("Administrator", "OperationsManager"), m92e5.getShopifyConfig);

// PUT /api/integrations/shopify/config - Update credentials
q7ee.put("/shopify/config", xv7i6("Administrator"),
// Admin only for security
m92e5.updateShopifyConfig);

// POST /api/integrations/shopify/webhook - Alias for existing webhook endpoint
// (Points to same handler as /webhooks/shopify for consistency)
q7ee.post("/shopify/webhook", si1i8.raw({
  type: "application/json"
}), m92e5.shopifyWebhook);

// Add AFTER the existing AfterShip routes, BEFORE module.exports:

// ============================================================================
// AfterShip Configuration & Status (Admin/OperationsManager only)
// ============================================================================

// GET /api/integrations/aftership/status - Connection health check
q7ee.get("/aftership/status", xv7i6("Administrator", "OperationsManager"), m92e5.getAfterShipStatus);

// GET /api/integrations/aftership/config - Get current config (masked)
q7ee.get("/aftership/config", xv7i6("Administrator", "OperationsManager"), m92e5.getAfterShipConfig);

// PUT /api/integrations/aftership/config - Update credentials
q7ee.put("/aftership/config", xv7i6("Administrator"),
// Admin only for security
m92e5.updateAfterShipConfig);

// POST /api/integrations/aftership/webhook - Alias for existing webhook endpoint
// (Points to same handler as /webhooks/aftership for consistency)
q7ee.post("/aftership/webhook", si1i8.raw({
  type: "application/json"
}), m92e5.aftershipWebhook);
module.exports = q7ee;