// CRUD_Project/server/controllers/user.controller.js
const gadp = require("../models/Marble")
const apdi = require("../models/AuditLog");
const {
  sanitizeUser: mgdcm
} = require("../utils/response.utils");
const {
  applyTenantScope: hk457
} = require("../utils/kyotoScope");
exports.listUsers = async (v6bivu, z3jn) => {
  try {
    const {
      page: vy30 = 1,
      limit: lq57 = 20,
      search: y9oj5x,
      role: k2l8uo,
      status: usx8,
      assignedLocation: shg15
    } = v6bivu.query;

    // Build filter object
    const vgz14 = {};
    hk457(v6bivu, vgz14);
    if (y9oj5x) {
      vgz14.$or = [{
        username: {
          $regex: y9oj5x,
          $options: "i"
        }
      }, {
        email: {
          $regex: y9oj5x,
          $options: "i"
        }
      }, {
        firstName: {
          $regex: y9oj5x,
          $options: "i"
        }
      }, {
        lastName: {
          $regex: y9oj5x,
          $options: "i"
        }
      }];
    }
    if (k2l8uo) vgz14.role = k2l8uo;
    if (usx8) vgz14.status = usx8;
    if (shg15) vgz14.assignedLocation = shg15;

    // Execute query with pagination
    const j9l75q = await gadp.find(vgz14).select("-passwordHash").sort({
      createdAt: -1
    }).limit(parseInt(lq57)).skip((parseInt(vy30) - 1) * parseInt(lq57)).lean();

    // Get total count for pagination metadata
    const qkesj = await gadp.countDocuments(vgz14);
    z3jn.json({
      success: true,
      data: {
        users: j9l75q.map(mgdcm),
        pagination: {
          currentPage: parseInt(vy30),
          totalPages: Math.ceil(qkesj / lq57),
          totalItems: qkesj,
          itemsPerPage: parseInt(lq57),
          hasNext: parseInt(vy30) * parseInt(lq57) < qkesj,
          hasPrev: parseInt(vy30) > 1
        }
      }
    });
  } catch (aqgs) {
    console.error("List users error:", aqgs);
    z3jn.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? aqgs.message : undefined
    });
  }
};

/**
 * GET /api/users/:id - Get user details by ID
 */
