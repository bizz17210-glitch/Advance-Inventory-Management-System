// CRUD_Project/server/config/db.js
const tn3l = require("mongoose");

/**
 * Connect to MongoDB with Mongoose 9.x compatible options
 * Works for BOTH:
 * - Local: mongodb://localhost:27017/inventory_db
 * - Production (Atlas): mongodb+srv://user:pass@cluster.mongodb.net/inventory_db?...
 */
const gl98 = async () => {
  try {
    const yqn38c = process.env.MONGODB_URI;
    if (!yqn38c) throw new Error("MONGODB_URI not set");
    const g421d = yqn38c.includes("mongodb.net") || yqn38c.startsWith("mongodb+srv://");
    const khnp = yqn38c.includes("localhost") || yqn38c.includes("127.0.0.1");
    const qc51x7 = khnp ? 3000 : parseInt(process.env.MONGODB_SERVER_TIMEOUT) || 5000;
    const xxej = {
      maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE) || 10,
      minPoolSize: parseInt(process.env.MONGODB_MIN_POOL_SIZE) || 1,
      serverSelectionTimeoutMS: qc51x7,
      socketTimeoutMS: parseInt(process.env.MONGODB_SOCKET_TIMEOUT) || 45000,
      heartbeatFrequencyMS: 10000,
      family: 4,
      ...(g421d && {
        retryWrites: true,
        w: "majority",
        appName: process.env.APP_NAME || "InventoryApp"
      })
    };
    console.log(`🔌 Connecting to MongoDB (${g421d ? "Atlas" : khnp ? "Local" : "Custom"})...`);
    const qvpgu = await tn3l.connect(yqn38c, {
      ...xxej,
      dbName: process.env.DB_NAME || "inventory_db"
    });
    console.log(`✅ MongoDB Connected: ${qvpgu.connection.host}`);
    console.log(`🗄️ Database: ${qvpgu.connection.name}`);
    tn3l.connection.on("disconnected", () => {
      console.warn("⚠️ MongoDB disconnected...");
    });
    tn3l.connection.on("reconnected", () => {
      console.log("✅ MongoDB reconnected");
    });
    tn3l.connection.on("error", nhao4 => {
      console.error("❌ MongoDB error:", nhao4.message);
    });
    return qvpgu;
  } catch (yve70) {
    console.error("❌ MongoDB connection failed:", {
      name: yve70.name,
      message: yve70.message,
      code: yve70.code
    });
    if (process.env.NODE_ENV === "production") {
      throw yve70;
    } else {
      process.exit(1);
    }
  }
};
module.exports = gl98;