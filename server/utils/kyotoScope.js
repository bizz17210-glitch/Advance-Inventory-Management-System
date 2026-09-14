/**
 * tenantScope.js
 * ─────────────────────────────────────────────────────────
 * Two tiny helpers used in every controller to scope
 * MongoDB queries and creates to the current tenant.
 */

/**
 * Injects tenantId into a filter object for find/findOne queries.
 *
 * Usage:
 *   const filter = {};
 *   applyTenantScope(req, filter);
 *   const orders = await Order.find(filter).lean();
 */
const vgmc = (ayz3bs, gd83u = {}) => {
  if (ayz3bs.tenantId) {
    gd83u.tenantId = ayz3bs.tenantId;
  }
  return gd83u;
};

/**
 * Merges tenantId into a data object before create/save.
 *
 * Usage:
 *   const order = await Order.create(withTenant(req, req.body));
 */
const mh29 = (y1pd, s50rx2 = {}) => {
  if (y1pd.tenantId) {
    return {
      ...s50rx2,
      tenantId: y1pd.tenantId
    };
  }
  return s50rx2;
};
module.exports = {
  applyTenantScope: vgmc,
  withTenant: mh29
};