// ReturnsTab.tsx — dynamic
import React, { useState, useEffect, useCallback } from "react";
import { ordersAPI } from "../../services/api";

/* ─── Types ─────────────────────────────────────────────── */
interface ApiOrder {
  _id: string;
  orderId: string;
  orderStatus: string;
  paymentStatus: string;
  paymentMethod: string;
  totalAmount: number;
  createdAt: string;
  customer?: { fullName?: string; phone?: string; email?: string };
  shippingAddress?: { city?: string; country?: string };
  trackingNumber?: string;
  courier?: { name?: string };
  notes?: string;
}

interface ApiPagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/* ─── Helpers ────────────────────────────────────────────── */
const fmt = (v: number) =>
  "₨" + v.toLocaleString("en-PK", { maximumFractionDigits: 0 });

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const Badge: React.FC<{ label: string; color: string }> = ({
  label,
  color,
}) => (
  <span
    style={{
      display: "inline-block",
      padding: "2px 8px",
      borderRadius: 99,
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: 0.4,
      background: color + "18",
      color,
      border: `1px solid ${color}33`,
    }}
  >
    {label}
  </span>
);

const payBadge = (s: string) => {
  const map: Record<string, string> = {
    Paid: "#16a34a",
    Pending: "#d97706",
    Refunded: "#6366f1",
    "Partially Paid": "#0891b2",
    Failed: "#dc2626",
  };
  return <Badge label={s} color={map[s] ?? "#64748b"} />;
};

/* ─── Skeleton ───────────────────────────────────────────── */
const TableSkeleton = () => (
  <div style={{ padding: "12px 0" }}>
    {[1, 2, 3, 4, 5].map((i) => (
      <div
        key={i}
        style={{
          height: 44,
          background: "var(--bg-2)",
          borderRadius: 6,
          marginBottom: 6,
          opacity: 1 - i * 0.15,
          animation: "pulse 1.4s ease-in-out infinite",
        }}
      />
    ))}
  </div>
);

const EmptyState: React.FC<{ msg: string }> = ({ msg }) => (
  <div
    style={{
      textAlign: "center",
      padding: "48px 0",
      color: "var(--text-muted)",
    }}
  >
    <i
      className="fa-solid fa-rotate-left"
      style={{
        fontSize: 28,
        marginBottom: 10,
        display: "block",
        opacity: 0.35,
      }}
    />
    <div style={{ fontSize: 13 }}>{msg}</div>
    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
      Returns appear here when a Shipped order is marked as Returned.
    </div>
  </div>
);

