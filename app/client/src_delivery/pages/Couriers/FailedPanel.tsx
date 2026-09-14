// FailedPanel.tsx — dynamic
import React, { useState, useEffect, useCallback } from "react";
import {
  ApiShipment,
  ApiPagination,
  Badge,
  EmptyState,
  TableSkeleton,
  CPagination,
} from "./shared";
import { shipmentsAPI } from "../../services/api";

const FailedPanel: React.FC = () => {
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
  const [acting, setActing] = useState<string | null>(null);
  const PER_PAGE = 10;

  const fetchFailed = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, any> = {
        page,
        limit: PER_PAGE,
        status: "failed",
      };
      if (search) params.search = search;
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
        e?.response?.data?.message ?? "Failed to load failed deliveries.",
      );
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchFailed();
  }, [fetchFailed]);

  const handleUpdateStatus = async (
    shipmentId: string,
    status: "returned" | "assigned",
  ) => {
    setActing(shipmentId);
    try {
      await shipmentsAPI.updateStatus(shipmentId, {
        status,
        description:
          status === "returned"
            ? "Marked as returned after failed delivery"
            : "Re-dispatched after failed delivery",
      });
      fetchFailed();
    } catch (e: any) {
      alert(e?.response?.data?.message ?? "Action failed.");
    } finally {
      setActing(null);
    }
  };

  const { currentPage, totalPages, totalItems } = pagination;
  const start = (currentPage - 1) * PER_PAGE + 1;
  const end = Math.min(currentPage * PER_PAGE, totalItems);

  return (
    <>
      <div className="panel-heading">Failed Deliveries</div>
      <div className="panel-desc">
        Delivery attempts that could not be completed after maximum attempts.
        Re-dispatch or cancel.
      </div>

      {totalItems > 0 && (
        <div className="alert-strip danger">
          <i className="fa-solid fa-circle-xmark" />
          <strong>{totalItems} deliveries</strong> failed. Review and take
          action immediately.
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
            <button className="c-btn" onClick={fetchFailed}>
              <i className="fa-solid fa-rotate" /> Refresh
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
                <th>Phone</th>
                <th>Courier</th>
                <th>City</th>
                <th>Last Attempt</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeleton rows={5} cols={9} />
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
                      onClick={fetchFailed}
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
                      title="No failed deliveries"
                      desc="All deliveries are on track."
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
                    <td style={{ fontSize: 10.5 }}>
                      {s.customer?.phone ?? "—"}
                    </td>
                    <td>
                      <span className="tag">
                        {s.courierName ??
                          (typeof s.courier === "object"
                            ? s.courier?.name
                            : "—")}
                      </span>
                    </td>
                    <td>{s.shippingAddress?.city ?? "—"}</td>
                    <td style={{ fontSize: 11 }}>
                      {s.updatedAt
                        ? new Date(s.updatedAt).toLocaleDateString()
                        : "—"}
                    </td>
                    <td>
                      <Badge label={s.currentStatus} />
                    </td>
                    <td style={{ display: "flex", gap: 4 }}>
                      <button
                        className="c-btn primary"
                        style={{ height: 23, fontSize: 9.5 }}
                        disabled={acting === s._id}
                        onClick={() => handleUpdateStatus(s._id, "assigned")}
                      >
                        {acting === s._id ? (
                          <i className="fa-solid fa-spinner fa-spin" />
                        ) : (
                          <>
                            <i className="fa-solid fa-truck" /> Re-dispatch
                          </>
                        )}
                      </button>
                      <button
                        className="c-btn"
                        style={{
                          height: 23,
                          fontSize: 9.5,
                          color: "var(--red)",
                        }}
                        disabled={acting === s._id}
                        onClick={() => handleUpdateStatus(s._id, "returned")}
                      >
                        <i className="fa-solid fa-rotate-left" /> RTO
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

export default FailedPanel;
