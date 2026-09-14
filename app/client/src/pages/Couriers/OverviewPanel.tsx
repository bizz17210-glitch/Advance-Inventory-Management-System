// OverviewPanel.tsx — dynamic
import React, { useEffect, useState, useCallback } from "react";
import {
  NavPanel,
  ApiCourier,
  ApiShipment,
  COURIERS,
  SHIPMENTS,
  COD_PENDING,
  TRANSIT_ITEMS,
  PERF_DATA,
  fmt,
  rColor,
  Badge,
  PerfBar,
} from "./shared";
import { couriersAPI, shipmentsAPI, analyticsAPI } from "../../services/api";

interface Props {
  onNav: (p: NavPanel) => void;
  onOpenOverlay: (c: ApiCourier) => void;
}

interface DashKPIs {
  totalShipments: number;
  delivered: number;
  inTransit: number;
  avgDelivery: string;
}

const OverviewPanel: React.FC<Props> = ({ onNav, onOpenOverlay }) => {
  const [couriers, setCouriers] = useState<ApiCourier[]>([]);
  const [shipments, setShipments] = useState<ApiShipment[]>([]);
  const [perfData, setPerfData] = useState<any[]>([]);
  const [kpis, setKpis] = useState<DashKPIs | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cRes, sRes, pRes] = await Promise.allSettled([
        couriersAPI.getAll({ limit: 50 }),
        shipmentsAPI.getAll({ limit: 10 }),
        couriersAPI.getPerformance(),
      ]);

      if (cRes.status === "fulfilled") {
        const data = cRes.value.data?.data;
        setCouriers(data?.couriers ?? []);
        const list: ApiCourier[] = data?.couriers ?? [];
        const total = data?.pagination?.totalItems ?? 0;
        const transit = list
          .filter((s: ApiCourier) => (s.inTransit ?? 0) > 0)
          .reduce((a: number, c: ApiCourier) => a + (c.inTransit ?? 0), 0);
        const deliv = list
          .filter((s: ApiCourier) => (s.deliveredToday ?? 0) > 0)
          .reduce((a: number, c: ApiCourier) => a + (c.deliveredToday ?? 0), 0);
        setKpis({
          totalShipments: total,
          delivered: deliv,
          inTransit: transit,
          avgDelivery: "2.4d",
        });
      }
      if (sRes.status === "fulfilled")
        setShipments(sRes.value.data?.data?.shipments ?? []);
      if (pRes.status === "fulfilled")
        setPerfData(pRes.value.data?.data?.couriers ?? []);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Merge API perf data with courier list for the breakdown table
  const mergedCouriers =
    couriers.length > 0
      ? couriers
      : COURIERS.map((c) => ({ ...c, _id: String(c.id) }) as any);
  const mergedPerf = perfData.length > 0 ? perfData : PERF_DATA;

  const getPerfRow = (name: string) =>
    mergedPerf.find(
      (x: any) => x.name === name || x.name?.includes(name.split(" ")[0]),
    ) ?? { assigned: 0, delivered: 0, rto: 0, failed: 0, rate: 0, avgDays: 0 };

  const displayShipments =
    shipments.length > 0 ? shipments.slice(0, 4) : SHIPMENTS.slice(0, 4);

  return (
    <div className="cpanel active">
      <div className="panel-heading">Overview</div>
      <div className="panel-desc">
        A real-time snapshot of today's courier activity — shipment volumes,
        active couriers, COD status, and alerts that need immediate attention.
      </div>

      <div className="alert-strip warn">
        <i className="fa-solid fa-triangle-exclamation" />
        <div>
          <strong>4 shipments</strong> pending courier assignment ·{" "}
          <strong>6 RTO returns</strong> awaiting processing.
        </div>
        <button
          className="c-btn"
          style={{ marginLeft: "auto" }}
          onClick={() => onNav("pending")}
        >
          <i className="fa-solid fa-eye" /> View
        </button>
      </div>

      <div className="mini-stats">
        {[
          {
            label: "Total Shipments (MTD)",
            value: kpis?.totalShipments?.toString() ?? "—",
            trend: "Live count",
            up: true,
          },
          {
            label: "Delivered Today",
            value: kpis?.delivered?.toString() ?? "—",
            trend: "From all couriers",
            up: true,
          },
          {
            label: "In Transit",
            value: kpis?.inTransit?.toString() ?? "—",
            trend: `${couriers.length} couriers`,
            up: false,
          },
          {
            label: "Avg. Delivery Time",
            value: kpis?.avgDelivery ?? "—",
            trend: "Across all couriers",
            up: true,
          },
        ].map((s) => (
          <div className="mini-stat" key={s.label}>
            <div className="ms-label">{s.label}</div>
            <div className="ms-value">{loading ? "…" : s.value}</div>
            <div className={`ms-trend ${s.up ? "up" : ""}`}>{s.trend}</div>
          </div>
        ))}
      </div>

      <div className="detail-grid-3">
        {/* Active Couriers */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <i className="fa-solid fa-building" /> Active Couriers
            </div>
            <button className="c-btn" onClick={() => onNav("companies")}>
              Manage
            </button>
          </div>
          <div className="card-body" style={{ padding: "8px 14px" }}>
            {(couriers.length > 0 ? couriers : COURIERS)
              .slice(0, 4)
              .map((c: any) => (
                <div
                  className="list-item"
                  key={c._id ?? c.id}
                  onClick={() => onOpenOverlay(c)}
                  style={{ cursor: "pointer" }}
                >
                  <div
                    className="row-avatar"
                    style={{ background: "var(--bg)", fontSize: 8 }}
                  >
                    {c.code ?? c.name?.slice(0, 3).toUpperCase()}
                  </div>
                  <div className="list-content">
                    <div className="list-title">{c.name}</div>
                    <div className="list-meta">
                      {c.successRate ?? c.completionRate ?? "—"}% success ·{" "}
                      {c.avgDays ??
                        c.performanceMetrics?.avgDeliveryTime ??
                        "—"}
                      d avg.
                    </div>
                  </div>
                  <div className="list-right">
                    <Badge label={c.status ?? "Active"} />
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Recent Shipments */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <i className="fa-solid fa-truck" /> Recent Shipments
            </div>
          </div>
          <div className="card-body" style={{ padding: "8px 14px" }}>
            {displayShipments.map((s: any) => (
              <div className="list-item" key={s._id ?? s.track}>
                <div className="list-content">
                  <div className="list-title" style={{ fontSize: 10.5 }}>
                    {s.trackingNumber ?? s.track ?? "—"}
                  </div>
                  <div className="list-meta">
                    {s.customer?.name ??
                      s.customer?.fullName ??
                      s.customer ??
                      "—"}{" "}
                    · {s.courierName ?? s.courier ?? "—"} ·{" "}
                    {s.shippingAddress?.city ?? s.city ?? "—"}
                  </div>
                </div>
                <div className="list-right">
                  <Badge label={s.currentStatus ?? s.status ?? "Pending"} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* COD Pending */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <i className="fa-solid fa-coins" /> COD Pending
            </div>
          </div>
          <div className="card-body" style={{ padding: "8px 14px" }}>
            {COD_PENDING.slice(0, 4).map((c) => (
              <div className="list-item" key={c.order}>
                <div className="list-content">
                  <div className="list-title" style={{ fontSize: 10.5 }}>
                    {c.order} — {c.courier}
                  </div>
                  <div className="list-meta">
                    {c.customer} · Due {c.due}
                  </div>
                </div>
                <div className="list-right">
                  <div style={{ fontSize: 11, fontWeight: 700 }}>
                    {fmt(c.amount)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Breakdown Table */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <i className="fa-solid fa-chart-bar" /> Courier-wise Breakdown —
            This Month
          </div>
          <button className="c-btn" onClick={load}>
            <i className="fa-solid fa-rotate" /> Refresh
          </button>
        </div>
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>Courier</th>
                <th>Total Deliveries</th>
                <th>Delivered</th>
                <th>In Transit</th>
                <th>Cancelled</th>
                <th>Success Rate</th>
                <th>Avg. Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {mergedCouriers.map((c: any) => {
                const p: any =
                  mergedPerf.find(
                    (x: any) =>
                      x.name === c.name ||
                      x.id === c._id ||
                      x.name?.includes(c.name?.split(" ")[0]),
                  ) ?? {};
                const rate = parseFloat(
                  p.successRate ?? c.successRate ?? c.completionRate ?? "0",
                );
                return (
                  <tr
                    key={c._id ?? c.id}
                    onClick={() => onOpenOverlay(c)}
                    style={{ cursor: "pointer" }}
                  >
                    <td>
                      <div className="td-flex">
                        <div
                          className="row-avatar"
                          style={{ background: "var(--bg)", fontSize: 8 }}
                        >
                          {c.code ?? c.name?.slice(0, 3).toUpperCase()}
                        </div>
                        {c.name}
                      </div>
                    </td>
                    <td>{p.totalDeliveries ?? c.activeShipments ?? "—"}</td>
                    <td style={{ color: "var(--green)", fontWeight: 600 }}>
                      {p.successfulDeliveries ?? c.deliveredToday ?? "—"}
                    </td>
                    <td style={{ color: "var(--accent)" }}>
                      {c.inTransit ??
                        TRANSIT_ITEMS.filter((t) => t.courier === c.code)
                          .length}
                    </td>
                    <td style={{ color: "var(--yellow)" }}>
                      {p.cancellationRate != null
                        ? `${p.cancellationRate}%`
                        : "—"}
                    </td>
                    <td>
                      <PerfBar pct={rate} color={rColor(rate)} />
                    </td>
                    <td>{p.avgDeliveryTime ?? c.avgDays ?? "—"}d</td>
                    <td>
                      <Badge label={c.status ?? "Active"} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OverviewPanel;
