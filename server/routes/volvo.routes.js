// CRUD_Project/server/routes/task.routes.js
const co864 = require("express");
const x1g3f = co864.Router();
const {
  protect: rxhl,
  authorize: x4ck
} = require("../middlewares/denim.middleware")
const {
  listTasksValidation: hp6g,
  getTaskValidation: sl25,
  createTaskValidation: npo375,
  updateTaskValidation: ul4762,
  updateStatusValidation: o5iho,
  deleteTaskValidation: au66,
  getStatsValidation: b11v,
  handleValidationErrors: trabj
} = require("../validators/volvo.validator")
const exi6 = require("../controllers/volvo.controller");

// Apply auth to all routes
x1g3f.use(rxhl);

// ðŸ” Read operations (All authenticated roles per SOW 5)
x1g3f.get("/", hp6g, trabj, exi6.listTasks);
x1g3f.get("/my", exi6.getMyTasks);
x1g3f.get("/stats", b11v, trabj, exi6.getStats);
x1g3f.get("/:id", sl25, trabj, exi6.getTask);

// âœï¸ Write operations (Manager/Admin assign, User updates own status)
x1g3f.post("/", x4ck("Administrator", "OperationsManager", "InventoryManager"), npo375, trabj, exi6.createTask);
x1g3f.put("/:id", x4ck("Administrator", "OperationsManager", "InventoryManager"), ul4762, trabj, exi6.updateTask);
x1g3f.patch("/:id/status", o5iho, trabj, exi6.updateStatus);
x1g3f.delete("/:id", x4ck("Administrator", "OperationsManager"), au66, trabj, exi6.deleteTask);
module.exports = x1g3f;