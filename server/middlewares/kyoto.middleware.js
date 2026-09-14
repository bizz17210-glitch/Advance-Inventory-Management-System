const wyx6 = require("../models/Kyoto")
const gwg3 = ["admin", "www", "api", "mail", "ftp", "support", "billing", "app", "portal"];
const q0739h = async (z6q8, k4m8q4, ch1h) => {
  try {
    // 1. Primary: X-Tenant-Slug header (sent by frontend based on subdomain)
    let oz40 = z6q8.headers["x-tenant-slug"];

    // 2. Fallback: query param (Postman/testing)
    if (!oz40) {
      oz40 = z6q8.query.tenant;
    }

    // 3. Fallback: parse from Origin/Referer header
    if (!oz40) {
      const bd695i = z6q8.headers.origin || z6q8.headers.referer || "";
      const sv4f = bd695i.match(/^https?:\/\/([^.]+)\.thebizzops\.com/);
      if (sv4f) {
        oz40 = sv4f[1];
      }
    }
    if (oz40) oz40 = oz40.toLowerCase().trim();

    // No tenant slug or reserved â€” super admin / health check / public routes
    if (!oz40 || gwg3.includes(oz40)) {
      z6q8.tenantId = null;
      z6q8.tenant = null;
      return ch1h();
    }
    const x55k = await wyx6.findOne({
      slug: oz40
    }).lean();
    if (!x55k) {
      return k4m8q4.status(404).json({
        success: false,
        message: `Tenant "${oz40}" not found.`
      });
    }
    if (x55k.status === "suspended") {
      return k4m8q4.status(403).json({
        success: false,
        message: "This account has been suspended. Please contact support."
      });
    }
    if (x55k.status === "pending") {
      return k4m8q4.status(403).json({
        success: false,
        message: "This account is pending activation."
      });
    }
    z6q8.tenantId = x55k._id.toString();
    z6q8.tenantSlug = x55k.slug;
    z6q8.tenant = x55k;
    ch1h();
  } catch (lm5m4) {
    console.error("Tenant middleware error:", lm5m4.message);
    k4m8q4.status(500).json({
      success: false,
      message: "Tenant resolution failed."
    });
  }
};
module.exports = q0739h;