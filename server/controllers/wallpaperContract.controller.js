const n7d041 = require("../models/Wallpaper")
const ga6r = require("../models/Wallpaper")
const {
  applyTenantScope: huw7w
} = require("../utils/kyotoScope");

// GET /api/courier-contracts
exports.listContracts = async (xhon2s, n032i) => {
  try {
    const {
      page: ubf0 = 1,
      limit: f4sr = 50,
      search: zn4uwp,
      courierId: k96na,
      status: dnkw
    } = xhon2s.query;
    const bvp59 = {
      isActive: true
    };
    huw7w(xhon2s, bvp59);
    if (k96na) bvp59.courier = k96na;

    // status filter: 'active' | 'expired'
    const a28yi = new Date();
    if (dnkw === "expired") bvp59.endDate = {
      $lt: a28yi
    };
    if (dnkw === "active") bvp59.endDate = {
      $gte: a28yi
    };
    if (zn4uwp) {
      const t24th = {
        $regex: zn4uwp,
        $options: "i"
      };
      bvp59.$or = [{
        courierName: t24th
      }, {
        ref: t24th
      }];
    }
    const [hajbt1, m6yxz] = await Promise.all([n7d041.find(bvp59).sort({
      createdAt: -1
    }).skip((parseInt(ubf0) - 1) * parseInt(f4sr)).limit(parseInt(f4sr)).lean(), n7d041.countDocuments(bvp59)]);
    n032i.json({
      success: true,
      data: {
        contracts: hajbt1,
        pagination: {
          currentPage: parseInt(ubf0),
          totalPages: Math.ceil(m6yxz / parseInt(f4sr)),
          totalItems: m6yxz,
          itemsPerPage: parseInt(f4sr)
        }
      }
    });
  } catch (xgcv) {
    console.error("List contracts error:", xgcv);
    n032i.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// GET /api/courier-contracts/:id
exports.getContract = async (e07dy7, eyhqmj) => {
  try {
    const o121j = {
      _id: e07dy7.params.id,
      isActive: true
    };
    huw7w(e07dy7, o121j);
    const w52w = await n7d041.findOne(o121j).lean();
    if (!w52w) return eyhqmj.status(404).json({
      success: false,
      message: "Contract not found"
    });
    eyhqmj.json({
      success: true,
      data: w52w
    });
  } catch (m1pzp8) {
    eyhqmj.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// POST /api/courier-contracts
exports.createContract = async (uny8i, s129e) => {
  try {
    const {
      courierId: ys0yu,
      ref: peql,
      startDate: gudd4,
      endDate: q31r,
      sla: du441u,
      penaltyPerDay: pfghqy,
      codSettleDays: o4w04,
      autoRenew: hk33pt,
      renewalNoticeDays: y9cm38,
      notes: jqb49
    } = uny8i.body;

    // Validation
    const eif3 = [];
    if (!ys0yu) eif3.push({
      field: "courierId",
      message: "Courier is required"
    });
    if (!peql?.trim()) eif3.push({
      field: "ref",
      message: "Contract reference is required"
    });
    if (!gudd4) eif3.push({
      field: "startDate",
      message: "Start date is required"
    });
    if (!q31r) eif3.push({
      field: "endDate",
      message: "End date is required"
    });
    if (eif3.length) return s129e.status(400).json({
      success: false,
      message: "Validation failed",
      errors: eif3
    });
    const shw3 = await ga6r.findById(ys0yu).lean();
    if (!shw3) return s129e.status(404).json({
      success: false,
      message: "Courier not found"
    });
    const xrwb = await n7d041.create({
      courier: ys0yu,
      courierName: shw3.name,
      ref: peql.trim(),
      startDate: new Date(gudd4),
      endDate: new Date(q31r),
      sla: du441u ?? 3,
      penaltyPerDay: pfghqy ?? 0,
      codSettleDays: o4w04 ?? 7,
      autoRenew: hk33pt === true || hk33pt === "Yes",
      renewalNoticeDays: y9cm38 ?? 30,
      notes: jqb49?.trim() || undefined,
      ...(uny8i.tenantId && {
        tenantId: uny8i.tenantId
      })
    });
    s129e.status(201).json({
      success: true,
      message: "Contract saved successfully",
      data: xrwb
    });
  } catch (t0q4ts) {
    if (t0q4ts.code === 11000) {
      return s129e.status(409).json({
        success: false,
        message: "Contract reference already exists"
      });
    }
    console.error("Create contract error:", t0q4ts);
    s129e.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// PUT /api/courier-contracts/:id
exports.updateContract = async (qt4se4, nt5x4f) => {
  try {
    const kcdt = {
      _id: qt4se4.params.id,
      isActive: true
    };
    huw7w(qt4se4, kcdt);
    const euf8 = await n7d041.findOne(kcdt);
    if (!euf8) return nt5x4f.status(404).json({
      success: false,
      message: "Contract not found"
    });
    const {
      courierId: jz36k,
      ref: ni78zh,
      startDate: s571m,
      endDate: zmnmz,
      sla: c3ug9,
      penaltyPerDay: zi4qv,
      codSettleDays: g7k8,
      autoRenew: hu2k,
      renewalNoticeDays: hl5h3,
      notes: e5ajw3
    } = qt4se4.body;
    if (ni78zh) euf8.ref = ni78zh.trim();
    if (s571m) euf8.startDate = new Date(s571m);
    if (zmnmz) euf8.endDate = new Date(zmnmz);
    if (c3ug9 != null) euf8.sla = c3ug9;
    if (zi4qv != null) euf8.penaltyPerDay = zi4qv;
    if (g7k8 != null) euf8.codSettleDays = g7k8;
    if (hu2k != null) euf8.autoRenew = hu2k === true || hu2k === "Yes";
    if (hl5h3 != null) euf8.renewalNoticeDays = hl5h3;
    if (e5ajw3 !== undefined) euf8.notes = e5ajw3?.trim() || undefined;
    if (jz36k && jz36k !== euf8.courier.toString()) {
      const n6378y = await ga6r.findById(jz36k).lean();
      if (!n6378y) return nt5x4f.status(404).json({
        success: false,
        message: "Courier not found"
      });
      euf8.courier = jz36k;
      euf8.courierName = n6378y.name;
    }
    await euf8.save();
    nt5x4f.json({
      success: true,
      message: "Contract updated successfully",
      data: euf8
    });
  } catch (syh3zu) {
    console.error("Update contract error:", syh3zu);
    nt5x4f.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// DELETE /api/courier-contracts/:id  (soft delete)
exports.deleteContract = async (txm4, u476g) => {
  try {
    const wqeh = {
      _id: txm4.params.id
    };
    huw7w(txm4, wqeh);
    const v7r4b = await n7d041.findOne(wqeh);
    if (!v7r4b) return u476g.status(404).json({
      success: false,
      message: "Contract not found"
    });
    v7r4b.isActive = false;
    await v7r4b.save();
    u476g.json({
      success: true,
      message: "Contract deleted successfully",
      data: {
        id: v7r4b._id,
        ref: v7r4b.ref
      }
    });
  } catch (hl4e) {
    u476g.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};