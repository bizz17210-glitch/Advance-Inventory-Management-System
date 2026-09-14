// ShippedTab.tsx — dynamic
import React, { useState, useEffect, useCallback } from "react";
import { ordersAPI, ridersAPI } from "../../services/api";

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
      className="fa-solid fa-truck"
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
  @keyframes stSlideIn {
    from { transform: translateX(100%); opacity: 0; }
    to   { transform: translateX(0);    opacity: 1; }
  }
  @keyframes stFadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  /* Table */
  .st-table { width:100%; border-collapse:collapse; font-size:12px; }
  .st-table th {
    background:var(--bg-2); color:var(--text-muted); font-size:10px; font-weight:700;
    text-transform:uppercase; letter-spacing:.6px; padding:8px 10px;
    text-align:left; white-space:nowrap;
  }
  .st-table td {
    padding:10px 10px; border-bottom:1px solid var(--border);
    color:var(--text); vertical-align:middle;
  }
  .st-table tr:hover td { background:var(--bg-2); }

  /* Search */
  .st-search {
    background:var(--bg-2); border:1px solid var(--border); border-radius:7px;
    padding:7px 12px; font-size:12px; color:var(--text); outline:none; width:220px;
  }
  .st-search:focus { border-color:var(--primary); }

  /* Buttons */
  .st-btn {
    padding:5px 12px; border-radius:6px; font-size:11px; font-weight:600;
    cursor:pointer; border:1px solid var(--border); background:var(--bg-2);
    color:var(--text); transition:all .15s; display:inline-flex;
    align-items:center; gap:5px;
  }
  .st-btn:hover { border-color:var(--primary); color:var(--primary); }
  .st-btn-primary {
    background:var(--primary,#6366f1); color:#fff;
    border-color:var(--primary,#6366f1);
  }
  .st-btn-primary:hover { opacity:.88; color:#fff; }
  .st-btn-green {
    background:#16a34a; color:#fff; border-color:#16a34a;
  }
  .st-btn-green:hover { opacity:.88; color:#fff; }
  .st-btn-red {
    background:#fee2e2; color:#dc2626; border-color:#fca5a5;
  }
  .st-btn-red:hover { background:#dc2626; color:#fff; border-color:#dc2626; }
  .st-btn:disabled { opacity:.4; cursor:not-allowed; }

  /* Toast */
  .st-toast {
    position:fixed; bottom:24px; right:24px; z-index:9999; padding:10px 16px;
    border-radius:8px; font-size:12px; font-weight:600; display:flex;
    align-items:center; gap:8px; box-shadow:0 4px 16px rgba(0,0,0,.18);
    animation:stFadeIn .3s ease;
  }
  .st-toast.success { background:#dcfce7; color:#16a34a; border:1px solid #86efac; }
  .st-toast.error   { background:#fee2e2; color:#dc2626; border:1px solid #fca5a5; }

  /* Side Panel Backdrop */
  .st-backdrop {
    position:fixed; inset:0; background:rgba(0,0,0,0);
    z-index:1000; pointer-events:none; transition:background .3s ease;
  }
  .st-backdrop.open {
    background:rgba(0,0,0,.35); pointer-events:all;
  }

  /* Side Panel */
  .st-panel {
    position:fixed; top:0; right:0; height:100vh; width:380px; max-width:95vw;
    background:var(--bg, #fff); z-index:1001;
    box-shadow:-8px 0 32px rgba(0,0,0,.15);
    display:flex; flex-direction:column;
    transform:translateX(100%);
    transition:transform .32s cubic-bezier(.4,0,.2,1);
    border-left:1px solid var(--border);
  }
  .st-panel.open {
    transform:translateX(0);
  }

  /* Panel Header */
  .st-panel-header {
    display:flex; align-items:center; justify-content:space-between;
    padding:16px 20px; border-bottom:1px solid var(--border);
    background:var(--bg-2); flex-shrink:0;
  }
  .st-panel-title { font-size:14px; font-weight:800; color:var(--text); }
  .st-panel-sub { font-size:11px; color:var(--text-muted); margin-top:2px; }
  .st-panel-close {
    width:30px; height:30px; border-radius:8px; border:1px solid var(--border);
    background:var(--bg); color:var(--text-muted); cursor:pointer;
    display:flex; align-items:center; justify-content:center; font-size:14px;
    transition:all .15s;
  }
  .st-panel-close:hover { background:var(--border); color:var(--text); }

  /* Panel Body */
  .st-panel-body {
    flex:1; overflow-y:auto; padding:16px 20px;
  }

  /* Panel Footer */
  .st-panel-footer {
    padding:14px 20px; border-top:1px solid var(--border);
    background:var(--bg-2); display:flex; gap:8px; flex-shrink:0;
  }

  /* Detail rows inside panel */
  .st-drow {
    display:flex; justify-content:space-between; align-items:center;
    padding:9px 0; border-bottom:1px solid var(--border); font-size:12px;
  }
  .st-drow:last-child { border-bottom:none; }
  .st-drow-label { color:var(--text-muted); font-weight:500; font-size:11px; }
  .st-drow-val { color:var(--text); font-weight:600; text-align:right; }

  /* Section label inside panel */
  .st-section {
    font-size:10px; font-weight:700; text-transform:uppercase;
    letter-spacing:.7px; color:var(--text-muted); margin:14px 0 6px;
  }

  /* Info card inside panel */
  .st-info-card {
    background:var(--bg-2); border:1px solid var(--border);
    border-radius:10px; padding:12px 14px; margin-bottom:14px;
  }

  /* Action buttons in table */
  .st-action-group { display:flex; gap:5px; align-items:center; }
`;

/* ─── Side Panel ─────────────────────────────────────────── */
/* ─── Types for Rider ────────────────────────────────────── */
interface ApiRiderBasic {
  _id: string;
  fullName: string;
  status: string;
  isAvailable: boolean;
  assignedZone?: string;
  activeDeliveries?: number;
  vehicle?: { type?: string };
}

/* ─── Side Panel ─────────────────────────────────────────── */
const OrderSidePanel: React.FC<{
  order: ApiOrder | null;
  onClose: () => void;
  onMarkDelivered: (id: string) => Promise<void>;
  onMarkReturned: (id: string) => Promise<void>;
  showToast: (msg: string, type: "success" | "error") => void;
}> = ({ order, onClose, onMarkDelivered, onMarkReturned, showToast }) => {
  const isOpen = !!order;

  // Action states
  const [loadingDeliver, setLoadingDeliver] = useState(false);
  const [loadingReturn, setLoadingReturn] = useState(false);

  // Rider assignment states
  const [deliveryMode, setDeliveryMode] = useState<"courier" | "rider">(
    "courier",
  );
  const [riders, setRiders] = useState<ApiRiderBasic[]>([]);
  const [ridersLoading, setRidersLoading] = useState(false);
  const [selectedRiderId, setSelectedRiderId] = useState("");
  const [assigningRider, setAssigningRider] = useState(false);

  // Reset when panel opens/closes
  useEffect(() => {
    if (!isOpen) {
      setLoadingDeliver(false);
      setLoadingReturn(false);
      setDeliveryMode("courier");
      setSelectedRiderId("");
      setRiders([]);
    } else {
      // Fetch available riders when panel opens
      fetchAvailableRiders();
    }
  }, [isOpen]);

  const fetchAvailableRiders = async () => {
    setRidersLoading(true);
    try {
      const res = await ridersAPI.getAll({ limit: 100 });
      const all: ApiRiderBasic[] = res.data?.data?.riders ?? [];
      // Sirf Active ya OnDelivery riders show karo, OnLeave/Inactive nahi
      const available = all.filter(
        (r) => r.status === "Active" || r.status === "OnDelivery",
      );
      setRiders(available);
    } catch {
      // silent fail — rider list optional
    } finally {
      setRidersLoading(false);
    }
  };

  const handleDeliver = async () => {
    if (!order) return;
    setLoadingDeliver(true);
    try {
      await onMarkDelivered(order._id);
      onClose();
    } finally {
      setLoadingDeliver(false);
    }
  };

  const handleReturn = async () => {
    if (!order) return;
    if (!window.confirm(`Mark ${order.orderId} as Returned?`)) return;
    setLoadingReturn(true);
    try {
      await onMarkReturned(order._id);
      onClose();
    } finally {
      setLoadingReturn(false);
    }
  };

  const handleAssignRider = async () => {
    if (!order || !selectedRiderId) return;
    setAssigningRider(true);
    try {
      // Step 1: Order ko Delivered mark karo
      await onMarkDelivered(order._id);

      // Step 2: Rider delivery status update karo (best effort — fail ho tu bhi chalega)
      try {
        await ridersAPI.updateDeliveryStatus(selectedRiderId, order._id, {
          status: "delivered",
          notes: `Delivered via rider from Shipped tab — ${order.orderId}`,
        });
      } catch {
        // silent — rider update fail ho tu order already delivered hai
      }

      const selectedRider = riders.find((r) => r._id === selectedRiderId);
      showToast(
        `Order ${order.orderId} delivered via ${selectedRider?.fullName ?? "rider"}!`,
        "success",
      );
      onClose();
    } catch (e: any) {
      showToast(
        e?.response?.data?.message ?? "Failed to mark delivered.",
        "error",
      );
    } finally {
      setAssigningRider(false);
    }
  };

  const getStatusColor = (status: string) => {
    if (status === "Active") return "#16a34a";
    if (status === "OnDelivery") return "#d97706";
    return "#64748b";
  };

  const getStatusLabel = (r: ApiRiderBasic) => {
    if (r.status === "OnDelivery")
      return `On Delivery (${r.activeDeliveries ?? 0} active)`;
    if (r.isAvailable) return "Available";
    return r.status;
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`st-backdrop ${isOpen ? "open" : ""}`}
        onClick={onClose}
      />

      {/* Panel */}
      <div className={`st-panel ${isOpen ? "open" : ""}`}>
        {/* Header */}
        <div className="st-panel-header">
          <div>
            <div className="st-panel-title">
              <i
                className="fa-solid fa-truck-fast"
                style={{ color: "#6366f1", marginRight: 7, fontSize: 12 }}
              />
              Shipment Detail
            </div>
            <div className="st-panel-sub">{order?.orderId ?? "—"}</div>
          </div>
          <button className="st-panel-close" onClick={onClose}>
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        {/* Body */}
        <div className="st-panel-body">
          {order ? (
            <>
              {/* Status strip */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "#eef2ff",
                  border: "1px solid #c7d2fe",
                  borderRadius: 9,
                  padding: "10px 14px",
                  marginBottom: 16,
                }}
              >
                <div>
                  <div
                    style={{ fontSize: 11, color: "#6366f1", fontWeight: 700 }}
                  >
                    IN TRANSIT
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, marginTop: 2 }}>
                    {order.orderId}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div
                    style={{ fontSize: 16, fontWeight: 800, color: "#6366f1" }}
                  >
                    {fmt(order.totalAmount)}
                  </div>
                  <div style={{ fontSize: 10, color: "#6366f1", marginTop: 2 }}>
                    {order.paymentMethod}
                  </div>
                </div>
              </div>

              {/* Customer */}
              <div className="st-section">Customer</div>
              <div className="st-info-card">
                <div className="st-drow" style={{ paddingTop: 0 }}>
                  <span className="st-drow-label">Name</span>
                  <span className="st-drow-val">
                    {order.customer?.fullName ?? "—"}
                  </span>
                </div>
                <div className="st-drow">
                  <span className="st-drow-label">Phone</span>
                  <span className="st-drow-val">
                    {order.customer?.phone ?? "—"}
                  </span>
                </div>
                <div className="st-drow" style={{ paddingBottom: 0 }}>
                  <span className="st-drow-label">City</span>
                  <span className="st-drow-val">
                    {order.shippingAddress?.city ?? "—"}
                  </span>
                </div>
              </div>

              {/* Shipment */}
              <div className="st-section">Shipment Info</div>
              <div className="st-info-card">
                <div className="st-drow" style={{ paddingTop: 0 }}>
                  <span className="st-drow-label">Courier</span>
                  <span className="st-drow-val">
                    {order.courier?.name ?? (
                      <span style={{ color: "var(--text-muted)" }}>
                        Not assigned
                      </span>
                    )}
                  </span>
                </div>
                <div className="st-drow">
                  <span className="st-drow-label">Tracking #</span>
                  <span className="st-drow-val">
                    {order.trackingNumber ? (
                      <code
                        style={{
                          fontSize: 10,
                          background: "var(--bg-2)",
                          padding: "2px 7px",
                          borderRadius: 5,
                          border: "1px solid var(--border)",
                        }}
                      >
                        {order.trackingNumber}
                      </code>
                    ) : (
                      <span style={{ color: "var(--text-muted)" }}>—</span>
                    )}
                  </span>
                </div>
                <div className="st-drow" style={{ paddingBottom: 0 }}>
                  <span className="st-drow-label">Shipped On</span>
                  <span className="st-drow-val">
                    {fmtDate(order.createdAt)}
                  </span>
                </div>
              </div>

              {/* Payment */}
              <div className="st-section">Payment</div>
              <div className="st-info-card">
                <div className="st-drow" style={{ paddingTop: 0 }}>
                  <span className="st-drow-label">Method</span>
                  <span className="st-drow-val">{order.paymentMethod}</span>
                </div>
                <div className="st-drow">
                  <span className="st-drow-label">Status</span>
                  <span className="st-drow-val">
                    {payBadge(order.paymentStatus)}
                  </span>
                </div>
                <div className="st-drow" style={{ paddingBottom: 0 }}>
                  <span className="st-drow-label">Amount</span>
                  <span
                    className="st-drow-val"
                    style={{ fontSize: 14, color: "#6366f1" }}
                  >
                    {fmt(order.totalAmount)}
                  </span>
                </div>
              </div>

              {/* COD warning */}
              {order.paymentMethod === "COD" && (
                <div
                  style={{
                    background: "#fef3c7",
                    border: "1px solid #fde68a",
                    borderRadius: 8,
                    padding: "9px 12px",
                    fontSize: 11,
                    color: "#92400e",
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    marginBottom: 14,
                  }}
                >
                  <i className="fa-solid fa-coins" />
                  COD order — collect <strong>
                    {fmt(order.totalAmount)}
                  </strong>{" "}
                  on delivery.
                </div>
              )}

              {/* ── Delivery Mode Toggle ── */}
              <div className="st-section">Delivery Method</div>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  marginBottom: 14,
                }}
              >
                <button
                  onClick={() => setDeliveryMode("courier")}
                  style={{
                    flex: 1,
                    padding: "8px 10px",
                    borderRadius: 8,
                    border: `2px solid ${deliveryMode === "courier" ? "#6366f1" : "var(--border)"}`,
                    background:
                      deliveryMode === "courier" ? "#eef2ff" : "var(--bg-2)",
                    color:
                      deliveryMode === "courier"
                        ? "#6366f1"
                        : "var(--text-muted)",
                    fontWeight: 700,
                    fontSize: 11,
                    cursor: "pointer",
                    transition: "all .15s",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  <i className="fa-solid fa-truck" />
                  Via Courier
                </button>
                <button
                  onClick={() => setDeliveryMode("rider")}
                  style={{
                    flex: 1,
                    padding: "8px 10px",
                    borderRadius: 8,
                    border: `2px solid ${deliveryMode === "rider" ? "#16a34a" : "var(--border)"}`,
                    background:
                      deliveryMode === "rider" ? "#f0fdf4" : "var(--bg-2)",
                    color:
                      deliveryMode === "rider"
                        ? "#16a34a"
                        : "var(--text-muted)",
                    fontWeight: 700,
                    fontSize: 11,
                    cursor: "pointer",
                    transition: "all .15s",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  <i className="fa-solid fa-person-biking" />
                  Via Rider
                </button>
              </div>

              {/* ── Courier Mode ── */}
              {deliveryMode === "courier" && (
                <div
                  style={{
                    background: "#eef2ff",
                    border: "1px solid #c7d2fe",
                    borderRadius: 9,
                    padding: "12px 14px",
                    fontSize: 12,
                    color: "#4338ca",
                  }}
                >
                  <i
                    className="fa-solid fa-circle-info"
                    style={{ marginRight: 6 }}
                  />
                  Courier <strong>{order.courier?.name ?? "assigned"}</strong>{" "}
                  is handling this delivery. Use <strong>Mark Delivered</strong>{" "}
                  below to confirm delivery.
                </div>
              )}

              {/* ── Rider Mode ── */}
              {deliveryMode === "rider" && (
                <div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--text-muted)",
                      fontWeight: 600,
                      marginBottom: 6,
                    }}
                  >
                    Select Rider *
                  </div>

                  {ridersLoading ? (
                    <div
                      style={{
                        padding: "14px",
                        textAlign: "center",
                        color: "var(--text-muted)",
                        fontSize: 12,
                        background: "var(--bg-2)",
                        borderRadius: 8,
                        border: "1px solid var(--border)",
                      }}
                    >
                      <i
                        className="fa-solid fa-spinner fa-spin"
                        style={{ marginRight: 6 }}
                      />
                      Loading riders…
                    </div>
                  ) : riders.length === 0 ? (
                    <div
                      style={{
                        padding: "14px",
                        textAlign: "center",
                        color: "var(--text-muted)",
                        fontSize: 12,
                        background: "#fef2f2",
                        borderRadius: 8,
                        border: "1px solid #fca5a5",
                      }}
                    >
                      <i
                        className="fa-solid fa-circle-exclamation"
                        style={{ marginRight: 6, color: "#dc2626" }}
                      />
                      No active riders available right now.
                    </div>
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 7,
                        maxHeight: 220,
                        overflowY: "auto",
                        paddingRight: 2,
                      }}
                    >
                      {riders.map((r) => {
                        const isSelected = selectedRiderId === r._id;
                        const statusColor = getStatusColor(r.status);
                        return (
                          <div
                            key={r._id}
                            onClick={() => setSelectedRiderId(r._id)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                              padding: "9px 12px",
                              borderRadius: 9,
                              border: `2px solid ${isSelected ? "#16a34a" : "var(--border)"}`,
                              background: isSelected
                                ? "#f0fdf4"
                                : "var(--bg-2)",
                              cursor: "pointer",
                              transition: "all .15s",
                            }}
                          >
                            {/* Avatar */}
                            <div
                              style={{
                                width: 34,
                                height: 34,
                                borderRadius: "50%",
                                background: isSelected ? "#16a34a" : "#6366f1",
                                color: "#fff",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontWeight: 800,
                                fontSize: 12,
                                flexShrink: 0,
                              }}
                            >
                              {r.fullName
                                .split(" ")
                                .map((w) => w[0])
                                .join("")
                                .slice(0, 2)
                                .toUpperCase()}
                            </div>

                            {/* Info */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div
                                style={{
                                  fontWeight: 700,
                                  fontSize: 12,
                                  color: "var(--text)",
                                }}
                              >
                                {r.fullName}
                              </div>
                              <div
                                style={{
                                  fontSize: 10,
                                  color: "var(--text-muted)",
                                  marginTop: 2,
                                }}
                              >
                                <i
                                  className="fa-solid fa-motorcycle"
                                  style={{ marginRight: 3, fontSize: 9 }}
                                />
                                {r.vehicle?.type ?? "—"} ·{" "}
                                {r.assignedZone ?? "No zone"}
                              </div>
                            </div>

                            {/* Status */}
                            <div style={{ textAlign: "right", flexShrink: 0 }}>
                              <div
                                style={{
                                  fontSize: 10,
                                  fontWeight: 700,
                                  color: statusColor,
                                }}
                              >
                                {getStatusLabel(r)}
                              </div>
                              {isSelected && (
                                <i
                                  className="fa-solid fa-circle-check"
                                  style={{
                                    color: "#16a34a",
                                    fontSize: 14,
                                    marginTop: 3,
                                    display: "block",
                                  }}
                                />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Assign button */}
                  {selectedRiderId && (
                    <button
                      className="st-btn st-btn-green"
                      style={{
                        width: "100%",
                        justifyContent: "center",
                        marginTop: 10,
                      }}
                      onClick={handleAssignRider}
                      disabled={assigningRider}
                    >
                      {assigningRider ? (
                        <>
                          <i className="fa-solid fa-spinner fa-spin" />{" "}
                          Assigning…
                        </>
                      ) : (
                        <>
                          <i className="fa-solid fa-person-biking" /> Assign
                          Rider & Mark Delivered
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="st-panel-footer">
          <button
            className="st-btn st-btn-red"
            style={{ flex: 1, justifyContent: "center" }}
            onClick={handleReturn}
            disabled={loadingReturn || loadingDeliver}
          >
            {loadingReturn ? (
              <>
                <i className="fa-solid fa-spinner fa-spin" /> Processing…
              </>
            ) : (
              <>
                <i className="fa-solid fa-rotate-left" /> Mark Returned
              </>
            )}
          </button>
          <button
            className="st-btn st-btn-green"
            style={{ flex: 1, justifyContent: "center" }}
            onClick={handleDeliver}
            disabled={loadingDeliver || loadingReturn}
          >
            {loadingDeliver ? (
              <>
                <i className="fa-solid fa-spinner fa-spin" /> Marking…
              </>
            ) : (
              <>
                <i className="fa-solid fa-circle-check" /> Mark Delivered
              </>
            )}
          </button>
        </div>
      </div>
    </>
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
        className="st-btn"
        disabled={!p.hasPrev}
        onClick={() => onPage(p.currentPage - 1)}
      >
        ‹ Prev
      </button>
      <button
        className="st-btn"
        disabled={!p.hasNext}
        onClick={() => onPage(p.currentPage + 1)}
      >
        Next ›
      </button>
    </div>
  </div>
);

/* ─── Main Component ─────────────────────────────────────── */
const ShippedTab: React.FC = () => {
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [pagination, setPagination] = useState<ApiPagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<ApiOrder | null>(null);
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
        status: "Shipped",
        page,
        limit: 15,
        search,
      });
      setOrders(res.data?.data?.orders ?? []);
      setPagination(res.data?.data?.pagination ?? null);
    } catch {
      showToast("Failed to load shipped orders.", "error");
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

  const handleMarkDelivered = async (orderId: string) => {
    try {
      await ordersAPI.updateStatus(
        orderId,
        "Delivered",
        "Marked delivered from Shipped tab",
      );
      showToast("Order marked as Delivered!", "success");
      fetchOrders();
    } catch (e: any) {
      showToast(
        e?.response?.data?.message ?? "Failed to update status.",
        "error",
      );
      throw e;
    }
  };

  const handleMarkReturned = async (orderId: string) => {
    try {
      await ordersAPI.updateStatus(
        orderId,
        "Returned",
        "Marked returned from Shipped tab",
      );
      showToast("Order marked as Returned!", "success");
      fetchOrders();
    } catch (e: any) {
      showToast(
        e?.response?.data?.message ?? "Failed to mark as returned.",
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
              className="fa-solid fa-truck-fast"
              style={{ color: "#6366f1", marginRight: 7 }}
            />
            Shipped Orders
          </div>
          <div
            style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}
          >
            Orders in transit — track and mark delivered.
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            className="st-search"
            placeholder="Search order or customer…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <button className="st-btn" onClick={handleSearch}>
            <i className="fa-solid fa-magnifying-glass" />
          </button>
          <button
            className="st-btn"
            onClick={() => {
              setPage(1);
              fetchOrders();
            }}
          >
            <i className="fa-solid fa-rotate-right" /> Refresh
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <TableSkeleton />
      ) : orders.length === 0 ? (
        <EmptyState msg="No shipped orders found." />
      ) : (
        <>
          <div style={{ overflowX: "auto" }}>
            <table className="st-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>City</th>
                  <th>Courier</th>
                  <th>Tracking #</th>
                  <th>Amount</th>
                  <th>Payment</th>
                  <th>Shipped On</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr
                    key={o._id}
                    style={{ cursor: "pointer" }}
                    onClick={() => setSelectedOrder(o)}
                  >
                    <td onClick={(e) => e.stopPropagation()}>
                      <span
                        onClick={() => setSelectedOrder(o)}
                        style={{
                          color: "var(--primary,#6366f1)",
                          fontWeight: 700,
                          cursor: "pointer",
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
                    <td>
                      {o.trackingNumber ? (
                        <code
                          style={{
                            fontSize: 10,
                            background: "var(--bg-2)",
                            padding: "2px 6px",
                            borderRadius: 4,
                          }}
                        >
                          {o.trackingNumber}
                        </code>
                      ) : (
                        <span
                          style={{ color: "var(--text-muted)", fontSize: 10 }}
                        >
                          —
                        </span>
                      )}
                    </td>
                    <td style={{ fontWeight: 700 }}>{fmt(o.totalAmount)}</td>
                    <td>{payBadge(o.paymentStatus)}</td>
                    <td style={{ color: "var(--text-muted)", fontSize: 11 }}>
                      {fmtDate(o.createdAt)}
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="st-action-group">
                        {/* Return button */}
                        <button
                          className="st-btn st-btn-red"
                          style={{ fontSize: 10, padding: "4px 10px" }}
                          onClick={async () => {
                            if (
                              !window.confirm(`Mark ${o.orderId} as Returned?`)
                            )
                              return;
                            await handleMarkReturned(o._id);
                          }}
                        >
                          <i className="fa-solid fa-rotate-left" /> Return
                        </button>
                        {/* Deliver button */}
                        <button
                          className="st-btn st-btn-green"
                          style={{ fontSize: 10, padding: "4px 10px" }}
                          onClick={() => setSelectedOrder(o)}
                        >
                          <i className="fa-solid fa-circle-check" /> Deliver
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pagination && <CPagination p={pagination} onPage={setPage} />}
        </>
      )}

      {/* Side Panel — replaces modal */}
      <OrderSidePanel
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onMarkDelivered={handleMarkDelivered}
        onMarkReturned={handleMarkReturned}
        showToast={showToast}
      />

      {/* Toast */}
      {toast && (
        <div className={`st-toast ${toast.type}`}>
          <i
            className={`fa-solid ${
              toast.type === "success"
                ? "fa-circle-check"
                : "fa-circle-exclamation"
            }`}
          />
          {toast.msg}
        </div>
      )}
    </>
  );
};

export default ShippedTab;
