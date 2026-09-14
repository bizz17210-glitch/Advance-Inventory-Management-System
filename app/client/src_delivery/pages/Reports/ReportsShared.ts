// ═══════════════════════════════════════════════════════════
// ReportsShared.ts  —  Types · Static Data · Helpers
// ═══════════════════════════════════════════════════════════

// ── TYPES ───────────────────────────────────────────────────

export type ReportTab =
  | "sales"
  | "inventory"
  | "financial"
  | "staff"
  | "export";
export type RevenuePeriod = "daily" | "weekly" | "monthly";
export type CODFilter = "pending" | "collected" | "all";

export interface DailySale {
  date: string;
  orders: number;
  units: number;
  revenue: number;
  cod: number;
  prepaid: number;
  returns: number;
  net: number;
}
export interface TopProduct {
  name: string;
  sku: string;
  sold: number;
  revenue: string;
  trend: "up" | "down";
}
export interface CategorySale {
  name: string;
  val: number;
  color: string;
}
export interface Channel {
  name: string;
  pct: number;
  val: string;
  color: string;
}
export interface ChartDataPoint {
  label: string;
  val: number;
}
export interface LowStockItem {
  sku: string;
  name: string;
  cat: string;
  stock: number;
  thr: number;
  days: number;
  last: string;
  supplier: string;
  urgency: "Critical" | "High" | "Medium";
}
export interface DeadStockItem {
  sku: string;
  name: string;
  stock: number;
  last: string;
  days: number;
  val: string;
}
export interface ValuationRow {
  name: string;
  cost: string;
  retail: string;
}
export interface StockHealthCat {
  name: string;
  instock: number;
  low: number;
  oos: number;
}
export interface PLRow {
  label: string;
  val: string;
  color: string;
  bold?: boolean;
}
export interface ExpenseRow {
  cat: string;
  val: number;
  color: string;
}
export interface CODItem {
  id: string;
  cust: string;
  amt: number;
  courier: string;
  disp: string;
  exp: string;
  days: number;
}
export interface SupplierPayment {
  name: string;
  total: string;
  paid: string;
  out: string;
  last: string;
  due: string;
  status: "Active" | "Overdue" | "Cleared";
}
export interface StaffMember {
  name: string;
  role: string;
  avatar: string;
  color: string;
  tasks: number;
  done: number;
  orders: number;
  errors: number;
  score: number;
}
export interface DeptTask {
  name: string;
  assigned: number;
  done: number;
  color: string;
}
export interface ExportHistoryItem {
  time: string;
  type: string;
  range: string;
  records: number;
  fmt: string;
  by: string;
  status: string;
}

// ── API STATE HELPER TYPE ────────────────────────────────────

export interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

// ── HELPERS ─────────────────────────────────────────────────

export const fmt = (n: number): string => "₨" + n.toLocaleString();
export const fmtL = (n: number): string =>
  n >= 100000 ? "₨" + (n / 100000).toFixed(1) + "L" : fmt(n);

export function statusBadgeClass(s: string): string {
  const m: Record<string, string> = {
    Active: "green",
    Overdue: "orange",
    Cleared: "green",
    Pending: "yellow",
    Ready: "green",
    Partial: "yellow",
    Failed: "red",
  };
  return m[s] || "gray";
}

// ── CATEGORY COLORS (for chart rendering) ───────────────────

export const CATEGORY_COLORS: Record<string, string> = {
  Suits: "var(--accent)",
  Kurtas: "#8B5CF6",
  Sarees: "#EC4899",
  Dupattas: "#0891B2",
  Shawls: "var(--green)",
  Bottoms: "#F59E0B",
  Shirts: "#7C3AED",
};

export const EXPENSE_COLORS: string[] = [
  "var(--accent)",
  "#8B5CF6",
  "#0891B2",
  "#EC4899",
  "#F59E0B",
  "#16A34A",
  "#7C3AED",
];

// ── EXPORT CARDS (static config, no API needed) ─────────────

export const EXPORT_CARDS = [
  {
    type: "Sales Data",
    icon: "fa-chart-line",
    bgColor: "#FFF5EE",
    iconColor: "#FF6A00",
    subtitle: "Orders, revenue, channels",
    description:
      "Export all sales transactions including order details, payment methods, customers, and revenue breakdown.",
    filterLabel: "Date Range",
    filterOptions: [
      "This Month",
      "Last Month",
      "Last 3 Months",
      "Custom Range",
    ],
  },
  {
    type: "Inventory Data",
    icon: "fa-warehouse",
    bgColor: "#EFF6FF",
    iconColor: "var(--blue)",
    subtitle: "Stock levels, movements, alerts",
    description:
      "Export current stock levels, product variants, stock movement history, and low stock alerts.",
    filterLabel: "Data Type",
    filterOptions: [
      "Current Stock Snapshot",
      "Stock Movement Log",
      "Low Stock Only",
      "Full Product Catalog",
    ],
  },
  {
    type: "Financial Data",
    icon: "fa-coins",
    bgColor: "#F0FDF4",
    iconColor: "var(--green)",
    subtitle: "COD, expenses, payments",
    description:
      "Export COD collection records, expenses by category, supplier payments, and profit & loss summary.",
    filterLabel: "Date Range",
    filterOptions: [
      "This Month",
      "Last Month",
      "Last 3 Months",
      "Custom Range",
    ],
  },
  {
    type: "Customer Data",
    icon: "fa-users",
    bgColor: "#FFFBEB",
    iconColor: "var(--yellow)",
    subtitle: "Profiles, order history, segments",
    description:
      "Export customer profiles including contact info, order history, total spend, and segment classifications.",
    filterLabel: "Segment Filter",
    filterOptions: [
      "All Customers",
      "VIP Only",
      "New (30 days)",
      "Inactive (90d+)",
    ],
  },
  {
    type: "Staff Report",
    icon: "fa-id-badge",
    bgColor: "#F5F3FF",
    iconColor: "#7C3AED",
    subtitle: "Performance, tasks, activity",
    description:
      "Export staff performance metrics, task completion rates, activity logs, and role-wise breakdowns.",
    filterLabel: "Date Range",
    filterOptions: ["This Month", "Last Month", "Custom Range"],
  },
  {
    type: "Audit Logs",
    icon: "fa-file-alt",
    bgColor: "#F1F5F9",
    iconColor: "#475569",
    subtitle: "System activity, logins, changes",
    description:
      "Export a complete audit trail of all system actions, user logins, data modifications, and critical events.",
    filterLabel: "Date Range",
    filterOptions: ["Last 7 Days", "Last 30 Days", "Last 90 Days"],
  },
];

