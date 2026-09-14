// ShipmentsPanel.tsx — dynamic
import React, { useState, useEffect, useCallback } from "react";
import {
  ApiShipment,
  ApiCourier,
  ApiPagination,
  fmt,
  statusLabel,
  badgeClass,
  Badge,
  CPagination,
  EmptyState,
  TableSkeleton,
} from "./shared";
import { shipmentsAPI, couriersAPI } from "../../services/api";
import CitySearchInput from "../../components/shared/CitySearchInput";
import citiesData from "../../assets/data/all_cities/allCitiesNested.lite.json";

/* ─── Drawer styles ─────────────────────────────────────────────────── */
const drawerStyles = `
  .drawer-overlay{position:fixed;inset:0;background:rgba(0,0,0,.35);backdrop-filter:blur(2px);z-index:400;opacity:0;pointer-events:none;transition:opacity .3s ease}
  .drawer-overlay.open{opacity:1;pointer-events:all}
  .drawer{position:fixed;top:0;right:0;height:100%;width:420px;max-width:95vw;background:var(--card-bg,#fff);box-shadow:-8px 0 40px rgba(0,0,0,.18);z-index:401;display:flex;flex-direction:column;transform:translateX(100%);transition:transform .35s cubic-bezier(.4,0,.2,1);overflow:hidden}
  .drawer.open{transform:translateX(0)}
  .drawer-header{display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid var(--border-color,#e5e7eb);flex-shrink:0}
  .drawer-header-title{font-size:13.5px;font-weight:600;color:var(--text-main,#111);display:flex;align-items:center;gap:8px}
  .drawer-close{border:none;background:none;cursor:pointer;color:var(--text-muted,#888);font-size:14px;padding:4px 6px;border-radius:4px;transition:background .15s}
  .drawer-close:hover{background:var(--hover-bg,#f3f4f6);color:var(--text-main,#111)}
  .drawer-body{flex:1;overflow-y:auto;padding:20px;display:flex;flex-direction:column;gap:14px}
  .drawer-footer{padding:14px 20px;border-top:1px solid var(--border-color,#e5e7eb);display:flex;gap:8px;flex-shrink:0;background:var(--card-bg,#fff)}
  .drawer-section-title{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted,#888);margin-top:4px}
  .toast{position:fixed;bottom:24px;right:24px;z-index:999;padding:10px 16px;border-radius:8px;font-size:12px;font-weight:600;display:flex;align-items:center;gap:8px;box-shadow:0 4px 16px rgba(0,0,0,.15);animation:slideIn .3s ease}
  .toast.error{background:#fee2e2;color:#dc2626;border:1px solid #fca5a5}
  .toast.success{background:#dcfce7;color:#16a34a;border:1px solid #86efac}
  @keyframes slideIn{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}
`;

interface CreateShipmentDrawerProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  couriers: ApiCourier[];
  onToast: (msg: string, type: "success" | "error") => void;
}

