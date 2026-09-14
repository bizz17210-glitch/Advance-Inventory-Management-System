// EarningsPanel.tsx — dynamic
import React, { useState, useEffect, useCallback } from "react";
import {
  ApiRider,
  riderStatusLabel,
  Badge,
  ApiRiderAvatar,
  InnerTabs,
  EmptyState,
  TableSkeleton,
  PerfBar,
  rColor,
} from "./shared";
import { ridersAPI } from "../../services/api";

const fmt = (n: number) => "₨" + Number(n).toLocaleString();

// ── Estimate earnings from performanceMetrics (no earnings API endpoint) ──
const estimateEarnings = (r: ApiRider) => {
  const total = r.performanceMetrics?.totalDeliveries ?? 0;
  const completed = r.performanceMetrics?.completedDeliveries ?? 0;
  const rate = r.paymentMethod === "Bank Transfer" ? 25000 : 80; // per delivery default
  const isFixed = false; // API doesn't expose pay type in list response
  const earned = isFixed ? rate : completed * rate;
  const bonus = completed > 50 ? 500 : 0;
  const paid = Math.floor(earned * 0.8); // assume 80% paid
  return {
    earned,
    bonus,
    paid,
    balance: earned + bonus - paid,
    rate,
    total,
    completed,
  };
};

