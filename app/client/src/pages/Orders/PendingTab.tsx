// PendingTab.tsx — Pending Orders (live API)
import React, { useState, useEffect, useCallback } from "react";
import { ordersAPI } from "../../services/api";

// ── Types ──────────────────────────────────────────────────
interface PendingOrder {
  _id: string;
  orderId: string;
  orderStatus: string;
  paymentMethod: string;
  paymentStatus: string;
  totalAmount: number;
  createdAt: string;
  source: string;
  customer?: { fullName?: string; email?: string; phone?: string };
  shippingAddress?: { city?: string; street?: string };
  notes?: string;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// ── Toast ──────────────────────────────────────────────────
const toastStyles = `
  .tab-toast{position:fixed;bottom:24px;right:24px;z-index:9999;padding:11px 18px;border-radius:8px;font-size:12px;font-weight:600;display:flex;align-items:center;gap:8px;box-shadow:0 4px 20px rgba(0,0,0,.15);animation:toastIn .3s ease}
  .tab-toast.success{background:#dcfce7;color:#16a34a;border:1px solid #86efac}
  .tab-toast.error{background:#fee2e2;color:#dc2626;border:1px solid #fca5a5}
  .tab-toast.info{background:#dbeafe;color:#1d4ed8;border:1px solid #93c5fd}
  @keyframes toastIn{from{transform:translateY(16px);opacity:0}to{transform:translateY(0);opacity:1}}
`;

// ── Helpers ────────────────────────────────────────────────
const fmt = (n: number) => "₨" + Number(n).toLocaleString();
const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
const fmtTime = (d: string) =>
  new Date(d).toLocaleTimeString("en-PK", {
    hour: "2-digit",
    minute: "2-digit",
  });

function getInitials(name: string) {
  return (name || "U")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// ── Order Detail Side Panel ────────────────────────────────
interface DetailPanelProps {
  order: PendingOrder | null;
  onClose: () => void;
  onConfirm: (id: string) => Promise<void>;
  onCancel: (id: string, reason: string) => Promise<void>;
}

const DetailPanel: React.FC<DetailPanelProps> = ({
  order,
  onClose,
  onConfirm,
  onCancel,
}) => {
  const [mode, setMode] = useState<"view" | "cancel">("view");
  const [cancelReason, setCancelReason] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setMode("view");
    setCancelReason("");
  }, [order]);

  if (!order) return null;

  return (
    <>
      <div className="prod-backdrop open" onClick={onClose} />
      <div className="prod-detail-panel open">
        <div className="detail-header">
          <div className="detail-title">
            <i
              className="fa-solid fa-clock"
              style={{ fontSize: 11, marginRight: 6, color: "var(--yellow)" }}
            />
            {mode === "cancel" ? "Cancel Order" : "Pending Order"}
          </div>
          <button className="detail-close" onClick={onClose}>
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <div
          className="detail-body"
          style={{ overflowY: "auto", flex: 1, padding: "12px 16px" }}
        >
          {mode === "view" ? (
            <>
              {/* Order Info */}
              <div
                style={{
                  background: "var(--bg)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  padding: "12px 14px",
                  marginBottom: 12,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 800 }}>
                      {order.orderId}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--text-muted)",
                        marginTop: 2,
                      }}
                    >
                      {fmtDate(order.createdAt)} · {fmtTime(order.createdAt)}
                    </div>
                  </div>
                  <span className="badge yellow">Pending</span>
                </div>
              </div>

              {/* Customer */}
              <div className="section-divider" style={{ marginTop: 0 }}>
                <span>Customer</span>
              </div>
              <div className="detail-row">
                <div className="detail-key">Name</div>
                <div className="detail-val">
                  <strong>{order.customer?.fullName ?? "—"}</strong>
                </div>
              </div>
              <div className="detail-row">
                <div className="detail-key">Phone</div>
                <div className="detail-val">{order.customer?.phone ?? "—"}</div>
              </div>
              <div className="detail-row">
                <div className="detail-key">City</div>
                <div className="detail-val">
                  {order.shippingAddress?.city ?? "—"}
                </div>
              </div>
              <div className="detail-row">
                <div className="detail-key">Channel</div>
                <div className="detail-val">
                  <span className="tag">{order.source}</span>
                </div>
              </div>

