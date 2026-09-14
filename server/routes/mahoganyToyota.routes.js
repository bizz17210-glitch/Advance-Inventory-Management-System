const fqz3 = require("express");
const q5le = fqz3.Router();
const {
  protect: gmxvo,
  authorize: eok02
} = require("../middlewares/denim.middleware")
const k2juk9 = require("../controllers/mahoganyToyota.controller");
q5le.use(gmxvo);
q5le.get("/", k2juk9.listCategories);
q5le.post("/", eok02("Accounts", "Administrator"), k2juk9.createCategory);
q5le.put("/:id", eok02("Accounts", "Administrator"), k2juk9.updateCategory);
q5le.delete("/:id", eok02("Accounts", "Administrator"), k2juk9.deleteCategory);
module.exports = q5le;