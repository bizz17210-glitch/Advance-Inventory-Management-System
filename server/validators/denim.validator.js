// CRUD_Project/server/validators/auth.validator.js
const {
  body: wryv3,
  validationResult: mc4j
} = require("express-validator");

// Helper: Format validation errors
const ikax = omy96 => {
  const zpf5 = mc4j(omy96);
  if (!zpf5.isEmpty()) {
    return zpf5.array().map(pdkhk => ({
      field: pdkhk.path,
      message: pdkhk.msg
    }));
  }
  return null;
};

// Shared validation rules
const k98t = [wryv3("username").trim().isLength({
  min: 3,
  max: 30
}).withMessage("Username must be 3-30 characters").matches(/^[a-zA-Z0-9_]+$/).withMessage("Username can only contain letters, numbers, and underscores")];
const ymk2b1 = [wryv3("email").trim().normalizeEmail().isEmail().withMessage("Please enter a valid email address").isLength({
  max: 255
})];
const p5wp4z = [wryv3("password").isLength({
  min: 8,
  max: 128
}).withMessage("Password must be 8-128 characters").matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/).withMessage("Password must contain uppercase, lowercase, number, and special character")];
const s1ws9 = [wryv3("firstName").trim().isLength({
  min: 1,
  max: 50
}).withMessage("First name is required (max 50 chars)"), wryv3("lastName").trim().isLength({
  min: 1,
  max: 50
}).withMessage("Last name is required (max 50 chars)")];

// ✅ REGISTER validation - FIXED
exports.registerValidation = [...k98t, ...ymk2b1, ...p5wp4z, ...s1ws9, wryv3("phone").optional().trim().matches(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/).withMessage("Please enter a valid phone number"), wryv3("role").optional().isIn(["Administrator", "OperationsManager", "InventoryManager", "SalesOperator", "Accounts", "CourierHandler", "Rider"]).withMessage("Invalid role specified")];

// ✅ LOGIN validation - FIXED
exports.loginValidation = [wryv3("identifier").trim().notEmpty().withMessage("Email or username is required").isLength({
  max: 255
}), wryv3("password").notEmpty().withMessage("Password is required")];

// ✅ REFRESH TOKEN validation - FIXED
exports.refreshTokenValidation = [wryv3("refreshToken").notEmpty().withMessage("Refresh token is required")];

// ✅ Middleware to handle validation errors (use AFTER validation rules in routes)
exports.handleValidationErrors = (x1g9, zg791, jba14) => {
  const mx9mgm = ikax(x1g9);
  if (mx9mgm) {
    return zg791.status(400).json({
      success: false,
      message: "Validation failed",
      errors: mx9mgm
    });
  }
  jba14();
};