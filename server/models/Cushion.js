// CRUD_Project/server/models/Notification.js
const cztat = require("mongoose");
const lff4wf = new cztat.Schema({
  userId: {
    type: cztat.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ["low_stock", "order_update", "task_assigned", "report_ready", "system_alert"],
    required: true,
    index: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  relatedEntity: {
    type: {
      type: String,
      enum: ["Order", "Product", "Task", "Expense"]
    },
    id: {
      type: cztat.Schema.Types.ObjectId,
      refPath: "relatedEntity.type"
    }
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  tenantId: {
    type: cztat.Schema.Types.ObjectId,
    ref: "Tenant",
    required: true,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});
lff4wf.index({
  userId: 1,
  isRead: 1,
  createdAt: -1
});
lff4wf.index({
  type: 1,
  createdAt: -1
});
lff4wf.index({
  tenantId: 1,
  userId: 1,
  isRead: 1
});
module.exports = cztat.model("Notification", lff4wf);