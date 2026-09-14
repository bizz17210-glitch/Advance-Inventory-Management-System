import React, { useState, useCallback, useEffect } from "react";
import NewOrderPanel from "./NewOrderPanel";
import TopLoadingBar from "../../components/ui/TopLoadingBar";
import { usePageLoading } from "../../hooks/usePageLoading";
import { useOrders } from "../../hooks/useOrders";
import { useOrderDetail } from "../../hooks/useOrderDetail";
import {
  mapApiOrderToRow,
  mapApiOrdersToRows,
  computeOrderStats,
} from "../../utils/orderMappers";
import type { OrderRow } from "../../utils/orderMappers";
import PendingTab from "./PendingTab";
import ConfirmedTab from "./ConfirmedTab";
import PackedTab from "./PackedTab";
import ShippedTab from "./ShippedTab";
import DeliveredTab from "./DeliveredTab";
import ReturnsTab from "./ReturnsTab";

// ── Types ──────────────────────────────────────────────────
type OrderTab =
  | "all"
  | "pending"
  | "confirmed"
  | "packed"
  | "shipped"
  | "delivered"
  | "returns"
  | "settings";
type PanelMode = "view" | "edit" | "courier" | "cancel";

// ── Helpers ────────────────────────────────────────────────
function getStatusBadgeClass(status: string): string {
  const map: Record<string, string> = {
    Pending: "yellow",
    Confirmed: "blue",
    Processing: "blue",
    Packed: "blue",
    Shipped: "orange",
    Delivered: "green",
    Cancelled: "red",
    Returned: "red",
  };
  return map[status] || "gray";
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// ── Status Badge ───────────────────────────────────────────
const StatusBadge: React.FC<{ status: string }> = ({ status }) => (
  <span className={`badge ${getStatusBadgeClass(status)}`}>{status}</span>
);

// ── Stat Cards ─────────────────────────────────────────────
interface OrderStatsProps {
  total: number;
  confirmedRate: string;
  codCount: number;
  codPct: string;
  avgValue: string;
  loading: boolean;
}

const OrderStats: React.FC<OrderStatsProps> = ({
  total,
  confirmedRate,
  codCount,
  codPct,
  avgValue,
  loading,
}) => (
  <div className="stats-row" style={{ marginBottom: "14px" }}>
    <div className="stat-card">
      <div className="stat-card-top">
        <div className="stat-label">Total Orders</div>
        <div className="stat-icon" style={{ background: "#FFF5EE" }}>
          <i className="fa-solid fa-bag-shopping ic-orange" />
        </div>
      </div>
      <div className="stat-value">{loading ? "—" : total.toLocaleString()}</div>
      <div className="stat-trend up">
        <i className="fa-solid fa-arrow-trend-up" /> Live from API
      </div>
    </div>
    <div className="stat-card">
      <div className="stat-card-top">
        <div className="stat-label">Confirmed Rate</div>
        <div className="stat-icon" style={{ background: "var(--green-bg)" }}>
          <i className="fa-solid fa-circle-check ic-green" />
        </div>
      </div>
      <div className="stat-value">{loading ? "—" : confirmedRate}</div>
      <div className="stat-trend up">
        <i className="fa-solid fa-arrow-trend-up" /> From current page
      </div>
    </div>
    <div className="stat-card">
      <div className="stat-card-top">
        <div className="stat-label">COD Orders</div>
        <div className="stat-icon" style={{ background: "var(--blue-bg)" }}>
          <i
            className="fa-solid fa-money-bills"
            style={{ color: "var(--blue)" }}
          />
        </div>
      </div>
      <div className="stat-value">{loading ? "—" : codCount}</div>
      <div className="stat-trend neutral">
        <i className="fa-solid fa-minus" /> {loading ? "—" : codPct} of page
      </div>
    </div>
    <div className="stat-card">
      <div className="stat-card-top">
        <div className="stat-label">Avg. Order Value</div>
        <div className="stat-icon" style={{ background: "var(--yellow-bg)" }}>
          <i className="fa-solid fa-coins ic-yellow" />
        </div>
      </div>
      <div className="stat-value">{loading ? "—" : avgValue}</div>
      <div className="stat-trend up">
        <i className="fa-solid fa-arrow-trend-up" /> Current page avg
      </div>
    </div>
  </div>
);

// ── Order Detail / Edit Panel ──────────────────────────────
const ORDER_STATUSES = [
  "Pending",
  "Confirmed",
  "Processing",
  "Packed",
  "Shipped",
  "Delivered",
  "Cancelled",
];
const MOCK_COURIERS = ["TCS", "Leopards", "M&P", "Trax", "PostEx", "BlueEx"];

interface OrderPanelProps {
  order: OrderRow | null;
  mode: PanelMode;
  onClose: () => void;
  onModeChange: (m: PanelMode) => void;
  onStatusChange: (id: string, status: string, notes?: string) => Promise<void>;
  onCancel: (id: string, reason: string) => Promise<void>;
}

const OrderPanel: React.FC<OrderPanelProps> = ({
  order,
  mode,
  onClose,
  onModeChange,
  onStatusChange,
  onCancel,
}) => {
  const {
    order: detail,
    loading: detailLoading,
    fetchOrder,
  } = useOrderDetail();

  const [editStatus, setEditStatus] = useState("");
  const [editPayment, setEditPayment] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [courier, setCourier] = useState("TCS");
  const [tracking, setTracking] = useState("");
  const [expectedDate, setExpectedDate] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [saving, setSaving] = useState(false);

  // Fetch full detail when panel opens in view mode
  useEffect(() => {
    if (order && mode === "view") {
      fetchOrder(order._id);
    }
  }, [order, mode, fetchOrder]);

  useEffect(() => {
    if (order) {
      setEditStatus(order.status);
      setEditPayment(order.payment);
      setEditAddress(order.address ?? "House 12, Street 4, DHA Phase 5");
      setEditNotes(order.notes ?? "");
      setTracking(order.trackingNumber ?? "");
      setCourier(order.courierName ?? "TCS");
      setExpectedDate("");
      setCancelReason("");
      setSaving(false);
    }
  }, [order, mode]);

  if (!order) return null;
  const isOpen = !!order;

  // Use full detail items if available, else show minimal info
  const detailItems = detail?.items ?? [];

  /* ── VIEW mode ── */
  const renderView = () => (
    <>
      <div
        style={{
          background: "var(--bg)",
          borderRadius: "var(--radius-card)",
          border: "1px solid var(--border)",
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
            <div style={{ fontSize: 16, fontWeight: 800 }}>{order.id}</div>
            <div
              style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}
            >
              {order.date}
            </div>
          </div>
          <StatusBadge status={order.status} />
        </div>
      </div>

      {/* Customer */}
      <div className="section-divider" style={{ marginTop: 0 }}>
        <span>Customer</span>
      </div>
      <div className="detail-row">
        <div className="detail-key">Name</div>
        <div className="detail-val">
          <strong>{order.customer}</strong>
        </div>
      </div>
      <div className="detail-row">
        <div className="detail-key">Phone</div>
        <div className="detail-val">{order.phone}</div>
      </div>
      <div className="detail-row">
        <div className="detail-key">Address</div>
        <div className="detail-val">
          {detailLoading
            ? "..."
            : detail?.shippingAddress
              ? [
                  detail.shippingAddress.street,
                  detail.shippingAddress.city,
                  detail.shippingAddress.country,
                ]
                  .filter(Boolean)
                  .join(", ")
              : (order.address ?? "—")}
        </div>
      </div>
      <div className="detail-row">
        <div className="detail-key">Channel</div>
        <div className="detail-val">
          <span className="tag">{order.channel}</span>
        </div>
      </div>

      {/* Items */}
      <div className="section-divider">
        <span>
          Order Items {detailLoading ? "" : `(${detailItems.length})`}
        </span>
      </div>
      {detailLoading ? (
        <div
          style={{
            padding: "12px 0",
            color: "var(--text-muted)",
            fontSize: 12,
          }}
        >
          Loading items...
        </div>
      ) : detailItems.length > 0 ? (
        detailItems.map((item, i) => (
          <div
            key={item._id ?? i}
            className="list-item"
            style={{ padding: "6px 0" }}
          >
            <div className="list-icon" style={{ background: "#FFF5EE" }}>
              <i
                className="fa-solid fa-bag-shopping ic-orange"
                style={{ fontSize: 11 }}
              />
            </div>
            <div className="list-content">
              <div className="list-title">{item.name}</div>
              <div className="list-meta">
                {item.sku} · Qty: {item.quantity}
              </div>
            </div>
            <div className="list-right">
              <strong>
                ₨{(item.quantity * item.unitPrice).toLocaleString()}
              </strong>
            </div>
          </div>
        ))
      ) : (
        <div
          style={{ color: "var(--text-muted)", fontSize: 12, padding: "8px 0" }}
        >
          {order.items} item(s) — open detail to load
        </div>
      )}

      {/* Payment */}
      <div className="section-divider">
        <span>Payment & Delivery</span>
      </div>
      <div className="detail-row">
        <div className="detail-key">Payment</div>
        <div className="detail-val">
          <span
            className="tag"
            style={{
              color: order.payment === "Prepaid" ? "var(--green)" : "inherit",
            }}
          >
            <i
              className={`fa-solid ${order.payment === "COD" ? "fa-money-bill" : "fa-credit-card"}`}
              style={{ fontSize: 9 }}
            />{" "}
            {order.payment}
          </span>
        </div>
      </div>
      <div className="detail-row">
        <div className="detail-key">Total Value</div>
        <div className="detail-val">
          <strong style={{ color: "var(--accent)", fontSize: 14 }}>
            {order.value}
          </strong>
        </div>
      </div>
      {detail && (
        <div className="detail-row">
          <div className="detail-key">Shipping Fee</div>
          <div className="detail-val">
            ₨{(detail.shippingCost ?? 0).toLocaleString()}
          </div>
        </div>
      )}
      {detail && (
        <div className="detail-row">
          <div className="detail-key">Discount</div>
          <div className="detail-val">
            ₨{(detail.discount ?? 0).toLocaleString()}
          </div>
        </div>
      )}
      <div className="detail-row">
        <div className="detail-key">Courier</div>
        <div className="detail-val">
          {order.courierName ??
            (detailLoading ? "..." : (detail?.courier?.name ?? "Not assigned"))}
        </div>
      </div>
      <div className="detail-row">
        <div className="detail-key">Tracking No.</div>
        <div
          className="detail-val"
          style={{
            color: order.trackingNumber ? "inherit" : "var(--text-muted)",
          }}
        >
          {order.trackingNumber ??
            (detailLoading
              ? "..."
              : (detail?.trackingNumber ?? "Not assigned yet"))}
        </div>
      </div>
      {detail?.notes && (
        <div className="detail-row">
          <div className="detail-key">Notes</div>
          <div className="detail-val">{detail.notes}</div>
        </div>
      )}

      <hr />
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button
          className="header-btn primary"
          onClick={() => onModeChange("edit")}
        >
          <i className="fa-solid fa-pen" /> Edit Order
        </button>
        <button className="header-btn" onClick={() => onModeChange("courier")}>
          <i className="fa-solid fa-truck" /> Assign Courier
        </button>
        {order.status !== "Delivered" && order.status !== "Cancelled" && (
          <button
            className="header-btn"
            style={{ color: "var(--green)", borderColor: "var(--green)" }}
            onClick={async () => {
              await onStatusChange(order._id, "Delivered");
              onClose();
            }}
          >
            <i className="fa-solid fa-circle-check" /> Mark Delivered
          </button>
        )}
        {order.status !== "Cancelled" && order.status !== "Delivered" && (
          <button
            className="header-btn"
            style={{ color: "var(--red)", borderColor: "var(--red)" }}
            onClick={() => onModeChange("cancel")}
          >
            <i className="fa-solid fa-xmark" /> Cancel Order
          </button>
        )}
      </div>
    </>
  );

  /* ── EDIT mode ── */
  const renderEdit = () => (
    <>
      <div className="section-divider" style={{ marginTop: 0 }}>
        <span>Edit Order — {order.id}</span>
      </div>

      <div className="form-group" style={{ marginBottom: 10 }}>
        <div className="form-label">Customer Name</div>
        <input
          className="form-input"
          style={{ width: "100%" }}
          defaultValue={order.customer}
          disabled
        />
      </div>
      <div className="form-row">
        <div className="form-group">
          <div className="form-label">Phone</div>
          <input className="form-input" defaultValue={order.phone} disabled />
        </div>
        <div className="form-group">
          <div className="form-label">Channel</div>
          <select className="form-select" defaultValue={order.channel} disabled>
            <option>WhatsApp</option>
            <option>Shopify</option>
            <option>Manual</option>
            <option>Instagram</option>
            <option>Website</option>
          </select>
        </div>
      </div>

      <div className="form-group" style={{ marginBottom: 10 }}>
        <div className="form-label">Delivery Address</div>
        <textarea
          className="form-input"
          style={{
            height: 60,
            width: "100%",
            resize: "vertical",
            paddingTop: 6,
          }}
          value={editAddress}
          onChange={(e) => setEditAddress(e.target.value)}
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <div className="form-label">Order Status</div>
          <select
            className="form-select"
            value={editStatus}
            onChange={(e) => setEditStatus(e.target.value)}
          >
            {ORDER_STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <div className="form-label">Payment Type</div>
          <select
            className="form-select"
            value={editPayment}
            onChange={(e) => setEditPayment(e.target.value)}
          >
            <option>COD</option>
            <option>Prepaid</option>
            <option>Card</option>
            <option>BankTransfer</option>
            <option>Wallet</option>
          </select>
        </div>
      </div>

      <div className="form-group" style={{ marginBottom: 10 }}>
        <div className="form-label">Order Notes</div>
        <input
          className="form-input"
          style={{ width: "100%" }}
          value={editNotes}
          onChange={(e) => setEditNotes(e.target.value)}
          placeholder="Any special instructions..."
        />
      </div>

      <hr />
      <div style={{ display: "flex", gap: 8 }}>
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
            await onStatusChange(order._id, editStatus, editNotes || undefined);
            setSaving(false);
            onClose();
          }}
        >
          {saving ? (
            <>
              <i className="fa-solid fa-spinner fa-spin" /> Saving...
            </>
          ) : (
            <>
              <i className="fa-solid fa-check" /> Save Changes
            </>
          )}
        </button>
        <button className="header-btn" onClick={() => onModeChange("view")}>
          Back
        </button>
      </div>
    </>
  );

  /* ── COURIER mode ── */
  const renderCourier = () => (
    <>
      <div className="section-divider" style={{ marginTop: 0 }}>
        <span>Assign Courier — {order.id}</span>
      </div>

      <div
        style={{
          background: "var(--bg)",
          borderRadius: "var(--radius-card)",
          border: "1px solid var(--border)",
          padding: "10px 12px",
          marginBottom: 12,
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 600 }}>{order.customer}</div>
        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
          {order.items} items · {order.value}
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <div className="form-label">Courier Service *</div>
          <select
            className="form-select"
            value={courier}
            onChange={(e) => setCourier(e.target.value)}
          >
            {MOCK_COURIERS.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <div className="form-label">Expected Delivery</div>
          <input
            className="form-input"
            type="date"
            value={expectedDate}
            onChange={(e) => setExpectedDate(e.target.value)}
          />
        </div>
      </div>

      <div className="form-group" style={{ marginBottom: 10 }}>
        <div className="form-label">Tracking Number</div>
        <input
          className="form-input"
          style={{ width: "100%" }}
          value={tracking}
          onChange={(e) => setTracking(e.target.value)}
          placeholder="e.g. TCS-00123456789"
        />
      </div>

      <div className="form-group" style={{ marginBottom: 10 }}>
        <div className="form-label">Pickup Address</div>
        <input
          className="form-input"
          style={{ width: "100%" }}
          defaultValue="Shop 4, Main Market, Lahore"
        />
      </div>

      <div className="form-group" style={{ marginBottom: 0 }}>
        <div className="form-label">Courier Notes</div>
        <input
          className="form-input"
          style={{ width: "100%" }}
          placeholder="Handle with care, fragile items..."
        />
      </div>

      <hr />
      <div style={{ display: "flex", gap: 8 }}>
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
            // Mark as Shipped via status update (fulfill endpoint needs real courier ID)
            await onStatusChange(
              order._id,
              "Shipped",
              `Courier: ${courier}${tracking ? `, Tracking: ${tracking}` : ""}`,
            );
            setSaving(false);
            onClose();
          }}
        >
          {saving ? (
            <>
              <i className="fa-solid fa-spinner fa-spin" /> Saving...
            </>
          ) : (
            <>
              <i className="fa-solid fa-truck" /> Assign & Mark Shipped
            </>
          )}
        </button>
        <button className="header-btn" onClick={() => onModeChange("view")}>
          Back
        </button>
      </div>
    </>
  );

  /* ── CANCEL mode ── */
  const renderCancel = () => (
    <>
      <div
        style={{
          background: "var(--red-bg, #FEF2F2)",
          borderRadius: "var(--radius-card)",
          border: "1px solid var(--red, #EF4444)",
          padding: "14px",
          marginBottom: 14,
          display: "flex",
          gap: 10,
          alignItems: "flex-start",
        }}
      >
        <i
          className="fa-solid fa-triangle-exclamation"
          style={{ color: "var(--red)", fontSize: 18, marginTop: 2 }}
        />
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--red)" }}>
            Cancel Order {order.id}?
          </div>
          <div
            style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}
          >
            This action cannot be undone. The backend will restore stock
            automatically.
          </div>
        </div>
      </div>

      <div
        style={{
          background: "var(--bg)",
          borderRadius: "var(--radius-card)",
          border: "1px solid var(--border)",
          padding: "10px 12px",
          marginBottom: 12,
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 600 }}>{order.customer}</div>
        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
          {order.items} items · {order.value} · {order.payment}
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

      <div className="form-group" style={{ marginBottom: 0 }}>
        <div className="form-label">Additional Notes</div>
        <textarea
          className="form-input"
          style={{
            height: 64,
            width: "100%",
            resize: "vertical",
            paddingTop: 6,
          }}
          placeholder="Any additional context..."
        />
      </div>

      <hr />
      <div style={{ display: "flex", gap: 8 }}>
        <button
          className="header-btn"
          style={{
            flex: 1,
            justifyContent: "center",
            background:
              cancelReason && !saving ? "var(--red)" : "var(--border)",
            color: cancelReason && !saving ? "#fff" : "var(--text-muted)",
            borderColor:
              cancelReason && !saving ? "var(--red)" : "var(--border)",
            cursor: cancelReason && !saving ? "pointer" : "not-allowed",
          }}
          disabled={!cancelReason || saving}
          onClick={async () => {
            if (!cancelReason) return;
            setSaving(true);
            await onCancel(order._id, cancelReason);
            setSaving(false);
            onClose();
          }}
        >
          {saving ? (
            <>
              <i className="fa-solid fa-spinner fa-spin" /> Cancelling...
            </>
          ) : (
            <>
              <i className="fa-solid fa-xmark" /> Confirm Cancellation
            </>
          )}
        </button>
        <button className="header-btn" onClick={() => onModeChange("view")}>
          Back
        </button>
      </div>
    </>
  );

  const titles: Record<PanelMode, string> = {
    view: "Order Details",
    edit: "Edit Order",
    courier: "Assign Courier",
    cancel: "Cancel Order",
  };

  return (
    <>
      <div
        className={`prod-backdrop ${isOpen ? "open" : ""}`}
        onClick={onClose}
      />
      <div className={`prod-detail-panel ${isOpen ? "open" : ""}`}>
        <div className="detail-header">
          <div className="detail-title">
            {mode === "cancel" && (
              <i
                className="fa-solid fa-xmark"
                style={{ color: "var(--red)", marginRight: 6, fontSize: 12 }}
              />
            )}
            {mode === "courier" && (
              <i
                className="fa-solid fa-truck"
                style={{ marginRight: 6, fontSize: 12 }}
              />
            )}
            {mode === "edit" && (
              <i
                className="fa-solid fa-pen"
                style={{ marginRight: 6, fontSize: 12 }}
              />
            )}
            {mode === "view" && (
              <i
                className="fa-solid fa-eye"
                style={{ marginRight: 6, fontSize: 12 }}
              />
            )}
            {titles[mode]}
          </div>
          <button className="detail-close" onClick={onClose}>
            <i className="fa-solid fa-xmark" />
          </button>
        </div>
        <div
          className="detail-body"
          style={{ overflowY: "auto", flex: 1, padding: "12px 16px" }}
        >
          {mode === "view" && renderView()}
          {mode === "edit" && renderEdit()}
          {mode === "courier" && renderCourier()}
          {mode === "cancel" && renderCancel()}
        </div>
      </div>
    </>
  );
};