/* ─── Styles ─────────────────────────────────────────────── */
const styles = `
  @keyframes pulse { 0%,100%{opacity:.6} 50%{opacity:.3} }
  @keyframes slideIn { from{transform:translateY(16px);opacity:0} to{transform:translateY(0);opacity:1} }
  .rt-table { width:100%; border-collapse:collapse; font-size:12px; }
  .rt-table th { background:var(--bg-2); color:var(--text-muted); font-size:10px; font-weight:700;
    text-transform:uppercase; letter-spacing:.6px; padding:8px 10px; text-align:left; white-space:nowrap; }
  .rt-table td { padding:10px 10px; border-bottom:1px solid var(--border); color:var(--text); vertical-align:middle; }
  .rt-table tr:hover td { background:var(--bg-2); }
  .rt-search { background:var(--bg-2); border:1px solid var(--border); border-radius:7px;
    padding:7px 12px; font-size:12px; color:var(--text); outline:none; width:220px; }
  .rt-search:focus { border-color:var(--primary); }
  .rt-btn { padding:5px 12px; border-radius:6px; font-size:11px; font-weight:600; cursor:pointer;
    border:1px solid var(--border); background:var(--bg-2); color:var(--text); transition:all .15s; }
  .rt-btn:hover { border-color:var(--primary); color:var(--primary); }
  .rt-btn-primary { background:var(--primary); color:#fff; border-color:var(--primary); }
  .rt-btn-primary:hover { opacity:.88; color:#fff; }
  .rt-btn-red { background:#dc2626; color:#fff; border-color:#dc2626; }
  .rt-btn-red:hover { opacity:.88; color:#fff; }
  .rt-btn:disabled { opacity:.4; cursor:not-allowed; }
  .rt-toast { position:fixed; bottom:24px; right:24px; z-index:9999; padding:10px 16px;
    border-radius:8px; font-size:12px; font-weight:600; display:flex; align-items:center;
    gap:8px; box-shadow:0 4px 16px rgba(0,0,0,.18); animation:slideIn .3s ease; }
  .rt-toast.success { background:#dcfce7; color:#16a34a; border:1px solid #86efac; }
  .rt-toast.error   { background:#fee2e2; color:#dc2626; border:1px solid #fca5a5; }
  .rt-modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,.45); z-index:1000;
    display:flex; align-items:center; justify-content:center; }
  .rt-modal { background:var(--bg); border-radius:12px; padding:24px; min-width:380px;
    max-width:500px; width:90%; box-shadow:0 8px 40px rgba(0,0,0,.22); animation:slideIn .25s ease; }
  .rt-detail-row { display:flex; justify-content:space-between; padding:7px 0;
    border-bottom:1px solid var(--border); font-size:12px; }
  .rt-detail-row:last-child { border-bottom:none; }
  .rt-detail-label { color:var(--text-muted); font-weight:500; }
  .rt-detail-val { color:var(--text); font-weight:600; text-align:right; }
  .rt-select { background:var(--bg-2); border:1px solid var(--border); border-radius:7px;
    padding:7px 10px; font-size:12px; color:var(--text); outline:none; width:100%; cursor:pointer; }
  .rt-select:focus { border-color:var(--primary); }
  .rt-textarea { width:100%; background:var(--bg-2); border:1px solid var(--border);
    border-radius:7px; padding:7px 10px; font-size:12px; color:var(--text);
    outline:none; resize:none; box-sizing:border-box; }
  .rt-textarea:focus { border-color:var(--primary); }
`;

const RETURN_REASONS = [
  "Customer changed mind",
  "Wrong product delivered",
  "Damaged in transit",
  "Product defective",
  "Size/color mismatch",
  "Duplicate order",
  "Other",
];

