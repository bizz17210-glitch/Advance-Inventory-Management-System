// CRUD_Project/server/services/trackingmore.service.js
const ineze = require("axios");
class lnr4 {
  constructor() {
    this._client = null;
    this._apiKeyUsed = null;
    this._connectionCache = null;
    this._connectionCacheTime = null;
    this._cacheTTLMs = 10 * 60 * 1000; // 10 minutes cache
  }

  // ✅ Lazy client — reads env at call time, not at startup
  get client() {
    const c7h5y = process.env.TRACKINGMORE_API_KEY;
    if (!this._client || this._apiKeyUsed !== c7h5y) {
      this._apiKeyUsed = c7h5y;
      this._client = ineze.create({
        baseURL: "https://api.trackingmore.com/v4",
        headers: {
          "Tracking-Api-Key": c7h5y,
          "Content-Type": "application/json"
        },
        timeout: 20000
      });
    }
    return this._client;
  }

  // ─── Test Connection ────────────────────────────────────────────────────────
  async testConnection(i9ds = false) {
    const j9yu0 = process.env.TRACKINGMORE_API_KEY;
    if (!j9yu0) {
      return {
        success: false,
        message: "TRACKINGMORE_API_KEY is not set in environment"
      };
    }

    // Return cached result if still fresh
    const wbal2 = Date.now();
    if (!i9ds && this._connectionCache && this._connectionCacheTime && wbal2 - this._connectionCacheTime < this._cacheTTLMs) {
      console.log("📦 TrackingMore: returning cached connection status");
      return this._connectionCache;
    }
    console.log("🔑 TrackingMore key in use:", j9yu0.substring(0, 10) + "...");
    try {
      // Use /couriers endpoint to verify connection
      const y09x = await this.client.get("/couriers", {
        params: {
          limit: 1
        }
      });
      const evf9 = {
        success: true,
        courierCount: y09x.data.data?.total || 1200,
        message: "TrackingMore API connected successfully"
      };
      this._connectionCache = evf9;
      this._connectionCacheTime = wbal2;
      return evf9;
    } catch (oyfd) {
      console.error("TrackingMore test error:", oyfd.response?.status, oyfd.response?.data);
      return {
        success: false,
        message: oyfd.response?.data?.meta?.message || oyfd.message,
        statusCode: oyfd.response?.status
      };
    }
  }

  // ─── Create Tracking ────────────────────────────────────────────────────────
  async createTracking({
    trackingNumber: bbd7,
    courierSlug: mloj4f,
    customerName: zz70l0,
    customerEmail: kcm7,
    orderReference: nb6w60
  }) {
    try {
      const s05u = await this.client.post("/trackings", {
        tracking_number: bbd7,
        courier_code: mloj4f,
        order_number: nb6w60,
        customer_name: zz70l0 || "",
        customer_email: kcm7 || "",
        title: `Order ${nb6w60}`
      });
      return {
        success: true,
        tracking: s05u.data.data,
        trackingUrl: `https://www.trackingmore.com/track/en/${bbd7}`
      };
    } catch (r18l99) {
      // 409 = tracking already exists
      if (r18l99.response?.status === 409) {
        console.log("📦 Tracking already exists, fetching existing...");
        return this.getTracking(bbd7, mloj4f);
      }
      return {
        success: false,
        message: r18l99.response?.data?.meta?.message || r18l99.message
      };
    }
  }

  // ─── Get Single Tracking ────────────────────────────────────────────────────
  async getTracking(srht, jc09) {
    try {
      const p109 = await this.client.get(`/trackings/${jc09}/${srht}`);
      const qlv62 = p109.data.data;

      // Normalize checkpoints from TrackingMore format
      const tbnssa = qlv62?.origin_info?.trackinfo || [];
      const dge73n = tbnssa.map(jjan7p => ({
        message: jjan7p.StatusDescription || jjan7p.Details || "",
        location: jjan7p.Details || "",
        checkpoint_time: jjan7p.Date || null
      }));
      return {
        success: true,
        tracking: qlv62,
        checkpoints: dge73n,
        latestStatus: qlv62?.status || "unknown"
      };
    } catch (ln5n) {
      return {
        success: false,
        message: ln5n.message
      };
    }
  }

  // ─── Sync Multiple Trackings ────────────────────────────────────────────────
  async syncTrackingUpdates(gguee1) {
    try {
      const jt02c = [];
      for (const {
        trackingNumber: i50g,
        courierSlug: h70f7j
      } of gguee1) {
        const g4jp1m = await this.getTracking(i50g, h70f7j);
        if (g4jp1m.success) {
          jt02c.push({
            trackingNumber: i50g,
            courierSlug: h70f7j,
            status: g4jp1m.latestStatus,
            checkpoints: g4jp1m.checkpoints.slice(-3),
            updatedAt: g4jp1m.tracking?.updated_at || new Date().toISOString()
          });
        }
      }
      return {
        success: true,
        results: jt02c
      };
    } catch (pqy3w) {
      return {
        success: false,
        message: pqy3w.message
      };
    }
  }

  // ─── Get All Trackings (paginated) ──────────────────────────────────────────
  async getAllTrackings({
    page: qhfg = 1,
    limit: dl20 = 20,
    status: t2me8
  } = {}) {
    try {
      const e2qi50 = {
        page: qhfg,
        limit: dl20
      };
      if (t2me8) e2qi50.tracking_status = t2me8;
      const ms6x4j = await this.client.get("/trackings", {
        params: e2qi50
      });
      return {
        success: true,
        trackings: ms6x4j.data.data?.items || [],
        total: ms6x4j.data.data?.total || 0,
        page: qhfg,
        limit: dl20
      };
    } catch (d88t1) {
      return {
        success: false,
        message: d88t1.message
      };
    }
  }

  // ─── Delete Tracking ────────────────────────────────────────────────────────
  async deleteTracking(dueu2, psn73) {
    try {
      await this.client.delete(`/trackings/${psn73}/${dueu2}`);
      return {
        success: true,
        message: "Tracking deleted successfully"
      };
    } catch (asjq3n) {
      return {
        success: false,
        message: asjq3n.message
      };
    }
  }

  // ─── Get Supported Couriers ─────────────────────────────────────────────────
  async getCouriers(kp5u = "") {
    try {
      const l9baye = {
        limit: 50
      };
      if (kp5u) l9baye.keyword = kp5u;
      const k9xmy = await this.client.get("/couriers", {
        params: l9baye
      });
      return {
        success: true,
        couriers: k9xmy.data.data?.items || [],
        total: k9xmy.data.data?.total || 0
      };
    } catch (u828) {
      return {
        success: false,
        message: u828.message
      };
    }
  }

  // ─── Detect Courier from Tracking Number ────────────────────────────────────
  async detectCourier(c6isq) {
    try {
      const x61h = await this.client.post("/couriers/detect", {
        tracking_number: c6isq
      });
      return {
        success: true,
        couriers: x61h.data.data || []
      };
    } catch (e9v7u) {
      return {
        success: false,
        message: e9v7u.message
      };
    }
  }

  // ─── Webhook Signature Verification ────────────────────────────────────────
  verifyWebhookSignature(vif7w, c6839) {
    const tu6m = require("crypto");
    const q534 = process.env.TRACKINGMORE_WEBHOOK_SECRET;
    if (!q534) return true; // Skip verification if no secret configured

    const s71s1a = tu6m.createHmac("sha256", q534).update(vif7w).digest("hex");
    return s71s1a === c6839;
  }
}
module.exports = new lnr4();