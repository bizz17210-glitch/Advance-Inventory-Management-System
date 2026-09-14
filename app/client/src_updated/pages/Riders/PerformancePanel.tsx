// PerformancePanel.tsx — dynamic
import React, { useState, useEffect, useCallback } from "react";
import {
  ApiRider,
  ApiRiderPerformance,
  ApiPagination,
  rColor,
  avatarColorFromName,
  initials,
  riderStatusLabel,
  Badge,
  PerfBar,
  StarRating,
  ApiRiderAvatar,
  InnerTabs,
  EmptyState,
  TableSkeleton,
} from "./shared";
import { ridersAPI } from "../../services/api";

interface Props {
  onOpenRider: (r: ApiRider) => void;
}

const PerformancePanel: React.FC<Props> = ({ onOpenRider }) => {
  const [innerTab, setInnerTab] = useState("summary");
  const [riders, setRiders] = useState<ApiRider[]>([]);
  const [perfData, setPerfData] = useState<ApiRiderPerformance | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [rRes, pRes] = await Promise.allSettled([
        ridersAPI.getAll({ limit: 50, status: "Active" }),
        ridersAPI.getPerformance(),
      ]);
      if (rRes.status === "fulfilled")
        setRiders(rRes.value.data?.data?.riders ?? []);
      if (pRes.status === "fulfilled")
        setPerfData(pRes.value.data?.data ?? null);
    } catch (e: any) {
      setError(
        e?.response?.data?.message ?? "Failed to load performance data.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const kpis = perfData?.kpis;
  const byRider = perfData?.byRider ?? [];

  // Derive top performers from the rider list
  const topPerformer = [...riders].sort(
    (a, b) =>
      parseFloat(b.completionRate ?? "0") - parseFloat(a.completionRate ?? "0"),
  )[0];
  const avgCompletion =
    riders.length > 0
      ? (
          riders.reduce((s, r) => s + parseFloat(r.completionRate ?? "0"), 0) /
          riders.length
        ).toFixed(1)
      : "—";

  return (
    <>
      <div className="panel-heading">Rider Performance</div>
      <div className="panel-desc">
        Comparative performance analytics across all riders — delivery
        completion rates, average times, on-time percentages, and customer
        ratings.
      </div>

      <InnerTabs
        tabs={[
          { id: "summary", label: "Summary" },
          { id: "detail", label: "Detailed Metrics" },
          { id: "trends", label: "Trends" },
          { id: "kpi", label: "KPI Dashboard" },
        ]}
        active={innerTab}
        onChange={setInnerTab}
      />

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

      {/* ── SUMMARY ── */}
      {innerTab === "summary" && (
        <>
          <div className="mini-stats">
            <div className="mini-stat">
              <div className="ms-label">Total Riders</div>
              <div className="ms-value">
                {loading ? "…" : (kpis?.totalRiders ?? riders.length)}
              </div>
              <div className="ms-trend">{kpis?.activeRiders ?? 0} active</div>
            </div>
            <div className="mini-stat">
              <div className="ms-label">Top Performer</div>
              <div className="ms-value" style={{ fontSize: 14 }}>
                {loading ? "…" : (topPerformer?.fullName.split(" ")[0] ?? "—")}
              </div>
              <div className="ms-trend up">
                {topPerformer
                  ? `${parseFloat(topPerformer.completionRate ?? "0").toFixed(0)}% completion`
                  : ""}
              </div>
            </div>
            <div className="mini-stat">
              <div className="ms-label">Avg. Completion</div>
              <div className="ms-value">
                {loading ? "…" : `${avgCompletion}%`}
              </div>
              <div className="ms-trend up">Overall completion rate</div>
            </div>
            <div className="mini-stat">
              <div className="ms-label">Avg Transit (hrs)</div>
              <div className="ms-value">
                {loading ? "…" : (kpis?.avgTransitHours ?? "—")}
              </div>
              <div className="ms-trend">Hours per delivery</div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <i className="fa-solid fa-trophy" /> Performance Scorecard
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
                    <th>Completed</th>
                    <th>Completion Rate</th>
                    <th>Active Deliveries</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <TableSkeleton rows={6} cols={7} />
                  ) : riders.length === 0 ? (
                    <tr>
                      <td colSpan={7}>
                        <EmptyState
                          icon="fa-chart-simple"
                          title="No Riders Found"
                          desc="No active riders available."
                        />
                      </td>
                    </tr>
                  ) : (
                    riders.map((r) => {
                      const rate = parseFloat(r.completionRate ?? "0");
                      return (
                        <tr
                          key={r._id}
                          onClick={() => onOpenRider(r)}
                          style={{ cursor: "pointer" }}
                        >
                          <td>
                            <div className="td-flex">
                              <ApiRiderAvatar
                                rider={r}
                                size={26}
                                fontSize={9}
                              />
                              <div>
                                <div style={{ fontWeight: 600 }}>
                                  {r.fullName}
                                </div>
                                <div className="td-sub">{r.phone}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="tag">{r.assignedZone ?? "—"}</span>
                          </td>
                          <td>
                            {r.performanceMetrics?.totalDeliveries ?? "—"}
                          </td>
                          <td
                            style={{ color: "var(--green)", fontWeight: 600 }}
                          >
                            {r.performanceMetrics?.completedDeliveries ?? "—"}
                          </td>
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

          {/* API-sourced byRider table */}
          {byRider.length > 0 && (
            <div className="card" style={{ marginTop: 14 }}>
              <div className="card-header">
                <div className="card-title">
                  <i className="fa-solid fa-chart-bar" /> Analytics Breakdown
                  (API)
                </div>
              </div>
              <div className="tbl-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Rider</th>
                      <th>Zone</th>
                      <th>Total Deliveries</th>
                      <th>Completion Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {byRider.map((r) => {
                      const rate = parseFloat(r.completionRate ?? "0");
                      return (
                        <tr key={r.id}>
                          <td>
                            <strong>{r.name}</strong>
                          </td>
                          <td>
                            <span className="tag">{r.zone}</span>
                          </td>
                          <td>{r.totalDeliveries}</td>
                          <td>
                            <PerfBar pct={rate} color={rColor(rate)} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── DETAILED METRICS ── */}
      {innerTab === "detail" && (
        <div className="card">
          <div className="card-body">
            <EmptyState
              icon="fa-chart-simple"
              title="Detailed Metrics"
              desc="Select a rider and date range to view breakdown."
            />
          </div>
        </div>
      )}

      {/* ── TRENDS ── */}
      {innerTab === "trends" && (
        <>
          {perfData?.timeline && perfData.timeline.length > 0 ? (
            <div className="card">
              <div className="card-header">
                <div className="card-title">
                  <i className="fa-solid fa-chart-line" /> Daily Delivery Trends
                </div>
              </div>
              <div className="tbl-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Total</th>
                      <th>Completed</th>
                      <th>Completion Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {perfData.timeline.map((t, i) => (
                      <tr key={i}>
                        <td>{t.date}</td>
                        <td>{t.total}</td>
                        <td style={{ color: "var(--green)", fontWeight: 600 }}>
                          {t.completed}
                        </td>
                        <td>
                          <PerfBar
                            pct={t.completionRate}
                            color={rColor(t.completionRate)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="card">
              <div className="card-body">
                <EmptyState
                  icon="fa-chart-line"
                  title="Performance Trends"
                  desc="Month-over-month completion and timing trends."
                />
              </div>
            </div>
          )}
        </>
      )}

      {/* ── KPI DASHBOARD ── */}
      {innerTab === "kpi" && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <i className="fa-solid fa-gauge" /> KPI Overview
            </div>
            <button className="c-btn" onClick={load}>
              <i className="fa-solid fa-rotate" /> Refresh
            </button>
          </div>
          <div className="card-body">
            {kpis && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4,1fr)",
                  gap: 12,
                  marginBottom: 16,
                }}
              >
                {[
                  {
                    label: "Total Riders",
                    value: kpis.totalRiders,
                    color: "var(--text-primary)",
                  },
                  {
                    label: "Active Riders",
                    value: kpis.activeRiders,
                    color: "var(--green)",
                  },
                  {
                    label: "Total Deliveries",
                    value: kpis.totalDeliveries,
                    color: "var(--accent)",
                  },
                  {
                    label: "Overall Rate",
                    value: `${kpis.overallCompletionRate}%`,
                    color: rColor(parseFloat(kpis.overallCompletionRate)),
                  },
                ].map((s) => (
                  <div
                    key={s.label}
                    style={{
                      textAlign: "center",
                      padding: 12,
                      background: "var(--bg)",
                      borderRadius: "var(--radius-card)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <div
                      style={{ fontSize: 20, fontWeight: 900, color: s.color }}
                    >
                      {s.value}
                    </div>
                    <div
                      style={{
                        fontSize: 9,
                        color: "var(--text-muted)",
                        textTransform: "uppercase",
                        marginTop: 4,
                      }}
                    >
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4,1fr)",
                gap: 16,
              }}
            >
              {loading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      style={{
                        textAlign: "center",
                        padding: 12,
                        background: "var(--bg)",
                        borderRadius: "var(--radius-card)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      <div
                        style={{
                          height: 36,
                          width: 36,
                          borderRadius: "50%",
                          background: "#F3F4F6",
                          margin: "0 auto 8px",
                        }}
                      />
                      <div
                        style={{
                          height: 12,
                          background: "#F3F4F6",
                          borderRadius: 4,
                          width: "60%",
                          margin: "0 auto",
                        }}
                      />
                    </div>
                  ))
                : riders.slice(0, 4).map((r) => {
                    const rate = parseFloat(r.completionRate ?? "0");
                    return (
                      <div
                        key={r._id}
                        style={{
                          textAlign: "center",
                          padding: 12,
                          background: "var(--bg)",
                          borderRadius: "var(--radius-card)",
                          border: "1px solid var(--border)",
                          cursor: "pointer",
                        }}
                        onClick={() => onOpenRider(r)}
                      >
                        <ApiRiderAvatar rider={r} size={36} fontSize={11} />
                        <div
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            marginTop: 8,
                          }}
                        >
                          {r.fullName.split(" ")[0]}
                        </div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-around",
                            marginTop: 10,
                            gap: 4,
                          }}
                        >
                          <div className="kpi-ring-wrap">
                            <div
                              className={`kpi-ring ${rate >= 90 ? "good" : rate >= 80 ? "warn" : "bad"}`}
                            >
                              {rate.toFixed(0)}%
                            </div>
                            <div className="kpi-ring-label">Completion</div>
                          </div>
                          <div className="kpi-ring-wrap">
                            <div
                              className="kpi-ring"
                              style={{
                                borderColor: "var(--accent)",
                                color: "var(--accent)",
                                fontSize: 10,
                              }}
                            >
                              {r.activeDeliveries ?? 0}
                            </div>
                            <div className="kpi-ring-label">Active</div>
                          </div>
                          <div className="kpi-ring-wrap">
                            <div
                              className={`kpi-ring ${r.isAvailable ? "good" : "bad"}`}
                              style={{ fontSize: 9 }}
                            >
                              {r.isAvailable ? "Yes" : "No"}
                            </div>
                            <div className="kpi-ring-label">Avail.</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PerformancePanel;
