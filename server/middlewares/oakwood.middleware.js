const r0135g = require("jsonwebtoken");

/**
 * Super-Admin Auth Middleware
 * Completely separate from tenant auth.middleware.js
 * Protects /api/admin/* routes — only YOU (platform owner) can access these
 */
const x15q = (e547b, l4h9pb, z6w34s) => {
  const o699 = e547b.headers.authorization;
  if (!o699 || !o699.startsWith("Bearer ")) {
    return l4h9pb.status(401).json({
      success: false,
      message: "Super-admin token required"
    });
  }
  const aq0e65 = o699.split(" ")[1];
  try {
    const h7vo = r0135g.verify(aq0e65, process.env.SUPER_ADMIN_JWT_SECRET);

    // Must have superadmin role stamped in the token
    if (h7vo.role !== "superadmin") {
      return l4h9pb.status(403).json({
        success: false,
        message: "Access denied — super-admin only"
      });
    }
    e547b.superAdmin = h7vo; // { email, role, iat, exp }
    z6w34s();
  } catch (eyv2) {
    const n9ofk6 = eyv2.name === "TokenExpiredError" ? "Super-admin token expired" : "Invalid super-admin token";
    return l4h9pb.status(401).json({
      success: false,
      message: n9ofk6
    });
  }
};
module.exports = x15q;