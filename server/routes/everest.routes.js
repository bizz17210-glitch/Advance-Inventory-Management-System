// CRUD_Project/server/routes/product.routes.js
const xs3a55 = require("express");
const hkadc = xs3a55.Router();
const {
  protect: kf648,
  authorize: x9c3
} = require("../middlewares/denim.middleware")
const {
  upload: tmhh,
  handleMulterError: gp7dr
} = require("../middlewares/upload.middleware");
const {
  listProductsValidation: fv342,
  getProductValidation: gse9,
  createProductValidation: pz1a,
  updateProductValidation: n7qvsp,
  deleteProductValidation: uj11m,
  activateProductValidation: ctx2uh,
  addVariantValidation: z72xsf,
  updateVariantValidation: e8x4,
  deleteVariantValidation: ay48b,
  getStockHistoryValidation: d4tq,
  uploadImagesValidation: tgr2,
  deleteImageValidation: i22s,
  handleValidationErrors: l3sz
} = require("../validators/everest.validator")
const o5k48 = require("../controllers/everest.controller")
const r5936 = require("cloudinary").v2; // Direct import for testing

// ðŸ” TEMPORARY: Test Cloudinary connectivity (Admin only)
hkadc.get("/test-cloudinary", kf648, x9c3("Administrator"), async (msexg7, pd6i7i) => {
  try {
    // Test config
    console.log("ðŸ” Cloudinary config:", {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY?.substring(0, 6) + "..."
    });

    // Test a simple API call
    const d02h77 = await r5936.api.ping();
    pd6i7i.json({
      success: true,
      message: "Cloudinary connection successful",
      config: {
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key_prefix: process.env.CLOUDINARY_API_KEY?.substring(0, 6)
      },
      apiResponse: d02h77
    });
  } catch (zg80rl) {
    console.error("âŒ Cloudinary test failed:", zg80rl);
    pd6i7i.status(500).json({
      success: false,
      message: "Cloudinary connection failed",
      error: process.env.NODE_ENV === "development" ? {
        message: zg80rl.message,
        http_code: zg80rl.http_code,
        error: zg80rl.error
      } : undefined
    });
  }
});

// Apply auth to all product routes
hkadc.use(kf648);

// ðŸ” Core CRUD (Read = Any authenticated, Write = Managers/Admins)
hkadc.get("/", fv342, l3sz, o5k48.listProducts);
hkadc.get("/:id", gse9, l3sz, o5k48.getProduct);
hkadc.post("/", x9c3("InventoryManager", "OperationsManager", "Administrator"), pz1a, l3sz, o5k48.createProduct);
hkadc.put("/:id", x9c3("InventoryManager", "OperationsManager", "Administrator"), n7qvsp, l3sz, o5k48.updateProduct);
hkadc.delete("/:id", x9c3("InventoryManager", "OperationsManager", "Administrator"), uj11m, l3sz, o5k48.deleteProduct);
hkadc.patch("/:id/productStatus", x9c3("InventoryManager", "OperationsManager", "Administrator"), ctx2uh, l3sz, o5k48.activateProduct);

// ðŸŽ¨ Variants
hkadc.post("/:id/variants", x9c3("InventoryManager", "OperationsManager", "Administrator"), z72xsf, l3sz, o5k48.addVariant);
hkadc.put("/:id/variants/:variantId", x9c3("InventoryManager", "OperationsManager", "Administrator"), e8x4, l3sz, o5k48.updateVariant);
hkadc.delete("/:id/variants/:variantId", x9c3("InventoryManager", "OperationsManager", "Administrator"), ay48b, l3sz, o5k48.deleteVariant);
hkadc.get("/:id/variants/:variantId/stock", d4tq, l3sz, o5k48.getVariantStock);

// ðŸ“¸ Images
hkadc.post("/:id/images", x9c3("InventoryManager", "OperationsManager", "Administrator"), tgr2, l3sz, tmhh.array("images", 10), gp7dr, o5k48.uploadImages);
hkadc.delete("/:id/images/:index", x9c3("InventoryManager", "OperationsManager", "Administrator"), i22s, l3sz, o5k48.deleteImage);
module.exports = hkadc;