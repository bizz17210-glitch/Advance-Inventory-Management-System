const {
  body: nkdynh,
  param: vob9,
  validationResult: c9xzb
} = require("express-validator");
const yvvi7n = b6cr => {
  const q4x4xm = c9xzb(b6cr);
  if (!q4x4xm.isEmpty()) {
    return q4x4xm.array().map(l224 => ({
      field: l224.param,
      message: l224.msg
    }));
  }
  return null;
};
const g35s6e = [vob9("id").isMongoId().withMessage("Invalid supplier ID")];

//address validation
const ak6c9i = [nkdynh("address.street").trim().isLength({
  min: 1,
  max: 200
}).withMessage("Street is required (max 200 chars)"), nkdynh("address.city").trim().isLength({
  min: 1,
  max: 100
}).withMessage("City is required (max 100 chars)"), nkdynh("address.state").optional().trim().isLength({
  max: 100
}), nkdynh("address.zipCode").optional().trim().isLength({
  max: 20
}), nkdynh("address.country").trim().isLength({
  min: 1,
  max: 100
}).withMessage("Country is required (max 100 chars)")];

// supplier field
const wcmhgf = [nkdynh("name").trim().isLength({
  min: 1,
  max: 200
}).withMessage("Supplier name must be 1-200 characters"), nkdynh("contactPerson").trim().isLength({
  min: 1,
  max: 100
}).withMessage("Contact person is required"), nkdynh("email").trim().normalizeEmail().isEmail().withMessage("Valid email required"), nkdynh("phone").trim().matches(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/).withMessage("Valid phone required"), ...ak6c9i,
// Payment terms
nkdynh("paymentTerms").optional().isIn(["Net 15", "Net 30", "Net 45", "Net 60", "COD", "Prepaid", "Custom"]).withMessage("Invalid payment terms"),
// Balance tracking - both options support manual tracking)
nkdynh("balance").optional().isFloat({
  min: 0
}).withMessage("Balance must be >= 0")];

//Get /api/suppliers - List
exports.listSuppliersValidation = [];

//Get /api/suppliers/:id - Get details
exports.getSupplierValidation = [...g35s6e];

//Post /api/suppliers - Create new supplier
exports.createSupplierValidation = [...wcmhgf];

//Put /api/suppliers/:id - Update supplier
exports.updateSupplierValidation = [...g35s6e,
// All fields optional for partial updates
nkdynh("name").optional().trim().isLength({
  min: 1,
  max: 200
}), nkdynh("contactPerson").optional().trim().isLength({
  min: 1,
  max: 100
}), nkdynh("email").optional().trim().normalizeEmail().isEmail(), nkdynh("phone").optional().trim().matches(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/), nkdynh("address").optional().isObject(), nkdynh("address.street").optional().trim().isLength({
  min: 1,
  max: 200
}), nkdynh("address.city").optional().trim().isLength({
  min: 1,
  max: 100
}), nkdynh("address.state").optional().trim().isLength({
  max: 100
}), nkdynh("address.zipCode").optional().trim().isLength({
  max: 20
}), nkdynh("address.country").optional().trim().isLength({
  min: 1,
  max: 100
}), nkdynh("paymentTerms").optional().isIn(["Net 15", "Net 30", "Net 45", "Net 60", "COD", "Prepaid", "Custom"]), nkdynh("balance").optional().isFloat({
  min: 0
})];

// Patch /api/suppliers/:id/balance - Financial adjustment
exports.adjustBalanceValidation = [...g35s6e, nkdynh("adjustment").isFloat({
  min: 0.01
}).withMessage("Adjustment amount required (>0)"), nkdynh("adjustmentType").isIn(["credit", "debit"]).withMessage('Must be "credit" (payment received) or "debit" (new charge)'), nkdynh("reason").trim().isLength({
  min: 1,
  max: 500
}).withMessage("Reason required for audit"), nkdynh("reference").optional().trim().isLength({
  max: 100
}).withMessage("Reference max 100 chars")];

// DELETE /api/suppliers/:id - Soft delete
exports.deleteSupplierValidation = [...g35s6e];

// Export error handler
exports.handleValidationErrors = (m9378g, dmd3u9, r4761) => {
  const a5ij = yvvi7n(m9378g);
  if (a5ij) {
    return dmd3u9.status(400).json({
      success: false,
      message: "Validation failed",
      errors: a5ij
    });
  }
  r4761();
};