// ── Three Dot Menu ─────────────────────────────────────────
interface ThreeDotMenuProps {
  orderId: string;
  onAction: (action: string) => void;
}

const ThreeDotMenu: React.FC<ThreeDotMenuProps> = ({ orderId, onAction }) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const el = document.getElementById(`menu-${orderId}`);
      if (el && !el.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [orderId]);

  return (
    <div
      id={`menu-${orderId}`}
      className="three-dot"
      style={{ position: "relative", display: "inline-block" }}
    >
      <button
        className="three-dot-btn"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        <i className="fa-solid fa-ellipsis" />
      </button>
      {open && (
        <div className="three-dot-menu" style={{ display: "block" }}>
          <div
            className="three-dot-menu-item"
            onClick={() => {
              onAction("view");
              setOpen(false);
            }}
          >
            <i className="fa-solid fa-eye" /> View Details
          </div>
          <div
            className="three-dot-menu-item"
            onClick={() => {
              onAction("edit");
              setOpen(false);
            }}
          >
            <i className="fa-solid fa-pen" /> Edit Order
          </div>
          <div
            className="three-dot-menu-item"
            onClick={() => {
              onAction("courier");
              setOpen(false);
            }}
          >
            <i className="fa-solid fa-truck" /> Assign Courier
          </div>
          <div
            className="three-dot-menu-item"
            onClick={() => {
              onAction("deliver");
              setOpen(false);
            }}
          >
            <i className="fa-solid fa-circle-check" /> Mark Delivered
          </div>
          <div className="three-dot-menu-divider" />
          <div
            className="three-dot-menu-item danger"
            onClick={() => {
              onAction("cancel");
              setOpen(false);
            }}
          >
            <i className="fa-solid fa-xmark" /> Cancel Order
          </div>
        </div>
      )}
    </div>
  );
};

