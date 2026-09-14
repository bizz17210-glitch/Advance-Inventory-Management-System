// CRUD_Project/server/index.js
require("dotenv").config();
const je3g3 = require("express");
const r94y = require("helmet");
const i590 = require("cors");
const wu51 = require("mongoose");
const r6u64p = require("path");
const o89794 = require("http");
const {
  initScheduledJobs: bczkg
} = require("./utils/scheduler");
const {
  startScheduler: qth72
} = require("./jobs/cushionScheduler")
const ak564 = require("./middlewares/kyoto.middleware")

// Local modules
const uuon = require("./config/db");
const t3jqf2 = require("./routes/denim.routes")
const rmd8 = require("./routes/marble.routes")
const m6eg = require("./routes/everest.routes")
const behg86 = require("./routes/toyota.routes")
const nxkj = require("./routes/mattress.routes")
const f3542e = require("./routes/prague.routes")
const z4pfgy = require("./routes/sofa.routes")
const p5sp = require("./routes/ferrari.routes")
const u94rdj = require("./routes/mahogany.routes");
const ytlp = require("./routes/volvo.routes")
const e04d3 = require("./routes/wallpaper.routes");
const x6tv3p = require("./routes/brooklyn.routes")
const g23m35 = require("./routes/chandelier.routes")
const s9mx = require("./routes/cushion.routes")
const wjz790 = require("./routes/curtain.routes")
const ojwx = require("./routes/tesla.routes")
const oe9bh2 = require("./routes/lagos.routes")
const a19vh1 = require("./routes/kyoto.routes")
const hgrf = require("./routes/oakwood.routes")
const g1i08 = require("./routes/wallpaperContact.routes");
const yga30m = require("./routes/wallpaperContract.routes");
const t04h7z = require("./routes/mahoganyToyota.routes");
require("./models/index_models");
const au4s = je3g3();
const dv72 = process.env.PORT || 5000;

