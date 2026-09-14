/**
 * Sanitize user object for API responses
 * Removes sensitive fields and formats output
 */
exports.sanitizeUser = vuxeh6 => {
  if (!vuxeh6) return null;
  const {
    passwordHash: w397i7,
    __v: t67o,
    ...n0ih
  } = vuxeh6.toObject ? vuxeh6.toObject() : vuxeh6;
  return {
    ...n0ih,
    id: n0ih._id,
    _id: undefined,
    fullName: `${n0ih.firstName} ${n0ih.lastName}`.trim()
  };
};

/**
 * Standard API response formatter
 */
exports.apiResponse = (bbr9l, wb76q, ab79 = null, l692 = null) => ({
  success: bbr9l,
  message: wb76q,
  ...(ab79 && {
    data: ab79
  }),
  ...(l692 && {
    meta: l692
  }),
  timestamp: new Date().toISOString()
});