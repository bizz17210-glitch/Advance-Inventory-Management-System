// DeliveredTab.tsx — dynamic
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

const methodBadge = (m: string) => {
  const isCod = m === "COD";
  return <Badge label={m} color={isCod ? "#d97706" : "#16a34a"} />;
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
      className="fa-solid fa-box-open"
      style={{
        fontSize: 28,
        marginBottom: 10,
        display: "block",
        opacity: 0.35,
      }}
    />
    <div style={{ fontSize: 13 }}>{msg}</div>
  </div>
);

/* ─── Styles ─────────────────────────────────────────────── */
const styles = `
  @keyframes pulse { 0%,100%{opacity:.6} 50%{opacity:.3} }
  @keyframes slideIn { from{transform:translateY(16px);opacity:0} to{transform:translateY(0);opacity:1} }
  .dt-table { width:100%; border-collapse:collapse; font-size:12px; }
  .dt-table th { background:var(--bg-2); color:var(--text-muted); font-size:10px; font-weight:700;
    text-transform:uppercase; letter-spacing:.6px; padding:8px 10px; text-align:left; white-space:nowrap; }
  .dt-table td { padding:10px 10px; border-bottom:1px solid var(--border); color:var(--text); vertical-align:middle; }
  .dt-table tr:hover td { background:var(--bg-2); }
  .dt-search { background:var(--bg-2); border:1px solid var(--border); border-radius:7px;
    padding:7px 12px; font-size:12px; color:var(--text); outline:none; width:220px; }
  .dt-search:focus { border-color:var(--primary); }
  .dt-btn { padding:5px 12px; border-radius:6px; font-size:11px; font-weight:600; cursor:pointer;
    border:1px solid var(--border); background:var(--bg-2); color:var(--text); transition:all .15s; }
  .dt-btn:hover { border-color:var(--primary); color:var(--primary); }
  .dt-btn-primary { background:var(--primary); color:#fff; border-color:var(--primary); }
  .dt-btn-primary:hover { opacity:.88; color:#fff; }
  .dt-btn-green { background:#16a34a; color:#fff; border-color:#16a34a; }
  .dt-btn-green:hover { opacity:.88; color:#fff; }
  .dt-btn:disabled { opacity:.4; cursor:not-allowed; }
  .dt-toast { position:fixed; bottom:24px; right:24px; z-index:9999; padding:10px 16px;
    border-radius:8px; font-size:12px; font-weight:600; display:flex; align-items:center;
    gap:8px; box-shadow:0 4px 16px rgba(0,0,0,.18); animation:slideIn .3s ease; }
  .dt-toast.success { background:#dcfce7; color:#16a34a; border:1px solid #86efac; }
  .dt-toast.error   { background:#fee2e2; color:#dc2626; border:1px solid #fca5a5; }
  .dt-modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,.45); z-index:1000;
    display:flex; align-items:center; justify-content:center; }
  .dt-modal { background:var(--bg); border-radius:12px; padding:24px; min-width:380px;
    max-width:500px; width:90%; box-shadow:0 8px 40px rgba(0,0,0,.22); animation:slideIn .25s ease; }
  .dt-detail-row { display:flex; justify-content:space-between; padding:7px 0;
    border-bottom:1px solid var(--border); font-size:12px; }
  .dt-detail-row:last-child { border-bottom:none; }
  .dt-detail-label { color:var(--text-muted); font-weight:500; }
  .dt-detail-val { color:var(--text); font-weight:600; text-align:right; }
  .dt-filter-tab { padding:5px 14px; border-radius:20px; font-size:11px; font-weight:600;
    cursor:pointer; border:1px solid var(--border); background:transparent; color:var(--text-muted);
    transition:all .15s; }
  .dt-filter-tab.active { background:var(--primary); color:#fff; border-color:var(--primary); }
  .dt-stat-card { background:var(--bg-2); border:1px solid var(--border); border-radius:10px;
    padding:14px 18px; flex:1; min-width:0; }
`;