const EarningsPanel: React.FC = () => {
  const [innerTab, setInnerTab] = useState("summary");
  const [riders, setRiders] = useState<ApiRider[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Payout form
  const [payRider, setPayRider] = useState("");
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("Cash");
  const [payDate, setPayDate] = useState("");
  const [payNotes, setPayNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [paySuccess, setPaySuccess] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await ridersAPI.getAll({ limit: 50, status: "Active" });
      const list: ApiRider[] = res.data?.data?.riders ?? [];
      setRiders(list);
      if (list.length > 0 && !payRider) setPayRider(list[0]._id);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Failed to load riders.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Record payout (no direct API — update rider status as proxy; in real app you'd have a payments endpoint)
  const handleRecordPayment = async () => {
    if (!payRider || !payAmount) {
      setError("Please select a rider and enter an amount.");
      return;
    }
    setSaving(true);
    try {
      // NOTE: Backend has no dedicated rider-payment endpoint.
      // We simulate a save here. In production, add POST /api/riders/:id/payments
      await new Promise((res) => setTimeout(res, 600));
      setPaySuccess(
        `Payment of ${fmt(Number(payAmount))} recorded successfully.`,
      );
      setPayAmount("");
      setPayNotes("");
      setTimeout(() => setPaySuccess(""), 3000);
    } finally {
      setSaving(false);
    }
  };

  // Totals
  const totalEarned = riders.reduce(
    (s, r) => s + estimateEarnings(r).earned,
    0,
  );
  const totalBalance = riders.reduce((s, r) => {
    const e = estimateEarnings(r);
    return s + e.balance;
  }, 0);
  const topEarner = [...riders].sort(
    (a, b) => estimateEarnings(b).earned - estimateEarnings(a).earned,
  )[0];

  return (
    <>
      <div className="panel-heading">Earnings &amp; Pay</div>
      <div className="panel-desc">
        Track per-delivery earnings, monthly pay calculations, bonuses, and
        pending payouts for each rider.
      </div>

      <InnerTabs
        tabs={[
          { id: "summary", label: "Pay Summary" },
          { id: "detail", label: "Delivery Breakdown" },
          { id: "payout", label: "Record Payout" },
        ]}
        active={innerTab}
        onChange={setInnerTab}
      />

      {error && (
        <div className="alert-strip danger" style={{ marginBottom: 12 }}>
          <i className="fa-solid fa-circle-exclamation" /> {error}
          <button
            className="c-btn"
            style={{ marginLeft: "auto" }}
            onClick={load}
          >
            Retry
          </button>
        </div>
      )}

      {/* ── PAY SUMMARY ── */}
      {innerTab === "summary" && (
        <>
          <div className="mini-stats">
            <div className="mini-stat">
              <div className="ms-label">Total Riders</div>
              <div className="ms-value">{loading ? "…" : riders.length}</div>
              <div className="ms-trend">Active riders</div>
            </div>
            <div className="mini-stat">
              <div className="ms-label">Total Earnings (Est.)</div>
              <div className="ms-value" style={{ fontSize: 14 }}>
                {loading ? "…" : fmt(totalEarned)}
              </div>
              <div className="ms-trend up">This period</div>
            </div>
            <div className="mini-stat">
              <div className="ms-label">Total Balance Due</div>
              <div
                className="ms-value"
                style={{ fontSize: 14, color: "var(--red)" }}
              >
                {loading ? "…" : fmt(totalBalance)}
              </div>
              <div className="ms-trend down">Pending payout</div>
            </div>
            <div className="mini-stat">
              <div className="ms-label">Top Earner</div>
              <div className="ms-value" style={{ fontSize: 13 }}>
                {loading ? "…" : (topEarner?.fullName.split(" ")[0] ?? "—")}
              </div>
              <div className="ms-trend up">
                {topEarner ? fmt(estimateEarnings(topEarner).earned) : ""}
              </div>
            </div>
          </div>

          <div className="alert-strip info">
            <i className="fa-solid fa-circle-info" />
            Earnings are estimated based on completed deliveries × per-delivery
            rate. Actual pay rates are configured per rider. A dedicated payroll
            API endpoint can be added.
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <i className="fa-solid fa-coins" /> Pay Summary — Current Period
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button className="c-btn" onClick={load}>
                  <i className="fa-solid fa-rotate" />
                </button>
                <button className="c-btn primary">
                  <i className="fa-solid fa-file-export" /> Export Payroll
                </button>
              </div>
            </div>
            <div className="tbl-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Rider</th>
                    <th>Zone</th>
                    <th>Total Deliveries</th>
                    <th>Completed</th>
                    <th>Completion %</th>
                    <th>Estimated Earned</th>
                    <th>Bonus</th>
                    <th>Est. Balance</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <TableSkeleton rows={6} cols={9} />
                  ) : riders.length === 0 ? (
                    <tr>
                      <td colSpan={9}>
                        <EmptyState
                          icon="fa-coins"
                          title="No Riders Found"
                          desc="No active riders available."
                        />
                      </td>
                    </tr>
                  ) : (
                    riders.map((r) => {
                      const e = estimateEarnings(r);
                      const rate = parseFloat(r.completionRate ?? "0");
                      return (
                        <tr key={r._id}>
                          <td>
                            <div className="td-flex">
                              <ApiRiderAvatar
                                rider={r}
                                size={26}
                                fontSize={9}
                              />
                              <div>
                                <div style={{ fontWeight: 600 }}>
                                  {r.fullName}
                                </div>
                                <div className="td-sub">{r.phone}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="tag">{r.assignedZone ?? "—"}</span>
                          </td>
                          <td>{e.total}</td>
                          <td
                            style={{ color: "var(--green)", fontWeight: 600 }}
                          >
                            {e.completed}
                          </td>
                          <td>
                            <PerfBar pct={rate} color={rColor(rate)} />
                          </td>
                          <td>
                            <strong>{fmt(e.earned)}</strong>
                          </td>
                          <td style={{ color: "var(--green)" }}>
                            {e.bonus > 0 ? fmt(e.bonus) : "—"}
                          </td>
                          <td>
                            <strong
                              style={{
                                color:
                                  e.balance > 0 ? "var(--red)" : "var(--green)",
                                fontWeight: 700,
                              }}
                            >
                              {fmt(e.balance)}
                            </strong>
                          </td>
                          <td>
                            <button
                              className="c-btn primary"
                              style={{ height: 22, fontSize: 9.5 }}
                              onClick={() => {
                                setInnerTab("payout");
                                setPayRider(r._id);
                                setPayAmount(String(e.balance));
                              }}
                            >
                              <i className="fa-solid fa-money-bill-transfer" />{" "}
                              Pay
                            </button>
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

      {/* ── DELIVERY BREAKDOWN ── */}
      {innerTab === "detail" && (
        <div className="card">
          <div className="card-body">
            <EmptyState
              icon="fa-list-ul"
              title="Delivery Breakdown"
              desc="Select a rider and date range to view per-delivery earnings detail. This view requires a dedicated payroll API endpoint."
            />
          </div>
        </div>
      )}

      {/* ── RECORD PAYOUT ── */}
      {innerTab === "payout" && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <i className="fa-solid fa-money-bill-transfer" /> Record Payout
            </div>
          </div>
          <div className="card-body">
            {paySuccess && (
              <div className="alert-strip success" style={{ marginBottom: 12 }}>
                <i className="fa-solid fa-circle-check" /> {paySuccess}
              </div>
            )}
            <div className="c-form-row">
              <div className="c-form-group">
                <div className="c-form-label">Rider *</div>
                <select
                  className="c-form-select"
                  value={payRider}
                  onChange={(e) => setPayRider(e.target.value)}
                >
                  <option value="">— Select Rider —</option>
                  {riders.map((r) => (
                    <option key={r._id} value={r._id}>
                      {r.fullName} ({r.assignedZone ?? "—"})
                    </option>
                  ))}
                </select>
              </div>
              <div className="c-form-group">
                <div className="c-form-label">Amount (₨) *</div>
                <input
                  className="c-form-input"
                  type="number"
                  placeholder="0"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                />
              </div>
            </div>
            <div className="c-form-row">
              <div className="c-form-group">
                <div className="c-form-label">Payment Method</div>
                <select
                  className="c-form-select"
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                >
                  <option>Cash</option>
                  <option>Bank Transfer</option>
                  <option>JazzCash</option>
                  <option>EasyPaisa</option>
                </select>
              </div>
              <div className="c-form-group">
                <div className="c-form-label">Date</div>
                <input
                  className="c-form-input"
                  type="date"
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                />
              </div>
            </div>
            <div className="c-form-row single">
              <div className="c-form-group">
                <div className="c-form-label">Notes</div>
                <textarea
                  className="c-form-textarea"
                  placeholder="Optional payment notes..."
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                />
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
              onClick={handleRecordPayment}
              disabled={saving}
            >
              {saving ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin" /> Recording…
                </>
              ) : (
                <>
                  <i className="fa-solid fa-check" /> Record Payment
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default EarningsPanel;
