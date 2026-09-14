// CRUD_Project/server/controllers/analytics.controller.js
const u6t5yr = require("../models/Sofa")
const qlj9b = require("../models/Everest")
const hr59t = require("../models/Prague")
const j42m5 = require("../models/FerrariLog")
const nayl = require("../models/Mahogany")
const rvczn = require("../models/Mattress")
const i833o = require("../models/Brooklyn")
const uf81 = require("../models/Volvo")
const kpl8 = require("../models/Marble")
const xke7d = require("../models/Wallpaper")
const li5p0 = require("mongoose");
const {
  applyTenantScope: k1tmr
} = require("../utils/kyotoScope")

// â”€â”€â”€ Shared date range helper â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const z0971g = (jrn5, s3ma8a, win5q = "createdAt") => {
  const e7kc = {};
  if (jrn5 || s3ma8a) {
    e7kc[win5q] = {};
    if (jrn5) e7kc[win5q].$gte = new Date(jrn5);
    if (s3ma8a) {
      const efd6 = new Date(s3ma8a);
      efd6.setHours(23, 59, 59, 999);
      e7kc[win5q].$lte = efd6;
    }
  }
  return e7kc;
};

// â”€â”€â”€ Date grouping expression helper â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const evvnhn = (i31n44, fm3n62 = "$createdAt") => {
  switch (i31n44) {
    case "week":
      return {
        $dateToString: {
          format: "%Y-%U",
          date: fm3n62
        }
      };
    case "month":
      return {
        $dateToString: {
          format: "%Y-%m",
          date: fm3n62
        }
      };
    case "year":
      return {
        $dateToString: {
          format: "%Y",
          date: fm3n62
        }
      };
    default:
      // day
      return {
        $dateToString: {
          format: "%Y-%m-%d",
          date: fm3n62
        }
      };
  }
};
const krp5d = (f57s9, g7tyl = {}) => {
  if (f57s9.tenantId) {
    g7tyl.tenantId = f57s9.tenantId;
  }
  return g7tyl;
};

