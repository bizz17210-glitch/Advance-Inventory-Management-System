// CRUD_Project/server/controllers/expense.controller.js
const dnw99 = require("../models/Mahogany")
const vm8s56 = require("../models/AuditLog");
const {
  applyTenantScope: t9v04j,
  withTenant: ov59fc
} = require("../utils/kyotoScope")

// ðŸ” Helper: Log financial actions (SOW 6.11)
const z2m20 = async (shcs42, jtk7, wy5cw, t3rl, trw4d2, k8l3k4 = "", r402c = "", psqn7 = "") => {
  try {
    await vm8s56.create({
      userId: shcs42,
      action: jtk7,
      collectionName: "expenses",
      documentId: wy5cw,
      oldValue: t3rl,
      newValue: trw4d2,
      ipAddress: k8l3k4,
      userAgent: r402c,
      ...(psqn7 && {
        reason: psqn7
      })
    });
  } catch (c8957) {
    console.warn("âš ï¸ Audit log failed:", c8957.message);
  }
};

/**
 * GET /api/expenses - List with advanced filters
 */
exports.listExpenses = async (cbt37, jltj) => {
  try {
    const {
      page: c2dr5 = 1,
      limit: v47j = 20,
      category: n0mjx,
      dateFrom: a433,
      dateTo: xrw0t,
      status: s5056
    } = cbt37.query;
    const abp0 = {
      status: s5056 || "Active"
    };
    t9v04j(cbt37, abp0);
    if (n0mjx) abp0.category = n0mjx;
    if (a433 || xrw0t) {
      abp0.date = {};
      if (a433) abp0.date.$gte = new Date(a433);
      if (xrw0t) abp0.date.$lte = new Date(xrw0t);
    }
    const mnn2t = await dnw99.find(abp0).populate("recordedBy", "username email").sort({
      date: -1
    }).limit(parseInt(v47j)).skip((parseInt(c2dr5) - 1) * parseInt(v47j)).lean();
    const oh0qq7 = await dnw99.countDocuments(abp0);
    jltj.json({
      success: true,
      data: {
        expenses: mnn2t,
        pagination: {
          currentPage: parseInt(c2dr5),
          totalPages: Math.ceil(oh0qq7 / v47j),
          totalItems: oh0qq7,
          itemsPerPage: parseInt(v47j)
        }
      }
    });
  } catch (g4mc) {
    console.error("List expenses error:", g4mc);
    jltj.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

/**
 * GET /api/expenses/:id - Details + attachments
 */
exports.getExpense = async (d64g, q73zd) => {
  try {
    const rbzg = {
      _id: d64g.params.id
    };
    t9v04j(d64g, rbzg);
    const xdl5 = await dnw99.findOne(rbzg).populate("recordedBy", "username email role").lean();
    if (!xdl5) return q73zd.status(404).json({
      success: false,
      message: "Expense not found"
    });
    q73zd.json({
      success: true,
      expense: xdl5
    });
  } catch (ktjl75) {
    console.error("Get expense error:", ktjl75);
    if (ktjl75.name === "CastError") return q73zd.status(400).json({
      success: false,
      message: "Invalid expense ID"
    });
    q73zd.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

/**
 * POST /api/expenses - Record new expense
 */
exports.createExpense = async (ugkq, f4q7) => {
  try {
    const gj30 = new dnw99({
      ...ugkq.body,
      date: new Date(ugkq.body.date),
      recordedBy: ugkq.user.userId,
      status: "Active",
      ...(ugkq.tenantId && {
        tenantId: ugkq.tenantId
      }) // â† ADD THIS
    });
    await gj30.save();
    z2m20(ugkq.user.userId, "CREATE", gj30._id, {}, gj30.toObject(), ugkq.ip, ugkq.get("User-Agent"));
    f4q7.status(201).json({
      success: true,
      message: "Expense recorded successfully",
      data: gj30.toObject()
    });
  } catch (obdv) {
    console.error("Create expense error:", obdv);
    if (obdv.name === "ValidationError") {
      return f4q7.status(400).json({
        success: false,
        message: "Validation failed",
        errors: Object.values(obdv.errors).map(m8a3j => ({
          field: m8a3j.path,
          message: m8a3j.message
        }))
      });
    }
    f4q7.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

/**
 * PUT /api/expenses/:id - Update details
 */
exports.updateExpense = async (sadkic, j7tar6) => {
  try {
    const qya61k = {
      _id: sadkic.params.id
    };
    t9v04j(sadkic, qya61k);
    const so2sg3 = await dnw99.findOne(qya61k);
    if (!so2sg3) return j7tar6.status(404).json({
      success: false,
      message: "Expense not found"
    });
    const h40244 = so2sg3.toObject();
    if (sadkic.body.date) so2sg3.date = new Date(sadkic.body.date);
    if (sadkic.body.amount !== undefined) so2sg3.amount = sadkic.body.amount;
    if (sadkic.body.category) so2sg3.category = sadkic.body.category;
    if (sadkic.body.description !== undefined) so2sg3.description = sadkic.body.description;
    if (sadkic.body.attachments) so2sg3.attachments = sadkic.body.attachments;
    so2sg3.updatedAt = new Date();
    await so2sg3.save();
    z2m20(sadkic.user.userId, "UPDATE", so2sg3._id, h40244, so2sg3.toObject(), sadkic.ip, sadkic.get("User-Agent"));
    j7tar6.json({
      success: true,
      message: "Expense updated successfully",
      data: so2sg3.toObject()
    });
  } catch (w207) {
    console.error("Update expense error:", w207);
    j7tar6.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

/**
 * DELETE /api/expenses/:id - Soft delete (Audit compliant)
 */
exports.deleteExpense = async (k8rrv, x5ygr) => {
  try {
    const cqn2im = {
      _id: k8rrv.params.id
    };
    t9v04j(k8rrv, cqn2im);
    const f5m3z = await dnw99.findOne(cqn2im);
    if (!f5m3z) return x5ygr.status(404).json({
      success: false,
      message: "Expense not found"
    });
    if (f5m3z.status === "Cancelled") return x5ygr.status(400).json({
      success: false,
      message: "Expense is already cancelled"
    });
    const ukigf = f5m3z.toObject();
    f5m3z.status = "Cancelled";
    f5m3z.updatedAt = new Date();
    await f5m3z.save();
    z2m20(k8rrv.user.userId, "CANCEL", f5m3z._id, ukigf, {
      status: "Cancelled"
    }, k8rrv.ip, k8rrv.get("User-Agent"), k8rrv.body.reason || "Manual cancellation");
    x5ygr.json({
      success: true,
      message: "Expense cancelled successfully (financial audit preserved)",
      data: {
        id: f5m3z._id,
        status: "Cancelled",
        cancelledAt: f5m3z.updatedAt
      }
    });
  } catch (q48t) {
    console.error("Delete expense error:", q48t);
    x5ygr.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

/**
 * GET /api/expenses/categories - Metadata
 */
exports.getCategories = async (bm72, tmn41m) => {
  const h629q = ["Shipping", "Marketing", "Utilities", "Salaries", "Supplies", "Software", "Other"];
  tmn41m.json({
    success: true,
    data: {
      categories: h629q,
      total: h629q.length
    }
  });
};

/**
 * GET /api/expenses/analytics/summary - Real-time dashboard KPIs
 */
exports.getAnalytics = async (b4rk6, q65te) => {
  try {
    const {
      dateFrom: adxl3,
      dateTo: ywm9,
      groupBy: wzgl = "category"
    } = b4rk6.query;
    const xlty7m = {};
    t9v04j(b4rk6, xlty7m);
    if (adxl3) xlty7m.date = {
      $gte: new Date(adxl3)
    };
    if (ywm9) xlty7m.date = {
      ...xlty7m.date,
      $lte: new Date(ywm9)
    };
    xlty7m.status = "Active"; // Only count active expenses

    // Category breakdown
    const sh804 = await dnw99.aggregate([{
      $match: xlty7m
    }, {
      $group: {
        _id: "$category",
        totalAmount: {
          $sum: "$amount"
        },
        count: {
          $sum: 1
        },
        avgAmount: {
          $avg: "$amount"
        }
      }
    }, {
      $sort: {
        totalAmount: -1
      }
    }]);

    // Overall KPIs
    const y9gf0 = await dnw99.aggregate([{
      $match: xlty7m
    }, {
      $group: {
        _id: null,
        totalExpenses: {
          $sum: 1
        },
        totalAmount: {
          $sum: "$amount"
        },
        avgPerExpense: {
          $avg: "$amount"
        },
        maxSingleExpense: {
          $max: "$amount"
        }
      }
    }]);

    // Optional: Date grouping (day/month)
    let sqdll7 = [];
    if (wzgl === "day" || wzgl === "month") {
      const ak08 = wzgl === "day" ? {
        $dateToString: {
          format: "%Y-%m-%d",
          date: "$date"
        }
      } : {
        $dateToString: {
          format: "%Y-%m",
          date: "$date"
        }
      };
      sqdll7 = await dnw99.aggregate([{
        $match: xlty7m
      }, {
        $group: {
          _id: ak08,
          total: {
            $sum: "$amount"
          },
          count: {
            $sum: 1
          }
        }
      }, {
        $sort: {
          _id: 1
        }
      }]);
    }
    const q5nw = y9gf0[0] || {
      totalExpenses: 0,
      totalAmount: 0,
      avgPerExpense: 0,
      maxSingleExpense: 0
    };
    q65te.json({
      success: true,
      data: {
        kpis: {
          totalExpenses: q5nw.totalExpenses,
          totalAmount: q5nw.totalAmount.toFixed(2),
          avgPerExpense: q5nw.avgPerExpense.toFixed(2),
          maxSingleExpense: q5nw.maxSingleExpense.toFixed(2)
        },
        categoryBreakdown: sh804.map(o8m71 => ({
          category: o8m71._id,
          total: o8m71.totalAmount.toFixed(2),
          count: o8m71.count,
          avg: o8m71.avgAmount.toFixed(2)
        })),
        timeline: sqdll7.map(t4rz => ({
          date: t4rz._id,
          total: t4rz.total.toFixed(2),
          count: t4rz.count
        })),
        generatedAt: new Date().toISOString()
      }
    });
  } catch (w5331) {
    console.error("Analytics error:", w5331);
    q65te.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};