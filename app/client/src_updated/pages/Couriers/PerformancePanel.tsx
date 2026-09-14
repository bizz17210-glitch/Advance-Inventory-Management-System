// PerformancePanel.tsx — dynamic
import React, { useState, useEffect, useCallback } from "react";
import {
  PERF_DATA,
  rColor,
  PerfBar,
  StarRating,
  InnerTabs,
  EmptyState,
  TableSkeleton,
} from "./shared";
import { couriersAPI } from "../../services/api";

interface PerfRow {
  id: string;
  name: string;
  totalDeliveries: number;
  successfulDeliveries: number;
  successRate: string;
  avgDeliveryTime: number;
  cancellationRate: number;
}

const PerformancePanel: React.FC = () => {
  const [innerTab, setInnerTab] = useState("summary");
  const [data, setData] = useState<PerfRow[]>([]);
  const [overallKPIs, setOverallKPIs] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await couriersAPI.getPerformance();
      const d = res.data?.data;
      setData(d?.couriers ?? []);
      setOverallKPIs(d?.overallKPIs ?? null);
    } catch (e: any) {
      setError(
        e?.response?.data?.message ?? "Failed to load performance data.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (innerTab === "summary") load();
  }, [load, innerTab]);

  // Fall back to static data when API returns empty
  const rows: PerfRow[] =
    data.length > 0
      ? data
      : PERF_DATA.map((p) => ({
          id: p.name,
          name: p.name,
          totalDeliveries: p.assigned,
          successfulDeliveries: p.delivered,
          successRate: String(p.rate),
          avgDeliveryTime: p.avgDays,
          cancellationRate: p.rtoRate,
        }));

  const best = rows.reduce(
    (a, b) => (parseFloat(b.successRate) > parseFloat(a.successRate) ? b : a),
    rows[0],
  );
  const fastest = rows.reduce(
    (a, b) => (b.avgDeliveryTime < a.avgDeliveryTime ? b : a),
    rows[0],
  );
  const overall =
    overallKPIs?.avgSuccessRate ??
    (
      rows.reduce((a, b) => a + parseFloat(b.successRate), 0) /
      (rows.length || 1)
    ).toFixed(1);

  return (
    <>
      <div className="panel-heading">Courier Performance</div>
      <div className="panel-desc">
        Comparative analytics — delivery success rates, average delivery times,
        COD collection percentages, and SLA compliance scores.
      </div>

      <InnerTabs
        tabs={[
          { id: "summary", label: "Summary" },
          { id: "detail", label: "Detailed Metrics" },
          { id: "compare", label: "Compare Couriers" },
          { id: "trends", label: "Trends" },
        ]}
        active={innerTab}
        onChange={setInnerTab}
      />

      {innerTab === "summary" && (
        <>
          <div className="mini-stats">
            <div className="mini-stat">
              <div className="ms-label">Best Performer</div>
              <div className="ms-value" style={{ fontSize: 14 }}>
                {loading ? "…" : (best?.name?.split(" ")[0] ?? "—")}
              </div>
              <div className="ms-trend up">
                {loading ? "" : `${best?.successRate ?? "—"}% delivery rate`}
              </div>
            </div>
            <div className="mini-stat">
              <div className="ms-label">Fastest Delivery</div>
              <div className="ms-value" style={{ fontSize: 14 }}>
                {loading ? "…" : (fastest?.name?.split(" ")[0] ?? "—")}
              </div>
              <div className="ms-trend up">
                {loading ? "" : `${fastest?.avgDeliveryTime ?? "—"}d avg.`}
              </div>
            </div>
            <div className="mini-stat">
              <div className="ms-label">API Integrated</div>
              <div className="ms-value">
                {overallKPIs?.apiIntegrated ?? "—"}
              </div>
              <div className="ms-trend">
                of {overallKPIs?.totalCouriers ?? rows.length} couriers
              </div>
            </div>
            <div className="mini-stat">
              <div className="ms-label">Overall Success</div>
              <div className="ms-value">{loading ? "…" : `${overall}%`}</div>
              <div className="ms-trend up">Across all couriers</div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <i className="fa-solid fa-trophy" /> Courier Performance
                Scorecard
              </div>
              <button className="c-btn" onClick={load}>
                <i className="fa-solid fa-rotate" /> Refresh
              </button>
            </div>
            {error && (
              <div
                style={{
                  padding: "8px 14px",
                  color: "var(--red)",
                  fontSize: 11,
                }}
              >
                <i className="fa-solid fa-circle-exclamation" /> {error}
              </div>
            )}
            <div className="tbl-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Courier</th>
                    <th>Total Deliveries</th>
                    <th>Successful</th>
                    <th>Success Rate</th>
                    <th>Avg. Days</th>
                    <th>Cancel Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <TableSkeleton rows={4} cols={6} />
                  ) : (
                    rows.map((p) => {
                      const rate = parseFloat(p.successRate);
                      return (
                        <tr key={p.id}>
                          <td>
                            <strong>{p.name}</strong>
                          </td>
                          <td>{p.totalDeliveries}</td>
                          <td
                            style={{ color: "var(--green)", fontWeight: 600 }}
                          >
                            {p.successfulDeliveries}
                          </td>
                          <td>
                            <PerfBar pct={rate} color={rColor(rate)} />
                          </td>
                          <td>{p.avgDeliveryTime}d</td>
                          <td
                            style={{
                              color:
                                p.cancellationRate > 10
                                  ? "var(--red)"
                                  : "var(--text-secondary)",
                            }}
                          >
                            {p.cancellationRate}%
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {innerTab === "detail" && (
        <div className="card">
          <div className="card-body">
            <EmptyState
              icon="fa-chart-simple"
              title="Detailed Metrics"
              desc="Select a courier and date range to view granular breakdown."
            />
          </div>
        </div>
      )}
      {innerTab === "compare" && (
        <div className="card">
          <div className="card-body">
            <EmptyState
              icon="fa-chart-bar"
              title="Courier Comparison"
              desc="Side-by-side comparison of all metrics per courier."
            />
          </div>
        </div>
      )}
      {innerTab === "trends" && (
        <div className="card">
          <div className="card-body">
            <EmptyState
              icon="fa-chart-line"
              title="Performance Trends"
              desc="Month-over-month delivery rate and timing trends."
            />
          </div>
        </div>
      )}
    </>
  );
};

export default PerformancePanel;
