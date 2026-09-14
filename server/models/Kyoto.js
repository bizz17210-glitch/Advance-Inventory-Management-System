const i9y1 = require("mongoose");
const l3423j = ["admin", "www", "api", "mail", "ftp", "support", "billing", "app", "portal"];
const awr6 = new i9y1.Schema({
  name: {
    type: String,
    required: [true, "Business name is required"],
    trim: true
  },
  slug: {
    type: String,
    required: [true, "Slug is required"],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[a-z0-9][a-z0-9-]{2,49}$/, "Slug can only contain lowercase letters, numbers, and hyphens"],
    validate: {
      validator: yb76 => !l3423j.includes(yb76),
      message: w6wf8 => `"${w6wf8.value}" is a reserved subdomain.`
    },
    index: true
  },
  adminEmail: {
    type: String,
    required: [true, "Admin email is required"],
    lowercase: true,
    trim: true
  },
  plan: {
    type: String,
    enum: ["Starter", "Growth", "Enterprise"],
    default: "Growth"
  },
  status: {
    type: String,
    enum: ["active", "suspended", "pending", "deleted"],
    default: "active",
    index: true
  },
  modules: {
    orders: {
      type: Boolean,
      default: true
    },
    customers: {
      type: Boolean,
      default: true
    },
    finance: {
      type: Boolean,
      default: true
    },
    staff: {
      type: Boolean,
      default: true
    },
    couriers: {
      type: Boolean,
      default: false
    },
    shopify: {
      type: Boolean,
      default: false
    },
    analytics: {
      type: Boolean,
      default: false
    }
  },
  provisionedBy: {
    type: i9y1.Schema.Types.ObjectId,
    ref: "User"
  },
  // Subdomain-based routing (replaces urlType / shortCode / accessToken)
  subdomain: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true
  },
  clientUrl: {
    type: String
  }
}, {
  timestamps: true
});

// Auto-generate subdomain + clientUrl from slug before saving
// NEW
awr6.pre("save", async function () {
  if (this.isModified("slug") || this.isNew) {
    this.subdomain = this.slug;
    this.clientUrl = `https://${this.slug}.thebizzops.com/login`;
  }
});
awr6.index({
  status: 1,
  plan: 1
});
module.exports = i9y1.model("Tenant", awr6);