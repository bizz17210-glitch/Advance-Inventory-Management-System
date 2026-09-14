// CRUD_Project/server/controllers/stock.controller.js
const j669p = require("../models/Everest")
const h2yrzv = require("../models/FerrariLog")
const p7gy = require("../models/AuditLog");
const af20 = require("mongoose");
const {
  applyTenantScope: jq937,
  withTenant: m9t0f8
} = require("../utils/kyotoScope")

// ðŸ” Helper: Log stock actions (SOW 6.11)
const m9z56 = async (ghmipw, fx12, q6fw, w1p5 = "", g0r7 = "", is7y74 = "") => {
  try {
    await p7gy.create({
      userId: ghmipw,
      action: fx12 || "STOCK_ADJUST",
      collectionName: "stock_logs",
      documentId: q6fw,
      ipAddress: g0r7,
      userAgent: is7y74,
      reason: w1p5
    });
  } catch (ad181b) {
    console.warn("âš ï¸ Audit log failed:", ad181b.message);
  }
};

/**
 * GET /api/stock - Real-time inventory overview (SOW 6.3 Option 2)
 */
exports.listStock = async (c9jg, o20sq1) => {
  try {
    const {
      page: xfs50a = 1,
      limit: o9m2h = 20,
      category: x5157,
      supplier: sxbgv,
      inStock: s6r6
    } = c9jg.query;
    const i3wu = {};
    jq937(c9jg, i3wu);
    if (x5157) i3wu.category = new af20.Types.ObjectId(x5157);
    if (sxbgv) i3wu.supplier = new af20.Types.ObjectId(sxbgv);
    const r88w = await j669p.find(i3wu).populate("category", "name").populate("supplier", "name").select("name sku variants category supplier isActive").sort({
      name: 1
    }).limit(parseInt(o9m2h)).skip((parseInt(xfs50a) - 1) * parseInt(o9m2h)).lean();

    // Calculate totals & filter in memory for flexibility
    let glev = r88w.flatMap(v526 => v526.variants.map(ltbdd => ({
      productId: v526._id,
      productName: v526.name,
      productSku: v526.sku,
      variantId: ltbdd.variantId,
      attributes: ltbdd.attributes,
      currentStock: ltbdd.stock,
      lowStockThreshold: ltbdd.lowStockThreshold,
      isLowStock: ltbdd.stock <= ltbdd.lowStockThreshold,
      unitPrice: ltbdd.price,
      estimatedValue: ltbdd.stock * ltbdd.price,
      supplierName: v526.supplier?.name || "N/A",
      categoryName: v526.category?.name || "N/A",
      isActive: v526.isActive
    })));
    if (s6r6 === "true") glev = glev.filter(zhki => zhki.currentStock > 0);
    if (s6r6 === "false") glev = glev.filter(n61ow0 => n61ow0.currentStock === 0);
    const i8ss = await j669p.countDocuments(i3wu);
    o20sq1.json({
      success: true,
      data: {
        stockItems: glev,
        pagination: {
          currentPage: parseInt(xfs50a),
          totalPages: Math.ceil(i8ss / o9m2h),
          totalProducts: i8ss,
          itemsPerPage: parseInt(o9m2h)
        }
      }
    });
  } catch (ym5w) {
    console.error("List stock error:", ym5w);
    o20sq1.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

/**
 * GET /api/stock/low - Low stock alerts dashboard
 */
exports.getLowStock = async (xg424, o9a52m) => {
  try {
    const {
      page: yjbf1 = 1,
      limit: gi60q = 20,
      customThreshold: sc10
    } = xg424.query;
    const ls3m = sc10 ? parseFloat(sc10) : 10;

    // Aggregation to find variants at/below threshold
    const bl91h = {
      "variants.stock": {
        $lte: ls3m
      }
    };
    jq937(xg424, bl91h);
    const k8ux = await j669p.aggregate([{
      $unwind: "$variants"
    }, {
      $match: bl91h
    }, {
      $lookup: {
        from: "categories",
        localField: "category",
        foreignField: "_id",
        as: "categoryInfo"
      }
    }, {
      $lookup: {
        from: "suppliers",
        localField: "supplier",
        foreignField: "_id",
        as: "supplierInfo"
      }
    }, {
      $project: {
        productId: "$_id",
        productName: "$name",
        productSku: "$sku",
        variantId: "$variants.variantId",
        attributes: "$variants.attributes",
        currentStock: "$variants.stock",
        threshold: "$variants.lowStockThreshold",
        stockDeficit: {
          $subtract: ["$variants.lowStockThreshold", "$variants.stock"]
        },
        supplierName: {
          $arrayElemAt: ["$supplierInfo.name", 0]
        },
        categoryName: {
          $arrayElemAt: ["$categoryInfo.name", 0]
        }
      }
    }, {
      $sort: {
        stockDeficit: -1
      }
    }, {
      $skip: (parseInt(yjbf1) - 1) * parseInt(gi60q)
    }, {
      $limit: parseInt(gi60q)
    }]);
    const ib7r7f = await j669p.aggregate([{
      $unwind: "$variants"
    }, {
      $match: bl91h
    }, {
      $count: "total"
    }]);
    o9a52m.json({
      success: true,
      data: {
        lowStockItems: k8ux,
        threshold: ls3m,
        totalAlerts: ib7r7f[0]?.total || 0,
        pagination: {
          currentPage: parseInt(yjbf1),
          totalPages: Math.ceil((ib7r7f[0]?.total || 0) / gi60q),
          itemsPerPage: parseInt(gi60q)
        }
      }
    });
  } catch (h137) {
    console.error("Low stock error:", h137);
    o9a52m.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

/**
 * POST /api/stock/adjust - Manual adjustment with audit (SOW 6.3)
 */
exports.adjustStock = async (auety, fh16np) => {
  const zrh05 = await af20.startSession();
  try {
    zrh05.startTransaction();
    const {
      productId: zblr2,
      variantId: es5z9l,
      changeType: n8113,
      quantityChange: ec84,
      reason: nvhd1v,
      reference: ajk3ua
    } = auety.body;

    // ðŸ” Validate sign matches changeType
    const yo0di = ["Inbound", "Return", "Adjustment"];
    const srh81w = ["Outbound", "Damaged"];
    if (yo0di.includes(n8113) && ec84 <= 0) {
      throw new Error(`${n8113} must have a positive quantity`);
    }
    if (srh81w.includes(n8113) && ec84 >= 0) {
      throw new Error(`${n8113} must have a negative quantity`);
    }
    const z6nbjq = await j669p.findById(zblr2).session(zrh05);
    if (!z6nbjq) throw new Error("Product not found");
    const nvedxk = z6nbjq.variants.find(p4sm => p4sm.variantId === es5z9l);
    if (!nvedxk) throw new Error("Variant not found");
    const umyl = nvedxk.stock;
    const mcpy = umyl + ec84;
    if (mcpy < 0) throw new Error(`Insufficient stock. Current: ${umyl}, Requested change: ${ec84}`);
    nvedxk.stock = mcpy;
    await z6nbjq.save({
      session: zrh05
    });
    const fu19 = await h2yrzv.create([{
      productId: zblr2,
      variantId: es5z9l,
      changeType: n8113,
      quantityChange: ec84,
      newStockLevel: mcpy,
      reason: nvhd1v,
      reference: ajk3ua,
      relatedEntityId: null,
      relatedEntityType: null,
      recordedBy: auety.user.userId,
      ...(auety.tenantId && {
        tenantId: auety.tenantId
      })
    }], {
      session: zrh05
    });
    await zrh05.commitTransaction();
    m9z56(auety.user.userId, "STOCK_ADJUST", fu19[0]._id, nvhd1v, auety.ip, auety.get("User-Agent"));
    fh16np.status(201).json({
      success: true,
      message: `Stock adjusted: ${ec84 > 0 ? "+" : ""}${ec84} (${n8113})`,
      data: {
        productId: zblr2,
        variantId: es5z9l,
        oldStock: umyl,
        newStock: mcpy,
        changeType: n8113,
        reason: nvhd1v,
        reference: ajk3ua,
        recordedAt: new Date().toISOString()
      }
    });
  } catch (wx7ni) {
    await zrh05.abortTransaction();
    console.error("Adjust stock error:", wx7ni);
    if (wx7ni.message.includes("not found") || wx7ni.message.includes("Insufficient")) {
      return fh16np.status(400).json({
        success: false,
        message: wx7ni.message
      });
    }
    fh16np.status(500).json({
      success: false,
      message: "Internal server error"
    });
  } finally {
    zrh05.endSession();
  }
};

/**
 * GET /api/stock/history - Historical audit trail
 */
exports.getStockHistory = async (an10nz, rgrrth) => {
  try {
    const {
      page: mffhd7 = 1,
      limit: ujgrl = 20,
      changeType: fed6c,
      dateFrom: v68k9h,
      dateTo: t2hbb,
      productId: f5hv
    } = an10nz.query;
    const up68ns = {};
    jq937(an10nz, up68ns);
    if (fed6c) up68ns.changeType = fed6c;
    if (f5hv) up68ns.productId = new af20.Types.ObjectId(f5hv);
    if (v68k9h || t2hbb) {
      up68ns.createdAt = {};
      if (v68k9h) up68ns.createdAt.$gte = new Date(v68k9h);
      if (t2hbb) up68ns.createdAt.$lte = new Date(t2hbb);
    }
    const x0162 = await h2yrzv.find(up68ns).populate("recordedBy", "username email").populate("relatedEntityId").sort({
      createdAt: -1
    }).limit(parseInt(ujgrl)).skip((parseInt(mffhd7) - 1) * parseInt(ujgrl)).lean();
    const q6il0 = await h2yrzv.countDocuments(up68ns);
    rgrrth.json({
      success: true,
      data: {
        history: x0162,
        pagination: {
          currentPage: parseInt(mffhd7),
          totalPages: Math.ceil(q6il0 / ujgrl),
          totalItems: q6il0,
          itemsPerPage: parseInt(ujgrl)
        }
      }
    });
  } catch (nhqq) {
    console.error("Stock history error:", nhqq);
    rgrrth.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

/**
 * GET /api/stock/analytics - Real-time dashboard KPIs (SOW 6.9 Option 2)
 */
exports.getAnalytics = async (j10yo, gy4753) => {
  try {
    // 1. Total Inventory Valuation & Count
    const l610 = {};
    jq937(j10yo, l610);
    const i682 = await j669p.aggregate([{
      $match: l610
    },
    // â† ADD THIS STAGE
    {
      $unwind: "$variants"
    }, {
      $group: {
        _id: null,
        totalVariants: {
          $sum: 1
        },
        totalStockUnits: {
          $sum: "$variants.stock"
        },
        totalEstimatedValue: {
          $sum: {
            $multiply: ["$variants.stock", "$variants.price"]
          }
        },
        avgStockPerVariant: {
          $avg: "$variants.stock"
        },
        lowStockCount: {
          $sum: {
            $cond: [{
              $lte: ["$variants.stock", "$variants.lowStockThreshold"]
            }, 1, 0]
          }
        }
      }
    }]);

    // 2. Recent Movement Summary
    const lm7q = {
      createdAt: {
        $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      }
    };
    jq937(j10yo, lm7q);
    const dbsx = await h2yrzv.aggregate([{
      $match: lm7q
    }, {
      $group: {
        _id: "$changeType",
        count: {
          $sum: 1
        },
        totalQty: {
          $sum: "$quantityChange"
        }
      }
    }]);
    const fkhir = i682[0] || {
      totalVariants: 0,
      totalStockUnits: 0,
      totalEstimatedValue: 0,
      avgStockPerVariant: 0,
      lowStockCount: 0
    };
    gy4753.json({
      success: true,
      data: {
        kpis: {
          totalInventoryValue: fkhir.totalEstimatedValue.toFixed(2),
          totalStockUnits: fkhir.totalStockUnits,
          totalVariants: fkhir.totalVariants,
          avgStockPerVariant: fkhir.avgStockPerVariant.toFixed(1),
          lowStockAlerts: fkhir.lowStockCount
        },
        weeklyMovements: dbsx.map(m53g => ({
          changeType: m53g._id,
          transactionCount: m53g.count,
          netQuantityChange: m53g.totalQty
        })),
        generatedAt: new Date().toISOString()
      }
    });
  } catch (r45x) {
    console.error("Stock analytics error:", r45x);
    gy4753.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};