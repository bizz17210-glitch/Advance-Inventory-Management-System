// CompletedPanel.tsx — dynamic
import React, { useState, useEffect, useCallback } from "react";
import {
  ApiRider,
  ApiPagination,
  Badge,
  InnerTabs,
  EmptyState,
  CPagination,
  TableSkeleton,
  ApiRiderAvatar,
} from "./shared";
import { ridersAPI } from "../../services/api";

interface CompletedDelivery {
  _id: string;
  trackingNumber?: string;
  orderReference?: string;
  currentStatus: string;
  customer?: { name?: string; phone?: string };
  shippingAddress?: { city?: string };
  codAmount?: number;
  createdAt?: string;
  updatedAt?: string;
  riderId?: string;
  riderName?: string;
}

const fmt = (n: number) => "₨" + Number(n).toLocaleString();

const CompletedPanel: React.FC = () => {
  const [innerTab, setInnerTab] = useState("all");
  const [riders, setRiders] = useState<ApiRider[]>([]);
  const [deliveries, setDeliveries] = useState<CompletedDelivery[]>([]);
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
  const [filterRider, setFilterRider] = useState("");
  const PER_PAGE = 10;

  // Fetch riders list first
  const loadRiders = useCallback(async () => {
    try {
      const res = await ridersAPI.getAll({ limit: 50 });
      setRiders(res.data?.data?.riders ?? []);
    } catch {
      /* silent */
    }
  }, []);

  // Fetch completed deliveries for selected rider (or all if none selected)
  const loadDeliveries = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const targetRiders = filterRider
        ? [filterRider]
        : riders.map((r) => r._id).slice(0, 5); // limit to first 5 riders to avoid too many requests

      if (targetRiders.length === 0) {
        setLoading(false);
        return;
      }

      const promises = targetRiders.map((riderId) =>
        ridersAPI
          .getDeliveries(riderId, {
            limit: PER_PAGE,
            status: "delivered",
            page,
          })
          .then((res) => {
            const rider = riders.find((r) => r._id === riderId);
            return (res.data?.data?.deliveries ?? []).map((d: any) => ({
              ...d,
              riderId,
              riderName: rider?.fullName ?? "—",
            })) as CompletedDelivery[];
          })
          .catch(() => [] as CompletedDelivery[]),
      );

      const results = await Promise.all(promises);
      const flat = results.flat();

      // Client-side search filter
      const filtered = search
        ? flat.filter(
            (d) =>
              (d.orderReference ?? "")
                .toLowerCase()
                .includes(search.toLowerCase()) ||
              (d.riderName ?? "")
                .toLowerCase()
                .includes(search.toLowerCase()) ||
              (d.customer?.name ?? "")
                .toLowerCase()
                .includes(search.toLowerCase()),
          )
        : flat;

      setDeliveries(filtered);
      setPagination({
        currentPage: page,
        totalPages: Math.ceil(filtered.length / PER_PAGE) || 1,
        totalItems: filtered.length,
        itemsPerPage: PER_PAGE,
      });
    } catch (e: any) {
      setError(
        e?.response?.data?.message ?? "Failed to load completed deliveries.",
      );
    } finally {
      setLoading(false);
    }
  }, [riders, page, search, filterRider]);

  useEffect(() => {
    loadRiders();
  }, [loadRiders]);
  useEffect(() => {
    if (riders.length > 0 && (innerTab === "all" || innerTab === "today")) {
      loadDeliveries();
    }
  }, [loadDeliveries, innerTab, riders]);

  const { currentPage, totalPages, totalItems } = pagination;
  const pageItems = deliveries.slice(
    (currentPage - 1) * PER_PAGE,
    currentPage * PER_PAGE,
  );
  const start = totalItems > 0 ? (currentPage - 1) * PER_PAGE + 1 : 0;
  const end = Math.min(currentPage * PER_PAGE, totalItems);

  // Today's filter
  const todayISO = new Date().toDateString();
  const todayDeliveries = deliveries.filter(
    (d) => d.updatedAt && new Date(d.updatedAt).toDateString() === todayISO,
  );

  // COD pending (delivered but codAmount > 0 — simplification)
  const codPending = deliveries.filter((d) => d.codAmount && d.codAmount > 0);
  const totalCOD = codPending.reduce((s, d) => s + (d.codAmount ?? 0), 0);

  return (
    <>
      <div className="panel-heading">Completed Deliveries</div>
      <div className="panel-desc">
        All deliveries successfully completed by internal riders. Verify COD
        collection, customer confirmation, and close out delivery records.
      </div>

      <InnerTabs
        tabs={[
          { id: "all", label: "All Completed" },
          { id: "cod-pend", label: "COD Collected" },
          { id: "today", label: "Today" },
        ]}
        active={innerTab}
        onChange={(t) => {
          setInnerTab(t);
          setPage(1);
        }}
      />

      {/* ── ALL COMPLETED ── */}
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
                value={filterRider}
                onChange={(e) => {
                  setFilterRider(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Riders</option>
                {riders.map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.fullName}
                  </option>
                ))}
              </select>
              <button className="c-btn" onClick={loadDeliveries}>
                <i className="fa-solid fa-rotate" /> Refresh
              </button>
            </div>
            <div className="c-toolbar-right">
              <button className="c-btn">
                <i className="fa-solid fa-file-export" /> Export
              </button>
            </div>
          </div>

          {error && (
            <div className="alert-strip danger" style={{ borderRadius: 0 }}>
              <i className="fa-solid fa-circle-exclamation" /> {error}
              <button
                className="c-btn"
                style={{ marginLeft: "auto" }}
                onClick={loadDeliveries}
              >
                Retry
              </button>
            </div>
          )}

          <div className="tbl-wrap">
            <table>
              <thead>
                <tr>
                  <th>Order Ref</th>
                  <th>Tracking #</th>
                  <th>Rider</th>
                  <th>Customer</th>
                  <th>City</th>
                  <th>COD Amount</th>
                  <th>Delivered At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableSkeleton rows={6} cols={8} />
                ) : pageItems.length === 0 ? (
                  <tr>
                    <td colSpan={8}>
                      <EmptyState
                        icon="fa-circle-check"
                        title="No Completed Deliveries"
                        desc="No completed deliveries found for the current filters."
                      />
                    </td>
                  </tr>
                ) : (
                  pageItems.map((d) => (
                    <tr key={d._id}>
                      <td>
                        <strong>{d.orderReference ?? "—"}</strong>
                      </td>
                      <td>
                        <code className="sku">{d.trackingNumber ?? "—"}</code>
                      </td>
                      <td style={{ fontSize: 10.5 }}>
                        {d.riderName?.split(" ")[0] ?? "—"}
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
                        <strong style={{ color: "var(--green)" }}>
                          {d.codAmount ? fmt(d.codAmount) : "—"}
                        </strong>
                      </td>
                      <td style={{ fontSize: 10.5 }}>
                        {d.updatedAt
                          ? new Date(d.updatedAt).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : "—"}
                      </td>
                      <td>
                        <button
                          className="c-btn"
                          style={{ height: 22, fontSize: 9.5 }}
                        >
                          <i className="fa-solid fa-eye" /> View
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
      )}

      {/* ── COD COLLECTED ── */}
      {innerTab === "cod-pend" && (
        <>
          {totalCOD > 0 && (
            <div className="alert-strip warn">
              <i className="fa-solid fa-coins" />
              {fmt(totalCOD)} total COD from completed deliveries.
            </div>
          )}
          <div className="card">
            {loading ? (
              <div className="card-body">
                <EmptyState
                  icon="fa-spinner"
                  title="Loading…"
                  desc="Fetching COD records."
                />
              </div>
            ) : codPending.length === 0 ? (
              <div className="card-body">
                <EmptyState
                  icon="fa-money-bill-wave"
                  title="No COD Records"
                  desc="No completed deliveries with COD amounts found."
                />
              </div>
            ) : (
              <div className="tbl-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Order Ref</th>
                      <th>Rider</th>
                      <th>Customer</th>
                      <th>City</th>
                      <th>COD Amount</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {codPending.map((d) => (
                      <tr key={d._id}>
                        <td>
                          <strong>{d.orderReference ?? "—"}</strong>
                        </td>
                        <td>{d.riderName?.split(" ")[0] ?? "—"}</td>
                        <td>{d.customer?.name ?? "—"}</td>
                        <td>
                          <span className="tag">
                            {d.shippingAddress?.city ?? "—"}
                          </span>
                        </td>
                        <td>
                          <strong style={{ color: "var(--green)" }}>
                            {fmt(d.codAmount!)}
                          </strong>
                        </td>
                        <td style={{ fontSize: 10.5 }}>
                          {d.updatedAt
                            ? new Date(d.updatedAt).toLocaleDateString(
                                "en-GB",
                                { day: "2-digit", month: "short" },
                              )
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── TODAY ── */}
      {innerTab === "today" && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <i className="fa-solid fa-circle-check" /> Today —{" "}
              {todayDeliveries.length} Deliveries
            </div>
          </div>
          {loading ? (
            <div className="card-body">
              <EmptyState
                icon="fa-spinner"
                title="Loading…"
                desc="Fetching today's deliveries."
              />
            </div>
          ) : todayDeliveries.length === 0 ? (
            <div className="card-body">
              <EmptyState
                icon="fa-circle-check"
                title="No Completed Deliveries Today"
                desc="No deliveries have been marked as completed today."
              />
            </div>
          ) : (
            <div className="tbl-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Order Ref</th>
                    <th>Rider</th>
                    <th>Customer</th>
                    <th>City</th>
                    <th>COD</th>
                  </tr>
                </thead>
                <tbody>
                  {todayDeliveries.map((d) => (
                    <tr key={d._id}>
                      <td>
                        <strong>{d.orderReference ?? "—"}</strong>
                      </td>
                      <td>{d.riderName?.split(" ")[0] ?? "—"}</td>
                      <td>{d.customer?.name ?? "—"}</td>
                      <td>
                        <span className="tag">
                          {d.shippingAddress?.city ?? "—"}
                        </span>
                      </td>
                      <td>
                        <strong>{d.codAmount ? fmt(d.codAmount) : "—"}</strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default CompletedPanel;
