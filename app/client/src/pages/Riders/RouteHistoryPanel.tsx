// RouteHistoryPanel.tsx — dynamic
import React, { useState, useCallback, useEffect } from "react";
import {
  ApiRider,
  ApiDelivery,
  ApiPagination,
  RIDERS,
  riderStatusLabel,
  badgeClass,
  Badge,
  InnerTabs,
  CPagination,
  EmptyState,
  TableSkeleton,
} from "./shared";
import { ridersAPI } from "../../services/api";

interface RiderDelivery {
  _id: string;
  trackingNumber?: string;
  orderReference?: string;
  currentStatus: string;
  customer?: { name?: string; phone?: string };
  shippingAddress?: { city?: string; street?: string };
  codAmount?: number;
  estimatedDelivery?: string;
  createdAt?: string;
  updatedAt?: string;
}

const RouteHistoryPanel: React.FC = () => {
  const [innerTab, setInnerTab] = useState("all");
  const [riders, setRiders] = useState<ApiRider[]>([]);
  const [deliveries, setDeliveries] = useState<RiderDelivery[]>([]);
  const [selectedRider, setSelectedRider] = useState("");
  const [pagination, setPagination] = useState<ApiPagination>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  });
  const [loading, setLoading] = useState(false);
  const [loadingDeliveries, setLoadingDeliveries] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const PER_PAGE = 10;

  // Load riders for the dropdown
  const fetchRiders = useCallback(async () => {
    try {
      const res = await ridersAPI.getAll({ limit: 50 });
      setRiders(res.data?.data?.riders ?? []);
    } catch {}
  }, []);

  useEffect(() => {
    fetchRiders();
  }, [fetchRiders]);

  // Load deliveries for selected rider
  const fetchDeliveries = useCallback(async () => {
    if (!selectedRider) return;
    setLoadingDeliveries(true);
    setError("");
    try {
      const params: Record<string, any> = { page, limit: PER_PAGE };
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;
      const res = await ridersAPI.getDeliveries(selectedRider, params);
      const data = res.data?.data;
      setDeliveries(data?.deliveries ?? []);
      setPagination(
        data?.pagination ?? {
          currentPage: 1,
          totalPages: 1,
          totalItems: 0,
          itemsPerPage: PER_PAGE,
        },
      );
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Failed to load deliveries.");
    } finally {
      setLoadingDeliveries(false);
    }
  }, [selectedRider, page, statusFilter, search]);

  useEffect(() => {
    fetchDeliveries();
  }, [fetchDeliveries]);

  const { currentPage, totalPages, totalItems } = pagination;
  const start = (currentPage - 1) * PER_PAGE + 1;
  const end = Math.min(currentPage * PER_PAGE, totalItems);

  const statusColor = (s: string) => {
    const m: Record<string, string> = {
      delivered: "var(--green)",
      in_transit: "var(--accent)",
      out_for_delivery: "var(--blue)",
      failed: "var(--red)",
      returned: "var(--red)",
      assigned: "var(--yellow)",
      picked_up: "var(--yellow)",
    };
    return m[s] ?? "var(--text-muted)";
  };

  const fmtStatus = (s: string) =>
    s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const selectedRiderObj = riders.find((r) => r._id === selectedRider);

  return (
    <>
      <div className="panel-heading">Route History</div>
      <div className="panel-desc">
        View historical delivery routes taken by riders. Useful for verifying
        delivery paths, analyzing efficiency, and resolving customer disputes.
      </div>

      <InnerTabs
        tabs={[
          { id: "all", label: "All Deliveries" },
          { id: "rider", label: "By Rider" },
        ]}
        active={innerTab}
        onChange={(t) => {
          setInnerTab(t);
          setPage(1);
        }}
      />

      {/* ── ALL DELIVERIES (rider selector required) ── */}
      {innerTab === "all" && (
        <div className="card">
          <div className="c-toolbar">
            <div className="c-toolbar-left">
              <div className="c-search">
                <i className="fa-solid fa-magnifying-glass" />
                <input
                  placeholder="Search order or rider..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
              <select
                className="c-form-select"
                style={{ height: 27, fontSize: 10.5 }}
                value={selectedRider}
                onChange={(e) => {
                  setSelectedRider(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">— Select Rider —</option>
                {riders.map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.fullName}
                  </option>
                ))}
              </select>
              {(
                ["", "delivered", "in_transit", "failed", "returned"] as const
              ).map((f) => (
                <button
                  key={f}
                  className={`c-btn ${statusFilter === f ? "active" : ""}`}
                  onClick={() => {
                    setStatusFilter(f);
                    setPage(1);
                  }}
                >
                  {f === "" ? "All" : fmtStatus(f)}
                </button>
              ))}
            </div>
            <div className="c-toolbar-right">
              <button className="c-btn" onClick={fetchDeliveries}>
                <i className="fa-solid fa-rotate" /> Refresh
              </button>
            </div>
          </div>

          {error && (
            <div className="alert-strip danger" style={{ borderRadius: 0 }}>
              <i className="fa-solid fa-circle-exclamation" /> {error}
              <button
                className="c-btn"
                style={{ marginLeft: "auto" }}
                onClick={fetchDeliveries}
              >
                Retry
              </button>
            </div>
          )}

          {!selectedRider ? (
            <div className="card-body">
              <EmptyState
                icon="fa-route"
                title="Select a Rider"
                desc="Choose a rider from the dropdown above to view their delivery history."
              />
            </div>
          ) : (
            <>
              <div className="tbl-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Tracking #</th>
                      <th>Order Ref</th>
                      <th>Customer</th>
                      <th>City</th>
                      <th>COD Amount</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingDeliveries ? (
                      <TableSkeleton rows={6} cols={8} />
                    ) : deliveries.length === 0 ? (
                      <tr>
                        <td colSpan={8}>
                          <EmptyState
                            icon="fa-truck"
                            title="No Deliveries Found"
                            desc="No delivery records match your filters."
                          />
                        </td>
                      </tr>
                    ) : (
                      deliveries.map((d) => (
                        <tr key={d._id}>
                          <td>
                            <code className="sku">
                              {d.trackingNumber ?? "—"}
                            </code>
                          </td>
                          <td>
                            <strong>{d.orderReference ?? "—"}</strong>
                          </td>
                          <td>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: 11 }}>
                                {d.customer?.name ?? "—"}
                              </div>
                              <div className="td-sub">
                                {d.customer?.phone ?? ""}
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="tag">
                              {d.shippingAddress?.city ?? "—"}
                            </span>
                          </td>
                          <td>
                            <strong>
                              {d.codAmount
                                ? `₨${Number(d.codAmount).toLocaleString()}`
                                : "—"}
                            </strong>
                          </td>
                          <td>
                            <span
                              style={{
                                fontSize: 10.5,
                                fontWeight: 600,
                                color: statusColor(d.currentStatus),
                              }}
                            >
                              {fmtStatus(d.currentStatus)}
                            </span>
                          </td>
                          <td style={{ fontSize: 10.5 }}>
                            {d.createdAt
                              ? new Date(d.createdAt).toLocaleDateString(
                                  "en-GB",
                                  {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  },
                                )
                              : "—"}
                          </td>
                          <td>
                            <button
                              className="c-btn"
                              style={{ height: 22, fontSize: 9.5 }}
                            >
                              <i className="fa-solid fa-map" /> View
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <CPagination
                  current={currentPage}
                  total={totalPages}
                  totalItems={totalItems}
                  start={start}
                  end={end}
                  onChange={setPage}
                />
              )}
            </>
          )}
        </div>
      )}

      {/* ── BY RIDER ── */}
      {innerTab === "rider" && (
        <div className="detail-grid-2">
          {/* Rider list */}
          <div className="card" style={{ marginBottom: 0 }}>
            <div className="card-header">
              <div className="card-title">
                <i className="fa-solid fa-person-biking" /> Select Rider
              </div>
            </div>
            <div className="card-body" style={{ padding: "8px 14px" }}>
              {riders.length === 0 ? (
                <EmptyState
                  icon="fa-person-biking"
                  title="No Riders"
                  desc="No riders available."
                />
              ) : (
                riders.map((r) => (
                  <div
                    key={r._id}
                    className="list-item"
                    style={{
                      cursor: "pointer",
                      background:
                        selectedRider === r._id ? "var(--bg)" : "transparent",
                      borderRadius: 5,
                      padding: "7px 8px",
                    }}
                    onClick={() => {
                      setSelectedRider(r._id);
                      setPage(1);
                    }}
                  >
                    <div
                      className="row-avatar"
                      style={{
                        background: "#FF6A00",
                        width: 28,
                        height: 28,
                        fontSize: 10,
                      }}
                    >
                      {r.fullName
                        .split(" ")
                        .map((w: string) => w[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </div>
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
                          fontSize: 9,
                          color: "var(--text-muted)",
                          marginTop: 2,
                        }}
                      >
                        {r.performanceMetrics?.totalDeliveries ?? 0} total
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Deliveries panel */}
          <div className="card" style={{ marginBottom: 0 }}>
            <div className="card-header">
              <div className="card-title">
                <i className="fa-solid fa-route" />
                {selectedRiderObj
                  ? ` ${selectedRiderObj.fullName}'s Deliveries`
                  : " Delivery History"}
              </div>
              {selectedRider && (
                <button className="c-btn" onClick={fetchDeliveries}>
                  <i className="fa-solid fa-rotate" /> Refresh
                </button>
              )}
            </div>
            {!selectedRider ? (
              <div className="card-body">
                <EmptyState
                  icon="fa-route"
                  title="Select a Rider"
                  desc="Click a rider on the left to view their history."
                />
              </div>
            ) : loadingDeliveries ? (
              <div
                style={{
                  padding: 20,
                  textAlign: "center",
                  color: "var(--text-muted)",
                  fontSize: 11,
                }}
              >
                <i className="fa-solid fa-spinner fa-spin" /> Loading...
              </div>
            ) : (
              <div className="tbl-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Order Ref</th>
                      <th>City</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deliveries.length === 0 ? (
                      <tr>
                        <td colSpan={4}>
                          <EmptyState
                            icon="fa-truck"
                            title="No Deliveries"
                            desc="No records found for this rider."
                          />
                        </td>
                      </tr>
                    ) : (
                      deliveries.map((d) => (
                        <tr key={d._id}>
                          <td>
                            <strong>
                              {d.orderReference ?? d.trackingNumber ?? "—"}
                            </strong>
                          </td>
                          <td>
                            <span className="tag">
                              {d.shippingAddress?.city ?? "—"}
                            </span>
                          </td>
                          <td>
                            <span
                              style={{
                                fontSize: 10.5,
                                fontWeight: 600,
                                color: statusColor(d.currentStatus),
                              }}
                            >
                              {fmtStatus(d.currentStatus)}
                            </span>
                          </td>
                          <td style={{ fontSize: 10.5 }}>
                            {d.createdAt
                              ? new Date(d.createdAt).toLocaleDateString(
                                  "en-GB",
                                  { day: "2-digit", month: "short" },
                                )
                              : "—"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                {totalPages > 1 && (
                  <CPagination
                    current={currentPage}
                    total={totalPages}
                    totalItems={totalItems}
                    start={start}
                    end={end}
                    onChange={setPage}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default RouteHistoryPanel;