/* ─── Return Detail Modal ────────────────────────────────── */
const ReturnDetailModal: React.FC<{
  order: ApiOrder;
  onClose: () => void;
  onRefund: (id: string, notes: string) => Promise<void>;
}> = ({ order, onClose, onRefund }) => {
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRefund = async () => {
    if (!reason) return;
    setLoading(true);
    await onRefund(order._id, `Return reason: ${reason}. ${notes}`.trim());
    setLoading(false);
    onClose();
  };

  return (
    <div className="rt-modal-overlay" onClick={onClose}>
      <div className="rt-modal" onClick={(e) => e.stopPropagation()}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>
              <i
                className="fa-solid fa-rotate-left"
                style={{ color: "#dc2626", marginRight: 6 }}
              />
              Return Details
            </div>
            <div
              style={{ color: "var(--text-muted)", fontSize: 11, marginTop: 2 }}
            >
              {order.orderId}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-muted)",
              fontSize: 16,
            }}
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        {/* Order Info */}
        <div>
          {[
            ["Customer", order.customer?.fullName ?? "—"],
            ["Phone", order.customer?.phone ?? "—"],
            ["City", order.shippingAddress?.city ?? "—"],
            ["Courier", order.courier?.name ?? "—"],
            ["Amount", fmt(order.totalAmount)],
            ["Payment", `${order.paymentMethod} — ${order.paymentStatus}`],
          ].map(([label, val]) => (
            <div className="rt-detail-row" key={label as string}>
              <span className="rt-detail-label">{label}</span>
              <span className="rt-detail-val">{val}</span>
            </div>
          ))}
        </div>

        {/* Return Reason */}
        <div style={{ marginTop: 16, marginBottom: 10 }}>
          <label
            style={{
              fontSize: 11,
              color: "var(--text-muted)",
              fontWeight: 600,
              display: "block",
              marginBottom: 5,
            }}
          >
            Return Reason *
          </label>
          <select
            className="rt-select"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          >
            <option value="">— Select reason —</option>
            {RETURN_REASONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label
            style={{
              fontSize: 11,
              color: "var(--text-muted)",
              fontWeight: 600,
              display: "block",
              marginBottom: 5,
            }}
          >
            Additional Notes
          </label>
          <textarea
            className="rt-textarea"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any extra details about the return..."
          />
        </div>

        {/* Refund Info */}
        {order.paymentStatus === "Paid" && (
          <div
            style={{
              background: "#fef3c7",
              border: "1px solid #fde68a",
              borderRadius: 7,
              padding: "9px 12px",
              marginBottom: 14,
              fontSize: 11,
              color: "#92400e",
            }}
          >
            <i
              className="fa-solid fa-triangle-exclamation"
              style={{ marginRight: 5 }}
            />
            This order was <strong>Paid</strong>. Marking refund will update
            payment status to Refunded.
          </div>
        )}

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button className="rt-btn" onClick={onClose}>
            Cancel
          </button>
          <button
            className="rt-btn rt-btn-red"
            onClick={handleRefund}
            disabled={loading || !reason}
          >
            {loading ? (
              <>
                <i className="fa-solid fa-spinner fa-spin" /> Processing…
              </>
            ) : (
              <>
                <i className="fa-solid fa-rotate-left" /> Process Return
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Pagination ─────────────────────────────────────────── */
const CPagination: React.FC<{
  p: ApiPagination;
  onPage: (n: number) => void;
}> = ({ p, onPage }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "10px 0 0",
      fontSize: 11,
      color: "var(--text-muted)",
    }}
  >
    <span>
      Showing {(p.currentPage - 1) * p.itemsPerPage + 1}–
      {Math.min(p.currentPage * p.itemsPerPage, p.totalItems)} of {p.totalItems}
    </span>
    <div style={{ display: "flex", gap: 4 }}>
      <button
        className="rt-btn"
        disabled={!p.hasPrev}
        onClick={() => onPage(p.currentPage - 1)}
      >
        ‹ Prev
      </button>
      <button
        className="rt-btn"
        disabled={!p.hasNext}
        onClick={() => onPage(p.currentPage + 1)}
      >
        Next ›
      </button>
    </div>
  </div>
);

/* ─── Main Component ─────────────────────────────────────── */
const ReturnsTab: React.FC = () => {
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [pagination, setPagination] = useState<ApiPagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [returnModal, setReturnModal] = useState<ApiOrder | null>(null);
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ordersAPI.getAll({
        status: "Returned",
        page,
        limit: 15,
        search,
      });
      setOrders(res.data?.data?.orders ?? []);
      setPagination(res.data?.data?.pagination ?? null);
    } catch {
      showToast("Failed to load returned orders.", "error");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleSearch = () => {
    setPage(1);
    setSearch(searchInput);
  };

  const handleProcessReturn = async (orderId: string, notes: string) => {
    try {
      // If paid, mark as refunded
      const order = orders.find((o) => o._id === orderId);
      if (order?.paymentStatus === "Paid") {
        await ordersAPI.updatePayment(orderId, "Refunded", notes);
      }
      showToast("Return processed successfully!", "success");
      fetchOrders();
    } catch (e: any) {
      showToast(
        e?.response?.data?.message ?? "Failed to process return.",
        "error",
      );
      throw e;
    }
  };

  // Stats
  const totalReturns = pagination?.totalItems ?? orders.length;
  const refundDue = orders.filter((o) => o.paymentStatus === "Paid");
  const totalRefundAmount = refundDue.reduce((s, o) => s + o.totalAmount, 0);

  return (
    <>
      <style>{styles}</style>

      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 14,
        }}
      >
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text)" }}>
            <i
              className="fa-solid fa-rotate-left"
              style={{ color: "#dc2626", marginRight: 7 }}
            />
            Returns
          </div>
          <div
            style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}
          >
            {totalReturns} returned order{totalReturns !== 1 ? "s" : ""} —
            process refunds and log reasons.
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            className="rt-search"
            placeholder="Search order or customer…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <button className="rt-btn" onClick={handleSearch}>
            <i className="fa-solid fa-magnifying-glass" />
          </button>
          <button
            className="rt-btn"
            onClick={() => {
              setPage(1);
              fetchOrders();
            }}
          >
            <i className="fa-solid fa-rotate-right" /> Refresh
          </button>
        </div>
      </div>

      {/* Refund Alert Banner */}
      {refundDue.length > 0 && (
        <div
          style={{
            background: "#fee2e2",
            border: "1px solid #fca5a5",
            borderRadius: 8,
            padding: "10px 14px",
            marginBottom: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 12,
          }}
        >
          <span style={{ color: "#991b1b", fontWeight: 600 }}>
            <i
              className="fa-solid fa-triangle-exclamation"
              style={{ marginRight: 6 }}
            />
            {refundDue.length} refund{refundDue.length > 1 ? "s" : ""} due —
            Total: <strong>{fmt(totalRefundAmount)}</strong>
          </span>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <TableSkeleton />
      ) : orders.length === 0 ? (
        <EmptyState msg="No returned orders found." />
      ) : (
        <>
          <div style={{ overflowX: "auto" }}>
            <table className="rt-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>City</th>
                  <th>Courier</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Pay Status</th>
                  <th>Return Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o._id}>
                    <td>
                      <span
                        style={{
                          color: "var(--primary)",
                          fontWeight: 700,
                          fontSize: 11,
                        }}
                      >
                        {o.orderId}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 12 }}>
                        {o.customer?.fullName ?? "—"}
                      </div>
                      <div style={{ color: "var(--text-muted)", fontSize: 10 }}>
                        {o.customer?.phone ?? ""}
                      </div>
                    </td>
                    <td style={{ color: "var(--text-muted)", fontSize: 11 }}>
                      {o.shippingAddress?.city ?? "—"}
                    </td>
                    <td style={{ fontSize: 11, fontWeight: 600 }}>
                      {o.courier?.name ?? "—"}
                    </td>
                    <td style={{ fontWeight: 700 }}>{fmt(o.totalAmount)}</td>
                    <td>
                      <Badge label={o.paymentMethod} color="#64748b" />
                    </td>
                    <td>{payBadge(o.paymentStatus)}</td>
                    <td style={{ color: "var(--text-muted)", fontSize: 11 }}>
                      {fmtDate(o.createdAt)}
                    </td>
                    <td>
                      {o.paymentStatus === "Paid" ? (
                        <button
                          className="rt-btn rt-btn-red"
                          style={{ fontSize: 10, padding: "4px 10px" }}
                          onClick={() => setReturnModal(o)}
                        >
                          <i className="fa-solid fa-rotate-left" /> Refund
                        </button>
                      ) : o.paymentStatus === "Refunded" ? (
                        <span
                          style={{
                            color: "#6366f1",
                            fontSize: 10,
                            fontWeight: 600,
                          }}
                        >
                          ✓ Refunded
                        </span>
                      ) : (
                        <button
                          className="rt-btn"
                          style={{ fontSize: 10, padding: "4px 10px" }}
                          onClick={() => setReturnModal(o)}
                        >
                          <i className="fa-solid fa-file-lines" /> Review
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pagination && <CPagination p={pagination} onPage={setPage} />}
        </>
      )}

      {/* Return Detail Modal */}
      {returnModal && (
        <ReturnDetailModal
          order={returnModal}
          onClose={() => setReturnModal(null)}
          onRefund={handleProcessReturn}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className={`rt-toast ${toast.type}`}>
          <i
            className={`fa-solid ${toast.type === "success" ? "fa-circle-check" : "fa-circle-exclamation"}`}
          />
          {toast.msg}
        </div>
      )}
    </>
  );
};

export default ReturnsTab;
