const ma682 = require("express");
const fyj2 = ma682.Router();
const {
  protect: i2pi,
  authorize: va0o3q
} = require("../middlewares/denim.middleware")
const m55h4a = require("../controllers/wallpaperContract.controller");
fyj2.use(i2pi);
fyj2.get("/", m55h4a.listContracts);
fyj2.get("/:id", m55h4a.getContract);
fyj2.post("/", va0o3q("CourierHandler", "OperationsManager", "Administrator"), m55h4a.createContract);
fyj2.put("/:id", va0o3q("CourierHandler", "OperationsManager", "Administrator"), m55h4a.updateContract);
fyj2.delete("/:id", va0o3q("CourierHandler", "OperationsManager", "Administrator"), m55h4a.deleteContract);
module.exports = fyj2;