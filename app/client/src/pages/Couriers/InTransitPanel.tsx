// InTransitPanel.tsx — dynamic
import React, { useState, useEffect, useCallback } from "react";
import {
  ApiShipment,
  ApiPagination,
  Badge,
  InnerTabs,
  EmptyState,
  TableSkeleton,
  CPagination,
} from "./shared";
import { shipmentsAPI } from "../../services/api";

const InTransitPanel: React.FC = () => {
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
  const [syncing, setSyncing] = useState(false);
  const PER_PAGE = 10;

  // map inner tabs to API status values
  const statusMap: Record<string, string> = {
    all: "in_transit",
    delayed: "in_transit", // we filter client-side by overdue
    ofd: "out_for_delivery",
  };

  const fetchShipments = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, any> = {
        page,
        limit: PER_PAGE,
        status: statusMap[innerTab] ?? "in_transit",
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
        e?.response?.data?.message ?? "Failed to load in-transit shipments.",
      );
    } finally {
      setLoading(false);
    }
  }, [page, search, innerTab]);

  useEffect(() => {
    fetchShipments();
  }, [fetchShipments]);

  const handleSyncTracking = async () => {
    setSyncing(true);
    try {
      const { integrationsAPI } = await import("../../services/api");
      await integrationsAPI.syncAfterShip();
      fetchShipments();
    } catch {
      /* silent */
    } finally {
      setSyncing(false);
    }
  };

  const isDelayed = (s: ApiShipment) => {
    if (!s.estimatedDelivery) return false;
    return new Date(s.estimatedDelivery) < new Date();
  };

  const daysLeft = (s: ApiShipment) => {
    if (!s.estimatedDelivery) return null;
    const diff = Math.ceil(
      (new Date(s.estimatedDelivery).getTime() - Date.now()) / 86400000,
    );
    return diff;
  };

  const delayedCount = shipments.filter(isDelayed).length;

  const { currentPage, totalPages, totalItems } = pagination;
  const start = (currentPage - 1) * PER_PAGE + 1;
  const end = Math.min(currentPage * PER_PAGE, totalItems);

  const displayShipments =
    innerTab === "delayed" ? shipments.filter(isDelayed) : shipments;

  return (
    <>
      <div className="panel-heading">In Transit</div>
      <div className="panel-desc">
        Shipments currently on the way to customers. Monitor location, expected
        delivery, and flag delayed shipments.
      </div>

      <InnerTabs
        tabs={[
          { id: "all", label: "All In Transit" },
          {
            id: "delayed",
            label: (
              <span>
                Delayed{" "}
                {delayedCount > 0 && (
                  <span
                    style={{
                      background: "var(--red-bg)",
                      color: "var(--red)",
                      padding: "1px 5px",
                      borderRadius: 8,
                      fontSize: 9,
                      marginLeft: 3,
                    }}
                  >
                    {delayedCount}
                  </span>
                )}
              </span>
            ),
          },
          { id: "ofd", label: "Out for Delivery" },
        ]}
        active={innerTab}
        onChange={(t) => {
          setInnerTab(t);
          setPage(1);
        }}
      />

      {innerTab === "delayed" && delayedCount > 0 && (
        <div className="alert-strip danger">
          <i className="fa-solid fa-circle-xmark" />
          <strong>{delayedCount} shipments</strong> are past their estimated
          delivery date. Contact couriers immediately.
        </div>
      )}

      <div className="card">
        <div className="c-toolbar">
          <div className="c-toolbar-left">
            <div className="c-search">
              <i className="fa-solid fa-magnifying-glass" />
              <input
                placeholder="Search tracking no, order, customer..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>
          <div className="c-toolbar-right">
            <button
              className="c-btn"
              onClick={handleSyncTracking}
              disabled={syncing}
            >
              <i
                className={`fa-solid ${syncing ? "fa-spinner fa-spin" : "fa-rotate"}`}
              />{" "}
              Sync Tracking
            </button>
            <button className="c-btn" onClick={fetchShipments}>
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
                <th>Courier</th>
                <th>Destination</th>
                <th>Status</th>
                <th>Dispatched</th>
                <th>Est. Delivery</th>
                <th>Days Left</th>
                <th>COD</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeleton rows={5} cols={11} />
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
              ) : displayShipments.length === 0 ? (
                <tr>
                  <td colSpan={11}>
                    <EmptyState
                      icon={
                        innerTab === "delayed"
                          ? "fa-truck"
                          : "fa-person-walking-arrow-right"
                      }
                      title={
                        innerTab === "delayed"
                          ? "No delayed shipments"
                          : innerTab === "ofd"
                            ? "None out for delivery"
                            : "No shipments in transit"
                      }
                      desc="All caught up!"
                    />
                  </td>
                </tr>
              ) : (
                displayShipments.map((s) => {
                  const dl = daysLeft(s);
                  const late = dl !== null && dl < 0;
                  const today = dl !== null && dl === 0;
                  return (
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
                      <td>
                        <span
                          style={{
                            fontWeight: 700,
                            color: late
                              ? "var(--red)"
                              : today
                                ? "var(--yellow)"
                                : "var(--text-primary)",
                          }}
                        >
                          {dl === null
                            ? "—"
                            : late
                              ? `${Math.abs(dl)}d late`
                              : today
                                ? "Today"
                                : `${dl}d`}
                        </span>
                      </td>
                      <td>
                        {s.codAmount != null
                          ? `₨${Number(s.codAmount).toLocaleString()}`
                          : "—"}
                      </td>
                      <td>
                        <button
                          className="c-btn"
                          style={{ height: 22, fontSize: 9.5 }}
                          title="Track"
                        >
                          <i className="fa-solid fa-location-dot" />
                        </button>
                      </td>
                    </tr>
                  );
                })
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

export default InTransitPanel;
