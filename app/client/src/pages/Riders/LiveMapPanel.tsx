// LiveMapPanel.tsx — dynamic
import React, { useState, useEffect, useCallback } from "react";
import {
  ApiRider,
  riderStatusLabel,
  Badge,
  ApiRiderAvatar,
  EmptyState,
} from "./shared";
import { ridersAPI } from "../../services/api";

// Fixed dot positions for map display
const MAP_POSITIONS = [
  { top: "30%", left: "40%" },
  { top: "55%", left: "65%" },
  { top: "25%", left: "70%" },
  { top: "68%", left: "35%" },
  { top: "45%", left: "50%" },
  { top: "72%", left: "58%" },
  { top: "38%", left: "22%" },
  { top: "60%", left: "75%" },
];
const DOT_COLORS = [
  "#FF6A00",
  "#16A34A",
  "#2563EB",
  "#7C3AED",
  "#D97706",
  "#DC2626",
  "#0284C7",
  "#059669",
];

interface RiderWithDelivery extends ApiRider {
  activeOrderRef?: string;
}

const LiveMapPanel: React.FC = () => {
  const [riders, setRiders] = useState<RiderWithDelivery[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await ridersAPI.getAll({ limit: 50 });
      const list: ApiRider[] = res.data?.data?.riders ?? [];

      // For active riders, try to get their current active delivery ref
      const enriched: RiderWithDelivery[] = await Promise.all(
        list.map(async (r) => {
          if (
            r.status === "OnDelivery" ||
            (r.status === "Active" &&
              r.activeDeliveries &&
              r.activeDeliveries > 0)
          ) {
            try {
              const dRes = await ridersAPI.getDeliveries(r._id, {
                limit: 1,
                status: "in_transit,out_for_delivery",
              });
              const firstDel = dRes.data?.data?.deliveries?.[0];
              return {
                ...r,
                activeOrderRef:
                  firstDel?.orderReference ?? firstDel?.trackingNumber,
              };
            } catch {
              /* noop */
            }
          }
          return r;
        }),
      );

      setRiders(enriched);
      setLastRefresh(new Date());
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Failed to load rider locations.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onlineRiders = riders.filter(
    (r) => r.status === "Active" || r.status === "OnDelivery",
  );

  const riderColor = (r: ApiRider) => {
    if (r.status === "OnDelivery") return "var(--accent)";
    if (r.isAvailable) return "var(--green)";
    return "var(--text-muted)";
  };

  return (
    <>
      <div className="panel-heading">Live Map</div>
      <div className="panel-desc">
        Real-time GPS tracking of all active riders. Requires mobile app
        integration for riders to share live location.
      </div>

      <div className="alert-strip info">
        <i className="fa-solid fa-circle-info" />
        Live GPS tracking requires the <strong>Rider Mobile App</strong>{" "}
        integration. Connect via the <strong>App Integrations</strong> panel.
      </div>

      {error && (
        <div className="alert-strip danger">
          <i className="fa-solid fa-circle-exclamation" /> {error}
          <button
            className="c-btn"
            style={{ marginLeft: "auto" }}
            onClick={load}
          >
            Retry
          </button>
        </div>
      )}

      {/* Map placeholder with real rider dots */}
      <div className="map-placeholder tall">
        {onlineRiders.slice(0, 8).map((r, i) => {
          const pos = MAP_POSITIONS[i] ?? { top: "50%", left: "50%" };
          return (
            <React.Fragment key={r._id}>
              <div
                className="map-rider-dot large"
                style={{
                  background: DOT_COLORS[i % DOT_COLORS.length],
                  top: pos.top,
                  left: pos.left,
                }}
                title={r.fullName}
              />
              {r.activeOrderRef && (
                <div
                  className="map-label-popup"
                  style={{
                    top: `calc(${pos.top} - 28px)`,
                    left: `calc(${pos.left} + 18px)`,
                  }}
                >
                  {r.fullName.split(" ")[0]} · {r.activeOrderRef}
                </div>
              )}
            </React.Fragment>
          );
        })}

        <div
          style={{
            position: "absolute",
            bottom: 12,
            left: 12,
            display: "flex",
            gap: 8,
          }}
        >
          <div className="map-badge">
            <i
              className="fa-solid fa-circle"
              style={{ color: "var(--accent)", fontSize: 8 }}
            />{" "}
            Delivering
          </div>
          <div className="map-badge">
            <i
              className="fa-solid fa-circle"
              style={{ color: "var(--green)", fontSize: 8 }}
            />{" "}
            Idle / Available
          </div>
          <div className="map-badge">
            <i
              className="fa-solid fa-circle"
              style={{ color: "var(--red)", fontSize: 8 }}
            />{" "}
            Delayed
          </div>
        </div>

        <div
          style={{
            background: "rgba(255,255,255,0.9)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-card)",
            padding: "10px 16px",
            textAlign: "center",
          }}
        >
          <i
            className="fa-solid fa-map-location-dot"
            style={{
              fontSize: 22,
              color: "var(--accent)",
              display: "block",
              marginBottom: 4,
            }}
          />
          <div style={{ fontSize: 11, fontWeight: 700 }}>Live GPS Map</div>
          <div style={{ fontSize: 10, color: "var(--text-muted)" }}>
            {loading ? "Loading…" : `${onlineRiders.length} riders online`}
            {" · "}Last update:{" "}
            {lastRefresh.toLocaleTimeString("en-GB", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>
      </div>

      {/* Rider Locations List */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <i className="fa-solid fa-list" /> Rider Locations (Live)
          </div>
          <button className="c-btn" onClick={load} disabled={loading}>
            <i className={`fa-solid fa-rotate ${loading ? "fa-spin" : ""}`} />{" "}
            Refresh
          </button>
        </div>
        <div className="card-body" style={{ padding: "8px 14px" }}>
          {loading ? (
            <div
              style={{
                textAlign: "center",
                padding: 16,
                color: "var(--text-muted)",
                fontSize: 11,
              }}
            >
              <i className="fa-solid fa-spinner fa-spin" /> Loading riders…
            </div>
          ) : onlineRiders.length === 0 ? (
            <EmptyState
              icon="fa-person-biking"
              title="No Active Riders"
              desc="No riders are currently active."
            />
          ) : (
            onlineRiders.map((r) => (
              <div className="list-item" key={r._id}>
                <ApiRiderAvatar rider={r} size={28} fontSize={9} />
                <div className="list-content">
                  <div className="list-title">
                    {r.fullName}
                    {r.activeOrderRef && (
                      <span
                        className="badge orange"
                        style={{ fontSize: 8.5, marginLeft: 4 }}
                      >
                        {r.activeOrderRef}
                      </span>
                    )}
                  </div>
                  <div className="list-meta">
                    {r.assignedZone ?? "—"} ·{" "}
                    <i
                      className="fa-solid fa-circle"
                      style={{ color: riderColor(r), fontSize: 7 }}
                    />{" "}
                    {r.status === "OnDelivery" ? "On Delivery" : "Active"}
                    {r.activeDeliveries
                      ? ` · ${r.activeDeliveries} active`
                      : ""}
                  </div>
                </div>
                <div className="list-right">
                  <Badge label={riderStatusLabel(r.status)} />
                  <button
                    className="c-btn"
                    style={{ height: 22, fontSize: 9.5, marginTop: 4 }}
                  >
                    <i className="fa-solid fa-location-dot" /> Track
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Offline / Away riders */}
      {riders.filter((r) => r.status !== "Active" && r.status !== "OnDelivery")
        .length > 0 && (
        <div className="card">
          <div className="card-header">
            <div className="card-title" style={{ color: "var(--text-muted)" }}>
              <i className="fa-solid fa-moon" /> Offline Riders
            </div>
          </div>
          <div className="card-body" style={{ padding: "8px 14px" }}>
            {riders
              .filter((r) => r.status !== "Active" && r.status !== "OnDelivery")
              .map((r) => (
                <div className="list-item" key={r._id} style={{ opacity: 0.6 }}>
                  <ApiRiderAvatar rider={r} size={26} fontSize={9} />
                  <div className="list-content">
                    <div className="list-title">{r.fullName}</div>
                    <div className="list-meta">{r.assignedZone ?? "—"}</div>
                  </div>
                  <div className="list-right">
                    <Badge label={riderStatusLabel(r.status)} />
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </>
  );
};

export default LiveMapPanel;
