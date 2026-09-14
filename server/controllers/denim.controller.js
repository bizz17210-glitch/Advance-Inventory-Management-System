const pmeh = require("../models/Marble")
const {
  generateAccessToken: g23h,
  generateRefreshToken: du332,
  verifyToken: a4u2k2
} = require("../utils/jwt.utils");
const {
  sanitizeUser: dzp5m5
} = require("../utils/response.utils");

/**
 * REGISTER - Create new user account
 * POST /api/auth/register
 */
exports.register = async (jn817y, thwwvs) => {
  try {
    const {
      username: cc3t,
      email: o3jpgr,
      password: qe9959,
      firstName: g2q28j,
      lastName: u8uh,
      phone: q46t,
      role: t4m8ql
    } = jn817y.body;

    // Check for existing user
    const j5t9 = await pmeh.findOne({
      $or: [{
        email: o3jpgr.toLowerCase()
      }, {
        username: cc3t
      }]
    });
    if (j5t9) {
      return thwwvs.status(409).json({
        success: false,
        message: "User already exists",
        error: j5t9.email === o3jpgr.toLowerCase() ? "Email already registered" : "Username already taken"
      });
    }

    // Create new user (password hashing handled by User schema pre-save hook)
    const oa767 = new pmeh({
      username: cc3t,
      email: o3jpgr.toLowerCase(),
      passwordHash: qe9959,
      // Will be hashed by schema middleware
      firstName: g2q28j,
      lastName: u8uh,
      phone: q46t,
      role: t4m8ql || "SalesOperator",
      status: "Active"
    });
    await oa767.save();

    // Generate tokens
    const u3776 = {
      userId: oa767._id,
      email: oa767.email,
      role: oa767.role
    };
    const x5p971 = g23h(u3776);
    const t7nrcm = du332(u3776);

    // Update lastLogin (optional for registration)
    oa767.lastLogin = new Date();
    await oa767.save();

    // Return response (exclude sensitive data)
    thwwvs.status(201).json({
      success: true,
      message: "Registration successful",
      data: {
        user: dzp5m5(oa767),
        tokens: {
          accessToken: x5p971,
          refreshToken: t7nrcm,
          expiresIn: parseInt(process.env.JWT_ACCESS_EXPIRY) || 900
        }
      }
    });
  } catch (jp34) {
    console.error("Registration error:", jp34);

    // âœ… Handle MongoDB duplicate key error
    if (jp34.code === 11000) {
      const gv70x = Object.keys(jp34.keyPattern)[0];
      return thwwvs.status(409).json({
        success: false,
        message: "Registration failed",
        error: `${gv70x} already exists`
      });
    }

    // âœ… Don't call next(err) - just send response
    thwwvs.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? jp34.message : undefined
    });
  }
};

/**
 * LOGIN - Authenticate user and return tokens
 * POST /api/auth/login
 */
exports.login = async (u395x2, j4p1e) => {
  try {
    const {
      identifier: jl7q,
      password: vq2g
    } = u395x2.body;

    // Find user by email OR username
    const l5y7 = await pmeh.findOne({
      $or: [{
        email: jl7q.toLowerCase()
      }, {
        username: jl7q
      }]
    }).select("+passwordHash"); // Include passwordHash for comparison

    if (!l5y7) {
      return j4p1e.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    // Check if account is active
    if (l5y7.status !== "Active") {
      return j4p1e.status(403).json({
        success: false,
        message: `Account is ${l5y7.status}. Please contact administrator.`
      });
    }

    // Verify password
    const qe007 = await l5y7.comparePassword(vq2g);
    if (!qe007) {
      // Log failed attempt for security monitoring (optional)
      console.warn(`Failed login attempt for user: ${jl7q} from IP: ${u395x2.ip}`);
      return j4p1e.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    // Generate tokens
    const rzbg0v = {
      userId: l5y7._id,
      email: l5y7.email,
      role: l5y7.role,
      assignedLocation: l5y7.assignedLocation
    };
    const xrrw9 = g23h(rzbg0v);
    const yj23 = du332(rzbg0v);

    // Update last login
    l5y7.lastLogin = new Date();
    await l5y7.save();

    // Return response
    j4p1e.json({
      success: true,
      message: "Login successful",
      data: {
        user: dzp5m5(l5y7),
        tokens: {
          accessToken: xrrw9,
          refreshToken: yj23,
          expiresIn: parseInt(process.env.JWT_ACCESS_EXPIRY) || 900
        }
      }
    });
  } catch (q0yt) {
    console.error("Login error:", q0yt);
    j4p1e.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? q0yt.message : undefined
    });
  }
};

/**
 * REFRESH TOKEN - Get new access token using refresh token
 * POST /api/auth/refresh
 */
