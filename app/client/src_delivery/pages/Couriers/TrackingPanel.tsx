// TrackingPanel.tsx — dynamic
import React, { useState, useCallback } from "react";
import {
  BULK_SYNC,
  ApiShipmentTracking,
  Badge,
  InnerTabs,
  EmptyState,
  statusLabel,
} from "./shared";
import { shipmentsAPI, couriersAPI } from "../../services/api";

const TrackingPanel: React.FC = () => {
  const [innerTab, setInnerTab] = useState("lookup");

  // Lookup state
  const [query, setQuery] = useState("");
  const [tracking, setTracking] = useState<ApiShipmentTracking | null>(null);
  const [shipInfo, setShipInfo] = useState<any>(null);
  const [looking, setLooking] = useState(false);
  const [lookErr, setLookErr] = useState("");

  // Bulk sync state
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState("");

  const handleTrack = useCallback(async () => {
    if (!query.trim()) return;
    setLooking(true);
    setLookErr("");
    setTracking(null);
    setShipInfo(null);
    try {
      // Search shipment by tracking number or order ref
      const sRes = await shipmentsAPI.getAll({
        search: query.trim(),
        limit: 1,
      });
      const list = sRes.data?.data?.shipments ?? [];
      if (list.length === 0) {
        setLookErr("No shipment found for that tracking number or order ID.");
        return;
      }
      const ship = list[0];
      setShipInfo(ship);
      // Fetch tracking details
      const tRes = await shipmentsAPI.getTracking(ship._id);
      setTracking(tRes.data?.data ?? null);
    } catch (e: any) {
      setLookErr(e?.response?.data?.message ?? "Tracking lookup failed.");
    } finally {
      setLooking(false);
    }
  }, [query]);

  const handleSyncAll = async () => {
    setSyncing(true);
    setSyncMsg("");
    try {
      // Sync via AfterShip / TrackingMore integration
      const res = await (
        await import("../../services/api")
      ).integrationsAPI.syncAfterShip();
      const d = res.data;
      setSyncMsg(
        `Sync complete: ${d?.data?.updated ?? 0} shipments updated out of ${d?.data?.totalChecked ?? 0} checked.`,
      );
    } catch (e: any) {
      setSyncMsg(e?.response?.data?.message ?? "Sync failed.");
    } finally {
      setSyncing(false);
    }
  };

  const handleCourierSync = async (courierId: string, name: string) => {
    try {
      const res = await couriersAPI.sync(courierId);
      const info = res.data?.syncResult;
      alert(
        `${name}: ${info?.syncedOrders ?? 0} orders synced, ${info?.failedUpdates ?? 0} failed.`,
      );
    } catch {
      alert(`Sync failed for ${name}.`);
    }
  };

  const history = tracking?.trackingHistory ?? [];

  return (
    <>
      <div className="panel-heading">Live Tracking</div>
      <div className="panel-desc">
        Pull real-time shipment status from connected courier APIs. Enter a
        tracking number for a full timeline or bulk refresh all active
        shipments.
      </div>

      <InnerTabs
        tabs={[
          { id: "lookup", label: "Tracking Lookup" },
          { id: "bulk", label: "Bulk Refresh" },
          { id: "history", label: "Status History" },
        ]}
        active={innerTab}
        onChange={setInnerTab}
      />

      {/* ── LOOKUP ── */}
      {innerTab === "lookup" && (
        <div className="card" style={{ marginBottom: 14 }}>
          <div className="card-header">
            <div className="card-title">
              <i className="fa-solid fa-location-dot" /> Track a Shipment
            </div>
          </div>
          <div className="card-body">
            <div
              style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <input
                className="c-form-input"
                style={{ flex: 1, maxWidth: 340 }}
                placeholder="Enter tracking number or order ID…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleTrack()}
              />
              <button
                className="c-btn primary"
                onClick={handleTrack}
                disabled={looking}
              >
                <i
                  className={`fa-solid ${looking ? "fa-spinner fa-spin" : "fa-magnifying-glass"}`}
                />{" "}
                Track
              </button>
            </div>

            {lookErr && (
              <div className="alert-strip danger" style={{ marginBottom: 12 }}>
                <i className="fa-solid fa-circle-exclamation" /> {lookErr}
              </div>
            )}

            {(tracking || shipInfo) && (
              <div className="detail-grid-2">
                {/* Shipment details */}
                <div>
                  <div
                    style={{
                      fontSize: 9.5,
                      fontWeight: 700,
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                      marginBottom: 8,
                    }}
                  >
                    Shipment Details
                  </div>
                  {[
                    [
                      "Tracking No.",
                      <code className="sku">
                        {tracking?.trackingNumber ??
                          shipInfo?.trackingNumber ??
                          "—"}
                      </code>,
                    ],
                    [
                      "Order",
                      shipInfo?.orderReference ?? shipInfo?.orderId ?? "—",
                    ],
                    [
                      "Customer",
                      shipInfo?.customer?.name ??
                        shipInfo?.customer?.fullName ??
                        "—",
                    ],
                    ["Courier", shipInfo?.courierName ?? "—"],
                    ["Destination", shipInfo?.shippingAddress?.city ?? "—"],
                    [
                      "Est. Delivery",
                      shipInfo?.estimatedDelivery
                        ? new Date(
                            shipInfo.estimatedDelivery,
                          ).toLocaleDateString()
                        : "—",
                    ],
                    [
                      "COD Amount",
                      shipInfo?.codAmount != null
                        ? `₨${Number(shipInfo.codAmount).toLocaleString()}`
                        : "—",
                    ],
                    [
                      "Current Status",
                      <Badge
                        label={
                          tracking?.currentStatus ??
                          shipInfo?.currentStatus ??
                          "assigned"
                        }
                      />,
                    ],
                  ].map(([k, v], i) => (
                    <div className="detail-row" key={i}>
                      <div className="detail-key">{k}</div>
                      <div className="detail-val">{v}</div>
                    </div>
                  ))}
                </div>

                {/* Tracking timeline */}
                <div>
                  <div
                    style={{
                      fontSize: 9.5,
                      fontWeight: 700,
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                      marginBottom: 8,
                    }}
                  >
                    Tracking Timeline
                  </div>
                  {history.length === 0 ? (
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                      No tracking events yet.
                    </div>
                  ) : (
                    <div className="timeline">
                      {history.map((ev, i) => (
                        <div className="tl-item" key={i}>
                          <div className="tl-dot-col">
                            <div
                              className={`tl-dot ${i === history.length - 1 ? "active" : "done"}`}
                            />
                            {i < history.length - 1 && (
                              <div className="tl-line" />
                            )}
                          </div>
                          <div className="tl-content">
                            <div className="tl-title">
                              {ev.description ?? statusLabel(ev.status)}
                            </div>
                            <div className="tl-meta">
                              {ev.location ? `${ev.location} · ` : ""}
                              {new Date(ev.timestamp).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {!tracking && !shipInfo && !looking && !lookErr && (
              <div
                style={{
                  textAlign: "center",
                  padding: "20px 0",
                  color: "var(--text-muted)",
                  fontSize: 11,
                }}
              >
                Enter a tracking number or order ID above and press Track.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── BULK REFRESH ── */}
      {innerTab === "bulk" && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <i className="fa-solid fa-rotate" /> Bulk Tracking Refresh
            </div>
            <button
              className="c-btn primary"
              onClick={handleSyncAll}
              disabled={syncing}
            >
              <i
                className={`fa-solid ${syncing ? "fa-spinner fa-spin" : "fa-rotate"}`}
              />{" "}
              Sync All Now
            </button>
          </div>
          <div className="card-body">
            {syncMsg && (
              <div className="alert-strip info" style={{ marginBottom: 12 }}>
                <i className="fa-solid fa-circle-check" /> {syncMsg}
              </div>
            )}
            <div className="alert-strip info">
              <i className="fa-solid fa-circle-info" />
              Sync pulls latest shipment statuses from AfterShip and individual
              courier APIs.
            </div>
            {BULK_SYNC.map((s) => (
              <div className="list-item" key={s.courier}>
                <div
                  className="list-icon"
                  style={{
                    background:
                      s.status === "OK" ? "var(--green-bg)" : "var(--red-bg)",
                  }}
                >
                  <i
                    className={`fa-solid fa-${s.status === "OK" ? "circle-check" : "circle-xmark"}`}
                    style={{
                      fontSize: 12,
                      color: s.status === "OK" ? "var(--green)" : "var(--red)",
                    }}
                  />
                </div>
                <div className="list-content">
                  <div className="list-title">{s.courier}</div>
                  <div className="list-meta">
                    Last: {s.lastSync} · {s.shipments} shipments · {s.updated}{" "}
                    updated · {s.errors} errors
                  </div>
                </div>
                <div className="list-right">
                  <Badge label={s.status === "OK" ? "Active" : "Error"} />
                  <button
                    className="c-btn"
                    style={{ height: 23, fontSize: 9.5, marginTop: 4 }}
                    onClick={() => handleCourierSync(s.courier, s.courier)}
                  >
                    <i className="fa-solid fa-rotate" /> Sync Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {innerTab === "history" && (
        <div className="card">
          <div className="card-body">
            <EmptyState
              icon="fa-clock-rotate-left"
              title="Tracking History"
              desc="Select a shipment from the lookup to see full history."
            />
          </div>
        </div>
      )}
    </>
  );
};

export default TrackingPanel;
