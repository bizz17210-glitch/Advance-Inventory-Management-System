// PendingPanel.tsx — dynamic
import React, { useState, useEffect, useCallback } from "react";
import {
  ApiShipment,
  ApiCourier,
  Badge,
  EmptyState,
  TableSkeleton,
  CPagination,
  ApiPagination,
} from "./shared";
import { shipmentsAPI, couriersAPI, ordersAPI } from "../../services/api";

/* ─── Bulk Assign Drawer ─────────────────────────────────────────────── */
const drawerStyles = `
  .bulk-overlay{position:fixed;inset:0;background:rgba(0,0,0,.35);backdrop-filter:blur(2px);z-index:400;opacity:0;pointer-events:none;transition:opacity .3s ease}
  .bulk-overlay.open{opacity:1;pointer-events:all}
  .bulk-drawer{position:fixed;top:0;right:0;height:100%;width:400px;max-width:95vw;background:var(--card-bg,#fff);box-shadow:-8px 0 40px rgba(0,0,0,.18);z-index:401;display:flex;flex-direction:column;transform:translateX(100%);transition:transform .35s cubic-bezier(.4,0,.2,1);overflow:hidden}
  .bulk-drawer.open{transform:translateX(0)}
  .bulk-drawer-header{display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid var(--border-color,#e5e7eb);flex-shrink:0}
  .bulk-drawer-title{font-size:13.5px;font-weight:600;color:var(--text-main,#111);display:flex;align-items:center;gap:8px}
  .bulk-drawer-close{border:none;background:none;cursor:pointer;color:var(--text-muted,#888);font-size:14px;padding:4px 6px;border-radius:4px}
  .bulk-drawer-body{flex:1;overflow-y:auto;padding:18px 20px;display:flex;flex-direction:column;gap:16px}
  .bulk-drawer-footer{padding:14px 20px;border-top:1px solid var(--border-color,#e5e7eb);display:flex;gap:8px;flex-shrink:0;background:var(--card-bg,#fff)}
  .bulk-section-title{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted,#888)}
  .bulk-order-list{display:flex;flex-direction:column;gap:6px;max-height:220px;overflow-y:auto}
  .bulk-order-item{display:flex;align-items:center;justify-content:space-between;padding:7px 10px;border-radius:6px;background:var(--hover-bg,#f9fafb);border:1px solid var(--border-color,#e5e7eb);font-size:11px}
  .bulk-courier-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
  .bulk-courier-card{border:2px solid var(--border-color,#e5e7eb);border-radius:8px;padding:10px 12px;cursor:pointer;transition:border-color .15s,background .15s;display:flex;flex-direction:column;gap:3px}
  .bulk-courier-card:hover,.bulk-courier-card.selected{border-color:var(--accent);background:#FFF5EE}
  .bulk-summary-box{background:var(--hover-bg,#f9fafb);border:1px solid var(--border-color,#e5e7eb);border-radius:8px;padding:12px 14px;display:flex;flex-direction:column;gap:6px}
  .bulk-summary-row{display:flex;justify-content:space-between;font-size:11px;color:var(--text-secondary,#555)}
`;

interface BulkDrawerProps {
  open: boolean;
  onClose: () => void;
  selected: ApiShipment[];
  couriers: ApiCourier[];
  onDispatched: () => void;
}

