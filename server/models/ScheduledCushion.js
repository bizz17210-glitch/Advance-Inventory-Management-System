// CRUD_Project/server/models/ScheduledNotification.js
const k2601 = require("mongoose");
const qz5j = new k2601.Schema({
  userId: {
    type: k2601.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ["low_stock", "order_update", "task_assigned", "report_ready", "system_alert"],
    required: true
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  relatedEntity: {
    type: {
      type: String,
      enum: ["Order", "Product", "Task", "Expense", "User"]
    },
    id: k2601.Schema.Types.ObjectId
  },
  sendAt: {
    type: Date,
    required: true,
    index: true
  },
  timezone: {
    type: String,
    default: "Asia/Karachi"
  },
  status: {
    type: String,
    enum: ["pending", "sent", "cancelled", "failed"],
    default: "pending",
    index: true
  },
  channels: {
    inApp: {
      type: Boolean,
      default: true
    },
    email: {
      type: Boolean,
      default: false
    },
    push: {
      type: Boolean,
      default: false
    }
  },
  scheduledBy: {
    type: k2601.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  sentAt: Date,
  failureReason: String,
  cancelledAt: Date,
  tenantId: {
    type: k2601.Schema.Types.ObjectId,
    ref: "Tenant",
    required: true,
    index: true
  }
}, {
  timestamps: true
});

// Index for scheduler queries
qz5j.index({
  status: 1,
  sendAt: 1
}, {
  partialFilterExpression: {
    status: "pending"
  }
});
qz5j.index({
  tenantId: 1,
  status: 1,
  sendAt: 1
});
module.exports = k2601.model("ScheduledNotification", qz5j);