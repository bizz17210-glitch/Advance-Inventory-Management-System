// CODPanel.tsx — dynamic
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
  COD_SUMMARY,
} from "./shared";
import { shipmentsAPI } from "../../services/api";

const CODPanel: React.FC = () => {
  const [innerTab, setInnerTab] = useState("pending");
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
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [marking, setMarking] = useState(false);
  const PER_PAGE = 10;

  // Map inner tab → COD status filter
  const codStatusMap: Record<string, string | undefined> = {
    pending: "pending",
    collected: "collected",
    disputes: "disputed",
    summary: undefined,
  };

  const fetchShipments = useCallback(async () => {
    if (innerTab === "summary") return;
    setLoading(true);
    setError("");
    try {
      const params: Record<string, any> = {
        page,
        limit: PER_PAGE,
        status: "delivered",
      };
      const codStatus = codStatusMap[innerTab];
      if (codStatus) params.codStatus = codStatus;
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
      setError(e?.response?.data?.message ?? "Failed to load COD data.");
    } finally {
      setLoading(false);
    }
  }, [page, search, innerTab]);

  useEffect(() => {
    fetchShipments();
  }, [fetchShipments]);

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

  const handleMarkCollected = async () => {
    if (selected.size === 0) return;
    setMarking(true);
    try {
      // Update each selected shipment's COD status
      await Promise.all(
        Array.from(selected).map((id) =>
          shipmentsAPI.update(id, { codStatus: "collected" }).catch(() => {}),
        ),
      );
      setSelected(new Set());
      fetchShipments();
    } catch {
      /* silent */
    } finally {
      setMarking(false);
    }
  };

  // KPI totals derived from loaded data
  const totalCOD = shipments.reduce((a, s) => a + (s.codAmount ?? 0), 0);

  const { currentPage, totalPages, totalItems } = pagination;
  const start = (currentPage - 1) * PER_PAGE + 1;
  const end = Math.min(currentPage * PER_PAGE, totalItems);

  const daysOutstanding = (s: ApiShipment) => {
    if (!s.deliveredAt) return 0;
    return Math.floor(
      (Date.now() - new Date(s.deliveredAt).getTime()) / 86400000,
    );
  };

  return (
    <>
      <div className="panel-heading">COD Reconciliation</div>
      <div className="panel-desc">
        Track, verify, and reconcile COD payments owed by each courier. Mark
        collections, flag overdue remittances, and view disputes.
      </div>

      <InnerTabs
        tabs={[
          { id: "pending", label: "Pending Collection" },
          { id: "collected", label: "Collected" },
          { id: "disputes", label: "Disputes" },
          { id: "summary", label: "Summary by Courier" },
        ]}
        active={innerTab}
        onChange={(t) => {
          setInnerTab(t);
          setPage(1);
          setSelected(new Set());
        }}
      />

      {/* ── PENDING ── */}
      {innerTab === "pending" && (
        <>
          {!loading && totalItems > 0 && (
            <div className="mini-stats">
              <div className="mini-stat">
                <div className="ms-label">Total Pending COD</div>
                <div className="ms-value">{fmt(totalCOD)}</div>
                <div className="ms-trend down">Due from couriers</div>
              </div>
              <div className="mini-stat">
                <div className="ms-label">Pending Records</div>
                <div className="ms-value">{totalItems}</div>
                <div className="ms-trend down">Deliveries awaiting</div>
              </div>
              <div className="mini-stat">
                <div className="ms-label">This Page</div>
                <div className="ms-value">
                  {fmt(shipments.reduce((a, s) => a + (s.codAmount ?? 0), 0))}
                </div>
                <div className="ms-trend">Shown</div>
              </div>
              <div className="mini-stat">
                <div className="ms-label">Overdue (&gt;7 days)</div>
                <div className="ms-value">
                  {shipments.filter((s) => daysOutstanding(s) >= 7).length}
                </div>
                <div className="ms-trend down">Escalate</div>
              </div>
            </div>
          )}

          <div className="card">
            <div className="c-toolbar">
              <div className="c-toolbar-left">
                <div className="c-search">
                  <i className="fa-solid fa-magnifying-glass" />
                  <input
                    placeholder="Search order or courier..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                  />
                </div>
                <button className="c-btn active">All</button>
                <button
                  className="c-btn"
                  style={{ color: "var(--red)" }}
                  onClick={() => {
                    /* could add overdue filter */
                  }}
                >
                  Overdue
                </button>
              </div>
              <div className="c-toolbar-right">
                <button className="c-btn" onClick={fetchShipments}>
                  <i className="fa-solid fa-rotate" /> Refresh
                </button>
                <button
                  className="c-btn primary"
                  disabled={selected.size === 0 || marking}
                  onClick={handleMarkCollected}
                >
                  <i
                    className={`fa-solid ${marking ? "fa-spinner fa-spin" : "fa-check-double"}`}
                  />
                  Mark Selected Collected ({selected.size})
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
                          selected.size === shipments.length &&
                          shipments.length > 0
                        }
                        onChange={toggleAll}
                      />
                    </th>
                    <th>Order</th>
                    <th>Tracking No.</th>
                    <th>Courier</th>
                    <th>Customer</th>
                    <th>Delivered On</th>
                    <th>COD Amount</th>
                    <th>Days Outstanding</th>
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
                          onClick={fetchShipments}
                        >
                          Retry
                        </button>
                      </td>
                    </tr>
                  ) : shipments.length === 0 ? (
                    <tr>
                      <td colSpan={9}>
                        <EmptyState
                          icon="fa-coins"
                          title="No pending COD"
                          desc="All COD has been collected."
                        />
                      </td>
                    </tr>
                  ) : (
                    shipments.map((s) => {
                      const days = daysOutstanding(s);
                      return (
                        <tr key={s._id}>
                          <td>
                            <input
                              type="checkbox"
                              checked={selected.has(s._id)}
                              onChange={() => toggleSelect(s._id)}
                            />
                          </td>
                          <td>
                            <strong>
                              {s.orderReference ?? s.orderId ?? "—"}
                            </strong>
                          </td>
                          <td>
                            <code className="sku">
                              {s.trackingNumber ?? "—"}
                            </code>
                          </td>
                          <td>
                            <span className="tag">
                              {s.courierName ??
                                (typeof s.courier === "object"
                                  ? s.courier?.name
                                  : "—")}
                            </span>
                          </td>
                          <td>
                            {s.customer?.name ?? s.customer?.fullName ?? "—"}
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
                            <span
                              style={{
                                fontWeight: 700,
                                color:
                                  days >= 7
                                    ? "var(--red)"
                                    : days >= 5
                                      ? "var(--yellow)"
                                      : "var(--text-primary)",
                              }}
                            >
                              {days} days
                            </span>
                          </td>
                          <td>
                            <button
                              className="c-btn primary"
                              style={{ height: 23, fontSize: 9.5 }}
                              onClick={async () => {
                                try {
                                  await shipmentsAPI.update(s._id, {
                                    codStatus: "collected",
                                  });
                                  fetchShipments();
                                } catch {
                                  alert("Failed to mark as collected.");
                                }
                              }}
                            >
                              <i className="fa-solid fa-check" /> Mark Collected
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
      )}

      {/* ── COLLECTED ── */}
      {innerTab === "collected" && (
        <div className="card">
          {loading ? (
            <div style={{ padding: 24 }}>
              <TableSkeleton rows={4} cols={8} />
            </div>
          ) : shipments.length === 0 ? (
            <div className="card-body">
              <EmptyState
                icon="fa-coins"
                title="No collected COD"
                desc="No COD has been collected yet this period."
              />
            </div>
          ) : (
            <div className="tbl-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Tracking No.</th>
                    <th>Courier</th>
                    <th>Customer</th>
                    <th>Delivered On</th>
                    <th>COD Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {shipments.map((s) => (
                    <tr key={s._id}>
                      <td>
                        <strong>{s.orderReference ?? s.orderId ?? "—"}</strong>
                      </td>
                      <td>
                        <code className="sku">{s.trackingNumber ?? "—"}</code>
                      </td>
                      <td>
                        <span className="tag">{s.courierName ?? "—"}</span>
                      </td>
                      <td>{s.customer?.name ?? s.customer?.fullName ?? "—"}</td>
                      <td style={{ fontSize: 11 }}>
                        {s.deliveredAt
                          ? new Date(s.deliveredAt).toLocaleDateString()
                          : "—"}
                      </td>
                      <td>
                        <strong style={{ color: "var(--green)" }}>
                          {s.codAmount != null ? fmt(s.codAmount) : "—"}
                        </strong>
                      </td>
                      <td>
                        <Badge label={s.codStatus ?? "Collected"} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <CPagination
                current={currentPage}
                total={totalPages}
                totalItems={totalItems}
                start={start}
                end={end}
                onChange={setPage}
              />
            </div>
          )}
        </div>
      )}

      {/* ── DISPUTES ── */}
      {innerTab === "disputes" && (
        <div className="card">
          <div className="card-body">
            {loading ? (
              <TableSkeleton rows={3} cols={7} />
            ) : shipments.length === 0 ? (
              <EmptyState
                icon="fa-scale-balanced"
                title="No disputes"
                desc="No COD disputes found."
              />
            ) : (
              <div className="tbl-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Order</th>
                      <th>Courier</th>
                      <th>Customer</th>
                      <th>COD Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shipments.map((s) => (
                      <tr key={s._id}>
                        <td>
                          <strong>{s.orderReference ?? "—"}</strong>
                        </td>
                        <td>{s.courierName ?? "—"}</td>
                        <td>{s.customer?.name ?? "—"}</td>
                        <td>{s.codAmount != null ? fmt(s.codAmount) : "—"}</td>
                        <td>
                          <Badge label={s.codStatus ?? "Disputed"} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── SUMMARY ── (static fallback — no dedicated endpoint) */}
      {innerTab === "summary" && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <i className="fa-solid fa-table" /> COD Summary by Courier
            </div>
          </div>
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr>
                  <th>Courier</th>
                  <th>Total Delivered</th>
                  <th>COD Amount</th>
                  <th>Collected</th>
                  <th>Pending</th>
                  <th>Overdue</th>
                  <th>Settlement Freq.</th>
                  <th>Last Settlement</th>
                  <th>Next Due</th>
                </tr>
              </thead>
              <tbody>
                {COD_SUMMARY.map((c) => (
                  <tr key={c.courier}>
                    <td>
                      <strong>{c.courier}</strong>
                    </td>
                    <td>{c.delivered}</td>
                    <td>{c.codAmt}</td>
                    <td style={{ color: "var(--green)" }}>{c.collected}</td>
                    <td
                      style={{
                        color:
                          c.pending !== "₨0"
                            ? "var(--yellow)"
                            : "var(--text-primary)",
                      }}
                    >
                      {c.pending}
                    </td>
                    <td
                      style={{
                        color:
                          c.overdue !== "₨0" ? "var(--red)" : "var(--green)",
                      }}
                    >
                      {c.overdue}
                    </td>
                    <td>{c.freq}</td>
                    <td>{c.last}</td>
                    <td>{c.next}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
};

export default CODPanel;
