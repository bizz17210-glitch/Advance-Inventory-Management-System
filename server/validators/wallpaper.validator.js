// CRUD_Project/server/validators/courier.validator.js
const {
  body: y460jy,
  param: nawy,
  query: gr71a9,
  validationResult: a9vg
} = require("express-validator");
const m0ombq = p84l => {
  const gg9f8f = a9vg(p84l);
  if (!gg9f8f.isEmpty()) {
    return gg9f8f.array().map(jf898 => ({
      field: jf898.path,
      message: jf898.msg
    }));
  }
  return null;
};
const ze18 = [nawy("id").isMongoId().withMessage("Invalid courier ID")];

// 🔹 Shared courier fields
// 🔹 Shared courier fields (UPDATED)
const w38o3 = [y460jy("name").trim().isLength({
  min: 2,
  max: 100
}).withMessage("Courier name required (2-100 chars)"), y460jy("contactPerson").trim().isLength({
  min: 2,
  max: 100
}).withMessage("Contact person required"), y460jy("email").trim().normalizeEmail().isEmail().withMessage("Valid email required"), y460jy("phone").trim().matches(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/).withMessage("Valid phone required"), y460jy("serviceRegions").optional().isArray().withMessage("Service regions must be an array"), y460jy("serviceRegions.*").optional().trim().isLength({
  min: 2,
  max: 100
}),
// 🔐 API Integration Fields - ONLY validate if non-empty (FIXED)
y460jy("apiIntegrationEnabled").optional().isBoolean(),
// ✅ FIXED: Only validate apiKey/apiSecret if they are provided AND non-empty
y460jy("apiKey").optional({
  nullable: true,
  checkFalsy: true
}) // Skip if null/undefined/empty
.if((v3q5z, {
  req: x2elxs
}) => x2elxs.body.apiIntegrationEnabled && v3q5z?.trim().length > 0) // Only check if enabled AND has value
.trim().isLength({
  min: 5,
  max: 200
}).withMessage("API Key must be 5-200 characters when provided"), y460jy("apiSecret").optional({
  nullable: true,
  checkFalsy: true
}).if((s90pkc, {
  req: b717
}) => b717.body.apiIntegrationEnabled && s90pkc?.trim().length > 0).trim().isLength({
  min: 5,
  max: 500
}).withMessage("API Secret must be 5-500 characters when provided"), y460jy("performanceMetrics.averageDeliveryTime").optional().isFloat({
  min: 0
}), y460jy("performanceMetrics.cancellationRate").optional().isFloat({
  min: 0,
  max: 100
})];

// GET /api/couriers
exports.listCouriersValidation = [gr71a9("page").optional().isInt({
  min: 1
}), gr71a9("limit").optional().isInt({
  min: 1,
  max: 50
}), gr71a9("region").optional().trim().isLength({
  min: 2
}), gr71a9("apiEnabled").optional().isBoolean()];

// GET /api/couriers/:id
exports.getCourierValidation = [...ze18];

// POST /api/couriers
exports.createCourierValidation = [...w38o3];

// PUT /api/couriers/:id
exports.updateCourierValidation = [...ze18, y460jy("name").optional().trim().isLength({
  min: 2,
  max: 100
}), y460jy("contactPerson").optional().trim().isLength({
  min: 2,
  max: 100
}), y460jy("email").optional().trim().normalizeEmail().isEmail(), y460jy("phone").optional().trim().matches(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/), y460jy("serviceRegions").optional().isArray(), y460jy("serviceRegions.*").optional().trim().isLength({
  min: 2,
  max: 100
}), y460jy("apiIntegrationEnabled").optional().isBoolean(), y460jy("apiKey").optional().trim().isLength({
  min: 5,
  max: 200
}), y460jy("apiSecret").optional().trim().isLength({
  min: 5,
  max: 500
}), y460jy("status").optional().isIn(["Active", "Paused", "Inactive"]).withMessage("Status must be Active, Paused, or Inactive")];

// POST /api/couriers/:id/test-connection
exports.testConnectionValidation = [...ze18];

// POST /api/couriers/:id/sync
exports.syncCourierValidation = [...ze18];

// DELETE /api/couriers/:id
exports.deleteCourierValidation = [...ze18, y460jy("reason").optional().trim().isLength({
  max: 500
})];

// ✅ Export error handler
exports.handleValidationErrors = (semy6, c7dq0, c8od35) => {
  const i2iy79 = m0ombq(semy6);
  if (i2iy79) return c7dq0.status(400).json({
    success: false,
    message: "Validation failed",
    errors: i2iy79
  });
  c8od35();
};

// ADD karo — file ke end mein:
exports.assignShipmentValidation = [nawy("id").isMongoId().withMessage("Invalid courier ID"), y460jy("orderId").isMongoId().withMessage("Valid Order ID required"), y460jy("serviceType").optional().isIn(["Standard", "Express", "Same Day"]), y460jy("codAmount").optional().isFloat({
  min: 0
}).withMessage("COD amount must be positive"), y460jy("weight").optional().isFloat({
  min: 0
}).withMessage("Weight must be positive"), y460jy("dispatchDate").optional().isISO8601().withMessage("Valid date required"), y460jy("specialInstructions").optional().trim().isLength({
  max: 500
})];