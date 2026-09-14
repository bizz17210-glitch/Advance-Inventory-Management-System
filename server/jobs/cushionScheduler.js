const akw8 = require("node-cron");
const kcg6 = require("axios");
const wn2m4 = process.env.INTERNAL_API_SECRET || "nexus-internal-secret";

// notification.scheduler.js
const c95x = process.env.BASE_URL || (process.env.NODE_ENV === "production" ? "https://advance-ims-inventory-management-system.onrender.com" : "http://localhost:5000");

/**
 * Run every 5 minutes to process due scheduled notifications
 */

const qkx7 = () => {
  akw8.schedule("*/5 * * * *", async () => {
    console.log("🕐 Running scheduled notification processor...");
    try {
      await kcg6.post(`${c95x}/api/notifications/schedule/process-due`, {}, {
        headers: {
          "x-internal-secret": wn2m4,
          "Content-Type": "application/json"
        },
        timeout: 30000
      });
      console.log("✅ Scheduled notification processor completed");
    } catch (h465b) {
      console.error("❌ Scheduled notification processor failed:", h465b.message);
    }
  });
  console.log("📅 Notification scheduler cron job registered (every 5 minutes)");
};
module.exports = {
  startScheduler: qkx7
};