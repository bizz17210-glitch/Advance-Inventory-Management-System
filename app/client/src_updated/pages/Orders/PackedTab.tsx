// PackedTab.tsx — Packed Orders + Courier Assignment (live API)
import React, { useState, useEffect, useCallback } from "react";
import { ordersAPI, couriersAPI } from "../../services/api";

interface PackedOrder {
  _id: string;
  orderId: string;
  orderStatus: string;
  paymentMethod: string;
  totalAmount: number;
  createdAt: string;
  source: string;
  customer?: { fullName?: string; phone?: string };
  shippingAddress?: { city?: string; street?: string };
  notes?: string;
}

interface Courier {
  _id: string;
  name: string;
  status?: string;
  serviceRegions?: string[];
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  hasNext: boolean;
  hasPrev: boolean;
}

const toastStyles = `
  .tab-toast{position:fixed;bottom:24px;right:24px;z-index:9999;padding:11px 18px;border-radius:8px;font-size:12px;font-weight:600;display:flex;align-items:center;gap:8px;box-shadow:0 4px 20px rgba(0,0,0,.15);animation:toastIn .3s ease}
  .tab-toast.success{background:#dcfce7;color:#16a34a;border:1px solid #86efac}
  .tab-toast.error{background:#fee2e2;color:#dc2626;border:1px solid #fca5a5}
  .tab-toast.info{background:#dbeafe;color:#1d4ed8;border:1px solid #93c5fd}
  @keyframes toastIn{from{transform:translateY(16px);opacity:0}to{transform:translateY(0);opacity:1}}
`;

const fmt = (n: number) => "₨" + Number(n).toLocaleString();
const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-PK", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
const getInitials = (name: string) =>
  (name || "U")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

// ── Assign Courier Drawer ──────────────────────────────────
interface AssignDrawerProps {
  order: PackedOrder | null;
  couriers: Courier[];
  onClose: () => void;
  onAssigned: (
    orderId: string,
    courierId: string,
    notes: string,
  ) => Promise<void>;
}

const AssignDrawer: React.FC<AssignDrawerProps> = ({
  order,
  couriers,
  onClose,
  onAssigned,
}) => {
  const [selectedCourier, setSelectedCourier] = useState("");
  const [codAmount, setCodAmount] = useState("");
  const [weight, setWeight] = useState("");
  const [dispatchDate, setDispatchDate] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (order) {
      setSelectedCourier("");
      setCodAmount("");
      setWeight("");
      setDispatchDate("");
      setNotes("");
      setSaving(false);
    }
  }, [order]);

  if (!order) return null;

  const drawerStyles = `
    .assign-overlay{position:fixed;inset:0;background:rgba(0,0,0,.35);backdrop-filter:blur(2px);z-index:400;opacity:0;pointer-events:none;transition:opacity .3s ease}
    .assign-overlay.open{opacity:1;pointer-events:all}
    .assign-drawer{position:fixed;top:0;right:0;height:100%;width:420px;max-width:95vw;background:var(--card-bg,#fff);box-shadow:-8px 0 40px rgba(0,0,0,.18);z-index:401;display:flex;flex-direction:column;transform:translateX(100%);transition:transform .35s cubic-bezier(.4,0,.2,1)}
    .assign-drawer.open{transform:translateX(0)}
  `;

  return (
    <>
      <style>{drawerStyles}</style>
      <div className="assign-overlay open" onClick={onClose} />
      <div className="assign-drawer open">
        <div className="detail-header">
          <div className="detail-title">
            <i
              className="fa-solid fa-truck-fast"
              style={{ fontSize: 11, marginRight: 6, color: "var(--accent)" }}
            />
            Assign Courier
          </div>
          <button className="detail-close" onClick={onClose}>
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <div
          className="detail-body"
          style={{
            overflowY: "auto",
            flex: 1,
            padding: "12px 16px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {/* Order Summary */}
          <div
            style={{
              background: "var(--bg)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: "10px 12px",
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 700 }}>{order.orderId}</div>
            <div
              style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3 }}
            >
              {order.customer?.fullName ?? "—"} ·{" "}
              {order.shippingAddress?.city ?? "—"} · {fmt(order.totalAmount)}
            </div>
          </div>

          {/* Courier Selection */}
          <div>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "var(--text-muted)",
                marginBottom: 8,
              }}
            >
              Select Courier *
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 8,
              }}
            >
              {couriers
                .filter((c) => c.status !== "Inactive")
                .map((c) => (
                  <div
                    key={c._id}
                    onClick={() => setSelectedCourier(c._id)}
                    style={{
                      border: `2px solid ${selectedCourier === c._id ? "var(--accent)" : "var(--border)"}`,
                      borderRadius: 8,
                      padding: "10px 12px",
                      cursor: "pointer",
                      background:
                        selectedCourier === c._id ? "#FFF5EE" : "var(--card)",
                      transition: "border-color .15s, background .15s",
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 600 }}>
                      {selectedCourier === c._id && (
                        <i
                          className="fa-solid fa-circle-check"
                          style={{ color: "var(--accent)", marginRight: 5 }}
                        />
                      )}
                      {c.name}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: "var(--text-muted)",
                        marginTop: 2,
                      }}
                    >
                      {c.serviceRegions?.slice(0, 2).join(", ") ?? "Nationwide"}
                    </div>
                  </div>
                ))}
            </div>
            {couriers.length === 0 && (
              <div
                style={{
                  fontSize: 11,
                  color: "var(--text-muted)",
                  padding: "8px 0",
                }}
              >
                No couriers available
              </div>
            )}
          </div>

          {/* Details */}
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
          >
            <div>
              <div className="form-label">COD Amount (₨)</div>
              <input
                className="form-input"
                type="number"
                placeholder="e.g. 2500"
                value={codAmount}
                onChange={(e) => setCodAmount(e.target.value)}
              />
            </div>
            <div>
              <div className="form-label">Weight (kg)</div>
              <input
                className="form-input"
                type="number"
                placeholder="e.g. 1.5"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
            </div>
          </div>

          <div>
            <div className="form-label">Dispatch Date</div>
            <input
              className="form-input"
              type="date"
              value={dispatchDate}
              onChange={(e) => setDispatchDate(e.target.value)}
              style={{ width: "100%" }}
            />
          </div>

          <div>
            <div className="form-label">Special Instructions</div>
            <textarea
              className="form-input"
              rows={3}
              placeholder="Handle with care..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{
                resize: "vertical",
                fontFamily: "inherit",
                width: "100%",
              }}
            />
          </div>
        </div>

        <div
          style={{
            padding: "14px 16px",
            borderTop: "1px solid var(--border)",
            display: "flex",
            gap: 8,
            background: "var(--card)",
          }}
        >
          <button
            className="header-btn primary"
            style={{
              flex: 1,
              justifyContent: "center",
              opacity: !selectedCourier || saving ? 0.6 : 1,
            }}
            disabled={!selectedCourier || saving}
            onClick={async () => {
              setSaving(true);
              await onAssigned(order._id, selectedCourier, notes);
              setSaving(false);
            }}
          >
            {saving ? (
              <>
                <i className="fa-solid fa-spinner fa-spin" /> Assigning...
              </>
            ) : (
              <>
                <i className="fa-solid fa-truck" /> Assign & Dispatch
              </>
            )}
          </button>
          <button className="header-btn" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </>
  );
};

