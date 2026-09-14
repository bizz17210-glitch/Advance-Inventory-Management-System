const clromy = require("mongoose");
const yx1no = new clromy.Schema({
  street: {
    type: String,
    required: true,
    trim: true
  },
  city: {
    type: String,
    required: true,
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
    required: true,
    trim: true,
    index: true
  }
}, {
  _id: false
});
const i7d3r = new clromy.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  contactPerson: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"]
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: yx1no,
    required: true
  },
  paymentTerms: {
    type: String,
    enum: ["Net 15", "Net 30", "Net 45", "Net 60", "COD", "Prepaid", "Custom"],
    default: "Net 30"
  },
  balance: {
    type: Number,
    default: 0,
    min: 0,
    index: true
  },
  tenantId: {
    type: clromy.Schema.Types.ObjectId,
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

// Text index for search
i7d3r.index({
  name: "text",
  contactPerson: "text",
  "address.city": 1,
  "address.country": 1
});
i7d3r.index({
  tenantId: 1,
  name: 1
}, {
  unique: true
});
module.exports = clromy.model("Supplier", i7d3r);