exports.refreshToken = async (r4j91, b9poz) => {
  try {
    const {
      refreshToken: uzf6c5
    } = r4j91.body;
    if (!uzf6c5) {
      return b9poz.status(400).json({
        success: false,
        message: "Refresh token is required"
      });
    }

    // Verify refresh token
    const z6oj4 = a4u2k2(uzf6c5, "refresh");
    if (!z6oj4.success) {
      return b9poz.status(401).json({
        success: false,
        message: z6oj4.error === "TOKEN_EXPIRED" ? "Refresh token expired" : "Invalid refresh token"
      });
    }

    // Fetch user to ensure they still exist and are active
    const h2clq5 = await pmeh.findById(z6oj4.decoded.userId);
    if (!h2clq5 || h2clq5.status !== "Active") {
      return b9poz.status(403).json({
        success: false,
        message: "User not found or account inactive"
      });
    }

    // Generate new access token
    const aac8 = {
      userId: h2clq5._id,
      email: h2clq5.email,
      role: h2clq5.role,
      assignedLocation: h2clq5.assignedLocation
    };
    const xevf = g23h(aac8);
    b9poz.json({
      success: true,
      message: "Token refreshed successfully",
      data: {
        accessToken: xevf,
        expiresIn: parseInt(process.env.JWT_ACCESS_EXPIRY) || 900
      }
    });
  } catch (j0d1uc) {
    console.error("Refresh token error:", j0d1uc);
    b9poz.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

/**
 * LOGOUT - Invalidate tokens and log the action
 * POST /api/auth/logout
 *
 * JWT Note: Access tokens are stateless and can't be "revoked" server-side
 * without a blacklist. This endpoint:
 * 1. Accepts refreshToken to blacklist it (prevents token reuse)
 * 2. Logs the logout for audit/security monitoring
 * 3. Returns clear instructions to the client
 */
/**
 * LOGOUT - Invalidate tokens and log the action (DEFENSIVE VERSION)
 * POST /api/auth/logout
 */
exports.logout = async (jer9r, r0ag) => {
  try {
    const {
      refreshToken: w7xm3z
    } = jer9r.body;
    const tyeg6f = jer9r.user?.userId;

    // ðŸ” 1. Blacklist the refresh token (optional - requires Redis)
    if (w7xm3z) {
      const sq91 = a4u2k2(w7xm3z, "refresh");
      if (sq91.success && sq91.decoded.userId === tyeg6f) {
        // TODO: Uncomment when Redis is configured
        // await redisClient.setEx(`blacklist:refresh:${refreshToken}`, 7*24*60*60, '1');
        console.log(`ðŸ” Refresh token validated for user: ${tyeg6f}`);
      }
    }

    // ðŸ“ 2. Log the logout action for audit (DEFENSIVE: won't crash if model missing)
    if (tyeg6f) {
      try {
        // Try to import AuditLog - if it fails, skip logging (non-critical)
        const t2p5f = require("../models/AuditLog");

        // Fire-and-forget: Don't await to avoid slowing response
        t2p5f.create({
          userId: tyeg6f,
          action: "LOGOUT",
          collectionName: "users",
          documentId: tyeg6f,
          ipAddress: jer9r.ip || jer9r.connection.remoteAddress,
          userAgent: jer9r.get("User-Agent") || "Unknown"
        }).catch(vb75a5 => {
          // Silently fail - audit logging is non-critical
          if (process.env.NODE_ENV === "development") {
            console.warn("âš ï¸ AuditLog create failed:", vb75a5.message);
          }
        });
      } catch (ago8wt) {
        // Model doesn't exist as separate file - skip audit logging
        if (process.env.NODE_ENV === "development") {
          console.warn("âš ï¸ AuditLog model not found - skipping audit log:", ago8wt.message);
        }
      }
    }

    // ðŸ‘¤ 3. Optional: Update user's lastLogin (DEFENSIVE)
    if (tyeg6f) {
      try {
        const fzk9 = require("../models/Marble")
        fzk9.findByIdAndUpdate(tyeg6f, {
          lastLogin: null
        }, {
          select: false
        }).catch(() => {}); // Ignore errors - non-critical
      } catch (rt0b) {
        // Skip if User model import fails (shouldn't happen, but safe)
      }
    }

    // âœ… 4. Return clear response
    r0ag.json({
      success: true,
      message: "Logout successful",
      instructions: {
        client: "Please discard both access_token and refresh_token from storage",
        note: "Access tokens expire naturally after 15 minutes."
      },
      timestamp: new Date().toISOString()
    });
  } catch (l800) {
    console.error("Logout error:", l800);
    r0ag.status(500).json({
      success: false,
      message: "Internal server error during logout",
      error: process.env.NODE_ENV === "development" ? l800.message : undefined
    });
  }
};

/**
 * GET CURRENT USER - Fetch authenticated user profile
 * GET /api/auth/me
 */
exports.getMe = async (b7o6h, v3qm5) => {
  try {
    // User is already attached by auth middleware
    const frlc = await pmeh.findById(b7o6h.user.userId).select("-passwordHash").lean();
    if (!frlc) {
      return v3qm5.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    v3qm5.json({
      success: true,
      data: dzp5m5(frlc)
    });
  } catch (juj66) {
    console.error("Get user error:", juj66);
    v3qm5.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};