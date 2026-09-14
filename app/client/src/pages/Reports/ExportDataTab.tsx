// ═══════════════════════════════════════════════════════════
// ExportDataTab.tsx  —  Live API export history
// ═══════════════════════════════════════════════════════════
import React, { useState, useEffect } from "react";

// ── Export Card ──────────────────────────────────────────────
interface ExportCardProps {
  type: string;
  icon: string;
  bgColor: string;
  iconColor: string;
  subtitle: string;
  description: string;
  filterLabel: string;
  filterOptions: string[];
}

import {
  EXPORT_CARDS,
  statusBadgeClass,
  REPORT_KEY_MAP,
  resolveDateRange,
  downloadCSV,
  downloadExcel,
  downloadPDF,
  viewReportOnline,
} from "./ReportsShared";
import { analyticsAPI } from "../../services/api";

const ExportCard: React.FC<ExportCardProps> = ({
  type,
  icon,
  bgColor,
  iconColor,
  subtitle,
  description,
  filterLabel,
  filterOptions,
}) => {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">(
    "idle",
  );
  const [viewing, setViewing] = useState(false);
  const [selFilter, setSelFilter] = useState(filterOptions[0]);
  const [selFormat, setSelFormat] = useState<"CSV" | "Excel (.xlsx)" | "PDF">(
    "CSV",
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // shared helper — fetches report data with date range resolved from filter
  const fetchRows = async () => {
    const reportKey =
      REPORT_KEY_MAP[type] ?? type.toLowerCase().replace(/\s+/g, "-");
    const dateRange = resolveDateRange(selFilter);
    const res = await analyticsAPI.getReportData(reportKey, dateRange);
    const rows = res.data?.data ?? [];
    return Array.isArray(rows) ? rows : [];
  };

  const handleExport = async () => {
    setState("loading");
    setErrorMsg(null);
    try {
      const rows = await fetchRows();
      if (!rows.length) {
        setErrorMsg("No records found for this selection.");
        setState("idle");
        return;
      }
      const filenameBase = `${type.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}`;

      if (selFormat === "CSV") downloadCSV(`${filenameBase}.csv`, rows);
      else if (selFormat === "Excel (.xlsx)")
        await downloadExcel(`${filenameBase}.xlsx`, rows, type);
      else if (selFormat === "PDF")
        await downloadPDF(`${filenameBase}.pdf`, type, rows);

      setState("done");
      setTimeout(() => setState("idle"), 3000);
    } catch (e: any) {
      setErrorMsg(e?.response?.data?.message || "Export failed. Try again.");
      setState("idle");
    }
  };

  const handleViewOnline = async () => {
    setViewing(true);
    setErrorMsg(null);
    try {
      const rows = await fetchRows();
      viewReportOnline(type, rows);
    } catch (e: any) {
      setErrorMsg(
        e?.response?.data?.message || "Could not load report preview.",
      );
    } finally {
      setViewing(false);
    }
  };

  return (
    <div className="card">
      <div className="card-body" style={{ padding: 16 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 10,
          }}
        >
          <div className="export-icon-box" style={{ background: bgColor }}>
            <i
              className={`fa-solid ${icon}`}
              style={{ color: iconColor, fontSize: 16 }}
            />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>{type}</div>
            <div style={{ fontSize: 10.5, color: "var(--text-muted)" }}>
              {subtitle}
            </div>
          </div>
        </div>

        <div
          style={{
            fontSize: 11.5,
            color: "var(--text-secondary)",
            marginBottom: 12,
          }}
        >
          {description}
        </div>

        <div className="form-group" style={{ marginBottom: 8 }}>
          <div className="form-label">{filterLabel}</div>
          <select
            className="form-select"
            style={{ width: "100%" }}
            value={selFilter}
            onChange={(e) => setSelFilter(e.target.value)}
          >
            {filterOptions.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </div>

        <div className="form-group" style={{ marginBottom: 10 }}>
          <div className="form-label">Format</div>
          <select
            className="form-select"
            style={{ width: "100%" }}
            value={selFormat}
            onChange={(e) => setSelFormat(e.target.value as typeof selFormat)}
          >
            <option>CSV</option>
            <option>Excel (.xlsx)</option>
            <option>PDF</option>
          </select>
        </div>

        {errorMsg && (
          <div style={{ fontSize: 10.5, color: "var(--red)", marginBottom: 8 }}>
            <i className="fa-solid fa-circle-exclamation" /> {errorMsg}
          </div>
        )}

        {/* ── Action buttons ───────────────────────────── */}
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="header-btn"
            style={{ flex: 1, justifyContent: "center" }}
            onClick={handleViewOnline}
            disabled={viewing}
          >
            {viewing ? (
              <>
                <i className="fa-solid fa-spinner fa-spin" /> Loading...
              </>
            ) : (
              <>
                <i className="fa-solid fa-eye" /> View Online
              </>
            )}
          </button>

          <button
            className="header-btn primary"
            style={{
              flex: 1,
              justifyContent: "center",
              ...(state === "done"
                ? { background: "var(--green)", borderColor: "var(--green)" }
                : {}),
            }}
            onClick={handleExport}
            disabled={state === "loading"}
          >
            {state === "loading" && (
              <>
                <i className="fa-solid fa-spinner fa-spin" /> Preparing...
              </>
            )}
            {state === "done" && (
              <>
                <i className="fa-solid fa-circle-check" /> Downloaded
              </>
            )}
            {state === "idle" && (
              <>
                <i className="fa-solid fa-download" /> Export
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main Tab ─────────────────────────────────────────────────
const ExportDataTab: React.FC = () => {
  const [history, setHistory] = useState<any[]>([]);
  const [histLoading, setHistLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        // Use analytics export history if available, otherwise notifications history as fallback
        const res = await analyticsAPI.getDashboard();
        const raw =
          res.data?.data?.exportHistory ?? res.data?.exportHistory ?? [];
        setHistory(Array.isArray(raw) ? raw : []);
      } catch {
        setHistory([]);
      } finally {
        setHistLoading(false);
      }
    };
    fetchHistory();
  }, []);

  return (
    <>
      <div className="info-banner">
        <i className="fa-solid fa-circle-info" />
        <div className="info-banner-text">
          Export any data set as <strong>CSV or Excel</strong>. Large exports
          are queued and a download link is sent to your dashboard. All exports
          are logged in the audit trail.
        </div>
      </div>

      <div className="grid-3" style={{ marginBottom: 14 }}>
        {EXPORT_CARDS.map((card) => (
          <ExportCard key={card.type} {...card} />
        ))}
      </div>

      {/* Export History */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <i className="fa-solid fa-clock-rotate-left" /> Export History
          </div>
          <div className="card-actions">
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
              Last 10 exports
            </span>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Export Type</th>
                <th>Date Range</th>
                <th>Records</th>
                <th>Format</th>
                <th>Exported By</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {histLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 8 }).map((__, j) => (
                      <td key={j}>
                        <div
                          style={{
                            height: 12,
                            background: "var(--divider)",
                            borderRadius: 4,
                            width: "80%",
                          }}
                        />
                      </td>
                    ))}
                  </tr>
                ))
              ) : history.length ? (
                history.map((e: any, i: number) => (
                  <tr key={i}>
                    <td
                      style={{
                        fontSize: 10.5,
                        color: "var(--text-muted)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {e.time ?? e.createdAt ?? e.timestamp ?? "—"}
                    </td>
                    <td>
                      <strong style={{ fontSize: 11.5 }}>
                        {e.type ?? e.exportType ?? "—"}
                      </strong>
                    </td>
                    <td style={{ color: "var(--text-muted)" }}>
                      {e.range ?? e.dateRange ?? "—"}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      {(e.records ?? e.recordCount ?? 0).toLocaleString()}
                    </td>
                    <td>
                      <span className="tag">{e.fmt ?? e.format ?? "—"}</span>
                    </td>
                    <td>{e.by ?? e.exportedBy ?? e.user ?? "—"}</td>
                    <td>
                      <span
                        className={`badge ${statusBadgeClass(e.status ?? "Ready")}`}
                      >
                        {e.status ?? "Ready"}
                      </span>
                    </td>
                    <td>
                      <button
                        className="t-filter-btn"
                        style={{ height: 24, fontSize: 10 }}
                      >
                        <i className="fa-solid fa-download" /> Download
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={8}
                    style={{
                      textAlign: "center",
                      padding: "20px 0",
                      color: "var(--text-muted)",
                      fontSize: 12,
                    }}
                  >
                    No export history yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default ExportDataTab;
