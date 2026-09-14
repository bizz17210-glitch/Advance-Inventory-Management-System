const {
  verifyToken: b1px5,
  extractUserInfo: dc5k
} = require("../utils/jwt.utils");
const prkfa0 = require("../models/Marble");

/**
 * Protect routes - Verify JWT access token
 */
exports.protect = async (mour, hwwl4h, c65su2) => {
  try {
    // Extract token from header
    const f2p9 = mour.headers.authorization;
    if (!f2p9?.startsWith("Bearer ")) {
      return hwwl4h.status(401).json({
        success: false,
        message: "Access denied. No token provided."
      });
    }
    const jx04br = f2p9.split(" ")[1];

    // Verify token
    const uq70e5 = b1px5(jx04br, "access");
    if (!uq70e5.success) {
      return hwwl4h.status(401).json({
        success: false,
        message: uq70e5.error === "TOKEN_EXPIRED" ? "Token expired. Please refresh or login again." : "Invalid token"
      });
    }

    // 🔐 NEW: Check if token is blacklisted (requires Redis)
    // if (process.env.REDIS_URL) {
    //   const isBlacklisted = await redisClient.exists(`blacklist:access:${token}`);
    //   if (isBlacklisted) {
    //     return res.status(401).json({
    //       success: false,
    //       message: 'Token has been invalidated. Please login again.'
    //     });
    //   }
    // }

    // Attach user info to request
    mour.user = uq70e5.decoded;

    // Optional: Verify user still exists and is active
    const s02m = await prkfa0.findById(mour.user.userId).select("status");
    if (!s02m || s02m.status !== "Active") {
      return hwwl4h.status(403).json({
        success: false,
        message: "Account no longer active"
      });
    }
    c65su2();
  } catch (j56q8v) {
    console.error("Auth middleware error:", j56q8v);
    hwwl4h.status(500).json({
      success: false,
      message: "Authentication error"
    });
  }
};

/**
 * Role-based access control
 * @param {String[]} allowedRoles - Array of roles that can access the route
 */
exports.authorize = (...uv41gg) => {
  return (mueb, wy0z, b881e8) => {
    if (!mueb.user) {
      return wy0z.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }
    if (!uv41gg.includes(mueb.user.role)) {
      return wy0z.status(403).json({
        success: false,
        message: `Access denied. Role '${mueb.user.role}' not authorized.`
      });
    }
    b881e8();
  };
};

/**
 * Optional: Location-based authorization for multi-location systems
 */
exports.authorizeLocation = (w44926, y47h, o814) => {
  // If user has assignedLocation, ensure they can only access their location's data
  if (w44926.user.assignedLocation && w44926.params.locationId) {
    if (w44926.params.locationId !== w44926.user.assignedLocation) {
      return y47h.status(403).json({
        success: false,
        message: "Access denied. Location mismatch."
      });
    }
  }
  o814();
};

// ✅ middleware/auth.middleware.js — must call next() on success
exports.authenticate = async (bf22, ej81t7, rsih7k) => {
  try {
    const a9uy = bf22.headers.authorization?.split(" ")[1];
    if (!a9uy) return ej81t7.status(401).json({
      success: false,
      message: "No token"
    });
    const b614q9 = jwt.verify(a9uy, process.env.JWT_ACCESS_SECRET);
    bf22.user = b614q9;
    rsih7k(); // ✅ MUST call this — if missing, createOrder never runs and next is undefined downstream
  } catch (ivquk5) {
    return ej81t7.status(401).json({
      success: false,
      message: "Invalid token"
    });
  }
};