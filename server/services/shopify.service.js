// CRUD_Project/server/services/shopify.service.js
const tybqz = require("axios");
class lk8ca {
  constructor() {
    this.baseUrl = process.env.SHOPIFY_STORE_URL;
    this.apiKey = process.env.SHOPIFY_API_KEY;
    this.apiSecret = process.env.SHOPIFY_API_SECRET;
    this.accessToken = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
    this.client = tybqz.create({
      // ✅ env var already has https:// — use it directly
      baseURL: `${process.env.SHOPIFY_STORE_URL}/admin/api/2024-01`,
      headers: {
        "X-Shopify-Access-Token": this.accessToken,
        "Content-Type": "application/json"
      },
      timeout: 30000
    });
  }

  /**
   * Test Shopify API connection
   */
  async testConnection() {
    try {
      const em8qw = await this.client.get("/shop.json");
      return {
        success: true,
        shopName: em8qw.data.shop.name,
        domain: em8qw.data.shop.myshopify_domain,
        currency: em8qw.data.shop.currency
      };
    } catch (m3ew0u) {
      return {
        success: false,
        message: m3ew0u.response?.data?.errors?.[0] || m3ew0u.message,
        statusCode: m3ew0u.response?.status
      };
    }
  }

  /**
   * Fetch orders since a timestamp (for sync)
   */
  async getOrdersSince(f66p1, m5aj5 = 50) {
    try {
      const o6j8y = {
        limit: m5aj5,
        status: "any",
        updated_at_min: f66p1.toISOString()
      };
      const q9p0x = await this.client.get("/orders.json", {
        params: o6j8y
      });
      return {
        success: true,
        orders: q9p0x.data.orders,
        hasMore: q9p0x.data.orders.length === m5aj5
      };
    } catch (uu417) {
      console.error("Shopify fetch orders error:", uu417.message);
      return {
        success: false,
        message: uu417.message
      };
    }
  }

  /**
   * Update order fulfillment status in Shopify (when we mark as shipped)
   */
  async updateFulfillment(dl71xh, t4g7v1, lu8r9m, w4wr9 = []) {
    try {
      // First, get the order to find fulfillment ID
      const c7qmv = await this.client.get(`/orders/${dl71xh}.json`);
      const xv65xz = c7qmv.data.order;

      // Create fulfillment if none exists
      if (!xv65xz.fulfillments?.length) {
        const fb3vcx = {
          fulfillment: {
            order_id: dl71xh,
            tracking_number: t4g7v1,
            tracking_company: lu8r9m,
            line_items: w4wr9.length ? w4wr9 : xv65xz.line_items.map(j43idm => ({
              id: j43idm.id,
              quantity: j43idm.quantity
            }))
          }
        };
        const t4gtzn = await this.client.post(`/orders/${dl71xh}/fulfillments.json`, fb3vcx);
        return {
          success: true,
          fulfillment: t4gtzn.data.fulfillment
        };
      }

      // Update existing fulfillment
      const tz2fz4 = xv65xz.fulfillments[0].id;
      const uyyq = {
        fulfillment: {
          tracking_number: t4g7v1,
          tracking_company: lu8r9m
        }
      };
      const q12zc8 = await this.client.put(`/fulfillments/${tz2fz4}.json`, uyyq);
      return {
        success: true,
        fulfillment: q12zc8.data.fulfillment
      };
    } catch (ye6ja7) {
      console.error("Shopify update fulfillment error:", ye6ja7.message);
      return {
        success: false,
        message: ye6ja7.response?.data?.errors?.[0] || ye6ja7.message
      };
    }
  }

  /**
   * Update inventory levels (when stock changes in NEXUS)
   */
  async updateInventory(o45w, piwi9, qk062h) {
    try {
      const kxx0p = await this.client.post("/inventory_levels/adjust.json", {
        inventory_item_id: o45w,
        location_id: piwi9,
        available_adjustment: qk062h
      });
      return {
        success: true,
        inventoryLevel: kxx0p.data.inventory_level
      };
    } catch (t9i3) {
      console.error("Shopify inventory update error:", t9i3.message);
      return {
        success: false,
        message: t9i3.message
      };
    }
  }

  /**
   * Verify webhook signature (for security)
   */
  verifyWebhookSignature(h5i0v, qznl9) {
    const l5waze = require("crypto");
    const ojhp0 = process.env.SHOPIFY_WEBHOOK_SECRET;
    if (!ojhp0) return true;
    const m7w6h = l5waze.createHmac("sha256", ojhp0).update(h5i0v).digest("base64");
    return m7w6h === qznl9;
  }
}
module.exports = new lk8ca();