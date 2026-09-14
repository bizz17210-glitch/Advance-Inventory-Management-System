// CRUD_Project/server/validators/order.validator.js
const {
  body: op7x0,
  param: k40w5,
  query: cboqr,
  validationResult: kwl1c
} = require("express-validator");
const m5q22j = zs469 => {
  const xd2xc7 = kwl1c(zs469);
  if (!xd2xc7.isEmpty()) {
    return xd2xc7.array().map(i353wn => ({
      field: i353wn.path,
      message: i353wn.msg
    }));
  }
  return null;
};
const iubj = [k40w5("id").isMongoId().withMessage("Invalid order ID")];
const bn22 = [k40w5("itemId").isMongoId().withMessage("Invalid item ID")];

// 🔹 Shared validations
const g4ti = [op7x0("shippingAddress.name").optional().trim().notEmpty(), op7x0("shippingAddress.phone").optional().trim().matches(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/), op7x0("shippingAddress.street").optional().trim().notEmpty(), op7x0("shippingAddress.city").optional().trim().notEmpty(), op7x0("shippingAddress.zipCode").optional().trim().notEmpty(), op7x0("shippingAddress.country").optional().trim().notEmpty()];

// Core CRUD
exports.listOrdersValidation = [cboqr("page").optional().isInt({
  min: 1
}), cboqr("limit").optional().isInt({
  min: 1,
  max: 100
}), cboqr("status").optional().isIn(["Pending", "Confirmed", "Processing", "Packed", "Shipped", "Delivered", "Cancelled", "Returned"]), cboqr("paymentStatus").optional().isIn(["Pending", "Paid", "Refunded", "Partially Paid", "Failed"]), cboqr("source").optional().isIn(["WhatsApp", "Shopify", "Manual", "Instagram", "Website"]), cboqr("dateFrom").optional().isISO8601(), cboqr("dateTo").optional().isISO8601()];
exports.getOrderValidation = [...iubj];
// In validators/order.validator.js
exports.createOrderValidation = [op7x0("customer").isMongoId().withMessage("Valid customer ID required"), op7x0("source").isIn(["WhatsApp", "Shopify", "Manual", "Instagram", "Website"]), op7x0("items").isArray({
  min: 1
}).withMessage("Order must have at least one item"), op7x0("items.*.productId").isMongoId(), op7x0("items.*.variantId").trim().notEmpty(), op7x0("items.*.quantity").isInt({
  min: 1
}), op7x0("items.*.unitPrice").optional().isFloat({
  min: 0
}),
// ✅ Made optional - controller uses variant price if not provided
...g4ti, op7x0("paymentMethod").optional().isIn(["COD", "Prepaid", "Card", "BankTransfer", "Wallet"]), op7x0("discount").optional().isFloat({
  min: 0
}), op7x0("notes").optional().trim().isLength({
  max: 1000
})];
exports.updateOrderValidation = [...iubj, ...g4ti, op7x0("discount").optional().isFloat({
  min: 0
}), op7x0("notes").optional().trim().isLength({
  max: 1000
})];
exports.cancelOrderValidation = [...iubj, op7x0("reason").optional().trim().isLength({
  max: 500
})];

// Workflow
exports.updateStatusValidation = [...iubj, op7x0("status").isIn(["Pending", "Confirmed", "Processing", "Packed", "Shipped", "Delivered", "Cancelled", "Returned"]), op7x0("notes").optional().trim().isLength({
  max: 500
})];
exports.updatePaymentValidation = [...iubj, op7x0("paymentStatus").isIn(["Pending", "Paid", "Refunded", "Partially Paid", "Failed"]), op7x0("notes").optional().trim().isLength({
  max: 500
})];
exports.updateDeliveryValidation = [...iubj, op7x0("deliveryStatus").isIn(["Pending", "Assigned", "Picked Up", "In Transit", "Out for Delivery", "Delivered", "Failed", "Returned"]), op7x0("trackingNumber").optional().trim().isLength({
  min: 3,
  max: 100
})];
exports.fulfillOrderValidation = [...iubj, op7x0("courier").optional().isMongoId(), op7x0("rider").optional().isMongoId(), op7x0("notes").optional().trim().isLength({
  max: 500
})];

// Items
exports.addItemValidation = [...iubj, op7x0("productId").isMongoId(), op7x0("variantId").trim().notEmpty(), op7x0("quantity").isInt({
  min: 1
}), op7x0("unitPrice").isFloat({
  min: 0
})];
exports.updateItemValidation = [...iubj, ...bn22, op7x0("quantity").optional().isInt({
  min: 1
}), op7x0("unitPrice").optional().isFloat({
  min: 0
})];
exports.deleteItemValidation = [...iubj, ...bn22];

// Error handler
exports.handleValidationErrors = (j0c2xi, k2hi, pnsg0) => {
  const u9cqxv = m5q22j(j0c2xi);
  if (u9cqxv) return k2hi.status(400).json({
    success: false,
    message: "Validation failed",
    errors: u9cqxv
  });
  pnsg0();
};