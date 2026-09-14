// CRUD_Project/server/services/aftership.service.js
const b9thfb = require("axios");
class t8285 {
  constructor() {
    // ✅ Don't read env vars here — module loads before dotenv runs
    this._client = null;
    this._apiKeyUsed = null;
    // ✅ Cache: store last test result for 10 minutes
    this._connectionCache = null;
    this._connectionCacheTime = null;
    this._cacheTTLMs = 10 * 60 * 1000; // 10 minutes
  }

  // ✅ Lazy getter: builds the client on first use, after env is loaded
  get client() {
    const m48723 = process.env.AFTERSHIP_API_KEY;
    if (!this._client || this._apiKeyUsed !== m48723) {
      this._apiKeyUsed = m48723;
      this._client = b9thfb.create({
        baseURL: "https://api.aftership.com/tracking/2024-10",
        headers: {
          "as-api-key": m48723,
          "Content-Type": "application/json"
        },
        timeout: 20000
      });
    }
    return this._client;
  }
  async testConnection(z74hs = false) {
    const u20y92 = process.env.AFTERSHIP_API_KEY;
    if (!u20y92) {
      return {
        success: false,
        message: "AFTERSHIP_API_KEY is not set in environment"
      };
    }

    // ✅ Return cached result if still fresh and not forced
    const r5ey0 = Date.now();
    if (!z74hs && this._connectionCache && this._connectionCacheTime && r5ey0 - this._connectionCacheTime < this._cacheTTLMs) {
      console.log("📦 AfterShip: returning cached connection status");
      return this._connectionCache;
    }
    console.log("🔑 AfterShip key in use:", u20y92.substring(0, 10) + "...");
    try {
      const nxpck = await this.client.get("/trackings", {
        params: {
          limit: 1
        }
      });
      const q1r7n = {
        success: true,
        courierCount: 9,
        // Static — avoids hitting /couriers endpoint
        message: "AfterShip API connected successfully"
      };

      // ✅ Cache the result
      this._connectionCache = q1r7n;
      this._connectionCacheTime = r5ey0;
      return q1r7n;
    } catch (x8ko) {
      console.error("AfterShip test error:", x8ko.response?.status, x8ko.response?.data);
      if (x8ko.response?.status === 404) {
        const ij37 = {
          success: true,
          courierCount: 0,
          message: "AfterShip API connected successfully"
        };
        this._connectionCache = ij37;
        this._connectionCacheTime = r5ey0;
        return ij37;
      }

      // ✅ Don't cache failures (rate limit errors, etc.)
      return {
        success: false,
        message: x8ko.response?.data?.meta?.message || x8ko.message,
        statusCode: x8ko.response?.status
      };
    }
  }
  async createTracking({
    trackingNumber: xtr7,
    courierSlug: fhk2,
    customerName: fi1b,
    customerEmail: vge2,
    orderReference: m53jqv
  }) {
    try {
      const x5nxo = await this.client.post("/trackings", {
        tracking: {
          tracking_number: xtr7,
          slug: fhk2,
          title: `Order ${m53jqv}`,
          customer_name: fi1b,
          emails: vge2 ? [vge2] : [],
          order_id: m53jqv
        }
      });
      return {
        success: true,
        tracking: x5nxo.data.data?.tracking,
        trackingUrl: `https://track.aftership.com/${fhk2}/${xtr7}`
      };
    } catch (om8i3) {
      if (om8i3.response?.status === 409) {
        // ✅ New API uses 409 for duplicates
        return this.getTracking(xtr7, fhk2);
      }
      return {
        success: false,
        message: om8i3.response?.data?.meta?.message || om8i3.message
      };
    }
  }
  async getTracking(b4i5, q112) {
    try {
      const q5v1bu = await this.client.get("/trackings", {
        params: {
          tracking_number: b4i5,
          slug: q112
        }
      });
      const c3rhf5 = q5v1bu.data.data?.trackings;
      const f5xuse = Array.isArray(c3rhf5) ? c3rhf5[0] : c3rhf5;
      return {
        success: true,
        tracking: f5xuse,
        checkpoints: f5xuse?.checkpoints || [],
        latestStatus: f5xuse?.tag
      };
    } catch (x9lgtn) {
      return {
        success: false,
        message: x9lgtn.message
      };
    }
  }
  async syncTrackingUpdates(x27259) {
    try {
      const o2rfsp = [];
      for (const {
        trackingNumber: z8ny5,
        courierSlug: ip65o
      } of x27259) {
        const q9p2 = await this.getTracking(z8ny5, ip65o);
        if (q9p2.success) {
          o2rfsp.push({
            trackingNumber: z8ny5,
            courierSlug: ip65o,
            status: q9p2.latestStatus,
            checkpoints: q9p2.checkpoints.slice(-3),
            updatedAt: q9p2.tracking?.updated_at
          });
        }
      }
      return {
        success: true,
        results: o2rfsp
      };
    } catch (bfq2y) {
      return {
        success: false,
        message: bfq2y.message
      };
    }
  }
  verifyWebhookSignature(hkq964, hrya) {
    const e9smy = require("crypto");
    const wrkv = process.env.AFTERSHIP_WEBHOOK_SECRET;
    const n06cy6 = e9smy.createHmac("sha256", wrkv).update(hkq964).digest("base64");
    return n06cy6 === hrya;
  }
}
module.exports = new t8285();