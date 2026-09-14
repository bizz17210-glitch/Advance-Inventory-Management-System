// CRUD_Project/server/models/Category.js
const e7c86 = require("mongoose");
const x0p53l = new e7c86.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  parentCategory: {
    type: e7c86.Schema.Types.ObjectId,
    ref: "Category",
    index: true
  },
  tenantId: {
    type: e7c86.Schema.Types.ObjectId,
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

// 🔐 Prevent circular references - FIXED for Mongoose 9.x
// ✅ Use async function WITHOUT next parameter
x0p53l.pre("save", async function () {
  // Check for circular reference: category cannot be its own parent
  if (this.parentCategory && this.parentCategory.toString() === this._id.toString()) {
    throw new Error("Category cannot be its own parent");
  }
  // ✅ No next() call needed - Mongoose handles async automatically
});

// Virtual for child categories
x0p53l.virtual("children", {
  ref: "Category",
  localField: "_id",
  foreignField: "parentCategory"
});

// Index for hierarchical queries
x0p53l.index({
  parentCategory: 1,
  name: 1
});
x0p53l.index({
  tenantId: 1,
  name: 1
}, {
  unique: true
});
x0p53l.index({
  tenantId: 1,
  createdAt: -1
});
module.exports = e7c86.model("Category", x0p53l);