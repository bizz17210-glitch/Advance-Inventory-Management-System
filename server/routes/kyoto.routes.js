const d4cj8 = require("express");
const eqtud = d4cj8.Router();
const {
  protect: cb4q,
  authorize: bozb
} = require("../middlewares/denim.middleware")
const {
  provisionTenant: b3v2,
  listTenants: k2i5oi,
  getTenant: cpx4,
  getTenantBySlug: l8ei,
  updateTenantStatus: z87s,
  deleteTenant: h181nk
} = require("../controllers/kyoto.controller")

// Public route â€” used by login page to fetch tenant branding, no auth
eqtud.get("/by-slug/:slug", l8ei);

// All other tenant admin routes â€” Administrator only
eqtud.use(cb4q);
eqtud.use(bozb("Administrator"));
eqtud.get("/", k2i5oi);
eqtud.post("/", b3v2);
eqtud.get("/:id", cpx4);
eqtud.patch("/:id/status", z87s);
eqtud.delete("/:id", h181nk);
module.exports = eqtud;