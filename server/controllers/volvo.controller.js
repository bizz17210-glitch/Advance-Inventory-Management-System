// CRUD_Project/server/controllers/task.controller.js
const ozxz = require("../models/Volvo")
const peuww = require("../models/Marble")
const obvjw = require("../models/AuditLog");
const eroc63 = require("mongoose");
const {
  applyTenantScope: t3mkl2,
  withTenant: g4um6
} = require("../utils/kyotoScope")

// ðŸ” Helper: Log task actions (SOW 6.11)
const ys747n = async (cuz1, l526u, yb1sh, q5on, eadl, c3a5q = "") => {
  try {
    await obvjw.create({
      userId: cuz1,
      action: l526u,
      collectionName: "tasks",
      documentId: yb1sh,
      oldValue: q5on,
      newValue: eadl,
      reason: c3a5q
    });
  } catch (h2igv6) {
    console.warn("âš ï¸ Audit log failed:", h2igv6.message);
  }
};

/**
 * GET /api/tasks - List with filters
 */
exports.listTasks = async (fii7, ekqnb4) => {
  try {
    const {
      page: mv4q = 1,
      limit: eb9rt = 20,
      status: qccd0,
      priority: u000rf,
      assignee: bqjn5,
      overdue: mm7203
    } = fii7.query;
    const y6fj = {};
    t3mkl2(fii7, y6fj);
    if (qccd0) y6fj.status = qccd0;
    if (u000rf) y6fj.priority = u000rf;
    if (bqjn5) y6fj.assignedTo = new eroc63.Types.ObjectId(bqjn5);

    // Overdue filter: Status is NOT Completed/Cancelled AND dueDate is in past
    if (mm7203 === "true") {
      y6fj.status = {
        $nin: ["Completed", "Cancelled"]
      };
      y6fj.dueDate = {
        $lt: new Date()
      };
    }
    const et2c = await ozxz.find(y6fj).populate("assignedTo", "username firstName lastName").populate("assignedBy", "username firstName").populate("relatedEntity.id") // Populates the Order/Product if linked
    .sort({
      dueDate: 1,
      priority: -1
    }) // Sort by due date (High=2, Medium=1, Low=0 logic needed or just date)
    .limit(parseInt(eb9rt)).skip((parseInt(mv4q) - 1) * parseInt(eb9rt)).lean();
    const p94qfs = await ozxz.countDocuments(y6fj);
    ekqnb4.json({
      success: true,
      data: {
        tasks: et2c,
        pagination: {
          currentPage: parseInt(mv4q),
          totalPages: Math.ceil(p94qfs / eb9rt),
          totalItems: p94qfs,
          itemsPerPage: parseInt(eb9rt)
        }
      }
    });
  } catch (oe09m) {
    console.error("List tasks error:", oe09m);
    ekqnb4.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

/**
 * GET /api/tasks/my - Current User's Tasks (SOW 6.8 Dashboard)
 */
exports.getMyTasks = async (fsad4, ns5qy) => {
  try {
    const {
      status: hkt5w = "Pending,InProgress"
    } = fsad4.query; // Default to active tasks

    const ii36 = {
      assignedTo: fsad4.user.userId,
      status: {
        $in: hkt5w.split(",")
      }
    };
    t3mkl2(fsad4, ii36);
    const h107 = await ozxz.find(ii36).populate("relatedEntity.id").sort({
      dueDate: 1
    }).lean();
    ns5qy.json({
      success: true,
      data: {
        count: h107.length,
        tasks: h107
      }
    });
  } catch (f5x9q) {
    console.error("Get my tasks error:", f5x9q);
    ns5qy.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

/**
 * GET /api/tasks/stats - Dashboard KPIs (SOW 6.8/6.10 Analytics)
 */
exports.getStats = async (rw3k0u, k3kk9d) => {
  try {
    const {
      assignee: x2qkp
    } = rw3k0u.query;
    const gu5pbf = {};
    t3mkl2(rw3k0u, gu5pbf);
    if (x2qkp) gu5pbf.assignedTo = new eroc63.Types.ObjectId(x2qkp);
    const pl0j = await ozxz.aggregate([{
      $match: gu5pbf
    }, {
      $group: {
        _id: "$status",
        count: {
          $sum: 1
        },
        highPriority: {
          $sum: {
            $cond: [{
              $eq: ["$priority", "High"]
            }, 1, 0]
          }
        }
      }
    }]);

    // Format results
    const lml1 = {
      total: 0,
      pending: 0,
      inProgress: 0,
      completed: 0,
      cancelled: 0,
      overdue: 0,
      // Requires a separate query or logic
      highPriority: 0
    };
    pl0j.forEach(bnqtkw => {
      if (bnqtkw._id) {
        const w8ti2 = bnqtkw._id === "InProgress" ? "inProgress" : bnqtkw._id.toLowerCase();
        lml1[w8ti2] = bnqtkw.count;
        lml1.total += bnqtkw.count;
        if (bnqtkw._id !== "Cancelled" && bnqtkw._id !== "Completed") lml1.highPriority += bnqtkw.highPriority;
      }
    });

    // Count overdue
    const jh70tl = await ozxz.countDocuments({
      status: {
        $nin: ["Completed", "Cancelled"]
      },
      dueDate: {
        $lt: new Date()
      },
      ...gu5pbf
    });
    lml1.overdue = jh70tl;
    k3kk9d.json({
      success: true,
      result: lml1
    });
  } catch (t5l048) {
    console.error("Task stats error:", t5l048);
    k3kk9d.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

/**
 * GET /api/tasks/:id - Details
 */
exports.getTask = async (o3wh5, k8ye7) => {
  try {
    const hb91 = {
      _id: o3wh5.params.id
    };
    t3mkl2(o3wh5, hb91);
    const q19c = await ozxz.findOne(hb91).populate("assignedTo", "username email role").populate("assignedBy", "username email").populate("relatedEntity.id").lean();
    if (!q19c) return k8ye7.status(404).json({
      success: false,
      message: "Task not found"
    });
    k8ye7.json({
      success: true,
      task: q19c
    });
  } catch (o8he7) {
    console.error("Get task error:", o8he7);
    if (o8he7.name === "CastError") return k8ye7.status(400).json({
      success: false,
      message: "Invalid task ID"
    });
    k8ye7.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

/**
 * POST /api/tasks - Create & Assign
 */
exports.createTask = async (vu7ki9, b70fag) => {
  try {
    const {
      title: ip01ro,
      description: m6x3,
      assignedTo: s7n1j6,
      dueDate: a5vzxg,
      priority: v9bqh9,
      relatedEntity: anlmmd
    } = vu7ki9.body;

    // Verify assignee exists
    const n560q = await peuww.findById(s7n1j6);
    if (!n560q) return b70fag.status(404).json({
      success: false,
      message: "Assignee user not found"
    });

    // Verify related entity exists if provided
    if (anlmmd?.id && anlmmd?.type) {
      // Logic to check if Order/Product/etc exists can go here
    }
    const m8otuf = new ozxz({
      title: ip01ro,
      description: m6x3,
      assignedTo: s7n1j6,
      assignedBy: vu7ki9.user.userId,
      dueDate: new Date(a5vzxg),
      priority: v9bqh9 || "Medium",
      status: "Pending",
      relatedEntity: anlmmd,
      ...(vu7ki9.tenantId && {
        tenantId: vu7ki9.tenantId
      })
    });
    await m8otuf.save();

    // SOW 6.8: Trigger Notification (Mocked or Real logic)
    // console.log(`ðŸ”” Notification sent to ${assignee.email}: New task assigned!`);

    ys747n(vu7ki9.user.userId, "CREATE", m8otuf._id, {}, m8otuf.toObject(), "Task created and assigned");
    b70fag.status(201).json({
      success: true,
      message: "Task created and assigned successfully",
      data: m8otuf.toObject()
    });
  } catch (lcua) {
    console.error("Create task error:", lcua);
    if (lcua.name === "ValidationError") return b70fag.status(400).json({
      success: false,
      message: "Validation failed",
      errors: Object.values(lcua.errors).map(k6t8 => ({
        field: k6t8.path,
        message: k6t8.message
      }))
    });
    b70fag.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

/**
 * PUT /api/tasks/:id - Update details
 */
exports.updateTask = async (c1ssq, z0x53) => {
  try {
    const czplkq = {
      _id: c1ssq.params.id
    };
    t3mkl2(c1ssq, czplkq);
    const n0060a = await ozxz.findOne(czplkq);
    if (!n0060a) return z0x53.status(404).json({
      success: false,
      message: "Task not found"
    });

    // Prevent editing completed tasks (Business Logic)
    if (n0060a.status === "Completed" || n0060a.status === "Cancelled") {
      return z0x53.status(400).json({
        success: false,
        message: `Cannot edit a ${n0060a.status} task`
      });
    }
    const yi9je = n0060a.toObject();
    if (c1ssq.body.title) n0060a.title = c1ssq.body.title;
    if (c1ssq.body.description !== undefined) n0060a.description = c1ssq.body.description;
    if (c1ssq.body.dueDate) n0060a.dueDate = new Date(c1ssq.body.dueDate);
    if (c1ssq.body.priority) n0060a.priority = c1ssq.body.priority;
    n0060a.updatedAt = new Date();
    await n0060a.save();
    ys747n(c1ssq.user.userId, "UPDATE", n0060a._id, yi9je, n0060a.toObject());
    z0x53.json({
      success: true,
      message: "Task updated successfully",
      data: n0060a.toObject()
    });
  } catch (e7o3) {
    console.error("Update task error:", e7o3);
    z0x53.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

/**
 * PATCH /api/tasks/:id/status - Workflow State Machine
 */
exports.updateStatus = async (y673n0, h2kt) => {
  try {
    const {
      id: fonp
    } = y673n0.params;
    const {
      status: s4034,
      completionNote: lau5
    } = y673n0.body;
    const ig47 = {
      _id: fonp
    };
    t3mkl2(y673n0, ig47);
    const bj9r = await ozxz.findOne(ig47).populate("assignedTo", "email");
    if (!bj9r) return h2kt.status(404).json({
      success: false,
      message: "Task not found"
    });

    // Define valid transitions
    const bi025 = {
      Pending: ["InProgress", "Cancelled"],
      InProgress: ["Completed", "Cancelled"],
      Completed: [],
      Cancelled: []
    };
    if (!bi025[bj9r.status]?.includes(s4034)) {
      return h2kt.status(400).json({
        success: false,
        message: `Invalid transition from ${bj9r.status} to ${s4034}`
      });
    }
    const lhwjp = bj9r.toObject();
    bj9r.status = s4034;
    bj9r.updatedAt = new Date();
    if (s4034 === "Completed") {
      bj9r.completedAt = new Date();
    }
    if (lau5) bj9r.description = `${bj9r.description}\n\nNote: ${lau5}`; // Append note

    await bj9r.save();

    // SOW 6.8: Notify creator that task is completed
    // console.log(`ðŸ”” Notification to Manager: Task ${task.title} completed by ${task.assignedTo?.email}`);

    ys747n(y673n0.user.userId, "STATUS_CHANGE", bj9r._id, lhwjp, {
      status: s4034,
      completedAt: bj9r.completedAt
    });
    h2kt.json({
      success: true,
      message: `Task status updated to ${s4034}`,
      data: {
        id: bj9r._id,
        status: bj9r.status,
        completedAt: bj9r.completedAt
      }
    });
  } catch (a1u38) {
    console.error("Update status error:", a1u38);
    h2kt.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

/**
 * DELETE /api/tasks/:id - Cancel/Soft Delete
 */
exports.deleteTask = async (ob22f0, bwtu07) => {
  try {
    const {
      id: bid6x
    } = ob22f0.params;
    const {
      reason: c1176
    } = ob22f0.body;
    const s0bzk = {
      _id: bid6x
    };
    t3mkl2(ob22f0, s0bzk);
    const g11u = await ozxz.findOne(s0bzk);
    if (!g11u) return bwtu07.status(404).json({
      success: false,
      message: "Task not found"
    });
    if (g11u.status === "Completed") return bwtu07.status(400).json({
      success: false,
      message: "Cannot cancel a completed task"
    });
    const k9t8 = g11u.toObject();
    g11u.status = "Cancelled";
    g11u.updatedAt = new Date();
    await g11u.save();
    ys747n(ob22f0.user.userId, "CANCEL", g11u._id, k9t8, {
      status: "Cancelled"
    }, c1176);
    bwtu07.json({
      success: true,
      message: "Task cancelled successfully",
      data: {
        id: g11u._id,
        status: "Cancelled",
        cancelledAt: g11u.updatedAt
      }
    });
  } catch (nc2y) {
    console.error("Delete task error:", nc2y);
    bwtu07.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};