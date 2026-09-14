// CRUD_Project/server/controllers/order.controller.js
const logr = require("../models/Sofa")
const ke4sya = require("../models/Everest")
const deexh = require("../models/FerrariLog")
const t1ts = require("../models/AuditLog");
const r7577k = require("mongoose");
const {
  applyTenantScope: ohj89,
  withTenant: rmij
} = require("../utils/kyotoScope")

// ðŸ” Helper: Log order actions
const a1tg2w = async (w417v, txq0, aaiho, o9rs, n2987n, x99m61 = "", ku2a6a = "", sv9h5 = "") => {
  try {
    await t1ts.create({
      userId: w417v,
      action: txq0,
      collectionName: "orders",
      documentId: aaiho,
      oldValue: o9rs,
      newValue: n2987n,
      ipAddress: x99m61,
      userAgent: ku2a6a,
      ...(sv9h5 && {
        reason: sv9h5
      })
    });
  } catch (s8j7) {
    console.warn("âš ï¸ Audit log failed:", s8j7.message);
  }
};

// ðŸ” Stock Helpers (SOW 6.3)
const c9j27 = async (bir3aq, yuitcj, lkuhl, k2pna = "Order item deduction") => {
  for (const u35pz of bir3aq) {
    const cmo4i = await ke4sya.findById(u35pz.productId);
    if (!cmo4i) throw new Error(`Product ${u35pz.productId} not found`);
    const wiwl = cmo4i.variants.find(swk3v9 => swk3v9.variantId === u35pz.variantId);
    if (!wiwl || wiwl.stock < u35pz.quantity) {
      throw new Error(`Insufficient stock for ${cmo4i.name} (${u35pz.variantId}). Available: ${wiwl.stock}, Required: ${u35pz.quantity}`);
    }
    wiwl.stock -= u35pz.quantity;
    await cmo4i.save();
    await deexh.create({
      productId: u35pz.productId,
      variantId: u35pz.variantId,
      changeType: "Outbound",
      quantityChange: -u35pz.quantity,
      newStockLevel: wiwl.stock,
      reason: k2pna,
      relatedEntityId: lkuhl,
      relatedEntityType: "Order",
      recordedBy: yuitcj
    });
  }
};
const dn1y = async (r613, z6d5, g9pe, k5o0da = "Item restored/cancelled") => {
  for (const yj43 of r613) {
    const ar6p = await ke4sya.findById(yj43.productId);
    if (!ar6p) continue;
    const e51e = ar6p.variants.find(ge7w57 => ge7w57.variantId === yj43.variantId);
    if (!e51e) continue;
    e51e.stock += yj43.quantity;
    await ar6p.save();
    await deexh.create({
      productId: yj43.productId,
      variantId: yj43.variantId,
      changeType: "Adjustment",
      quantityChange: yj43.quantity,
      newStockLevel: e51e.stock,
      reason: k5o0da,
      relatedEntityId: g9pe,
      relatedEntityType: "Order",
      recordedBy: z6d5
    });
  }
};

// ðŸ” Recalculate totals
const yzvl6z = bypo3q => {
  bypo3q.subtotal = bypo3q.items.reduce((tg1gs0, d5zub) => tg1gs0 + d5zub.quantity * d5zub.unitPrice, 0);
  bypo3q.totalAmount = bypo3q.subtotal + (bypo3q.shippingCost || 0) - (bypo3q.discount || 0);
};