              {/* Payment */}
              <div className="section-divider">
                <span>Payment</span>
              </div>
              <div className="detail-row">
                <div className="detail-key">Method</div>
                <div className="detail-val">
                  <span className="tag">
                    <i
                      className={`fa-solid ${order.paymentMethod === "COD" ? "fa-money-bill" : "fa-credit-card"}`}
                      style={{ fontSize: 9 }}
                    />{" "}
                    {order.paymentMethod}
                  </span>
                </div>
              </div>
              <div className="detail-row">
                <div className="detail-key">Status</div>
                <div className="detail-val">
                  <span className="badge yellow">{order.paymentStatus}</span>
                </div>
              </div>
              <div className="detail-row">
                <div className="detail-key">Total</div>
                <div className="detail-val">
                  <strong style={{ color: "var(--accent)", fontSize: 14 }}>
                    {fmt(order.totalAmount)}
                  </strong>
                </div>
              </div>

              {order.notes && (
                <>
                  <div className="section-divider">
                    <span>Notes</span>
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--text-muted)",
                      padding: "4px 0",
                    }}
                  >
                    {order.notes}
                  </div>
                </>
              )}

              <hr />
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  className="header-btn primary"
                  style={{
                    flex: 1,
                    justifyContent: "center",
                    opacity: saving ? 0.6 : 1,
                  }}
                  disabled={saving}
                  onClick={async () => {
                    setSaving(true);
                    await onConfirm(order._id);
                    setSaving(false);
                    onClose();
                  }}
                >
                  {saving ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin" />{" "}
                      Confirming...
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-circle-check" /> Confirm Order
                    </>
                  )}
                </button>
                <button
                  className="header-btn"
                  style={{ color: "var(--red)", borderColor: "var(--red)" }}
                  onClick={() => setMode("cancel")}
                >
                  <i className="fa-solid fa-xmark" /> Cancel
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Cancel Mode */}
              <div
                style={{
                  background: "#FEF2F2",
                  border: "1px solid var(--red)",
                  borderRadius: 8,
                  padding: 14,
                  marginBottom: 14,
                  display: "flex",
                  gap: 10,
                }}
              >
                <i
                  className="fa-solid fa-triangle-exclamation"
                  style={{ color: "var(--red)", fontSize: 18, marginTop: 2 }}
                />
                <div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: "var(--red)",
                    }}
                  >
                    Cancel {order.orderId}?
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--text-muted)",
                      marginTop: 4,
                    }}
                  >
                    Stock will be restored automatically.
                  </div>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 10 }}>
                <div className="form-label">Cancellation Reason *</div>
                <select
                  className="form-select"
                  style={{ width: "100%" }}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                >
                  <option value="">— Select reason —</option>
                  <option>Customer requested cancellation</option>
                  <option>Item out of stock</option>
                  <option>Duplicate order</option>
                  <option>Payment not received</option>
                  <option>Wrong address / unreachable</option>
                  <option>Other</option>
                </select>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <button
                  className="header-btn"
                  style={{
                    flex: 1,
                    justifyContent: "center",
                    background:
                      cancelReason && !saving ? "var(--red)" : "var(--border)",
                    color:
                      cancelReason && !saving ? "#fff" : "var(--text-muted)",
                    borderColor:
                      cancelReason && !saving ? "var(--red)" : "var(--border)",
                    cursor: cancelReason && !saving ? "pointer" : "not-allowed",
                  }}
                  disabled={!cancelReason || saving}
                  onClick={async () => {
                    setSaving(true);
                    await onCancel(order._id, cancelReason);
                    setSaving(false);
                    onClose();
                  }}
                >
                  {saving ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin" />{" "}
                      Cancelling...
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-xmark" /> Confirm Cancel
                    </>
                  )}
                </button>
                <button className="header-btn" onClick={() => setMode("view")}>
                  Back
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

