const vm5ql = require("../models/MahoganyToyota");
const {
  applyTenantScope: f0rg0
} = require("../utils/kyotoScope")
const j0b50 = [{
  name: "Shipping",
  color: "#FF6A00"
}, {
  name: "Marketing",
  color: "#7C3AED"
}, {
  name: "Utilities",
  color: "#D97706"
}, {
  name: "Salaries",
  color: "#16A34A"
}, {
  name: "Supplies",
  color: "#2563EB"
}, {
  name: "Software",
  color: "#0891B2"
}, {
  name: "Other",
  color: "#9CA3AF"
}];

// Agar koi category nahi hai toh defaults seed kar do
const t8ff = async hcmko0 => {
  const h8186y = await vm5ql.countDocuments({
    tenantId: hcmko0 || null
  });
  if (h8186y === 0) {
    await vm5ql.insertMany(j0b50.map(kv5jdl => ({
      ...kv5jdl,
      tenantId: hcmko0 || null
    })));
  }
};

// GET /api/expense-categories
exports.listCategories = async (luum, u9ycox) => {
  try {
    const x58w = {};
    f0rg0(luum, x58w);
    await t8ff(luum.tenantId || null);
    const c5fb3 = await vm5ql.find(x58w).sort({
      name: 1
    }).lean();
    u9ycox.json({
      success: true,
      data: {
        categories: c5fb3
      }
    });
  } catch (mjk63) {
    console.error("List categories error:", mjk63);
    u9ycox.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// POST /api/expense-categories
exports.createCategory = async (g4rl1, r26698) => {
  try {
    const {
      name: r1ft7i,
      color: f9vs
    } = g4rl1.body;
    const i0r5q = await vm5ql.findOne({
      name: {
        $regex: new RegExp(`^${r1ft7i}$`, "i")
      },
      tenantId: g4rl1.tenantId || null
    });
    if (i0r5q) {
      return r26698.status(409).json({
        success: false,
        message: "Category with this name already exists"
      });
    }
    const x071b5 = await vm5ql.create({
      name: r1ft7i,
      color: f9vs || "#9CA3AF",
      tenantId: g4rl1.tenantId || null,
      createdBy: g4rl1.user.userId
    });
    r26698.status(201).json({
      success: true,
      message: "Category created successfully",
      data: x071b5
    });
  } catch (s7px9) {
    console.error("Create category error:", s7px9);
    r26698.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// PUT /api/expense-categories/:id
exports.updateCategory = async (r22c6x, z809o) => {
  try {
    const xylx = {
      _id: r22c6x.params.id
    };
    f0rg0(r22c6x, xylx);
    const itap = await vm5ql.findOne(xylx);
    if (!itap) {
      return z809o.status(404).json({
        success: false,
        message: "Category not found"
      });
    }
    if (r22c6x.body.name) itap.name = r22c6x.body.name;
    if (r22c6x.body.color) itap.color = r22c6x.body.color;
    if (r22c6x.body.isActive !== undefined) itap.isActive = r22c6x.body.isActive;
    await itap.save();
    z809o.json({
      success: true,
      message: "Category updated successfully",
      data: itap
    });
  } catch (dql762) {
    console.error("Update category error:", dql762);
    z809o.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// DELETE /api/expense-categories/:id
exports.deleteCategory = async (xdrj6, mixn) => {
  try {
    const op57 = {
      _id: xdrj6.params.id
    };
    f0rg0(xdrj6, op57);
    const lcl4 = await vm5ql.findOne(op57);
    if (!lcl4) {
      return mixn.status(404).json({
        success: false,
        message: "Category not found"
      });
    }
    await lcl4.deleteOne();
    mixn.json({
      success: true,
      message: "Category deleted successfully",
      data: {
        id: xdrj6.params.id
      }
    });
  } catch (klr1x) {
    console.error("Delete category error:", klr1x);
    mixn.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};