// ReturnsPanel.tsx — dynamic
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

const ReturnsPanel: React.FC = () => {
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

  const fetchReturns = useCallback(async () => {
    if (innerTab === "reasons") return;
    setLoading(true);
    setError("");
    try {
      const params: Record<string, any> = {
        page,
        limit: PER_PAGE,
        status: "returned",
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
      setError(e?.response?.data?.message ?? "Failed to load returns.");
    } finally {
      setLoading(false);
    }
  }, [page, search, innerTab]);

  useEffect(() => {
    fetchReturns();
  }, [fetchReturns]);

  const { currentPage, totalPages, totalItems } = pagination;
  const start = (currentPage - 1) * PER_PAGE + 1;
  const end = Math.min(currentPage * PER_PAGE, totalItems);

  // derive reason breakdown from loaded data
  const reasonCounts: Record<string, number> = {};
  shipments.forEach((s) => {
    const r = (s as any).returnReason ?? "Unknown";
    reasonCounts[r] = (reasonCounts[r] ?? 0) + 1;
  });
  const rtoReasons = Object.entries(reasonCounts).map(([r, n]) => ({ r, n }));

  return (
    <>
      <div className="panel-heading">Returns / RTO</div>
      <div className="panel-desc">
        Shipments returned to origin. Log receipt, process restocking, analyze
        return reasons, and track courier charges.
      </div>

      <InnerTabs
        tabs={[
          { id: "all", label: "All Returns" },
          { id: "pending", label: "Awaiting Receipt" },
          { id: "received", label: "Received & Processed" },
          { id: "reasons", label: "Return Reasons" },
        ]}
        active={innerTab}
        onChange={(t) => {
          setInnerTab(t);
          setPage(1);
        }}
      />

      {/* ── ALL RETURNS ── */}
      {innerTab !== "reasons" && (
        <>
          {totalItems > 0 && (
            <div className="mini-stats">
              <div className="mini-stat">
                <div className="ms-label">Total RTO</div>
                <div className="ms-value">{totalItems}</div>
                <div className="ms-trend">Returned shipments</div>
              </div>
              <div className="mini-stat">
                <div className="ms-label">This Page</div>
                <div className="ms-value">{shipments.length}</div>
                <div className="ms-trend">Loaded records</div>
              </div>
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
                <button className="c-btn" onClick={fetchReturns}>
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
                    <th>Return Reason</th>
                    <th>Dispatched</th>
                    <th>Returned On</th>
                    <th>COD Recovered</th>
                    <th>Status</th>
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
                          onClick={fetchReturns}
                        >
                          Retry
                        </button>
                      </td>
                    </tr>
                  ) : shipments.length === 0 ? (
                    <tr>
                      <td colSpan={10}>
                        <EmptyState
                          icon="fa-rotate-left"
                          title="No returns found"
                          desc="No returned shipments match the current filter."
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
                          <strong>
                            {s.orderReference ?? s.orderId ?? "—"}
                          </strong>
                        </td>
                        <td>
                          {s.customer?.name ?? s.customer?.fullName ?? "—"}
                        </td>
                        <td>
                          <span className="tag">
                            {s.courierName ??
                              (typeof s.courier === "object"
                                ? s.courier?.name
                                : "—")}
                          </span>
                        </td>
                        <td>{(s as any).returnReason ?? "—"}</td>
                        <td style={{ fontSize: 11 }}>
                          {s.dispatchedAt
                            ? new Date(s.dispatchedAt).toLocaleDateString()
                            : "—"}
                        </td>
                        <td style={{ fontSize: 11 }}>
                          {s.updatedAt
                            ? new Date(s.updatedAt).toLocaleDateString()
                            : "—"}
                        </td>
                        <td>
                          {s.codAmount != null
                            ? `₨${Number(s.codAmount).toLocaleString()}`
                            : "—"}
                        </td>
                        <td>
                          <Badge label={s.currentStatus} />
                        </td>
                        <td>
                          <button
                            className="c-btn"
                            style={{ height: 22, fontSize: 9.5 }}
                          >
                            <i className="fa-solid fa-plus" /> Restock
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
      )}

      {/* ── RETURN REASONS ── */}
      {innerTab === "reasons" && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <i className="fa-solid fa-chart-pie" /> Return Reason Analysis
            </div>
          </div>
          <div className="card-body">
            {rtoReasons.length === 0 ? (
              <EmptyState
                icon="fa-chart-pie"
                title="No return data"
                desc="Load the All Returns tab first to see reason breakdown."
              />
            ) : (
              rtoReasons.map((x) => (
                <div
                  key={x.r}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 10,
                  }}
                >
                  <div
                    style={{
                      width: 160,
                      fontSize: 10.5,
                      color: "var(--text-secondary)",
                    }}
                  >
                    {x.r}
                  </div>
                  <div className="perf-bar">
                    <div
                      className="perf-fill"
                      style={{
                        width: `${(x.n / totalItems) * 100}%`,
                        background: "var(--red)",
                      }}
                    />
                  </div>
                  <div
                    style={{
                      width: 24,
                      fontSize: 10.5,
                      fontWeight: 700,
                      textAlign: "right",
                    }}
                  >
                    {x.n}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default ReturnsPanel;
