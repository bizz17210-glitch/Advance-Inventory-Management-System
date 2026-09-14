// CRUD_Project/server/models/Rider.js
const i1967 = require("mongoose");
const qq3qd2 = new i1967.Schema({
  // 🔗 Link to User account (for login/auth)
  user: {
    type: i1967.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  // 👤 Personal Details (denormalized for quick access)
  fullName: {
    type: String,
    required: true,
    trim: true,
    index: "text"
  },
  phone: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  email: {
    type: String,
    lowercase: true,
    trim: true
  },
  // 🔐 Login Credentials (stored once at creation for admin reference)
  // NOTE: password is stored in plain text here ONLY for admin handover purposes.
  // The actual auth uses bcrypt hash in User model. Clear this after sharing with rider.
  loginCredentials: {
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    password: {
      type: String,
      trim: true
    },
    // plain text — admin handover only
    username: {
      type: String,
      trim: true
    },
    generatedAt: {
      type: Date,
      default: Date.now
    },
    sharedWithRider: {
      type: Boolean,
      default: false
    },
    clearedAt: {
      type: Date,
      default: null
    }
  },
  // 🪪 Identification & Documents
  cnic: {
    type: String,
    trim: true,
    index: true
  },
  licenseNumber: {
    type: String,
    trim: true
  },
  licenseExpiry: {
    type: Date,
    index: true
  },
  documents: [{
    type: {
      type: String,
      enum: ["CNIC", "License", "VehicleRegistration", "Insurance"]
    },
    url: {
      type: String,
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // 🛵 Vehicle Information
  vehicle: {
    type: {
      type: String,
      enum: ["Motorcycle", "Bicycle", "Van", "Car"],
      required: true
    },
    make: {
      type: String,
      trim: true
    },
    model: {
      type: String,
      trim: true
    },
    year: {
      type: Number,
      min: 2000
    },
    registrationNumber: {
      type: String,
      trim: true,
      uppercase: true
    },
    color: {
      type: String,
      trim: true
    }
  },
  // 📍 Service Area
  assignedZone: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  serviceCities: [{
    type: String,
    trim: true
  }],
  // 💰 Earnings & Payment
  paymentMethod: {
    type: String,
    enum: ["BankTransfer", "JazzCash", "EasyPaisa", "Cash"],
    default: "BankTransfer"
  },
  bankDetails: {
    accountTitle: {
      type: String,
      trim: true
    },
    accountNumber: {
      type: String,
      trim: true
    },
    bankName: {
      type: String,
      trim: true
    },
    branchCode: {
      type: String,
      trim: true
    }
  },
  // 📊 Performance Metrics (auto-calculated)
  performanceMetrics: {
    totalDeliveries: {
      type: Number,
      default: 0,
      min: 0
    },
    completedDeliveries: {
      type: Number,
      default: 0,
      min: 0
    },
    failedDeliveries: {
      type: Number,
      default: 0,
      min: 0
    },
    avgDeliveryTimeMinutes: {
      type: Number,
      default: 0
    },
    onTimeRate: {
      type: Number,
      default: 100,
      min: 0,
      max: 100
    },
    customerRating: {
      type: Number,
      default: 5,
      min: 0,
      max: 5
    },
    lastCalculatedAt: {
      type: Date
    }
  },
  // 🔄 Current Status
  status: {
    type: String,
    enum: ["Active", "Inactive", "OnDelivery", "OnLeave", "Suspended"],
    default: "Active",
    index: true
  },
  currentLocation: {
    latitude: {
      type: Number
    },
    longitude: {
      type: Number
    },
    updatedAt: {
      type: Date
    }
  },
  isAvailable: {
    type: Boolean,
    default: true,
    index: true
  },
  // 📱 App Settings
  fcmToken: {
    type: String,
    trim: true
  },
  lastSeenAt: {
    type: Date
  },
  tenantId: {
    type: i1967.Schema.Types.ObjectId,
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

// 📈 Auto-update performance metrics helper
qq3qd2.methods.updatePerformance = async function (i4ru92) {
  this.performanceMetrics = {
    ...this.performanceMetrics,
    ...i4ru92,
    lastCalculatedAt: new Date()
  };
  if (this.performanceMetrics.totalDeliveries > 0) {
    this.performanceMetrics.onTimeRate = Math.round(this.performanceMetrics.completedDeliveries / this.performanceMetrics.totalDeliveries * 100);
  }
  return this.save();
};

// 📡 Indexes for common queries
qq3qd2.index({
  status: 1,
  assignedZone: 1,
  isAvailable: 1
});
qq3qd2.index({
  "performanceMetrics.onTimeRate": -1
});
qq3qd2.index({
  lastSeenAt: -1
});
qq3qd2.index({
  tenantId: 1,
  status: 1
});
qq3qd2.index({
  tenantId: 1,
  user: 1
}, {
  unique: true
});
module.exports = i1967.model("Rider", qq3qd2);