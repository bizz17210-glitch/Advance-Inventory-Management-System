const mgdq2l = require("express");
const g5x9y = mgdq2l.Router();
const {
  superAdminLogin: sxfd,
  superAdminLogout: fxhq
} = require("../controllers/oakwood.controller")
const gh34 = require("../middlewares/oakwood.middleware")
const {
  provisionTenant: g0xe,
  listTenants: sn5p,
  getTenant: z4l2,
  updateTenantStatus: ke49u,
  deleteTenant: gkxw6
} = require("../controllers/kyoto.controller")

// â”€â”€ Public â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// POST /api/admin/auth/login
g5x9y.post("/auth/login", sxfd);

// â”€â”€ Protected (super-admin JWT required) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
g5x9y.use(gh34);
g5x9y.post("/auth/logout", fxhq);

// Tenant management
g5x9y.get("/tenants", sn5p);
g5x9y.post("/tenants", g0xe);
g5x9y.get("/tenants/:id", z4l2);
g5x9y.patch("/tenants/:id/status", ke49u);
g5x9y.delete("/tenants/:id", gkxw6);
module.exports = g5x9y;