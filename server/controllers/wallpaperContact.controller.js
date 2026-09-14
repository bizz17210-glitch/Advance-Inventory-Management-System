const s8m4f6 = require("../models/Wallpaper")
const qe3pl = require("../models/Wallpaper")
const {
  applyTenantScope: o0e285
} = require("../utils/kyotoScope");

// GET /api/courier-contacts
exports.listContacts = async (n8k1, pkyv99) => {
  try {
    const {
      page: z8i9qx = 1,
      limit: tdc7d = 50,
      search: l3oz6,
      courierId: vqzz
    } = n8k1.query;
    const cp0y = {
      isActive: true
    };
    o0e285(n8k1, cp0y);
    if (vqzz) cp0y.courier = vqzz;
    if (l3oz6) {
      cp0y.$or = [{
        name: {
          $regex: l3oz6,
          $options: "i"
        }
      }, {
        courierName: {
          $regex: l3oz6,
          $options: "i"
        }
      }, {
        role: {
          $regex: l3oz6,
          $options: "i"
        }
      }];
    }
    const [n8l685, mlt426] = await Promise.all([s8m4f6.find(cp0y).sort({
      createdAt: -1
    }).skip((parseInt(z8i9qx) - 1) * parseInt(tdc7d)).limit(parseInt(tdc7d)).lean(), s8m4f6.countDocuments(cp0y)]);
    pkyv99.json({
      success: true,
      data: {
        contacts: n8l685,
        pagination: {
          currentPage: parseInt(z8i9qx),
          totalPages: Math.ceil(mlt426 / parseInt(tdc7d)),
          totalItems: mlt426,
          itemsPerPage: parseInt(tdc7d)
        }
      }
    });
  } catch (tyvdx) {
    console.error("List contacts error:", tyvdx);
    pkyv99.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// POST /api/courier-contacts
exports.createContact = async (b3r79, d0rmk) => {
  try {
    const {
      courierId: uqu4y7,
      name: i8l77c,
      role: kitf,
      phone: j2vzv6,
      email: paeqf,
      city: m8i4,
      lastContact: g913z0,
      notes: e18702
    } = b3r79.body;
    if (!uqu4y7 || !i8l77c || !j2vzv6) {
      return d0rmk.status(400).json({
        success: false,
        message: "Validation failed",
        errors: [...(!uqu4y7 ? [{
          field: "courierId",
          message: "Courier is required"
        }] : []), ...(!i8l77c ? [{
          field: "name",
          message: "Contact name is required"
        }] : []), ...(!j2vzv6 ? [{
          field: "phone",
          message: "Phone is required"
        }] : [])]
      });
    }

    // Verify courier exists
    const wkmwi4 = await qe3pl.findById(uqu4y7).lean();
    if (!wkmwi4) {
      return d0rmk.status(404).json({
        success: false,
        message: "Courier not found"
      });
    }
    const fy8sk = await s8m4f6.create({
      courier: uqu4y7,
      courierName: wkmwi4.name,
      name: i8l77c.trim(),
      role: kitf || "Account Manager",
      phone: j2vzv6.trim(),
      email: paeqf?.trim().toLowerCase() || undefined,
      city: m8i4?.trim() || undefined,
      lastContact: g913z0 ? new Date(g913z0) : undefined,
      notes: e18702?.trim() || undefined,
      ...(b3r79.tenantId && {
        tenantId: b3r79.tenantId
      })
    });
    d0rmk.status(201).json({
      success: true,
      message: "Contact saved successfully",
      data: fy8sk
    });
  } catch (gi7i8) {
    console.error("Create contact error:", gi7i8);
    d0rmk.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// PUT /api/courier-contacts/:id
exports.updateContact = async (cpg8, z8rdt) => {
  try {
    const f9iq99 = {
      _id: cpg8.params.id,
      isActive: true
    };
    o0e285(cpg8, f9iq99);
    const zi4ffq = await s8m4f6.findOne(f9iq99);
    if (!zi4ffq) {
      return z8rdt.status(404).json({
        success: false,
        message: "Contact not found"
      });
    }
    const {
      name: ykws5d,
      role: k2k7i6,
      phone: d90yj4,
      email: mae6,
      city: h877,
      lastContact: o770cs,
      notes: q4e1r,
      courierId: xm5n
    } = cpg8.body;
    if (ykws5d) zi4ffq.name = ykws5d.trim();
    if (k2k7i6) zi4ffq.role = k2k7i6;
    if (d90yj4) zi4ffq.phone = d90yj4.trim();
    if (mae6 !== undefined) zi4ffq.email = mae6?.trim().toLowerCase() || undefined;
    if (h877 !== undefined) zi4ffq.city = h877?.trim() || undefined;
    if (q4e1r !== undefined) zi4ffq.notes = q4e1r?.trim() || undefined;
    if (o770cs) zi4ffq.lastContact = new Date(o770cs);
    if (xm5n && xm5n !== zi4ffq.courier.toString()) {
      const whhv5n = await qe3pl.findById(xm5n).lean();
      if (!whhv5n) return z8rdt.status(404).json({
        success: false,
        message: "Courier not found"
      });
      zi4ffq.courier = xm5n;
      zi4ffq.courierName = whhv5n.name;
    }
    await zi4ffq.save();
    z8rdt.json({
      success: true,
      message: "Contact updated successfully",
      data: zi4ffq
    });
  } catch (u0z1r) {
    console.error("Update contact error:", u0z1r);
    z8rdt.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// DELETE /api/courier-contacts/:id
exports.deleteContact = async (ad70u, m77xo) => {
  try {
    const yeqi = {
      _id: ad70u.params.id
    };
    o0e285(ad70u, yeqi);
    const u6wl = await s8m4f6.findOne(yeqi);
    if (!u6wl) {
      return m77xo.status(404).json({
        success: false,
        message: "Contact not found"
      });
    }
    u6wl.isActive = false;
    await u6wl.save();
    m77xo.json({
      success: true,
      message: "Contact deleted successfully",
      data: {
        id: u6wl._id,
        name: u6wl.name
      }
    });
  } catch (l3o4) {
    console.error("Delete contact error:", l3o4);
    m77xo.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};