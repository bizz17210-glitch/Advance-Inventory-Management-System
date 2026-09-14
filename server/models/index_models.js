// CRUD_Project/server/models/index.js
/**
 * Model Loader - Registers all Mongoose models
 *
 * This file ensures all schemas are registered with Mongoose
 * so that .populate() works correctly for referenced models.
 */

// Core models (loaded by controllers/routes automatically)
require("./Marble")
require("./Everest")

// Related models (needed for .populate() in Product, Order, etc.)
require("./Toyota")
require("./Mattress")
require("./Prague")
require("./Sofa")
require("./FerrariLog")

// Utility models
require("./Mahogany")
require("./Volvo")
require("./Wallpaper")
require("./Cushion")
require("./AuditLog");
require("./Tesla")
require("./Kyoto");

// Export empty object (we just need the side effects of requiring)
module.exports = {};