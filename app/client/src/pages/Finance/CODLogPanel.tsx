import React, { useEffect, useState, useCallback } from "react";
import type { ApiOrderListItem } from "./types";
import {
  Badge,
  FPagination,
  EmptyState,
  fmt,
  fmtDate,
  fmtDateTime,
  SkeletonRows,
  ErrorBanner,
} from "./helpers";
import { financeOrdersAPI } from "../../services/api";

const PER_PAGE = 10;

const CODLogPanel: React.FC = () => {
  const [orders, setOrders] = useState<ApiOrderListItem[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async (pg: number) => {
    setLoading(true);
    setError("");
    try {
      // COD Log = delivered COD orders (payment submitted / paid)
      const res = await financeOrdersAPI.getCODOrders({
        page: pg,
        limit: PER_PAGE,
        deliveryStatus: "Delivered",
      });
      const data = res.data.data;
      setOrders(data.orders || []);
      setTotalItems(data.pagination?.totalItems ?? 0);
      setTotalPages(data.pagination?.totalPages ?? 1);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to load COD log.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(page);
  }, [page, load]);

  const filtered = search
    ? orders.filter((o) =>
        (o.customer?.fullName ?? "")
          .toLowerCase()
          .includes(search.toLowerCase()),
      )
    : orders;

  const start = (page - 1) * PER_PAGE + 1;
  const end = Math.min(page * PER_PAGE, totalItems);

  return (
    <>
      <div className="panel-heading">COD Collection Log</div>
      <div className="panel-desc">
        Log of delivered COD orders. Verify collected amounts and track
        submission status.
      </div>

      {error && <ErrorBanner message={error} onRetry={() => load(page)} />}

      <div className="card">
        <div className="f-toolbar">
          <div className="f-toolbar-left">
            <div className="f-search">
              <i className="fa-solid fa-magnifying-glass" />
              <input
                placeholder="Search customer…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button className="f-btn">
              <i className="fa-solid fa-calendar" /> Date Range
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
                <th>Amount (₨)</th>
                <th>Source</th>
                <th>Delivered</th>
                <th>Payment Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonRows cols={6} rows={6} />
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyState
                      icon="fa-clipboard-check"
                      title="No entries"
                      desc="No delivered COD orders found."
                    />
                  </td>
                </tr>
              ) : (
                filtered.map((o) => (
                  <tr key={o._id}>
                    <td>
                      <code className="ref">{o.orderId}</code>
                    </td>
                    <td>
                      <strong>{o.customer?.fullName ?? "—"}</strong>
                    </td>
                    <td>
                      <strong style={{ color: "var(--green)" }}>
                        {fmt(o.totalAmount)}
                      </strong>
                    </td>
                    <td>
                      <span className="f-tag">{o.source}</span>
                    </td>
                    <td style={{ fontSize: 10 }}>{fmtDate(o.createdAt)}</td>
                    <td>
                      <Badge label={o.paymentStatus} />
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

export default CODLogPanel;
