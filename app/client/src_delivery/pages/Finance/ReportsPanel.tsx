import React, { useState, useEffect } from "react";
import { fmt, fmtDate, SkeletonRows, ErrorBanner } from "./helpers";
import { financialAnalyticsAPI, analyticsAPI } from "../../services/api";

interface MonthlyRow {
  month: string;
  revenue: number;
  cod: number;
  prepaid: number;
  expenses: number;
  profit: number;
}

const ReportsPanel: React.FC = () => {
  const [monthly, setMonthly] = useState<MonthlyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reportType, setReportType] = useState("Daily Financial Summary");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [groupBy, setGroupBy] = useState("Monthly");
  const [format, setFormat] = useState("Excel (.xlsx)");
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    setError("");
    try {
      const groupByMap: Record<string, "day" | "month"> = {
        Daily: "day",
        Weekly: "day",
        Monthly: "month",
      };
      const gb = groupByMap[groupBy] || "day";
      const params = {
        from: dateFrom || undefined,
        to: dateTo || undefined,
        groupBy: gb,
      };

      let data: any[] = [];

      if (
        reportType === "Daily Financial Summary" ||
        reportType === "Revenue vs Expenses" ||
        reportType === "Profit & Loss Statement" ||
        reportType === "Monthly Expense Report"
      ) {
        const res = await financialAnalyticsAPI.getFinancial(params);
        data = res.data?.data?.timeline || [];
      } else if (
        reportType === "Weekly COD Report" ||
        reportType === "COD Reconciliation Report"
      ) {
        const res = await analyticsAPI.exportReport("orders", params);
        data = res.data?.data || [];
      } else if (reportType === "Prepaid Orders Report") {
        const res = await analyticsAPI.exportReport("orders", params);
        data = (res.data?.data || []).filter(
          (o: any) => o.paymentMethod === "Prepaid",
        );
      } else if (reportType === "Supplier Payment History") {
        const res = await analyticsAPI.exportReport("financial", params);
        data = res.data?.data || [];
      }

      if (!data.length) {
        setError("No data available for the selected period.");
        return;
      }

      if (format === "PDF") {
        downloadPDF(data, reportType);
      } else {
        const ext = format === "Excel (.xlsx)" ? ".xlsx" : ".csv";
        downloadCSV(data, reportType, ext);
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to generate report.");
    } finally {
      setGenerating(false);
    }
  };

  const downloadCSV = (data: any[], name: string, ext = ".csv") => {
    if (!data.length) {
      setError("No data available for the selected period.");
      return;
    }
    const headers = Object.keys(data[0]);
    const rows = data.map((row) =>
      headers.map((h) => JSON.stringify(row[h] ?? "")).join(","),
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadPDF = (data: any[], name: string) => {
    const headers = Object.keys(data[0]);
    const rows = data.map((row) => headers.map((h) => row[h] ?? ""));

    const tableRows = rows
      .map(
        (row) =>
          `<tr>${row.map((cell) => `<td style="padding:4px 8px;border:1px solid #e5e7eb;font-size:11px">${cell}</td>`).join("")}</tr>`,
      )
      .join("");

    const html = `
      <html><head><title>${name}</title>
      <style>body{font-family:sans-serif;padding:20px}h2{font-size:16px;margin-bottom:12px}table{border-collapse:collapse;width:100%}th{background:#f9fafb;padding:6px 8px;border:1px solid #e5e7eb;font-size:11px;text-align:left}</style>
      </head><body>
      <h2>${name}</h2>
      <p style="font-size:11px;color:#6b7280;margin-bottom:12px">Generated: ${new Date().toLocaleString()}</p>
      <table><thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead>
      <tbody>${tableRows}</tbody></table>
      </body></html>`;

    const win = window.open("", "_blank");
    if (win) {
      win.document.write(html);
      win.document.close();
      win.print();
    }
  };

  const handlePreview = async () => {
    setGenerating(true);
    setError("");
    try {
      const groupByMap: Record<string, "day" | "month"> = {
        Daily: "day",
        Weekly: "day",
        Monthly: "month",
      };
      const gb = groupByMap[groupBy] || "day";
      const params = {
        from: dateFrom || undefined,
        to: dateTo || undefined,
        groupBy: gb,
      };

      let data: any[] = [];

      if (
        reportType === "Daily Financial Summary" ||
        reportType === "Revenue vs Expenses" ||
        reportType === "Profit & Loss Statement" ||
        reportType === "Monthly Expense Report"
      ) {
        const res = await financialAnalyticsAPI.getFinancial(params);
        data = res.data?.data?.timeline || [];
      } else if (
        reportType === "Weekly COD Report" ||
        reportType === "COD Reconciliation Report"
      ) {
        const res = await analyticsAPI.exportReport("orders", params);
        data = res.data?.data || [];
      } else if (reportType === "Prepaid Orders Report") {
        const res = await analyticsAPI.exportReport("orders", params);
        data = (res.data?.data || []).filter(
          (o: any) => o.paymentMethod === "Prepaid",
        );
      } else if (reportType === "Supplier Payment History") {
        const res = await analyticsAPI.exportReport("financial", params);
        data = res.data?.data || [];
      }

      if (!data.length) {
        setError("No data available for the selected period.");
        return;
      }

      const headers = Object.keys(data[0]);
      const rows = data.map((row) => headers.map((h) => row[h] ?? ""));

      const tableRows = rows
        .map(
          (row) =>
            `<tr>${row.map((cell) => `<td style="padding:5px 10px;border:1px solid #e5e7eb;font-size:11px">${cell}</td>`).join("")}</tr>`,
        )
        .join("");

      const html = `
        <html><head><title>${reportType}</title>
        <style>
          body{font-family:sans-serif;padding:28px;background:#f7f8fa}
          h2{font-size:18px;font-weight:800;margin-bottom:4px}
          .meta{font-size:11px;color:#6b7280;margin-bottom:16px}
          table{border-collapse:collapse;width:100%;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.06)}
          th{background:#fafafa;padding:8px 10px;border:1px solid #e5e7eb;font-size:10.5px;text-align:left;font-weight:600;text-transform:uppercase;letter-spacing:0.4px;color:#6b7280}
          tr:hover td{background:#fafbfc}
          @media print{body{padding:0}button{display:none}}
        </style>
        </head><body>
        <h2>${reportType}</h2>
        <div class="meta">
          Period: ${dateFrom || "All time"} → ${dateTo || "Today"} &nbsp;|&nbsp;
          Group By: ${groupBy} &nbsp;|&nbsp;
          Generated: ${new Date().toLocaleString()}
        </div>
        <table>
          <thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead>
          <tbody>${tableRows}</tbody>
        </table>
        <br>
        <button onclick="window.print()" style="padding:8px 16px;background:#ff6a00;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:12px">
          🖨️ Print / Save as PDF
        </button>
        </body></html>`;

      const win = window.open("", "_blank");
      if (win) {
        win.document.write(html);
        win.document.close();
      }
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to preview report.");
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    financialAnalyticsAPI
      .getSales({ groupBy: "month" })
      .then((r) => {
        const raw: any[] = r.data.data?.timeline || r.data.data?.monthly || [];
        const rows: MonthlyRow[] = raw.map((item: any) => ({
          month: item.month || item.date || "—",
          revenue: Number(item.revenue ?? 0),
          cod: Number(item.codRevenue ?? item.cod ?? 0),
          prepaid: Number(item.prepaidRevenue ?? item.prepaid ?? 0),
          expenses: Number(item.expenses ?? 0),
          profit: Number(item.profit ?? 0),
        }));
        setMonthly(rows);
      })
      .catch((e) =>
        setError(e?.response?.data?.message || "Failed to load report data."),
      )
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <div className="panel-heading">Financial Reports</div>
      <div className="panel-desc">
        Generate and download detailed financial reports by date range, type, or
        category.
      </div>

      {error && (
        <ErrorBanner message={error} onRetry={() => window.location.reload()} />
      )}

      <div className="detail-grid-2">
        {/* Generate Report Form */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <div className="card-title">
              <i className="fa-solid fa-file-chart-column" /> Generate Report
            </div>
          </div>
          <div className="card-body">
            <div className="f-form-row single">
              <div className="f-form-group">
                <div className="f-form-label">Report Type</div>
                <select
                  className="f-form-select"
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                >
                  <option>Daily Financial Summary</option>
                  <option>Weekly COD Report</option>
                  <option>Monthly Expense Report</option>
                  <option>Supplier Payment History</option>
                  <option>Revenue vs Expenses</option>
                  <option>Profit &amp; Loss Statement</option>
                  <option>COD Reconciliation Report</option>
                  <option>Prepaid Orders Report</option>
                </select>
              </div>
            </div>
            <div className="f-form-row">
              <div className="f-form-group">
                <div className="f-form-label">Date From</div>
                <input
                  className="f-form-input"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div className="f-form-group">
                <div className="f-form-label">Date To</div>
                <input
                  className="f-form-input"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
            </div>
            <div className="f-form-row">
              <div className="f-form-group">
                <div className="f-form-label">Group By</div>
                <select
                  className="f-form-select"
                  value={groupBy}
                  onChange={(e) => setGroupBy(e.target.value)}
                >
                  <option>Daily</option>
                  <option>Weekly</option>
                  <option>Monthly</option>
                </select>
              </div>
              <div className="f-form-group">
                <div className="f-form-label">Format</div>
                <select
                  className="f-form-select"
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                >
                  <option>Excel (.xlsx)</option>
                  <option>CSV (.csv)</option>
                  <option>PDF</option>
                </select>
              </div>
            </div>
            <hr />
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="f-btn primary"
                style={{ flex: 1, justifyContent: "center" }}
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
              <button
                className="f-btn"
                style={{ justifyContent: "center" }}
                onClick={handlePreview}
                disabled={generating}
              >
                <i className="fa-solid fa-arrow-up-right-from-square" /> Preview
              </button>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <div className="card-title">
              <i className="fa-solid fa-circle-info" /> Quick Summary
            </div>
          </div>
          <div
            className="card-body"
            style={{
              padding: "12px 14px",
              fontSize: 11,
              color: "var(--text-secondary)",
              lineHeight: 1.8,
            }}
          >
            <p>
              Select a report type and date range above, then click{" "}
              <strong>Generate &amp; Download</strong> to export your financial
              data.
            </p>
            <p style={{ marginTop: 10 }}>
              Available formats: <strong>Excel</strong> for editable sheets,{" "}
              <strong>CSV</strong> for raw data import, <strong>PDF</strong> for
              archival records.
            </p>
          </div>
        </div>
      </div>

      {/* Monthly Summary Table */}
      <div className="card" style={{ marginTop: 14 }}>
        <div className="card-header">
          <div className="card-title">
            <i className="fa-solid fa-table" /> Monthly Summary Table
          </div>
          <button className="f-btn">
            <i className="fa-solid fa-file-export" /> Export
          </button>
        </div>
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>Month</th>
                <th>Revenue</th>
                <th>COD</th>
                <th>Prepaid</th>
                <th>Expenses</th>
                <th>Net Profit</th>
                <th>Margin</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonRows cols={7} rows={5} />
              ) : monthly.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      textAlign: "center",
                      padding: 24,
                      color: "var(--text-muted)",
                      fontSize: 11,
                    }}
                  >
                    No monthly data available.
                  </td>
                </tr>
              ) : (
                monthly.map((m) => {
                  const margin =
                    m.revenue > 0
                      ? ((m.profit / m.revenue) * 100).toFixed(1)
                      : "0.0";
                  return (
                    <tr key={m.month}>
                      <td>
                        <strong>{m.month}</strong>
                      </td>
                      <td style={{ color: "var(--green)" }}>
                        {fmt(m.revenue)}
                      </td>
                      <td>{fmt(m.cod)}</td>
                      <td>{fmt(m.prepaid)}</td>
                      <td style={{ color: "var(--red)" }}>{fmt(m.expenses)}</td>
                      <td>
                        <strong style={{ color: "var(--green)" }}>
                          {fmt(m.profit)}
                        </strong>
                      </td>
                      <td>
                        <div className="perf-cell" style={{ minWidth: 70 }}>
                          <div className="perf-bar">
                            <div
                              className="perf-fill"
                              style={{
                                width: `${margin}%`,
                                background: "var(--green)",
                              }}
                            />
                          </div>
                          <div
                            className="perf-pct"
                            style={{ color: "var(--green)" }}
                          >
                            {margin}%
                          </div>
                        </div>
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
  );
};

export default ReportsPanel;
