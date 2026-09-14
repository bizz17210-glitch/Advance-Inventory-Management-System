const {
  body: kj5x8,
  param: sdc023,
  validationResult: j3t49
} = require("express-validator");

// Helper: Format validation errors
const ohjn = juk2 => {
  const o4drbl = j3t49(juk2);
  if (!o4drbl.isEmpty()) {
    return o4drbl.array().map(z9fq => ({
      field: z9fq.path,
      message: z9fq.msg
    }));
  }
  return null;
};

// Shared: User ID validation (for params)
const in9kt = [sdc023("id").isMongoId().withMessage("Invalid user ID format")];

// Shared: Updateable user fields validation
const w3x09s = [kj5x8("firstName").optional().trim().isLength({
  min: 1,
  max: 50
}).withMessage("First name must be 1-50 characters"), kj5x8("lastName").optional().trim().isLength({
  min: 1,
  max: 50
}).withMessage("Last name must be 1-50 characters"), kj5x8("phone").optional().trim().matches(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/).withMessage("Please enter a valid phone number"), kj5x8("assignedLocation").optional().trim().isLength({
  max: 100
}).withMessage("Location must be under 100 characters"), kj5x8("role").optional().isIn(["Administrator", "OperationsManager", "InventoryManager", "SalesOperator", "Accounts", "CourierHandler", "Rider"]).withMessage("Invalid role specified"), kj5x8("status").optional().isIn(["Active", "Inactive", "Suspended"]).withMessage("Status must be Active, Inactive, or Suspended")];

// GET /api/users - List users (no body validation needed)
exports.listUsersValidation = [];

// GET /api/users/:id - Get user by ID
exports.getUserValidation = [...in9kt];

// PUT /api/users/:id - Update user
exports.updateUserValidation = [...in9kt, ...w3x09s
// Prevent updating sensitive fields via this endpoint
//   body('passwordHash').ignore(),
//   body('email').ignore(),
//   body('username').ignore()
];

// PATCH /api/users/:id/status - Update user status only
exports.updateUserStatusValidation = [...in9kt, kj5x8("status").notEmpty().isIn(["Active", "Inactive", "Suspended"]).withMessage("Status must be Active, Inactive, or Suspended")];

// DELETE /api/users/:id - Soft delete user
exports.deleteUserValidation = [...in9kt];

// GET /api/users/me/password - Request password change (no validation needed)
exports.requestPasswordChangeValidation = [];

// PUT /api/users/me/password - Update own password
exports.updatePasswordValidation = [kj5x8("currentPassword").notEmpty().withMessage("Current password is required"), kj5x8("newPassword").isLength({
  min: 8,
  max: 128
}).withMessage("New password must be 8-128 characters").matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/).withMessage("Password must contain uppercase, lowercase, number, and special character"), kj5x8("confirmPassword").custom((jnk68, {
  req: ct9jl
}) => {
  if (jnk68 !== ct9jl.body.newPassword) {
    throw new Error("Passwords do not match");
  }
  return true;
})];

// ✅ Export error handler middleware
exports.handleValidationErrors = (m155p5, nt40, l0nu8) => {
  const wh64 = ohjn(m155p5);
  if (wh64) {
    return nt40.status(400).json({
      success: false,
      message: "Validation failed",
      errors: wh64
    });
  }
  l0nu8();
};