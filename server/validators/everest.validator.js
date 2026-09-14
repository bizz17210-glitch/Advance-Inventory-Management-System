// CRUD_Project/server/validators/product.validator.js
const {
  body: q39f3w,
  param: l23b1k,
  validationResult: h26yu
} = require("express-validator");
const f3j73p = yrdv => {
  const q0ncz9 = h26yu(yrdv);
  if (!q0ncz9.isEmpty()) {
    return q0ncz9.array().map(b858 => ({
      field: b858.path,
      message: b858.msg
    }));
  }
  return null;
};
const w8kl2 = [l23b1k("id").isMongoId().withMessage("Invalid product ID")];
const xc1t28 = [l23b1k("variantId").trim().notEmpty().withMessage("Variant ID required")];
const v07o = [l23b1k("index").isInt({
  min: 0
}).withMessage("Image index must be >= 0")];

// 🔹 Fields required for CREATING a product
const j1m2 = [q39f3w("name").trim().isLength({
  min: 1,
  max: 200
}).withMessage("Name required (max 200 chars)"), q39f3w("description").optional().trim(), q39f3w("sku").trim().isLength({
  min: 1,
  max: 50
}).withMessage("SKU required"), q39f3w("category").isMongoId().withMessage("Invalid category ID"), q39f3w("brand").optional().trim().isLength({
  max: 100
}), q39f3w("basePrice").isFloat({
  min: 0
}).withMessage("Base price must be >= 0"), q39f3w("wholesalePrice").optional().isFloat({
  min: 0
}), q39f3w("supplier").isMongoId().withMessage("Invalid supplier ID"), q39f3w("tags").optional().isArray().withMessage("Tags must be an array"), q39f3w("isActive").optional().isBoolean()];

// 🔹 Fields allowed for UPDATING a product (all optional)
const zq3l9 = [q39f3w("name").optional().trim().isLength({
  min: 1,
  max: 200
}).withMessage("Name must be 1-200 chars"), q39f3w("description").optional().trim(), q39f3w("category").optional().isMongoId().withMessage("Invalid category ID"), q39f3w("brand").optional().trim().isLength({
  max: 100
}), q39f3w("basePrice").optional().isFloat({
  min: 0
}).withMessage("Base price must be >= 0"), q39f3w("wholesalePrice").optional().isFloat({
  min: 0
}), q39f3w("supplier").optional().isMongoId().withMessage("Invalid supplier ID"), q39f3w("tags").optional().isArray().withMessage("Tags must be an array"), q39f3w("isActive").optional().isBoolean()];

// 🔹 Variant validation for ARRAY of variants (used in createProduct)
const nz598 = [q39f3w("variants").optional().isArray().withMessage("Variants must be an array"), q39f3w("variants.*.variantId").trim().notEmpty().withMessage("Variant ID required"), q39f3w("variants.*.attributes").isObject().withMessage("Attributes must be an object"), q39f3w("variants.*.price").isFloat({
  min: 0
}).withMessage("Variant price >= 0"), q39f3w("variants.*.stock").isInt({
  min: 0
}).withMessage("Stock >= 0"), q39f3w("variants.*.lowStockThreshold").optional().isInt({
  min: 0
}), q39f3w("variants.*.skuSuffix").optional().trim(), q39f3w("variants.*.barcode").optional().trim()];

// 🔹 Variant validation for SINGLE variant object (used in addVariant)
const e3jzcy = [q39f3w("variant").isObject().withMessage("Variant must be an object"), q39f3w("variant.variantId").trim().notEmpty().withMessage("Variant ID required"), q39f3w("variant.attributes").isObject().withMessage("Attributes must be an object"), q39f3w("variant.price").isFloat({
  min: 0
}).withMessage("Variant price >= 0"), q39f3w("variant.stock").isInt({
  min: 0
}).withMessage("Stock >= 0"), q39f3w("variant.lowStockThreshold").optional().isInt({
  min: 0
}), q39f3w("variant.skuSuffix").optional().trim(), q39f3w("variant.barcode").optional().trim()];

// ✅ EXPORTS
exports.listProductsValidation = [];
exports.getProductValidation = [...w8kl2];

// CREATE: Uses array validation for variants
exports.createProductValidation = [...j1m2, ...nz598];

// UPDATE: Uses update fields (no variants via PUT - use variant endpoints instead)
exports.updateProductValidation = [...w8kl2, ...zq3l9];
exports.deleteProductValidation = [...w8kl2];
exports.activateProductValidation = [...w8kl2];

// ADD VARIANT: Uses SINGLE variant object validation
exports.addVariantValidation = [...w8kl2, ...e3jzcy];

// UPDATE VARIANT: Individual field validation
exports.updateVariantValidation = [...w8kl2, ...xc1t28, q39f3w("price").optional().isFloat({
  min: 0
}), q39f3w("stock").optional().isInt({
  min: 0
}), q39f3w("attributes").optional().isObject(), q39f3w("lowStockThreshold").optional().isInt({
  min: 0
}), q39f3w("barcode").optional().trim()];
exports.deleteVariantValidation = [...w8kl2, ...xc1t28];
exports.getStockHistoryValidation = [...w8kl2, ...xc1t28, q39f3w("page").optional().isInt({
  min: 1
}), q39f3w("limit").optional().isInt({
  min: 1,
  max: 100
})];
exports.uploadImagesValidation = [...w8kl2];
exports.deleteImageValidation = [...w8kl2, ...v07o];
exports.handleValidationErrors = (seuu6p, vd2j5, m1adz) => {
  const v446k = f3j73p(seuu6p);
  if (v446k) return vd2j5.status(400).json({
    success: false,
    message: "Validation failed",
    errors: v446k
  });
  m1adz();
};