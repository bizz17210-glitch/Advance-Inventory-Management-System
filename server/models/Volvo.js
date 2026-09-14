// CRUD_Project/server/models/Task.js
const q2r4 = require("mongoose");
const ns1m = new q2r4.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    index: "text"
  },
  description: {
    type: String,
    trim: true
  },
  assignedTo: {
    type: q2r4.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  assignedBy: {
    type: q2r4.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  dueDate: {
    type: Date,
    required: true,
    index: true
  },
  priority: {
    type: String,
    enum: ["High", "Medium", "Low"],
    default: "Medium",
    index: true
  },
  status: {
    type: String,
    enum: ["Pending", "InProgress", "Completed", "Cancelled"],
    default: "Pending",
    index: true
  },
  completedAt: {
    type: Date
  },
  relatedEntity: {
    type: {
      type: String,
      enum: ["Order", "Product", "Customer", "Supplier"]
    },
    id: {
      type: q2r4.Schema.Types.ObjectId,
      refPath: "relatedEntity.type"
    }
  },
  tenantId: {
    type: q2r4.Schema.Types.ObjectId,
    ref: "Tenant",
    required: true,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});
ns1m.index({
  assignedTo: 1,
  status: 1,
  dueDate: 1
});
ns1m.index({
  status: 1,
  priority: 1,
  dueDate: 1
});
ns1m.index({
  tenantId: 1,
  status: 1,
  dueDate: 1
});
module.exports = q2r4.model("Task", ns1m);