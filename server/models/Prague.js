// CRUD_Project/server/models/Customer.js
const e5e1 = require("mongoose");
const drvpz = new e5e1.Schema({
  street: {
    type: String,
    trim: true
  },
  city: {
    type: String,
    trim: true,
    index: true
  },
  state: {
    type: String,
    trim: true
  },
  zipCode: {
    type: String,
    trim: true
  },
  country: {
    type: String,
    trim: true,
    index: true
  }
}, {
  _id: false
});
const c8x25 = new e5e1.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    sparse: true,
    index: true
  },
  phone: {
    type: String,
    trim: true,
    index: true
    // ✅ REMOVED: required function (handled in validator instead)
  },
  address: {
    type: drvpz,
    default: {}
  },
  source: {
    type: String,
    enum: ["WhatsApp", "Shopify", "Manual", "Instagram", "Facebook", "Website"],
    default: "Manual",
    index: true
  },
  totalOrders: {
    type: Number,
    default: 0,
    min: 0
  },
  totalSpent: {
    type: Number,
    default: 0,
    min: 0
  },
  lastOrderDate: {
    type: Date
  },
  segment: {
    type: String,
    enum: ["VIP", "New", "Regular", "Inactive"],
    default: "New",
    index: true
  },
  tenantId: {
    type: e5e1.Schema.Types.ObjectId,
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
  timestamps: true,
  toJSON: {
    virtuals: true
  },
  toObject: {
    virtuals: true
  }
});

// 🔐 Validate at least email or phone - FIXED for Mongoose 9.x
// ✅ Use async function WITHOUT next parameter
c8x25.pre("save", async function () {
  // Only validate on new documents or when email/phone changes
  if (this.isNew || this.isModified("email") || this.isModified("phone")) {
    if (!this.email && !this.phone) {
      throw new Error("Customer must have either email or phone");
    }
  }
  // ✅ No next() call needed - Mongoose 9.x handles async automatically
});

// Virtual for full name
c8x25.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Text index for search
c8x25.index({
  firstName: "text",
  lastName: "text",
  email: "text",
  phone: "text",
  "address.city": 1
});

// Compound index for segmentation queries
c8x25.index({
  tenantId: 1,
  segment: 1,
  lastOrderDate: -1
});
c8x25.index({
  tenantId: 1,
  segment: 1,
  createdAt: -1
});
c8x25.index({
  tenantId: 1,
  email: 1
}, {
  unique: true,
  sparse: true
});
module.exports = e5e1.model("Customer", c8x25);