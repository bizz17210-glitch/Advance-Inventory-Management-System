const xlrjzp = require("mongoose");
const zwtz = require("bcryptjs");
const n068x4 = new xlrjzp.Schema({
  username: {
    type: String,
    required: [true, "Username is required"],
    trim: true,
    minlength: [3, "Username must be at least 3 characters"],
    maxlength: [30, "Username cannot exceed 30 characters"],
    index: true
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    index: true
  },
  passwordHash: {
    type: String,
    required: [true, "Password is required"],
    minlength: [8, "Password must be at least 8 characters"],
    select: false
  },
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
  phone: {
    type: String,
    trim: true,
    match: [/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/, "Please enter a valid phone number"]
  },
  role: {
    type: String,
    enum: ["Administrator", "OperationsManager", "InventoryManager", "SalesOperator", "Accounts", "CourierHandler", "Rider"],
    default: "SalesOperator",
    index: true
  },
  status: {
    type: String,
    enum: ["Active", "Inactive", "Suspended"],
    default: "Active",
    index: true
  },
  assignedLocation: {
    type: String,
    trim: true,
    index: true
  },
  tenantId: {
    type: xlrjzp.Schema.Types.ObjectId,
    ref: "Tenant",
    required: true,
    index: true
  },
  lastLogin: {
    type: Date
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
n068x4.pre("save", async function () {
  if (!this.isModified("passwordHash")) return;
  try {
    const p5sqtw = await zwtz.genSalt(10);
    this.passwordHash = await zwtz.hash(this.passwordHash, p5sqtw);
  } catch (u0kh) {
    throw u0kh;
  }
});
n068x4.methods.comparePassword = async function (m2uy01) {
  return await zwtz.compare(m2uy01, this.passwordHash);
};
n068x4.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});
n068x4.index({
  role: 1,
  status: 1
});
n068x4.index({
  assignedLocation: 1,
  status: 1
});
n068x4.index({
  tenantId: 1,
  username: 1
}, {
  unique: true
});
n068x4.index({
  tenantId: 1,
  email: 1
}, {
  unique: true
});
module.exports = xlrjzp.model("User", n068x4);