// ── Tab Shimmer ─────────────────────────────────────────────
const TabShimmer: React.FC = () => (
  <div className="page-shimmer">
    <div className="shimmer-stats">
      <div className="shimmer-stat" />
      <div className="shimmer-stat" />
      <div className="shimmer-stat" />
      <div className="shimmer-stat" />
    </div>
    <div className="shimmer-card">
      {[1, 2, 3, 4, 5, 6, 7].map((i) => (
        <div
          key={i}
          className={`shimmer-row ${i % 3 === 0 ? "short" : i % 2 === 0 ? "medium" : ""}`}
        />
      ))}
    </div>
  </div>
);

// ── Error Banner ───────────────────────────────────────────
const ErrorBanner: React.FC<{ message: string; onRetry: () => void }> = ({
  message,
  onRetry,
}) => (
  <div
    style={{
      background: "#FEF2F2",
      border: "1px solid var(--red)",
      borderRadius: "var(--radius-card)",
      padding: "12px 16px",
      marginBottom: 12,
      display: "flex",
      alignItems: "center",
      gap: 10,
    }}
  >
    <i
      className="fa-solid fa-triangle-exclamation"
      style={{ color: "var(--red)" }}
    />
    <span style={{ flex: 1, fontSize: 12, color: "var(--red)" }}>
      {message}
    </span>
    <button className="header-btn" onClick={onRetry} style={{ fontSize: 11 }}>
      <i className="fa-solid fa-rotate-right" /> Retry
    </button>
  </div>
);

