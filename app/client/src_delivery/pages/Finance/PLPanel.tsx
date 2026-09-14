import React, { useState, useEffect } from "react";
import { fmt, ErrorBanner } from "./helpers";
import { financialAnalyticsAPI } from "../../services/api";

const PLPanel: React.FC = () => {
  const [kpis, setKpis] = useState<any>(null);
  const [breakdown, setBreakdown] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    financialAnalyticsAPI
      .getFinancial({})
      .then((r) => {
        const data = r.data.data;
        setKpis(data.kpis || null);
        setBreakdown(data.expenseByCategory || []);
      })
      .catch((e) =>
        setError(e?.response?.data?.message || "Failed to load P&L data."),
      )
      .finally(() => setLoading(false));
  }, []);

  const totalRevenue = kpis ? Number(kpis.totalRevenue) : 0;
  const totalExpenses = kpis ? Number(kpis.totalExpenses) : 0;
  const grossProfit = kpis ? Number(kpis.grossProfit) : 0;

  return (
    <>
      <div className="panel-heading">Profit &amp; Loss Summary</div>
      <div className="panel-desc">
        High-level P&L view for the current period. Breakdown of all revenue
        streams against expenses to show net profitability.
      </div>

      {error && (
        <ErrorBanner message={error} onRetry={() => window.location.reload()} />
      )}

      <div className="mini-stats">
        <div className="mini-stat">
          <div className="ms-label">Gross Revenue</div>
          <div className="ms-value" style={{ color: "var(--green)" }}>
            {loading ? "…" : fmt(totalRevenue)}
          </div>
        </div>
        <div className="mini-stat">
          <div className="ms-label">Total Expenses</div>
          <div className="ms-value" style={{ color: "var(--red)" }}>
            {loading ? "…" : fmt(totalExpenses)}
          </div>
        </div>
        <div className="mini-stat">
          <div className="ms-label">Gross Profit</div>
          <div className="ms-value" style={{ color: "var(--blue)" }}>
            {loading ? "…" : fmt(grossProfit)}
          </div>
          <div className="ms-trend up">
            {totalRevenue > 0
              ? ((grossProfit / totalRevenue) * 100).toFixed(1)
              : "0"}
            % margin
          </div>
        </div>
        <div className="mini-stat">
          <div className="ms-label">Supplier Debt</div>
          <div className="ms-value" style={{ color: "var(--yellow)" }}>
            {loading ? "…" : kpis ? fmt(Number(kpis.totalSupplierDebt)) : "—"}
          </div>
        </div>
      </div>

      <div className="detail-grid-2">
        {/* Revenue Breakdown */}
        <div className="summary-box" style={{ marginBottom: 0 }}>
          <div className="summary-box-title">Revenue Breakdown</div>
          {loading ? (
            <div
              style={{
                fontSize: 10.5,
                color: "var(--text-muted)",
                padding: "8px 0",
              }}
            >
              Loading…
            </div>
          ) : (
            <>
              <div className="summary-row">
                <span>COD Orders</span>
                <span style={{ fontWeight: 600, color: "var(--green)" }}>
                  {kpis ? fmt(Number(kpis.codCollected?.amount ?? 0)) : "—"}
                </span>
              </div>
              <div className="summary-row">
                <span>Prepaid / Online Orders</span>
                <span style={{ fontWeight: 600, color: "var(--green)" }}>
                  {fmt(
                    Math.max(
                      0,
                      totalRevenue - Number(kpis?.codCollected?.amount ?? 0),
                    ),
                  )}
                </span>
              </div>
              <div className="summary-row total">
                <span>Total Revenue</span>
                <span className="summary-val" style={{ color: "var(--green)" }}>
                  {fmt(totalRevenue)}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Expense Breakdown */}
        <div className="summary-box" style={{ marginBottom: 0 }}>
          <div className="summary-box-title">Expense Breakdown</div>
          {loading ? (
            <div
              style={{
                fontSize: 10.5,
                color: "var(--text-muted)",
                padding: "8px 0",
              }}
            >
              Loading…
            </div>
          ) : breakdown.length === 0 ? (
            <div
              style={{
                fontSize: 10.5,
                color: "var(--text-muted)",
                padding: "8px 0",
              }}
            >
              No expense data.
            </div>
          ) : (
            <>
              {breakdown.map((b: any) => (
                <div className="summary-row" key={b.category}>
                  <span>{b.category}</span>
                  <span style={{ fontWeight: 600, color: "var(--red)" }}>
                    {fmt(Number(b.total ?? b.amount ?? 0))}
                  </span>
                </div>
              ))}
              <div className="summary-row total">
                <span>Total Expenses</span>
                <span className="summary-val" style={{ color: "var(--red)" }}>
                  {fmt(totalExpenses)}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Net Position */}
      {!loading && kpis && (
        <div className="balance-card" style={{ marginTop: 14 }}>
          <div className="balance-card-label">Net Cash Position</div>
          <div className="balance-card-amount">{fmt(grossProfit)}</div>
          <div className="balance-card-row">
            <div className="balance-card-item">
              <div className="balance-card-item-label">Profit Margin</div>
              <div className="balance-card-item-val">
                {kpis.profitMargin
                  ? `${Number(kpis.profitMargin).toFixed(1)}%`
                  : `${totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100).toFixed(1) : "0"}%`}
              </div>
            </div>
            <div className="balance-card-item">
              <div className="balance-card-item-label">COD Pending</div>
              <div
                className="balance-card-item-val"
                style={{ color: "#FB923C" }}
              >
                {fmt(Number(kpis.codPending?.amount ?? 0))}
              </div>
            </div>
            <div className="balance-card-item">
              <div className="balance-card-item-label">Supplier Debt</div>
              <div className="balance-card-item-val">
                {fmt(Number(kpis.totalSupplierDebt ?? 0))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PLPanel;