// ============================================================================
// GET /api/analytics/dashboard
// Master dashboard â€” all KPIs in a single call
// ============================================================================
exports.getDashboard = async (m6hw, fw8o) => {
  try {
    const {
      from: t6cn,
      to: psr5ox
    } = m6hw.query;
    const t4n8u = z0971g(t6cn, psr5ox);

    // Run all aggregations in parallel for performance
    const [hpz6kx, rfd5, lv46ie, vdwhwc, jy6f, xpb4, rlhx75] = await Promise.all([u6t5yr.aggregate([{
      $match: krp5d(m6hw, {
        ...t4n8u
      })
    }, {
      $group: {
        _id: null,
        total: {
          $sum: 1
        },
        pending: {
          $sum: {
            $cond: [{
              $eq: ["$orderStatus", "Pending"]
            }, 1, 0]
          }
        },
        confirmed: {
          $sum: {
            $cond: [{
              $eq: ["$orderStatus", "Confirmed"]
            }, 1, 0]
          }
        },
        delivered: {
          $sum: {
            $cond: [{
              $eq: ["$orderStatus", "Delivered"]
            }, 1, 0]
          }
        },
        cancelled: {
          $sum: {
            $cond: [{
              $eq: ["$orderStatus", "Cancelled"]
            }, 1, 0]
          }
        },
        returned: {
          $sum: {
            $cond: [{
              $eq: ["$orderStatus", "Returned"]
            }, 1, 0]
          }
        },
        codOrders: {
          $sum: {
            $cond: [{
              $eq: ["$paymentMethod", "COD"]
            }, 1, 0]
          }
        },
        prepaidOrders: {
          $sum: {
            $cond: [{
              $eq: ["$paymentMethod", "Prepaid"]
            }, 1, 0]
          }
        }
      }
    }]), u6t5yr.aggregate([{
      $match: krp5d(m6hw, {
        ...t4n8u,
        orderStatus: {
          $nin: ["Cancelled", "Returned"]
        }
      })
    }, {
      $group: {
        _id: null,
        totalRevenue: {
          $sum: "$totalAmount"
        },
        avgOrderValue: {
          $avg: "$totalAmount"
        },
        totalDiscount: {
          $sum: "$discount"
        },
        paidRevenue: {
          $sum: {
            $cond: [{
              $eq: ["$paymentStatus", "Paid"]
            }, "$totalAmount", 0]
          }
        },
        pendingRevenue: {
          $sum: {
            $cond: [{
              $eq: ["$paymentStatus", "Pending"]
            }, "$totalAmount", 0]
          }
        }
      }
    }]), qlj9b.aggregate([{
      $match: krp5d(m6hw, {})
    }, {
      $unwind: "$variants"
    }, {
      $group: {
        _id: null,
        totalProducts: {
          $sum: 1
        },
        totalStock: {
          $sum: "$variants.stock"
        },
        totalValue: {
          $sum: {
            $multiply: ["$variants.stock", "$variants.price"]
          }
        },
        lowStockCount: {
          $sum: {
            $cond: [{
              $lte: ["$variants.stock", "$variants.lowStockThreshold"]
            }, 1, 0]
          }
        },
        outOfStock: {
          $sum: {
            $cond: [{
              $eq: ["$variants.stock", 0]
            }, 1, 0]
          }
        }
      }
    }]), hr59t.aggregate([{
      $match: krp5d(m6hw, {})
    }, {
      $group: {
        _id: null,
        total: {
          $sum: 1
        },
        vip: {
          $sum: {
            $cond: [{
              $eq: ["$segment", "VIP"]
            }, 1, 0]
          }
        },
        newCustomers: {
          $sum: {
            $cond: [{
              $eq: ["$segment", "New"]
            }, 1, 0]
          }
        },
        inactive: {
          $sum: {
            $cond: [{
              $eq: ["$segment", "Inactive"]
            }, 1, 0]
          }
        }
      }
    }]), nayl.aggregate([{
      $match: krp5d(m6hw, {
        ...z0971g(t6cn, psr5ox, "date"),
        status: "Active"
      })
    }, {
      $group: {
        _id: null,
        totalExpenses: {
          $sum: "$amount"
        },
        count: {
          $sum: 1
        },
        avgExpense: {
          $avg: "$amount"
        }
      }
    }]), uf81.aggregate([{
      $match: krp5d(m6hw, {})
    }, {
      $group: {
        _id: null,
        total: {
          $sum: 1
        },
        pending: {
          $sum: {
            $cond: [{
              $eq: ["$status", "Pending"]
            }, 1, 0]
          }
        },
        inProgress: {
          $sum: {
            $cond: [{
              $eq: ["$status", "InProgress"]
            }, 1, 0]
          }
        },
        completed: {
          $sum: {
            $cond: [{
              $eq: ["$status", "Completed"]
            }, 1, 0]
          }
        },
        overdue: {
          $sum: {
            $cond: [{
              $and: [{
                $lt: ["$dueDate", new Date()]
              }, {
                $not: [{
                  $in: ["$status", ["Completed", "Cancelled"]]
                }]
              }]
            }, 1, 0]
          }
        }
      }
    }]), u6t5yr.aggregate([{
      $match: krp5d(m6hw, {
        ...t4n8u,
        orderStatus: {
          $nin: ["Cancelled", "Returned"]
        }
      })
    }, {
      $unwind: "$items"
    }, {
      $group: {
        _id: "$items.productId",
        name: {
          $first: "$items.name"
        },
        sku: {
          $first: "$items.sku"
        },
        totalQty: {
          $sum: "$items.quantity"
        },
        totalRevenue: {
          $sum: "$items.totalPrice"
        }
      }
    }, {
      $sort: {
        totalQty: -1
      }
    }, {
      $limit: 5
    }])]);
    const x3151t = hpz6kx[0] || {};
    const d27jy = rfd5[0] || {};
    const y619 = lv46ie[0] || {};
    const n9376z = vdwhwc[0] || {};
    const p8zg = jy6f[0] || {};
    const hxe9 = xpb4[0] || {};
    fw8o.json({
      success: true,
      data: {
        orders: {
          total: x3151t.total || 0,
          pending: x3151t.pending || 0,
          confirmed: x3151t.confirmed || 0,
          delivered: x3151t.delivered || 0,
          cancelled: x3151t.cancelled || 0,
          returned: x3151t.returned || 0,
          fulfillmentRate: x3151t.total ? ((x3151t.delivered || 0) / x3151t.total * 100).toFixed(1) : "0.0",
          codOrders: x3151t.codOrders || 0,
          prepaidOrders: x3151t.prepaidOrders || 0
        },
        revenue: {
          total: (d27jy.totalRevenue || 0).toFixed(2),
          avgOrderValue: (d27jy.avgOrderValue || 0).toFixed(2),
          totalDiscount: (d27jy.totalDiscount || 0).toFixed(2),
          paid: (d27jy.paidRevenue || 0).toFixed(2),
          pending: (d27jy.pendingRevenue || 0).toFixed(2),
          netRevenue: ((d27jy.totalRevenue || 0) - (p8zg.totalExpenses || 0)).toFixed(2)
        },
        inventory: {
          totalVariants: y619.totalProducts || 0,
          totalStockUnits: y619.totalStock || 0,
          totalInventoryValue: (y619.totalValue || 0).toFixed(2),
          lowStockAlerts: y619.lowStockCount || 0,
          outOfStock: y619.outOfStock || 0
        },
        customers: {
          total: n9376z.total || 0,
          vip: n9376z.vip || 0,
          new: n9376z.newCustomers || 0,
          inactive: n9376z.inactive || 0
        },
        expenses: {
          total: (p8zg.totalExpenses || 0).toFixed(2),
          count: p8zg.count || 0,
          avg: (p8zg.avgExpense || 0).toFixed(2)
        },
        tasks: {
          total: hxe9.total || 0,
          pending: hxe9.pending || 0,
          inProgress: hxe9.inProgress || 0,
          completed: hxe9.completed || 0,
          overdue: hxe9.overdue || 0
        },
        topSellingProducts: rlhx75,
        generatedAt: new Date().toISOString(),
        period: {
          from: t6cn || null,
          to: psr5ox || null
        }
      }
    });
  } catch (ylsm1) {
    console.error("Dashboard analytics error:", ylsm1);
    fw8o.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// ============================================================================
// GET /api/analytics/sales
// Sales breakdown â€” by date, channel, payment method
// Query: ?from=&to=&groupBy=day|week|month&source=WhatsApp|Shopify|Manual
// ============================================================================
exports.getSalesReport = async (vwkncg, ulhybg) => {
  try {
    const {
      from: zhx0k7,
      to: ybnet,
      groupBy: wlzmw = "day",
      source: gg8x
    } = vwkncg.query;
    const rhmq = krp5d(vwkncg, z0971g(zhx0k7, ybnet));
    rhmq.orderStatus = {
      $nin: ["Cancelled", "Returned"]
    };
    if (gg8x) rhmq.source = gg8x;
    const m582 = evvnhn(wlzmw);
    const [b44i, bf9v, p20de, w2w6] = await Promise.all([
    // Sales over time
    u6t5yr.aggregate([{
      $match: rhmq
    }, {
      $group: {
        _id: m582,
        orders: {
          $sum: 1
        },
        revenue: {
          $sum: "$totalAmount"
        },
        avgOrderValue: {
          $avg: "$totalAmount"
        },
        discount: {
          $sum: "$discount"
        }
      }
    }, {
      $project: {
        date: "$_id",
        orders: 1,
        revenue: {
          $round: ["$revenue", 2]
        },
        avgOrderValue: {
          $round: ["$avgOrderValue", 2]
        },
        discount: {
          $round: ["$discount", 2]
        }
      }
    }, {
      $sort: {
        date: 1
      }
    }]),
    // By sales channel
    u6t5yr.aggregate([{
      $match: rhmq
    }, {
      $group: {
        _id: "$source",
        orders: {
          $sum: 1
        },
        revenue: {
          $sum: "$totalAmount"
        }
      }
    }, {
      $sort: {
        revenue: -1
      }
    }]),
    // By payment method
    u6t5yr.aggregate([{
      $match: rhmq
    }, {
      $group: {
        _id: "$paymentMethod",
        orders: {
          $sum: 1
        },
        revenue: {
          $sum: "$totalAmount"
        }
      }
    }, {
      $sort: {
        orders: -1
      }
    }]),
    // By order status
    u6t5yr.aggregate([{
      $match: krp5d(vwkncg, z0971g(zhx0k7, ybnet))
    }, {
      $group: {
        _id: "$orderStatus",
        count: {
          $sum: 1
        },
        revenue: {
          $sum: "$totalAmount"
        }
      }
    }])]);

    // Overall KPIs
    const g7l7 = b44i.reduce((s7e19, p2b6) => {
      s7e19.orders += p2b6.orders;
      s7e19.revenue += p2b6.revenue;
      s7e19.discount += p2b6.discount;
      return s7e19;
    }, {
      orders: 0,
      revenue: 0,
      discount: 0
    });
    ulhybg.json({
      success: true,
      data: {
        kpis: {
          totalOrders: g7l7.orders,
          totalRevenue: g7l7.revenue.toFixed(2),
          totalDiscount: g7l7.discount.toFixed(2),
          avgOrderValue: g7l7.orders > 0 ? (g7l7.revenue / g7l7.orders).toFixed(2) : "0.00"
        },
        timeline: b44i,
        bySource: bf9v.map(mfmur => ({
          source: mfmur._id || "Unknown",
          orders: mfmur.orders,
          revenue: mfmur.revenue.toFixed(2)
        })),
        byPaymentMethod: p20de.map(y3rgv8 => ({
          method: y3rgv8._id || "Unknown",
          orders: y3rgv8.orders,
          revenue: y3rgv8.revenue.toFixed(2)
        })),
        byStatus: w2w6.map(n1r4 => ({
          status: n1r4._id,
          count: n1r4.count,
          revenue: n1r4.revenue.toFixed(2)
        })),
        generatedAt: new Date().toISOString(),
        period: {
          from: zhx0k7 || null,
          to: ybnet || null,
          groupBy: wlzmw
        }
      }
    });
  } catch (h6cz6v) {
    console.error("Sales report error:", h6cz6v);
    ulhybg.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// ============================================================================
// GET /api/analytics/inventory
// Inventory health â€” stock levels, movement, low stock
// ============================================================================
exports.getInventoryReport = async (o4ix, g43f) => {
  try {
    const {
      from: gt84g,
      to: jea7,
      category: t0odba,
      supplier: zu3sof
    } = o4ix.query;
    const ycmm = {};
    krp5d(o4ix, ycmm);
    if (t0odba) ycmm.category = new li5p0.Types.ObjectId(t0odba);
    if (zu3sof) ycmm.supplier = new li5p0.Types.ObjectId(zu3sof);
    const [p7dl, cp61ja, vi733c, arj4a] = await Promise.all([
    // Overall stock KPIs
    qlj9b.aggregate([{
      $match: ycmm
    }, {
      $unwind: "$variants"
    }, {
      $group: {
        _id: null,
        totalProducts: {
          $addToSet: "$_id"
        },
        totalVariants: {
          $sum: 1
        },
        totalUnits: {
          $sum: "$variants.stock"
        },
        totalValue: {
          $sum: {
            $multiply: ["$variants.stock", "$variants.price"]
          }
        },
        lowStock: {
          $sum: {
            $cond: [{
              $and: [{
                $lte: ["$variants.stock", "$variants.lowStockThreshold"]
              }, {
                $gt: ["$variants.stock", 0]
              }]
            }, 1, 0]
          }
        },
        outOfStock: {
          $sum: {
            $cond: [{
              $eq: ["$variants.stock", 0]
            }, 1, 0]
          }
        }
      }
    }, {
      $project: {
        totalProducts: {
          $size: "$totalProducts"
        },
        totalVariants: 1,
        totalUnits: 1,
        totalValue: 1,
        lowStock: 1,
        outOfStock: 1
      }
    }]),
    // Top 10 low stock items
    qlj9b.aggregate([{
      $match: ycmm
    }, {
      $unwind: "$variants"
    }, {
      $match: {
        "variants.stock": {
          $lte: 10
        }
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
        productName: "$name",
        sku: 1,
        variantId: "$variants.variantId",
        currentStock: "$variants.stock",
        threshold: "$variants.lowStockThreshold",
        deficit: {
          $subtract: ["$variants.lowStockThreshold", "$variants.stock"]
        },
        supplierName: {
          $arrayElemAt: ["$supplierInfo.name", 0]
        }
      }
    }, {
      $sort: {
        currentStock: 1
      }
    }, {
      $limit: 10
    }]),
    // Stock movement in date range
    j42m5.aggregate([{
      $match: z0971g(gt84g, jea7)
    }, {
      $group: {
        _id: "$changeType",
        count: {
          $sum: 1
        },
        totalQty: {
          $sum: {
            $abs: "$quantityChange"
          }
        }
      }
    }]),
    // Stock value by category
    qlj9b.aggregate([{
      $match: ycmm
    }, {
      $unwind: "$variants"
    }, {
      $lookup: {
        from: "categories",
        localField: "category",
        foreignField: "_id",
        as: "categoryInfo"
      }
    }, {
      $group: {
        _id: "$category",
        categoryName: {
          $first: {
            $arrayElemAt: ["$categoryInfo.name", 0]
          }
        },
        totalUnits: {
          $sum: "$variants.stock"
        },
        totalValue: {
          $sum: {
            $multiply: ["$variants.stock", "$variants.price"]
          }
        },
        productCount: {
          $addToSet: "$_id"
        }
      }
    }, {
      $project: {
        categoryName: 1,
        totalUnits: 1,
        totalValue: {
          $round: ["$totalValue", 2]
        },
        productCount: {
          $size: "$productCount"
        }
      }
    }, {
      $sort: {
        totalValue: -1
      }
    }])]);
    const met4 = p7dl[0] || {};
    g43f.json({
      success: true,
      data: {
        kpis: {
          totalProducts: met4.totalProducts || 0,
          totalVariants: met4.totalVariants || 0,
          totalStockUnits: met4.totalUnits || 0,
          totalInventoryValue: (met4.totalValue || 0).toFixed(2),
          lowStockAlerts: met4.lowStock || 0,
          outOfStock: met4.outOfStock || 0
        },
        lowStockItems: cp61ja,
        stockMovement: vi733c.map(q97b => ({
          type: q97b._id,
          transactions: q97b.count,
          totalQuantity: q97b.totalQty
        })),
        byCategory: arj4a,
        generatedAt: new Date().toISOString(),
        period: {
          from: gt84g || null,
          to: jea7 || null
        }
      }
    });
  } catch (o3iow) {
    console.error("Inventory report error:", o3iow);
    g43f.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// ============================================================================
// GET /api/analytics/financial
// Financial report â€” revenue, expenses, COD, supplier balances
// ============================================================================
exports.getFinancialReport = async (h175ks, o9kmd) => {
  try {
    const {
      from: u52c,
      to: h28uk,
      groupBy: h3636e = "day"
    } = h175ks.query;
    const m0ud2b = evvnhn(h3636e);
    const [w5gxv, we9i, urg4t9, hi2869, ep0mn] = await Promise.all([
    // Revenue over time
    u6t5yr.aggregate([{
      $match: krp5d(h175ks, {
        ...z0971g(u52c, h28uk),
        orderStatus: {
          $nin: ["Cancelled", "Returned"]
        }
      })
    }, {
      $group: {
        _id: m0ud2b,
        revenue: {
          $sum: "$totalAmount"
        },
        orders: {
          $sum: 1
        },
        codCollected: {
          $sum: {
            $cond: [{
              $and: [{
                $eq: ["$paymentMethod", "COD"]
              }, {
                $eq: ["$paymentStatus", "Paid"]
              }]
            }, "$totalAmount", 0]
          }
        }
      }
    }, {
      $project: {
        date: "$_id",
        revenue: {
          $round: ["$revenue", 2]
        },
        orders: 1,
        codCollected: {
          $round: ["$codCollected", 2]
        }
      }
    }, {
      $sort: {
        date: 1
      }
    }]),
    // Expenses over time
    nayl.aggregate([{
      $match: krp5d(h175ks, {
        ...z0971g(u52c, h28uk, "date"),
        status: "Active"
      })
    }, {
      $group: {
        _id: evvnhn(h3636e, "$date"),
        expenses: {
          $sum: "$amount"
        },
        count: {
          $sum: 1
        }
      }
    }, {
      $project: {
        date: "$_id",
        expenses: {
          $round: ["$expenses", 2]
        },
        count: 1
      }
    }, {
      $sort: {
        date: 1
      }
    }]),
    // Expenses by category
    nayl.aggregate([{
      $match: krp5d(h175ks, {
        ...z0971g(u52c, h28uk, "date"),
        status: "Active"
      })
    }, {
      $group: {
        _id: "$category",
        total: {
          $sum: "$amount"
        },
        count: {
          $sum: 1
        }
      }
    }, {
      $sort: {
        total: -1
      }
    }]),
    // COD stats
    u6t5yr.aggregate([{
      $match: krp5d(h175ks, {
        ...z0971g(u52c, h28uk),
        paymentMethod: "COD"
      })
    }, {
      $group: {
        _id: "$paymentStatus",
        count: {
          $sum: 1
        },
        amount: {
          $sum: "$totalAmount"
        }
      }
    }]),
    // Outstanding supplier balances
    rvczn.aggregate([{
      $match: krp5d(h175ks, {
        balance: {
          $gt: 0
        }
      })
    }, {
      $sort: {
        balance: -1
      }
    }, {
      $limit: 10
    }, {
      $project: {
        name: 1,
        balance: 1,
        paymentTerms: 1,
        contactPerson: 1
      }
    }])]);

    // Merge revenue and expense timelines by date
    const fvfg = new Set([...w5gxv.map(wp67 => wp67.date), ...we9i.map(qgs6 => qgs6.date)]);
    const tes07 = Object.fromEntries(w5gxv.map(ib25i => [ib25i.date, ib25i]));
    const o445nl = Object.fromEntries(we9i.map(drvyz1 => [drvyz1.date, drvyz1]));
    const lwry4 = Array.from(fvfg).sort().map(ias155 => ({
      date: ias155,
      revenue: tes07[ias155]?.revenue || 0,
      expenses: o445nl[ias155]?.expenses || 0,
      profit: ((tes07[ias155]?.revenue || 0) - (o445nl[ias155]?.expenses || 0)).toFixed(2),
      orders: tes07[ias155]?.orders || 0,
      codCollected: tes07[ias155]?.codCollected || 0
    }));
    const hx886 = w5gxv.reduce((w9by2, ecsawa) => w9by2 + ecsawa.revenue, 0);
    const cgv3 = we9i.reduce((lrc87, f5s78) => lrc87 + f5s78.expenses, 0);
    const n80jv = hi2869.find(tq3r2z => tq3r2z._id === "Pending");
    const t98p3 = hi2869.find(x95k => x95k._id === "Paid");
    const ogc60 = ep0mn.reduce((z31e4u, hcp0j) => z31e4u + hcp0j.balance, 0);
    o9kmd.json({
      success: true,
      data: {
        kpis: {
          totalRevenue: hx886.toFixed(2),
          totalExpenses: cgv3.toFixed(2),
          grossProfit: (hx886 - cgv3).toFixed(2),
          profitMargin: hx886 > 0 ? ((hx886 - cgv3) / hx886 * 100).toFixed(1) : "0.0",
          codPending: {
            count: n80jv?.count || 0,
            amount: (n80jv?.amount || 0).toFixed(2)
          },
          codCollected: {
            count: t98p3?.count || 0,
            amount: (t98p3?.amount || 0).toFixed(2)
          },
          totalSupplierDebt: ogc60.toFixed(2)
        },
        timeline: lwry4,
        expenseByCategory: urg4t9.map(ipa9g => ({
          category: ipa9g._id,
          total: ipa9g.total.toFixed(2),
          count: ipa9g.count,
          percentage: cgv3 > 0 ? (ipa9g.total / cgv3 * 100).toFixed(1) : "0.0"
        })),
        outstandingSuppliers: ep0mn,
        generatedAt: new Date().toISOString(),
        period: {
          from: u52c || null,
          to: h28uk || null,
          groupBy: h3636e
        }
      }
    });
  } catch (ze4eo) {
    console.error("Financial report error:", ze4eo);
    o9kmd.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// ============================================================================
// GET /api/analytics/orders
// Order volume, status breakdown, delivery performance
// ============================================================================
exports.getOrdersReport = async (p1ku1r, nxc5) => {
  try {
    const {
      from: v59ehk,
      to: rn18,
      groupBy: w2v9 = "day",
      status: o65i,
      source: t39y
    } = p1ku1r.query;
    const cedj7x = krp5d(p1ku1r, z0971g(v59ehk, rn18));
    if (o65i) cedj7x.orderStatus = o65i;
    if (t39y) cedj7x.source = t39y;
    const zv675 = evvnhn(w2v9);
    const [e4u9, g697, je8tl, dvwc, bwcm7] = await Promise.all([
    // Orders over time
    u6t5yr.aggregate([{
      $match: cedj7x
    }, {
      $group: {
        _id: zv675,
        total: {
          $sum: 1
        },
        delivered: {
          $sum: {
            $cond: [{
              $eq: ["$orderStatus", "Delivered"]
            }, 1, 0]
          }
        },
        cancelled: {
          $sum: {
            $cond: [{
              $eq: ["$orderStatus", "Cancelled"]
            }, 1, 0]
          }
        },
        revenue: {
          $sum: "$totalAmount"
        }
      }
    }, {
      $project: {
        date: "$_id",
        total: 1,
        delivered: 1,
        cancelled: 1,
        revenue: {
          $round: ["$revenue", 2]
        }
      }
    }, {
      $sort: {
        date: 1
      }
    }]),
    // By status
    u6t5yr.aggregate([{
      $match: krp5d(p1ku1r, z0971g(v59ehk, rn18))
    }, {
      $group: {
        _id: "$orderStatus",
        count: {
          $sum: 1
        },
        revenue: {
          $sum: "$totalAmount"
        }
      }
    }]),
    // By source (channel)
    u6t5yr.aggregate([{
      $match: krp5d(p1ku1r, z0971g(v59ehk, rn18))
    }, {
      $group: {
        _id: "$source",
        count: {
          $sum: 1
        },
        revenue: {
          $sum: "$totalAmount"
        }
      }
    }, {
      $sort: {
        count: -1
      }
    }]),
    // Average delivery time (Placed â†’ Delivered)
    u6t5yr.aggregate([{
      $match: krp5d(p1ku1r, {
        ...z0971g(v59ehk, rn18),
        orderStatus: "Delivered",
        deliveredAt: {
          $exists: true
        }
      })
    }, {
      $project: {
        deliveryHours: {
          $divide: [{
            $subtract: ["$deliveredAt", "$createdAt"]
          }, 3600000]
        }
      }
    }, {
      $group: {
        _id: null,
        avgHours: {
          $avg: "$deliveryHours"
        },
        count: {
          $sum: 1
        }
      }
    }]),
    // Return rate
    u6t5yr.aggregate([{
      $match: krp5d(p1ku1r, z0971g(v59ehk, rn18))
    }, {
      $group: {
        _id: null,
        total: {
          $sum: 1
        },
        returned: {
          $sum: {
            $cond: [{
              $eq: ["$orderStatus", "Returned"]
            }, 1, 0]
          }
        }
      }
    }])]);
    const w298 = dvwc[0] || {};
    const xg221 = bwcm7[0] || {};
    nxc5.json({
      success: true,
      data: {
        kpis: {
          totalOrders: xg221.total || 0,
          returnedOrders: xg221.returned || 0,
          returnRate: xg221.total > 0 ? (xg221.returned / xg221.total * 100).toFixed(1) : "0.0",
          avgDeliveryHours: w298.avgHours ? w298.avgHours.toFixed(1) : null,
          avgDeliveryDays: w298.avgHours ? (w298.avgHours / 24).toFixed(1) : null,
          deliveredCount: w298.count || 0
        },
        timeline: e4u9,
        byStatus: g697.map(zdr0r => ({
          status: zdr0r._id,
          count: zdr0r.count,
          revenue: zdr0r.revenue.toFixed(2)
        })),
        bySource: je8tl.map(zjrd => ({
          source: zjrd._id || "Unknown",
          count: zjrd.count,
          revenue: zjrd.revenue.toFixed(2)
        })),
        generatedAt: new Date().toISOString(),
        period: {
          from: v59ehk || null,
          to: rn18 || null,
          groupBy: w2v9
        }
      }
    });
  } catch (g5se63) {
    console.error("Orders report error:", g5se63);
    nxc5.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// ============================================================================
// GET /api/analytics/products
// Top sellers, worst performers, revenue by product
// ============================================================================
exports.getProductsReport = async (gttcg1, hzbnu) => {
  try {
    const {
      from: f8k1uj,
      to: boyl6,
      limit: d60a = 10,
      category: b594r
    } = gttcg1.query;
    const fw5g4 = krp5d(gttcg1, z0971g(f8k1uj, boyl6));
    fw5g4.orderStatus = {
      $nin: ["Cancelled", "Returned"]
    };
    const [fd3pr, s0ft, twh5] = await Promise.all([
    // Top selling products by quantity
    u6t5yr.aggregate([{
      $match: fw5g4
    }, {
      $unwind: "$items"
    }, {
      $group: {
        _id: "$items.productId",
        name: {
          $first: "$items.name"
        },
        sku: {
          $first: "$items.sku"
        },
        totalQtySold: {
          $sum: "$items.quantity"
        },
        totalRevenue: {
          $sum: "$items.totalPrice"
        },
        orderCount: {
          $addToSet: "$_id"
        }
      }
    }, {
      $lookup: {
        from: "products",
        localField: "_id",
        foreignField: "_id",
        as: "productInfo"
      }
    }, {
      $project: {
        name: 1,
        sku: 1,
        totalQtySold: 1,
        totalRevenue: {
          $round: ["$totalRevenue", 2]
        },
        orderCount: {
          $size: "$orderCount"
        },
        currentStock: {
          $sum: {
            $arrayElemAt: ["$productInfo.variants.stock", 0]
          }
        }
      }
    }, {
      $sort: {
        totalQtySold: -1
      }
    }, {
      $limit: parseInt(d60a)
    }]),
    // Revenue by product (top earners)
    u6t5yr.aggregate([{
      $match: fw5g4
    }, {
      $unwind: "$items"
    }, {
      $group: {
        _id: "$items.productId",
        name: {
          $first: "$items.name"
        },
        sku: {
          $first: "$items.sku"
        },
        totalRevenue: {
          $sum: "$items.totalPrice"
        },
        totalQtySold: {
          $sum: "$items.quantity"
        }
      }
    }, {
      $project: {
        name: 1,
        sku: 1,
        totalRevenue: {
          $round: ["$totalRevenue", 2]
        },
        totalQtySold: 1
      }
    }, {
      $sort: {
        totalRevenue: -1
      }
    }, {
      $limit: parseInt(d60a)
    }]),
    // Revenue by category
    u6t5yr.aggregate([{
      $match: fw5g4
    }, {
      $unwind: "$items"
    }, {
      $lookup: {
        from: "products",
        localField: "items.productId",
        foreignField: "_id",
        as: "productData"
      }
    }, {
      $lookup: {
        from: "categories",
        localField: "productData.category",
        foreignField: "_id",
        as: "categoryData"
      }
    }, {
      $group: {
        _id: {
          $arrayElemAt: ["$categoryData._id", 0]
        },
        categoryName: {
          $first: {
            $arrayElemAt: ["$categoryData.name", 0]
          }
        },
        revenue: {
          $sum: "$items.totalPrice"
        },
        qtySold: {
          $sum: "$items.quantity"
        }
      }
    }, {
      $project: {
        categoryName: 1,
        revenue: {
          $round: ["$revenue", 2]
        },
        qtySold: 1
      }
    }, {
      $sort: {
        revenue: -1
      }
    }])]);
    hzbnu.json({
      success: true,
      data: {
        topSellersByQuantity: fd3pr,
        topSellersByRevenue: s0ft,
        revenueByCategory: twh5,
        generatedAt: new Date().toISOString(),
        period: {
          from: f8k1uj || null,
          to: boyl6 || null
        }
      }
    });
  } catch (w55by) {
    console.error("Products report error:", w55by);
    hzbnu.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// ============================================================================
// GET /api/analytics/customers
// Customer insights â€” segments, LTV, top buyers
// ============================================================================
exports.getCustomersReport = async (mm90z, kx210z) => {
  try {
    const {
      from: j9xp3,
      to: slf417,
      limit: c2l013 = 10
    } = mm90z.query;
    const [p846uj, rlxh4, efj56y, oj7262] = await Promise.all([
    // Segment breakdown
    hr59t.aggregate([{
      $match: krp5d(mm90z, {})
    }, {
      $group: {
        _id: "$segment",
        count: {
          $sum: 1
        },
        totalSpent: {
          $sum: "$totalSpent"
        },
        avgOrderValue: {
          $avg: {
            $cond: [{
              $gt: ["$totalOrders", 0]
            }, {
              $divide: ["$totalSpent", "$totalOrders"]
            }, 0]
          }
        }
      }
    }, {
      $sort: {
        count: -1
      }
    }]),
    // Top buyers by lifetime value
    hr59t.aggregate([{
      $match: krp5d(mm90z, {
        totalSpent: {
          $gt: 0
        }
      })
    }, {
      $project: {
        firstName: 1,
        lastName: 1,
        email: 1,
        phone: 1,
        segment: 1,
        totalOrders: 1,
        totalSpent: 1,
        lastOrderDate: 1,
        fullName: {
          $concat: ["$firstName", " ", "$lastName"]
        }
      }
    }, {
      $sort: {
        totalSpent: -1
      }
    }, {
      $limit: parseInt(c2l013)
    }]),
    // Acquisition by source
    hr59t.aggregate([{
      $match: krp5d(mm90z, {})
    }, {
      $group: {
        _id: "$source",
        count: {
          $sum: 1
        },
        totalRevenue: {
          $sum: "$totalSpent"
        }
      }
    }, {
      $sort: {
        count: -1
      }
    }]),
    // Repeat vs new customers (in period)
    u6t5yr.aggregate([{
      $match: krp5d(mm90z, z0971g(j9xp3, slf417))
    }, {
      $group: {
        _id: "$customer",
        orderCount: {
          $sum: 1
        }
      }
    }, {
      $group: {
        _id: null,
        newCustomers: {
          $sum: {
            $cond: [{
              $eq: ["$orderCount", 1]
            }, 1, 0]
          }
        },
        repeatCustomers: {
          $sum: {
            $cond: [{
              $gt: ["$orderCount", 1]
            }, 1, 0]
          }
        },
        totalCustomers: {
          $sum: 1
        }
      }
    }])]);
    const t7n6 = p846uj.reduce((mxu16, yc6zt) => mxu16 + yc6zt.count, 0);
    const uy2ql9 = oj7262[0] || {};
    kx210z.json({
      success: true,
      data: {
        kpis: {
          totalCustomers: t7n6,
          newVsRepeat: {
            new: uy2ql9.newCustomers || 0,
            repeat: uy2ql9.repeatCustomers || 0,
            repeatRate: uy2ql9.totalCustomers > 0 ? (uy2ql9.repeatCustomers / uy2ql9.totalCustomers * 100).toFixed(1) : "0.0"
          }
        },
        segments: p846uj.map(e242du => ({
          segment: e242du._id || "Unknown",
          count: e242du.count,
          percentage: t7n6 > 0 ? (e242du.count / t7n6 * 100).toFixed(1) : "0.0",
          totalRevenue: e242du.totalSpent.toFixed(2),
          avgOrderValue: e242du.avgOrderValue.toFixed(2)
        })),
        topBuyers: rlxh4,
        acquisitionBySource: efj56y.map(hpu1 => ({
          source: hpu1._id || "Unknown",
          count: hpu1.count,
          totalRevenue: hpu1.totalRevenue.toFixed(2)
        })),
        generatedAt: new Date().toISOString(),
        period: {
          from: j9xp3 || null,
          to: slf417 || null
        }
      }
    });
  } catch (etz0v8) {
    console.error("Customers report error:", etz0v8);
    kx210z.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// ============================================================================
// GET /api/analytics/courier-performance
// Courier KPIs â€” completion rates, transit times, failures
// ============================================================================
exports.getCourierPerformance = async (lq8i26, s6lh) => {
  try {
    const {
      from: oa89yv,
      to: d7tn
    } = lq8i26.query;
    const fg2ps = z0971g(oa89yv, d7tn, "performanceData.assignedAt");
    const [z1otb4, dq1x, l7kgq] = await Promise.all([
    // Per courier breakdown
    i833o.aggregate([{
      $match: krp5d(lq8i26, {
        ...fg2ps,
        isActive: true
      })
    }, {
      $lookup: {
        from: "couriers",
        localField: "courier",
        foreignField: "_id",
        as: "courierInfo"
      }
    }, {
      $unwind: {
        path: "$courierInfo",
        preserveNullAndEmptyArrays: true
      }
    }, {
      $group: {
        _id: "$courier",
        courierName: {
          $first: "$courierName"
        },
        total: {
          $sum: 1
        },
        delivered: {
          $sum: {
            $cond: [{
              $eq: ["$currentStatus", "delivered"]
            }, 1, 0]
          }
        },
        failed: {
          $sum: {
            $cond: [{
              $eq: ["$currentStatus", "failed"]
            }, 1, 0]
          }
        },
        inTransit: {
          $sum: {
            $cond: [{
              $eq: ["$currentStatus", "in_transit"]
            }, 1, 0]
          }
        },
        onTime: {
          $sum: {
            $cond: [{
              $eq: ["$performanceData.wasOnTime", true]
            }, 1, 0]
          }
        },
        avgTransitHours: {
          $avg: "$performanceData.totalTransitHours"
        }
      }
    }, {
      $project: {
        courierName: 1,
        total: 1,
        delivered: 1,
        failed: 1,
        inTransit: 1,
        completionRate: {
          $cond: [{
            $gt: ["$total", 0]
          }, {
            $round: [{
              $multiply: [{
                $divide: ["$delivered", "$total"]
              }, 100]
            }, 1]
          }, 0]
        },
        onTimeRate: {
          $cond: [{
            $gt: ["$delivered", 0]
          }, {
            $round: [{
              $multiply: [{
                $divide: ["$onTime", "$delivered"]
              }, 100]
            }, 1]
          }, 0]
        },
        avgTransitDays: {
          $round: [{
            $divide: [{
              $ifNull: ["$avgTransitHours", 0]
            }, 24]
          }, 1]
        }
      }
    }, {
      $sort: {
        completionRate: -1
      }
    }]),
    // Overall KPIs
    i833o.aggregate([{
      $match: krp5d(lq8i26, {
        ...fg2ps,
        isActive: true
      })
    }, {
      $group: {
        _id: null,
        total: {
          $sum: 1
        },
        delivered: {
          $sum: {
            $cond: [{
              $eq: ["$currentStatus", "delivered"]
            }, 1, 0]
          }
        },
        failed: {
          $sum: {
            $cond: [{
              $eq: ["$currentStatus", "failed"]
            }, 1, 0]
          }
        },
        avgTransit: {
          $avg: "$performanceData.totalTransitHours"
        }
      }
    }]),
    // Status breakdown
    i833o.aggregate([{
      $match: krp5d(lq8i26, {
        ...fg2ps,
        isActive: true
      })
    }, {
      $group: {
        _id: "$currentStatus",
        count: {
          $sum: 1
        }
      }
    }])]);
    const yfee5 = dq1x[0] || {};
    s6lh.json({
      success: true,
      data: {
        kpis: {
          totalShipments: yfee5.total || 0,
          delivered: yfee5.delivered || 0,
          failed: yfee5.failed || 0,
          overallCompletionRate: yfee5.total > 0 ? ((yfee5.delivered || 0) / yfee5.total * 100).toFixed(1) : "0.0",
          avgTransitDays: yfee5.avgTransit ? (yfee5.avgTransit / 24).toFixed(1) : null
        },
        byCourier: z1otb4,
        statusBreakdown: l7kgq.map(a5g3k => ({
          status: a5g3k._id,
          count: a5g3k.count
        })),
        generatedAt: new Date().toISOString(),
        period: {
          from: oa89yv || null,
          to: d7tn || null
        }
      }
    });
  } catch (mev4) {
    console.error("Courier performance error:", mev4);
    s6lh.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// ============================================================================
// GET /api/analytics/staff-performance
// Staff task completion, order processing, efficiency
// ============================================================================
exports.getStaffPerformance = async (fbj57, dclfn) => {
  try {
    const {
      from: b94nrv,
      to: ras93,
      userId: zex06m
    } = fbj57.query;
    const u8wrp0 = krp5d(fbj57, z0971g(b94nrv, ras93, "completedAt"));
    if (zex06m) u8wrp0.assignedTo = new li5p0.Types.ObjectId(zex06m);
    const [cbb207, u1j9gp, bcc558] = await Promise.all([
    // Task completion per staff
    uf81.aggregate([{
      $match: u8wrp0
    }, {
      $lookup: {
        from: "users",
        localField: "assignedTo",
        foreignField: "_id",
        as: "userInfo"
      }
    }, {
      $unwind: "$userInfo"
    }, {
      $group: {
        _id: "$assignedTo",
        username: {
          $first: "$userInfo.username"
        },
        firstName: {
          $first: "$userInfo.firstName"
        },
        lastName: {
          $first: "$userInfo.lastName"
        },
        role: {
          $first: "$userInfo.role"
        },
        totalTasks: {
          $sum: 1
        },
        completed: {
          $sum: {
            $cond: [{
              $eq: ["$status", "Completed"]
            }, 1, 0]
          }
        },
        cancelled: {
          $sum: {
            $cond: [{
              $eq: ["$status", "Cancelled"]
            }, 1, 0]
          }
        },
        overdue: {
          $sum: {
            $cond: [{
              $and: [{
                $ne: ["$status", "Completed"]
              }, {
                $lt: ["$dueDate", new Date()]
              }]
            }, 1, 0]
          }
        }
      }
    }, {
      $project: {
        username: 1,
        firstName: 1,
        lastName: 1,
        role: 1,
        totalTasks: 1,
        completed: 1,
        cancelled: 1,
        overdue: 1,
        completionRate: {
          $cond: [{
            $gt: ["$totalTasks", 0]
          }, {
            $round: [{
              $multiply: [{
                $divide: ["$completed", "$totalTasks"]
              }, 100]
            }, 1]
          }, 0]
        }
      }
    }, {
      $sort: {
        completionRate: -1
      }
    }]),
    // Orders placed per staff (sales operator efficiency)
    u6t5yr.aggregate([{
      $match: krp5d(fbj57, z0971g(b94nrv, ras93))
    }, {
      $lookup: {
        from: "users",
        localField: "placedBy",
        foreignField: "_id",
        as: "staffInfo"
      }
    }, {
      $unwind: "$staffInfo"
    }, {
      $group: {
        _id: "$placedBy",
        username: {
          $first: "$staffInfo.username"
        },
        role: {
          $first: "$staffInfo.role"
        },
        ordersPlaced: {
          $sum: 1
        },
        totalRevenue: {
          $sum: "$totalAmount"
        },
        cancelledOrders: {
          $sum: {
            $cond: [{
              $eq: ["$orderStatus", "Cancelled"]
            }, 1, 0]
          }
        }
      }
    }, {
      $project: {
        username: 1,
        role: 1,
        ordersPlaced: 1,
        totalRevenue: {
          $round: ["$totalRevenue", 2]
        },
        cancelledOrders: 1,
        cancellationRate: {
          $cond: [{
            $gt: ["$ordersPlaced", 0]
          }, {
            $round: [{
              $multiply: [{
                $divide: ["$cancelledOrders", "$ordersPlaced"]
              }, 100]
            }, 1]
          }, 0]
        }
      }
    }, {
      $sort: {
        ordersPlaced: -1
      }
    }]),
    // All active staff
    kpl8.find({
      status: "Active"
    }).select("username firstName lastName role lastLogin").lean()]);
    dclfn.json({
      success: true,
      data: {
        taskPerformance: cbb207,
        orderProcessing: u1j9gp,
        activeStaff: bcc558.length,
        generatedAt: new Date().toISOString(),
        period: {
          from: b94nrv || null,
          to: ras93 || null
        }
      }
    });
  } catch (grpz7n) {
    console.error("Staff performance error:", grpz7n);
    dclfn.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// ============================================================================
// GET /api/analytics/trends
// Predictive / trend analysis â€” growth rates, forecasts
// ============================================================================
exports.getTrends = async (fe546, xzy95) => {
  try {
    const c9313p = new Date();
    const u912z = new Date(c9313p - 30 * 24 * 60 * 60 * 1000);
    const vdwb5 = new Date(c9313p - 60 * 24 * 60 * 60 * 1000);
    const [zh7mf, r8phz, t75s1h] = await Promise.all([
    // Current 30 days
    u6t5yr.aggregate([{
      $match: krp5d(fe546, {
        createdAt: {
          $gte: u912z
        },
        orderStatus: {
          $nin: ["Cancelled", "Returned"]
        }
      })
    }, {
      $group: {
        _id: null,
        orders: {
          $sum: 1
        },
        revenue: {
          $sum: "$totalAmount"
        },
        avgOrderValue: {
          $avg: "$totalAmount"
        }
      }
    }]),
    // Previous 30 days
    u6t5yr.aggregate([{
      $match: krp5d(fe546, {
        createdAt: {
          $gte: vdwb5,
          $lt: u912z
        },
        orderStatus: {
          $nin: ["Cancelled", "Returned"]
        }
      })
    }, {
      $group: {
        _id: null,
        orders: {
          $sum: 1
        },
        revenue: {
          $sum: "$totalAmount"
        },
        avgOrderValue: {
          $avg: "$totalAmount"
        }
      }
    }]),
    // Daily revenue last 30 days (for sparkline)
    u6t5yr.aggregate([{
      $match: krp5d(fe546, {
        createdAt: {
          $gte: u912z
        },
        orderStatus: {
          $nin: ["Cancelled", "Returned"]
        }
      })
    }, {
      $group: {
        _id: {
          $dateToString: {
            format: "%Y-%m-%d",
            date: "$createdAt"
          }
        },
        revenue: {
          $sum: "$totalAmount"
        },
        orders: {
          $sum: 1
        }
      }
    }, {
      $project: {
        date: "$_id",
        revenue: {
          $round: ["$revenue", 2]
        },
        orders: 1
      }
    }, {
      $sort: {
        date: 1
      }
    }])]);
    const k8kg = zh7mf[0] || {
      orders: 0,
      revenue: 0,
      avgOrderValue: 0
    };
    const h94nx = r8phz[0] || {
      orders: 0,
      revenue: 0,
      avgOrderValue: 0
    };
    const jqt1h = (if7t, yuv551) => {
      if (yuv551 === 0) return if7t > 0 ? 100 : 0;
      return ((if7t - yuv551) / yuv551 * 100).toFixed(1);
    };

    // Simple 7-day forecast using last 7 days average
    const z18f1j = t75s1h.slice(-7);
    const q0g7d = z18f1j.length > 0 ? z18f1j.reduce((a57d8, oe2m) => a57d8 + oe2m.revenue, 0) / z18f1j.length : 0;
    xzy95.json({
      success: true,
      data: {
        growth: {
          orders: {
            current: k8kg.orders,
            previous: h94nx.orders,
            growthRate: jqt1h(k8kg.orders, h94nx.orders),
            trend: k8kg.orders >= h94nx.orders ? "up" : "down"
          },
          revenue: {
            current: k8kg.revenue.toFixed(2),
            previous: h94nx.revenue.toFixed(2),
            growthRate: jqt1h(k8kg.revenue, h94nx.revenue),
            trend: k8kg.revenue >= h94nx.revenue ? "up" : "down"
          },
          avgOrderValue: {
            current: k8kg.avgOrderValue.toFixed(2),
            previous: h94nx.avgOrderValue.toFixed(2),
            growthRate: jqt1h(k8kg.avgOrderValue, h94nx.avgOrderValue),
            trend: k8kg.avgOrderValue >= h94nx.avgOrderValue ? "up" : "down"
          }
        },
        dailyRevenue: t75s1h,
        forecast: {
          next7DaysEstimate: (q0g7d * 7).toFixed(2),
          dailyAverage: q0g7d.toFixed(2),
          basedOnDays: z18f1j.length,
          disclaimer: "Simple moving average. Actual results may vary."
        },
        generatedAt: new Date().toISOString()
      }
    });
  } catch (hp5h) {
    console.error("Trends error:", hp5h);
    xzy95.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// ============================================================================
// GET /api/analytics/export
// Export any report as JSON (CSV conversion handled client-side or by a library)
// Query: ?report=sales|inventory|financial|orders|customers&from=&to=&format=json
// ============================================================================
exports.exportReport = async (xl5v, r8u4) => {
  try {
    const {
      report: g0rny8,
      from: g2p7,
      to: i733t,
      format: fxg0s = "json"
    } = xl5v.query;
    const iom8r = ["sales", "inventory", "financial", "orders", "customers"];
    if (!iom8r.includes(g0rny8)) {
      return r8u4.status(400).json({
        success: false,
        message: `report must be one of: ${iom8r.join(", ")}`
      });
    }

    // Re-use existing report logic by making an internal mock req
    let eudm;
    const wiyc84 = {
      query: {
        from: g2p7,
        to: i733t,
        groupBy: "day"
      }
    };
    if (g0rny8 === "sales") {
      // Inline simplified version for export
      const z4bi0 = krp5d(xl5v, z0971g(g2p7, i733t));
      z4bi0.orderStatus = {
        $nin: ["Cancelled", "Returned"]
      };
      eudm = await u6t5yr.aggregate([{
        $match: z4bi0
      }, {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt"
            }
          },
          orders: {
            $sum: 1
          },
          revenue: {
            $sum: "$totalAmount"
          },
          discount: {
            $sum: "$discount"
          }
        }
      }, {
        $project: {
          date: "$_id",
          orders: 1,
          revenue: {
            $round: ["$revenue", 2]
          },
          discount: {
            $round: ["$discount", 2]
          }
        }
      }, {
        $sort: {
          date: 1
        }
      }]);
    } else if (g0rny8 === "inventory") {
      eudm = await qlj9b.aggregate([{
        $match: krp5d(xl5v, {})
      }, {
        $unwind: "$variants"
      }, {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "cat"
        }
      }, {
        $project: {
          productName: "$name",
          sku: 1,
          variantId: "$variants.variantId",
          stock: "$variants.stock",
          price: "$variants.price",
          stockValue: {
            $multiply: ["$variants.stock", "$variants.price"]
          },
          category: {
            $arrayElemAt: ["$cat.name", 0]
          },
          isLowStock: {
            $lte: ["$variants.stock", "$variants.lowStockThreshold"]
          }
        }
      }, {
        $sort: {
          stock: 1
        }
      }]);
    } else if (g0rny8 === "financial") {
      eudm = await nayl.find({
        ...krp5d(xl5v, z0971g(g2p7, i733t, "date")),
        status: "Active"
      }).populate("recordedBy", "username").lean();
    } else if (g0rny8 === "orders") {
      eudm = await u6t5yr.find(krp5d(xl5v, z0971g(g2p7, i733t))).populate("customer", "firstName lastName email").select("orderId source orderStatus paymentStatus paymentMethod totalAmount createdAt").lean();
    } else if (g0rny8 === "customers") {
      eudm = await hr59t.find().select("firstName lastName email phone segment totalOrders totalSpent lastOrderDate source createdAt").lean();
    }
    const vj6u7u = `${g0rny8}-report-${new Date().toISOString().split("T")[0]}`;
    r8u4.setHeader("Content-Disposition", `attachment; filename="${vj6u7u}.json"`);
    r8u4.setHeader("Content-Type", "application/json");
    r8u4.json({
      success: true,
      report: g0rny8,
      exportedAt: new Date().toISOString(),
      period: {
        from: g2p7 || null,
        to: i733t || null
      },
      count: eudm.length,
      data: eudm
    });
  } catch (kqmz) {
    console.error("Export report error:", kqmz);
    r8u4.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};