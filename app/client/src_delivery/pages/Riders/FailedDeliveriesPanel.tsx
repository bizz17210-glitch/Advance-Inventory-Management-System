// FailedDeliveriesPanel.tsx — dynamic
import React, { useState, useEffect, useCallback } from "react";
import {
  ApiRider,
  Badge,
  EmptyState,
  TableSkeleton,
  ApiRiderAvatar,
  CPagination,
  ApiPagination,
} from "./shared";
import { ridersAPI } from "../../services/api";

interface FailedDelivery {
  _id: string;
  trackingNumber?: string;
  orderReference?: string;
  currentStatus: string;
  customer?: { name?: string; phone?: string };
  shippingAddress?: { city?: string; street?: string };
  codAmount?: number;
  updatedAt?: string;
  createdAt?: string;
  riderId?: string;
  riderName?: string;
  riderPhone?: string;
}

const FailedDeliveriesPanel: React.FC = () => {
  const [riders, setRiders] = useState<ApiRider[]>([]);
  const [deliveries, setDeliveries] = useState<FailedDelivery[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const PER_PAGE = 10;

  const loadRiders = useCallback(async () => {
    try {
      const res = await ridersAPI.getAll({ limit: 50 });
      return res.data?.data?.riders ?? ([] as ApiRider[]);
    } catch {
      return [] as ApiRider[];
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const rList: ApiRider[] = await loadRiders();
      setRiders(rList);

      const promises = rList.slice(0, 8).map((r) =>
        ridersAPI
          .getDeliveries(r._id, { limit: 20, status: "failed,returned" })
          .then((res) => {
            return (res.data?.data?.deliveries ?? []).map((d: any) => ({
              ...d,
              riderId: r._id,
              riderName: r.fullName,
              riderPhone: r.phone,
            })) as FailedDelivery[];
          })
          .catch(() => [] as FailedDelivery[]),
      );

      const results = await Promise.all(promises);
      setDeliveries(results.flat());
    } catch (e: any) {
      setError(
        e?.response?.data?.message ?? "Failed to load failed deliveries.",
      );
    } finally {
      setLoading(false);
    }
  }, [loadRiders]);

  useEffect(() => {
    load();
  }, [load]);

  // ── Re-attempt: update delivery status back to in_transit ──
  const handleReattempt = async (riderId: string, deliveryId: string) => {
    try {
      await ridersAPI.updateDeliveryStatus(riderId, deliveryId, {
        status: "in_transit",
        notes: "Re-attempt initiated from dashboard",
      });
      load();
    } catch (e: any) {
      alert(e?.response?.data?.message ?? "Failed to re-attempt delivery.");
    }
  };

  const totalItems = deliveries.length;
  const totalPages = Math.ceil(totalItems / PER_PAGE) || 1;
  const start = totalItems > 0 ? (page - 1) * PER_PAGE + 1 : 0;
  const end = Math.min(page * PER_PAGE, totalItems);
  const pageItems = deliveries.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const failedCount = deliveries.filter(
    (d) => d.currentStatus === "failed",
  ).length;
  const returnedCount = deliveries.filter(
    (d) => d.currentStatus === "returned",
  ).length;

  return (
    <>
      <div className="panel-heading">Failed Deliveries &amp; Returns</div>
      <div className="panel-desc">
        Deliveries that could not be completed by internal riders. Review
        failure reason, re-attempt or mark as returned.
      </div>

      {!loading && deliveries.length > 0 && (
        <div className="alert-strip danger">
          <i className="fa-solid fa-circle-xmark" />
          <strong>{failedCount} failed</strong> ·{" "}
          <strong>{returnedCount} returned</strong> deliveries require action.
        </div>
      )}

      {error && (
        <div className="alert-strip danger" style={{ marginBottom: 12 }}>
          <i className="fa-solid fa-circle-exclamation" /> {error}
          <button
            className="c-btn"
            style={{ marginLeft: "auto" }}
            onClick={load}
          >
            Retry
          </button>
        </div>
      )}

      <div className="card">
        <div className="c-toolbar">
          <div className="c-toolbar-left">
            <span style={{ fontSize: 10.5, color: "var(--text-muted)" }}>
              {loading ? "Loading…" : `${totalItems} records`}
            </span>
          </div>
          <div className="c-toolbar-right">
            <button className="c-btn" onClick={load}>
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
                <th>Order Ref</th>
                <th>Tracking #</th>
                <th>Rider</th>
                <th>Customer</th>
                <th>City</th>
                <th>COD</th>
                <th>Status</th>
                <th>Last Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeleton rows={5} cols={9} />
              ) : pageItems.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <EmptyState
                      icon="fa-circle-check"
                      title="No Failed Deliveries"
                      desc="All deliveries have been completed successfully."
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
                    <td>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 11 }}>
                          {d.riderName?.split(" ")[0] ?? "—"}
                        </div>
                        <div className="td-sub">{d.riderPhone ?? ""}</div>
                      </div>
                    </td>
                    <td>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 11 }}>
                          {d.customer?.name ?? "—"}
                        </div>
                        <div className="td-sub">{d.customer?.phone ?? ""}</div>
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
                          fontWeight: 700,
                          color:
                            d.currentStatus === "failed"
                              ? "var(--red)"
                              : "var(--yellow)",
                        }}
                      >
                        {d.currentStatus === "failed" ? "Failed" : "Returned"}
                      </span>
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
                    <td style={{ display: "flex", gap: 4 }}>
                      <button
                        className="c-btn primary"
                        style={{ height: 22, fontSize: 9.5 }}
                        onClick={() =>
                          d.riderId && handleReattempt(d.riderId, d._id)
                        }
                        disabled={!d.riderId}
                      >
                        <i className="fa-solid fa-rotate" /> Re-attempt
                      </button>
                      <button
                        className="c-btn"
                        style={{
                          height: 22,
                          fontSize: 9.5,
                          color: "var(--red)",
                        }}
                      >
                        <i className="fa-solid fa-xmark" />
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
            current={page}
            total={totalPages}
            totalItems={totalItems}
            start={start}
            end={end}
            onChange={setPage}
          />
        )}
      </div>
    </>
  );
};

export default FailedDeliveriesPanel;
