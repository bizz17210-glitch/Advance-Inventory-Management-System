// ReportsPanel.tsx — dynamic (riders dropdown from API, report generation stays static)
import React, { useState, useEffect, useCallback } from "react";
import { ApiRider, RECENT_REPORTS, EmptyState } from "./shared";
import { ridersAPI } from "../../services/api";

const ReportsPanel: React.FC = () => {
  const [riders, setRiders] = useState<ApiRider[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [reportType, setReportType] = useState("Rider Performance Summary");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedRider, setSelectedRider] = useState("");
  const [format, setFormat] = useState("Excel (.xlsx)");
  const [success, setSuccess] = useState("");

  const loadRiders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ridersAPI.getAll({ limit: 50 });
      setRiders(res.data?.data?.riders ?? []);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRiders();
  }, [loadRiders]);

  const handleGenerate = async () => {
    setGenerating(true);
    // Simulate report generation — no dedicated report API endpoint
    await new Promise((res) => setTimeout(res, 1200));
    setSuccess(
      `${reportType} generated successfully. Download will start shortly.`,
    );
    setGenerating(false);
    setTimeout(() => setSuccess(""), 4000);
  };

  return (
    <>
      <div className="panel-heading">Rider Reports</div>
      <div className="panel-desc">
        Generate downloadable reports on rider performance, delivery statistics,
        earnings, and operational summaries.
      </div>

      <div className="detail-grid-2">
        {/* Generate Report */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <i className="fa-solid fa-file-chart-column" /> Generate Report
            </div>
          </div>
          <div className="card-body">
            {success && (
              <div className="alert-strip success" style={{ marginBottom: 12 }}>
                <i className="fa-solid fa-circle-check" /> {success}
              </div>
            )}
            <div className="c-form-row single">
              <div className="c-form-group">
                <div className="c-form-label">Report Type</div>
                <select
                  className="c-form-select"
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                >
                  <option>Rider Performance Summary</option>
                  <option>Daily Delivery Log</option>
                  <option>Earnings &amp; Payroll Report</option>
                  <option>COD Collection Report</option>
                  <option>Failed Deliveries Report</option>
                  <option>Route Efficiency Report</option>
                </select>
              </div>
            </div>
            <div className="c-form-row">
              <div className="c-form-group">
                <div className="c-form-label">Date From</div>
                <input
                  className="c-form-input"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div className="c-form-group">
                <div className="c-form-label">Date To</div>
                <input
                  className="c-form-input"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
            </div>
            <div className="c-form-row">
              <div className="c-form-group">
                <div className="c-form-label">Rider</div>
                <select
                  className="c-form-select"
                  value={selectedRider}
                  onChange={(e) => setSelectedRider(e.target.value)}
                >
                  <option value="">All Riders</option>
                  {loading ? (
                    <option disabled>Loading riders…</option>
                  ) : (
                    riders.map((r) => (
                      <option key={r._id} value={r._id}>
                        {r.fullName}
                      </option>
                    ))
                  )}
                </select>
              </div>
              <div className="c-form-group">
                <div className="c-form-label">Format</div>
                <select
                  className="c-form-select"
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                >
                  <option>Excel (.xlsx)</option>
                  <option>CSV (.csv)</option>
                  <option>PDF</option>
                </select>
              </div>
            </div>
            <hr
              style={{
                border: "none",
                borderTop: "1px solid var(--divider)",
                margin: "12px 0",
              }}
            />
            <button
              className="c-btn primary"
              style={{ width: "100%", justifyContent: "center" }}
              onClick={handleGenerate}
              disabled={generating}
            >
              {generating ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin" /> Generating…
                </>
              ) : (
                <>
                  <i className="fa-solid fa-file-export" /> Generate &amp;
                  Download
                </>
              )}
            </button>
          </div>
        </div>

        {/* Recent Reports (static — no report history API) */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <i className="fa-solid fa-clock-rotate-left" /> Recent Reports
            </div>
          </div>
          <div className="card-body" style={{ padding: "0 14px" }}>
            {RECENT_REPORTS.length === 0 ? (
              <EmptyState
                icon="fa-file-chart-column"
                title="No Recent Reports"
                desc="Generated reports will appear here."
              />
            ) : (
              RECENT_REPORTS.map((r) => (
                <div className="list-item" key={r.name}>
                  <div
                    className="list-icon"
                    style={{ background: "var(--green-bg)" }}
                  >
                    <i
                      className="fa-solid fa-file-chart-column"
                      style={{ color: "var(--green)", fontSize: 11 }}
                    />
                  </div>
                  <div className="list-content">
                    <div className="list-title">{r.name}</div>
                    <div className="list-meta">
                      {r.date} · {r.format} · {r.size}
                    </div>
                  </div>
                  <div className="list-right">
                    <button
                      className="c-btn"
                      style={{ height: 22, fontSize: 9.5 }}
                    >
                      <i className="fa-solid fa-download" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Rider Stats Summary (from API) */}
      {riders.length > 0 && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <i className="fa-solid fa-chart-bar" /> Quick Stats — All Riders
            </div>
            <button className="c-btn" onClick={loadRiders}>
              <i className="fa-solid fa-rotate" />
            </button>
          </div>
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr>
                  <th>Rider</th>
                  <th>Zone</th>
                  <th>Vehicle</th>
                  <th>Total Deliveries</th>
                  <th>Completed</th>
                  <th>Completion %</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 4 }).map((_, i) => (
                      <tr key={i}>
                        {Array.from({ length: 7 }).map((_, j) => (
                          <td key={j}>
                            <div
                              style={{
                                height: 12,
                                background: "#F3F4F6",
                                borderRadius: 4,
                              }}
                            />
                          </td>
                        ))}
                      </tr>
                    ))
                  : riders.map((r) => (
                      <tr key={r._id}>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: 11 }}>
                            {r.fullName}
                          </div>
                          <div className="td-sub">{r.phone}</div>
                        </td>
                        <td>
                          <span className="tag">{r.assignedZone ?? "—"}</span>
                        </td>
                        <td>
                          <span className="tag">{r.vehicle?.type ?? "—"}</span>
                        </td>
                        <td>{r.performanceMetrics?.totalDeliveries ?? "—"}</td>
                        <td style={{ color: "var(--green)", fontWeight: 600 }}>
                          {r.performanceMetrics?.completedDeliveries ?? "—"}
                        </td>
                        <td>
                          {r.completionRate ? (
                            <span
                              style={{
                                fontWeight: 700,
                                color:
                                  parseFloat(r.completionRate) >= 90
                                    ? "var(--green)"
                                    : parseFloat(r.completionRate) >= 80
                                      ? "var(--yellow)"
                                      : "var(--red)",
                              }}
                            >
                              {parseFloat(r.completionRate).toFixed(1)}%
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td>
                          <span
                            style={{
                              fontSize: 10.5,
                              fontWeight: 600,
                              color:
                                r.status === "Active"
                                  ? "var(--green)"
                                  : "var(--text-muted)",
                            }}
                          >
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
};

export default ReportsPanel;