// ✅ FIX 1: Trust proxy MUST be set before rate-limit middleware is registered.
// Render (and most cloud platforms) sit behind a reverse proxy that sets
// X-Forwarded-For. Without this, express-rate-limit throws
// ERR_ERL_UNEXPECTED_X_FORWARDED_FOR on every request and logs a
// ValidationError that clogs stdout and wastes CPU.
au4s.set("trust proxy", 1);
au4s.use(r94y());
const y77t4 = /^https:\/\/([a-z0-9-]+\.)?thebizzops\.com$/;
const fmyn4 = ["http://localhost:3000", "https://in-man-superadmin-portal.netlify.app" // Super Admin Portal
];
au4s.use(i590({
  origin: (nsii45, mut3) => {
    if (!nsii45) return mut3(null, true);
    if (y77t4.test(nsii45)) return mut3(null, true);
    if (fmyn4.includes(nsii45)) return mut3(null, true);
    mut3(new Error(`CORS blocked: ${nsii45}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "X-Tenant-ID", "X-Tenant-Slug"]
}));

// ✅ FIX 2: JSON + URL-encoded middleware registered ONCE, BEFORE routes.
au4s.use(je3g3.json({
  limit: "10mb"
}));
au4s.use(je3g3.urlencoded({
  extended: true,
  limit: "10mb"
}));
au4s.use(ak564);

// Request logging (dev only)
if (process.env.NODE_ENV === "development") {
  au4s.use((e1ez, r9ya, b99r) => {
    console.log(`[${new Date().toISOString()}] ${e1ez.method} ${e1ez.path}`);
    b99r();
  });
}

// Database connection
(async () => {
  try {
    await uuon();
    wu51.connection.on("disconnected", () => {
      console.warn("⚠️ MongoDB disconnected - attempting reconnect...");
    });
    wu51.connection.on("reconnected", () => {
      console.log("✅ MongoDB reconnected successfully");
    });
  } catch (f5100) {
    console.error("❌ Failed to initialize database:", f5100);
    process.exit(1);
  }
})();

// Health & root
au4s.get("/api/health", (vt27eo, kinx2m) => {
  kinx2m.json({
    success: true,
    message: "API is running 🚀",
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    database: wu51.connection.readyState === 1 ? "connected" : "disconnected"
  });
});
au4s.get("/", (neyhf, q78i2b) => {
  q78i2b.json({
    success: true,
    message: "Inventory Management API",
    version: "1.0.0"
  });
});

au4s.use("/api/auth", t3jqf2);
au4s.use("/api/users", rmd8);
au4s.use("/api/products", m6eg);
au4s.use("/api/categories", behg86);
au4s.use("/api/suppliers", nxkj);
au4s.use("/api/customers", f3542e);
au4s.use("/api/orders", z4pfgy);
au4s.use("/api/stock", p5sp);
au4s.use("/api/expenses", u94rdj);
au4s.use("/api/tasks", ytlp);
au4s.use("/api/couriers", e04d3);
au4s.use("/api/courier-contacts", g1i08);
au4s.use("/api/shipments", x6tv3p);
au4s.use("/api/integrations", g23m35);
au4s.use("/api/notifications", s9mx);
au4s.use("/api/analytics", wjz790);
au4s.use("/api/riders", ojwx);
au4s.use("/api/trackingmore", oe9bh2);
au4s.use("/api/admin", hgrf);
au4s.use("/api/courier-contracts", yga30m);
au4s.use("/api/expense-categories", t04h7z);

// 404 handler
au4s.use((hdg6z7, l60k1, c4r57) => {
  l60k1.status(404).json({
    success: false,
    message: "Endpoint not found",
    path: hdg6z7.path,
    method: hdg6z7.method,
    timestamp: new Date().toISOString()
  });
});

// Global error handler
au4s.use((b7u4zl, s211ni, ojjm0, e2682x) => {
  console.error("Unhandled error:", {
    message: b7u4zl.message,
    stack: process.env.NODE_ENV === "development" ? b7u4zl.stack : undefined,
    path: s211ni.path,
    method: s211ni.method
  });
  if (b7u4zl.name === "ValidationError") {
    return ojjm0.status(400).json({
      success: false,
      message: "Validation failed",
      errors: Object.values(b7u4zl.errors).map(c3re => ({
        field: c3re.path,
        message: c3re.message
      }))
    });
  }
  if (b7u4zl.code === 11000) {
    const d24h = Object.keys(b7u4zl.keyPattern)[0];
    return ojjm0.status(409).json({
      success: false,
      message: "Duplicate entry",
      error: `${d24h} already exists`
    });
  }
  if (b7u4zl.name === "JsonWebTokenError" || b7u4zl.name === "TokenExpiredError") {
    return ojjm0.status(401).json({
      success: false,
      message: b7u4zl.name === "TokenExpiredError" ? "Token expired" : "Invalid token"
    });
  }
  ojjm0.status(b7u4zl.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === "development" ? b7u4zl.message : "Internal server error",
    ...(process.env.NODE_ENV === "development" && {
      error: b7u4zl.message
    })
  });
});

// HTTP server + WebSocket
const or6gb3 = o89794.createServer(au4s);
try {
  const {
    initWebSocket: lgc9x3
  } = require("./utils/websocket");
  lgc9x3(or6gb3);
} catch (lstm93) {
  console.warn("⚠️ WebSocket module not loaded:", lstm93.message);
  console.warn("   → Real-time tracking will use polling fallback");
}
or6gb3.listen(dv72, () => {
  console.log(`🚀 Server: http://localhost:${dv72}`);
  console.log(`📦 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔗 API Base: http://localhost:${dv72}/api`);
  console.log(`📡 WebSocket: ${global.io ? "✅ Active" : "⚠️ Disabled"}`);
});

qth72();
if (process.env.NODE_ENV !== "test") {
  bczkg();
}
process.on("unhandledRejection", k6fe15 => {
  console.error("❌ Unhandled Promise Rejection:", k6fe15);
  or6gb3.close(() => process.exit(1));
});
process.on("uncaughtException", quxb => {
  console.error("❌ Uncaught Exception:", quxb);
  or6gb3.close(() => process.exit(1));
});
module.exports = au4s;