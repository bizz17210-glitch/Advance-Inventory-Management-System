const v674 = require("mongoose");
const nn53 = require("../models/Kyoto")
const p8986o = require("../models/Marble")
const {
  registerSubdomainOnVercel: y9q4
} = require("../services/vercel.service");
const xpuln = ["admin", "www", "api", "mail", "ftp", "support", "billing", "app", "portal"];

// â”€â”€ helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const hw6q = k71ajp => k71ajp.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50);

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// POST /api/admin/tenants  â€” provision a new client
// Auth: Super-admin only
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
exports.provisionTenant = async (l18ob3, zrxi) => {
  let yxmf9 = null;
  let y8766 = null;
  let lrmax = null;
  try {
    const {
      name: soj1as,
      adminEmail: jvmpz4,
      plan: xbls38 = "Growth",
      modules: ije2 = {},
      slug: n8y8j6,
      username: k7f5c3,
      password: xboj,
      firstName: bv5j,
      lastName: ez9ai5,
      phone: gk97
    } = l18ob3.body;

    // â”€â”€ 1. Validate required fields â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    if (!soj1as || !jvmpz4) {
      return zrxi.status(400).json({
        success: false,
        message: "name and adminEmail are required."
      });
    }

    // â”€â”€ 2. Build + validate slug â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const cyhh6c = n8y8j6 ? n8y8j6.toLowerCase().trim() : hw6q(soj1as);
    if (!cyhh6c || !/^[a-z0-9][a-z0-9-]{2,49}$/.test(cyhh6c)) {
      return zrxi.status(400).json({
        success: false,
        message: "Invalid slug. Use only lowercase letters, numbers, and hyphens (3-50 chars)."
      });
    }
    if (xpuln.includes(cyhh6c)) {
      return zrxi.status(409).json({
        success: false,
        message: `"${cyhh6c}" is a reserved subdomain.`
      });
    }

    // â”€â”€ 3. Check uniqueness â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const [ab2a3, ahfkco] = await Promise.all([nn53.findOne({
      slug: cyhh6c
    }).lean(), p8986o.findOne({
      email: jvmpz4.toLowerCase().trim()
    }).lean()]);
    if (ab2a3) {
      return zrxi.status(409).json({
        success: false,
        message: `Subdomain "${cyhh6c}.thebizzops.com" is already taken.`
      });
    }
    if (ahfkco) {
      return zrxi.status(409).json({
        success: false,
        message: `A user with email "${jvmpz4}" already exists.`
      });
    }

    // â”€â”€ 4. Try with transaction, fall back to without â”€â”€â”€â”€â”€â”€â”€
    let ns853 = true;
    try {
      yxmf9 = await v674.startSession();
      yxmf9.startTransaction();
    } catch (ufxz2) {
      console.warn("âš ï¸ Could not start session, running without transaction:", ufxz2.message);
      ns853 = false;
      yxmf9 = null;
    }

    // â”€â”€ 5. Create Tenant â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const yv7k9 = {
      name: soj1as,
      slug: cyhh6c,
      adminEmail: jvmpz4.toLowerCase().trim(),
      plan: xbls38,
      status: "active",
      modules: {
        orders: ije2.orders ?? true,
        customers: ije2.customers ?? true,
        finance: ije2.finance ?? true,
        staff: ije2.staff ?? true,
        couriers: ije2.couriers ?? false,
        shopify: ije2.shopify ?? false,
        analytics: ije2.analytics ?? false
      },
      provisionedBy: l18ob3.superAdmin?._id || null
    };
    if (ns853) {
      const [hzot31] = await nn53.create([yv7k9], {
        session: yxmf9
      });
      y8766 = hzot31;
    } else {
      y8766 = await nn53.create(yv7k9);
    }

    // â”€â”€ 6. Seed admin user â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const gc2dn7 = xboj || `Nexus@${cyhh6c.charAt(0).toUpperCase()}${cyhh6c.slice(1, 6)}2024!`;
    const k90pu = soj1as.trim().split(" ");
    const uzgtuq = {
      username: k7f5c3 || `admin_${cyhh6c}`.slice(0, 30),
      email: jvmpz4.toLowerCase().trim(),
      passwordHash: gc2dn7,
      // pre-save hook hashes it
      firstName: bv5j || k90pu[0] || "Admin",
      lastName: ez9ai5 || k90pu[1] || cyhh6c,
      phone: gk97 || "+920000000000",
      role: "Administrator",
      status: "Active",
      tenantId: y8766._id
    };
    if (ns853) {
      const [m86z7] = await p8986o.create([uzgtuq], {
        session: yxmf9
      });
      lrmax = m86z7;
    } else {
      lrmax = await p8986o.create(uzgtuq);
    }

    // â”€â”€ 7. Commit if using transaction â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    if (ns853 && yxmf9) {
      await yxmf9.commitTransaction();
    }

    // â”€â”€ 8. clientUrl is auto-generated by Tenant pre-save hook â”€â”€
    // â”€â”€ 8. clientUrl is auto-generated by Tenant pre-save hook â”€â”€
    const u2d02 = await nn53.findById(y8766._id).lean();

    // â”€â”€ 8.5. Register subdomain on Vercel (non-blocking) â”€â”€â”€â”€
    const g9lm92 = await y9q4(u2d02.slug);
    if (!g9lm92.success) {
      console.warn(`âš ï¸ Vercel domain registration failed for "${u2d02.slug}":`, g9lm92.error);
    } else {
      console.log(`âœ… Vercel domain registered: ${u2d02.slug}.thebizzops.com`);
    }
    return zrxi.status(201).json({
      success: true,
      message: `Tenant "${soj1as}" provisioned successfully.`,
      data: {
        tenant: {
          id: u2d02._id,
          name: u2d02.name,
          slug: u2d02.slug,
          subdomain: u2d02.subdomain,
          plan: u2d02.plan,
          status: u2d02.status,
          modules: u2d02.modules,
          clientUrl: u2d02.clientUrl,
          createdAt: u2d02.createdAt
        },
        adminCredentials: {
          email: jvmpz4,
          username: lrmax.username,
          password: gc2dn7,
          loginUrl: u2d02.clientUrl,
          note: "Share these with the client. Ask them to change password on first login."
        }
      }
    });
  } catch (mk1a0) {
    if (yxmf9) {
      try {
        await yxmf9.abortTransaction();
      } catch (g7m7f) {}
    }
    if (y8766 && !lrmax) {
      try {
        await nn53.findByIdAndDelete(y8766._id);
      } catch (e9q3i) {}
    }
    console.error("provisionTenant error:", mk1a0);
    if (mk1a0.code === 11000) {
      const sv3s = Object.keys(mk1a0.keyPattern || {})[0];
      return zrxi.status(409).json({
        success: false,
        message: `Duplicate entry: ${sv3s} already exists.`
      });
    }
    return zrxi.status(500).json({
      success: false,
      message: "Failed to provision tenant.",
      ...(process.env.NODE_ENV === "development" && {
        error: mk1a0.message
      })
    });
  } finally {
    if (yxmf9) {
      try {
        yxmf9.endSession();
      } catch (hl5wrk) {}
    }
  }
};

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// GET /api/admin/tenants  â€” list all tenants
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
exports.listTenants = async (ug6amk, dmrr73) => {
  try {
    const {
      page: aa36ox = 1,
      limit: dng3 = 20,
      status: o16i2,
      plan: v636h0,
      search: j60b
    } = ug6amk.query;
    const rfj1a = {};
    if (o16i2) rfj1a.status = o16i2;
    if (v636h0) rfj1a.plan = v636h0;
    if (j60b) rfj1a.$or = [{
      name: {
        $regex: j60b,
        $options: "i"
      }
    }, {
      slug: {
        $regex: j60b,
        $options: "i"
      }
    }, {
      adminEmail: {
        $regex: j60b,
        $options: "i"
      }
    }];
    const k6or4 = (Number(aa36ox) - 1) * Number(dng3);
    const g8s76 = await nn53.countDocuments(rfj1a);
    const o586bv = await nn53.find(rfj1a).sort({
      createdAt: -1
    }).skip(k6or4).limit(Number(dng3)).populate("provisionedBy", "firstName lastName email").lean();
    dmrr73.json({
      success: true,
      data: {
        items: o586bv,
        pagination: {
          currentPage: Number(aa36ox),
          totalPages: Math.ceil(g8s76 / Number(dng3)),
          totalItems: g8s76,
          itemsPerPage: Number(dng3),
          hasNext: Number(aa36ox) < Math.ceil(g8s76 / Number(dng3)),
          hasPrev: Number(aa36ox) > 1
        }
      }
    });
  } catch (z0mftd) {
    console.error("listTenants error:", z0mftd.message);
    dmrr73.status(500).json({
      success: false,
      message: "Failed to fetch tenants."
    });
  }
};

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// GET /api/admin/tenants/:id  â€” single tenant detail
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
exports.getTenant = async (s72ex, n772l) => {
  try {
    const whz25u = await nn53.findById(s72ex.params.id).populate("provisionedBy", "firstName lastName email").lean();
    if (!whz25u) {
      return n772l.status(404).json({
        success: false,
        message: "Tenant not found."
      });
    }
    n772l.json({
      success: true,
      data: whz25u
    });
  } catch (xox0) {
    console.error("getTenant error:", xox0.message);
    n772l.status(500).json({
      success: false,
      message: "Failed to fetch tenant."
    });
  }
};

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// GET /api/admin/tenants/by-slug/:slug  â€” public, for login page
// Auth: None
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
exports.getTenantBySlug = async (w4ie, bgu22y) => {
  try {
    const l403v = w4ie.params.slug.toLowerCase().trim();
    const g4c0wr = await nn53.findOne({
      slug: l403v,
      status: "active"
    }).select("name slug plan status clientUrl").lean();
    if (!g4c0wr) {
      return bgu22y.status(404).json({
        success: false,
        message: "Tenant not found or inactive."
      });
    }
    bgu22y.json({
      success: true,
      data: g4c0wr
    });
  } catch (ji1h) {
    console.error("getTenantBySlug error:", ji1h.message);
    bgu22y.status(500).json({
      success: false,
      message: "Failed to fetch tenant."
    });
  }
};

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// PATCH /api/admin/tenants/:id/status  â€” suspend / activate
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
exports.updateTenantStatus = async (frek07, ew04) => {
  try {
    const {
      status: intd0
    } = frek07.body;
    if (!["active", "suspended", "pending", "deleted"].includes(intd0)) {
      return ew04.status(400).json({
        success: false,
        message: "Status must be one of: active, suspended, pending, deleted"
      });
    }
    const k6ctt4 = await nn53.findByIdAndUpdate(frek07.params.id, {
      status: intd0
    }, {
      new: true,
      runValidators: true
    }).lean();
    if (!k6ctt4) {
      return ew04.status(404).json({
        success: false,
        message: "Tenant not found."
      });
    }
    ew04.json({
      success: true,
      message: `Tenant "${k6ctt4.name}" status updated to ${intd0}.`,
      data: {
        id: k6ctt4._id,
        slug: k6ctt4.slug,
        status: k6ctt4.status,
        clientUrl: k6ctt4.clientUrl
      }
    });
  } catch (d2qst) {
    console.error("updateTenantStatus error:", d2qst.message);
    ew04.status(500).json({
      success: false,
      message: "Failed to update tenant status."
    });
  }
};

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// DELETE /api/admin/tenants/:id  â€” hard delete (testing only)
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
exports.deleteTenant = async (tp2u02, xw84) => {
  const t5e2 = await v674.startSession();
  t5e2.startTransaction();
  try {
    const h505l = await nn53.findById(tp2u02.params.id).session(t5e2);
    if (!h505l) {
      await t5e2.abortTransaction();
      return xw84.status(404).json({
        success: false,
        message: "Tenant not found."
      });
    }
    await p8986o.deleteMany({
      tenantId: h505l._id
    }).session(t5e2);
    await nn53.findByIdAndDelete(h505l._id).session(t5e2);
    await t5e2.commitTransaction();
    xw84.json({
      success: true,
      message: `Tenant "${h505l.name}" and its admin user deleted.`,
      data: {
        id: h505l._id,
        slug: h505l.slug
      }
    });
  } catch (qqzu) {
    await t5e2.abortTransaction();
    console.error("deleteTenant error:", qqzu.message);
    xw84.status(500).json({
      success: false,
      message: "Failed to delete tenant."
    });
  } finally {
    t5e2.endSession();
  }
};