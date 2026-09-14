// APILogPanel.tsx — dynamic
import React, { useState, useEffect, useCallback } from "react";
import { API_LOGS, Badge, InnerTabs, EmptyState, ToggleSwitch } from "./shared";
import { integrationsAPI, trackingAPI } from "../../services/api";

interface IntegrationStatus {
  shopify: { connected: boolean; shopName?: string; pendingOrders?: number };
  aftership: {
    connected: boolean;
    activeShipments?: number;
    courierCount?: number;
  };
  checkedAt: string;
}

const APILogPanel: React.FC = () => {
  const [innerTab, setInnerTab] = useState("all");
  const [intStatus, setIntStatus] = useState<IntegrationStatus | null>(null);
  const [tmStatus, setTmStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState("");
  const [logFilter, setLogFilter] = useState<"all" | "success" | "error">(
    "all",
  );

  const loadStatus = useCallback(async () => {
    setLoading(true);
    try {
      const [iRes, tRes] = await Promise.allSettled([
        integrationsAPI.getStatus(),
        trackingAPI.getStatus(),
      ]);
      if (iRes.status === "fulfilled")
        setIntStatus(iRes.value.data?.data ?? null);
      if (tRes.status === "fulfilled")
        setTmStatus(tRes.value.data?.data ?? null);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const handleSyncNow = async () => {
    setSyncing(true);
    setSyncMsg("");
    try {
      const res = await integrationsAPI.syncAfterShip();
      const d = res.data;
      setSyncMsg(
        `AfterShip sync complete: ${d?.data?.updated ?? 0} of ${d?.data?.totalChecked ?? 0} updated.`,
      );
    } catch (e: any) {
      setSyncMsg(e?.response?.data?.message ?? "Sync failed.");
    } finally {
      setSyncing(false);
    }
  };

  const handleTMSync = async () => {
    setSyncing(true);
    setSyncMsg("");
    try {
      const res = await trackingAPI.sync();
      const d = res.data;
      setSyncMsg(
        `TrackingMore sync: ${d?.data?.updated ?? 0} of ${d?.data?.totalChecked ?? 0} updated.`,
      );
    } catch (e: any) {
      setSyncMsg(e?.response?.data?.message ?? "Sync failed.");
    } finally {
      setSyncing(false);
    }
  };

  // Filter static API logs for display
  const filteredLogs = API_LOGS.filter((l) => {
    if (logFilter === "success") return l.code >= 200 && l.code < 300;
    if (logFilter === "error") return l.code >= 400;
    return true;
  });

  return (
    <>
      <div className="panel-heading">API Sync Log</div>
      <div className="panel-desc">
        Audit trail of all courier API calls — tracking polls, status updates,
        and errors. Diagnose integration failures.
      </div>

      <InnerTabs
        tabs={[
          { id: "all", label: "All Logs" },
          {
            id: "errors",
            label: (
              <span>
                Errors Only{" "}
                <span
                  style={{
                    background: "var(--red-bg)",
                    color: "var(--red)",
                    padding: "1px 5px",
                    borderRadius: 8,
                    fontSize: 9,
                    marginLeft: 3,
                  }}
                >
                  {API_LOGS.filter((l) => l.code >= 400).length}
                </span>
              </span>
            ),
          },
          { id: "integrations", label: "Integration Status" },
          { id: "settings", label: "Sync Settings" },
        ]}
        active={innerTab}
        onChange={setInnerTab}
      />

      {/* ── ALL LOGS ── */}
      {innerTab === "all" && (
        <div className="card">
          <div className="c-toolbar">
            <div className="c-toolbar-left">
              <div className="c-search">
                <i className="fa-solid fa-magnifying-glass" />
                <input placeholder="Search courier, tracking no..." />
              </div>
              <button
                className={`c-btn ${logFilter === "all" ? "active" : ""}`}
                onClick={() => setLogFilter("all")}
              >
                All Types
              </button>
              <button
                className={`c-btn ${logFilter === "success" ? "active" : ""}`}
                style={{
                  color: logFilter !== "success" ? "var(--green)" : undefined,
                }}
                onClick={() => setLogFilter("success")}
              >
                Success
              </button>
              <button
                className={`c-btn ${logFilter === "error" ? "active" : ""}`}
                style={{
                  color: logFilter !== "error" ? "var(--red)" : undefined,
                }}
                onClick={() => setLogFilter("error")}
              >
                Errors
              </button>
            </div>
            <div className="c-toolbar-right">
              <button className="c-btn">
                <i className="fa-solid fa-file-export" /> Export Log
              </button>
            </div>
          </div>

          <div className="tbl-wrap">
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Courier</th>
                  <th>Call Type</th>
                  <th>Tracking No.</th>
                  <th>HTTP Code</th>
                  <th>Response Time</th>
                  <th>Result</th>
                  <th>Error Detail</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((l, i) => (
                  <tr key={i}>
                    <td>
                      <code className="sku">{l.ts}</code>
                    </td>
                    <td>{l.courier}</td>
                    <td>{l.type}</td>
                    <td>
                      <code className="sku">{l.track}</code>
                    </td>
                    <td>
                      <span
                        style={{
                          fontWeight: 700,
                          color:
                            l.code >= 200 && l.code < 300
                              ? "var(--green)"
                              : l.code >= 400
                                ? "var(--red)"
                                : "var(--yellow)",
                        }}
                      >
                        {l.code}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: 10,
                          color:
                            l.ms > 1000
                              ? "var(--red)"
                              : "var(--text-secondary)",
                        }}
                      >
                        {l.ms}ms
                      </span>
                    </td>
                    <td>
                      <Badge
                        label={
                          l.result === "Updated" || l.result === "Created"
                            ? "Updated"
                            : l.result === "No Change"
                              ? "No Change"
                              : "Error"
                        }
                      />
                    </td>
                    <td style={{ fontSize: 10, color: "var(--red)" }}>
                      {l.code >= 400 ? `HTTP ${l.code} — check API key` : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── ERRORS ── */}
      {innerTab === "errors" && (
        <>
          <div className="alert-strip danger">
            <i className="fa-solid fa-circle-xmark" />
            <strong>
              {API_LOGS.filter((l) => l.code >= 400).length} API errors
            </strong>{" "}
            in log. Most from Trax — check API key validity.
          </div>
          <div className="card">
            <div className="tbl-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Courier</th>
                    <th>Tracking No.</th>
                    <th>HTTP Code</th>
                    <th>Response Time</th>
                    <th>Error Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {API_LOGS.filter((l) => l.code >= 400).map((l, i) => (
                    <tr key={i}>
                      <td>
                        <code className="sku">{l.ts}</code>
                      </td>
                      <td>{l.courier}</td>
                      <td>
                        <code className="sku">{l.track}</code>
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, color: "var(--red)" }}>
                          {l.code}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: 10, color: "var(--red)" }}>
                          {l.ms}ms
                        </span>
                      </td>
                      <td style={{ fontSize: 10, color: "var(--red)" }}>
                        HTTP {l.code} — check API key or endpoint
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── INTEGRATION STATUS ── */}
      {innerTab === "integrations" && (
        <>
          {syncMsg && (
            <div className="alert-strip info" style={{ marginBottom: 12 }}>
              <i className="fa-solid fa-circle-check" /> {syncMsg}
            </div>
          )}

          <div className="detail-grid-2" style={{ marginBottom: 14 }}>
            {/* AfterShip */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">
                  <i className="fa-solid fa-satellite-dish" /> AfterShip
                </div>
                <Badge
                  label={
                    intStatus?.aftership?.connected
                      ? "Connected"
                      : "Disconnected"
                  }
                />
              </div>
              <div className="card-body">
                {loading ? (
                  <div style={{ color: "var(--text-muted)", fontSize: 11 }}>
                    <i className="fa-solid fa-spinner fa-spin" /> Loading…
                  </div>
                ) : intStatus ? (
                  <>
                    <div className="detail-row">
                      <div className="detail-key">Active Shipments</div>
                      <div className="detail-val">
                        {intStatus.aftership?.activeShipments ?? "—"}
                      </div>
                    </div>
                    <div className="detail-row">
                      <div className="detail-key">Courier Count</div>
                      <div className="detail-val">
                        {intStatus.aftership?.courierCount ?? "—"}
                      </div>
                    </div>
                    <div className="detail-row">
                      <div className="detail-key">Last Checked</div>
                      <div className="detail-val" style={{ fontSize: 10 }}>
                        {intStatus.checkedAt
                          ? new Date(intStatus.checkedAt).toLocaleString()
                          : "—"}
                      </div>
                    </div>
                  </>
                ) : (
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    Unable to fetch status.
                  </div>
                )}
                <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                  <button
                    className="c-btn primary"
                    style={{ fontSize: 10 }}
                    onClick={handleSyncNow}
                    disabled={syncing}
                  >
                    <i
                      className={`fa-solid ${syncing ? "fa-spinner fa-spin" : "fa-rotate"}`}
                    />{" "}
                    Sync Now
                  </button>
                  <button
                    className="c-btn"
                    style={{ fontSize: 10 }}
                    onClick={async () => {
                      try {
                        await integrationsAPI.testAfterShip();
                        alert("AfterShip: Connection OK");
                      } catch {
                        alert("AfterShip: Connection failed");
                      }
                    }}
                  >
                    <i className="fa-solid fa-plug" /> Test
                  </button>
                </div>
              </div>
            </div>

            {/* TrackingMore */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">
                  <i className="fa-solid fa-location-dot" /> TrackingMore
                </div>
                <Badge
                  label={tmStatus?.connected ? "Connected" : "Disconnected"}
                />
              </div>
              <div className="card-body">
                {loading ? (
                  <div style={{ color: "var(--text-muted)", fontSize: 11 }}>
                    <i className="fa-solid fa-spinner fa-spin" /> Loading…
                  </div>
                ) : tmStatus ? (
                  <>
                    <div className="detail-row">
                      <div className="detail-key">Courier Count</div>
                      <div className="detail-val">
                        {tmStatus.courierCount ?? "—"}
                      </div>
                    </div>
                    <div className="detail-row">
                      <div className="detail-key">Last Tested</div>
                      <div className="detail-val" style={{ fontSize: 10 }}>
                        {tmStatus.lastTestedAt
                          ? new Date(tmStatus.lastTestedAt).toLocaleString()
                          : "—"}
                      </div>
                    </div>
                    <div className="detail-row">
                      <div className="detail-key">API Key</div>
                      <div className="detail-val">
                        {tmStatus.envConfigured?.apiKey ? (
                          <Badge label="Configured" />
                        ) : (
                          <Badge label="Missing" />
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    Unable to fetch status.
                  </div>
                )}
                <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                  <button
                    className="c-btn primary"
                    style={{ fontSize: 10 }}
                    onClick={handleTMSync}
                    disabled={syncing}
                  >
                    <i
                      className={`fa-solid ${syncing ? "fa-spinner fa-spin" : "fa-rotate"}`}
                    />{" "}
                    Sync Now
                  </button>
                  <button
                    className="c-btn"
                    style={{ fontSize: 10 }}
                    onClick={async () => {
                      try {
                        await trackingAPI.test();
                        alert("TrackingMore: Connection OK");
                      } catch {
                        alert("TrackingMore: Connection failed");
                      }
                    }}
                  >
                    <i className="fa-solid fa-plug" /> Test
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Shopify status */}
          {intStatus?.shopify && (
            <div className="card">
              <div className="card-header">
                <div className="card-title">
                  <i className="fa-solid fa-store" /> Shopify
                </div>
                <Badge
                  label={
                    intStatus.shopify.connected ? "Connected" : "Disconnected"
                  }
                />
              </div>
              <div className="card-body">
                <div className="detail-row">
                  <div className="detail-key">Store</div>
                  <div className="detail-val">
                    {intStatus.shopify.shopName ?? "—"}
                  </div>
                </div>
                <div className="detail-row">
                  <div className="detail-key">Pending Orders</div>
                  <div className="detail-val">
                    {intStatus.shopify.pendingOrders ?? 0}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── SETTINGS ── */}
      {innerTab === "settings" && (
        <>
          <div className="settings-grid">
            <div className="settings-section">
              <div className="settings-section-head">
                <i className="fa-solid fa-rotate" /> Auto-sync Settings
              </div>
              <div className="settings-section-body">
                <div className="stg-row">
                  <div>
                    <div className="stg-key">Auto-sync Enabled</div>
                    <div className="stg-desc">
                      Automatically poll courier APIs
                    </div>
                  </div>
                  <ToggleSwitch defaultChecked />
                </div>
                <div className="stg-row">
                  <div>
                    <div className="stg-key">Sync Frequency</div>
                    <div className="stg-desc">
                      How often to poll tracking APIs
                    </div>
                  </div>
                  <select className="stg-select">
                    <option>Every 6 hours</option>
                    <option>Every 3 hours</option>
                    <option>Every 12 hours</option>
                    <option>Once daily</option>
                  </select>
                </div>
                <div className="stg-row">
                  <div>
                    <div className="stg-key">Retry on Failure</div>
                    <div className="stg-desc">Auto-retry failed API calls</div>
                  </div>
                  <select className="stg-select">
                    <option>3 times</option>
                    <option>5 times</option>
                    <option>No retry</option>
                  </select>
                </div>
                <div className="stg-row">
                  <div>
                    <div className="stg-key">Log Retention</div>
                    <div className="stg-desc">How long to keep API logs</div>
                  </div>
                  <select className="stg-select">
                    <option>30 days</option>
                    <option>60 days</option>
                    <option>90 days</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="settings-section">
              <div className="settings-section-head">
                <i className="fa-solid fa-bell" /> Alert Settings
              </div>
              <div className="settings-section-body">
                <div className="stg-row">
                  <div>
                    <div className="stg-key">Alert on API Error</div>
                    <div className="stg-desc">
                      Notify admin on consecutive failures
                    </div>
                  </div>
                  <ToggleSwitch defaultChecked />
                </div>
                <div className="stg-row">
                  <div>
                    <div className="stg-key">Error Threshold</div>
                    <div className="stg-desc">
                      Alert after N consecutive failures
                    </div>
                  </div>
                  <input
                    type="number"
                    defaultValue={3}
                    className="stg-input"
                    style={{ width: 60 }}
                  />
                </div>
                <div className="stg-row">
                  <div>
                    <div className="stg-key">Alert on Delay</div>
                    <div className="stg-desc">
                      Notify when shipment exceeds SLA
                    </div>
                  </div>
                  <ToggleSwitch defaultChecked />
                </div>
                <div className="stg-row">
                  <div>
                    <div className="stg-key">Notify Who</div>
                  </div>
                  <select className="stg-select">
                    <option>Admin</option>
                    <option>Operations Manager</option>
                    <option>Both</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          <button className="c-btn primary">
            <i className="fa-solid fa-check" /> Save Settings
          </button>
        </>
      )}
    </>
  );
};

export default APILogPanel;