const CreateShipmentDrawer: React.FC<CreateShipmentDrawerProps> = ({
  open,
  onClose,
  onCreated,
  couriers,
  onToast,
}) => {
  const [form, setForm] = useState({
    courierId: "",
    dispatchDate: "",
    weight: "",
    codAmount: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // ── Order Search ──
  const [orderSearch, setOrderSearch] = useState("");
  const [orderResults, setOrderResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<
    typeof setTimeout
  > | null>(null);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setForm({
        courierId: "",
        dispatchDate: "",
        weight: "",
        codAmount: "",
        notes: "",
      });
      setOrderSearch("");
      setOrderResults([]);
      setSelectedOrder(null);
      setError("");
    }
  }, [open]);

  // Search orders from API
  const searchOrders = (q: string, force = false) => {
    setOrderSearch(q);
    setSelectedOrder(null);
    if (searchTimeout) clearTimeout(searchTimeout);
    if (!q.trim() && !force) {
      setOrderResults([]);
      return;
    }
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const { ordersAPI } = await import("../../services/api");
        const res = await ordersAPI.getAll({ search: q || "", limit: 8 });
        setOrderResults(res.data?.data?.orders ?? []);
      } catch {
        setOrderResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
    setSearchTimeout(t);
  };

  // Order select karne pe customer info auto-fill
  const selectOrder = (order: any) => {
    setSelectedOrder(order);
    setOrderResults([]);
    setOrderSearch("");
  };

  const handleCreate = async () => {
    if (!form.courierId || !selectedOrder) {
      setError("Order aur Courier dono required hain.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await couriersAPI.assignToOrder(form.courierId, {
        orderId: selectedOrder._id,
        serviceType: "Standard",
        codAmount: form.codAmount ? Number(form.codAmount) : undefined,
        weight: form.weight ? Number(form.weight) : undefined,
        dispatchDate: form.dispatchDate || undefined,
        specialInstructions: form.notes || undefined,
      });
      setForm({
        courierId: "",
        dispatchDate: "",
        weight: "",
        codAmount: "",
        notes: "",
      });
      setSelectedOrder(null);
      setOrderSearch("");
      onCreated();
      onClose();
    } catch (e: any) {
      onToast(
        e?.response?.data?.message ?? "Failed to create shipment.",
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  // Helper — order se city nikalo
  const getOrderCity = (o: any) =>
    o?.shippingAddress?.city ?? o?.customer?.address?.city ?? "—";

  return (
    <>
      <style>{drawerStyles}</style>
      <div
        className={`drawer-overlay ${open ? "open" : ""}`}
        onClick={onClose}
      />
      <div className={`drawer ${open ? "open" : ""}`}>
        <div className="drawer-header">
          <div className="drawer-header-title">
            <i
              className="fa-solid fa-truck-fast"
              style={{ color: "var(--accent)" }}
            />{" "}
            Create Shipment
          </div>
          <button className="drawer-close" onClick={onClose}>
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <div className="drawer-body">
          {/* ── Order Search ── */}
          <div className="drawer-section-title">Order</div>
          <div style={{ position: "relative" }}>
            {selectedOrder ? (
              /* Selected order card */
              <div
                style={{
                  padding: "10px 12px",
                  background: "var(--green-bg)",
                  border: "1px solid var(--green)",
                  borderRadius: 6,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: "var(--green)",
                    }}
                  >
                    <i className="fa-solid fa-circle-check" />{" "}
                    {selectedOrder.orderId}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--text-muted)",
                      marginTop: 2,
                    }}
                  >
                    {selectedOrder.shippingAddress?.name ??
                      selectedOrder.customer?.fullName ??
                      "—"}{" "}
                    · {selectedOrder.shippingAddress?.phone ?? "—"} ·{" "}
                    {getOrderCity(selectedOrder)}
                  </div>
                </div>
                <button
                  className="c-btn"
                  style={{ height: 22, fontSize: 9, padding: "0 8px" }}
                  onClick={() => {
                    setSelectedOrder(null);
                    setOrderSearch("");
                  }}
                >
                  ✕ Change
                </button>
              </div>
            ) : (
              /* Search input */
              <>
                <div className="c-search" style={{ width: "100%" }}>
                  <i
                    className={`fa-solid ${searching ? "fa-spinner fa-spin" : "fa-magnifying-glass"}`}
                  />
                  <input
                    placeholder="Order ID ya customer name search karo..."
                    value={orderSearch}
                    onChange={(e) => searchOrders(e.target.value)}
                    onFocus={() => searchOrders(orderSearch, true)}
                    style={{ width: "100%" }}
                  />
                </div>

                {orderResults.length > 0 && (
                  <div
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      right: 0,
                      background: "var(--card-bg)",
                      border: "1px solid var(--border)",
                      borderRadius: 6,
                      zIndex: 10,
                      maxHeight: 200,
                      overflowY: "auto",
                      boxShadow: "0 4px 12px rgba(0,0,0,.1)",
                      marginTop: 2,
                    }}
                  >
                    {orderResults.map((o) => (
                      <div
                        key={o._id}
                        style={{
                          padding: "8px 12px",
                          cursor: "pointer",
                          fontSize: 11,
                          borderBottom: "1px solid var(--border)",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = "var(--hover-bg)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "")
                        }
                        onClick={() => selectOrder(o)}
                      >
                        <div style={{ fontWeight: 700 }}>{o.orderId}</div>
                        <div
                          style={{ color: "var(--text-muted)", marginTop: 1 }}
                        >
                          {o.shippingAddress?.name ??
                            o.customer?.fullName ??
                            "—"}{" "}
                          · {o.shippingAddress?.phone ?? "—"} ·{" "}
                          {getOrderCity(o)} ·{" "}
                          <span
                            style={{
                              color:
                                o.orderStatus === "Packed"
                                  ? "var(--green)"
                                  : "var(--yellow)",
                              fontWeight: 600,
                            }}
                          >
                            {o.orderStatus}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {orderSearch.length >= 2 &&
                  !searching &&
                  orderResults.length === 0 && (
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--text-muted)",
                        marginTop: 4,
                        padding: "0 4px",
                      }}
                    >
                      No orders found
                    </div>
                  )}
              </>
            )}
          </div>

          {/* ── Courier & Dispatch ── */}
          <div className="drawer-section-title" style={{ marginTop: 4 }}>
            Courier & Dispatch
          </div>
          <div className="c-form-row">
            <div className="c-form-group">
              <div className="c-form-label">Courier *</div>
              <select
                className="c-form-select"
                value={form.courierId}
                onChange={(e) =>
                  setForm((f) => ({ ...f, courierId: e.target.value }))
                }
              >
                <option value="">— Select —</option>
                {couriers
                  .filter((c) => c.status !== "Inactive")
                  .map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </div>
            <div className="c-form-group">
              <div className="c-form-label">Dispatch Date</div>
              <input
                className="c-form-input"
                type="date"
                value={form.dispatchDate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, dispatchDate: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="c-form-row">
            <div className="c-form-group">
              <div className="c-form-label">Weight (kg)</div>
              <input
                className="c-form-input"
                type="number"
                placeholder="0.5"
                value={form.weight}
                onChange={(e) =>
                  setForm((f) => ({ ...f, weight: e.target.value }))
                }
              />
            </div>
            <div className="c-form-group">
              <div className="c-form-label">COD Amount (₨)</div>
              <input
                className="c-form-input"
                type="number"
                placeholder="0"
                value={form.codAmount}
                onChange={(e) =>
                  setForm((f) => ({ ...f, codAmount: e.target.value }))
                }
              />
            </div>
          </div>

          {/* ── Notes ── */}
          <div className="drawer-section-title">Notes</div>
          <textarea
            className="c-form-input"
            rows={3}
            placeholder="Special handling instructions…"
            style={{ resize: "vertical", fontFamily: "inherit", height: 72 }}
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          />
        </div>

        <div className="drawer-footer">
          <button
            className="c-btn primary"
            style={{ flex: 1 }}
            onClick={handleCreate}
            disabled={saving}
          >
            <i
              className={`fa-solid ${saving ? "fa-spinner fa-spin" : "fa-check"}`}
            />
            {saving ? "Creating…" : "Create Shipment"}
          </button>
          <button className="c-btn" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </>
  );
};

/* ─── Status update modal ────────────────────────────────────────────── */
interface StatusModalProps {
  shipmentId: string;
  current: string;
  onClose: () => void;
  onUpdated: () => void;
}
const STATUS_TRANSITIONS: Record<string, string[]> = {
  assigned: ["picked_up"],
  picked_up: ["in_transit"],
  in_transit: ["out_for_delivery"],
  out_for_delivery: ["delivered", "failed"],
  delivered: [],
  failed: ["returned"],
  returned: [],
};
const StatusUpdateModal: React.FC<StatusModalProps> = ({
  shipmentId,
  current,
  onClose,
  onUpdated,
}) => {
  const [status, setStatus] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const next = STATUS_TRANSITIONS[current] ?? [];

  const handleSave = async () => {
    if (!status) {
      setError("Select a status.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await shipmentsAPI.updateStatus(shipmentId, {
        status: status as any,
        description: description || undefined,
        location: location || undefined,
      });
      onUpdated();
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Update failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.4)",
        zIndex: 500,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--card)",
          borderRadius: 10,
          padding: 20,
          width: 340,
          boxShadow: "0 8px 40px rgba(0,0,0,.2)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>
          Update Shipment Status
        </div>
        {error && (
          <div style={{ color: "var(--red)", fontSize: 11, marginBottom: 8 }}>
            {error}
          </div>
        )}
        {next.length === 0 ? (
          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
            No further transitions available for <strong>{current}</strong>.
          </div>
        ) : (
          <>
            <div className="c-form-group" style={{ marginBottom: 10 }}>
              <div className="c-form-label">New Status</div>
              <select
                className="c-form-select"
                style={{ width: "100%" }}
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="">— Select —</option>
                {next.map((s) => (
                  <option key={s} value={s}>
                    {statusLabel(s)}
                  </option>
                ))}
              </select>
            </div>
            <div className="c-form-group" style={{ marginBottom: 10 }}>
              <div className="c-form-label">Description</div>
              <input
                className="c-form-input"
                style={{ width: "100%" }}
                placeholder="Optional note…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="c-form-group" style={{ marginBottom: 14 }}>
              <div className="c-form-label">Location</div>
              <input
                className="c-form-input"
                style={{ width: "100%" }}
                placeholder="e.g. Lahore Hub"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          </>
        )}
        <div style={{ display: "flex", gap: 8 }}>
          {next.length > 0 && (
            <button
              className="c-btn primary"
              style={{ flex: 1 }}
              onClick={handleSave}
              disabled={saving}
            >
              <i
                className={`fa-solid ${saving ? "fa-spinner fa-spin" : "fa-check"}`}
              />{" "}
              {saving ? "Saving…" : "Update"}
            </button>
          )}
          <button className="c-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Main Panel ─────────────────────────────────────────────────────── */
const ShipmentsPanel: React.FC = () => {
  const [shipments, setShipments] = useState<ApiShipment[]>([]);
  const [couriers, setCouriers] = useState<ApiCourier[]>([]);
  const [pagination, setPagination] = useState<ApiPagination>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [chipFilter, setChipFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [statusModal, setStatusModal] = useState<{
    id: string;
    current: string;
  } | null>(null);
  const PER_PAGE = 10;

  const statusMap: Record<string, string> = {
    all: "",
    pending: "assigned",
    intransit: "in_transit",
    delivered: "delivered",
    returns: "returned",
    failed: "failed",
  };

  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchShipments = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, any> = { page, limit: PER_PAGE };
      if (search) params.search = search;
      const status = statusMap[chipFilter];
      if (status) params.status = status;
      const res = await shipmentsAPI.getAll(params);
      const data = res.data?.data;
      setShipments(data?.shipments ?? []);
      setPagination(
        data?.pagination ?? {
          currentPage: 1,
          totalPages: 1,
          totalItems: 0,
          itemsPerPage: PER_PAGE,
        },
      );
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Failed to load shipments.");
    } finally {
      setLoading(false);
    }
  }, [page, search, chipFilter]);

  useEffect(() => {
    fetchShipments();
  }, [fetchShipments]);
  useEffect(() => {
    couriersAPI
      .getAll({ limit: 50 })
      .then((r) => setCouriers(r.data?.data?.couriers ?? []))
      .catch(() => {});
  }, []);

  const chips = [
    "all",
    "pending",
    "intransit",
    "delivered",
    "returns",
    "failed",
  ];
  const chipLabels: Record<string, string> = {
    all: "All",
    pending: "Pending",
    intransit: "In Transit",
    delivered: "Delivered",
    returns: "Returns",
    failed: "Failed",
  };
  const chipIcons: Record<string, string> = {
    pending: "fa-clock",
    intransit: "fa-truck-moving",
    delivered: "fa-circle-check",
    returns: "fa-rotate-left",
    failed: "fa-circle-xmark",
  };

  const { currentPage, totalPages, totalItems } = pagination;
  const start = (currentPage - 1) * PER_PAGE + 1;
  const end = Math.min(currentPage * PER_PAGE, totalItems);

  return (
    <>
      {toast && (
        <div className={`toast ${toast.type}`}>
          <i
            className={`fa-solid ${toast.type === "error" ? "fa-circle-exclamation" : "fa-circle-check"}`}
          />
          {toast.msg}
        </div>
      )}
      {statusModal && (
        <StatusUpdateModal
          shipmentId={statusModal.id}
          current={statusModal.current}
          onClose={() => setStatusModal(null)}
          onUpdated={fetchShipments}
        />
      )}
      <CreateShipmentDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onCreated={fetchShipments}
        couriers={couriers}
        onToast={showToast}
      />

      <div className="panel-heading">All Shipments</div>
      <div className="panel-desc">
        Complete list of all courier shipments. Filter by status, search by
        tracking number or order.
      </div>

      <div className="mini-stats">
        <div className="mini-stat">
          <div className="ms-label">Total Shipments</div>
          <div className="ms-value">{totalItems}</div>
          <div className="ms-trend up">Live count</div>
        </div>
        <div className="mini-stat">
          <div className="ms-label">In Transit</div>
          <div className="ms-value">
            {shipments.filter((s) => s.currentStatus === "in_transit").length}
          </div>
          <div className="ms-trend">This page</div>
        </div>
        <div className="mini-stat">
          <div className="ms-label">Delivered</div>
          <div className="ms-value">
            {shipments.filter((s) => s.currentStatus === "delivered").length}
          </div>
          <div className="ms-trend up">This page</div>
        </div>
        <div className="mini-stat">
          <div className="ms-label">Failed / RTO</div>
          <div className="ms-value">
            {
              shipments.filter(
                (s) =>
                  s.currentStatus === "failed" ||
                  s.currentStatus === "returned",
              ).length
            }
          </div>
          <div className="ms-trend down">This page</div>
        </div>
      </div>

      <div className="chip-group">
        {chips.map((c) => (
          <div
            key={c}
            className={`chip ${chipFilter === c ? "active" : ""}`}
            onClick={() => {
              setChipFilter(c);
              setPage(1);
            }}
          >
            {chipIcons[c] && <i className={`fa-solid ${chipIcons[c]}`} />}
            {chipLabels[c]}
          </div>
        ))}
      </div>

      <div className="card">
        <div className="c-toolbar">
          <div className="c-toolbar-left">
            <div className="c-search">
              <i className="fa-solid fa-magnifying-glass" />
              <input
                placeholder="Search tracking, order, customer…"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>
          <div className="c-toolbar-right">
            <button className="c-btn" onClick={fetchShipments}>
              <i className="fa-solid fa-rotate" /> Refresh
            </button>
            <button
              className="c-btn primary"
              onClick={() => setDrawerOpen(true)}
            >
              <i className="fa-solid fa-plus" /> Create Shipment
            </button>
          </div>
        </div>

        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>
                  <input type="checkbox" />
                </th>
                <th>Tracking No.</th>
                <th>Order</th>
                <th>Customer</th>
                <th>Courier</th>
                <th>City</th>
                <th>Status</th>
                <th>Dispatched</th>
                <th>Est. Delivery</th>
                <th>COD</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeleton rows={7} cols={11} />
              ) : error ? (
                <tr>
                  <td
                    colSpan={11}
                    style={{
                      textAlign: "center",
                      padding: 24,
                      color: "var(--red)",
                    }}
                  >
                    <i className="fa-solid fa-circle-exclamation" /> {error}
                    <button
                      className="c-btn"
                      style={{ marginLeft: 8 }}
                      onClick={fetchShipments}
                    >
                      Retry
                    </button>
                  </td>
                </tr>
              ) : shipments.length === 0 ? (
                <tr>
                  <td colSpan={11}>
                    <EmptyState
                      icon="fa-box-open"
                      title="No shipments found"
                      desc="No records match the current filter."
                    />
                  </td>
                </tr>
              ) : (
                shipments.map((s) => (
                  <tr key={s._id}>
                    <td>
                      <input type="checkbox" />
                    </td>
                    <td>
                      <code className="sku">{s.trackingNumber ?? "—"}</code>
                    </td>
                    <td>
                      <strong>{s.orderReference ?? s.orderId ?? "—"}</strong>
                    </td>
                    <td>{s.customer?.name ?? s.customer?.fullName ?? "—"}</td>
                    <td>
                      <span className="tag">
                        {s.courierName ??
                          (typeof s.courier === "object"
                            ? s.courier?.name
                            : "—")}
                      </span>
                    </td>
                    <td>{s.shippingAddress?.city ?? "—"}</td>
                    <td>
                      <Badge label={s.currentStatus} />
                    </td>
                    <td style={{ fontSize: 11 }}>
                      {s.dispatchedAt
                        ? new Date(s.dispatchedAt).toLocaleDateString()
                        : "—"}
                    </td>
                    <td style={{ fontSize: 11 }}>
                      {s.estimatedDelivery
                        ? new Date(s.estimatedDelivery).toLocaleDateString()
                        : "—"}
                    </td>
                    <td>{s.codAmount != null ? fmt(s.codAmount) : "—"}</td>
                    <td style={{ display: "flex", gap: 3 }}>
                      <button
                        className="c-btn"
                        style={{ height: 22, fontSize: 9.5 }}
                        title="Track"
                        onClick={() =>
                          window.open(
                            `/couriers?track=${s.trackingNumber}`,
                            "_self",
                          )
                        }
                      >
                        <i className="fa-solid fa-location-dot" />
                      </button>
                      <button
                        className="c-btn"
                        style={{ height: 22, fontSize: 9.5 }}
                        title="Update status"
                        onClick={() =>
                          setStatusModal({
                            id: s._id,
                            current: s.currentStatus,
                          })
                        }
                      >
                        <i className="fa-solid fa-pen" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <CPagination
          current={currentPage}
          total={totalPages}
          totalItems={totalItems}
          start={start}
          end={end}
          onChange={setPage}
        />
      </div>
    </>
  );
};

export default ShipmentsPanel;