// ── Main Component ─────────────────────────────────────────
const PackedTab: React.FC = () => {
  const [orders, setOrders] = useState<PackedOrder[]>([]);
  const [couriers, setCouriers] = useState<Courier[]>([]);
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
  const [assigning, setAssigning] = useState<PackedOrder | null>(null);
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error" | "info";
  } | null>(null);
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
        status: "Packed",
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
      setError(e?.response?.data?.message ?? "Failed to load packed orders.");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);
  useEffect(() => {
    couriersAPI
      .getAll({ limit: 50 })
      .then((r) => setCouriers(r.data?.data?.couriers ?? []))
      .catch(() => {});
  }, []);

  const handleAssign = async (
    orderId: string,
    courierId: string,
    notes: string,
  ) => {
    try {
      await couriersAPI.assignToOrder(courierId, {
        orderId,
        serviceType: "Standard",
        specialInstructions: notes || undefined,
      });
      showToast("Shipment assigned successfully!", "success");
      setAssigning(null);
      fetchOrders();
    } catch (e: any) {
      showToast(
        e?.response?.data?.message ?? "Failed to assign courier.",
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

      <AssignDrawer
        order={assigning}
        couriers={couriers}
        onClose={() => setAssigning(null)}
        onAssigned={handleAssign}
      />

      {/* Stats */}
      <div className="stats-row" style={{ marginBottom: 14 }}>
        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-label">Packed Orders</div>
            <div className="stat-icon" style={{ background: "#FFF5EE" }}>
              <i className="fa-solid fa-box ic-orange" />
            </div>
          </div>
          <div className="stat-value">{loading ? "—" : totalItems}</div>
          <div className="stat-trend up">Ready for dispatch</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-label">Couriers Available</div>
            <div className="stat-icon" style={{ background: "var(--blue-bg)" }}>
              <i
                className="fa-solid fa-truck"
                style={{ color: "var(--blue)" }}
              />
            </div>
          </div>
          <div className="stat-value">
            {couriers.filter((c) => c.status !== "Inactive").length}
          </div>
          <div className="stat-trend neutral">Active couriers</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-label">COD Orders</div>
            <div
              className="stat-icon"
              style={{ background: "var(--yellow-bg)" }}
            >
              <i className="fa-solid fa-money-bill ic-yellow" />
            </div>
          </div>
          <div className="stat-value">
            {loading
              ? "—"
              : orders.filter((o) => o.paymentMethod === "COD").length}
          </div>
          <div className="stat-trend neutral">This page</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-label">Total Value</div>
            <div
              className="stat-icon"
              style={{ background: "var(--green-bg)" }}
            >
              <i className="fa-solid fa-coins ic-green" />
            </div>
          </div>
          <div className="stat-value">
            {loading ? "—" : fmt(orders.reduce((s, o) => s + o.totalAmount, 0))}
          </div>
          <div className="stat-trend up">This page</div>
        </div>
      </div>

      {/* Info Banner */}
      <div
        style={{
          background: "#FFF5EE",
          border: "1px solid #FED7AA",
          borderRadius: 8,
          padding: "10px 14px",
          marginBottom: 14,
          fontSize: 12,
          color: "#C2410C",
          display: "flex",
          gap: 8,
          alignItems: "center",
        }}
      >
        <i className="fa-solid fa-circle-info" />
        <span>
          Orders here are <strong>Packed</strong> and ready for courier
          assignment. Click <strong>"Assign Courier"</strong> to dispatch.
        </span>
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
                className="fa-solid fa-box"
                style={{
                  fontSize: 28,
                  display: "block",
                  marginBottom: 10,
                  opacity: 0.3,
                }}
              />
              No packed orders — confirm and pack orders first
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
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o._id}>
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
                    <td style={{ fontSize: 11 }}>{fmtDate(o.createdAt)}</td>
                    <td>
                      <button
                        className="header-btn primary"
                        style={{ fontSize: 10, height: 26 }}
                        onClick={() => setAssigning(o)}
                      >
                        <i className="fa-solid fa-truck" /> Assign Courier
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

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

export default PackedTab;
