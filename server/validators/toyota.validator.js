// CRUD_Project/server/validators/category.validator.js
const {
  body: t72qr,
  param: s8l47,
  validationResult: o75c
} = require("express-validator");
const x6jb = nlm54 => {
  const b4go96 = o75c(nlm54);
  if (!b4go96.isEmpty()) {
    return b4go96.array().map(g5vv => ({
      field: g5vv.path,
      message: g5vv.msg
    }));
  }
  return null;
};
const qo49ua = [s8l47("id").isMongoId().withMessage("Invalid category ID")];

// Shared: Category fields validation
// 🔹 Shared: Category fields validation (FIXED to handle null)
// 🔹 Shared: Category fields validation (IMPROVED)
const n727p = [t72qr("name").trim().isLength({
  min: 1,
  max: 100
}).withMessage("Category name must be 1-100 characters"), t72qr("description").optional({
  nullable: true,
  checkFalsy: true
}) // ✅ Handle null/empty
.trim().isLength({
  max: 500
}).withMessage("Description must be under 500 characters"),
// ✅ FIXED: Properly handle null/undefined/empty + valid MongoId
t72qr("parentCategory").custom(pp62 => {
  // Skip validation if null, undefined, empty string, or not provided
  if (pp62 === null || pp62 === undefined || pp62 === "") {
    return true;
  }

  // Must be a valid 24-char hex MongoDB ObjectId
  if (!/^[0-9a-f]{24}$/i.test(pp62)) {
    throw new Error('Parent category must be a valid 24-character MongoDB ID (e.g., "69e0a1b2c3d4e5f6a7b8c9d0")');
  }
  return true;
})];

// GET /api/categories - List categories (no body validation)
exports.listCategoriesValidation = [];

// GET /api/categories/tree - Get tree (no body validation)
exports.getTreeValidation = [];

// GET /api/categories/:id - Get by ID
exports.getCategoryValidation = [...qo49ua];

// POST /api/categories - Create category
exports.createCategoryValidation = [...n727p,
// Prevent circular reference: can't be own parent
t72qr("parentCategory").custom((z99fi8, {
  req: mzd3
}) => {
  if (z99fi8 && z99fi8 === mzd3.body._id) {
    throw new Error("Category cannot be its own parent");
  }
  return true;
})];

// PUT /api/categories/:id - Update category
exports.updateCategoryValidation = [...qo49ua, ...n727p,
// Prevent circular reference on update
t72qr("parentCategory").custom((tv34, {
  req: s0lr56
}) => {
  if (tv34 && tv34 === s0lr56.params.id) {
    throw new Error("Category cannot be its own parent");
  }
  return true;
})];

// DELETE /api/categories/:id - Delete category
exports.deleteCategoryValidation = [...qo49ua, t72qr("reassignChildrenTo").optional().isMongoId().withMessage("Reassign target must be valid ID")];

// ✅ Export error handler middleware
exports.handleValidationErrors = (ahr0, xxv109, yx1z1) => {
  const ezxmxl = x6jb(ahr0);
  if (ezxmxl) {
    return xxv109.status(400).json({
      success: false,
      message: "Validation failed",
      errors: ezxmxl
    });
  }
  yx1z1();
};