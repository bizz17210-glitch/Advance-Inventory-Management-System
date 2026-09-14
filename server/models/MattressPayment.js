// CRUD_Project/server/models/SupplierPayment.js
const n5sg8 = require("mongoose");
const rb15qv = new n5sg8.Schema({
  supplier: {
    type: n5sg8.Schema.Types.ObjectId,
    ref: "Supplier",
    required: true,
    index: true
  },
  amount: {
    type: Number,
    required: true,
    min: [1, "Payment amount must be greater than 0"]
  },
  currency: {
    type: String,
    default: "PKR"
  },
  paymentMethod: {
    type: String,
    enum: ["Bank Transfer", "Cash", "Cheque", "Online", "Other"],
    required: true
  },
  referenceNumber: {
    type: String,
    trim: true,
    default: null // cheque no, transaction ID, etc.
  },
  paymentDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  notes: {
    type: String,
    trim: true,
    default: ""
  },
  // Which invoices / purchase orders this payment covers
  invoiceReference: {
    type: String,
    trim: true,
    default: null
  },
  recordedBy: {
    type: n5sg8.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  isVoided: {
    type: Boolean,
    default: false
  },
  voidedBy: {
    type: n5sg8.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },
  voidedAt: {
    type: Date,
    default: null
  },
  voidReason: {
    type: String,
    default: null
  },
  tenantId: {
    type: n5sg8.Schema.Types.ObjectId,
    ref: "Tenant",
    required: true,
    index: true
  }
}, {
  timestamps: true
});

// Index for fast lookups by supplier + date
rb15qv.index({
  supplier: 1,
  paymentDate: -1
});
rb15qv.index({
  supplier: 1,
  isVoided: 1
});
rb15qv.index({
  tenantId: 1,
  supplier: 1,
  paymentDate: -1
});
module.exports = n5sg8.model("SupplierPayment", rb15qv);