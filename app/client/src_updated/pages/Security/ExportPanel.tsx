import React, { useState } from "react";
import { analyticsAPI } from "../../services/api";

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

interface ExportEntry {
  time: string;
  type: string;
  format: string;
  records: string;
  by: string;
  status: "Ready" | "Processing" | "Failed";
}

// ═══════════════════════════════════════════════════════════
// STATIC DATA — history is local (no export-log endpoint)
// ═══════════════════════════════════════════════════════════

const INITIAL_EXPORT_HISTORY: ExportEntry[] = [
  {
    time: "11 May 2026, 14:00",
    type: "Orders (All)",
    format: "CSV",
    records: "1,284",
    by: "Admin Khan",
    status: "Ready",
  },
  {
    time: "11 May 2026, 10:30",
    type: "Customer Data",
    format: "Excel",
    records: "3,142",
    by: "Sara Khan",
    status: "Ready",
  },
  {
    time: "10 May 2026, 17:00",
    type: "Full System Export",
    format: "JSON",
    records: "—",
    by: "Admin Khan",
    status: "Ready",
  },
  {
    time: "09 May 2026, 09:00",
    type: "Financial Records",
    format: "Excel",
    records: "892",
    by: "Fatima Noor",
    status: "Ready",
  },
  {
    time: "01 May 2026, 08:30",
    type: "Audit Logs",
    format: "CSV",
    records: "4,820",
    by: "Admin Khan",
    status: "Ready",
  },
];

// Map UI export type → analytics report key
const EXPORT_TYPE_MAP: Record<string, string> = {
  "Full System Export": "full",
  "Products & Inventory": "inventory",
  "Orders (All)": "orders",
  "Customer Data": "customers",
  "Financial Records": "financial",
  "Staff & Activity Logs": "staff",
  "Audit Logs": "audit",
};

// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════

function badgeClass(s: string): string {
  const m: Record<string, string> = {
    Ready: "green",
    Processing: "yellow",
    Failed: "red",
  };
  return m[s] || "gray";
}

const Badge: React.FC<{ label: string }> = ({ label }) => (
  <span className={`badge ${badgeClass(label)}`}>{label}</span>
);

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function todayLabel(): string {
  const d = new Date();
  return `${d.getDate()} ${d.toLocaleString("default", { month: "short" })} ${d.getFullYear()}, ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

// ═══════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════

const ExportPanel: React.FC = () => {
  const [exportType, setExportType] = useState("Full System Export");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [format, setFormat] = useState("Excel (.xlsx)");
  const [sensitive, setSensitive] = useState("No (Redacted)");

  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportDone, setExportDone] = useState(false);

  const [history, setHistory] = useState<ExportEntry[]>(INITIAL_EXPORT_HISTORY);

  // ── Trigger export via analyticsAPI.exportReport ─────────
  const triggerExport = async () => {
    setExporting(true);
    setExportDone(false);
    setExportError(null);

    const reportKey = EXPORT_TYPE_MAP[exportType] ?? "full";
    const params: Record<string, string> = {};
    if (dateFrom) params.from = dateFrom;
    if (dateTo) params.to = dateTo;

    try {
      const res = await analyticsAPI.exportReport(reportKey, params);

      // res.data is a Blob (responseType: 'blob')
      const blob: Blob = res.data;
      const ext = format.includes("CSV")
        ? "csv"
        : format.includes("JSON")
          ? "json"
          : "xlsx";
      downloadBlob(blob, `${reportKey}-export-${Date.now()}.${ext}`);

      setExportDone(true);

      // Add to local history
      setHistory((prev) => [
        {
          time: todayLabel(),
          type: exportType,
          format: ext.toUpperCase(),
          records: "—",
          by: "You",
          status: "Ready",
        },
        ...prev,
      ]);

      setTimeout(() => setExportDone(false), 4000);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ?? "Export failed. Please try again.";
      setExportError(msg);
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      {/* Info Banner */}
      <div className="alert-strip info">
        <i className="fa-solid fa-circle-info" />
        All data exports are logged in the Audit Trail. Large exports are queued
        and a download notification is sent when ready. Only Admins and Managers
        can initiate exports.
      </div>

      {exportError && (
        <div className="alert-strip danger">
          <i className="fa-solid fa-circle-xmark" /> {exportError}
          <button
            className="t-btn"
            style={{ marginLeft: "auto" }}
            onClick={() => setExportError(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="detail-grid-2">
        {/* ── Generate Export ──────────────────────────────── */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <div className="card-title">
              <i className="fa-solid fa-file-export ic-orange" /> Generate
              Export
            </div>
          </div>
          <div className="card-body">
            <div className="form-row single">
              <div className="form-group">
                <div className="form-label">Export Type</div>
                <select
                  className="form-select"
                  value={exportType}
                  onChange={(e) => setExportType(e.target.value)}
                >
                  {Object.keys(EXPORT_TYPE_MAP).map((k) => (
                    <option key={k}>{k}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <div className="form-label">Date From</div>
                <input
                  className="form-input"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div className="form-group">
                <div className="form-label">Date To</div>
                <input
                  className="form-input"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <div className="form-label">File Format</div>
                <select
                  className="form-select"
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                >
                  <option>Excel (.xlsx)</option>
                  <option>CSV (.csv)</option>
                  <option>JSON</option>
                </select>
              </div>
              <div className="form-group">
                <div className="form-label">Include Sensitive Data</div>
                <select
                  className="form-select"
                  value={sensitive}
                  onChange={(e) => setSensitive(e.target.value)}
                >
                  <option>No (Redacted)</option>
                  <option>Yes (Admin only)</option>
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
              className="t-btn primary"
              style={{
                width: "100%",
                justifyContent: "center",
                background: exportDone ? "var(--green)" : undefined,
                borderColor: exportDone ? "var(--green)" : undefined,
              }}
              onClick={triggerExport}
              disabled={exporting}
            >
              {exporting ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin" /> Preparing
                  export…
                </>
              ) : exportDone ? (
                <>
                  <i className="fa-solid fa-circle-check" /> Downloaded!
                </>
              ) : (
                <>
                  <i className="fa-solid fa-file-export" /> Export Data
                </>
              )}
            </button>
          </div>
        </div>

        {/* ── Export History ───────────────────────────────── */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <div className="card-title">
              <i className="fa-solid fa-clock-rotate-left" /> Export History
            </div>
            <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>
              Session + seeded records
            </span>
          </div>
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Type</th>
                  <th>Format</th>
                  <th>Records</th>
                  <th>By</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {history.map((e, i) => (
                  <tr key={i}>
                    <td
                      style={{
                        fontSize: 10,
                        color: "var(--text-muted)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {e.time}
                    </td>
                    <td style={{ fontWeight: 500 }}>{e.type}</td>
                    <td>
                      <span className="tag">{e.format}</span>
                    </td>
                    <td style={{ textAlign: "center" }}>{e.records}</td>
                    <td>{e.by}</td>
                    <td>
                      <Badge label={e.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};

export default ExportPanel;
