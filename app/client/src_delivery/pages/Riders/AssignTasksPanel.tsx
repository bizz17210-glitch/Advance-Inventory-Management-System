// AssignTasksPanel.tsx — dynamic
import React, { useState, useEffect, useCallback } from "react";
import {
  ApiRider,
  ApiPagination,
  UNASSIGNED_ORDERS,
  riderStatusLabel,
  Badge,
  ApiRiderAvatar,
  EmptyState,
  TableSkeleton,
} from "./shared";
import { ridersAPI, ordersAPI } from "../../services/api";

interface UnassignedOrder {
  _id: string;
  orderId?: string;
  customer?: { fullName?: string; phone?: string };
  shippingAddress?: { city?: string; street?: string };
  totalAmount?: number;
  orderStatus?: string;
  paymentMethod?: string;
  source?: string;
  createdAt?: string;
}

const AssignTasksPanel: React.FC = () => {
  const [riders, setRiders] = useState<ApiRider[]>([]);
  const [orders, setOrders] = useState<UnassignedOrder[]>([]);
  const [loadingRiders, setLoadingRiders] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form state
  const [selectedOrder, setSelectedOrder] = useState("");
  const [selectedRider, setSelectedRider] = useState("");
  const [priority, setPriority] = useState("Normal");
  const [deliveryBy, setDeliveryBy] = useState("");
  const [notes, setNotes] = useState("");
  const [assigning, setAssigning] = useState(false);

  // Checked orders for bulk assign
  const [checkedOrders, setCheckedOrders] = useState<Set<string>>(new Set());

  const loadRiders = useCallback(async () => {
    setLoadingRiders(true);
    try {
      const res = await ridersAPI.getAll({ limit: 50, status: "Active" });
      const list: ApiRider[] = (res.data?.data?.riders ?? []).filter(
        (r: ApiRider) => r.isAvailable && r.status === "Active",
      );
      setRiders(list);
      if (list.length > 0) setSelectedRider(list[0]._id);
    } catch {
      /* silent */
    } finally {
      setLoadingRiders(false);
    }
  }, []);

  const loadOrders = useCallback(async () => {
    setLoadingOrders(true);
    try {
      // Fetch confirmed / packed orders that are not yet shipped
      const res = await ordersAPI.getAll({
        limit: 30,
        status: "Confirmed,Processing,Packed",
      });
      const list: UnassignedOrder[] = res.data?.data?.orders ?? [];
      setOrders(list);
      if (list.length > 0) setSelectedOrder(list[0]._id);
    } catch {
      /* silent */
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  useEffect(() => {
    loadRiders();
    loadOrders();
  }, [loadRiders, loadOrders]);

  // ── Quick assign ──
  const handleAssign = async () => {
    if (!selectedOrder || !selectedRider) {
      setError("Please select both an order and a rider.");
      return;
    }
    setAssigning(true);
    setError("");
    setSuccess("");
    try {
      // Fulfill order with selected rider
      await ordersAPI.fulfill(selectedOrder, {
        courier: selectedRider, // rider acts as internal courier
        rider: selectedRider,
        notes: notes.trim() || undefined,
      });
      setSuccess("Order assigned to rider successfully!");
      setNotes("");
      // Refresh
      loadOrders();
      loadRiders();
      setTimeout(() => setSuccess(""), 3000);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Failed to assign order.");
    } finally {
      setAssigning(false);
    }
  };

  const toggleOrder = (id: string) => {
    setCheckedOrders((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const availableRiders = riders.filter((r) => r.isAvailable);

  return (
    <>
      <div className="panel-heading">Assign Delivery Tasks</div>
      <div className="panel-desc">
        Orders ready for internal rider assignment. Review customer location and
        available riders, then assign. Supports bulk assignment.
      </div>

      {error && (
        <div className="alert-strip danger" style={{ marginBottom: 12 }}>
          <i className="fa-solid fa-circle-exclamation" /> {error}
        </div>
      )}
      {success && (
        <div className="alert-strip success" style={{ marginBottom: 12 }}>
          <i className="fa-solid fa-circle-check" /> {success}
        </div>
      )}

      <div className="detail-grid-2" style={{ marginBottom: 14 }}>
        {/* Unassigned Orders */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <div className="card-title">
              <i className="fa-solid fa-clipboard-list" /> Unassigned Orders
              {orders.length > 0 && ` (${orders.length})`}
            </div>
            <button className="c-btn" onClick={loadOrders}>
              <i className="fa-solid fa-rotate" />
            </button>
          </div>
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr>
                  <th>
                    <input type="checkbox" />
                  </th>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>City</th>
                  <th>Amount</th>
                  <th>Source</th>
                </tr>
              </thead>
              <tbody>
                {loadingOrders ? (
                  <TableSkeleton rows={4} cols={6} />
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <EmptyState
                        icon="fa-clipboard-check"
                        title="No Pending Orders"
                        desc="All confirmed orders have been assigned."
                      />
                    </td>
                  </tr>
                ) : (
                  orders.map((o) => (
                    <tr
                      key={o._id}
                      style={{
                        background: checkedOrders.has(o._id)
                          ? "#FFF5EE"
                          : undefined,
                      }}
                    >
                      <td>
                        <input
                          type="checkbox"
                          checked={checkedOrders.has(o._id)}
                          onChange={() => toggleOrder(o._id)}
                        />
                      </td>
                      <td>
                        <strong>
                          {o.orderId ?? o._id.slice(-6).toUpperCase()}
                        </strong>
                      </td>
                      <td>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 11 }}>
                            {o.customer?.fullName ?? "—"}
                          </div>
                          <div className="td-sub">
                            {o.customer?.phone ?? ""}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="tag">
                          {o.shippingAddress?.city ?? "—"}
                        </span>
                      </td>
                      <td>
                        <strong>
                          {o.totalAmount
                            ? `₨${Number(o.totalAmount).toLocaleString()}`
                            : "—"}
                        </strong>
                      </td>
                      <td>
                        <span className="tag" style={{ fontSize: 9 }}>
                          {o.source ?? "—"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Available Riders */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <div className="card-title">
              <i className="fa-solid fa-person-biking" /> Available Riders
              {availableRiders.length > 0 && ` (${availableRiders.length})`}
            </div>
            <button className="c-btn" onClick={loadRiders}>
              <i className="fa-solid fa-rotate" />
            </button>
          </div>
          <div className="card-body" style={{ padding: "8px 14px" }}>
            {loadingRiders ? (
              <div
                style={{
                  textAlign: "center",
                  padding: 16,
                  color: "var(--text-muted)",
                  fontSize: 11,
                }}
              >
                <i className="fa-solid fa-spinner fa-spin" /> Loading riders…
              </div>
            ) : availableRiders.length === 0 ? (
              <EmptyState
                icon="fa-person-biking"
                title="No Available Riders"
                desc="All riders are currently busy or offline."
              />
            ) : (
              availableRiders.map((r) => (
                <div
                  className="list-item"
                  key={r._id}
                  style={{
                    cursor: "pointer",
                    background:
                      selectedRider === r._id ? "var(--bg)" : "transparent",
                    borderRadius: 5,
                    padding: "7px 8px",
                  }}
                  onClick={() => setSelectedRider(r._id)}
                >
                  <ApiRiderAvatar rider={r} size={28} fontSize={9} />
                  <div className="list-content">
                    <div className="list-title">{r.fullName}</div>
                    <div className="list-meta">
                      {r.assignedZone ?? "—"} · {r.vehicle?.type ?? "—"}
                    </div>
                  </div>
                  <div className="list-right">
                    <Badge label={riderStatusLabel(r.status)} />
                    <div
                      style={{
                        fontSize: 9.5,
                        color: "var(--text-muted)",
                        marginTop: 3,
                      }}
                    >
                      {r.activeDeliveries ?? 0} active
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Assign Form */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <i className="fa-solid fa-paper-plane" /> Quick Assign
          </div>
        </div>
        <div className="card-body">
          <div className="c-form-row">
            <div className="c-form-group">
              <div className="c-form-label">Select Order *</div>
              <select
                className="c-form-select"
                value={selectedOrder}
                onChange={(e) => setSelectedOrder(e.target.value)}
              >
                <option value="">— Select Order —</option>
                {orders.map((o) => (
                  <option key={o._id} value={o._id}>
                    {o.orderId ?? o._id.slice(-6)} —{" "}
                    {o.customer?.fullName ?? "?"} (
                    {o.shippingAddress?.city ?? "?"})
                  </option>
                ))}
              </select>
            </div>
            <div className="c-form-group">
              <div className="c-form-label">Assign To Rider *</div>
              <select
                className="c-form-select"
                value={selectedRider}
                onChange={(e) => setSelectedRider(e.target.value)}
              >
                <option value="">— Select Rider —</option>
                {availableRiders.map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.fullName} ({r.assignedZone ?? "Any Zone"})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="c-form-row">
            <div className="c-form-group">
              <div className="c-form-label">Priority</div>
              <select
                className="c-form-select"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option>Normal</option>
                <option>High</option>
                <option>Urgent</option>
              </select>
            </div>
            <div className="c-form-group">
              <div className="c-form-label">Expected Delivery By</div>
              <input
                className="c-form-input"
                type="time"
                value={deliveryBy}
                onChange={(e) => setDeliveryBy(e.target.value)}
              />
            </div>
          </div>
          <div className="c-form-row single">
            <div className="c-form-group">
              <div className="c-form-label">Notes for Rider</div>
              <textarea
                className="c-form-textarea"
                placeholder="e.g. Call on arrival, leave at gate..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
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
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="c-btn primary"
              onClick={handleAssign}
              disabled={assigning}
            >
              {assigning ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin" /> Assigning…
                </>
              ) : (
                <>
                  <i className="fa-solid fa-paper-plane" /> Assign &amp; Notify
                  Rider
                </>
              )}
            </button>
            <button className="c-btn" disabled={checkedOrders.size === 0}>
              <i className="fa-solid fa-layer-group" /> Bulk Assign (
              {checkedOrders.size})
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default AssignTasksPanel;
