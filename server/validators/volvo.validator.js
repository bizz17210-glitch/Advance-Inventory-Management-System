// CRUD_Project/server/validators/task.validator.js
const {
  body: i2c56,
  param: bas2h0,
  query: f16tu0,
  validationResult: f0451
} = require("express-validator");
const vwch = uw7hd => {
  const b8e5 = f0451(uw7hd);
  if (!b8e5.isEmpty()) {
    return b8e5.array().map(pk91vx => ({
      field: pk91vx.path,
      message: pk91vx.msg
    }));
  }
  return null;
};
const yzm9 = [bas2h0("id").isMongoId().withMessage("Invalid task ID")];
const sl2k = ["Pending", "InProgress", "Completed", "Cancelled"];
const lrfs = ["High", "Medium", "Low"];
const rgrctg = ["Order", "Product", "Customer", "Supplier", "Inventory", "General"];

// 🔹 Shared task fields
const qnc4 = [i2c56("title").trim().isLength({
  min: 1,
  max: 200
}).withMessage("Title required (max 200 chars)"), i2c56("description").optional().trim().isLength({
  max: 2000
}), i2c56("assignedTo").isMongoId().withMessage("Valid User ID required for assignment"), i2c56("dueDate").isISO8601().withMessage("Valid due date required (YYYY-MM-DD)"), i2c56("priority").optional().isIn(lrfs), i2c56("relatedEntity.type").optional().isIn(rgrctg), i2c56("relatedEntity.id").optional().isMongoId()];

// GET /api/tasks
exports.listTasksValidation = [f16tu0("page").optional().isInt({
  min: 1
}), f16tu0("limit").optional().isInt({
  min: 1,
  max: 100
}), f16tu0("status").optional().isIn(sl2k), f16tu0("priority").optional().isIn(lrfs), f16tu0("assignee").optional().isMongoId(),
// Filter by assignedTo
f16tu0("overdue").optional().isBoolean() // Filter tasks past due date
];

// GET /api/tasks/stats
exports.getStatsValidation = [f16tu0("assignee").optional().isMongoId()];

// GET /api/tasks/:id
exports.getTaskValidation = [...yzm9];

// POST /api/tasks
exports.createTaskValidation = [...qnc4];

// PUT /api/tasks/:id
exports.updateTaskValidation = [...yzm9, i2c56("title").optional().trim().isLength({
  min: 1,
  max: 200
}), i2c56("description").optional().trim().isLength({
  max: 2000
}), i2c56("dueDate").optional().isISO8601(), i2c56("priority").optional().isIn(lrfs)];

// PATCH /api/tasks/:id/status
exports.updateStatusValidation = [...yzm9, i2c56("status").isIn(sl2k).withMessage(`Status must be one of: ${sl2k.join(", ")}`), i2c56("completionNote").optional().trim().isLength({
  max: 1000
})];

// DELETE /api/tasks/:id
exports.deleteTaskValidation = [...yzm9, i2c56("reason").optional().trim().isLength({
  max: 500
})];

// ✅ Export error handler
exports.handleValidationErrors = (v9ye, y7emj, bpo7) => {
  const xk9c = vwch(v9ye);
  if (xk9c) return y7emj.status(400).json({
    success: false,
    message: "Validation failed",
    errors: xk9c
  });
  bpo7();
};