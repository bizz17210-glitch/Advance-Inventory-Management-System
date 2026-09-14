import React, { useState, useEffect, useCallback } from "react";
import type { ApiOrderListItem } from "./types";
import {
  Badge,
  FPagination,
  EmptyState,
  fmt,
  fmtDate,
  SkeletonRows,
  ErrorBanner,
} from "./helpers";
import { financeOrdersAPI } from "../../services/api";

const PER_PAGE = 10;

const PrepaidPanel: React.FC = () => {
  const [orders, setOrders] = useState<ApiOrderListItem[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "pending">("all");
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async (pg: number, f: "all" | "pending") => {
    setLoading(true);
    setError("");
    try {
      const params: any = { page: pg, limit: PER_PAGE };
      if (f === "pending") params.paymentStatus = "Pending";

      const res = await financeOrdersAPI.getPrepaidOrders(params);
      const data = res.data.data;
      setOrders(data.orders || []);
      setTotalItems(data.pagination?.totalItems ?? 0);
      setTotalPages(data.pagination?.totalPages ?? 1);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to load prepaid orders.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(page, filter);
  }, [page, filter, load]);

  const filtered = search
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

  const handleVerify = async (id: string) => {
    try {
      await financeOrdersAPI.updatePaymentStatus(id, "Paid");
      load(page, filter);
    } catch {
      /* silent */
    }
  };

  return (
    <>
      <div className="panel-heading">Prepaid Orders</div>
      <div className="panel-desc">
        Track online and bank-transfer prepaid order payments. Verify payment
        received before dispatching orders.
      </div>

      {error && (
        <ErrorBanner message={error} onRetry={() => load(page, filter)} />
      )}

      <div className="mini-stats cols-3">
        <div className="mini-stat">
          <div className="ms-label">Total Prepaid Orders</div>
          <div className="ms-value" style={{ color: "var(--blue)" }}>
            {loading ? "…" : totalItems}
          </div>
        </div>
        <div className="mini-stat">
          <div className="ms-label">Payment Verified</div>
          <div className="ms-value" style={{ color: "var(--green)" }}>
            {loading
              ? "…"
              : orders.filter((o) => o.paymentStatus === "Paid").length}
          </div>
          <div className="ms-trend up">
            <i className="fa-solid fa-circle-check" /> on this page
          </div>
        </div>
        <div className="mini-stat">
          <div className="ms-label">Pending Verification</div>
          <div className="ms-value" style={{ color: "var(--yellow)" }}>
            {loading
              ? "…"
              : orders.filter((o) => o.paymentStatus === "Pending").length}
          </div>
          <div className="ms-trend">awaiting on this page</div>
        </div>
      </div>

      <div className="card">
        <div className="f-toolbar">
          <div className="f-toolbar-left">
            <div className="f-search">
              <i className="fa-solid fa-magnifying-glass" />
              <input
                placeholder="Search order or customer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button
              className={`f-btn ${filter === "all" ? "active" : ""}`}
              onClick={() => {
                setFilter("all");
                setPage(1);
              }}
            >
              All
            </button>
            <button
              className={`f-btn ${filter === "pending" ? "active" : ""}`}
              onClick={() => {
                setFilter("pending");
                setPage(1);
              }}
            >
              Pending Verification
            </button>
          </div>
          <div className="f-toolbar-right">
            <button className="f-btn">
              <i className="fa-solid fa-file-export" /> Export
            </button>
          </div>
        </div>

        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Source</th>
                <th>Payment Method</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonRows cols={8} rows={6} />
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <EmptyState
                      icon="fa-credit-card"
                      title="No prepaid orders"
                      desc="No orders match the current filter."
                    />
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p._id}>
                    <td>
                      <code className="ref">{p.orderId}</code>
                    </td>
                    <td>
                      <strong>{p.customer?.fullName ?? "—"}</strong>
                    </td>
                    <td>
                      <strong>{fmt(p.totalAmount)}</strong>
                    </td>
                    <td>
                      <span className="f-tag">{p.source}</span>
                    </td>
                    <td>{p.paymentMethod}</td>
                    <td style={{ fontSize: 10 }}>{fmtDate(p.createdAt)}</td>
                    <td>
                      <Badge label={p.paymentStatus} />
                    </td>
                    <td>
                      {p.paymentStatus === "Pending" ? (
                        <button
                          className="f-btn primary"
                          style={{ height: 22, fontSize: 9.5 }}
                          onClick={() => handleVerify(p._id)}
                        >
                          <i className="fa-solid fa-check" /> Verify
                        </button>
                      ) : (
                        <button
                          className="f-btn"
                          style={{ height: 22, fontSize: 9.5 }}
                        >
                          <i className="fa-solid fa-eye" />
                        </button>
                      )}
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

export default PrepaidPanel;
