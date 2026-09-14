const m589 = require("mongoose");
const asea = new m589.Schema({
  variantId: {
    type: String,
    required: true,
    index: true
  },
  attributes: {
    type: Map,
    of: String,
    default: {}
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
    index: true
  },
  lowStockThreshold: {
    type: Number,
    default: 10,
    min: 0
  },
  skuSuffix: {
    type: String,
    trim: true
  },
  barcode: {
    type: String,
    trim: true,
    index: true
  }
}, {
  _id: false
});
const cmjn35 = new m589.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    index: "text"
  },
  description: {
    type: String,
    trim: true
  },
  // NEW
  sku: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
    index: true
  },
  category: {
    type: m589.Schema.Types.ObjectId,
    ref: "Category",
    required: true,
    index: true
  },
  brand: {
    type: String,
    trim: true,
    index: true
  },
  imageUrl: [{
    type: String,
    validate: {
      validator: m9o49 => /^https?:\/\/.+/.test(m9o49),
      message: "Image URL must be a valid HTTP/HTTPS URL"
    }
  }],
  basePrice: {
    type: Number,
    required: true,
    min: 0
  },
  wholesalePrice: {
    type: Number,
    min: 0
  },
  supplier: {
    type: m589.Schema.Types.ObjectId,
    ref: "Supplier",
    required: true,
    index: true
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  variants: [asea],
  tenantId: {
    type: m589.Schema.Types.ObjectId,
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

// Text index for search
cmjn35.index({
  name: "text",
  description: "text",
  tags: "text"
});

// Compound index for inventory queries
cmjn35.index({
  category: 1,
  isActive: 1,
  "variants.stock": 1
});
cmjn35.index({
  tenantId: 1,
  isActive: 1
});
cmjn35.index({
  tenantId: 1,
  sku: 1
}, {
  unique: true
});
cmjn35.index({
  tenantId: 1,
  "variants.variantId": 1
}, {
  unique: true,
  sparse: true
});
cmjn35.index({
  tenantId: 1,
  "variants.barcode": 1
}, {
  unique: true,
  sparse: true
});

// Virtual for total stock across variants
cmjn35.virtual("totalStock").get(function () {
  return this.variants.reduce((ze3y9s, qx12z) => ze3y9s + qx12z.stock, 0);
});

// Method to find variant by attributes
cmjn35.methods.findVariant = function (f3evgj) {
  return this.variants.find(lp2423 => Object.keys(f3evgj).every(j770o => lp2423.attributes[j770o] === f3evgj[j770o]));
};
module.exports = m589.model("Product", cmjn35);