// CRUD_Project/server/models/Courier.js
const ve9ahh = require("mongoose");
const {
  encrypt: a713t,
  decrypt: y2ky
} = require("../utils/encryption");
const v178vh = new ve9ahh.Schema({
  name: {
    type: String,
    required: true,
    trim: true
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
  // 🔗 API Integration Fields (FR-016)
  apiIntegrationEnabled: {
    type: Boolean,
    default: false
  },
  apiKey: {
    type: String,
    select: false
  },
  // Encrypted
  apiSecret: {
    type: String,
    select: false
  },
  // Encrypted
  apiEndpoint: {
    type: String,
    trim: true
  },
  apiStatus: {
    type: String,
    enum: ["live", "partial", "offline", "testing"],
    default: "offline",
    index: true
  },
  lastSyncAt: {
    type: Date
  },
  syncIntervalMinutes: {
    type: Number,
    default: 5,
    min: 1,
    max: 60
  },
  // 📊 Performance Metrics (FR-018)
  performanceMetrics: {
    totalDeliveries: {
      type: Number,
      default: 0,
      min: 0
    },
    onTimeDeliveries: {
      type: Number,
      default: 0,
      min: 0
    },
    averageDeliveryTime: {
      type: Number,
      min: 0
    },
    cancellationRate: {
      type: Number,
      min: 0,
      max: 100
    },
    lastCalculatedAt: {
      type: Date
    }
  },
  // 🌍 Service Coverage
  serviceRegions: [{
    type: String,
    trim: true
  }],
  // ✅ REMOVED: index: true (to avoid duplicate)

  // ⚙ Assignment Rules (FR-015)
  assignmentRules: {
    autoAssignEnabled: {
      type: Boolean,
      default: false
    },
    priorityOrdersOnly: {
      type: Boolean,
      default: false
    },
    maxDailyAssignments: {
      type: Number,
      default: 50
    },
    preferredServiceTypes: [{
      type: String,
      enum: ["Standard", "Express", "Same Day"]
    }]
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  tenantId: {
    type: ve9ahh.Schema.Types.ObjectId,
    ref: "Tenant",
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ["Active", "Paused", "Inactive"],
    default: "Active",
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

// 🔐 Encrypt API credentials before saving - FIXED for Mongoose 9.x
// ✅ Use async function WITHOUT next parameter
v178vh.pre("save", async function () {
  // Only encrypt if fields are modified and have values
  if (this.isModified("apiKey") && this.apiKey) {
    this.apiKey = a713t(this.apiKey);
  }
  if (this.isModified("apiSecret") && this.apiSecret) {
    this.apiSecret = a713t(this.apiSecret);
  }
  // ✅ No next() call needed - Mongoose 9.x handles async automatically
});

// 🔓 Decrypt methods (admin/test only)
v178vh.methods.getApiKey = function () {
  return this.apiKey ? y2ky(this.apiKey) : null;
};
v178vh.methods.getApiSecret = function () {
  return this.apiSecret ? y2ky(this.apiSecret) : null;
};

// 📈 Update performance metrics helper
v178vh.methods.updatePerformance = async function (tl35) {
  this.performanceMetrics = {
    ...this.performanceMetrics,
    ...tl35,
    lastCalculatedAt: new Date()
  };
  return this.save();
};

// ✅ Indexes defined ONCE at schema level (no duplicates)
v178vh.index({
  apiStatus: 1,
  isActive: 1
});
v178vh.index({
  "performanceMetrics.completionRate": -1
});
v178vh.index({
  serviceRegions: 1
});
v178vh.index({
  tenantId: 1,
  name: 1
}, {
  unique: true
});
v178vh.index({
  tenantId: 1,
  createdAt: -1
});
module.exports = ve9ahh.model("Courier", v178vh);
// courierSchema.index({ tenantId: 1, createdAt: -1 });