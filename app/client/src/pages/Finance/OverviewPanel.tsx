import React, { useEffect, useState, useCallback } from "react";
import type {
  NavPanel,
  ApiOrderListItem,
  FinancialKPIs,
  FinancialTimelineEntry,
} from "./types";
import { fmt, fmtDate, Badge, SkeletonCard, ErrorBanner } from "./helpers";
import {
  financialAnalyticsAPI,
  financeOrdersAPI,
  suppliersAPI,
} from "../../services/api";

// ── COD Detail Overlay ─────────────────────────────────────
export const CODDetailContent: React.FC<{ c: ApiOrderListItem }> = ({ c }) => (
  <div>
    <div style={{ display: "flex", gap: 4, marginBottom: 14 }}>
      <Badge label={c.deliveryStatus || "Pending"} />
      <Badge label={c.paymentStatus} />
    </div>
    {(
      [
        ["Order ID", <code className="ref">{c.orderId}</code>],
        ["Customer", c.customer?.fullName ?? "—"],
        ["Phone", c.customer?.phone ?? "—"],
        [
          "COD Amount",
          <span
            style={{ fontSize: 15, fontWeight: 900, color: "var(--green)" }}
          >
            {fmt(c.totalAmount)}
          </span>,
        ],
        ["Created", fmtDate(c.createdAt)],
        ["Delivery", <Badge label={c.deliveryStatus || "Pending"} />],
        ["Payment", <Badge label={c.paymentStatus} />],
      ] as [string, React.ReactNode][]
    ).map(([k, v], i) => (
      <div className="detail-row" key={i}>
        <div className="detail-key">{k}</div>
        <div className="detail-val">{v}</div>
      </div>
    ))}
    <hr />
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
      <button className="f-btn">
        <i className="fa-solid fa-file-invoice" /> View Order
      </button>
    </div>
  </div>
);

// ── OverviewPanel ──────────────────────────────────────────
interface Props {
  onNav: (p: NavPanel) => void;
  onOpenOverlay: (title: string, content: React.ReactNode) => void;
}