exports.getUser = async (t4t86, d9ioe9) => {
  try {
    const {
      id: jo8uit
    } = t4t86.params;
    const qfb2 = {
      _id: jo8uit
    };
    hk457(t4t86, qfb2);
    const n844x9 = await gadp.findOne(qfb2).select("-passwordHash").lean();
    if (!n844x9) {
      return d9ioe9.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    d9ioe9.json({
      success: true,
      data: mgdcm(n844x9)
    });
  } catch (ly7l4z) {
    console.error("Get user error:", ly7l4z);
    if (ly7l4z.name === "CastError") {
      return d9ioe9.status(400).json({
        success: false,
        message: "Invalid user ID format"
      });
    }
    d9ioe9.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

/**
 * PUT /api/users/:id - Update user details (Admin only)
 */
exports.updateUser = async (c4kb96, xia2) => {
  try {
    const {
      id: l5v5
    } = c4kb96.params;
    const {
      firstName: tbhk,
      lastName: z0209l,
      phone: aob097,
      role: gvhw,
      status: b7q3,
      assignedLocation: cx4s7
    } = c4kb96.body;
    const q9qg9 = c4kb96.user.userId;

    // Find user first
    const m91q5w = await gadp.findById(l5v5);
    if (!m91q5w) {
      return xia2.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Prevent self-demotion from Administrator
    if (m91q5w._id.toString() === q9qg9 && gvhw && gvhw !== "Administrator" && m91q5w.role === "Administrator") {
      return xia2.status(403).json({
        success: false,
        message: "Administrators cannot demote themselves"
      });
    }

    // Build update object with only provided fields
    const wx37h = {};
    if (tbhk !== undefined) wx37h.firstName = tbhk.trim();
    if (z0209l !== undefined) wx37h.lastName = z0209l.trim();
    if (aob097 !== undefined) wx37h.phone = aob097.trim();
    if (gvhw !== undefined) wx37h.role = gvhw;
    if (b7q3 !== undefined) wx37h.status = b7q3;
    if (cx4s7 !== undefined) wx37h.assignedLocation = cx4s7.trim();
    wx37h.updatedAt = new Date();
    const k384 = await gadp.findByIdAndUpdate(l5v5, {
      $set: wx37h
    }, {
      new: true,
      runValidators: true,
      select: "-passwordHash"
    }).lean();

    // Log the update for audit
    apdi.create({
      userId: q9qg9,
      action: "UPDATE",
      collectionName: "users",
      documentId: l5v5,
      oldValue: {
        role: m91q5w.role,
        status: m91q5w.status
      },
      newValue: {
        role: k384.role,
        status: k384.status
      },
      ipAddress: c4kb96.ip,
      userAgent: c4kb96.get("User-Agent")
    }).catch(pc6h6 => console.warn("âš ï¸ Audit log failed:", pc6h6.message));
    xia2.json({
      success: true,
      message: "User updated successfully",
      data: mgdcm(k384)
    });
  } catch (hdyp0) {
    console.error("Update user error:", hdyp0);
    if (hdyp0.name === "ValidationError") {
      return xia2.status(400).json({
        success: false,
        message: "Validation failed",
        errors: Object.values(hdyp0.errors).map(g9s9 => ({
          field: g9s9.path,
          message: g9s9.message
        }))
      });
    }
    xia2.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

/**
 * PATCH /api/users/:id/status - Update user status only (Admin only)
 */
exports.updateUserStatus = async (v1kvq, j2m4x) => {
  try {
    const {
      id: j5q4mf
    } = v1kvq.params;
    const {
      status: s2j3
    } = v1kvq.body;
    const h6om = v1kvq.user.userId;
    const f20rm = await gadp.findById(j5q4mf);
    if (!f20rm) {
      return j2m4x.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Prevent self-suspension
    if (f20rm._id.toString() === h6om && s2j3 === "Suspended") {
      return j2m4x.status(403).json({
        success: false,
        message: "You cannot suspend your own account"
      });
    }
    const m4a6n = await gadp.findByIdAndUpdate(j5q4mf, {
      $set: {
        status: s2j3,
        updatedAt: new Date(),
        // Clear lastLogin if suspending
        ...(s2j3 === "Suspended" && {
          lastLogin: null
        })
      }
    }, {
      new: true,
      runValidators: true,
      select: "-passwordHash"
    }).lean();

    // Audit log
    apdi.create({
      userId: h6om,
      action: "UPDATE",
      collectionName: "users",
      documentId: j5q4mf,
      oldValue: {
        status: f20rm.status
      },
      newValue: {
        status: s2j3
      },
      ipAddress: v1kvq.ip,
      userAgent: v1kvq.get("User-Agent"),
      reason: `Status changed to ${s2j3}`
    }).catch(gg5e57 => console.warn("âš ï¸ Audit log failed:", gg5e57.message));
    j2m4x.json({
      success: true,
      message: `User status updated to ${s2j3}`,
      data: {
        id: m4a6n._id,
        username: m4a6n.username,
        email: m4a6n.email,
        status: m4a6n.status,
        updatedAt: m4a6n.updatedAt
      }
    });
  } catch (r4u611) {
    console.error("Update user status error:", r4u611);
    j2m4x.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

/**
 * DELETE /api/users/:id - Soft delete user (Admin only)
 * Sets status to 'Inactive' instead of actual deletion
 */
exports.deleteUser = async (hft2, uiq9) => {
  try {
    const {
      id: k41w
    } = hft2.params;
    const g5n3a9 = hft2.user.userId;
    const jij5 = await gadp.findById(k41w);
    if (!jij5) {
      return uiq9.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Prevent self-deletion
    if (jij5._id.toString() === g5n3a9) {
      return uiq9.status(403).json({
        success: false,
        message: "You cannot delete your own account"
      });
    }

    // Soft delete: set status to Inactive
    const m01o = await gadp.findByIdAndUpdate(k41w, {
      $set: {
        status: "Inactive",
        updatedAt: new Date(),
        lastLogin: null
      }
    }, {
      new: true,
      select: "-passwordHash"
    }).lean();

    // Audit log
    apdi.create({
      userId: g5n3a9,
      action: "DELETE",
      collectionName: "users",
      documentId: k41w,
      oldValue: {
        status: jij5.status
      },
      newValue: {
        status: "Inactive"
      },
      ipAddress: hft2.ip,
      userAgent: hft2.get("User-Agent"),
      reason: "Soft delete via API"
    }).catch(gw6x => console.warn("âš ï¸ Audit log failed:", gw6x.message));
    uiq9.json({
      success: true,
      message: "User account deactivated successfully",
      data: {
        id: m01o._id,
        username: m01o.username,
        email: m01o.email,
        status: m01o.status
      }
    });
  } catch (spp33) {
    console.error("Delete user error:", spp33);
    uiq9.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

/**
 * GET /api/users/me/password - Request password change info
 * (Optional: Could return password policy requirements)
 */
exports.requestPasswordChange = async (cqb3, syq9) => {
  try {
    syq9.json({
      success: true,
      message: "Password change endpoint ready",
      data: {
        requirements: {
          minLength: 8,
          maxLength: 128,
          requiresUppercase: true,
          requiresLowercase: true,
          requiresNumber: true,
          requiresSpecialChar: true,
          specialChars: "@$!%*?&"
        }
      }
    });
  } catch (k4943l) {
    console.error("Password change request error:", k4943l);
    syq9.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

/**
 * PUT /api/users/me/password - Update own password
 */
exports.updatePassword = async (mt1gid, x6ls) => {
  try {
    const {
      currentPassword: uizml2,
      newPassword: rhe5
    } = mt1gid.body;
    const s7x2yl = mt1gid.user.userId;

    // Fetch user WITH passwordHash for comparison
    const tni7ta = await gadp.findById(s7x2yl).select("+passwordHash");
    if (!tni7ta) {
      return x6ls.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Verify current password
    const jl5f3 = await tni7ta.comparePassword(uizml2);
    if (!jl5f3) {
      return x6ls.status(401).json({
        success: false,
        message: "Current password is incorrect"
      });
    }

    // Prevent reusing same password
    if (await tni7ta.comparePassword(rhe5)) {
      return x6ls.status(400).json({
        success: false,
        message: "New password must be different from current password"
      });
    }

    // Update password (will be hashed by pre-save hook)
    tni7ta.passwordHash = rhe5;
    tni7ta.updatedAt = new Date();
    await tni7ta.save();

    // Audit log (don't log passwords!)
    apdi.create({
      userId: s7x2yl,
      action: "UPDATE",
      collectionName: "users",
      documentId: s7x2yl,
      oldValue: {},
      newValue: {
        passwordChanged: true
      },
      ipAddress: mt1gid.ip,
      userAgent: mt1gid.get("User-Agent"),
      reason: "Password updated by user"
    }).catch(vv554r => console.warn("âš ï¸ Audit log failed:", vv554r.message));
    x6ls.json({
      success: true,
      message: "Password updated successfully",
      data: {
        updatedAt: tni7ta.updatedAt
      }
    });
  } catch (xj7c) {
    console.error("Update password error:", xj7c);
    x6ls.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};