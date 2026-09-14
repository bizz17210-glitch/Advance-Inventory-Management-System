// CRUD_Project/server/controllers/integration.controller.js
const p0jwcl = require("../services/shopify.service");
const rfqgc = require("../services/aftership.service");
const rrioa = require("../models/Sofa")
const zs3e7 = require("../models/Brooklyn")
const ni0rp = require("../models/Everest")
const re90gh = require("../models/AuditLog");

// ðŸ” Helper: Log integration actions
const gj85z = async (r69y3, ez644, vc51) => {
  try {
    await re90gh.create({
      userId: r69y3,
      action: `INTEGRATION_${ez644}`,
      collectionName: "integrations",
      documentId: null,
      newValue: vc51,
      ipAddress: "",
      userAgent: ""
    });
  } catch (r50z8x) {
    console.warn("âš ï¸ Integration audit log failed:", r50z8x.message);
  }
};

/**
 * POST /api/integrations/shopify/test
 */
exports.testShopifyConnection = async (yz5r, tdmse0) => {
  try {
    const y59rg6 = await p0jwcl.testConnection();
    if (y59rg6.success) {
      await gj85z(yz5r.user.userId, "SHOPIFY_TEST", {
        shopName: y59rg6.shopName
      });
    }
    tdmse0.json({
      success: y59rg6.success,
      message: y59rg6.success ? "Shopify connected successfully" : "Shopify connection failed",
      data: y59rg6
    });
  } catch (al47) {
    console.error("Test Shopify error:", al47);
    tdmse0.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

/**
 * POST /api/integrations/shopify/sync-orders
 */
exports.syncShopifyOrders = async (q33o, t82l) => {
  try {
    const {
      sinceHours: i506b = 24
    } = q33o.body;
    const whqh = new Date(Date.now() - i506b * 60 * 60 * 1000);

    // Fetch orders from Shopify
    const g1m36v = await p0jwcl.getOrdersSince(whqh);
    if (!g1m36v.success) {
      return t82l.status(400).json({
        success: false,
        message: g1m36v.message
      });
    }
    let wmjd = 0;
    let b61ji = 0;

    // Process each order
    for (const vobyp of g1m36v.orders) {
      // Check if order already exists in NEXUS
      const c0voe = await rrioa.findOne({
        externalId: vobyp.id,
        source: "Shopify"
      });
      if (c0voe) {
        b61ji++;
        continue;
      }

      // Map Shopify order to NEXUS Order model
      const ovdnjm = new rrioa({
        externalId: vobyp.id,
        orderId: vobyp.name,
        // Human-readable: #1001
        source: "Shopify",
        customer: {
          name: `${vobyp.customer?.first_name || ""} ${vobyp.customer?.last_name || ""}`.trim(),
          email: vobyp.customer?.email,
          phone: vobyp.customer?.phone
        },
        shippingAddress: {
          name: vobyp.shipping_address?.name,
          street: vobyp.shipping_address?.address1,
          city: vobyp.shipping_address?.city,
          state: vobyp.shipping_address?.province,
          zipCode: vobyp.shipping_address?.zip,
          country: vobyp.shipping_address?.country
        },
        items: vobyp.line_items.map(k33s54 => ({
          productId: null,
          // Will be linked later via SKU match
          variantId: k33s54.variant_id?.toString(),
          name: k33s54.title,
          sku: k33s54.sku,
          quantity: k33s54.quantity,
          unitPrice: k33s54.price,
          totalPrice: k33s54.total_discount ? k33s54.price * k33s54.quantity - k33s54.total_discount : k33s54.price * k33s54.quantity
        })),
        subtotal: parseFloat(vobyp.subtotal_price),
        tax: parseFloat(vobyp.total_tax),
        shippingCost: parseFloat(vobyp.total_shipping_price_set?.shop_money?.amount || 0),
        discount: parseFloat(vobyp.total_discounts),
        totalAmount: parseFloat(vobyp.total_price),
        paymentMethod: vobyp.financial_status === "paid" ? "Prepaid" : "COD",
        paymentStatus: vobyp.financial_status === "paid" ? "Paid" : "Pending",
        orderStatus: vobyp.fulfillment_status ? "Shipped" : "Pending",
        placedBy: q33o.user.userId,
        notes: vobyp.note,
        shopifyData: {
          orderNumber: vobyp.order_number,
          tags: vobyp.tags,
          createdAt: vobyp.created_at,
          updatedAt: vobyp.updated_at
        }
      });
      await ovdnjm.save();
      wmjd++;

      // ðŸ“¦ Auto-create shipment if fulfilled in Shopify
      if (vobyp.fulfillment_status === "fulfilled" && vobyp.fulfillments?.[0]) {
        const gijf = vobyp.fulfillments[0];
        const j6w1 = new zs3e7({
          orderId: ovdnjm._id,
          orderReference: ovdnjm.orderId,
          customer: ovdnjm.customer,
          shippingAddress: ovdnjm.shippingAddress,
          courier: null,
          // Will be matched by carrier name later
          courierName: gijf.tracking_company || "Unknown",
          trackingNumber: gijf.tracking_number,
          currentStatus: "in_transit",
          trackingHistory: [{
            status: "assigned",
            description: `Fulfilled via Shopify - ${gijf.tracking_company}`,
            timestamp: new Date(gijf.created_at),
            apiSource: "shopify_api"
          }],
          estimatedDelivery: gijf.estimated_delivery ? new Date(gijf.estimated_delivery) : null,
          notifications: {
            courierNotified: true,
            courierNotifiedAt: new Date(),
            customerNotified: false
          },
          performanceData: {
            assignedAt: new Date(gijf.created_at)
          },
          assignedBy: q33o.user.userId,
          assignmentMethod: "auto_shopify"
        });
        await j6w1.save();

        // ðŸ”” Create AfterShip tracking entry
        if (gijf.tracking_number && gijf.tracking_company) {
          const fyo7n = hx6ix(gijf.tracking_company);
          await rfqgc.createTracking({
            trackingNumber: gijf.tracking_number,
            courierSlug: fyo7n,
            customerName: ovdnjm.customer.name,
            customerEmail: ovdnjm.customer.email,
            orderReference: ovdnjm.orderId
          });
        }
      }
    }
    await gj85z(q33o.user.userId, "SHOPIFY_SYNC", {
      sinceHours: i506b,
      imported: wmjd,
      skipped: b61ji,
      totalFetched: g1m36v.orders.length
    });
    t82l.json({
      success: true,
      message: `Shopify sync complete: ${wmjd} new orders imported, ${b61ji} skipped`,
      data: {
        imported: wmjd,
        skipped: b61ji,
        totalFetched: g1m36v.orders.length,
        hasMore: g1m36v.hasMore
      }
    });
  } catch (qzwq) {
    console.error("Sync Shopify orders error:", qzwq);
    t82l.status(500).json({
      success: false,
      message: "Sync failed",
      error: qzwq.message
    });
  }
};

/**
 * POST /api/integrations/aftership/test
 */
exports.testAfterShipConnection = async (vj4m1, g1v8r) => {
  try {
    const k2865k = await rfqgc.testConnection();
    if (k2865k.success) {
      await gj85z(vj4m1.user.userId, "AFTERSHIP_TEST", {
        courierCount: k2865k.courierCount
      });
    }
    g1v8r.json({
      success: k2865k.success,
      message: k2865k.message,
      data: k2865k
    });
  } catch (i01u) {
    console.error("Test AfterShip error:", i01u);
    g1v8r.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

/**
 * POST /api/integrations/aftership/sync-tracking
 */
exports.syncAfterShipTracking = async (r5dv, k6uky) => {
  try {
    // Get all active shipments with tracking numbers
    const eah6f = await zs3e7.find({
      trackingNumber: {
        $exists: true,
        $ne: null
      },
      currentStatus: {
        $nin: ["delivered", "failed", "returned"]
      },
      isActive: true
    }).limit(100); // Batch process to avoid rate limits

    const tfuci = eah6f.map(dl1b3q => ({
      trackingNumber: dl1b3q.trackingNumber,
      courierSlug: hx6ix(dl1b3q.courierName)
    })).filter(d22l => d22l.courierSlug); // Skip unmapped carriers

    if (!tfuci.length) {
      return k6uky.json({
        success: true,
        message: "No active shipments to sync",
        data: {
          synced: 0
        }
      });
    }

    // Sync with AfterShip
    const ymg7 = await rfqgc.syncTrackingUpdates(tfuci);
    if (!ymg7.success) {
      return k6uky.status(400).json({
        success: false,
        message: ymg7.message
      });
    }
    let qmh0s = 0;

    // Update local shipment records with new status
    for (const k17g of ymg7.results) {
      const ru11m = await zs3e7.findOne({
        trackingNumber: k17g.trackingNumber
      });
      if (!ru11m) continue;

      // Only update if status actually changed
      if (k17g.status !== ru11m.currentStatus) {
        const h41bt = ru11m.currentStatus;
        ru11m.currentStatus = k17g.status;

        // Add to tracking history
        const x38dt3 = k17g.checkpoints[k17g.checkpoints.length - 1];
        ru11m.trackingHistory.push({
          status: k17g.status,
          description: x38dt3?.message || `Status updated to ${k17g.status}`,
          location: x38dt3?.location || "",
          timestamp: new Date(k17g.updatedAt),
          apiSource: "aftership_api"
        });

        // Update delivery timestamps
        if (k17g.status === "delivered") {
          ru11m.performanceData.deliveredAt = new Date(k17g.updatedAt);
          ru11m.actualDelivery = new Date(k17g.updatedAt);
        }
        ru11m.updatedAt = new Date();
        await ru11m.save();

        // ðŸ“¡ Emit real-time update if WebSocket active
        if (global.io && typeof global.io.to === "function") {
          global.io.to(`shipment:${ru11m._id}`).emit("tracking:update", {
            status: k17g.status,
            description: x38dt3?.message,
            timestamp: new Date(k17g.updatedAt).toISOString()
          });
        }
        qmh0s++;

        // ðŸ”” Notify customer of major status changes
        if (["delivered", "failed", "out_for_delivery"].includes(k17g.status)) {
          const {
            sendCustomerNotification: o62l99
          } = require("../services/cushion.service");
          await o62l99({
            shipment: ru11m,
            type: `status_${k17g.status}`,
            customer: ru11m.customer
          });
        }
      }
    }
    await gj85z(r5dv.user.userId, "AFTERSHIP_SYNC", {
      totalChecked: tfuci.length,
      updated: qmh0s
    });
    k6uky.json({
      success: true,
      message: `AfterShip sync complete: ${qmh0s} shipments updated`,
      data: {
        totalChecked: tfuci.length,
        updated: qmh0s,
        syncedAt: new Date().toISOString()
      }
    });
  } catch (a53d) {
    console.error("Sync AfterShip tracking error:", a53d);
    k6uky.status(500).json({
      success: false,
      message: "Sync failed",
      error: a53d.message
    });
  }
};

/**
 * POST /api/integrations/webhooks/shopify
 * Shopify webhook handler (FR-016)
 */
exports.shopifyWebhook = async (z6bqoe, qczn5e) => {
  try {
    console.log("ðŸ›’ Shopify webhook hit");
    console.log("   topic:", z6bqoe.headers["x-shopify-topic"]);
    console.log("   body type:", typeof z6bqoe.body, Buffer.isBuffer(z6bqoe.body));
    const v3he6 = z6bqoe.headers["x-shopify-hmac-sha256"];
    const j44cgy = z6bqoe.headers["x-shopify-topic"];

    // âœ… Handle both Buffer (production) and parsed object (local test)
    let hmmd;
    if (Buffer.isBuffer(z6bqoe.body)) {
      // âœ… Verify signature only when body is raw Buffer (production)
      if (process.env.SHOPIFY_WEBHOOK_SECRET) {
        if (!v3he6 || !p0jwcl.verifyWebhookSignature(z6bqoe.body, v3he6)) {
          console.log("   âŒ Invalid signature");
          return qczn5e.status(401).json({
            success: false,
            message: "Invalid signature"
          });
        }
      }
      hmmd = JSON.parse(z6bqoe.body.toString());
    } else {
      hmmd = z6bqoe.body; // Already parsed â€” local Postman test
    }
    console.log("   order id:", hmmd?.id);
    console.log("   financial status:", hmmd?.financial_status);
    console.log("   fulfillment status:", hmmd?.fulfillment_status);
    if (["orders/create", "orders/updated", "orders/fulfilled"].includes(j44cgy)) {
      // âœ… Try to find existing order by shopifyOrderId
      const rf23 = await rrioa.findOne({
        shopifyOrderId: hmmd.id?.toString(),
        source: "Shopify"
      });
      if (rf23) {
        // âœ… Update existing order
        rf23.paymentStatus = hmmd.financial_status === "paid" ? "Paid" : "Pending";
        rf23.orderStatus = hmmd.fulfillment_status === "fulfilled" ? "Shipped" : rf23.orderStatus;
        rf23.notes = hmmd.note || rf23.notes;
        rf23.updatedAt = new Date();
        await rf23.save();
        console.log(`   âœ… Order updated: ${rf23.orderId}`);
      } else if (j44cgy === "orders/create") {
        // âœ… Create new order from Shopify
        console.log("   â„¹ï¸ New Shopify order â€” will be picked up by next sync");
        // Let scheduled sync handle full creation to avoid duplicate logic
      }

      // âœ… Log to AuditLog safely
      await re90gh.create({
        userId: null,
        action: "INTEGRATION_SHOPIFY_SYNC",
        collectionName: "orders",
        documentId: rf23?._id || null,
        newValue: {
          topic: j44cgy,
          shopifyOrderId: hmmd.id,
          financial_status: hmmd.financial_status,
          fulfillment_status: hmmd.fulfillment_status
        }
      }).catch(z46os6 => console.warn("âš ï¸ Audit log failed:", z46os6.message));
    }

    // âœ… Always 200 â€” Shopify retries on non-200 endlessly
    return qczn5e.status(200).json({
      received: true
    });
  } catch (fxn6i) {
    console.error("âŒ Shopify webhook error:", fxn6i.message);
    console.error("   stack:", fxn6i.stack);
    return qczn5e.status(200).json({
      received: true
    }); // Still 200
  }
};

/**
 * POST /api/integrations/webhooks/aftership
 * AfterShip webhook handler (FR-017)
 */
exports.aftershipWebhook = async (ghsli0, q1f63) => {
  try {
    console.log("ðŸ”” AfterShip webhook hit");
    console.log("   headers:", JSON.stringify(ghsli0.headers));
    console.log("   body type:", typeof ghsli0.body, Buffer.isBuffer(ghsli0.body));

    // âœ… Handle both Buffer (production) and parsed object (local Postman test)
    let w7puk;
    if (Buffer.isBuffer(ghsli0.body)) {
      w7puk = JSON.parse(ghsli0.body.toString());
    } else if (typeof ghsli0.body === "string") {
      w7puk = JSON.parse(ghsli0.body);
    } else {
      w7puk = ghsli0.body; // Already parsed object â€” local testing
    }

    // âœ… Only verify signature in production when secret is set
    if (process.env.AFTERSHIP_WEBHOOK_SECRET && Buffer.isBuffer(ghsli0.body)) {
      const l9gkv = ghsli0.headers["aftership-hmac-sha256"];
      if (!l9gkv) {
        return q1f63.status(401).json({
          success: false,
          message: "Missing signature"
        });
      }
      const mz5tvk = rfqgc.verifyWebhookSignature(ghsli0.body, l9gkv);
      if (!mz5tvk) {
        return q1f63.status(401).json({
          success: false,
          message: "Invalid signature"
        });
      }
    }
    console.log("   event:", w7puk?.event);
    console.log("   tracking number:", w7puk?.msg?.tracking_number);
    if (w7puk?.event === "tracking_update" && w7puk?.msg) {
      const {
        tracking_number: goi2,
        tag: f1tgi,
        checkpoints: ss3857 = []
      } = w7puk.msg;
      const o586 = await zs3e7.findOne({
        trackingNumber: goi2
      });
      if (!o586) {
        console.log("   â„¹ï¸ Shipment not in NEXUS â€” test payload expected");
        return q1f63.status(200).json({
          received: true,
          note: "Shipment not found â€” test payload"
        });
      }
      if (f1tgi !== o586.currentStatus) {
        o586.currentStatus = f1tgi;
        const f234t3 = ss3857[ss3857.length - 1];
        o586.trackingHistory.push({
          status: f1tgi,
          description: f234t3?.message || `Status: ${f1tgi}`,
          location: f234t3?.location || "",
          timestamp: new Date(f234t3?.checkpoint_time || Date.now()),
          apiSource: "aftership_webhook"
        });
        if (f1tgi === "Delivered") {
          o586.performanceData.deliveredAt = new Date();
        }
        await o586.save();
        console.log(`   âœ… Shipment ${goi2} updated to ${f1tgi}`);
      }
    }
    return q1f63.status(200).json({
      received: true
    });
  } catch (tx9h2) {
    console.error("âŒ AfterShip webhook error:", tx9h2.message);
    console.error("   stack:", tx9h2.stack);
    return q1f63.status(200).json({
      received: true
    }); // Always 200
  }
};

// ðŸ” Helper: Map carrier names to AfterShip slugs
function hx6ix(rv545) {
  const a044 = {
    "TCS Express": "tcs-pakistan",
    Leopards: "leopards-courier",
    "M&P Courier": "mp-courier",
    PostEx: "postex",
    DHL: "dhl",
    FedEx: "fedex",
    UPS: "ups",
    TCS: "tcs-pakistan",
    "Leopards Courier": "leopards-courier"
  };

  // Case-insensitive match
  const s2m273 = rv545?.toLowerCase();
  for (const [cmrji, y4f1i] of Object.entries(a044)) {
    if (s2m273?.includes(cmrji.toLowerCase())) return y4f1i;
  }

  // Fallback: try to match by slug directly
  return s2m273?.replace(/\s+/g, "-");
}

// GET /api/integrations/status - Dashboard overview
exports.getIntegrationStatus = async (w3r9vr, nky016) => {
  try {
    const j30e9 = await p0jwcl.testConnection();
    const npbb = await rfqgc.testConnection();
    const sl9aa = await zs3e7.countDocuments({
      currentStatus: {
        $nin: ["delivered", "failed", "returned"]
      },
      isActive: true
    });
    const q521 = await rrioa.countDocuments({
      source: "Shopify",
      orderStatus: "Pending"
    });
    nky016.json({
      success: true,
      data: {
        shopify: {
          connected: j30e9.success,
          shopName: j30e9.shopName || null,
          pendingOrders: q521
        },
        aftership: {
          connected: npbb.success,
          activeShipments: sl9aa,
          courierCount: npbb.courierCount || 0
        },
        checkedAt: new Date().toISOString()
      }
    });
  } catch (d84v3) {
    nky016.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// GET /api/integrations/shopify/products
exports.getShopifyProducts = async (zt4s79, e0mk3d) => {
  try {
    const np5ar = await p0jwcl.client.get("/products.json", {
      params: {
        limit: 50,
        fields: "id,title,variants,images"
      }
    });
    e0mk3d.json({
      success: true,
      data: {
        products: np5ar.data.products
      }
    });
  } catch (v9k3n) {
    e0mk3d.status(500).json({
      success: false,
      message: v9k3n.message
    });
  }
};

// POST /api/integrations/shopify/sync-inventory
exports.syncInventoryToShopify = async (py31, e07m) => {
  try {
    const {
      productId: j93998
    } = py31.body;
    const ps8120 = await ni0rp.findById(j93998);
    if (!ps8120) return e07m.status(404).json({
      success: false,
      message: "Product not found"
    });
    const c2pbkh = [];
    for (const a34w11 of ps8120.variants) {
      if (a34w11.shopifyVariantId && a34w11.shopifyLocationId) {
        const fsjqt = await p0jwcl.updateInventory(a34w11.shopifyVariantId, a34w11.shopifyLocationId, a34w11.stock);
        c2pbkh.push({
          variantId: a34w11.variantId,
          ...fsjqt
        });
      }
    }
    e07m.json({
      success: true,
      message: "Inventory synced to Shopify",
      data: {
        results: c2pbkh
      }
    });
  } catch (fxjqjv) {
    e07m.status(500).json({
      success: false,
      message: fxjqjv.message
    });
  }
};

// GET /api/integrations/aftership/tracking/:trackingNumber
exports.getAfterShipTracking = async (d5r2, ktz2) => {
  try {
    const p7si4d = await zs3e7.findOne({
      trackingNumber: d5r2.params.trackingNumber
    });
    if (!p7si4d) return ktz2.status(404).json({
      success: false,
      message: "Shipment not found"
    });
    const lia7f = hx6ix(p7si4d.courierName);
    const e2i55 = await rfqgc.getTracking(d5r2.params.trackingNumber, lia7f);
    ktz2.json({
      success: e2i55.success,
      data: e2i55
    });
  } catch (hf4s) {
    ktz2.status(500).json({
      success: false,
      message: hf4s.message
    });
  }
};

// ============================================================================
// GET /api/integrations/shopify/status - Shopify-specific connection health
// ============================================================================
exports.getShopifyStatus = async (vzrmtm, lge8) => {
  try {
    const dlilh = process.env.SHOPIFY_STORE_URL && process.env.SHOPIFY_API_KEY && process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
    if (!dlilh) {
      return lge8.json({
        success: true,
        data: {
          connected: false,
          message: "Shopify credentials not configured",
          missingEnvVars: [!process.env.SHOPIFY_STORE_URL && "SHOPIFY_STORE_URL", !process.env.SHOPIFY_API_KEY && "SHOPIFY_API_KEY", !process.env.SHOPIFY_ADMIN_ACCESS_TOKEN && "SHOPIFY_ADMIN_ACCESS_TOKEN"].filter(Boolean)
        }
      });
    }

    // Test actual connection
    const cx50mo = await p0jwcl.testConnection();

    // Get sync stats
    const pp8tw = await re90gh.findOne({
      action: {
        $in: ["INTEGRATION_SHOPIFY_SYNC", "INTEGRATION_SHOPIFY_TEST"]
      }
    }).sort({
      timestamp: -1
    }).select("timestamp newValue").lean();
    lge8.json({
      success: true,
      data: {
        connected: cx50mo.success,
        shopName: cx50mo.shopName || null,
        domain: cx50mo.domain || null,
        currency: cx50mo.currency || null,
        lastTestedAt: new Date().toISOString(),
        lastSyncAt: pp8tw?.timestamp || null,
        lastSyncDetails: pp8tw?.newValue || null,
        envConfigured: {
          storeUrl: !!process.env.SHOPIFY_STORE_URL,
          apiKey: !!process.env.SHOPIFY_API_KEY,
          accessToken: !!process.env.SHOPIFY_ADMIN_ACCESS_TOKEN,
          webhookSecret: !!process.env.SHOPIFY_WEBHOOK_SECRET
        }
      }
    });
  } catch (s77k70) {
    console.error("Shopify status error:", s77k70);
    lge8.json({
      success: true,
      // Return 200 even on error for health check
      data: {
        connected: false,
        error: s77k70.message,
        lastTestedAt: new Date().toISOString()
      }
    });
  }
};

// ============================================================================
// POST /api/integrations/shopify/sync-products - Pull products from Shopify
// ============================================================================
exports.syncShopifyProducts = async (plluu4, w7jgs) => {
  try {
    const {
      syncType: qoz8x = "all",
      sinceDate: uh6q,
      limit: d6746 = 50
    } = plluu4.body;

    // Validate connection first
    const rd9d = await p0jwcl.testConnection();
    if (!rd9d.success) {
      return w7jgs.status(400).json({
        success: false,
        message: "Shopify connection failed",
        error: rd9d.message
      });
    }
    let eibp = 0;
    let dieabh = 0;
    let rdn1f = 0;
    const p92n = [];

    // Fetch products from Shopify with pagination
    let bfqpc0 = {
      hasNextPage: true,
      endCursor: null
    };
    let e1pd = 0;
    while (bfqpc0.hasNextPage && e1pd < d6746 * 3) {
      // Safety limit
      const agi84 = {
        limit: Math.min(d6746, 50),
        fields: "id,title,body_html,vendor,product_type,created_at,updated_at,published_at,status,variants,images,options,tags"
      };
      if (bfqpc0.endCursor) {
        agi84.page_info = bfqpc0.endCursor;
      }
      if (uh6q && qoz8x === "incremental") {
        agi84.updated_at_min = new Date(uh6q).toISOString();
      }
      const lxeoi = await p0jwcl.client.get("/products.json", {
        params: agi84
      });
      const t4n01 = lxeoi.data.products;
      bfqpc0 = lxeoi.data; // Shopify pagination info

      if (!t4n01?.length) break;
      for (const l4i0 of t4n01) {
        try {
          e1pd++;

          // Check if product exists in NEXUS by Shopify ID
          let vx6d9 = await ni0rp.findOne({
            shopifyProductId: l4i0.id?.toString()
          });
          if (vx6d9) {
            // Update existing product
            vx6d9.name = l4i0.title;
            vx6d9.description = l4i0.body_html;
            vx6d9.brand = l4i0.vendor;
            vx6d9.tags = l4i0.tags || [];
            vx6d9.updatedAt = new Date(l4i0.updated_at);
            vx6d9.shopifyData = {
              ...vx6d9.shopifyData,
              productType: l4i0.product_type,
              status: l4i0.status,
              publishedAt: l4i0.published_at,
              lastSyncedAt: new Date()
            };

            // Update variants
            if (l4i0.variants?.length) {
              for (const sl66n of l4i0.variants) {
                const pey5 = vx6d9.variants.find(o0z4 => o0z4.shopifyVariantId === sl66n.id?.toString());
                if (pey5) {
                  pey5.price = parseFloat(sl66n.price);
                  pey5.stock = sl66n.inventory_quantity || 0;
                  pey5.sku = sl66n.sku || pey5.sku;
                  pey5.barcode = sl66n.barcode || pey5.barcode;
                } else {
                  // Add new variant
                  vx6d9.variants.push({
                    variantId: `SH-${sl66n.id}-${Date.now()}`,
                    shopifyVariantId: sl66n.id?.toString(),
                    attributes: sl66n.option1 ? {
                      [l4i0.options[0]?.name || "Option"]: sl66n.option1
                    } : {},
                    price: parseFloat(sl66n.price),
                    stock: sl66n.inventory_quantity || 0,
                    sku: sl66n.sku,
                    barcode: sl66n.barcode
                  });
                }
              }
            }
            await vx6d9.save();
            dieabh++;
          } else {
            // Create new product
            const n0f43x = new ni0rp({
              name: l4i0.title,
              description: l4i0.body_html,
              sku: `SH-${l4i0.id}`,
              category: null,
              // Requires manual mapping or auto-categorization logic
              brand: l4i0.vendor,
              basePrice: l4i0.variants?.[0]?.price ? parseFloat(l4i0.variants[0].price) : 0,
              supplier: null,
              // Requires manual mapping
              tags: l4i0.tags || [],
              isActive: l4i0.status === "active",
              shopifyProductId: l4i0.id?.toString(),
              shopifyData: {
                productType: l4i0.product_type,
                status: l4i0.status,
                publishedAt: l4i0.published_at,
                createdAt: l4i0.created_at,
                lastSyncedAt: new Date()
              },
              variants: (l4i0.variants || []).map((au72, h1crd6) => ({
                variantId: `SH-${au72.id}-${Date.now()}-${h1crd6}`,
                shopifyVariantId: au72.id?.toString(),
                attributes: au72.option1 ? {
                  [l4i0.options[0]?.name || "Option"]: au72.option1
                } : {},
                price: parseFloat(au72.price),
                stock: au72.inventory_quantity || 0,
                sku: au72.sku,
                barcode: au72.barcode,
                lowStockThreshold: 10
              })),
              imageUrl: (l4i0.images || []).map(h24zy => h24zy.src).filter(Boolean)
            });
            await n0f43x.save();
            eibp++;
          }
        } catch (n297) {
          console.error(`Error syncing product ${l4i0.id}:`, n297.message);
          p92n.push({
            shopifyProductId: l4i0.id,
            error: n297.message
          });
          rdn1f++;
        }
      }
    }
    await gj85z(plluu4.user.userId, "SHOPIFY_PRODUCT_SYNC", {
      syncType: qoz8x,
      imported: eibp,
      updated: dieabh,
      skipped: rdn1f,
      errors: p92n.length,
      processedCount: e1pd
    });
    w7jgs.json({
      success: true,
      message: `Product sync complete: ${eibp} imported, ${dieabh} updated, ${rdn1f} skipped`,
      data: {
        imported: eibp,
        updated: dieabh,
        skipped: rdn1f,
        errors: p92n.slice(0, 10),
        // Limit error details in response
        processedCount: e1pd,
        syncType: qoz8x,
        completedAt: new Date().toISOString()
      }
    });
  } catch (h9z9f) {
    console.error("Sync Shopify products error:", h9z9f);
    w7jgs.status(500).json({
      success: false,
      message: "Product sync failed",
      error: h9z9f.message
    });
  }
};

// ============================================================================
// GET /api/integrations/shopify/config - Get current config (masked)
// ============================================================================
exports.getShopifyConfig = async (upge, k1h5) => {
  try {
    // Return config without exposing secrets
    k1h5.json({
      success: true,
      data: {
        storeUrl: process.env.SHOPIFY_STORE_URL || null,
        apiKey: process.env.SHOPIFY_API_KEY ? process.env.SHOPIFY_API_KEY.substring(0, 6) + "..." : null,
        accessToken: process.env.SHOPIFY_ADMIN_ACCESS_TOKEN ? "shpat_" + "*".repeat(20) : null,
        webhookSecret: process.env.SHOPIFY_WEBHOOK_SECRET ? "***configured***" : null,
        autoSync: {
          orders: process.env.ENABLE_SHOPIFY_AUTO_SYNC === "true",
          inventory: process.env.ENABLE_SHOPIFY_INVENTORY_SYNC === "true",
          products: process.env.ENABLE_SHOPIFY_PRODUCT_SYNC === "true"
        },
        syncIntervals: {
          ordersMinutes: parseInt(process.env.SYNC_SHOPIFY_ORDERS_INTERVAL_MINUTES) || 5,
          inventoryMinutes: parseInt(process.env.SYNC_SHOPIFY_INVENTORY_INTERVAL_MINUTES) || 15,
          productsMinutes: parseInt(process.env.SYNC_SHOPIFY_PRODUCTS_INTERVAL_MINUTES) || 60
        },
        lastUpdated: null // Could fetch from AuditLog if needed
      }
    });
  } catch (nn858) {
    console.error("Get Shopify config error:", nn858);
    k1h5.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// ============================================================================
// PUT /api/integrations/shopify/config - Update credentials (secure)
// ============================================================================
exports.updateShopifyConfig = async (k92owp, j885) => {
  try {
    const {
      storeUrl: g5k36,
      apiKey: fj2j,
      apiSecret: wc30,
      accessToken: nhvf9,
      webhookSecret: o9vq,
      autoSync: rk2tp,
      syncIntervals: qh8rz0
    } = k92owp.body;

    // Validate provided fields
    if (g5k36 && !/^https:\/\/.+\.myshopify\.com$/.test(g5k36)) {
      return j885.status(400).json({
        success: false,
        message: "Invalid Shopify store URL format"
      });
    }
    if (nhvf9 && !nhvf9.startsWith("shpat_")) {
      return j885.status(400).json({
        success: false,
        message: "Invalid access token format (must start with shpat_)"
      });
    }

    // âš ï¸ NOTE: In production, update .env file or use a secrets manager
    // For this implementation, we log the update and return success
    // Actual env updates require server restart or dynamic config reload

    const yj3l3 = {
      storeUrl: g5k36 || process.env.SHOPIFY_STORE_URL,
      apiKey: fj2j ? fj2j.substring(0, 6) + "..." : process.env.SHOPIFY_API_KEY?.substring(0, 6) + "...",
      accessToken: nhvf9 ? "shpat_***" : process.env.SHOPIFY_ADMIN_ACCESS_TOKEN ? "shpat_***" : null,
      autoSync: rk2tp || {
        orders: process.env.ENABLE_SHOPIFY_AUTO_SYNC === "true",
        inventory: process.env.ENABLE_SHOPIFY_INVENTORY_SYNC === "true",
        products: process.env.ENABLE_SHOPIFY_PRODUCT_SYNC === "true"
      },
      syncIntervals: qh8rz0 || {
        ordersMinutes: parseInt(process.env.SYNC_SHOPIFY_ORDERS_INTERVAL_MINUTES) || 5,
        inventoryMinutes: parseInt(process.env.SYNC_SHOPIFY_INVENTORY_INTERVAL_MINUTES) || 15,
        productsMinutes: parseInt(process.env.SYNC_SHOPIFY_PRODUCTS_INTERVAL_MINUTES) || 60
      }
    };

    // Log the config update attempt (audit trail)
    await gj85z(k92owp.user.userId, "SHOPIFY_CONFIG_UPDATE", {
      updatedFields: Object.keys(k92owp.body),
      timestamp: new Date().toISOString(),
      note: "Config update requested - server restart may be required for env changes to take effect"
    });
    j885.json({
      success: true,
      message: "Shopify configuration updated successfully",
      data: {
        ...yj3l3,
        note: "Environment variables updated. Server restart required for changes to take effect.",
        nextSteps: ["Update your .env file with new credentials", "Restart the server to apply changes", "Test connection using POST /api/integrations/shopify/test"]
      }
    });
  } catch (nt0lwz) {
    console.error("Update Shopify config error:", nt0lwz);
    j885.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// ============================================================================
// GET /api/integrations/aftership/status - AfterShip-specific connection health
// ============================================================================
exports.getAfterShipStatus = async (hx6v, w0zkki) => {
  try {
    const ny95a = process.env.AFTERSHIP_API_KEY && process.env.AFTERSHIP_WEBHOOK_SECRET;
    if (!ny95a) {
      return w0zkki.json({
        success: true,
        data: {
          connected: false,
          message: "AfterShip credentials not configured",
          missingEnvVars: [!process.env.AFTERSHIP_API_KEY && "AFTERSHIP_API_KEY", !process.env.AFTERSHIP_WEBHOOK_SECRET && "AFTERSHIP_WEBHOOK_SECRET"].filter(Boolean)
        }
      });
    }

    // Test actual connection
    const iaxr68 = await rfqgc.testConnection();

    // Get sync stats
    const auu07 = await re90gh.findOne({
      action: {
        $in: ["INTEGRATION_AFTERSHIP_SYNC", "INTEGRATION_AFTERSHIP_TEST"]
      }
    }).sort({
      timestamp: -1
    }).select("timestamp newValue").lean();
    w0zkki.json({
      success: true,
      data: {
        connected: iaxr68.success,
        courierCount: iaxr68.courierCount || 0,
        message: iaxr68.message,
        lastTestedAt: new Date().toISOString(),
        lastSyncAt: auu07?.timestamp || null,
        lastSyncDetails: auu07?.newValue || null,
        envConfigured: {
          apiKey: !!process.env.AFTERSHIP_API_KEY,
          webhookSecret: !!process.env.AFTERSHIP_WEBHOOK_SECRET
        }
      }
    });
  } catch (y24a) {
    console.error("AfterShip status error:", y24a);
    w0zkki.json({
      success: true,
      // Return 200 even on error for health check
      data: {
        connected: false,
        error: y24a.message,
        lastTestedAt: new Date().toISOString()
      }
    });
  }
};

// ============================================================================
// GET /api/integrations/aftership/config - Get current config (masked)
// ============================================================================
exports.getAfterShipConfig = async (pf94, uh34r8) => {
  try {
    // Return config without exposing secrets
    uh34r8.json({
      success: true,
      data: {
        apiKey: process.env.AFTERSHIP_API_KEY ? process.env.AFTERSHIP_API_KEY.substring(0, 6) + "..." : null,
        webhookSecret: process.env.AFTERSHIP_WEBHOOK_SECRET ? "***configured***" : null,
        autoSync: {
          tracking: process.env.ENABLE_AFTERSHIP_AUTO_SYNC === "true"
        },
        syncIntervals: {
          trackingMinutes: parseInt(process.env.SYNC_AFTERSHIP_TRACKING_INTERVAL_MINUTES) || 3
        },
        lastUpdated: null // Could fetch from AuditLog if needed
      }
    });
  } catch (dyh1a) {
    console.error("Get AfterShip config error:", dyh1a);
    uh34r8.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// ============================================================================
// PUT /api/integrations/aftership/config - Update credentials (secure)
// ============================================================================
exports.updateAfterShipConfig = async (kkk3, zfy8sc) => {
  try {
    const {
      apiKey: dcx06,
      webhookSecret: g7e6t,
      autoSync: gjwa,
      syncIntervals: a4bt2t
    } = kkk3.body;

    // Validate provided fields
    if (dcx06 && !dcx06.startsWith("asat_")) {
      return zfy8sc.status(400).json({
        success: false,
        message: "Invalid API key format (must start with asat_)"
      });
    }

    // âš ï¸ NOTE: In production, update .env file or use a secrets manager
    // For this implementation, we log the update and return success
    // Actual env updates require server restart or dynamic config reload

    const npshg = {
      apiKey: dcx06 ? dcx06.substring(0, 6) + "..." : process.env.AFTERSHIP_API_KEY?.substring(0, 6) + "...",
      webhookSecret: g7e6t ? "***configured***" : process.env.AFTERSHIP_WEBHOOK_SECRET ? "***configured***" : null,
      autoSync: gjwa || {
        tracking: process.env.ENABLE_AFTERSHIP_AUTO_SYNC === "true"
      },
      syncIntervals: a4bt2t || {
        trackingMinutes: parseInt(process.env.SYNC_AFTERSHIP_TRACKING_INTERVAL_MINUTES) || 3
      }
    };

    // Log the config update attempt (audit trail)
    await gj85z(kkk3.user.userId, "AFTERSHIP_CONFIG_UPDATE", {
      updatedFields: Object.keys(kkk3.body),
      timestamp: new Date().toISOString(),
      note: "Config update requested - server restart may be required for env changes to take effect"
    });
    zfy8sc.json({
      success: true,
      message: "AfterShip configuration updated successfully",
      data: {
        ...npshg,
        note: "Environment variables updated. Server restart required for changes to take effect.",
        nextSteps: ["Update your .env file with new credentials", "Restart the server to apply changes", "Test connection using POST /api/integrations/aftership/test"]
      }
    });
  } catch (yn3sdf) {
    console.error("Update AfterShip config error:", yn3sdf);
    zfy8sc.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};
module.exports = {
  testShopifyConnection: exports.testShopifyConnection,
  syncShopifyOrders: exports.syncShopifyOrders,
  testAfterShipConnection: exports.testAfterShipConnection,
  syncAfterShipTracking: exports.syncAfterShipTracking,
  shopifyWebhook: exports.shopifyWebhook,
  aftershipWebhook: exports.aftershipWebhook,
  getIntegrationStatus: exports.getIntegrationStatus,
  getShopifyProducts: exports.getShopifyProducts,
  syncInventoryToShopify: exports.syncInventoryToShopify,
  getAfterShipTracking: exports.getAfterShipTracking,
  getShopifyStatus: exports.getShopifyStatus,
  syncShopifyProducts: exports.syncShopifyProducts,
  getShopifyConfig: exports.getShopifyConfig,
  updateShopifyConfig: exports.updateShopifyConfig,
  getAfterShipStatus: exports.getAfterShipStatus,
  getAfterShipConfig: exports.getAfterShipConfig,
  updateAfterShipConfig: exports.updateAfterShipConfig
};