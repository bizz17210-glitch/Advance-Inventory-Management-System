// OverviewPanel.tsx — dynamic
import React, { useEffect, useState, useCallback } from "react";
import {
  NavPanel,
  ApiRider,
  ApiDelivery,
  ACTIVE_DELIVERIES,
  UNASSIGNED_ORDERS,
  rColor,
  fmt,
  initials,
  avatarColorFromName,
  isRiderOnline,
  riderStatusLabel,
  Badge,
  PerfBar,
  ApiRiderAvatar,
} from "./shared";
import { ridersAPI } from "../../services/api";

interface Props {
  onNav: (p: NavPanel) => void;
  onOpenRider: (r: ApiRider) => void;
}

interface KPIs {
  totalRiders: number;
  activeRiders: number;
  onlineNow: number;
  avgCompletionRate: string;
}

const OverviewPanel: React.FC<Props> = ({ onNav, onOpenRider }) => {
  const [riders, setRiders] = useState<ApiRider[]>([]);
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [perfData, setPerfData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [rRes, pRes] = await Promise.allSettled([
        ridersAPI.getAll({ limit: 20 }),
        ridersAPI.getPerformance(),
      ]);

      if (rRes.status === "fulfilled") {
        const list: ApiRider[] = rRes.value.data?.data?.riders ?? [];
        setRiders(list);
        const active = list.filter((r) => r.status === "Active").length;
        const online = list.filter((r) => isRiderOnline(r)).length;
        const total =
          rRes.value.data?.data?.pagination?.totalItems ?? list.length;
        const avgRate =
          list.length > 0
            ? (
                list.reduce(
                  (a, r) => a + parseFloat(r.completionRate ?? "0"),
                  0,
                ) / list.length
              ).toFixed(1)
            : "0";
        setKpis({
          totalRiders: total,
          activeRiders: active,
          onlineNow: online,
          avgCompletionRate: avgRate,
        });
      }
      if (pRes.status === "fulfilled")
        setPerfData(pRes.value.data?.data ?? null);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Failed to load rider data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const activeRiders = riders.filter(
    (r) => r.status === "Active" || r.status === "OnDelivery",
  );

  return (
    <div className="rpanel active">
      <div className="panel-heading">Overview</div>
      <div className="panel-desc">
        Real-time snapshot of rider activity — active deliveries, task queue,
        daily completions, and alerts requiring immediate attention.
      </div>

      <div className="alert-strip warn">
        <i className="fa-solid fa-triangle-exclamation" />
        <div>
          <strong>{UNASSIGNED_ORDERS.length} orders</strong> in queue awaiting
          rider assignment · <strong>3 deliveries</strong> delayed beyond
          scheduled time.
        </div>
        <button
          className="c-btn"
          style={{ marginLeft: "auto" }}
          onClick={() => onNav("assign")}
        >
          <i className="fa-solid fa-eye" /> Assign Now
        </button>
      </div>

      <div className="mini-stats">
        <div className="mini-stat">
          <div className="ms-label">Total Riders</div>
          <div className="ms-value">
            {loading ? "…" : (kpis?.totalRiders ?? "—")}
          </div>
          <div className="ms-trend">
            {loading ? "" : `${kpis?.activeRiders ?? 0} active`}
          </div>
        </div>
        <div className="mini-stat">
          <div className="ms-label">Online Now</div>
          <div className="ms-value">
            {loading ? "…" : (kpis?.onlineNow ?? "—")}
          </div>
          <div className="ms-trend up">
            <i
              className="fa-solid fa-circle"
              style={{ color: "var(--green)", fontSize: 7 }}
            />{" "}
            Tracking active
          </div>
        </div>
        <div className="mini-stat">
          <div className="ms-label">Avg. Completion</div>
          <div className="ms-value">
            {loading ? "…" : `${kpis?.avgCompletionRate ?? "—"}%`}
          </div>
          <div className="ms-trend up">Live average</div>
        </div>
        <div className="mini-stat">
          <div className="ms-label">Active Deliveries</div>
          <div className="ms-value">{ACTIVE_DELIVERIES.length}</div>
          <div className="ms-trend">In transit now</div>
        </div>
      </div>

      {error && (
        <div className="alert-strip danger" style={{ marginBottom: 12 }}>
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

      <div className="detail-grid-3">
        {/* Rider Status */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <i className="fa-solid fa-person-biking" /> Rider Status
            </div>
            <button className="c-btn" onClick={() => onNav("all")}>
              View All
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
                <i className="fa-solid fa-spinner fa-spin" /> Loading…
              </div>
            ) : (
              riders.slice(0, 5).map((r) => (
                <div
                  className="list-item"
                  key={r._id}
                  style={{ cursor: "pointer" }}
                  onClick={() => onOpenRider(r)}
                >
                  <ApiRiderAvatar rider={r} size={26} fontSize={9} />
                  <div className="list-content">
                    <div className="list-title">{r.fullName}</div>
                    <div className="list-meta">{r.assignedZone ?? "—"}</div>
                  </div>
                  <div className="list-right">
                    <Badge label={riderStatusLabel(r.status)} />
                  </div>
                </div>
              ))
            )}
            {!loading && riders.length === 0 && (
              <div
                style={{
                  fontSize: 11,
                  color: "var(--text-muted)",
                  textAlign: "center",
                  padding: 12,
                }}
              >
                No riders found.
              </div>
            )}
          </div>
        </div>

        {/* Active Now (static fallback) */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <i className="fa-solid fa-map-location-dot" /> Active Now
            </div>
          </div>
          <div className="card-body" style={{ padding: "8px 14px" }}>
            {ACTIVE_DELIVERIES.slice(0, 4).map((d) => (
              <div className="list-item" key={d.order}>
                <div className="list-content">
                  <div className="list-title" style={{ fontSize: 10.5 }}>
                    {d.order} · {d.rider.split(" ")[0]}
                  </div>
                  <div className="list-meta">
                    {d.customer} · ETA {d.eta}
                  </div>
                </div>
                <div className="list-right">
                  <Badge label={d.status} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Assignment (static fallback) */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <i className="fa-solid fa-clipboard-list" /> Pending Assignment
            </div>
          </div>
          <div className="card-body" style={{ padding: "8px 14px" }}>
            {UNASSIGNED_ORDERS.slice(0, 4).map((o) => (
              <div className="list-item" key={o.order}>
                <div className="list-content">
                  <div className="list-title" style={{ fontSize: 10.5 }}>
                    {o.order} · {o.customer}
                  </div>
                  <div className="list-meta">
                    {o.area} · {o.cod}
                  </div>
                </div>
                <div className="list-right">
                  <Badge label={o.priority} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Performance Table */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <i className="fa-solid fa-trophy" /> Rider Performance Snapshot
          </div>
          <button className="c-btn" onClick={load}>
            <i className="fa-solid fa-rotate" /> Refresh
          </button>
        </div>
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>Rider</th>
                <th>Zone</th>
                <th>Total Deliveries</th>
                <th>Completion Rate</th>
                <th>Active Deliveries</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j}>
                        <div
                          style={{
                            height: 13,
                            background: "#F3F4F6",
                            borderRadius: 4,
                            width: "70%",
                          }}
                        />
                      </td>
                    ))}
                  </tr>
                ))
              ) : activeRiders.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      textAlign: "center",
                      padding: 24,
                      color: "var(--text-muted)",
                      fontSize: 11,
                    }}
                  >
                    No active riders found.
                  </td>
                </tr>
              ) : (
                activeRiders.map((r) => {
                  const rate = parseFloat(r.completionRate ?? "0");
                  return (
                    <tr
                      key={r._id}
                      onClick={() => onOpenRider(r)}
                      style={{ cursor: "pointer" }}
                    >
                      <td>
                        <div className="td-flex">
                          <ApiRiderAvatar rider={r} size={26} fontSize={9} />
                          <div>
                            <div style={{ fontWeight: 600 }}>{r.fullName}</div>
                            <div className="td-sub">{r.phone}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="tag">{r.assignedZone ?? "—"}</span>
                      </td>
                      <td>{r.performanceMetrics?.totalDeliveries ?? "—"}</td>
                      <td>
                        <PerfBar pct={rate} color={rColor(rate)} />
                      </td>
                      <td>{r.activeDeliveries ?? "—"}</td>
                      <td>
                        <Badge label={riderStatusLabel(r.status)} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OverviewPanel;
