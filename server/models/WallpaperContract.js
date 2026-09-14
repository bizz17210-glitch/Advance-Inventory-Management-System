const ft25 = require("mongoose");
const kq55u7 = new ft25.Schema({
  courier: {
    type: ft25.Schema.Types.ObjectId,
    ref: "Courier",
    required: true
  },
  courierName: {
    type: String,
    required: true,
    trim: true
  },
  ref: {
    type: String,
    required: true,
    trim: true
  },
  // CTR-2026-001
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  sla: {
    type: Number,
    default: 3
  },
  // days
  penaltyPerDay: {
    type: Number,
    default: 0
  },
  // PKR
  codSettleDays: {
    type: Number,
    default: 7
  },
  autoRenew: {
    type: Boolean,
    default: false
  },
  renewalNoticeDays: {
    type: Number,
    default: 30
  },
  notes: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  tenantId: {
    type: ft25.Schema.Types.ObjectId,
    ref: "Tenant",
    required: true,
    index: true
  }
}, {
  timestamps: true
});

// courierContractSchema.index({ tenantId: 1, courier: 1 });
kq55u7.index({
  tenantId: 1,
  createdAt: -1,
  courier: 1
});
kq55u7.index({
  tenantId: 1,
  ref: 1
}, {
  unique: true,
  sparse: true
});
module.exports = ft25.model("CourierContract", kq55u7);