// ── EXPORT / VIEW UTILITIES ──────────────────────────────────

// UI label → backend's actual `report` enum (sales|inventory|financial|orders|customers)
export const REPORT_KEY_MAP: Record<string, string> = {
  "Sales Data": "sales",
  "Inventory Data": "inventory",
  "Financial Data": "financial",
  "Customer Data": "customers",
  "Staff Report": "staff", // ⚠️ backend abhi support nahi karta — docs check karo
  "Audit Logs": "audit", // ⚠️ backend abhi support nahi karta — docs check karo
};

// UI filter label → actual from/to date range for the API
export function resolveDateRange(filterValue: string): {
  from?: string;
  to?: string;
} {
  const now = new Date();
  const toISO = (d: Date) => d.toISOString().split("T")[0];

  switch (filterValue) {
    case "This Month": {
      const from = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: toISO(from), to: toISO(now) };
    }
    case "Last Month": {
      const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const to = new Date(now.getFullYear(), now.getMonth(), 0);
      return { from: toISO(from), to: toISO(to) };
    }
    case "Last 3 Months": {
      const from = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      return { from: toISO(from), to: toISO(now) };
    }
    case "Last 7 Days": {
      const from = new Date(now);
      from.setDate(from.getDate() - 7);
      return { from: toISO(from), to: toISO(now) };
    }
    case "Last 30 Days": {
      const from = new Date(now);
      from.setDate(from.getDate() - 30);
      return { from: toISO(from), to: toISO(now) };
    }
    case "Last 90 Days": {
      const from = new Date(now);
      from.setDate(from.getDate() - 90);
      return { from: toISO(from), to: toISO(now) };
    }
    default:
      return {}; // "Custom Range" ya non-date filters
  }
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadCSV(filename: string, rows: any[]) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((h) => {
          const val = row[h] ?? "";
          const str =
            typeof val === "object" ? JSON.stringify(val) : String(val);
          return `"${str.replace(/"/g, '""')}"`;
        })
        .join(","),
    ),
  ];
  triggerDownload(
    new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" }),
    filename,
  );
}

export async function downloadExcel(
  filename: string,
  rows: any[],
  sheetName = "Report",
) {
  if (!rows.length) return;
  const XLSX = await import("xlsx");
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filename);
}

export async function downloadPDF(
  filename: string,
  title: string,
  rows: any[],
) {
  if (!rows.length) return;
  const { default: jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const doc = new jsPDF();
  doc.setFontSize(14);
  doc.text(title, 14, 16);
  doc.setFontSize(9);
  doc.text(
    `Generated on ${new Date().toLocaleString()} · ${rows.length} records`,
    14,
    22,
  );

  const headers = Object.keys(rows[0]);
  const body = rows.map((r) => headers.map((h) => String(r[h] ?? "")));

  autoTable(doc, {
    startY: 28,
    head: [headers],
    body,
    styles: { fontSize: 7 },
    headStyles: { fillColor: [255, 106, 0] }, // brand orange
  });

  doc.save(filename);
}

export function viewReportOnline(title: string, rows: any[]) {
  if (!rows.length) {
    alert("No data available to preview for this report.");
    return;
  }
  const headers = Object.keys(rows[0]);
  const html = `
    <html>
      <head>
        <title>${title} — NEXUS Report</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; background: #fafafa; }
          h1 { font-size: 18px; margin-bottom: 4px; }
          .meta { color: #777; font-size: 12px; margin-bottom: 16px; }
          table { border-collapse: collapse; width: 100%; background: #fff; }
          th, td { border: 1px solid #ddd; padding: 6px 10px; font-size: 12px; text-align: left; }
          th { background: #FF6A00; color: #fff; position: sticky; top: 0; }
          tr:nth-child(even) { background: #f7f7f7; }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <div class="meta">Generated on ${new Date().toLocaleString()} · ${rows.length} records</div>
        <table>
          <thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead>
          <tbody>
            ${rows
              .map(
                (r) =>
                  `<tr>${headers
                    .map(
                      (h) =>
                        `<td>${typeof r[h] === "object" ? JSON.stringify(r[h]) : (r[h] ?? "")}</td>`,
                    )
                    .join("")}</tr>`,
              )
              .join("")}
          </tbody>
        </table>
      </body>
    </html>`;
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
}
