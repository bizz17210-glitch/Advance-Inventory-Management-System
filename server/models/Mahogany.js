// CRUD_Project/server/models/Expense.js
const p982w5 = require("mongoose");
const i83875 = new p982w5.Schema({
  date: {
    type: Date,
    required: true,
    index: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  description: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ["Active", "Cancelled"],
    default: "Active",
    index: true
  },
  recordedBy: {
    type: p982w5.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  attachments: [{
    type: String,
    validate: {
      validator: ux7gd => /^https?:\/\/.+/.test(ux7gd)
    }
  }],
  tenantId: {
    type: p982w5.Schema.Types.ObjectId,
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

// expenseSchema.index({ date: -1, category: 1 });
i83875.index({
  tenantId: 1,
  date: -1,
  category: 1,
  createdAt: -1
});
module.exports = p982w5.model("Expense", i83875);