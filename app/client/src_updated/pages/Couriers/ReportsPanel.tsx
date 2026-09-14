// ReportsPanel.tsx — dynamic
import React, { useState, useEffect } from "react";
import { ApiCourier, RECENT_REPORTS, InnerTabs, EmptyState } from "./shared";
import { analyticsAPI, couriersAPI } from "../../services/api";

const REPORT_TYPES = [
  { value: "courier-performance", label: "Delivery Performance Summary" },
  { value: "orders", label: "Shipment Status Report" },
  { value: "financial", label: "COD Reconciliation Report" },
  { value: "inventory", label: "RTO Analysis Report" },
  { value: "sales", label: "Courier Comparison Report" },
  { value: "customers", label: "Financial — Courier Charges" },
];

const FORMAT_EXT: Record<string, string> = {
  excel: "xlsx",
  csv: "csv",
  pdf: "pdf",
};

const ReportsPanel: React.FC = () => {
  const [innerTab, setInnerTab] = useState("gen");
  const [couriers, setCouriers] = useState<ApiCourier[]>([]);
  const [reportType, setReportType] = useState("courier-performance");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [courier, setCourier] = useState("");
  const [format, setFormat] = useState("excel");
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState("");
  const [genSuccess, setGenSuccess] = useState("");

  useEffect(() => {
    couriersAPI
      .getAll({ limit: 50 })
      .then((r) => setCouriers(r.data?.data?.couriers ?? []))
      .catch(() => {});
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    setGenError("");
    setGenSuccess("");
    try {
      const params: Record<string, any> = { format };
      if (dateFrom) params.startDate = dateFrom;
      if (dateTo) params.endDate = dateTo;
      if (courier) params.courier = courier;

      const res = await analyticsAPI.exportReport(reportType, params);
      const ext = FORMAT_EXT[format] ?? format;
      const blob = new Blob([res.data], {
        type:
          (res.headers["content-type"] as string) ?? "application/octet-stream",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${reportType}-report.${ext}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setGenSuccess(`Report downloaded as ${reportType}-report.${ext}`);
    } catch (e: any) {
      setGenError(
        e?.response?.data?.message ??
          "Failed to generate report. Please check your date range and try again.",
      );
    } finally {
      setGenerating(false);
    }
  };

  const setPreset = (days: number) => {
    const to = new Date();
    const from = new Date();
    if (days === 0) {
      from.setDate(1);
    } else {
      from.setDate(from.getDate() - days);
    }
    setDateFrom(from.toISOString().slice(0, 10));
    setDateTo(to.toISOString().slice(0, 10));
  };

  return (
    <>
      <div className="panel-heading">Courier Reports</div>
      <div className="panel-desc">
        Generate and download detailed courier reports — performance, COD
        reconciliation, RTO analysis, and financial charges.
      </div>

      <InnerTabs
        tabs={[
          { id: "gen", label: "Generate Report" },
          { id: "sched", label: "Scheduled Reports" },
          { id: "hist", label: "Report History" },
        ]}
        active={innerTab}
        onChange={setInnerTab}
      />

      {/* ── GENERATE ── */}
      {innerTab === "gen" && (
        <div className="detail-grid-2">
          {/* Left — form */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <i className="fa-solid fa-file-chart-column" /> New Report
              </div>
            </div>
            <div className="card-body">
              {genError && (
                <div
                  style={{
                    marginBottom: 12,
                    padding: "7px 11px",
                    borderRadius: 6,
                    fontSize: 11,
                    background: "var(--red-bg)",
                    color: "var(--red)",
                    border: "1px solid #FECACA",
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                  }}
                >
                  <i
                    className="fa-solid fa-circle-exclamation"
                    style={{ flexShrink: 0 }}
                  />{" "}
                  {genError}
                </div>
              )}
              {genSuccess && (
                <div
                  style={{
                    marginBottom: 12,
                    padding: "7px 11px",
                    borderRadius: 6,
                    fontSize: 11,
                    background: "var(--green-bg)",
                    color: "var(--green)",
                    border: "1px solid #BBF7D0",
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                  }}
                >
                  <i
                    className="fa-solid fa-circle-check"
                    style={{ flexShrink: 0 }}
                  />{" "}
                  {genSuccess}
                </div>
              )}

              <div className="c-form-row single">
                <div className="c-form-group">
                  <div className="c-form-label">Report Type *</div>
                  <select
                    className="c-form-select"
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                  >
                    {REPORT_TYPES.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
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

              {/* Quick date presets */}
              <div
                style={{
                  display: "flex",
                  gap: 5,
                  marginBottom: 10,
                  flexWrap: "wrap",
                }}
              >
                <button
                  className="c-btn"
                  style={{ fontSize: 9.5, height: 22 }}
                  onClick={() => setPreset(0)}
                >
                  This Month
                </button>
                <button
                  className="c-btn"
                  style={{ fontSize: 9.5, height: 22 }}
                  onClick={() => setPreset(30)}
                >
                  Last 30d
                </button>
                <button
                  className="c-btn"
                  style={{ fontSize: 9.5, height: 22 }}
                  onClick={() => setPreset(90)}
                >
                  Last 90d
                </button>
                {(dateFrom || dateTo) && (
                  <button
                    className="c-btn"
                    style={{
                      fontSize: 9.5,
                      height: 22,
                      color: "var(--text-muted)",
                    }}
                    onClick={() => {
                      setDateFrom("");
                      setDateTo("");
                    }}
                  >
                    <i className="fa-solid fa-xmark" /> Clear
                  </button>
                )}
              </div>

              <div className="c-form-row">
                <div className="c-form-group">
                  <div className="c-form-label">Courier</div>
                  <select
                    className="c-form-select"
                    value={courier}
                    onChange={(e) => setCourier(e.target.value)}
                  >
                    <option value="">All Couriers</option>
                    {couriers.length > 0
                      ? couriers.map((c) => (
                          <option key={c._id} value={c._id}>
                            {c.name}
                          </option>
                        ))
                      : [
                          "TCS Express",
                          "Leopards Courier",
                          "M&P Express",
                          "Trax",
                          "PostEx",
                          "BlueEX",
                        ].map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                  </select>
                </div>
                <div className="c-form-group">
                  <div className="c-form-label">Format</div>
                  <select
                    className="c-form-select"
                    value={format}
                    onChange={(e) => setFormat(e.target.value)}
                  >
                    <option value="excel">Excel (.xlsx)</option>
                    <option value="csv">CSV (.csv)</option>
                    <option value="pdf">PDF</option>
                  </select>
                </div>
              </div>

              <hr />

              <button
                className="c-btn primary"
                style={{ width: "100%", justifyContent: "center" }}
                onClick={handleGenerate}
                disabled={generating}
              >
                <i
                  className={`fa-solid ${generating ? "fa-spinner fa-spin" : "fa-file-export"}`}
                />
                {generating ? "Generating…" : "Generate & Download"}
              </button>
            </div>
          </div>

          {/* Right — recent */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <i className="fa-solid fa-clock-rotate-left" /> Recent Reports
              </div>
            </div>
            <div className="card-body" style={{ padding: "0 14px" }}>
              {RECENT_REPORTS.map((r) => (
                <div className="list-item" key={r.name}>
                  <div
                    className="list-icon"
                    style={{ background: "var(--green-bg)" }}
                  >
                    <i
                      className="fa-solid fa-file-chart-column ic-green"
                      style={{ fontSize: 11 }}
                    />
                  </div>
                  <div className="list-content">
                    <div className="list-title">{r.name}</div>
                    <div className="list-meta">
                      {r.generated} · {r.format} · {r.size}
                    </div>
                  </div>
                  <div className="list-right">
                    <button
                      className="c-btn"
                      style={{ height: 23, fontSize: 9.5 }}
                      title="Download"
                    >
                      <i className="fa-solid fa-download" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {innerTab === "sched" && (
        <div className="card">
          <div className="card-body">
            <EmptyState
              icon="fa-calendar"
              title="No Scheduled Reports"
              desc="Set up automatic weekly or monthly courier reports."
            />
          </div>
        </div>
      )}

      {innerTab === "hist" && (
        <div className="card">
          <div className="card-body">
            <EmptyState
              icon="fa-folder-open"
              title="Report History"
              desc="Previously generated reports appear here."
            />
          </div>
        </div>
      )}
    </>
  );
};

export default ReportsPanel;
