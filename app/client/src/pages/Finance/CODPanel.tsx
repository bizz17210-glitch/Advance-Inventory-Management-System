import React, { useEffect, useState, useCallback } from "react";
import type { ApiOrderListItem } from "./types";
import {
  Badge,
  FPagination,
  InnerTabs,
  EmptyState,
  fmt,
  fmtDate,
  SkeletonRows,
  ErrorBanner,
} from "./helpers";
import { financeOrdersAPI } from "../../services/api";
import { CODDetailContent } from "./OverviewPanel";

const PER_PAGE = 10;

interface Props {
  onOpenOverlay: (title: string, content: React.ReactNode) => void;
}

const CODPanel: React.FC<Props> = ({ onOpenOverlay }) => {
  const [innerTab, setInnerTab] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [orders, setOrders] = useState<ApiOrderListItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [kpis, setKpis] = useState<any>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [toast, setToast] = useState("");

  const deliveryStatusFilter: Record<string, string | undefined> = {
    pending: "InTransit",
    collected: "Delivered",
    submitted: "Delivered",
    all: undefined,
  };

  const paymentFilter: Record<string, string | undefined> = {
    pending: "Pending",
    collected: "Pending",
    submitted: "Paid",
    all: undefined,
  };

  const load = useCallback(async (tab: string, pg: number) => {
    setLoading(true);
    setError("");
    try {
      const params: any = {
        page: pg,
        limit: PER_PAGE,
      };
      if (deliveryStatusFilter[tab])
        params.deliveryStatus = deliveryStatusFilter[tab];
      if (paymentFilter[tab]) params.paymentStatus = paymentFilter[tab];

      const res = await financeOrdersAPI.getCODOrders(params);
      const data = res.data.data;
      setOrders(data.orders || []);
      setTotalItems(data.pagination?.totalItems ?? 0);
      setTotalPages(data.pagination?.totalPages ?? 1);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to load COD orders.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Load summary KPIs once
  useEffect(() => {
    import("../../services/api").then((m) =>
      m.financialAnalyticsAPI
        .getFinancial({})
        .then((r) => setKpis(r.data.data.kpis))
        .catch(() => null),
    );
  }, []);

  useEffect(() => {
    load(innerTab, page);
  }, [innerTab, page, load]);

  const filteredBySearch = search
    ? orders.filter(
        (o) =>
          o.orderId.toLowerCase().includes(search.toLowerCase()) ||
          (o.customer?.fullName ?? "")
            .toLowerCase()
            .includes(search.toLowerCase()),
      )
    : orders;

  const start = (page - 1) * PER_PAGE + 1;
  const end = Math.min(page * PER_PAGE, totalItems);

  const handleTabChange = (id: string) => {
    setInnerTab(id);
    setPage(1);
    setSelectedIds(new Set());
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const eligible = filteredBySearch.filter(
      (o) => o.paymentStatus === "Pending" && o.deliveryStatus === "Delivered",
    );
    if (eligible.every((o) => selectedIds.has(o._id))) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(eligible.map((o) => o._id)));
    }
  };

  const handleBulkSubmit = async () => {
    if (selectedIds.size === 0) {
      setToast("Please select at least one order from the list.");
      setTimeout(() => setToast(""), 3000);
      return;
    }
    if (!window.confirm(`Mark ${selectedIds.size} order(s) as Paid?`)) return;

    setBulkLoading(true);
    try {
      await Promise.all(
        Array.from(selectedIds).map((id) =>
          financeOrdersAPI.updatePaymentStatus(id, "Paid"),
        ),
      );
      setSelectedIds(new Set());
      load(innerTab, page);
    } catch {
      alert("Some orders failed to update.");
    } finally {
      setBulkLoading(false);
    }
  };

  return (
    <>
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            background: "var(--accent)",
            color: "#fff",
            padding: "10px 18px",
            borderRadius: 8,
            fontSize: 13,
            zIndex: 9999,
            boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <i className="fa-solid fa-triangle-exclamation" />
          {toast}
        </div>
      )}
      <div className="panel-heading">COD Tracking</div>
      <div className="panel-desc">
        Monitor cash-on-delivery collections per order and per rider. Submit
        collections to accounts and reconcile pending amounts.
      </div>

      {error && (
        <ErrorBanner message={error} onRetry={() => load(innerTab, page)} />
      )}

      {kpis && Number(kpis.codPending.amount) > 0 && (
        <div className="alert-strip warn">
          <i className="fa-solid fa-coins" />
          <div>
            <strong>{kpis.codPending.count} orders</strong> holding a combined{" "}
            <strong>{fmt(Number(kpis.codPending.amount))}</strong> in
            uncollected COD cash.
          </div>
          <button
            className="f-btn primary"
            style={{ marginLeft: "auto", fontSize: 9.5 }}
            onClick={handleBulkSubmit}
            disabled={bulkLoading}
          >
            <i
              className={
                bulkLoading
                  ? "fa-solid fa-spinner fa-spin"
                  : "fa-solid fa-check-double"
              }
            />
            {bulkLoading ? "Submitting…" : "Bulk Submit"}
          </button>
        </div>
      )}

      <div className="mini-stats">
        <div className="mini-stat">
          <div className="ms-label">Total COD Orders</div>
          <div className="ms-value">{loading ? "…" : totalItems}</div>
        </div>
        <div className="mini-stat">
          <div className="ms-label">COD Collected</div>
          <div className="ms-value" style={{ color: "var(--green)" }}>
            {kpis ? fmt(Number(kpis.codCollected.amount)) : "…"}
          </div>
          <div className="ms-trend up">
            <i className="fa-solid fa-circle-check" />{" "}
            {kpis?.codCollected.count ?? "—"} orders
          </div>
        </div>
        <div className="mini-stat">
          <div className="ms-label">Pending Collection</div>
          <div className="ms-value" style={{ color: "var(--accent)" }}>
            {kpis ? fmt(Number(kpis.codPending.amount)) : "…"}
          </div>
          <div className="ms-trend">{kpis?.codPending.count ?? "—"} orders</div>
        </div>
        <div className="mini-stat">
          <div className="ms-label">Net COD Revenue</div>
          <div className="ms-value" style={{ color: "var(--blue)" }}>
            {kpis ? fmt(Number(kpis.totalRevenue)) : "…"}
          </div>
        </div>
      </div>

      <InnerTabs
        tabs={[
          { id: "all", label: "All Orders" },
          { id: "pending", label: "Pending" },
          { id: "collected", label: "Collected" },
          { id: "submitted", label: "Submitted" },
        ]}
        active={innerTab}
        onChange={handleTabChange}
      />

      <div className="card">
        <div className="f-toolbar">
          <div className="f-toolbar-left">
            <div className="f-search">
              <i className="fa-solid fa-magnifying-glass" />
              <input
                placeholder="Search order or customer…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button className="f-btn">
              <i className="fa-solid fa-calendar" /> Date
            </button>
          </div>
          <div className="f-toolbar-right">
            <button className="f-btn">
              <i className="fa-solid fa-file-export" /> Export
            </button>
            <button
              className="f-btn primary"
              onClick={handleBulkSubmit}
              disabled={bulkLoading || selectedIds.size === 0}
            >
              <i
                className={
                  bulkLoading
                    ? "fa-solid fa-spinner fa-spin"
                    : "fa-solid fa-check-double"
                }
              />
              {bulkLoading
                ? "Submitting…"
                : `Bulk Submit${selectedIds.size > 0 ? ` (${selectedIds.size})` : ""}`}
            </button>
          </div>
        </div>

        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>
                  <input type="checkbox" onChange={toggleSelectAll} />
                </th>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Delivery</th>
                <th>Payment</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonRows cols={8} rows={6} />
              ) : filteredBySearch.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <EmptyState
                      icon="fa-coins"
                      title="No COD orders"
                      desc="No orders match the current filter."
                    />
                  </td>
                </tr>
              ) : (
                filteredBySearch.map((c) => (
                  <tr
                    key={c._id}
                    onClick={() =>
                      onOpenOverlay(
                        `${c.orderId} — COD Detail`,
                        <CODDetailContent c={c} />,
                      )
                    }
                  >
                    <td onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(c._id)}
                        onChange={() => toggleSelect(c._id)}
                      />
                    </td>
                    <td>
                      <code className="ref">{c.orderId}</code>
                    </td>
                    <td>{c.customer?.fullName ?? "—"}</td>
                    <td>
                      <strong>{fmt(c.totalAmount)}</strong>
                    </td>
                    <td style={{ fontSize: 10 }}>{fmtDate(c.createdAt)}</td>
                    <td>
                      <Badge label={c.deliveryStatus || "Pending"} />
                    </td>
                    <td>
                      <Badge label={c.paymentStatus} />
                    </td>
                    <td
                      onClick={(e) => e.stopPropagation()}
                      style={{ display: "flex", gap: 3 }}
                    >
                      {c.paymentStatus === "Pending" &&
                        c.deliveryStatus === "Delivered" && (
                          <button
                            className="f-btn primary"
                            style={{ height: 22, fontSize: 9.5 }}
                            onClick={async () => {
                              await financeOrdersAPI.updatePaymentStatus(
                                c._id,
                                "Paid",
                              );
                              load(innerTab, page);
                            }}
                          >
                            <i className="fa-solid fa-check" /> Submit
                          </button>
                        )}
                      <button
                        className="f-btn"
                        style={{ height: 22, fontSize: 9.5 }}
                      >
                        <i className="fa-solid fa-eye" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <FPagination
          current={page}
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

export default CODPanel;