// ═══════════════════════════════════════════════════════════
// ALL ORDERS TAB — wired to real API
// ═══════════════════════════════════════════════════════════
const AllOrdersTab: React.FC = () => {
  const [search, setSearch] = useState("");
  const [newOrderOpen, setNewOrderOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Panel state
  const [selectedOrder, setSelectedOrder] = useState<OrderRow | null>(null);
  const [panelMode, setPanelMode] = useState<PanelMode>("view");

  // Loading bar for panel open
  const { isLoading, loadingProgress, startLoading } = usePageLoading();

  // ── Real API ──────────────────────────────────────────────
  const {
    orders: apiOrders,
    pagination,
    loading,
    error,
    refresh,
    updateStatus,
    cancelOrder,
  } = useOrders({ page: currentPage, limit: 15 });

  // Map API orders → UI rows
  const allRows = mapApiOrdersToRows(apiOrders);

  // Client-side search filter
  const filtered = search.trim()
    ? allRows.filter(
        (o) =>
          o.id.toLowerCase().includes(search.toLowerCase()) ||
          o.customer.toLowerCase().includes(search.toLowerCase()) ||
          o.phone.includes(search),
      )
    : allRows;

  // Compute stats from current page
  const stats = computeOrderStats(apiOrders);

  // ── Open panel ────────────────────────────────────────────
  const openPanel = useCallback(
    (order: OrderRow, mode: PanelMode) => {
      startLoading(() => {
        setSelectedOrder(order);
        setPanelMode(mode);
      }, 300);
    },
    [startLoading],
  );

  const handleAction = useCallback(
    (action: string, orderId: string) => {
      const order = filtered.find((o) => o._id === orderId || o.id === orderId);
      if (!order) return;
      if (action === "view") openPanel(order, "view");
      if (action === "edit") openPanel(order, "edit");
      if (action === "courier") openPanel(order, "courier");
      if (action === "cancel") openPanel(order, "cancel");
      if (action === "deliver") {
        startLoading(async () => {
          await updateStatus(order._id, "Delivered");
        }, 300);
      }
    },
    [filtered, openPanel, startLoading, updateStatus],
  );

  // ── Panel callbacks ───────────────────────────────────────
  const handleStatusChange = useCallback(
    async (id: string, status: string, notes?: string) => {
      await updateStatus(id, status, notes);
      // Optimistic update already done in hook; also sync selected order badge
      setSelectedOrder((prev) =>
        prev && prev._id === id ? { ...prev, status } : prev,
      );
    },
    [updateStatus],
  );

  const handleCancel = useCallback(
    async (id: string, reason: string) => {
      await cancelOrder(id, reason);
      setSelectedOrder(null);
    },
    [cancelOrder],
  );

  // ── New order created ─────────────────────────────────────
  const handleNewOrderClose = useCallback(() => {
    setNewOrderOpen(false);
    refresh(); // re-fetch to include the new order
  }, [refresh]);

  return (
    <>
      <TopLoadingBar progress={loadingProgress} isLoading={isLoading} />

      {/* Stats — live from API */}
      <OrderStats
        total={pagination?.totalItems ?? stats.total}
        confirmedRate={stats.confirmedRate}
        codCount={stats.codCount}
        codPct={stats.codPct}
        avgValue={stats.avgValue}
        loading={loading}
      />

      {error && <ErrorBanner message={error} onRetry={refresh} />}

      <div className="card">
        {/* Toolbar */}
        <div className="table-toolbar">
          <div className="table-toolbar-left">
            <div className="table-search">
              <i className="fa-solid fa-magnifying-glass" />
              <input
                type="text"
                placeholder="Search order ID, customer, phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button className="t-filter-btn active">
              <i className="fa-solid fa-filter" /> All Status
            </button>
            <button className="t-filter-btn">
              <i className="fa-solid fa-calendar" /> Date Range
            </button>
            <button className="t-filter-btn">
              <i className="fa-solid fa-money-bill" /> Payment
            </button>
          </div>
          <div className="table-toolbar-right">
            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
              {loading ? "Loading..." : `${filtered.length} records`}
            </span>
            <button className="t-filter-btn" onClick={refresh}>
              <i className="fa-solid fa-rotate-right" /> Refresh
            </button>
            <button className="t-filter-btn">
              <i className="fa-solid fa-file-export" /> Export
            </button>
            <button
              className="header-btn primary"
              onClick={() => setNewOrderOpen(true)}
            >
              <i className="fa-solid fa-plus" /> New Order
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="table-wrap">
          {loading ? (
            <div
              style={{
                padding: "32px",
                textAlign: "center",
                color: "var(--text-muted)",
                fontSize: 13,
              }}
            >
              <i
                className="fa-solid fa-spinner fa-spin"
                style={{ marginRight: 8 }}
              />
              Loading orders...
            </div>
          ) : filtered.length === 0 ? (
            <div
              style={{
                padding: "48px",
                textAlign: "center",
                color: "var(--text-muted)",
                fontSize: 13,
              }}
            >
              <i
                className="fa-solid fa-bag-shopping"
                style={{
                  fontSize: 28,
                  display: "block",
                  marginBottom: 10,
                  opacity: 0.3,
                }}
              />
              {search ? `No orders matching "${search}"` : "No orders found"}
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>
                    <input type="checkbox" style={{ cursor: "pointer" }} />
                  </th>
                  <th className="sortable sorted">
                    Order ID <i className="fa-solid fa-sort-down sort-icon" />
                  </th>
                  <th className="sortable">Customer</th>
                  <th className="sortable">Items</th>
                  <th className="sortable">
                    Value <i className="fa-solid fa-sort sort-icon" />
                  </th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th className="sortable">Channel</th>
                  <th className="sortable">
                    Date <i className="fa-solid fa-sort sort-icon" />
                  </th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => (
                  <tr
                    key={o._id}
                    style={{ cursor: "pointer" }}
                    onClick={() => openPanel(o, "view")}
                  >
                    <td onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" />
                    </td>
                    <td>
                      <strong>{o.id}</strong>
                    </td>
                    <td>
                      <div className="td-flex">
                        <div className="row-avatar">
                          {getInitials(o.customer)}
                        </div>
                        <div>
                          <div>{o.customer}</div>
                          <div className="td-sub">{o.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td>{o.items} items</td>
                    <td>
                      <strong>{o.value}</strong>
                    </td>
                    <td>
                      <StatusBadge status={o.status} />
                    </td>
                    <td>
                      {o.payment === "COD" ? (
                        <span className="tag">
                          <i
                            className="fa-solid fa-money-bill"
                            style={{ fontSize: "9px" }}
                          />{" "}
                          COD
                        </span>
                      ) : (
                        <span className="tag" style={{ color: "var(--green)" }}>
                          <i
                            className="fa-solid fa-credit-card"
                            style={{ fontSize: "9px" }}
                          />{" "}
                          Prepaid
                        </span>
                      )}
                    </td>
                    <td>
                      <span className="tag">{o.channel}</span>
                    </td>
                    <td>{o.date}</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <ThreeDotMenu
                        orderId={o._id}
                        onAction={(action) => handleAction(action, o._id)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {pagination && (
          <div className="pagination">
            <div className="pagination-info">
              Showing{" "}
              <strong>
                {(currentPage - 1) * 15 + 1}–
                {Math.min(currentPage * 15, pagination.totalItems)}
              </strong>{" "}
              of <strong>{pagination.totalItems}</strong> orders
            </div>
            <div className="pagination-controls">
              <button
                className="page-btn"
                disabled={!pagination.hasPrev}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                <i
                  className="fa-solid fa-chevron-left"
                  style={{ fontSize: "9px" }}
                />
              </button>
              {Array.from(
                { length: Math.min(5, pagination.totalPages) },
                (_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      className={`page-btn ${page === currentPage ? "active" : ""}`}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  );
                },
              )}
              {pagination.totalPages > 5 && (
                <>
                  <button className="page-btn dots">…</button>
                  <button
                    className="page-btn"
                    onClick={() => setCurrentPage(pagination.totalPages)}
                  >
                    {pagination.totalPages}
                  </button>
                </>
              )}
              <button
                className="page-btn"
                disabled={!pagination.hasNext}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                <i
                  className="fa-solid fa-chevron-right"
                  style={{ fontSize: "9px" }}
                />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* New Order Panel */}
      <NewOrderPanel isOpen={newOrderOpen} onClose={handleNewOrderClose} />

      {/* Order Detail / Edit Panel */}
      <OrderPanel
        order={selectedOrder}
        mode={panelMode}
        onClose={() => setSelectedOrder(null)}
        onModeChange={setPanelMode}
        onStatusChange={handleStatusChange}
        onCancel={handleCancel}
      />
    </>
  );
};

// ── Placeholder tab ────────────────────────────────────────
const PlaceholderTab: React.FC<{
  icon: string;
  title: string;
  desc: string;
}> = ({ icon, title, desc }) => (
  <div className="card">
    <div className="card-body">
      <div className="empty-state">
        <i className={`fa-solid ${icon}`} />
        <h4>{title}</h4>
        <p>{desc}</p>
      </div>
    </div>
  </div>
);

// ── Settings Tab ───────────────────────────────────────────
const SettingsTab: React.FC = () => (
  <div className="card">
    <div className="card-header">
      <div className="card-title">
        <i className="fa-solid fa-gear" /> Order Module Settings
      </div>
    </div>
    <div className="card-body">
      <div className="section-divider">
        <span>Order Statuses</span>
      </div>
      <div className="form-row">
        <div className="form-group">
          <div className="form-label">Default New Order Status</div>
          <select className="form-select">
            <option>Pending</option>
            <option>Confirmed</option>
          </select>
        </div>
        <div className="form-group">
          <div className="form-label">Auto-confirm after (hours)</div>
          <input className="form-input" type="number" defaultValue={24} />
        </div>
      </div>
      <div className="section-divider">
        <span>Payment</span>
      </div>
      <div className="form-row">
        <div className="form-group">
          <div className="form-label">Default Payment Type</div>
          <select className="form-select">
            <option>COD</option>
            <option>Prepaid</option>
          </select>
        </div>
        <div className="form-group">
          <div className="form-label">COD Collection Reminder</div>
          <select className="form-select">
            <option>On Delivery</option>
            <option>After Delivery</option>
          </select>
        </div>
      </div>
      <div className="section-divider">
        <span>Notifications</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "12px",
            cursor: "pointer",
          }}
        >
          <input type="checkbox" defaultChecked /> Send confirmation
          notification to Sales Op
        </label>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "12px",
            cursor: "pointer",
          }}
        >
          <input type="checkbox" defaultChecked /> Alert manager on order
          cancellation
        </label>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "12px",
            cursor: "pointer",
          }}
        >
          <input type="checkbox" /> Enable Shopify sync (Advanced)
        </label>
      </div>
      <hr />
      <div style={{ display: "flex", gap: "8px" }}>
        <button className="header-btn primary">Save Settings</button>
        <button className="header-btn">Cancel</button>
      </div>
    </div>
  </div>
);

