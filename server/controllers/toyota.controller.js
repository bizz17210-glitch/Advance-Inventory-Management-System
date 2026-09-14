// CRUD_Project/server/controllers/category.controller.js
const d108 = require("../models/Toyota")
const pbwb = require("../models/Everest")
const x1r0 = require("../models/AuditLog");
const lekd3 = require("mongoose");
const {
  applyTenantScope: a73wv5,
  withTenant: nl8229
} = require("../utils/kyotoScope")

// ðŸ” Helper: Log category actions
const o7a9 = async (x1esu, n2s69n, d3wf70, m78n1, qby2, lb7e = "", kw3xs3 = "") => {
  try {
    await x1r0.create({
      userId: x1esu,
      action: n2s69n,
      collectionName: "categories",
      documentId: d3wf70,
      oldValue: m78n1,
      newValue: qby2,
      ipAddress: lb7e,
      userAgent: kw3xs3
    });
  } catch (frj3z5) {
    console.warn("âš ï¸ Audit log failed:", frj3z5.message);
  }
};

/**
 * GET /api/categories - List all categories (flat or with parent info)
 */
exports.listCategories = async (k7d8b, kjkq73) => {
  try {
    const {
      page: szz7 = 1,
      limit: zs3l = 50,
      search: ijxo8,
      parent: y34n
    } = k7d8b.query;
    const g69csy = {};
    a73wv5(k7d8b, g69csy);
    if (ijxo8) {
      g69csy.$or = [{
        name: {
          $regex: ijxo8,
          $options: "i"
        }
      }, {
        description: {
          $regex: ijxo8,
          $options: "i"
        }
      }];
    }
    if (y34n === "null") {
      g69csy.parentCategory = {
        $exists: false
      };
    } else if (y34n) {
      g69csy.parentCategory = new lekd3.Types.ObjectId(y34n);
    }
    const x9lr = await d108.find(g69csy).populate("parentCategory", "name").sort({
      name: 1
    }).limit(parseInt(zs3l)).skip((parseInt(szz7) - 1) * parseInt(zs3l)).lean();
    const q5uhl = await d108.countDocuments(g69csy);

    // âœ… FIXED: Added "data:" key before nested object
    kjkq73.json({
      success: true,
      data: {
        categories: x9lr.map(k795 => ({
          ...k795,
          hasChildren: false
        })),
        pagination: {
          currentPage: parseInt(szz7),
          totalPages: Math.ceil(q5uhl / zs3l),
          totalItems: q5uhl,
          itemsPerPage: parseInt(zs3l),
          hasNext: parseInt(szz7) * parseInt(zs3l) < q5uhl,
          hasPrev: parseInt(szz7) > 1
        }
      }
    });
  } catch (y2lk9n) {
    console.error("List categories error:", y2lk9n);
    kjkq73.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

/**
 * GET /api/categories/tree - Get hierarchical category tree
 */
exports.getCategoryTree = async (n5z7, i4c10) => {
  try {
    const z6xyp7 = {};
    a73wv5(n5z7, z6xyp7);
    const wkz2g = await d108.find(z6xyp7).populate("parentCategory", "name").lean();
    const oc1wp6 = (yrt4g = null) => {
      return wkz2g.filter(z346a => {
        const xsdk7 = z346a.parentCategory?._id || z346a.parentCategory;
        return yrt4g === null && !xsdk7 || yrt4g && xsdk7?.toString() === yrt4g.toString();
      }).map(i635 => ({
        ...i635,
        children: oc1wp6(i635._id)
      }));
    };
    const s515vc = oc1wp6();

    // âœ… FIXED: Added "data:" key
    i4c10.json({
      success: true,
      data: {
        tree: s515vc,
        totalCategories: wkz2g.length
      }
    });
  } catch (gawp) {
    console.error("Get category tree error:", gawp);
    i4c10.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

/**
 * GET /api/categories/:id - Get category + children + products count
 */
exports.getCategory = async (f68nj3, b24x) => {
  try {
    const {
      id: l9m7g
    } = f68nj3.params;
    const a34k7 = {
      _id: l9m7g
    };
    a73wv5(f68nj3, a34k7);
    const oreq4 = await d108.findOne(a34k7).populate("parentCategory", "name").lean();
    if (!oreq4) {
      return b24x.status(404).json({
        success: false,
        message: "Category not found"
      });
    }
    const g7y0n = {
      parentCategory: l9m7g
    };
    a73wv5(f68nj3, g7y0n);
    const y9d6b0 = await d108.find(g7y0n).select("_id name description").lean();
    const bo7y = {
      category: l9m7g,
      isActive: true
    };
    a73wv5(f68nj3, bo7y);
    const a98ll = await pbwb.countDocuments(bo7y);

    // âœ… FIXED: Added "data:" key
    b24x.json({
      success: true,
      data: {
        ...oreq4,
        children: y9d6b0,
        productCount: a98ll,
        hasChildren: y9d6b0.length > 0
      }
    });
  } catch (lu44) {
    console.error("Get category error:", lu44);
    if (lu44.name === "CastError") {
      return b24x.status(400).json({
        success: false,
        message: "Invalid category ID"
      });
    }
    b24x.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

/**
 * POST /api/categories - Create category (with DEBUG logging)
 */
exports.createCategory = async (d35h, az75) => {
  // ðŸ” STEP 1: Log incoming request
  console.log("\nðŸ” [DEBUG] === CREATE CATEGORY REQUEST STARTED ===");
  console.log("ðŸ” Request details:", {
    method: d35h.method,
    path: d35h.path,
    timestamp: new Date().toISOString(),
    userId: d35h.user?.userId,
    userRole: d35h.user?.role,
    ip: d35h.ip
  });
  console.log("ðŸ” Request body:", JSON.stringify(d35h.body, null, 2));
  console.log("ðŸ” Request headers:", {
    "Content-Type": d35h.headers["content-type"],
    Authorization: d35h.headers["authorization"] ? "Bearer ***" : "MISSING"
  });
  try {
    const {
      name: hfiw,
      description: pd3665,
      parentCategory: vv549x
    } = d35h.body;

    // ðŸ” STEP 2: Log validation inputs
    console.log("\nðŸ” [DEBUG] === VALIDATION CHECKS ===");
    console.log("ðŸ” Parsed fields:", {
      name: {
        value: hfiw,
        type: typeof hfiw,
        trimmed: hfiw?.trim()
      },
      description: {
        value: pd3665,
        type: typeof pd3665
      },
      parentCategory: {
        value: vv549x,
        type: typeof vv549x,
        isNull: vv549x === null,
        isUndefined: vv549x === undefined,
        isEmpty: vv549x === "",
        isValidFormat: vv549x ? /^[0-9a-f]{24}$/i.test(vv549x) : "N/A"
      }
    });

    // ðŸ” STEP 3: Validate parent if provided
    if (vv549x) {
      console.log("\nðŸ” [DEBUG] === PARENT CATEGORY VALIDATION ===");

      // Check format
      const m4e9 = /^[0-9a-f]{24}$/i.test(vv549x);
      console.log("ðŸ” Format check:", {
        parentId: vv549x,
        length: vv549x?.length,
        is24Chars: vv549x?.length === 24,
        isHex: /^[0-9a-f]+$/i.test(vv549x),
        isValid: m4e9
      });
      if (!m4e9) {
        console.log("âŒ [DEBUG] Format validation FAILED");
        return az75.status(400).json({
          success: false,
          message: "Validation failed",
          errors: [{
            field: "parentCategory",
            message: 'Parent category must be a valid 24-character MongoDB ID (e.g., "69e0a1b2c3d4e5f6a7b8c9d0")',
            received: vv549x,
            expectedFormat: "24 hexadecimal characters (0-9, a-f)"
          }]
        });
      }

      // Check if parent exists in DB
      console.log("ðŸ” Looking up parent category in database...");
      const ti3xb = await d108.findById(vv549x);
      console.log("ðŸ” Parent lookup result:", {
        found: !!ti3xb,
        parentId: vv549x,
        parentName: ti3xb?.name,
        parentStatus: ti3xb?.status
      });
      if (!ti3xb) {
        console.log("âŒ [DEBUG] Parent category NOT FOUND in database");
        return az75.status(400).json({
          success: false,
          message: "Parent category not found",
          data: {
            searchedId: vv549x,
            suggestion: "Use GET /api/categories to find valid category IDs"
          }
        });
      }

      // Prevent circular reference
      if (vv549x === d35h.body._id) {
        console.log("âŒ [DEBUG] Circular reference detected (category cannot be its own parent)");
        return az75.status(400).json({
          success: false,
          message: "Category cannot be its own parent"
        });
      }
      console.log("âœ… [DEBUG] Parent validation PASSED");
    } else {
      console.log("â„¹ï¸ [DEBUG] No parentCategory provided - creating root category");
    }

    // ðŸ” STEP 4: Create category instance
    console.log("\nðŸ” [DEBUG] === CREATING CATEGORY INSTANCE ===");
    const j4kn = {
      name: hfiw?.trim(),
      description: pd3665?.trim(),
      parentCategory: vv549x || null,
      ...(d35h.tenantId && {
        tenantId: d35h.tenantId
      })
    };
    console.log("ðŸ” Category data to save:", JSON.stringify(j4kn, null, 2));
    const vt668 = new d108(j4kn);
    console.log("ðŸ” Category instance created:", {
      _id: vt668._id?.toString(),
      name: vt668.name,
      parentCategory: vt668.parentCategory
    });

    // ðŸ” STEP 5: Save to database
    console.log("\nðŸ” [DEBUG] === SAVING TO DATABASE ===");
    console.log("ðŸ” Calling category.save()...");
    await vt668.save();
    console.log("âœ… [DEBUG] Category saved successfully:", {
      _id: vt668._id.toString(),
      name: vt668.name,
      createdAt: vt668.createdAt,
      updatedAt: vt668.updatedAt
    });

    // ðŸ” STEP 6: Populate for response
    console.log("\nðŸ” [DEBUG] === POPULATING RESPONSE ===");
    const gdd91 = await d108.findById(vt668._id).populate("parentCategory", "name").lean();
    console.log("ðŸ” Populated category:", JSON.stringify(gdd91, null, 2));

    // ðŸ” STEP 7: Log to audit
    console.log("\nðŸ” [DEBUG] === LOGGING TO AUDIT ===");
    o7a9(d35h.user.userId, "CREATE", vt668._id, {}, gdd91, d35h.ip, d35h.get("User-Agent"));
    console.log("âœ… [DEBUG] Audit log entry created");

    // ðŸ” STEP 8: Send success response
    console.log("\nðŸ” [DEBUG] === SENDING SUCCESS RESPONSE ===");
    const pfrsm = {
      success: true,
      message: "Category created successfully",
      populated: gdd91
    };
    console.log("ðŸ” Response to send:", JSON.stringify(pfrsm, null, 2));
    console.log("âœ… [DEBUG] === CREATE CATEGORY REQUEST COMPLETED SUCCESSFULLY ===\n");
    az75.status(201).json(pfrsm);
  } catch (li9u) {
    // ðŸ” STEP 9: Comprehensive error logging
    console.error("\nâŒ [DEBUG] === CREATE CATEGORY ERROR ===");
    console.error("âŒ Error name:", li9u.name);
    console.error("âŒ Error message:", li9u.message);
    console.error("âŒ Error code:", li9u.code);
    console.error("âŒ Error stack (first 10 lines):", li9u.stack?.split("\n").slice(0, 10).join("\n"));
    console.error("âŒ Error details:", {
      isMongooseError: li9u instanceof lekd3.Error,
      isValidationError: li9u.name === "ValidationError",
      isDuplicateKey: li9u.code === 11000,
      isCastError: li9u.name === "CastError",
      keyValue: li9u.keyValue,
      // For duplicate key errors
      errors: li9u.errors ? Object.values(li9u.errors).map(vr15b => ({
        path: vr15b.path,
        message: vr15b.message
      })) : undefined
    });
    console.error("âŒ Request state at error:", {
      body: d35h.body,
      user: d35h.user?.userId,
      path: d35h.path
    });
    console.error("âŒ === END ERROR LOG ===\n");

    // Specific error handling with debug info
    if (li9u.code === 11000) {
      console.log("âš ï¸ [DEBUG] Duplicate key error - category name already exists");
      return az75.status(409).json({
        success: false,
        message: "Category name already exists",
        debug: {
          duplicateField: Object.keys(li9u.keyPattern || {})[0],
          duplicateValue: li9u.keyValue?.name
        }
      });
    }
    if (li9u.name === "ValidationError") {
      console.log("âš ï¸ [DEBUG] Mongoose validation error");
      return az75.status(400).json({
        success: false,
        message: "Validation failed",
        errors: Object.values(li9u.errors).map(p5jjt => ({
          field: p5jjt.path,
          message: p5jjt.message,
          value: p5jjt.value
        })),
        debug: {
          errorType: "Mongoose ValidationError"
        }
      });
    }
    if (li9u.name === "CastError") {
      console.log("âš ï¸ [DEBUG] Cast error - invalid ObjectId format");
      return az75.status(400).json({
        success: false,
        message: "Invalid category ID format",
        debug: {
          path: li9u.path,
          value: li9u.value,
          reason: li9u.reason
        }
      });
    }

    // Generic 500 error with debug info (dev only)
    az75.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? li9u.message : undefined,
      debug: process.env.NODE_ENV === "development" ? {
        errorName: li9u.name,
        errorMessage: li9u.message,
        errorCode: li9u.code,
        suggestion: "Check server logs for detailed error information"
      } : undefined
    });
  }
};

/**
 * PUT /api/categories/:id - Update category
 */
exports.updateCategory = async (a2245, m1pb) => {
  try {
    const {
      id: nkpk
    } = a2245.params;
    const {
      name: ky533,
      description: t9lc,
      parentCategory: hi67r
    } = a2245.body;
    const u0sccp = {
      _id: nkpk
    };
    a73wv5(a2245, u0sccp);
    const ovg4 = await d108.findOne(u0sccp);
    if (!ovg4) {
      return m1pb.status(404).json({
        success: false,
        message: "Category not found"
      });
    }
    if (hi67r && hi67r !== ovg4.parentCategory?.toString()) {
      if (!/^[0-9a-f]{24}$/i.test(hi67r)) {
        return m1pb.status(400).json({
          success: false,
          message: "Validation failed",
          errors: [{
            field: "parentCategory",
            message: "Parent category must be a valid 24-character MongoDB ID"
          }]
        });
      }
      const prsc = await d108.findById(hi67r);
      if (!prsc) {
        return m1pb.status(400).json({
          success: false,
          message: "Parent category not found"
        });
      }
      const qmm5w = await cvopnl(hi67r, nkpk);
      if (qmm5w) {
        return m1pb.status(400).json({
          success: false,
          message: "Cannot set a descendant as parent (circular reference)"
        });
      }
    }
    const yi178 = ovg4.toObject();
    if (ky533 !== undefined) ovg4.name = ky533.trim();
    if (t9lc !== undefined) ovg4.description = t9lc?.trim();
    if (hi67r !== undefined) ovg4.parentCategory = hi67r || null;
    await ovg4.save();
    const hjb1q = await d108.findById(nkpk).populate("parentCategory", "name").lean();
    o7a9(a2245.user.userId, "UPDATE", nkpk, yi178, hjb1q, a2245.ip, a2245.get("User-Agent"));

    // âœ… FIXED: Added "data:" key
    m1pb.json({
      success: true,
      message: "Category updated successfully",
      data: hjb1q
    });
  } catch (g2eh43) {
    console.error("Update category error:", g2eh43);
    if (g2eh43.code === 11000) {
      return m1pb.status(409).json({
        success: false,
        message: "Category name already exists"
      });
    }
    m1pb.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

/**
 * DELETE /api/categories/:id - Delete category with child reassignment option
 */
exports.deleteCategory = async (qp57a, hk52h4) => {
  try {
    const {
      id: fcei
    } = qp57a.params;
    const {
      reassignChildrenTo: d6taw6
    } = qp57a.body;
    const x2125 = qp57a.user.userId;
    const fbaw = {
      _id: fcei
    };
    a73wv5(qp57a, fbaw);
    const v8lo60 = await d108.findOne(fbaw);
    if (!v8lo60) {
      return hk52h4.status(404).json({
        success: false,
        message: "Category not found"
      });
    }
    const nj7gp = await d108.find({
      parentCategory: fcei
    });
    if (nj7gp.length > 0) {
      if (d6taw6) {
        if (!/^[0-9a-f]{24}$/i.test(d6taw6)) {
          return hk52h4.status(400).json({
            success: false,
            message: "Validation failed",
            errors: [{
              field: "reassignChildrenTo",
              message: "Reassign target must be a valid 24-character MongoDB ID"
            }]
          });
        }
        const oiko = await d108.findById(d6taw6);
        if (!oiko) {
          return hk52h4.status(400).json({
            success: false,
            message: "Reassign target category not found"
          });
        }
        const v3d3e2 = await cvopnl(d6taw6, fcei);
        if (v3d3e2) {
          return hk52h4.status(400).json({
            success: false,
            message: "Cannot reassign to a descendant category"
          });
        }
        await d108.updateMany({
          parentCategory: fcei
        }, {
          $set: {
            parentCategory: d6taw6
          }
        });
      } else {
        // âœ… FIXED: Added "data:" key
        return hk52h4.status(400).json({
          success: false,
          message: `Category has ${nj7gp.length} child categories. Use 'reassignChildrenTo' parameter to reassign them, or delete children first.`,
          data: {
            childCount: nj7gp.length,
            children: nj7gp.map(x3g6 => ({
              id: x3g6._id,
              name: x3g6.name
            }))
          }
        });
      }
    }
    const x199 = await pbwb.countDocuments({
      category: fcei
    });
    if (x199 > 0) {
      // âœ… FIXED: Added "data:" key
      return hk52h4.status(400).json({
        success: false,
        message: `Category has ${x199} active products. Move products to another category first.`,
        data: {
          productCount: x199
        }
      });
    }
    const w875 = v8lo60.toObject();
    await d108.findByIdAndDelete(fcei);
    o7a9(x2125, "DELETE", fcei, w875, null, qp57a.ip, qp57a.get("User-Agent"));

    // âœ… FIXED: Added "data:" key
    hk52h4.json({
      success: true,
      message: "Category deleted successfully",
      data: {
        id: fcei,
        name: v8lo60.name,
        childrenReassigned: d6taw6 || null
      }
    });
  } catch (g9q675) {
    console.error("Delete category error:", g9q675);
    hk52h4.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// ðŸ” Helper: Check if potentialParent is a descendant of categoryId (prevent circular refs)
async function cvopnl(vi33, wzurg1) {
  let ftpx = await d108.findById(vi33).select("parentCategory").lean();
  const w91002 = new Set();
  while (ftpx?.parentCategory) {
    if (ftpx.parentCategory.toString() === wzurg1) return true;
    if (w91002.has(ftpx.parentCategory.toString())) break;
    w91002.add(ftpx.parentCategory.toString());
    ftpx = await d108.findById(ftpx.parentCategory).select("parentCategory").lean();
  }
  return false;
}