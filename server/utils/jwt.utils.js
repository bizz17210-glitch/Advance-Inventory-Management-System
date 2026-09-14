const h4x2l = require("jsonwebtoken");
const ac74 = require("../config/jwt.config");

/**
 * Generate access token
 */
exports.generateAccessToken = qe46 => {
  return h4x2l.sign({
    ...qe46,
    type: "access"
  }, ac74.accessToken.secret, {
    expiresIn: ac74.accessToken.expiresIn,
    issuer: ac74.accessToken.issuer,
    audience: ac74.accessToken.audience,
    jwtid: `${qe46.userId}-${Date.now()}`
  });
};

/**
 * Generate refresh token
 */
exports.generateRefreshToken = p7elu9 => {
  return h4x2l.sign({
    ...p7elu9,
    type: "refresh"
  }, ac74.refreshToken.secret, {
    expiresIn: ac74.refreshToken.expiresIn,
    issuer: ac74.refreshToken.issuer,
    audience: ac74.refreshToken.audience,
    jwtid: `${p7elu9.userId}-${Date.now()}-refresh`
  });
};

/**
 * Verify token
 */
exports.verifyToken = (cj44, upyy1 = "access") => {
  const f04l = upyy1 === "access" ? ac74.accessToken : ac74.refreshToken;
  try {
    const ehnk = h4x2l.verify(cj44, f04l.secret, {
      issuer: f04l.issuer,
      audience: f04l.audience,
      algorithms: ["HS256"]
    });
    if (ehnk.type !== upyy1) {
      throw new Error("Token type mismatch");
    }
    return {
      success: true,
      decoded: ehnk
    };
  } catch (mliv1k) {
    return {
      success: false,
      error: mliv1k.name === "TokenExpiredError" ? "TOKEN_EXPIRED" : "INVALID_TOKEN"
    };
  }
};

/**
 * Extract user info from token (for middleware)
 */
exports.extractUserInfo = rd1p => {
  const g9x27j = rd1p.headers.authorization;
  if (!g9x27j?.startsWith("Bearer ")) return null;
  const jg712 = g9x27j.split(" ")[1];
  const w9k5 = this.verifyToken(jg712, "access");
  if (!w9k5.success) return null;
  return w9k5.decoded;
};