const BulkAssignDrawer: React.FC<BulkDrawerProps> = ({
  open,
  onClose,
  selected,
  couriers,
  onDispatched,
}) => {
  const [selectedCourierId, setSelectedCourierId] = useState("");
  const [notes, setNotes] = useState("");
  const [dispatching, setDispatching] = useState(false);
  const [err, setErr] = useState("");

  const handleDispatch = async () => {
    if (!selectedCourierId) {
      setErr("Select a courier.");
      return;
    }
    setDispatching(true);
    setErr("");
    try {
      await Promise.all(
        selected.map((s) =>
          couriersAPI
            .assignToOrder(selectedCourierId, {
              orderId: s.order ?? s._id,
              serviceType: "Standard",
              specialInstructions: notes || undefined,
            })
            .catch(() => {}),
        ),
      );
      onDispatched();
      onClose();
    } catch (e: any) {
      setErr(e?.response?.data?.message ?? "Dispatch failed.");
    } finally {
      setDispatching(false);
    }
  };

  return (
    <>
      <style>{drawerStyles}</style>
      <div className={`bulk-overlay ${open ? "open" : ""}`} onClick={onClose} />
      <div className={`bulk-drawer ${open ? "open" : ""}`}>
        <div className="bulk-drawer-header">
          <div className="bulk-drawer-title">
            <i
              className="fa-solid fa-truck"
              style={{ color: "var(--accent)" }}
            />{" "}
            Bulk Assign Courier
          </div>
          <button className="bulk-drawer-close" onClick={onClose}>
            <i className="fa-solid fa-xmark" />
          </button>
        </div>
        <div className="bulk-drawer-body">
          {err && (
            <div className="alert-strip danger" style={{ margin: 0 }}>
              <i className="fa-solid fa-circle-exclamation" /> {err}
            </div>
          )}

          <div>
            <div className="bulk-section-title" style={{ marginBottom: 8 }}>
              Orders to Dispatch ({selected.length})
            </div>
            <div className="bulk-order-list">
              {selected.map((s) => (
                <div className="bulk-order-item" key={s._id}>
                  <div>
                    <div style={{ fontWeight: 700 }}>
                      {s.orderReference ?? s.orderId ?? "—"}
                    </div>
                    <div style={{ color: "var(--text-muted)", fontSize: 10 }}>
                      {s.customer?.name ?? s.customer?.fullName ?? "—"} ·{" "}
                      {s.shippingAddress?.city ?? "—"}
                    </div>
                  </div>
                  <Badge label={s.currentStatus} />
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="bulk-section-title" style={{ marginBottom: 8 }}>
              Select Courier
            </div>
            <div className="bulk-courier-grid">
              {couriers
                .filter((c) => c.status !== "Inactive")
                .map((c) => (
                  <div
                    key={c._id}
                    className={`bulk-courier-card ${selectedCourierId === c._id ? "selected" : ""}`}
                    onClick={() => setSelectedCourierId(c._id)}
                  >
                    <div style={{ fontSize: 12, fontWeight: 600 }}>
                      {selectedCourierId === c._id && (
                        <i
                          className="fa-solid fa-circle-check"
                          style={{ color: "var(--accent)", marginRight: 5 }}
                        />
                      )}
                      {c.name}
                    </div>
                    <div style={{ fontSize: 10, color: "var(--text-muted)" }}>
                      {c.serviceRegions?.slice(0, 2).join(", ") ?? "Nationwide"}
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div>
            <div className="bulk-section-title" style={{ marginBottom: 8 }}>
              Notes (optional)
            </div>
            <textarea
              className="c-form-textarea"
              rows={3}
              placeholder="Special handling instructions…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="bulk-summary-box">
            <div className="bulk-section-title" style={{ marginBottom: 4 }}>
              Summary
            </div>
            <div className="bulk-summary-row">
              <span>Total orders</span>
              <strong>{selected.length}</strong>
            </div>
            <div className="bulk-summary-row">
              <span>Assigned courier</span>
              <strong>
                {couriers.find((c) => c._id === selectedCourierId)?.name ?? "—"}
              </strong>
            </div>
          </div>
        </div>
        <div className="bulk-drawer-footer">
          <button
            className="c-btn primary"
            style={{ flex: 1 }}
            disabled={!selectedCourierId || dispatching}
            onClick={handleDispatch}
          >
            <i
              className={`fa-solid ${dispatching ? "fa-spinner fa-spin" : "fa-truck"}`}
            />{" "}
            {dispatching ? "Dispatching…" : "Dispatch All"}
          </button>
          <button className="c-btn" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </>
  );
};

/* ─── Main Panel ─────────────────────────────────────────────────────── */
const PendingPanel: React.FC = () => {
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
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [dispatching, setDispatching] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const PER_PAGE = 10;

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, any> = {
        page,
        limit: PER_PAGE,
        status: "assigned",
      };
      if (search) params.search = search;
      const [sRes, cRes] = await Promise.allSettled([
        shipmentsAPI.getAll(params),
        couriersAPI.getAll({ limit: 50 }),
      ]);
      if (sRes.status === "fulfilled") {
        const d = sRes.value.data?.data;
        setShipments(d?.shipments ?? []);
        setPagination(
          d?.pagination ?? {
            currentPage: 1,
            totalPages: 1,
            totalItems: 0,
            itemsPerPage: PER_PAGE,
          },
        );
      }
      if (cRes.status === "fulfilled")
        setCouriers(cRes.value.data?.data?.couriers ?? []);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Failed to load pending orders.");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleSelect = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  const toggleAll = () =>
    setSelected((prev) =>
      prev.size === shipments.length
        ? new Set()
        : new Set(shipments.map((s) => s._id)),
    );

  const handleDispatchOne = async (s: ApiShipment, courierId: string) => {
    if (!courierId) return;
    setDispatching(s._id);
    try {
      await couriersAPI.assignToOrder(courierId, {
        orderId: s.order ?? s._id,
        serviceType: "Standard",
      });
      fetchData();
    } catch (e: any) {
      alert(e?.response?.data?.message ?? "Dispatch failed.");
    } finally {
      setDispatching(null);
    }
  };

  const selectedShipments = shipments.filter((s) => selected.has(s._id));
  const { currentPage, totalPages, totalItems } = pagination;
  const start = (currentPage - 1) * PER_PAGE + 1;
  const end = Math.min(currentPage * PER_PAGE, totalItems);

  return (
    <>
      <BulkAssignDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        selected={selectedShipments}
        couriers={couriers}
        onDispatched={() => {
          setSelected(new Set());
          fetchData();
        }}
      />

      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 9999,
            background: "#1F2937",
            color: "#fff",
            padding: "11px 16px",
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 8,
            boxShadow: "0 4px 16px rgba(0,0,0,.2)",
          }}
        >
          <i className="fa-solid fa-circle-info" style={{ color: "#60a5fa" }} />
          {toast}
        </div>
      )}

      <div className="panel-heading">Pending Dispatch</div>
      <div className="panel-desc">
        Shipments assigned but not yet picked up. Assign a courier and dispatch
        — overdue orders are highlighted.
      </div>

      {totalItems > 0 && (
        <div className="alert-strip warn">
          <i className="fa-solid fa-triangle-exclamation" />
          <strong>{totalItems} shipments</strong> pending courier pickup.
        </div>
      )}

      <div className="card">
        <div className="c-toolbar">
          <div className="c-toolbar-left">
            <div className="c-search">
              <i className="fa-solid fa-magnifying-glass" />
              <input
                placeholder="Search order or customer…"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>
          <div className="c-toolbar-right">
            <button className="c-btn" onClick={fetchData}>
              <i className="fa-solid fa-rotate" /> Refresh
            </button>
            <button
              className="c-btn primary"
              onClick={() => {
                if (selected.size === 0) {
                  setToast("Please select at least one shipment to proceed.");
                  setTimeout(() => setToast(null), 3000);
                  return;
                }
                setDrawerOpen(true);
              }}
            >
              <i className="fa-solid fa-truck" /> Bulk Assign ({selected.size})
            </button>
          </div>
        </div>

        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={
                      selected.size === shipments.length && shipments.length > 0
                    }
                    onChange={toggleAll}
                  />
                </th>
                <th>Order</th>
                <th>Tracking No.</th>
                <th>Customer</th>
                <th>City</th>
                <th>COD Amount</th>
                <th>Created</th>
                <th>Status</th>
                <th>Assign Courier</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeleton rows={5} cols={10} />
              ) : error ? (
                <tr>
                  <td
                    colSpan={10}
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
                      onClick={fetchData}
                    >
                      Retry
                    </button>
                  </td>
                </tr>
              ) : shipments.length === 0 ? (
                <tr>
                  <td colSpan={10}>
                    <EmptyState
                      icon="fa-clock"
                      title="No pending shipments"
                      desc="All shipments have been dispatched."
                    />
                  </td>
                </tr>
              ) : (
                shipments.map((s) => (
                  <tr key={s._id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selected.has(s._id)}
                        onChange={() => toggleSelect(s._id)}
                      />
                    </td>
                    <td>
                      <strong>{s.orderReference ?? s.orderId ?? "—"}</strong>
                    </td>
                    <td>
                      <code className="sku">{s.trackingNumber ?? "—"}</code>
                    </td>
                    <td>{s.customer?.name ?? s.customer?.fullName ?? "—"}</td>
                    <td>{s.shippingAddress?.city ?? "—"}</td>
                    <td>
                      <strong>
                        {s.codAmount != null
                          ? `₨${Number(s.codAmount).toLocaleString()}`
                          : "—"}
                      </strong>
                    </td>
                    <td style={{ fontSize: 10 }}>
                      {s.createdAt
                        ? new Date(s.createdAt).toLocaleDateString()
                        : "—"}
                    </td>
                    <td>
                      <Badge label={s.currentStatus} />
                    </td>
                    <td>
                      <select
                        data-id={s._id}
                        className="c-form-select"
                        style={{ height: 24, fontSize: 10, minWidth: 130 }}
                        defaultValue=""
                        onChange={(e) =>
                          e.target.value && handleDispatchOne(s, e.target.value)
                        }
                      >
                        <option value="">— Assign —</option>
                        {couriers
                          .filter((c) => c.status !== "Inactive")
                          .map((c) => (
                            <option key={c._id} value={c._id}>
                              {c.name}
                            </option>
                          ))}
                      </select>
                    </td>
                    <td>
                      {dispatching === s._id ? (
                        <i
                          className="fa-solid fa-spinner fa-spin"
                          style={{ color: "var(--accent)" }}
                        />
                      ) : (
                        <button
                          className="c-btn primary"
                          style={{ height: 24, fontSize: 9.5 }}
                          onClick={() => {
                            const sel =
                              document.querySelector<HTMLSelectElement>(
                                `select[data-id="${s._id}"]`,
                              );
                            if (sel?.value) handleDispatchOne(s, sel.value);
                          }}
                        >
                          <i className="fa-solid fa-truck" /> Dispatch
                        </button>
                      )}
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

export default PendingPanel;
