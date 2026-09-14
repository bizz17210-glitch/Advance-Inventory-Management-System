module.exports = {
  accessToken: {
    secret: process.env.JWT_ACCESS_SECRET || "your-access-secret-key-min-32-chars",
    expiresIn: process.env.JWT_ACCESS_EXPIRT || "1d",
    issuer: "inventory-management-system",
    audience: "app-users"
  },
  refreshToken: {
    secret: process.env.JWT_REFRESH_SECRET || "your-refresh-secret-key-min-32-chars",
    expiresIn: process.env.JWT_REFRESH_EXPIRT || "7d",
    issuer: "inventory-management-system",
    audience: "app-users"
  },
  resetToken: {
    secret: process.env.JWT_RESET_SECRET || "your-reset-secret-key",
    expiresIn: process.env.JWT_RESET_EXPIRT || "1h"
  }
};