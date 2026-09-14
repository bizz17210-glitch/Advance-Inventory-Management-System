// CRUD_Project/server/routes/user.routes.js
const w14l = require("express");
const te2u = w14l.Router();
const {
  listUsers: c0d90,
  getUser: kixd6x,
  updateUser: yim46,
  updateUserStatus: yc93y,
  deleteUser: g5a4xk,
  requestPasswordChange: i1e20m,
  updatePassword: q624i
} = require("../controllers/marble.controller")
const {
  listUsersValidation: u42b0u,
  getUserValidation: c8lc4,
  updateUserValidation: h115,
  updateUserStatusValidation: iwl611,
  deleteUserValidation: p1k3,
  requestPasswordChangeValidation: z6jx6,
  updatePasswordValidation: t1rai,
  handleValidationErrors: m2oiz
} = require("../validators/marble.validator")
const {
  protect: kien1,
  authorize: qw954u
} = require("../middlewares/denim.middleware");

// Apply auth protection to all routes
te2u.use(kien1);

// ðŸ“‹ List users - Admin only
te2u.get("/", qw954u("Administrator"), u42b0u, m2oiz, c0d90);

// ðŸ‘¤ Get single user - Admin only
te2u.get("/:id", qw954u("Administrator"), c8lc4, m2oiz, kixd6x);

// âœï¸ Update user details - Admin only
te2u.put("/:id", qw954u("Administrator"), h115, m2oiz, yim46);

// ðŸ”„ Update user status only - Admin only
te2u.patch("/:id/status", qw954u("Administrator"), iwl611, m2oiz, yc93y);

// ðŸ—‘ï¸ Soft delete user - Admin only
te2u.delete("/:id", qw954u("Administrator"), p1k3, m2oiz, g5a4xk);

// ðŸ” Request password change info - Any authenticated user
te2u.get("/me/password", z6jx6, m2oiz, i1e20m);

// ðŸ”‘ Update own password - Any authenticated user
te2u.put("/me/password", t1rai, m2oiz, q624i);
module.exports = te2u;