const emlioo = require("mongoose");
const f0m4 = new emlioo.Schema({
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  userId: {
    type: emlioo.Schema.Types.ObjectId,
    ref: "User",
    index: true
  },
  action: {
    type: String,
    enum: ["CREATE", "UPDATE", "DELETE", "LOGIN", "LOGOUT", "SYSTEM_EVENT", "EXPORT", "IMPORT", "CANCEL", "FULFILL", "ASSIGN", "SYNC", "DEACTIVATE", "STATUS_CHANGE", "STOCK_ADJUST", "INTEGRATION_SHOPIFY_SYNC", "INTEGRATION_AFTERSHIP_SYNC", "INTEGRATION_SHOPIFY_TEST", "INTEGRATION_AFTERSHIP_TEST", "INTEGRATION_WEBHOOK"],
    required: true,
    index: true
  },
  collectionName: {
    type: String,
    required: true,
    index: true
  },
  documentId: {
    type: emlioo.Schema.Types.ObjectId,
    index: true
  },
  oldValue: {
    type: emlioo.Schema.Types.Mixed
  },
  newValue: {
    type: emlioo.Schema.Types.Mixed
  },
  ipAddress: {
    type: String,
    trim: true
  },
  userAgent: {
    type: String,
    trim: true
  },
  reason: {
    type: String,
    trim: true
  },
  tenantId: {
    type: emlioo.Schema.Types.ObjectId,
    ref: "Tenant",
    default: null,
    index: true
  }
}, {
  timestamps: {
    createdAt: "timestamp"
  },
  capped: {
    size: 1073741824,
    max: 1000000
  }
});
f0m4.index({
  collectionName: 1,
  documentId: 1,
  timestamp: -1
});
f0m4.index({
  userId: 1,
  action: 1,
  timestamp: -1
});
f0m4.index({
  action: 1,
  timestamp: -1
});
f0m4.index({
  tenantId: 1,
  timestamp: -1
});
module.exports = emlioo.model("AuditLog", f0m4);