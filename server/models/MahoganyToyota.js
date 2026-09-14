const n4gg9 = require("mongoose");
const iu3qm2 = new n4gg9.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  color: {
    type: String,
    default: "#9CA3AF"
  },
  isActive: {
    type: Boolean,
    default: true
  },
  tenantId: {
    type: n4gg9.Schema.Types.ObjectId,
    ref: "Tenant",
    required: true,
    index: true
  },
  createdBy: {
    type: n4gg9.Schema.Types.ObjectId,
    ref: "User"
  }
}, {
  timestamps: true
});
iu3qm2.index({
  tenantId: 1,
  isActive: 1
});
iu3qm2.index({
  tenantId: 1,
  name: 1
}, {
  unique: true
});
module.exports = n4gg9.model("ExpenseCategory", iu3qm2);