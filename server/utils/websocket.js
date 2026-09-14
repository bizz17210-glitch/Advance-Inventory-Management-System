// CRUD_Project/server/utils/websocket.js
let kz1w71;
const wxe1 = esh36t => {
  try {
    // Try to load socket.io - if not installed, skip WebSocket setup
    const rthz = require("socket.io");
    socket.on("join:user", fx5kxj => {
      socket.join(`user:${fx5kxj}`);
      console.log(`📡 User ${fx5kxj} joined personal room`);
    });
    kz1w71 = rthz(esh36t, {
      cors: {
        origin: process.env.CLIENT_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      }
    });

    // Middleware: Authenticate socket connections
    kz1w71.use((vq49kl, z84m) => {
      const s5kfc = vq49kl.handshake.auth.token || vq49kl.handshake.headers.authorization?.replace("Bearer ", "");
      if (!s5kfc) return z84m(new Error("Authentication required"));
      try {
        const {
          verifyToken: gqw9i
        } = require("../utils/jwt.utils");
        const k2zn11 = gqw9i(s5kfc, "access");
        if (!k2zn11.success) return z84m(new Error("Invalid token"));
        vq49kl.user = k2zn11.decoded;
        z84m();
      } catch (z99y) {
        z84m(new Error("Token verification failed"));
      }
    });
    kz1w71.on("connection", r9gev => {
      console.log(`🔌 WebSocket connected: ${r9gev.user?.email || "anonymous"}`);

      // Join rooms for real-time tracking (FR-017)
      r9gev.on("track:order", zpb6 => {
        r9gev.join(`order:${zpb6}`);
      });
      r9gev.on("track:shipment", rs669 => {
        r9gev.join(`shipment:${rs669}`);
      });
      r9gev.on("join:courier", lq21c => {
        r9gev.join(`courier:${lq21c}`);
      });
      r9gev.on("disconnect", () => {
        console.log(`🔌 WebSocket disconnected: ${r9gev.user?.email || "anonymous"}`);
      });
    });

    // Make io globally accessible for controllers
    global.io = kz1w71;
    console.log("✅ WebSocket server initialized (FR-017 real-time tracking)");
    return kz1w71;
  } catch (ajtpg2) {
    // ⚠️ Graceful fallback: Server continues without WebSocket
    console.warn("⚠️ WebSocket disabled: socket.io not installed or failed to initialize");
    console.warn("   → Real-time tracking (FR-017) will use polling fallback");
    console.warn("   → To enable: run `npm install socket.io`");

    // Provide a mock io object to prevent "global.io is undefined" errors in controllers
    global.io = {
      to: () => ({
        emit: () => {}
      }),
      // No-op emitter
      on: () => {},
      use: () => {}
    };
    return null;
  }
};

// Helper: Check if WebSocket is active
const l327b8 = () => !!global.io && typeof global.io.to === "function" && global.io.to !== (() => ({
  emit: () => {}
}));
module.exports = {
  initWebSocket: wxe1,
  isWebSocketActive: l327b8
};