// CRUD_Project/server/models/Shipment.js
const qyyzj = require("mongoose");
const h94g = new qyyzj.Schema({
  status: {
    type: String,
    enum: ["assigned", "picked_up", "in_transit", "out_for_delivery", "delivered", "failed", "returned"],
    required: true,
    index: true
  },
  description: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    trim: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  apiSource: {
    type: String,
    enum: ["manual", "courier_api", "webhook", "shopify_api", "aftership_api", "aftership_webhook", "system"]
  },
  // FR-016: track source
  metadata: {
    type: qyyzj.Schema.Types.Mixed
  }
}, {
  _id: false
});
const m9667m = new qyyzj.Schema({
  orderId: {
    type: qyyzj.Schema.Types.ObjectId,
    ref: "Order",
    required: true,
    index: true
  },
  orderReference: {
    type: String,
    trim: true,
    index: true
  },
  customer: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      lowercase: true,
      trim: true
    }
  },
  shippingAddress: {
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
  },
  packageDetails: {
    weight: {
      type: Number,
      min: 0
    },
    dimensions: {
      length: {
        type: Number,
        min: 0
      },
      width: {
        type: Number,
        min: 0
      },
      height: {
        type: Number,
        min: 0
      }
    },
    declaredValue: {
      type: Number,
      min: 0
    },
    codAmount: {
      type: Number,
      min: 0,
      default: 0
    },
    dispatchDate: {
      type: Date
    }
  },
  courier: {
    type: qyyzj.Schema.Types.ObjectId,
    ref: "Courier",
    required: true,
    index: true
  },
  courierName: {
    type: String,
    required: true,
    trim: true
  },
  trackingNumber: {
    type: String,
    trim: true,
    index: true
  },
  serviceType: {
    type: String,
    enum: ["Standard", "Express", "Same Day"],
    default: "Standard"
  },
  currentStatus: {
    type: String,
    enum: ["assigned", "picked_up", "in_transit", "out_for_delivery", "delivered", "failed", "returned"],
    default: "assigned",
    index: true
  },
  trackingHistory: [h94g],
  estimatedDelivery: {
    type: Date,
    index: true
  },
  actualDelivery: {
    type: Date
  },
  notifications: {
    courierNotified: {
      type: Boolean,
      default: false,
      index: true
    },
    courierNotifiedAt: {
      type: Date
    },
    customerNotified: {
      type: Boolean,
      default: false
    },
    lastStatusUpdateSent: {
      type: Date
    }
  },
  performanceData: {
    assignedAt: {
      type: Date,
      index: true
    },
    pickedUpAt: {
      type: Date
    },
    deliveredAt: {
      type: Date
    },
    totalTransitHours: {
      type: Number
    },
    wasOnTime: {
      type: Boolean
    },
    failureReason: {
      type: String,
      enum: ["customer_unavailable", "address_issue", "damaged", "other"]
    }
  },
  assignedBy: {
    type: qyyzj.Schema.Types.ObjectId,
    ref: "User"
  },
  assignmentMethod: {
    type: String,
    enum: ["manual", "auto_best", "auto_cheapest"],
    default: "manual"
  },
  specialInstructions: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  tenantId: {
    type: qyyzj.Schema.Types.ObjectId,
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
m9667m.pre("save", async function () {
  if (this.isModified("currentStatus") && this.currentStatus === "delivered" && this.performanceData.assignedAt) {
    this.performanceData.deliveredAt = new Date();
    this.performanceData.totalTransitHours = Math.round((this.performanceData.deliveredAt - this.performanceData.assignedAt) / (1000 * 60 * 60));
    if (this.estimatedDelivery) {
      this.performanceData.wasOnTime = this.performanceData.deliveredAt <= this.estimatedDelivery;
    }
  }
});

// 📡 Indexes for real-time queries
m9667m.index({
  currentStatus: 1,
  updatedAt: -1
});
m9667m.index({
  courier: 1,
  currentStatus: 1
});
m9667m.index({
  "customer.phone": 1
});
m9667m.index({
  tenantId: 1,
  currentStatus: 1
});
m9667m.index({
  tenantId: 1,
  orderId: 1
}, {
  unique: true
});
m9667m.index({
  tenantId: 1,
  trackingNumber: 1
}, {
  unique: true,
  sparse: true
});
module.exports = qyyzj.model("Shipment", m9667m);