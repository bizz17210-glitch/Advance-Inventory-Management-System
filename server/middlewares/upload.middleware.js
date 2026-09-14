// CRUD_Project/server/middlewares/upload.middleware.js
const j3ch3p = require("multer");
const m68su = require("cloudinary").v2;

// ✅ Configure Cloudinary ONCE
m68su.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// ✅ Use memory storage (buffer in RAM) for reliable Cloudinary uploads
const uyx44 = j3ch3p.memoryStorage();

// ✅ Strict file validation
const fqc9 = (s3v73, eon5, ge62) => {
  const ik61 = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
  if (ik61.includes(eon5.mimetype?.toLowerCase())) {
    ge62(null, true);
  } else {
    ge62(new Error("Only JPG, PNG, WebP, or GIF images are allowed"), false);
  }
};

// ✅ Separate filter for documents (images + PDF)
const pxdm = (ah93x, kdjl, p9prw) => {
  const v26453 = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"];
  if (v26453.includes(kdjl.mimetype?.toLowerCase())) {
    p9prw(null, true);
  } else {
    p9prw(new Error("Only JPG, PNG, WebP, or PDF files are allowed"), false);
  }
};

// ✅ Multer instance (images only — products)
exports.upload = j3ch3p({
  storage: uyx44,
  fileFilter: fqc9,
  limits: {
    fileSize: 10 * 1024 * 1024
  }
});

// ✅ Multer instance for documents (images + PDF — riders)
exports.uploadDocument = j3ch3p({
  storage: uyx44,
  fileFilter: pxdm,
  limits: {
    fileSize: 10 * 1024 * 1024
  }
});

// ✅ Error handler
exports.handleMulterError = (radgtj, sjby, cw14eb, a1yj) => {
  if (radgtj) {
    console.error("🔍 Upload error:", radgtj.message);
    return cw14eb.status(400).json({
      success: false,
      message: radgtj.message
    });
  }
  a1yj();
};

// ✅ Export cloudinary for use in controller
exports.cloudinary = m68su;