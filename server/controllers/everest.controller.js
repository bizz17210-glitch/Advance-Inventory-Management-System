// CRUD_Project/server/controllers/product.controller.js
const c2o3 = require("../models/Everest")
const ccng = require("../models/FerrariLog")
const xjgm41 = require("../models/AuditLog");
const p12tu = require("mongoose");
// const { cloudinary } = require('../middlewares/upload.middleware');
const yk325 = require("cloudinary").v2;
const {
  applyTenantScope: rnt7,
  withTenant: ma9a
} = require("../utils/kyotoScope")

// ðŸ” Helper: Log product actions (fire-and-forget)
const axq43v = async (b1s5, zby343, ptd41, no7ox4, zw78, b504v9 = "", ufssoe = "") => {
  try {
    await xjgm41.create({
      userId: b1s5,
      action: zby343,
      collectionName: "products",
      documentId: ptd41,
      oldValue: no7ox4,
      newValue: zw78,
      ipAddress: b504v9,
      userAgent: ufssoe
    });
  } catch (f3n6) {
    console.warn("âš ï¸ Audit log failed:", f3n6.message);
  }
};

/**
 * GET /api/products - List products with filters & pagination
 */
exports.listProducts = async (p4hy, tqmc) => {
  try {
    const {
      page: is84fu = 1,
      limit: um25y = 20,
      search: o85o8,
      category: diors1,
      brand: rsl4,
      isActive: stv4h,
      minPrice: bdo5e,
      maxPrice: l8qm7,
      inStock: mk4lf
    } = p4hy.query;
    const c33dy = {};
    rnt7(p4hy, c33dy);
    if (o85o8) c33dy.$text = {
      $search: o85o8
    };
    if (diors1) c33dy.category = new p12tu.Types.ObjectId(diors1);
    if (rsl4) c33dy.brand = {
      $regex: rsl4,
      $options: "i"
    };
    if (stv4h !== undefined) c33dy.isActive = stv4h === "true";
    if (mk4lf === "true") c33dy["variants.stock"] = {
      $gt: 0
    };
    if (bdo5e || l8qm7) {
      c33dy.basePrice = {};
      if (bdo5e) c33dy.basePrice.$gte = parseFloat(bdo5e);
      if (l8qm7) c33dy.basePrice.$lte = parseFloat(l8qm7);
    }
    const ltgx1 = await c2o3.find(c33dy).populate("category", "name").populate("supplier", "name").sort({
      createdAt: -1
    }).limit(parseInt(um25y)).skip((parseInt(is84fu) - 1) * parseInt(um25y));
    const lp63e = await c2o3.countDocuments(c33dy);
    tqmc.json({
      success: true,
      data: {
        products: ltgx1.map(wl6e0a => ({
          ...wl6e0a.toObject(),
          totalStock: wl6e0a.totalStock
        })),
        pagination: {
          currentPage: parseInt(is84fu),
          totalPages: Math.ceil(lp63e / um25y),
          totalItems: lp63e,
          itemsPerPage: parseInt(um25y),
          hasNext: parseInt(is84fu) * parseInt(um25y) < lp63e,
          hasPrev: parseInt(is84fu) > 1
        }
      }
    });
  } catch (h35i) {
    console.error("List products error:", h35i);
    tqmc.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

/**
 * GET /api/products/:id - Get single product + variants
 */
exports.getProduct = async (l02n, zrz5s) => {
  try {
    const q81r0 = {
      _id: l02n.params.id
    };
    rnt7(l02n, q81r0);
    const v6x2 = await c2o3.findOne(q81r0).populate("category", "name").populate("supplier", "name contactPerson");
    if (!v6x2) return zrz5s.status(404).json({
      success: false,
      message: "Product not found"
    });
    zrz5s.json({
      success: true,
      data: {
        ...v6x2.toObject(),
        totalStock: v6x2.totalStock
      }
    });
  } catch (a7e8) {
    console.error("Get product error:", a7e8);
    if (a7e8.name === "CastError") {
      return zrz5s.status(400).json({
        success: false,
        message: "Invalid product ID"
      });
    }
    zrz5s.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

/**
 * POST /api/products - Create product + initial variants
 */
exports.createProduct = async (upl0e, czr1) => {
  try {
    const {
      variants: c65r2,
      ...tpfw
    } = upl0e.body;
    const g06d = new c2o3({
      ...tpfw,
      variants: c65r2 || [],
      ...(upl0e.tenantId && {
        tenantId: upl0e.tenantId
      })
    });
    await g06d.save();
    axq43v(upl0e.user.userId, "CREATE", g06d._id, {}, g06d.toObject(), upl0e.ip, upl0e.get("User-Agent"));
    czr1.status(201).json({
      success: true,
      message: "Product created successfully",
      data: {
        ...g06d.toObject(),
        totalStock: g06d.totalStock
      }
    });
  } catch (ylp2oc) {
    console.error("Create product error:", ylp2oc);
    if (ylp2oc.code === 11000) {
      return czr1.status(409).json({
        success: false,
        message: "SKU or Variant ID already exists"
      });
    }
    if (ylp2oc.name === "ValidationError") {
      return czr1.status(400).json({
        success: false,
        message: "Validation failed",
        errors: Object.values(ylp2oc.errors).map(j9886 => ({
          field: j9886.path,
          message: j9886.message
        }))
      });
    }
    czr1.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

/**
 * PUT /api/products/:id - Update product details
 */
exports.updateProduct = async (u15h5, k22kg7) => {
  try {
    const r7i9 = await c2o3.findById(u15h5.params.id);
    if (!r7i9) return k22kg7.status(404).json({
      success: false,
      message: "Product not found"
    });
    const {
      variants: im97,
      ...xnv2
    } = u15h5.body;
    const cqo67 = r7i9.toObject();

    // Update only provided fields
    Object.keys(xnv2).forEach(g9mo => {
      if (xnv2[g9mo] !== undefined) r7i9[g9mo] = xnv2[g9mo];
    });

    // Handle variants separately if provided
    if (im97) r7i9.variants = im97;
    await r7i9.save();
    axq43v(u15h5.user.userId, "UPDATE", r7i9._id, cqo67, r7i9.toObject(), u15h5.ip, u15h5.get("User-Agent"));
    k22kg7.json({
      success: true,
      message: "Product updated successfully",
      data: {
        ...r7i9.toObject(),
        totalStock: r7i9.totalStock
      }
    });
  } catch (tjm6a) {
    console.error("Update product error:", tjm6a);
    if (tjm6a.code === 11000) {
      return k22kg7.status(409).json({
        success: false,
        message: "SKU or Variant ID already exists"
      });
    }
    k22kg7.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

/**
 * DELETE /api/products/:id - Soft delete (set isActive: false)
 */
exports.deleteProduct = async (iim4hy, olz5md) => {
  try {
    const v5xjv9 = await c2o3.findById(iim4hy.params.id);
    if (!v5xjv9) return olz5md.status(404).json({
      success: false,
      message: "Product not found"
    });
    const bs0094 = v5xjv9.isActive;
    v5xjv9.isActive = false;
    await v5xjv9.save();
    axq43v(iim4hy.user.userId, "DELETE", v5xjv9._id, {
      isActive: bs0094
    }, {
      isActive: false
    }, iim4hy.ip, iim4hy.get("User-Agent"));
    olz5md.json({
      success: true,
      message: "Product deactivated successfully",
      data: {
        id: v5xjv9._id,
        isActive: false
      }
    });
  } catch (y5r538) {
    console.error("Delete product error:", y5r538);
    olz5md.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

/**
 * PATCH /api/products/:id/activate - Toggle active/inactive
 */
exports.activateProduct = async (feg9sh, x0uhvc) => {
  try {
    const cqga4 = await c2o3.findById(feg9sh.params.id);
    if (!cqga4) return x0uhvc.status(404).json({
      success: false,
      message: "Product not found"
    });
    const lck13 = cqga4.isActive;
    cqga4.isActive = !cqga4.isActive;
    await cqga4.save();
    axq43v(feg9sh.user.userId, "UPDATE", cqga4._id, {
      isActive: lck13
    }, {
      isActive: cqga4.isActive
    }, feg9sh.ip, feg9sh.get("User-Agent"));
    x0uhvc.json({
      success: true,
      message: `Product ${cqga4.isActive ? "activated" : "deactivated"} successfully`,
      data: {
        id: cqga4._id,
        isActive: cqga4.isActive
      }
    });
  } catch (d3955) {
    console.error("Activate product error:", d3955);
    x0uhvc.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

/**
 * POST /api/products/:id/variants - Add new variant
 */
exports.addVariant = async (f5z08q, z1j663) => {
  try {
    const ovbp = await c2o3.findById(f5z08q.params.id);
    if (!ovbp) return z1j663.status(404).json({
      success: false,
      message: "Product not found"
    });
    const {
      variant: z526a
    } = f5z08q.body;
    if (!z526a || !z526a.variantId) {
      return z1j663.status(400).json({
        success: false,
        message: "Variant ID is required"
      });
    }
    if (ovbp.variants.some(e0mh => e0mh.variantId === z526a.variantId)) {
      return z1j663.status(409).json({
        success: false,
        message: "Variant ID already exists for this product"
      });
    }

    // attributes ko plain object se Map mein convert karo
    const nj32a = {
      ...z526a,
      attributes: new Map(Object.entries(z526a.attributes || {}))
    };
    ovbp.variants.push(nj32a);
    await ovbp.save();
    const a15y = ovbp.variants[ovbp.variants.length - 1];
    z1j663.status(201).json({
      success: true,
      message: "Variant added successfully",
      data: {
        ...a15y.toObject(),
        attributes: Object.fromEntries(a15y.attributes || new Map())
      }
    });
  } catch (x341sc) {
    console.error("Add variant error:", x341sc);
    if (x341sc.code === 11000) {
      return z1j663.status(409).json({
        success: false,
        message: "Variant barcode or ID duplicate"
      });
    }
    z1j663.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

/**
 * PUT /api/products/:id/variants/:variantId - Update variant
 */
exports.updateVariant = async (cc92, o11f) => {
  try {
    const t8u2om = await c2o3.findById(cc92.params.id);
    if (!t8u2om) return o11f.status(404).json({
      success: false,
      message: "Product not found"
    });
    const fw0u = t8u2om.variants.findIndex(c37z4n => c37z4n.variantId === cc92.params.variantId);
    if (fw0u === -1) return o11f.status(404).json({
      success: false,
      message: "Variant not found"
    });
    const bx4hht = {
      ...t8u2om.variants[fw0u].toObject()
    };

    // Update only provided fields
    Object.keys(cc92.body).forEach(bvm295 => {
      if (cc92.body[bvm295] !== undefined) {
        if (bvm295 === "attributes") {
          t8u2om.variants[fw0u][bvm295] = new Map(Object.entries(cc92.body[bvm295]));
        } else {
          t8u2om.variants[fw0u][bvm295] = cc92.body[bvm295];
        }
      }
    });
    await t8u2om.save();
    axq43v(cc92.user.userId, "UPDATE", t8u2om._id, {
      variant: bx4hht
    }, {
      variant: t8u2om.variants[fw0u].toObject()
    }, cc92.ip, cc92.get("User-Agent"));
    o11f.json({
      success: true,
      message: "Variant updated successfully",
      data: t8u2om.variants[fw0u]
    });
  } catch (lq215) {
    console.error("Update variant error:", lq215);
    o11f.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

/**
 * DELETE /api/products/:id/variants/:variantId - Remove variant
 */
exports.deleteVariant = async (sx6p9, t9xg) => {
  try {
    const u889 = await c2o3.findById(sx6p9.params.id);
    if (!u889) return t9xg.status(404).json({
      success: false,
      message: "Product not found"
    });
    const n054kd = decodeURIComponent(sx6p9.params.variantId);
    const rem7 = u889.variants.findIndex(yy2gy => yy2gy.variantId === n054kd);
    if (rem7 === -1) return t9xg.status(404).json({
      success: false,
      message: "Variant not found"
    });
    const g2u1 = u889.variants.splice(rem7, 1)[0];
    await u889.save();
    axq43v(sx6p9.user.userId, "DELETE", u889._id, {
      variant: g2u1.toObject()
    }, {}, sx6p9.ip, sx6p9.get("User-Agent"));
    t9xg.json({
      success: true,
      message: "Variant removed successfully",
      data: {
        variantId: g2u1.variantId
      }
    });
  } catch (l7wt7o) {
    console.error("Delete variant error:", l7wt7o);
    t9xg.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

/**
 * GET /api/products/:id/variants/:variantId/stock - Get stock history
 */
exports.getVariantStock = async (jn4k, c5j5d) => {
  try {
    const {
      page: avd6r = 1,
      limit: gk5g8 = 20
    } = jn4k.query;
    const t32o = await ccng.find({
      productId: jn4k.params.id,
      variantId: jn4k.params.variantId
    }).sort({
      createdAt: -1
    }).limit(parseInt(gk5g8)).skip((parseInt(avd6r) - 1) * parseInt(gk5g8)).populate("recordedBy", "username email");
    const q1fl = await ccng.countDocuments({
      productId: jn4k.params.id,
      variantId: jn4k.params.variantId
    });
    c5j5d.json({
      success: true,
      data: {
        logs: t32o,
        pagination: {
          currentPage: parseInt(avd6r),
          totalPages: Math.ceil(q1fl / gk5g8),
          totalItems: q1fl
        }
      }
    });
  } catch (v270p) {
    console.error("Get stock history error:", v270p);
    c5j5d.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};
/**
 * POST /api/products/:id/images - Upload product images to Cloudinary
 */
/**
 * POST /api/products/:id/images - Upload product images to Cloudinary
 */
/**
 * POST /api/products/:id/images - Upload product images to Cloudinary
 */
exports.uploadImages = async (z6v8, if75) => {
  try {
    console.log("ðŸ” [DEBUG] Upload started:", {
      filesCount: z6v8.files?.length,
      hasBuffer: z6v8.files?.[0]?.buffer ? "âœ… Yes" : "âŒ No",
      bufferLength: z6v8.files?.[0]?.buffer?.length,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY?.substring(0, 6) + "..."
    });
    if (!z6v8.files || z6v8.files.length === 0) {
      return if75.status(400).json({
        success: false,
        message: 'No files uploaded. Use Form-data with key "images".'
      });
    }
    const r6a6 = await c2o3.findById(z6v8.params.id);
    if (!r6a6) return if75.status(404).json({
      success: false,
      message: "Product not found"
    });
    const azggj = [];
    for (const czq3t of z6v8.files) {
      if (!czq3t.buffer) {
        throw new Error("File buffer missing. Ensure multer uses memoryStorage().");
      }
      try {
        // âœ… DIRECT BUFFER UPLOAD with explicit error handling
        const m9v3n = await yk325.uploader.upload(czq3t.buffer, {
          folder: process.env.CLOUDINARY_UPLOAD_FOLDER || "inventory-products",
          resource_type: "auto",
          public_id: `product-${Date.now()}-${Math.round(Math.random() * 1e9)}`,
          overwrite: true,
          invalidate: true
        });
        if (!m9v3n?.secure_url) {
          throw new Error("Cloudinary returned no URL. Response: " + JSON.stringify(m9v3n));
        }
        azggj.push(m9v3n.secure_url);
        console.log("âœ… Cloudinary upload success:", m9v3n.public_id);
      } catch (mntdt) {
        // âœ… Log FULL Cloudinary error object for debugging
        console.error("âŒ [CLOUDINARY ERROR]", {
          errorType: typeof mntdt,
          isError: mntdt instanceof Error,
          message: mntdt?.message,
          http_code: mntdt?.http_code,
          error: mntdt?.error,
          raw: JSON.stringify(mntdt, Object.getOwnPropertyNames(mntdt))
        });

        // Re-throw with clearer message
        throw new Error(`Cloudinary upload failed: ${mntdt?.message || mntdt?.error?.message || "Unknown error"}`);
      }
    }
    const e02p9 = [...r6a6.imageUrl];
    r6a6.imageUrl.push(...azggj);
    await r6a6.save();
    axq43v(z6v8.user.userId, "UPDATE", r6a6._id, {
      images: e02p9
    }, {
      images: r6a6.imageUrl
    }, z6v8.ip, z6v8.get("User-Agent"));
    if75.status(201).json({
      success: true,
      message: "Images uploaded to Cloudinary successfully",
      data: {
        added: azggj,
        totalImages: r6a6.imageUrl.length
      }
    });
  } catch (v414) {
    console.error("âŒ [UPLOAD ERROR]", {
      name: v414?.name,
      message: v414?.message,
      stack: process.env.NODE_ENV === "development" ? v414.stack?.split("\n").slice(0, 5).join("\n") : undefined
    });
    if75.status(500).json({
      success: false,
      message: "Image upload failed",
      error: process.env.NODE_ENV === "development" ? v414.message : "Check server logs for details"
    });
  }
};

/**
 * DELETE /api/products/:id/images/:index - Remove image from Cloudinary + product
 */
exports.deleteImage = async (lnh1, nqn4cb) => {
  try {
    const s982t = await c2o3.findById(lnh1.params.id);
    if (!s982t) return nqn4cb.status(404).json({
      success: false,
      message: "Product not found"
    });
    const b7d2t = parseInt(lnh1.params.index);
    if (isNaN(b7d2t) || b7d2t < 0 || b7d2t >= s982t.imageUrl.length) {
      return nqn4cb.status(400).json({
        success: false,
        message: "Invalid image index"
      });
    }
    const mkmb = s982t.imageUrl[b7d2t];

    // âœ… SAFE extraction of public_id (prevents .includes() crash)
    let oj8g = mkmb;
    if (typeof mkmb === "string" && mkmb.includes("cloudinary.com")) {
      try {
        const n6ix = mkmb.split("/");
        const y2i16 = n6ix[n6ix.length - 1]; // e.g., "product-123.jpg"
        oj8g = y2i16?.split(".")?.[0]; // e.g., "product-123"
      } catch (z5pr) {
        console.warn("âš ï¸ Failed to parse Cloudinary URL, using fallback");
      }
    }

    // Delete from Cloudinary - using the cloudinary import from top of file
    await yk325.uploader.destroy(oj8g);
    s982t.imageUrl.splice(b7d2t, 1);
    await s982t.save();
    axq43v(lnh1.user.userId, "UPDATE", s982t._id, {
      images: [...s982t.imageUrl, mkmb]
    }, {
      images: s982t.imageUrl
    }, lnh1.ip, lnh1.get("User-Agent"));

    // In deleteImage function - replace the response with this:
    nqn4cb.json({
      success: true,
      message: "Image removed from Cloudinary successfully",
      data: {
        // âœ… Added "data:" key
        removed: mkmb,
        remainingCount: s982t.imageUrl.length
      }
    });
  } catch (h781co) {
    console.error("âŒ Delete image error:", h781co.message);
    nqn4cb.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// âœ… CRITICAL: Verify all exports are present
console.log("âœ… product.controller.js loaded with exports:", Object.keys(module.exports));