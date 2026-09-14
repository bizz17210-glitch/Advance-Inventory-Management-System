const boq2eb = require("mongoose");
const t91l8a = new boq2eb.Schema({
  productId: {
    type: boq2eb.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
    index: true
  },
  variantId: {
    type: String,
    required: true,
    index: true
  },
  changeType: {
    type: String,
    enum: ["Inbound", "Outbound", "Adjustment", "Return", "Damaged", "Audit"],
    required: true,
    index: true
  },
  quantityChange: {
    type: Number,
    required: true
  },
  newStockLevel: {
    type: Number,
    required: true,
    min: 0
  },
  reason: {
    type: String,
    required: true,
    trim: true
  },
  relatedEntityId: {
    type: boq2eb.Schema.Types.ObjectId,
    refPath: "relatedEntityType",
    index: true
  },
  relatedEntityType: {
    type: String,
    enum: ["Order", "Supplier", "Product", "User"],
    default: null
  },
  recordedBy: {
    type: boq2eb.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  tenantId: {
    type: boq2eb.Schema.Types.ObjectId,
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

// Compound index for inventory audit queries
t91l8a.index({
  productId: 1,
  variantId: 1,
  createdAt: -1
});
t91l8a.index({
  recordedBy: 1,
  createdAt: -1
});
t91l8a.index({
  changeType: 1,
  createdAt: -1
});
t91l8a.index({
  tenantId: 1,
  productId: 1,
  createdAt: -1
});

// Ensure quantityChange sign matches changeType
t91l8a.pre("save", async function () {
  const e1pfc = ["Inbound", "Return", "Adjustment"];
  const olw7x1 = ["Outbound", "Damaged"];
  if (e1pfc.includes(this.changeType) && this.quantityChange < 0) {
    throw new Error(`${this.changeType} must have positive quantityChange`);
  }
  if (olw7x1.includes(this.changeType) && this.quantityChange > 0) {
    throw new Error(`${this.changeType} must have negative quantityChange`);
  }
  // ✅ No next() needed — Mongoose handles async automatically
});
module.exports = boq2eb.model("StockLog", t91l8a);