const OverviewPanel: React.FC<Props> = ({ onNav, onOpenOverlay }) => {
  const [kpis, setKpis] = useState<FinancialKPIs | null>(null);
  const [timeline, setTimeline] = useState<FinancialTimelineEntry[]>([]);
  const [codOrders, setCodOrders] = useState<ApiOrderListItem[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [supplierDues, setSupplierDues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [finRes, codRes, expRes, supRes] = await Promise.allSettled([
        financialAnalyticsAPI.getFinancial({ groupBy: "day" }),
        financeOrdersAPI.getCODOrders({ page: 1, limit: 4 }),
        import("../../services/api").then((m) =>
          m.expensesAPI.getAll({ limit: 4, status: "Active" }),
        ),
        suppliersAPI.getPaymentsSummary({
          sortBy: "outstanding",
          order: "desc",
          minOutstanding: 1,
        }),
      ]);

      if (finRes.status === "fulfilled") {
        setKpis(finRes.value.data.data.kpis);
        setTimeline(finRes.value.data.data.timeline || []);
      }
      if (codRes.status === "fulfilled") {
        setCodOrders(codRes.value.data.data?.orders || []);
      }
      if (expRes.status === "fulfilled") {
        setExpenses(expRes.value.data.data?.expenses || []);
      }
      if (supRes.status === "fulfilled") {
        setSupplierDues(supRes.value.data.data?.summary || []);
      }
    } catch (e: any) {
      setError(
        e?.response?.data?.message || "Failed to load financial overview.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const maxVal = timeline.length
    ? Math.max(
        ...timeline.map((t) => t.revenue),
        ...timeline.map((t) => t.expenses),
        1,
      )
    : 1;

  const last7 = timeline.slice(-7);

  return (
    <>
      <div className="panel-heading">Financial Overview</div>
      <div className="panel-desc">
        Live snapshot of today's cash position — COD pending, expenses logged,
        supplier dues, and net cash flow.
      </div>

      {error && <ErrorBanner message={error} onRetry={load} />}

      {kpis && Number(kpis.codPending.amount) > 0 && (
        <div className="alert-strip warn">
          <i className="fa-solid fa-triangle-exclamation" />
          <div>
            <strong>{fmt(Number(kpis.codPending.amount))}</strong> in COD
            collected by riders but not yet submitted to accounts.
          </div>
          <button
            className="f-btn"
            style={{ marginLeft: "auto" }}
            onClick={() => onNav("cod")}
          >
            <i className="fa-solid fa-eye" /> Review COD
          </button>
        </div>
      )}

      {/* Balance Card */}
      <div className="balance-card">
        <div className="balance-card-label">Net Cash Position</div>
        <div className="balance-card-amount">
          {loading ? "…" : kpis ? fmt(Number(kpis.grossProfit)) : "—"}
        </div>
        <div className="balance-card-row">
          <div className="balance-card-item">
            <div className="balance-card-item-label">Total Revenue</div>
            <div className="balance-card-item-val">
              {loading ? "…" : kpis ? fmt(Number(kpis.totalRevenue)) : "—"}
            </div>
          </div>
          <div className="balance-card-item">
            <div className="balance-card-item-label">Total Expenses</div>
            <div className="balance-card-item-val">
              {loading ? "…" : kpis ? fmt(Number(kpis.totalExpenses)) : "—"}
            </div>
          </div>
          <div className="balance-card-item">
            <div className="balance-card-item-label">Supplier Due</div>
            <div className="balance-card-item-val">
              {loading ? "…" : kpis ? fmt(Number(kpis.totalSupplierDebt)) : "—"}
            </div>
          </div>
          <div className="balance-card-item">
            <div className="balance-card-item-label">COD Pending</div>
            <div className="balance-card-item-val" style={{ color: "#FB923C" }}>
              {loading ? "…" : kpis ? fmt(Number(kpis.codPending.amount)) : "—"}
            </div>
          </div>
        </div>
      </div>

      {/* Mini Stats */}
      <div className="mini-stats">
        <div className="mini-stat">
          <div className="ms-label">COD Collected</div>
          <div className="ms-value" style={{ color: "var(--green)" }}>
            {loading ? "…" : kpis ? fmt(Number(kpis.codCollected.amount)) : "—"}
          </div>
          <div className="ms-trend up">
            <i className="fa-solid fa-circle-check" />{" "}
            {kpis?.codCollected.count ?? "—"} orders
          </div>
        </div>
        <div className="mini-stat">
          <div className="ms-label">COD Pending Submission</div>
          <div className="ms-value" style={{ color: "var(--accent)" }}>
            {loading ? "…" : kpis ? fmt(Number(kpis.codPending.amount)) : "—"}
          </div>
          <div className="ms-trend down">
            <i className="fa-solid fa-triangle-exclamation" />{" "}
            {kpis?.codPending.count ?? "—"} orders in transit
          </div>
        </div>
        <div className="mini-stat">
          <div className="ms-label">Total Expenses</div>
          <div className="ms-value" style={{ color: "var(--red)" }}>
            {loading ? "…" : kpis ? fmt(Number(kpis.totalExpenses)) : "—"}
          </div>
        </div>
        <div className="mini-stat">
          <div className="ms-label">Supplier Balance Due</div>
          <div className="ms-value" style={{ color: "var(--yellow)" }}>
            {loading ? "…" : kpis ? fmt(Number(kpis.totalSupplierDebt)) : "—"}
          </div>
        </div>
      </div>

      {/* 3-col cards */}
      <div className="detail-grid-3">
        {/* COD Summary */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <i
                className="fa-solid fa-money-bills"
                style={{ color: "var(--green)" }}
              />{" "}
              COD Summary
            </div>
            <button className="f-btn" onClick={() => onNav("cod")}>
              View All
            </button>
          </div>
          <div className="card-body" style={{ padding: "10px 14px" }}>
            {loading ? (
              <SkeletonCard lines={4} />
            ) : codOrders.length === 0 ? (
              <p
                style={{
                  fontSize: 11,
                  color: "var(--text-muted)",
                  padding: "8px 0",
                }}
              >
                No COD orders found.
              </p>
            ) : (
              codOrders.map((c) => (
                <div
                  className="list-item"
                  key={c._id}
                  style={{ cursor: "pointer" }}
                  onClick={() =>
                    onOpenOverlay(
                      `${c.orderId} — COD Detail`,
                      <CODDetailContent c={c} />,
                    )
                  }
                >
                  <div className="list-content">
                    <div className="list-title" style={{ fontSize: 10.5 }}>
                      {c.orderId} · {c.customer?.fullName ?? "—"}
                    </div>
                    <div className="list-meta">{fmtDate(c.createdAt)}</div>
                  </div>
                  <div className="list-right">
                    <div style={{ fontWeight: 700, fontSize: 11 }}>
                      {fmt(c.totalAmount)}
                    </div>
                    <Badge label={c.paymentStatus} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Today's Expenses */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <i
                className="fa-solid fa-receipt"
                style={{ color: "var(--red)" }}
              />{" "}
              Recent Expenses
            </div>
            <button className="f-btn" onClick={() => onNav("exp-add")}>
              <i className="fa-solid fa-plus" /> Log
            </button>
          </div>
          <div className="card-body" style={{ padding: "10px 14px" }}>
            {loading ? (
              <SkeletonCard lines={4} />
            ) : expenses.length === 0 ? (
              <p
                style={{
                  fontSize: 11,
                  color: "var(--text-muted)",
                  padding: "8px 0",
                }}
              >
                No expenses logged.
              </p>
            ) : (
              expenses.map((e: any) => (
                <div className="list-item" key={e._id}>
                  <div
                    className="list-icon"
                    style={{ background: "var(--red-bg)" }}
                  >
                    <i
                      className="fa-solid fa-receipt"
                      style={{ fontSize: 10, color: "var(--red)" }}
                    />
                  </div>
                  <div className="list-content">
                    <div className="list-title" style={{ fontSize: 10.5 }}>
                      {e.description}
                    </div>
                    <div className="list-meta">{e.category}</div>
                  </div>
                  <div className="list-right">
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: 11,
                        color: "var(--red)",
                      }}
                    >
                      {fmt(e.amount)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Supplier Dues */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <i
                className="fa-solid fa-truck-ramp-box"
                style={{ color: "var(--yellow)" }}
              />{" "}
              Supplier Dues
            </div>
            <button className="f-btn" onClick={() => onNav("suppliers")}>
              View All
            </button>
          </div>
          <div className="card-body" style={{ padding: "10px 14px" }}>
            {loading ? (
              <SkeletonCard lines={3} />
            ) : supplierDues.length === 0 ? (
              <p
                style={{
                  fontSize: 11,
                  color: "var(--text-muted)",
                  padding: "8px 0",
                }}
              >
                All suppliers cleared.
              </p>
            ) : (
              supplierDues.slice(0, 4).map((s: any) => (
                <div className="list-item" key={s._id}>
                  <div
                    className="list-icon"
                    style={{ background: "var(--yellow-bg)" }}
                  >
                    <i
                      className="fa-solid fa-truck-ramp-box"
                      style={{ fontSize: 10, color: "var(--yellow)" }}
                    />
                  </div>
                  <div className="list-content">
                    <div className="list-title" style={{ fontSize: 10.5 }}>
                      {s.name}
                    </div>
                    <div className="list-meta">
                      Last paid:{" "}
                      {s.lastPaymentDate ? fmtDate(s.lastPaymentDate) : "—"}
                    </div>
                  </div>
                  <div className="list-right">
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: 11,
                        color: "var(--yellow)",
                      }}
                    >
                      {fmt(s.outstanding)}
                    </div>
                    <Badge label={s.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Revenue vs Expenses Chart */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <i className="fa-solid fa-chart-bar" /> Revenue vs Expenses — Last 7
            Days
          </div>
        </div>
        <div className="card-body">
          {loading ? (
            <SkeletonCard lines={2} />
          ) : last7.length === 0 ? (
            <p style={{ fontSize: 11, color: "var(--text-muted)" }}>
              No chart data available.
            </p>
          ) : (
            <>
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-end",
                  gap: 2,
                  height: 80,
                  padding: "0 2px",
                }}
              >
                {last7.map((t, i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 2,
                      height: "100%",
                      justifyContent: "flex-end",
                    }}
                  >
                    <div
                      style={{
                        width: "45%",
                        background: "var(--green)",
                        borderRadius: "3px 3px 0 0",
                        height: `${(t.revenue / maxVal) * 100}%`,
                        minHeight: 2,
                      }}
                      title={fmt(t.revenue)}
                    />
                    <div
                      style={{
                        width: "45%",
                        background: "var(--red)",
                        borderRadius: "3px 3px 0 0",
                        height: `${(t.expenses / maxVal) * 100}%`,
                        minHeight: 2,
                      }}
                      title={fmt(t.expenses)}
                    />
                  </div>
                ))}
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: 6,
                  fontSize: 9,
                  color: "var(--text-muted)",
                }}
              >
                {last7.map((t) => (
                  <span key={t.date}>{t.date.slice(5)}</span>
                ))}
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 14,
                  marginTop: 10,
                  fontSize: 10,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 2,
                      background: "var(--green)",
                    }}
                  />{" "}
                  Revenue
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 2,
                      background: "var(--red)",
                    }}
                  />{" "}
                  Expenses
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default OverviewPanel;