// ── Main Component ─────────────────────────────────────────
const OrdersPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<OrderTab>("all");
  const [showShimmer, setShowShimmer] = useState(false);

  const { isLoading, loadingProgress, startLoading } = usePageLoading();

  const handleTabSwitch = (tabId: OrderTab) => {
    if (tabId === activeTab) return;
    startLoading(() => {
      setActiveTab(tabId);
      setShowShimmer(false);
    });
    setShowShimmer(true);
  };

  const tabs: { id: OrderTab; icon: string; label: string; badge?: number }[] =
    [
      { id: "all", icon: "fa-list-check", label: "All Orders" },
      { id: "pending", icon: "fa-clock", label: "Pending" },
      { id: "confirmed", icon: "fa-check", label: "Confirmed" },
      { id: "packed", icon: "fa-box", label: "Packed" },
      { id: "shipped", icon: "fa-truck", label: "Shipped" },
      { id: "delivered", icon: "fa-circle-check", label: "Delivered" },
      { id: "returns", icon: "fa-rotate-left", label: "Returns" },
      { id: "settings", icon: "fa-gear", label: "Settings" },
    ];

  return (
    <div id="page-orders">
      <TopLoadingBar progress={loadingProgress} isLoading={isLoading} />

      <div className="section-heading">Order Management</div>
      <div className="section-subheading">
        Manage, track, and update all customer orders across channels.
      </div>

      <div className="h-tabs">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`h-tab ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => handleTabSwitch(tab.id)}
          >
            <i className={`fa-solid ${tab.icon}`} /> {tab.label}
            {tab.badge && (
              <span className="badge orange" style={{ marginLeft: "4px" }}>
                {tab.badge}
              </span>
            )}
          </div>
        ))}
      </div>

      {showShimmer ? (
        <TabShimmer />
      ) : (
        <>
          {activeTab === "all" && <AllOrdersTab />}
          {activeTab === "pending" && <PendingTab />}
          {activeTab === "confirmed" && <ConfirmedTab />}
          {activeTab === "packed" && <PackedTab />}
          {activeTab === "shipped" && <ShippedTab />}
          {activeTab === "delivered" && <DeliveredTab />}
          {activeTab === "returns" && <ReturnsTab />}
          {activeTab === "settings" && <SettingsTab />}
        </>
      )}
    </div>
  );
};

export default OrdersPage;