// ============================================================================
// GET /api/orders - List orders
// ============================================================================
exports.listOrders = async (vmc6eo, c1qw) => {
  try {
    const {
      page: f107d4 = 1,
      limit: c0pc5 = 20,
      status: ru6qd,
      paymentStatus: kxf3,
      source: x6465,
      dateFrom: z8d8,
      dateTo: by28k
    } = vmc6eo.query;
    const tb7b6 = {};
    ohj89(vmc6eo, tb7b6);
    if (ru6qd) tb7b6.orderStatus = ru6qd;
    if (kxf3) tb7b6.paymentStatus = kxf3;
    if (x6465) tb7b6.source = x6465;
    if (z8d8 || by28k) {
      tb7b6.createdAt = {};
      if (z8d8) tb7b6.createdAt.$gte = new Date(z8d8);
      if (by28k) tb7b6.createdAt.$lte = new Date(by28k);
    }
    const wl98 = await logr.find(tb7b6).populate("customer", "fullName email").sort({
      createdAt: -1
    }).limit(parseInt(c0pc5)).skip((parseInt(f107d4) - 1) * parseInt(c0pc5)).lean();
    const xej0k = await logr.countDocuments(tb7b6);
    c1qw.json({
      success: true,
      data: {
        orders: wl98,
        pagination: {
          currentPage: parseInt(f107d4),
          totalPages: Math.ceil(xej0k / c0pc5),
          totalItems: xej0k,
          itemsPerPage: parseInt(c0pc5),
          hasNext: parseInt(f107d4) * parseInt(c0pc5) < xej0k,
          hasPrev: parseInt(f107d4) > 1
        }
      }
    });
  } catch (nt8h) {
    console.error("List orders error:", nt8h);
    c1qw.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// ============================================================================
// GET /api/orders/:id - Get order details
// ============================================================================
exports.getOrder = async (cvdl, i49fs) => {
  try {
    const x3hop = {
      _id: cvdl.params.id
    };
    ohj89(cvdl, x3hop);
    const gmyn70 = await logr.findOne(x3hop).populate("customer", "fullName email phone").populate("courier", "name").populate("rider", "username").populate("placedBy", "username").lean();
    if (!gmyn70) return i49fs.status(404).json({
      success: false,
      message: "Order not found"
    });
    i49fs.json({
      success: true,
      order: gmyn70
    });
  } catch (g6e0) {
    console.error("Get order error:", g6e0);
    if (g6e0.name === "CastError") return i49fs.status(400).json({
      success: false,
      message: "Invalid order ID"
    });
    i49fs.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// ============================================================================
// POST /api/orders - Create order (FIXED: enriches items + auto-generates orderId)
// ============================================================================
exports.createOrder = async (e46x0, p26rc) => {
  const ly6wu = await r7577k.startSession();
  try {
    ly6wu.startTransaction();
    const {
      customer: gf2x,
      source: mxn9,
      items: bb814,
      shippingAddress: s25l40,
      paymentMethod: zf515c,
      discount: xt9z = 0,
      notes: u0e64,
      shopifyOrderId: emc7v
    } = e46x0.body;

    // ðŸ” STEP 1: Validate & enrich items with product data
    const b4q2 = [];
    for (const w27p9y of bb814) {
      // Fetch product to get name, sku, and validate variant
      const kih775 = await ke4sya.findById(w27p9y.productId).session(ly6wu);
      if (!kih775) {
        throw new Error(`Product ${w27p9y.productId} not found`);
      }

      // Find the variant
      const qkydz = kih775.variants.find(dd63 => dd63.variantId === w27p9y.variantId);
      if (!qkydz) {
        throw new Error(`Variant ${w27p9y.variantId} not found in product ${kih775.name}`);
      }

      // Validate stock
      if (qkydz.stock < w27p9y.quantity) {
        throw new Error(`Insufficient stock for ${kih775.name} (${qkydz.variantId}). Required: ${w27p9y.quantity}, Available: ${qkydz.stock}`);
      }

      // âœ… Enrich item with ALL required fields from product
      b4q2.push({
        productId: kih775._id,
        variantId: qkydz.variantId,
        name: kih775.name,
        // âœ… REQUIRED: Copy from product
        sku: kih775.sku,
        // âœ… REQUIRED: Copy from product
        variantAttributes: qkydz.attributes || {},
        quantity: w27p9y.quantity,
        unitPrice: w27p9y.unitPrice || qkydz.price,
        // Use variant price if not provided
        totalPrice: w27p9y.quantity * (w27p9y.unitPrice || qkydz.price)
      });
    }

    // ðŸ” STEP 2: Calculate totals
    const jn5s33 = b4q2.reduce((qfq75c, hdx80) => qfq75c + hdx80.totalPrice, 0);
    const x1r4e = 0; // Could be calculated via courier API later
    const qx1sbk = jn5s33 + x1r4e - xt9z;
    const lmau01 = {
      customer: gf2x,
      source: mxn9,
      items: b4q2,
      shippingAddress: s25l40,
      subtotal: jn5s33,
      shippingCost: x1r4e,
      discount: xt9z,
      totalAmount: qx1sbk,
      paymentMethod: zf515c || "COD",
      placedBy: e46x0.user.userId,
      notes: u0e64,
      shopifyOrderId: emc7v,
      paymentStatus: zf515c === "COD" ? "Pending" : "Paid",
      orderStatus: "Pending",
      ...(e46x0.tenantId && {
        tenantId: e46x0.tenantId
      })
    };
    const lty152 = new logr(lmau01);
    await lty152.save({
      session: ly6wu
    });
    for (const qtelu of b4q2) {
      const yp3f8h = await ke4sya.findById(qtelu.productId).session(ly6wu);
      const ow50za = yp3f8h.variants.find(h57m => h57m.variantId === qtelu.variantId);
      ow50za.stock -= qtelu.quantity;
      await yp3f8h.save({
        session: ly6wu
      });
      await deexh.create([{
        productId: qtelu.productId,
        variantId: qtelu.variantId,
        changeType: "Outbound",
        quantityChange: -qtelu.quantity,
        newStockLevel: ow50za.stock,
        reason: "Order creation",
        relatedEntityId: lty152._id,
        relatedEntityType: "Order",
        recordedBy: e46x0.user.userId
      }], {
        session: ly6wu
      });
    }
    await ly6wu.commitTransaction();

    // ðŸ” STEP 6: Log action to audit
    a1tg2w(e46x0.user.userId, "CREATE", lty152._id, {}, lty152.toObject(), e46x0.ip, e46x0.get("User-Agent"));
    p26rc.status(201).json({
      success: true,
      message: "Order created successfully. Stock automatically deducted.",
      data: lty152.toObject()
    });
  } catch (qvq29) {
    await ly6wu.abortTransaction();
    console.error("âŒ [DEBUG] Create order error:", {
      name: qvq29.name,
      message: qvq29.message,
      code: qvq29.code,
      stack: qvq29.stack
    });

    // âœ… Specific error handling
    if (qvq29.message.includes("Insufficient stock") || qvq29.message.includes("not found")) {
      return p26rc.status(400).json({
        success: false,
        message: qvq29.message
      });
    }
    if (qvq29.name === "ValidationError") {
      return p26rc.status(400).json({
        success: false,
        message: "Validation failed",
        errors: Object.values(qvq29.errors).map(eldd1 => ({
          field: eldd1.path,
          message: eldd1.message
        }))
      });
    }
    if (qvq29.code === 11000) {
      return p26rc.status(409).json({
        success: false,
        message: "Duplicate order ID or Shopify order ID"
      });
    }
    p26rc.status(500).json({
      success: false,
      message: "Internal server error",
      stack: qvq29.stack
    });
  } finally {
    ly6wu.endSession();
  }
};

// ============================================================================
// PUT /api/orders/:id - Update order (Pre-confirmation only)
// ============================================================================
exports.updateOrder = async (oac5, kqk5) => {
  try {
    const qnr9 = await logr.findById(oac5.params.id);
    if (!qnr9) return kqk5.status(404).json({
      success: false,
      message: "Order not found"
    });
    if (qnr9.orderStatus !== "Pending" && qnr9.orderStatus !== "Confirmed") {
      return kqk5.status(400).json({
        success: false,
        message: "Order can only be edited before processing"
      });
    }
    const i20hmd = qnr9.toObject();
    if (oac5.body.shippingAddress) {
      qnr9.shippingAddress = {
        ...qnr9.shippingAddress,
        ...oac5.body.shippingAddress
      };
    }
    if (oac5.body.notes !== undefined) qnr9.notes = oac5.body.notes;

    // âœ… Validate discount before applying
    if (oac5.body.discount !== undefined) {
      const irjy4 = qnr9.subtotal + (qnr9.shippingCost || 0);
      if (oac5.body.discount < 0) {
        return kqk5.status(400).json({
          success: false,
          message: "Discount cannot be negative"
        });
      }
      if (oac5.body.discount > irjy4) {
        return kqk5.status(400).json({
          success: false,
          message: `Discount (${oac5.body.discount}) cannot exceed order total (${irjy4.toFixed(2)})`
        });
      }
      qnr9.discount = oac5.body.discount;
    }
    yzvl6z(qnr9);
    await qnr9.save();
    a1tg2w(oac5.user.userId, "UPDATE", qnr9._id, i20hmd, qnr9.toObject(), oac5.ip, oac5.get("User-Agent"));
    kqk5.json({
      success: true,
      message: "Order updated successfully",
      data: qnr9.toObject()
    });
  } catch (nor7) {
    console.error("Update order error:", nor7);
    kqk5.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// ============================================================================
// DELETE /api/orders/:id - Cancel order (with stock restoration)
// ============================================================================
// âœ… FIXED cancelOrder â€” wrapped in session transaction
exports.cancelOrder = async (y3gbf, sch1) => {
  const mgrn = await r7577k.startSession();
  try {
    mgrn.startTransaction();
    const tr2i = await logr.findById(y3gbf.params.id).session(mgrn);
    if (!tr2i) return sch1.status(404).json({
      success: false,
      message: "Order not found"
    });
    if (!["Pending", "Confirmed"].includes(tr2i.orderStatus)) {
      return sch1.status(400).json({
        success: false,
        message: `Cannot cancel order with status: '${tr2i.orderStatus}'. Only Pending/Confirmed orders can be cancelled.`
      });
    }
    const ed1bv = tr2i.toObject();

    // âœ… In cancelOrder â€” safe access
    await dn1y(tr2i.items, y3gbf.user.userId, tr2i._id, y3gbf.body?.reason || "Order cancelled" // â† add ?. here
    );

    // âœ… Only mark cancelled AFTER stock is safely restored
    tr2i.orderStatus = "Cancelled";
    await tr2i.save({
      session: mgrn
    });
    await mgrn.commitTransaction();
    a1tg2w(y3gbf.user.userId, "CANCEL", tr2i._id, ed1bv, {
      orderStatus: "Cancelled"
    }, y3gbf.ip, y3gbf.get("User-Agent"), y3gbf.body?.reason // â† add ?. here too
    );
    sch1.json({
      success: true,
      message: "Order cancelled. Stock restored.",
      data: {
        id: tr2i._id,
        status: "Cancelled"
      }
    });
  } catch (y5s3i) {
    await mgrn.abortTransaction(); // âœ… Rolls back everything if anything fails
    console.error("Cancel order error:", y5s3i);
    sch1.status(500).json({
      success: false,
      message: "Internal server error"
    });
  } finally {
    mgrn.endSession();
  }
};

// ============================================================================
// PATCH /api/orders/:id/status - Update order status (workflow)
// ============================================================================
exports.updateStatus = async (u98ol, l409u) => {
  try {
    const xjk1 = await logr.findById(u98ol.params.id);
    if (!xjk1) return l409u.status(404).json({
      success: false,
      message: "Order not found"
    });

    // Define valid status transitions
    const a336g0 = {
      Pending: ["Confirmed", "Cancelled"],
      Confirmed: ["Processing", "Cancelled"],
      Processing: ["Packed"],
      Packed: ["Shipped"],
      Shipped: ["Delivered", "Returned"],
      Delivered: [],
      Cancelled: [],
      Returned: []
    };
    if (!a336g0[xjk1.orderStatus]?.includes(u98ol.body.status)) {
      return l409u.status(400).json({
        success: false,
        message: `Invalid transition: ${xjk1.orderStatus} â†’ ${u98ol.body.status}`,
        allowed: a336g0[xjk1.orderStatus]
      });
    }
    const f1mx = xjk1.toObject();
    xjk1.orderStatus = u98ol.body.status;

    // Set deliveredAt when status becomes Delivered
    if (u98ol.body.status === "Delivered") {
      xjk1.deliveredAt = new Date();
    }
    if (u98ol.body.notes) xjk1.notes = u98ol.body.notes;
    await xjk1.save();
    a1tg2w(u98ol.user.userId, "UPDATE", xjk1._id, f1mx, {
      orderStatus: xjk1.orderStatus
    }, u98ol.ip, u98ol.get("User-Agent"), `Status: ${u98ol.body.status}`);
    l409u.json({
      success: true,
      message: `Order status updated to ${u98ol.body.status}`,
      data: {
        id: xjk1._id,
        status: xjk1.orderStatus
      }
    });
  } catch (ed087) {
    console.error("Update status error:", ed087);
    l409u.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// ============================================================================
// PATCH /api/orders/:id/payment - Update payment status
// ============================================================================
exports.updatePayment = async (w7w9, y26n8i) => {
  try {
    const n9k09 = await logr.findById(w7w9.params.id);
    if (!n9k09) return y26n8i.status(404).json({
      success: false,
      message: "Order not found"
    });
    const t1db = n9k09.toObject();
    n9k09.paymentStatus = w7w9.body.paymentStatus;
    if (w7w9.body.notes) n9k09.notes = w7w9.body.notes;
    await n9k09.save();
    a1tg2w(w7w9.user.userId, "UPDATE", n9k09._id, t1db, {
      paymentStatus: w7w9.body.paymentStatus
    }, w7w9.ip, w7w9.get("User-Agent"), `Payment: ${w7w9.body.paymentStatus}`);
    y26n8i.json({
      success: true,
      message: `Payment updated to ${w7w9.body.paymentStatus}`,
      data: {
        id: n9k09._id,
        paymentStatus: n9k09.paymentStatus
      }
    });
  } catch (xyxd) {
    console.error("Update payment error:", xyxd);
    y26n8i.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// ============================================================================
// PATCH /api/orders/:id/delivery - Update delivery status & tracking
// ============================================================================
exports.updateDelivery = async (f8i19, l6u3) => {
  try {
    const y2rtrj = await logr.findById(f8i19.params.id);
    if (!y2rtrj) return l6u3.status(404).json({
      success: false,
      message: "Order not found"
    });
    const zz2mz = y2rtrj.toObject();
    y2rtrj.deliveryStatus = f8i19.body.deliveryStatus;
    if (f8i19.body.trackingNumber) y2rtrj.trackingNumber = f8i19.body.trackingNumber;

    // Set deliveredAt when status becomes Delivered
    if (f8i19.body.deliveryStatus === "Delivered") {
      y2rtrj.deliveredAt = new Date();
    }
    await y2rtrj.save();
    a1tg2w(f8i19.user.userId, "UPDATE", y2rtrj._id, zz2mz, {
      deliveryStatus: y2rtrj.deliveryStatus,
      trackingNumber: y2rtrj.trackingNumber
    }, f8i19.ip, f8i19.get("User-Agent"));
    l6u3.json({
      success: true,
      message: "Delivery updated",
      data: {
        id: y2rtrj._id,
        deliveryStatus: y2rtrj.deliveryStatus,
        trackingNumber: y2rtrj.trackingNumber
      }
    });
  } catch (v316) {
    console.error("Update delivery error:", v316);
    l6u3.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// ============================================================================
// POST /api/orders/:id/fulfill - Assign courier & mark as shipped
// ============================================================================
exports.fulfillOrder = async (m2653e, xp93) => {
  try {
    const w21zn1 = await logr.findById(m2653e.params.id);
    if (!w21zn1) return xp93.status(404).json({
      success: false,
      message: "Order not found"
    });

    // Order must be packed before fulfillment
    if (w21zn1.orderStatus !== "Packed" && w21zn1.orderStatus !== "Shipped") {
      return xp93.status(400).json({
        success: false,
        message: "Order must be packed before fulfillment"
      });
    }
    const oe8tdj = w21zn1.toObject();
    if (m2653e.body.courier) w21zn1.courier = m2653e.body.courier;
    if (m2653e.body.rider) w21zn1.rider = m2653e.body.rider;
    w21zn1.orderStatus = "Shipped";
    w21zn1.deliveryStatus = "Assigned";

    // Mock label generation (replace with real courier API later)
    const wq94ta = `https://api.example.com/labels/${w21zn1._id}-${Date.now()}.pdf`;
    await w21zn1.save();
    a1tg2w(m2653e.user.userId, "FULFILL", w21zn1._id, oe8tdj, {
      courier: w21zn1.courier,
      rider: w21zn1.rider,
      status: "Shipped"
    }, m2653e.ip, m2653e.get("User-Agent"));
    xp93.json({
      success: true,
      message: "Order fulfilled & shipped",
      data: {
        id: w21zn1._id,
        status: "Shipped",
        labelUrl: wq94ta,
        courier: w21zn1.courier
      }
    });
  } catch (kwokn6) {
    console.error("Fulfill order error:", kwokn6);
    xp93.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// ============================================================================
// POST /api/orders/:id/items - Add item to existing order
// ============================================================================
exports.addItemToOrder = async (rejl, bq470h) => {
  const mpe2 = await r7577k.startSession();
  try {
    mpe2.startTransaction();
    const qpe4e4 = await logr.findById(rejl.params.id);
    if (!qpe4e4) return bq470h.status(404).json({
      success: false,
      message: "Order not found"
    });

    // Only allow adding items before order is processed
    if (qpe4e4.orderStatus !== "Pending" && qpe4e4.orderStatus !== "Confirmed") {
      return bq470h.status(400).json({
        success: false,
        message: "Cannot add items after processing"
      });
    }

    // Fetch product to enrich item data
    const pe783v = await ke4sya.findById(rejl.body.productId).session(mpe2);
    if (!pe783v) throw new Error(`Product ${rejl.body.productId} not found`);
    const kkz62q = pe783v.variants.find(c9lx => c9lx.variantId === rejl.body.variantId);
    if (!kkz62q) throw new Error(`Variant ${rejl.body.variantId} not found`);
    if (kkz62q.stock < rejl.body.quantity) {
      throw new Error(`Insufficient stock for ${pe783v.name}`);
    }

    // Create enriched item
    const cmj0 = {
      productId: pe783v._id,
      variantId: kkz62q.variantId,
      name: pe783v.name,
      sku: pe783v.sku,
      variantAttributes: kkz62q.attributes || {},
      quantity: rejl.body.quantity,
      unitPrice: rejl.body.unitPrice || kkz62q.price,
      totalPrice: rejl.body.quantity * (rejl.body.unitPrice || kkz62q.price)
    };

    // Add to order and recalculate totals
    qpe4e4.items.push(cmj0);
    yzvl6z(qpe4e4);
    await qpe4e4.save({
      session: mpe2
    });

    // Deduct stock for new item
    await c9j27([cmj0], rejl.user.userId, qpe4e4._id, "Item added to order");
    await mpe2.commitTransaction();
    bq470h.status(201).json({
      success: true,
      message: "Item added & stock deducted",
      newItem: cmj0
    });
  } catch (lc6823) {
    await mpe2.abortTransaction();
    console.error("Add item error:", lc6823);
    bq470h.status(400).json({
      success: false,
      message: lc6823.message || "Failed to add item"
    });
  } finally {
    mpe2.endSession();
  }
};

// ============================================================================
// PUT /api/orders/:id/items/:itemId - Update item in order
// ============================================================================
exports.updateOrderItem = async (ld2ang, cngs) => {
  const o5791 = await r7577k.startSession();
  try {
    o5791.startTransaction();
    const ta3n = await logr.findById(ld2ang.params.id);
    if (!ta3n) return cngs.status(404).json({
      success: false,
      message: "Order not found"
    });
    const zf66 = ta3n.items.id(ld2ang.params.itemId);
    if (!zf66) return cngs.status(404).json({
      success: false,
      message: "Item not found in order"
    });

    // Only allow editing before order is processed
    if (ta3n.orderStatus !== "Pending" && ta3n.orderStatus !== "Confirmed") {
      return cngs.status(400).json({
        success: false,
        message: "Cannot edit items after processing"
      });
    }
    const ob7fl = zf66.quantity;

    // Handle quantity changes (deduct or restore stock)
    if (ld2ang.body.quantity !== undefined) {
      const bgi4v5 = ld2ang.body.quantity - ob7fl;
      if (bgi4v5 > 0) {
        // Adding more: deduct additional stock
        await c9j27([{
          productId: zf66.productId,
          variantId: zf66.variantId,
          quantity: bgi4v5
        }], ld2ang.user.userId, ta3n._id, "Item qty increased");
      } else if (bgi4v5 < 0) {
        // Removing some: restore stock
        await dn1y([{
          productId: zf66.productId,
          variantId: zf66.variantId,
          quantity: Math.abs(bgi4v5)
        }], ld2ang.user.userId, ta3n._id, "Item qty decreased");
      }
      zf66.quantity = ld2ang.body.quantity;
    }

    // Update price if provided
    if (ld2ang.body.unitPrice !== undefined) {
      zf66.unitPrice = ld2ang.body.unitPrice;
    }

    // Recalculate item total and order totals
    zf66.totalPrice = zf66.quantity * zf66.unitPrice;
    yzvl6z(ta3n);
    await ta3n.save({
      session: o5791
    });
    await o5791.commitTransaction();
    cngs.json({
      success: true,
      message: "Item updated",
      item: zf66
    });
  } catch (ji7kx1) {
    await o5791.abortTransaction();
    console.error("Update item error:", ji7kx1);
    cngs.status(400).json({
      success: false,
      message: ji7kx1.message || "Failed to update item"
    });
  } finally {
    o5791.endSession();
  }
};

// ============================================================================
// DELETE /api/orders/:id/items/:itemId - Remove item from order
// ============================================================================
exports.deleteOrderItem = async (w4zuj, ym0e9) => {
  const uofb10 = await r7577k.startSession();
  try {
    uofb10.startTransaction();
    const e6o0 = await logr.findById(w4zuj.params.id);
    if (!e6o0) return ym0e9.status(404).json({
      success: false,
      message: "Order not found"
    });

    // Only allow removing before order is processed
    if (e6o0.orderStatus !== "Pending" && e6o0.orderStatus !== "Confirmed") {
      return ym0e9.status(400).json({
        success: false,
        message: "Cannot remove items after processing"
      });
    }
    const u3o9 = e6o0.items.id(w4zuj.params.itemId);
    if (!u3o9) return ym0e9.status(404).json({
      success: false,
      message: "Item not found"
    });

    // Restore stock for removed item
    await dn1y([u3o9], w4zuj.user.userId, e6o0._id, "Item removed from order");

    // Remove item and recalculate totals
    e6o0.items.pull({
      _id: w4zuj.params.itemId
    });
    yzvl6z(e6o0);
    await e6o0.save({
      session: uofb10
    });
    await uofb10.commitTransaction();
    ym0e9.json({
      success: true,
      message: "Item removed & stock restored",
      data: {
        removedItemId: w4zuj.params.itemId
      }
    });
  } catch (yjob2) {
    await uofb10.abortTransaction();
    console.error("Delete item error:", yjob2);
    ym0e9.status(400).json({
      success: false,
      message: yjob2.message || "Failed to remove item"
    });
  } finally {
    uofb10.endSession();
  }
};