/* ─── COD Modal ──────────────────────────────────────────── */
const CODModal: React.FC<{
  order: ApiOrder;
  onClose: () => void;
  onMarkPaid: (id: string, notes: string) => Promise<void>;
}> = ({ order, onClose, onMarkPaid }) => {
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    setLoading(true);
    await onMarkPaid(order._id, notes || "COD collected on delivery");
    setLoading(false);
    onClose();
  };

  return (
    <div className="dt-modal-overlay" onClick={onClose}>
      <div className="dt-modal" onClick={(e) => e.stopPropagation()}>
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
                className="fa-solid fa-money-bill-wave"
                style={{ color: "#16a34a", marginRight: 6 }}
              />
              Collect COD
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

        <div
          style={{
            background: "var(--bg-2)",
            borderRadius: 8,
            padding: "12px 16px",
            marginBottom: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ color: "var(--text-muted)", fontSize: 12 }}>
              COD Amount
            </span>
            <span style={{ fontWeight: 800, fontSize: 18, color: "#16a34a" }}>
              {fmt(order.totalAmount)}
            </span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 6,
            }}
          >
            <span style={{ color: "var(--text-muted)", fontSize: 12 }}>
              Customer
            </span>
            <span style={{ fontWeight: 600, fontSize: 12 }}>
              {order.customer?.fullName ?? "—"}
            </span>
          </div>
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
            Notes (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Cash received from customer..."
            rows={2}
            style={{
              width: "100%",
              background: "var(--bg-2)",
              border: "1px solid var(--border)",
              borderRadius: 7,
              padding: "7px 10px",
              fontSize: 12,
              color: "var(--text)",
              outline: "none",
              resize: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button className="dt-btn" onClick={onClose}>
            Cancel
          </button>
          <button
            className="dt-btn dt-btn-green"
            onClick={handle}
            disabled={loading}
          >
            {loading ? (
              <>
                <i className="fa-solid fa-spinner fa-spin" /> Processing…
              </>
            ) : (
              <>
                <i className="fa-solid fa-check" /> Mark as Paid
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
        className="dt-btn"
        disabled={!p.hasPrev}
        onClick={() => onPage(p.currentPage - 1)}
      >
        ‹ Prev
      </button>
      <button
        className="dt-btn"
        disabled={!p.hasNext}
        onClick={() => onPage(p.currentPage + 1)}
      >
        Next ›
      </button>
    </div>
  </div>
);

/* ─── Main Component ─────────────────────────────────────── */
const DeliveredTab: React.FC = () => {
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [pagination, setPagination] = useState<ApiPagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [payFilter, setPayFilter] = useState<"all" | "Pending" | "Paid">("all");
  const [codModal, setCodModal] = useState<ApiOrder | null>(null);
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);

  // Stats
  const codPending = orders.filter(
    (o) => o.paymentMethod === "COD" && o.paymentStatus === "Pending",
  );
  const totalCodPending = codPending.reduce((s, o) => s + o.totalAmount, 0);

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {
        status: "Delivered",
        page,
        limit: 15,
        search,
      };
      if (payFilter !== "all") params.paymentStatus = payFilter;
      const res = await ordersAPI.getAll(params);
      setOrders(res.data?.data?.orders ?? []);
      setPagination(res.data?.data?.pagination ?? null);
    } catch {
      showToast("Failed to load delivered orders.", "error");
    } finally {
      setLoading(false);
    }
  }, [page, search, payFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleSearch = () => {
    setPage(1);
    setSearch(searchInput);
  };

  const handleMarkPaid = async (orderId: string, notes: string) => {
    try {
      await ordersAPI.updatePayment(orderId, "Paid", notes);
      showToast("COD marked as Paid!", "success");
      fetchOrders();
    } catch (e: any) {
      showToast(
        e?.response?.data?.message ?? "Failed to update payment.",
        "error",
      );
      throw e;
    }
  };

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
              className="fa-solid fa-circle-check"
              style={{ color: "#16a34a", marginRight: 7 }}
            />
            Delivered Orders
          </div>
          <div
            style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}
          >
            Collect pending COD payments and review delivery history.
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            className="dt-search"
            placeholder="Search order or customer…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <button className="dt-btn" onClick={handleSearch}>
            <i className="fa-solid fa-magnifying-glass" />
          </button>
          <button
            className="dt-btn"
            onClick={() => {
              setPage(1);
              fetchOrders();
            }}
          >
            <i className="fa-solid fa-rotate-right" /> Refresh
          </button>
        </div>
      </div>

      {/* COD Stat Banner */}
      {codPending.length > 0 && (
        <div
          style={{
            background: "#fef3c7",
            border: "1px solid #fde68a",
            borderRadius: 8,
            padding: "10px 14px",
            marginBottom: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 12,
          }}
        >
          <span style={{ color: "#92400e", fontWeight: 600 }}>
            <i
              className="fa-solid fa-money-bill-wave"
              style={{ marginRight: 6 }}
            />
            {codPending.length} COD order{codPending.length > 1 ? "s" : ""}{" "}
            pending collection — <strong>{fmt(totalCodPending)}</strong>
          </span>
          <button
            className="dt-btn dt-btn-green"
            style={{ fontSize: 10 }}
            onClick={() => setPayFilter("Pending")}
          >
            View Pending
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        {(["all", "Pending", "Paid"] as const).map((f) => (
          <button
            key={f}
            className={`dt-filter-tab${payFilter === f ? " active" : ""}`}
            onClick={() => {
              setPayFilter(f);
              setPage(1);
            }}
          >
            {f === "all"
              ? "All"
              : f === "Pending"
                ? "⏳ COD Pending"
                : "✅ Paid"}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <TableSkeleton />
      ) : orders.length === 0 ? (
        <EmptyState msg="No delivered orders found." />
      ) : (
        <>
          <div style={{ overflowX: "auto" }}>
            <table className="dt-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>City</th>
                  <th>Courier</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Pay Status</th>
                  <th>Delivered</th>
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
                    <td>{methodBadge(o.paymentMethod)}</td>
                    <td>{payBadge(o.paymentStatus)}</td>
                    <td style={{ color: "var(--text-muted)", fontSize: 11 }}>
                      {fmtDate(o.createdAt)}
                    </td>
                    <td>
                      {o.paymentMethod === "COD" &&
                      o.paymentStatus === "Pending" ? (
                        <button
                          className="dt-btn dt-btn-green"
                          style={{ fontSize: 10, padding: "4px 10px" }}
                          onClick={() => setCodModal(o)}
                        >
                          <i className="fa-solid fa-money-bill-wave" /> Collect
                        </button>
                      ) : (
                        <span
                          style={{ color: "var(--text-muted)", fontSize: 10 }}
                        >
                          {o.paymentStatus === "Paid" ? "✅ Settled" : "—"}
                        </span>
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

      {/* COD Modal */}
      {codModal && (
        <CODModal
          order={codModal}
          onClose={() => setCodModal(null)}
          onMarkPaid={handleMarkPaid}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className={`dt-toast ${toast.type}`}>
          <i
            className={`fa-solid ${toast.type === "success" ? "fa-circle-check" : "fa-circle-exclamation"}`}
          />
          {toast.msg}
        </div>
      )}
    </>
  );
};

export default DeliveredTab;
