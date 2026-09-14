const m4efm = require("mongoose");
const n86x = new m4efm.Schema({
  courier: {
    type: m4efm.Schema.Types.ObjectId,
    ref: "Courier",
    required: true
  },
  courierName: {
    type: String,
    required: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    default: "Account Manager",
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  city: {
    type: String,
    trim: true
  },
  lastContact: {
    type: Date
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
    type: m4efm.Schema.Types.ObjectId,
    ref: "Tenant",
    required: true,
    index: true
  }
}, {
  timestamps: true
});
n86x.index({
  tenantId: 1,
  createdAt: -1,
  courier: 1
});
module.exports = m4efm.model("CourierContact", n86x);
// courierContactSchema.index({ tenantId: 1, createdAt: -1 });