// ═══════════════════════════════════════════════════════════
// IntegrationsTab.tsx  —  Live API for Shopify + Couriers + AfterShip
// ═══════════════════════════════════════════════════════════
import React, { useState, useEffect } from "react";
import { SectionDivider } from "./SettingsShared";
import { integrationsAPI, couriersAPI } from "../../services/api";

// ── IntegrationCard ────────────────────────────────────────

interface IntegrationCardProps {
  id: string;
  logoChar?: string;
  logoIcon?: string;
  logoColor: string;
  title: string;
  subtitle: string;
  desc: string;
  connected?: boolean;
  onConnect?: () => Promise<void>;
  onDisconnect?: () => void;
  children?: React.ReactNode;
}

const IntegrationCard: React.FC<IntegrationCardProps> = ({
  logoChar,
  logoIcon,
  logoColor,
  title,
  subtitle,
  desc,
  connected = false,
  onConnect,
  onDisconnect,
  children,
}) => {
  const [isConnected, setIsConnected] = useState(connected);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsConnected(connected);
  }, [connected]);

  const handleConnect = async () => {
    setLoading(true);
    setError(null);
    try {
      if (onConnect) {
        await onConnect();
        setIsConnected(true);
      } else {
        await new Promise((r) => setTimeout(r, 1500));
        setIsConnected(true);
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || "Connection failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    onDisconnect?.();
  };

  return (
    <div className="card">
      <div className="card-body" style={{ padding: 16 }}>
        <div className="int-card-header">
          <div
            className="int-logo"
            style={{ background: `${logoColor}20`, color: logoColor }}
          >
            {logoIcon ? (
              <i
                className={`${logoIcon} int-logo-icon`}
                style={{ color: logoColor }}
              />
            ) : (
              logoChar
            )}
          </div>
          <div>
            <div className="int-card-title">{title}</div>
            <div className="int-card-sub">{subtitle}</div>
          </div>
          <span
            className={`badge ${isConnected ? "green" : "gray"}`}
            style={{ marginLeft: "auto" }}
          >
            {isConnected ? "Connected" : "Not Connected"}
          </span>
        </div>
        <div className="int-card-desc">{desc}</div>
        {error && (
          <div style={{ fontSize: 10.5, color: "var(--red)", marginBottom: 8 }}>
            <i
              className="fa-solid fa-circle-exclamation"
              style={{ marginRight: 4 }}
            />
            {error}
          </div>
        )}
        {isConnected ? (
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="header-btn"
              style={{ flex: 1, justifyContent: "center" }}
            >
              <i className="fa-solid fa-gear" /> Configure
            </button>
            <button
              className="header-btn"
              style={{ color: "var(--red)", borderColor: "var(--red)" }}
              onClick={handleDisconnect}
            >
              <i className="fa-solid fa-unlink" />
            </button>
          </div>
        ) : (
          <>
            {children}
            <button
              className="header-btn primary"
              style={{ width: "100%", justifyContent: "center", marginTop: 8 }}
              onClick={handleConnect}
              disabled={loading}
            >
              {loading ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin" /> Connecting...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-plug" /> Connect {title}
                </>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

// ── Shopify Card (with real API) ───────────────────────────

const ShopifyCard: React.FC = () => {
  const [storeUrl, setStoreUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [connected, setConnected] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncDone, setSyncDone] = useState(false);

  // Check existing Shopify config on mount
  useEffect(() => {
    integrationsAPI
      .getShopifyConfig()
      .then((res) => {
        const cfg = res.data?.data ?? res.data;
        if (cfg?.storeUrl) {
          setStoreUrl(cfg.storeUrl);
          setConnected(true);
        }
      })
      .catch(() => {});
  }, []);

  const handleConnect = async () => {
    await integrationsAPI.testShopify();
    setConnected(true);
  };

  const handleSync = async () => {
    setSyncLoading(true);
    try {
      await integrationsAPI.syncShopifyOrders();
      setSyncDone(true);
      setTimeout(() => setSyncDone(false), 3000);
    } catch {
      // silent
    } finally {
      setSyncLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="card-body" style={{ padding: 16 }}>
        <div className="int-card-header">
          <div
            className="int-logo"
            style={{ background: "#96BF4820", color: "#96BF48" }}
          >
            S
          </div>
          <div>
            <div className="int-card-title">Shopify</div>
            <div className="int-card-sub">Order & inventory sync</div>
          </div>
          <span
            className={`badge ${connected ? "green" : "gray"}`}
            style={{ marginLeft: "auto" }}
          >
            {connected ? "Connected" : "Not Connected"}
          </span>
        </div>
        <div className="int-card-desc">
          Automatically pull confirmed Shopify orders, sync stock levels, and
          mark products as sold-out when inventory hits zero.
        </div>
        {connected ? (
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="header-btn primary"
              style={{ flex: 1, justifyContent: "center" }}
              onClick={handleSync}
              disabled={syncLoading}
            >
              {syncLoading ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin" /> Syncing...
                </>
              ) : syncDone ? (
                <>
                  <i className="fa-solid fa-circle-check" /> Synced!
                </>
              ) : (
                <>
                  <i className="fa-solid fa-rotate" /> Sync Orders
                </>
              )}
            </button>
            <button
              className="header-btn"
              style={{ color: "var(--red)", borderColor: "var(--red)" }}
              onClick={() => setConnected(false)}
            >
              <i className="fa-solid fa-unlink" />
            </button>
          </div>
        ) : (
          <>
            <div className="form-group" style={{ marginBottom: 8 }}>
              <div className="form-label">Store URL</div>
              <input
                className="form-input"
                placeholder="mystore.myshopify.com"
                style={{ width: "100%" }}
                value={storeUrl}
                onChange={(e) => setStoreUrl(e.target.value)}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 4 }}>
              <div className="form-label">API Key</div>
              <input
                className="form-input"
                type="password"
                placeholder="shpat_••••••••••••"
                style={{ width: "100%" }}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </div>
            <button
              className="header-btn primary"
              style={{ width: "100%", justifyContent: "center", marginTop: 8 }}
              onClick={handleConnect}
              disabled={!storeUrl || !apiKey}
            >
              <i className="fa-solid fa-plug" /> Connect Shopify
            </button>
          </>
        )}
      </div>
    </div>
  );
};

// ── AfterShip Card (with real API) ──────────────────────────

const AfterShipCard: React.FC = () => {
  const [apiKey, setApiKey] = useState("");
  const [connected, setConnected] = useState(false);
  const [courierCount, setCourierCount] = useState<number | null>(null);
  const [lastTestedAt, setLastTestedAt] = useState<string | null>(null);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check connection status on mount
  useEffect(() => {
    integrationsAPI
      .getAfterShipStatus()
      .then((res) => {
        const data = res.data?.data ?? res.data;
        if (data) {
          setConnected(!!data.connected);
          setCourierCount(data.courierCount ?? null);
          setLastTestedAt(data.lastTestedAt ?? null);
        }
      })
      .catch(() => {});
  }, []);

  const handleConnect = async () => {
    setError(null);
    try {
      const res = await integrationsAPI.testAfterShip();
      const data = res.data?.data ?? res.data;
      setConnected(true);
      setCourierCount(data?.courierCount ?? null);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Connection failed");
    }
  };

  const handleSync = async () => {
    setSyncLoading(true);
    setSyncResult(null);
    try {
      const res = await integrationsAPI.syncAfterShip();
      const msg = res.data?.message ?? "Sync complete";
      setSyncResult(msg);
      setTimeout(() => setSyncResult(null), 4000);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Sync failed");
    } finally {
      setSyncLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="card-body" style={{ padding: 16 }}>
        <div className="int-card-header">
          <div
            className="int-logo"
            style={{ background: "#1F3A9320", color: "#1F3A93" }}
          >
            <i className="fa-solid fa-truck-fast int-logo-icon" />
          </div>
          <div>
            <div className="int-card-title">AfterShip</div>
            <div className="int-card-sub">Shipment tracking sync</div>
          </div>
          <span
            className={`badge ${connected ? "green" : "gray"}`}
            style={{ marginLeft: "auto" }}
          >
            {connected ? "Connected" : "Not Connected"}
          </span>
        </div>
        <div className="int-card-desc">
          Sync live tracking statuses for active shipments from AfterShip into
          NEXUS, keeping order delivery status up to date automatically.
          {connected && courierCount != null && (
            <>
              {" "}
              Currently tracking <strong>{courierCount}</strong> supported
              couriers.
            </>
          )}
        </div>
        {error && (
          <div style={{ fontSize: 10.5, color: "var(--red)", marginBottom: 8 }}>
            <i
              className="fa-solid fa-circle-exclamation"
              style={{ marginRight: 4 }}
            />
            {error}
          </div>
        )}
        {syncResult && (
          <div
            style={{ fontSize: 10.5, color: "var(--green)", marginBottom: 8 }}
          >
            <i
              className="fa-solid fa-circle-check"
              style={{ marginRight: 4 }}
            />
            {syncResult}
          </div>
        )}
        {connected ? (
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="header-btn primary"
              style={{ flex: 1, justifyContent: "center" }}
              onClick={handleSync}
              disabled={syncLoading}
            >
              {syncLoading ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin" /> Syncing...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-rotate" /> Sync Tracking
                </>
              )}
            </button>
            <button
              className="header-btn"
              style={{ color: "var(--red)", borderColor: "var(--red)" }}
              onClick={() => setConnected(false)}
            >
              <i className="fa-solid fa-unlink" />
            </button>
          </div>
        ) : (
          <>
            <div className="form-group" style={{ marginBottom: 4 }}>
              <div className="form-label">API Key</div>
              <input
                className="form-input"
                type="password"
                placeholder="asat_••••••••••••"
                style={{ width: "100%" }}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </div>
            <button
              className="header-btn primary"
              style={{ width: "100%", justifyContent: "center", marginTop: 8 }}
              onClick={handleConnect}
            >
              <i className="fa-solid fa-plug" /> Test & Connect AfterShip
            </button>
          </>
        )}
        {lastTestedAt && (
          <div
            style={{ fontSize: 9.5, color: "var(--text-muted)", marginTop: 8 }}
          >
            Last tested:{" "}
            {new Date(lastTestedAt).toLocaleString("en-PK", {
              day: "2-digit",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Courier Table (live) ───────────────────────────────────

const CourierTable: React.FC = () => {
  const [couriers, setCouriers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [testLoading, setTestLoading] = useState<Record<string, boolean>>({});
  const [testResult, setTestResult] = useState<Record<string, "ok" | "fail">>(
    {},
  );

  useEffect(() => {
    couriersAPI
      .getAll({ limit: 20 })
      .then((res) => {
        const items =
          res.data?.data?.couriers ??
          res.data?.data ??
          res.data?.couriers ??
          [];
        setCouriers(Array.isArray(items) ? items : []);
      })
      .catch(() => setCouriers([]))
      .finally(() => setLoading(false));
  }, []);

  const handleTest = async (courierId: string) => {
    setTestLoading((prev) => ({ ...prev, [courierId]: true }));
    try {
      await couriersAPI.testConnection(courierId);
      setTestResult((prev) => ({ ...prev, [courierId]: "ok" }));
    } catch {
      setTestResult((prev) => ({ ...prev, [courierId]: "fail" }));
    } finally {
      setTestLoading((prev) => ({ ...prev, [courierId]: false }));
      setTimeout(
        () =>
          setTestResult((prev) => {
            const n = { ...prev };
            delete n[courierId];
            return n;
          }),
        3000,
      );
    }
  };

  const handleSync = async (courierId: string) => {
    try {
      await couriersAPI.sync(courierId);
    } catch {
      /* silent */
    }
  };

  return (
    <div className="card" style={{ marginBottom: 14 }}>
      <div className="card-header">
        <div className="card-title">
          <i className="fa-solid fa-truck" /> Courier API Credentials
        </div>
        <button className="header-btn primary">
          <i className="fa-solid fa-plus" /> Add Courier API
        </button>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Courier</th>
              <th>Type</th>
              <th>API Key</th>
              <th>Status</th>
              <th>Last Sync</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 6 }).map((__, j) => (
                    <td key={j}>
                      <div
                        style={{
                          height: 12,
                          background: "var(--divider)",
                          borderRadius: 4,
                          width: "70%",
                        }}
                      />
                    </td>
                  ))}
                </tr>
              ))
            ) : couriers.length ? (
              couriers.map((c: any) => {
                const isTestLoading = testLoading[c._id];
                const result = testResult[c._id];
                const isActive = c.isActive ?? c.status === "active";
                return (
                  <tr key={c._id}>
                    <td>
                      <strong>{c.name ?? c.courier}</strong>
                    </td>
                    <td>
                      <span className="tag">
                        {c.type ?? c.serviceType ?? "—"}
                      </span>
                    </td>
                    <td>
                      <code className="courier-endpoint-code">
                        {c.apiKey
                          ? `${c.apiKey.slice(0, 6)}••••`
                          : "Not configured"}
                      </code>
                    </td>
                    <td>
                      <span className={`badge ${isActive ? "green" : "red"}`}>
                        {isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{ fontSize: 10.5, color: "var(--text-muted)" }}
                      >
                        {c.lastSync
                          ? new Date(c.lastSync).toLocaleDateString("en-PK", {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "—"}
                      </span>
                    </td>
                    <td>
                      <button
                        className="header-btn"
                        style={{
                          height: 24,
                          fontSize: 10,
                          padding: "0 7px",
                          marginRight: 4,
                          color:
                            result === "ok"
                              ? "var(--green)"
                              : result === "fail"
                                ? "var(--red)"
                                : undefined,
                        }}
                        onClick={() => handleTest(c._id)}
                        disabled={isTestLoading}
                      >
                        {isTestLoading ? (
                          <i className="fa-solid fa-spinner fa-spin" />
                        ) : result === "ok" ? (
                          <>
                            <i className="fa-solid fa-circle-check" /> OK
                          </>
                        ) : result === "fail" ? (
                          <>
                            <i className="fa-solid fa-circle-xmark" /> Failed
                          </>
                        ) : (
                          <>
                            <i className="fa-solid fa-rotate" /> Test
                          </>
                        )}
                      </button>
                      <button
                        className="header-btn"
                        style={{ height: 24, fontSize: 10, padding: "0 7px" }}
                        onClick={() => handleSync(c._id)}
                      >
                        <i className="fa-solid fa-arrows-rotate" /> Sync
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={6}
                  style={{
                    textAlign: "center",
                    padding: "20px 0",
                    color: "var(--text-muted)",
                    fontSize: 12,
                  }}
                >
                  No couriers configured
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ── IntegrationsTab ────────────────────────────────────────

const IntegrationsTab: React.FC = () => (
  <>
    <div className="info-banner">
      <i className="fa-solid fa-circle-info" />
      <div className="info-banner-text">
        Connect third-party platforms to automate order import, courier
        tracking, payment verification, and financial reconciliation. All
        credentials are encrypted at rest.
      </div>
    </div>

    <SectionDivider label="E-Commerce Platforms" />
    <div className="grid-3" style={{ marginBottom: 14 }}>
      <ShopifyCard />

      <IntegrationCard
        id="woocommerce"
        logoChar="W"
        logoColor="#7F54B3"
        title="WooCommerce"
        subtitle="WordPress order sync"
        desc="Import WooCommerce orders into the system. Stock is deducted automatically when orders are placed and confirmed."
      >
        <div className="form-group" style={{ marginBottom: 8 }}>
          <div className="form-label">Site URL</div>
          <input
            className="form-input"
            placeholder="https://mystore.com"
            style={{ width: "100%" }}
          />
        </div>
        <div className="form-group" style={{ marginBottom: 4 }}>
          <div className="form-label">Consumer Key</div>
          <input
            className="form-input"
            type="password"
            placeholder="ck_••••••••••••"
            style={{ width: "100%" }}
          />
        </div>
      </IntegrationCard>

      <IntegrationCard
        id="whatsapp"
        logoIcon="fa-brands fa-whatsapp"
        logoColor="#25D366"
        title="WhatsApp Business"
        subtitle="Order alerts & notifications"
        desc="Send order confirmations, dispatch updates, and staff task notifications via WhatsApp Business API."
        connected
      />
    </div>

    <SectionDivider label="Courier APIs" />
    <CourierTable />

    <SectionDivider label="Shipment Tracking" />
    <div className="grid-3" style={{ marginBottom: 14 }}>
      <AfterShipCard />
    </div>

    <SectionDivider label="Payment Gateways" />
    <div className="grid-3">
      <IntegrationCard
        id="paymob"
        logoChar="Pm"
        logoColor="#2CA01C"
        title="Paymob"
        subtitle="Card payment gateway"
        desc="Accept card payments online and auto-mark Paymob transactions as prepaid orders when payment is confirmed."
      />
      <IntegrationCard
        id="jazzcash"
        logoChar="JC"
        logoColor="#AA1F27"
        title="JazzCash"
        subtitle="Mobile wallet payments"
        desc="Receive JazzCash payments for prepaid orders and log rider payouts digitally through the earnings module."
      />
      <IntegrationCard
        id="easypaisa"
        logoChar="EP"
        logoColor="#02a550"
        title="EasyPaisa"
        subtitle="Mobile wallet payments"
        desc="Verify EasyPaisa transactions for prepaid orders and log rider payout history automatically in finance."
      />
    </div>
  </>
);

export default IntegrationsTab;
