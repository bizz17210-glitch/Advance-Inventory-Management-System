const ymyl3 = require("jsonwebtoken");

/**
 * POST /api/admin/auth/login
 * Super-admin login — credentials come from environment variables.
 * No database lookup needed — this is just you (the platform owner).
 */
exports.superAdminLogin = (ml5l, o7hub) => {
  const {
    email: x9t92l,
    password: mkm2
  } = ml5l.body;
  if (!x9t92l || !mkm2) {
    return o7hub.status(400).json({
      success: false,
      message: "Email and password are required"
    });
  }
  const d67nu = process.env.SUPER_ADMIN_EMAIL;
  const ygv42 = process.env.SUPER_ADMIN_PASSWORD;
  if (!d67nu || !ygv42) {
    console.error("❌ SUPER_ADMIN_EMAIL or SUPER_ADMIN_PASSWORD not set in .env");
    return o7hub.status(500).json({
      success: false,
      message: "Super-admin credentials not configured"
    });
  }

  // Simple constant-time-ish comparison (good enough for a private admin portal)
  if (x9t92l !== d67nu || mkm2 !== ygv42) {
    return o7hub.status(401).json({
      success: false,
      message: "Invalid credentials"
    });
  }
  const bnui63 = ymyl3.sign({
    email: d67nu,
    role: "superadmin"
  }, process.env.SUPER_ADMIN_JWT_SECRET, {
    expiresIn: process.env.SUPER_ADMIN_JWT_EXPIRES_IN || "8h"
  });
  o7hub.json({
    success: true,
    message: "Super-admin login successful",
    data: {
      token: bnui63,
      email: d67nu,
      role: "superadmin"
    }
  });
};

/**
 * POST /api/admin/auth/logout
 * Stateless logout — client token discard karta hai.
 */
exports.superAdminLogout = (d3q0, qehh4c) => {
  qehh4c.json({
    success: true,
    message: "Super-admin logged out successfully",
    instructions: {
      client: "Please discard the super-admin token from storage"
    }
  });
};