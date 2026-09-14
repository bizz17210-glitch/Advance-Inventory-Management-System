// DeliveredPanel.tsx — dynamic
import React, { useState, useEffect, useCallback } from "react";
import {
  ApiShipment,
  ApiPagination,
  fmt,
  Badge,
  InnerTabs,
  EmptyState,
  TableSkeleton,
  CPagination,
} from "./shared";
import { shipmentsAPI } from "../../services/api";

const DeliveredPanel: React.FC = () => {
  const [innerTab, setInnerTab] = useState("all");
  const [shipments, setShipments] = useState<ApiShipment[]>([]);
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
  const PER_PAGE = 10;

  const codFilter =
    innerTab === "cod-pend"
      ? "pending"
      : innerTab === "cod-done"
        ? "collected"
        : undefined;

  const fetchDelivered = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, any> = {
        page,
        limit: PER_PAGE,
        status: "delivered",
      };
      if (search) params.search = search;
      if (codFilter) params.codStatus = codFilter;
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
      setError(
        e?.response?.data?.message ?? "Failed to load delivered shipments.",
      );
    } finally {
      setLoading(false);
    }
  }, [page, search, innerTab]);

  useEffect(() => {
    fetchDelivered();
  }, [fetchDelivered]);

  const { currentPage, totalPages, totalItems } = pagination;
  const start = (currentPage - 1) * PER_PAGE + 1;
  const end = Math.min(currentPage * PER_PAGE, totalItems);

  const codPendingCount = totalItems; // when codFilter === 'pending'
  const codCollectedCount = totalItems; // when codFilter === 'collected'

  return (
    <>
      <div className="panel-heading">Delivered</div>
      <div className="panel-desc">
        Confirmed successful deliveries. Verify COD collection status and view
        proof of delivery.
      </div>

      <InnerTabs
        tabs={[
          { id: "all", label: "All Delivered" },
          { id: "cod-pend", label: "COD Not Collected" },
          { id: "cod-done", label: "COD Collected" },
        ]}
        active={innerTab}
        onChange={(t) => {
          setInnerTab(t);
          setPage(1);
        }}
      />

      {/* ── COD NOT COLLECTED ALERT ── */}
      {innerTab === "cod-pend" && totalItems > 0 && (
        <div className="alert-strip warn">
          <i className="fa-solid fa-coins" />
          <strong>{totalItems} deliveries</strong> with COD not yet collected
          from couriers.
        </div>
      )}

      <div className="card">
        <div className="c-toolbar">
          <div className="c-toolbar-left">
            <div className="c-search">
              <i className="fa-solid fa-magnifying-glass" />
              <input
                placeholder="Search tracking, order, customer..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>
          <div className="c-toolbar-right">
            <button className="c-btn" onClick={fetchDelivered}>
              <i className="fa-solid fa-rotate" /> Refresh
            </button>
            <button className="c-btn">
              <i className="fa-solid fa-file-export" /> Export
            </button>
          </div>
        </div>

        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>Tracking No.</th>
                <th>Order</th>
                <th>Customer</th>
                <th>Courier</th>
                <th>Delivered On</th>
                <th>COD Amount</th>
                <th>COD Status</th>
                <th>Proof</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeleton rows={6} cols={9} />
              ) : error ? (
                <tr>
                  <td
                    colSpan={9}
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
                      onClick={fetchDelivered}
                    >
                      Retry
                    </button>
                  </td>
                </tr>
              ) : shipments.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <EmptyState
                      icon="fa-circle-check"
                      title="No delivered shipments"
                      desc="No deliveries match the current filter."
                    />
                  </td>
                </tr>
              ) : (
                shipments.map((s) => (
                  <tr key={s._id}>
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
                    <td style={{ fontSize: 11 }}>
                      {s.deliveredAt
                        ? new Date(s.deliveredAt).toLocaleDateString()
                        : "—"}
                    </td>
                    <td>
                      <strong>
                        {s.codAmount != null ? fmt(s.codAmount) : "—"}
                      </strong>
                    </td>
                    <td>
                      <Badge label={s.codStatus ?? "Pending"} />
                    </td>
                    <td>
                      <span
                        className={`badge ${s.proofOfDelivery ? "green" : "gray"}`}
                      >
                        {s.proofOfDelivery ? "Available" : "None"}
                      </span>
                    </td>
                    <td>
                      <button
                        className="c-btn"
                        style={{ height: 22, fontSize: 9.5 }}
                        title="Record COD Collection"
                      >
                        <i className="fa-solid fa-coins" />
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

export default DeliveredPanel;