// ── Main Component ─────────────────────────────────────────
const PendingTab: React.FC = () => {
  const [orders, setOrders] = useState<PendingOrder[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<PendingOrder | null>(null);
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const PER_PAGE = 15;

  const showToast = (msg: string, type: "success" | "error" | "info") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, any> = {
        page,
        limit: PER_PAGE,
        status: "Pending",
      };
      if (search.trim()) params.search = search.trim();
      const res = await ordersAPI.getAll(params);
      const data = res.data?.data;
      setOrders(data?.orders ?? []);
      setPagination(
        data?.pagination ?? {
          currentPage: 1,
          totalPages: 1,
          totalItems: 0,
          hasNext: false,
          hasPrev: false,
        },
      );
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Failed to load pending orders.");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleConfirm = async (id: string) => {
    setConfirming(id);
    try {
      await ordersAPI.updateStatus(
        id,
        "Confirmed",
        "Confirmed via Pending tab",
      );
      showToast("Order confirmed successfully!", "success");
      fetchOrders();
    } catch (e: any) {
      showToast(
        e?.response?.data?.message ?? "Failed to confirm order.",
        "error",
      );
    } finally {
      setConfirming(null);
    }
  };

  const handleCancel = async (id: string, reason: string) => {
    try {
      await ordersAPI.delete(id, reason);
      showToast("Order cancelled. Stock restored.", "info");
      fetchOrders();
    } catch (e: any) {
      showToast(
        e?.response?.data?.message ?? "Failed to cancel order.",
        "error",
      );
    }
  };

  const { currentPage, totalPages, totalItems } = pagination;
  const start = (currentPage - 1) * PER_PAGE + 1;
  const end = Math.min(currentPage * PER_PAGE, totalItems);

  return (
    <>
      <style>{toastStyles}</style>

      {toast && (
        <div className={`tab-toast ${toast.type}`}>
          <i
            className={`fa-solid ${toast.type === "success" ? "fa-circle-check" : toast.type === "error" ? "fa-circle-exclamation" : "fa-circle-info"}`}
          />
          {toast.msg}
        </div>
      )}

      <DetailPanel
        order={selected}
        onClose={() => setSelected(null)}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />

      {/* Stats */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 0,
          background: "var(--bg)",
          border: "1px solid var(--border)",
          borderRadius: 10,
          marginBottom: 14,
          overflow: "hidden",
        }}
      >
        {[
          {
            icon: "fa-clock",
            color: "#d97706",
            bg: "#fef3c7",
            label: "Pending",
            value: loading ? "—" : totalItems,
            sub: "total orders",
          },
          {
            icon: "fa-layer-group",
            color: "#6366f1",
            bg: "#ede9fe",
            label: "This Page",
            value: loading ? "—" : orders.length,
            sub: `${start}–${end}`,
          },
          {
            icon: "fa-money-bills",
            color: "#0891b2",
            bg: "#e0f2fe",
            label: "COD",
            value: loading
              ? "—"
              : orders.filter((o) => o.paymentMethod === "COD").length,
            sub: "cash on delivery",
          },
          {
            icon: "fa-coins",
            color: "#16a34a",
            bg: "#dcfce7",
            label: "Total Value",
            value: loading
              ? "—"
              : fmt(orders.reduce((s, o) => s + o.totalAmount, 0)),
            sub: "this page",
          },
        ].map((item, i, arr) => (
          <div
            key={item.label}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 18px",
              borderRight:
                i < arr.length - 1 ? "1px solid var(--border)" : "none",
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                flexShrink: 0,
                background: item.bg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <i
                className={`fa-solid ${item.icon}`}
                style={{ color: item.color, fontSize: 14 }}
              />
            </div>
            <div>
              <div
                style={{
                  fontSize: 10,
                  color: "var(--text-muted)",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: ".5px",
                }}
              >
                {item.label}
              </div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 800,
                  color: "var(--text)",
                  lineHeight: 1.2,
                }}
              >
                {item.value}
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: "var(--text-muted)",
                  marginTop: 1,
                }}
              >
                {item.sub}
              </div>
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div
          style={{
            background: "#FEF2F2",
            border: "1px solid var(--red)",
            borderRadius: 8,
            padding: "10px 14px",
            marginBottom: 12,
            fontSize: 12,
            color: "var(--red)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <i className="fa-solid fa-triangle-exclamation" />
          <span style={{ flex: 1 }}>{error}</span>
          <button
            className="header-btn"
            onClick={fetchOrders}
            style={{ fontSize: 11 }}
          >
            <i className="fa-solid fa-rotate-right" /> Retry
          </button>
        </div>
      )}

      <div className="card">
        <div className="table-toolbar">
          <div className="table-toolbar-left">
            <div className="table-search">
              <i className="fa-solid fa-magnifying-glass" />
              <input
                placeholder="Search order ID, customer..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>
          <div className="table-toolbar-right">
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
              {loading ? "Loading..." : `${totalItems} orders`}
            </span>
            <button className="t-filter-btn" onClick={fetchOrders}>
              <i className="fa-solid fa-rotate-right" /> Refresh
            </button>
          </div>
        </div>

        <div className="table-wrap">
          {loading ? (
            <div
              style={{
                padding: 32,
                textAlign: "center",
                color: "var(--text-muted)",
                fontSize: 13,
              }}
            >
              <i
                className="fa-solid fa-spinner fa-spin"
                style={{ marginRight: 8 }}
              />{" "}
              Loading...
            </div>
          ) : orders.length === 0 ? (
            <div
              style={{
                padding: 48,
                textAlign: "center",
                color: "var(--text-muted)",
                fontSize: 13,
              }}
            >
              <i
                className="fa-solid fa-clock"
                style={{
                  fontSize: 28,
                  display: "block",
                  marginBottom: 10,
                  opacity: 0.3,
                }}
              />
              No pending orders
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>City</th>
                  <th>Value</th>
                  <th>Payment</th>
                  <th>Channel</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr
                    key={o._id}
                    style={{ cursor: "pointer" }}
                    onClick={() => setSelected(o)}
                  >
                    <td>
                      <strong>{o.orderId}</strong>
                    </td>
                    <td>
                      <div className="td-flex">
                        <div className="row-avatar">
                          {getInitials(o.customer?.fullName ?? "U")}
                        </div>
                        <div>
                          <div>{o.customer?.fullName ?? "—"}</div>
                          <div className="td-sub">
                            {o.customer?.phone ?? "—"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>{o.shippingAddress?.city ?? "—"}</td>
                    <td>
                      <strong>{fmt(o.totalAmount)}</strong>
                    </td>
                    <td>
                      <span className="tag">
                        <i
                          className={`fa-solid ${o.paymentMethod === "COD" ? "fa-money-bill" : "fa-credit-card"}`}
                          style={{ fontSize: 9 }}
                        />{" "}
                        {o.paymentMethod}
                      </span>
                    </td>
                    <td>
                      <span className="tag">{o.source}</span>
                    </td>
                    <td style={{ fontSize: 11 }}>{fmtDate(o.createdAt)}</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button
                          className="header-btn primary"
                          style={{
                            fontSize: 10,
                            height: 26,
                            opacity: confirming === o._id ? 0.6 : 1,
                          }}
                          disabled={confirming === o._id}
                          onClick={() => handleConfirm(o._id)}
                        >
                          {confirming === o._id ? (
                            <i className="fa-solid fa-spinner fa-spin" />
                          ) : (
                            <>
                              <i className="fa-solid fa-check" /> Confirm
                            </>
                          )}
                        </button>
                        <button
                          className="header-btn"
                          style={{ fontSize: 10, height: 26 }}
                          onClick={() => setSelected(o)}
                        >
                          <i className="fa-solid fa-eye" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <div className="pagination-info">
              Showing{" "}
              <strong>
                {start}–{end}
              </strong>{" "}
              of <strong>{totalItems}</strong>
            </div>
            <div className="pagination-controls">
              <button
                className="page-btn"
                disabled={!pagination.hasPrev}
                onClick={() => setPage((p) => p - 1)}
              >
                <i
                  className="fa-solid fa-chevron-left"
                  style={{ fontSize: 9 }}
                />
              </button>
              {Array.from(
                { length: Math.min(5, totalPages) },
                (_, i) => i + 1,
              ).map((p) => (
                <button
                  key={p}
                  className={`page-btn ${p === currentPage ? "active" : ""}`}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              ))}
              <button
                className="page-btn"
                disabled={!pagination.hasNext}
                onClick={() => setPage((p) => p + 1)}
              >
                <i
                  className="fa-solid fa-chevron-right"
                  style={{ fontSize: 9 }}
                />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default PendingTab;
