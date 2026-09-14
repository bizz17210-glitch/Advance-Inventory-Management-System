// ═══════════════════════════════════════════════════════════
// FinancialReportsTab.tsx  —  Live API data
// ═══════════════════════════════════════════════════════════
import React, { useState, useEffect } from "react";
import { CODFilter, fmt, fmtL, EXPENSE_COLORS } from "./ReportsShared";
import {
  analyticsAPI,
  financeOrdersAPI,
  suppliersAPI,
  expensesAPI,
} from "../../services/api";

const SkeletonRow: React.FC<{ cols: number }> = ({ cols }) => (
  <tr>
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i}>
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
);

const FinancialReportsTab: React.FC = () => {
  const [codFilter, setCodFilter] = useState<CODFilter>("pending");

  // API state
  const [finData, setFinData] = useState<any>(null);
  const [finLoading, setFinLoading] = useState(true);
  const [finError, setFinError] = useState<string | null>(null);

  const [codOrders, setCodOrders] = useState<any[]>([]);
  const [codLoading, setCodLoading] = useState(true);
  const [codTotal, setCodTotal] = useState(0);

  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [supLoading, setSupLoading] = useState(true);

  const [expenses, setExpenses] = useState<any[]>([]);
  const [expLoading, setExpLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      // Financial analytics
      try {
        const res = await analyticsAPI.getFinancial();
        setFinData(res.data?.data ?? res.data);
      } catch (e: any) {
        setFinError(
          e?.response?.data?.message || "Failed to load financial data",
        );
      } finally {
        setFinLoading(false);
      }

      // Expenses
      try {
        const res = await expensesAPI.getAll({ limit: 100 });
        const items =
          res.data?.data?.expenses ??
          res.data?.data ??
          res.data?.expenses ??
          [];
        setExpenses(Array.isArray(items) ? items : []);
      } catch {
        setExpenses([]);
      } finally {
        setExpLoading(false);
      }

      // Supplier payments summary
      try {
        const res = await suppliersAPI.getPaymentsSummary();
        const items =
          res.data?.data?.suppliers ??
          res.data?.data ??
          res.data?.suppliers ??
          [];
        setSuppliers(Array.isArray(items) ? items : []);
      } catch {
        setSuppliers([]);
      } finally {
        setSupLoading(false);
      }
    };
    fetchAll();
  }, []);

  // Fetch COD orders when filter changes
  useEffect(() => {
    const fetchCOD = async () => {
      setCodLoading(true);
      try {
        const params: any = { limit: 10, page: 1 };
        if (codFilter !== "all")
          params.paymentStatus = codFilter === "pending" ? "Pending" : "Paid";
        const res = await financeOrdersAPI.getCODOrders(params);
        const orders =
          res.data?.data?.orders ?? res.data?.data ?? res.data?.orders ?? [];
        setCodOrders(Array.isArray(orders) ? orders : []);
        setCodTotal(res.data?.data?.pagination?.totalItems ?? orders.length);
      } catch {
        setCodOrders([]);
        setCodTotal(0);
      } finally {
        setCodLoading(false);
      }
    };
    fetchCOD();
  }, [codFilter]);

  // Derived KPIs
  const kpi = finData?.summary ?? finData?.kpi ?? {};
  const grossProfit = kpi.grossProfit ?? 0;
  const grossMargin = kpi.grossMargin ?? kpi.margin ?? 0;
  const totalExpenses = kpi.totalExpenses ?? kpi.expenses ?? 0;
  const expenseDiff = kpi.expenseDiff ?? kpi.expenseChange ?? null;
  const codPending = kpi.codPending ?? kpi.codAmount ?? 0;
  const codPendingOrders = kpi.codPendingOrders ?? kpi.pendingOrders ?? 0;
  const supplierOut = kpi.supplierOutstanding ?? kpi.outstanding ?? 0;

  // P&L rows from API
  const plRows: any[] =
    finData?.plSummary ?? finData?.profitLoss ?? finData?.pl ?? [];

  // Expense breakdown
  const expenseBreakdown: any[] =
    finData?.expenseBreakdown ?? finData?.expensesByCategory ?? [];
  // Fallback: group expenses from expenses API
  const expenseData = expenseBreakdown.length
    ? expenseBreakdown
    : (() => {
        const grouped: Record<string, number> = {};
        expenses.forEach((e: any) => {
          const cat = e.category ?? "Other";
          grouped[cat] = (grouped[cat] ?? 0) + (e.amount ?? 0);
        });
        return Object.entries(grouped).map(([cat, val], i) => ({
          cat,
          val,
          color: EXPENSE_COLORS[i % EXPENSE_COLORS.length],
        }));
      })();
  const expTotal = expenseData.reduce(
    (a: number, e: any) => a + (e.val ?? e.amount ?? e.total ?? 0),
    0,
  );

  // Supplier status badge
  const supBadge: Record<string, string> = {
    Active: "blue",
    Overdue: "orange",
    Cleared: "green",
  };

  return (
    <>
      {/* KPI Row */}
      <div className="stats-row" style={{ marginBottom: 14 }}>
        {finLoading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="stat-card"
                style={{ animation: "pulse 1.5s ease-in-out infinite" }}
              >
                <div
                  style={{
                    height: 10,
                    width: "60%",
                    background: "var(--divider)",
                    borderRadius: 4,
                    marginBottom: 10,
                  }}
                />
                <div
                  style={{
                    height: 24,
                    width: "40%",
                    background: "var(--divider)",
                    borderRadius: 4,
                    marginBottom: 8,
                  }}
                />
                <div
                  style={{
                    height: 10,
                    width: "70%",
                    background: "var(--divider)",
                    borderRadius: 4,
                  }}
                />
              </div>
            ))}
          </>
        ) : finError ? (
          <div className="info-banner" style={{ color: "var(--red)" }}>
            <i className="fa-solid fa-circle-exclamation" />
            <div className="info-banner-text">{finError}</div>
          </div>
        ) : (
          <>
            <div className="stat-card">
              <div className="stat-card-top">
                <div className="stat-label">Gross Profit (MTD)</div>
                <div className="stat-icon" style={{ background: "#F0FDF4" }}>
                  <i
                    className="fa-solid fa-hand-holding-dollar"
                    style={{ color: "var(--green)" }}
                  />
                </div>
              </div>
              <div className="stat-value">{fmtL(grossProfit)}</div>
              <div className="stat-trend up">
                <i className="fa-solid fa-arrow-trend-up" />{" "}
                {grossMargin ? `${grossMargin}% margin` : "this month"}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-card-top">
                <div className="stat-label">Total Expenses (MTD)</div>
                <div className="stat-icon" style={{ background: "#FEF2F2" }}>
                  <i
                    className="fa-solid fa-money-bill-wave"
                    style={{ color: "var(--red)" }}
                  />
                </div>
              </div>
              <div className="stat-value">{fmtL(totalExpenses)}</div>
              <div
                className={`stat-trend ${expenseDiff !== null && expenseDiff < 0 ? "up" : "down"}`}
              >
                <i
                  className={`fa-solid fa-arrow-trend-${expenseDiff !== null && expenseDiff < 0 ? "down" : "up"}`}
                />
                {expenseDiff !== null
                  ? ` ${expenseDiff > 0 ? "+" : ""}${fmtL(Math.abs(expenseDiff))} vs last month`
                  : " this month"}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-card-top">
                <div className="stat-label">COD Pending</div>
                <div className="stat-icon" style={{ background: "#FFFBEB" }}>
                  <i
                    className="fa-solid fa-clock"
                    style={{ color: "var(--yellow)" }}
                  />
                </div>
              </div>
              <div className="stat-value">{fmtL(codPending)}</div>
              <div className="stat-trend neutral">
                <i className="fa-solid fa-minus" /> {codPendingOrders} orders
                pending
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-card-top">
                <div className="stat-label">Supplier Outstanding</div>
                <div className="stat-icon" style={{ background: "#FFF5EE" }}>
                  <i className="fa-solid fa-file-invoice-dollar ic-orange" />
                </div>
              </div>
              <div className="stat-value">{fmtL(supplierOut)}</div>
              <div className="stat-trend down">
                <i className="fa-solid fa-arrow-trend-down" /> Outstanding
                balance
              </div>
            </div>
          </>
        )}
      </div>

      {/* P&L + Expense Breakdown */}
      <div className="grid-2" style={{ marginBottom: 14 }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <i className="fa-solid fa-scale-balanced ic-orange" /> P&L Summary
            </div>
          </div>
          <div className="card-body" style={{ padding: "10px 16px" }}>
            {finLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="pl-row">
                  <div
                    style={{
                      height: 12,
                      width: "50%",
                      background: "var(--divider)",
                      borderRadius: 4,
                    }}
                  />
                  <div
                    style={{
                      height: 12,
                      width: "25%",
                      background: "var(--divider)",
                      borderRadius: 4,
                    }}
                  />
                </div>
              ))
            ) : plRows.length ? (
              plRows.map((r: any, i: number) => (
                <div key={i} className={`pl-row${r.bold ? " bold" : ""}`}>
                  <span className="pl-label">{r.label}</span>
                  <span
                    className="pl-val"
                    style={{
                      color:
                        r.color ??
                        (r.type === "deduction"
                          ? "var(--red)"
                          : "var(--text-primary)"),
                    }}
                  >
                    {typeof r.val === "number" ? fmt(r.val) : r.val}
                  </span>
                </div>
              ))
            ) : (
              <div
                style={{
                  color: "var(--text-muted)",
                  fontSize: 12,
                  padding: "20px 0",
                  textAlign: "center",
                }}
              >
                No P&L data available
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <i className="fa-solid fa-chart-bar ic-orange" /> Expense
              Breakdown
            </div>
          </div>
          <div className="card-body" style={{ padding: "10px 16px" }}>
            {expLoading || finLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} style={{ marginBottom: 10 }}>
                  <div
                    style={{
                      height: 10,
                      background: "var(--divider)",
                      borderRadius: 4,
                      marginBottom: 4,
                    }}
                  />
                  <div
                    style={{
                      height: 7,
                      background: "var(--divider)",
                      borderRadius: 4,
                    }}
                  />
                </div>
              ))
            ) : expenseData.length ? (
              <>
                {expenseData.map((e: any, i: number) => {
                  const val = e.val ?? e.amount ?? e.total ?? 0;
                  const color =
                    e.color ?? EXPENSE_COLORS[i % EXPENSE_COLORS.length];
                  return (
                    <div
                      key={e.cat ?? e.category ?? i}
                      style={{ marginBottom: 10 }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: 3,
                        }}
                      >
                        <span style={{ fontSize: 11.5, fontWeight: 500 }}>
                          {e.cat ?? e.category}
                        </span>
                        <span style={{ fontSize: 11.5, fontWeight: 600 }}>
                          {fmt(val)}{" "}
                          <span
                            style={{ color: "var(--text-muted)", fontSize: 10 }}
                          >
                            (
                            {expTotal > 0
                              ? Math.round((val / expTotal) * 100)
                              : 0}
                            %)
                          </span>
                        </span>
                      </div>
                      <div className="prog-bar" style={{ height: 7 }}>
                        <div
                          className="prog-fill"
                          style={{
                            width: `${expTotal > 0 ? (val / expTotal) * 100 : 0}%`,
                            background: color,
                            borderRadius: 2,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
                <div
                  style={{
                    paddingTop: 8,
                    borderTop: "1px solid var(--divider)",
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <strong style={{ fontSize: 12 }}>Total</strong>
                  <strong style={{ fontSize: 12, color: "var(--red)" }}>
                    {fmt(expTotal)}
                  </strong>
                </div>
              </>
            ) : (
              <div
                style={{
                  color: "var(--text-muted)",
                  fontSize: 12,
                  padding: "20px 0",
                  textAlign: "center",
                }}
              >
                No expense data
              </div>
            )}
          </div>
        </div>
      </div>

      {/* COD Report */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-header">
          <div className="card-title">
            <i className="fa-solid fa-money-bills" /> COD Collection Report
          </div>
          <div className="card-actions">
            {(["pending", "collected", "all"] as CODFilter[]).map((f) => (
              <button
                key={f}
                className={`t-filter-btn${codFilter === f ? " active" : ""}`}
                onClick={() => setCodFilter(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
            <button className="t-filter-btn">
              <i className="fa-solid fa-file-export" /> Export
            </button>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Courier</th>
                <th>Dispatched</th>
                <th>Expected By</th>
                <th>Days Pending</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {codLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <SkeletonRow key={i} cols={8} />
                ))
              ) : codOrders.length ? (
                codOrders.map((item: any) => {
                  const id = item.orderNumber ?? item._id ?? "—";
                  const cust = item.customer?.name ?? item.customerName ?? "—";
                  const amt =
                    item.totalAmount ?? item.amount ?? item.codAmount ?? 0;
                  const courier =
                    item.courier?.name ??
                    item.courierName ??
                    item.courier ??
                    "—";
                  const disp = item.createdAt
                    ? new Date(item.createdAt).toLocaleDateString("en-PK", {
                        day: "2-digit",
                        month: "short",
                      })
                    : "—";
                  const exp = item.expectedDelivery
                    ? new Date(item.expectedDelivery).toLocaleDateString(
                        "en-PK",
                        { day: "2-digit", month: "short" },
                      )
                    : "—";
                  const days = item.daysPending ?? item.daysOld ?? 0;
                  const status = item.paymentStatus ?? item.status ?? "Pending";
                  return (
                    <tr key={id}>
                      <td>
                        <code className="code-chip">{id}</code>
                      </td>
                      <td>
                        <strong>{cust}</strong>
                      </td>
                      <td>
                        <strong>{fmt(amt)}</strong>
                      </td>
                      <td>
                        <span className="tag">{courier}</span>
                      </td>
                      <td style={{ color: "var(--text-muted)" }}>{disp}</td>
                      <td style={{ color: "var(--text-muted)" }}>{exp}</td>
                      <td>
                        <span
                          className={`badge ${days > 7 ? "orange" : days > 4 ? "yellow" : "blue"}`}
                        >
                          {days}d
                        </span>
                      </td>
                      <td>
                        <span
                          className={`badge ${status === "Paid" ? "green" : "yellow"}`}
                        >
                          {status}
                        </span>
                      </td>
                    </tr>
                  );
                })
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
                    No COD orders found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {codTotal > 0 && (
          <div className="pagination">
            <div className="pagination-info">
              Showing <strong>1–{Math.min(10, codOrders.length)}</strong> of{" "}
              <strong>{codTotal}</strong> COD orders
            </div>
          </div>
        )}
      </div>

      {/* Supplier Payments */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <i className="fa-solid fa-handshake" /> Supplier Payment Summary
          </div>
          <div className="card-actions">
            <button className="t-filter-btn">
              <i className="fa-solid fa-file-export" /> Export
            </button>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Supplier</th>
                <th>Total Purchased</th>
                <th>Paid</th>
                <th>Outstanding</th>
                <th>Last Payment</th>
                <th>Due Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {supLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <SkeletonRow key={i} cols={7} />
                ))
              ) : suppliers.length ? (
                suppliers.map((s: any) => {
                  const total =
                    typeof s.totalPurchased === "number"
                      ? fmt(s.totalPurchased)
                      : (s.total ?? s.totalPurchased ?? "—");
                  const paid =
                    typeof s.totalPaid === "number"
                      ? fmt(s.totalPaid)
                      : (s.paid ?? s.totalPaid ?? "—");
                  const out =
                    typeof s.outstanding === "number"
                      ? fmt(s.outstanding)
                      : (s.out ?? s.outstanding ?? "—");
                  const outNum =
                    typeof s.outstanding === "number" ? s.outstanding : 0;
                  const last =
                    (s.lastPaymentDate ?? s.last)
                      ? new Date(
                          s.lastPaymentDate ?? s.last,
                        ).toLocaleDateString("en-PK", {
                          day: "2-digit",
                          month: "short",
                        })
                      : "—";
                  const due =
                    (s.nextDueDate ?? s.dueDate)
                      ? new Date(s.nextDueDate ?? s.dueDate).toLocaleDateString(
                          "en-PK",
                          { day: "2-digit", month: "short" },
                        )
                      : "—";
                  const status =
                    s.paymentStatus ??
                    s.status ??
                    (outNum === 0 ? "Cleared" : "Active");
                  return (
                    <tr key={s._id ?? s.name}>
                      <td>
                        <strong>{s.name ?? s.supplierName ?? "—"}</strong>
                      </td>
                      <td>{total}</td>
                      <td style={{ color: "var(--green)" }}>{paid}</td>
                      <td>
                        <strong
                          style={{
                            color: outNum === 0 ? "var(--green)" : "var(--red)",
                          }}
                        >
                          {out}
                        </strong>
                      </td>
                      <td style={{ color: "var(--text-muted)" }}>{last}</td>
                      <td style={{ color: "var(--text-muted)" }}>{due}</td>
                      <td>
                        <span className={`badge ${supBadge[status] || "gray"}`}>
                          {status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    style={{
                      textAlign: "center",
                      padding: "20px 0",
                      color: "var(--text-muted)",
                      fontSize: 12,
                    }}
                  >
                    No supplier data
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

export default FinancialReportsTab;
