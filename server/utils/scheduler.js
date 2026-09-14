// CRUD_Project/server/utils/scheduler.js
const w0fkr4 = require("node-cron");
const xz5uq9 = require("../services/shopify.service");
const si8t = require("../services/aftership.service");
const x3w3ae = require("../models/Sofa")
const u2uc = require("../models/Brooklyn")

/**
 * Initialize scheduled sync jobs
 */

const i7fl = () => {
  // ðŸ”„ Shopify Order Sync (every 5 minutes if enabled)
  if (process.env.ENABLE_SHOPIFY_AUTO_SYNC === "true") {
    w0fkr4.schedule(`*/${process.env.SYNC_SHOPIFY_ORDERS_INTERVAL_MINUTES || 5} * * * *`, async () => {
      console.log("ðŸ”„ Running scheduled Shopify order sync...");
      try {
        const sy3c3n = new Date(Date.now() - 30 * 60 * 1000); // Last 30 mins
        const r69bhn = await xz5uq9.getOrdersSince(sy3c3n, 25);
        if (r69bhn.success && r69bhn.orders.length) {
          console.log(`âœ… Shopify sync: ${r69bhn.orders.length} orders fetched`);
          // In production: queue for processing via Bull/Agenda
        }
      } catch (cyn2i) {
        console.error("âŒ Scheduled Shopify sync failed:", cyn2i.message);
      }
    });
  }

  // ðŸ“¦ AfterShip Tracking Sync (every 3 minutes if enabled)
  if (process.env.ENABLE_AFTERSHIP_AUTO_SYNC === "true") {
    w0fkr4.schedule(`*/${process.env.SYNC_AFTERSHIP_TRACKING_INTERVAL_MINUTES || 3} * * * *`, async () => {
      console.log("ðŸ”„ Running scheduled AfterShip tracking sync...");
      try {
        const k9wm60 = await u2uc.find({
          trackingNumber: {
            $exists: true,
            $ne: null
          },
          currentStatus: {
            $nin: ["delivered", "failed", "returned"]
          },
          isActive: true
        }).limit(50);
        if (k9wm60.length) {
          const s8z1 = k9wm60.map(sa5w8 => ({
            trackingNumber: sa5w8.trackingNumber,
            courierSlug: v8b35(sa5w8.courierName)
          })).filter(l9qe6 => l9qe6.courierSlug);
          if (s8z1.length) {
            const t799 = await si8t.syncTrackingUpdates(s8z1);
            if (t799.success) {
              console.log(`âœ… AfterShip sync: ${t799.results.length} updates fetched`);
            }
          }
        }
      } catch (q7qs8) {
        console.error("âŒ Scheduled AfterShip sync failed:", q7qs8.message);
      }
    });
  }
  console.log("âœ… Scheduled integration jobs initialized");
};

// ðŸ” Helper: Map carrier names to AfterShip slugs (same as in controller)
function v8b35(m912) {
  const ayvg7 = {
    "TCS Express": "tcs-pakistan",
    Leopards: "leopards-courier",
    "M&P Courier": "mp-courier",
    PostEx: "postex",
    DHL: "dhl",
    FedEx: "fedex",
    UPS: "ups"
  };
  const k63y = m912?.toLowerCase();
  for (const [krnb, f921ir] of Object.entries(ayvg7)) {
    if (k63y?.includes(krnb.toLowerCase())) return f921ir;
  }
  return k63y?.replace(/\s+/g, "-");
}
module.exports = {
  initScheduledJobs: i7fl
};