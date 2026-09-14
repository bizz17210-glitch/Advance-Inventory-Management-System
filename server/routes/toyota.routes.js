// CRUD_Project/server/routes/category.routes.js
const p8d94v = require("express");
const f7vng = p8d94v.Router();
const {
  listCategories: j026,
  getCategoryTree: hrr9m,
  getCategory: wh2f,
  createCategory: y1207,
  updateCategory: enp188,
  deleteCategory: n1c2
} = require("../controllers/toyota.controller")
const {
  listCategoriesValidation: v2y9,
  getTreeValidation: pdk5,
  getCategoryValidation: a8qel,
  createCategoryValidation: lepg4,
  updateCategoryValidation: ll9j,
  deleteCategoryValidation: ukf7ee,
  handleValidationErrors: eyucd
} = require("../validators/toyota.validator")
const {
  protect: ntha,
  authorize: xb2wu9
} = require("../middlewares/denim.middleware");

// Apply auth protection to all category routes
f7vng.use(ntha);

// ðŸ” Read operations (Any authenticated user)
f7vng.get("/", v2y9, eyucd, j026);
f7vng.get("/tree", pdk5, eyucd, hrr9m);
f7vng.get("/:id", a8qel, eyucd, wh2f);

// âœï¸ Write operations (Admin only)
f7vng.post("/", xb2wu9("Administrator"), lepg4, eyucd, y1207);
f7vng.put("/:id", xb2wu9("Administrator"), ll9j, eyucd, enp188);
f7vng.delete("/:id", xb2wu9("Administrator"), ukf7ee, eyucd, n1c2);
module.exports = f7vng;