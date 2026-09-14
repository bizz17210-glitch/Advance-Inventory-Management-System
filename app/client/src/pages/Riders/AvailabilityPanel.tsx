// AvailabilityPanel.tsx — dynamic
import React, { useState, useEffect, useCallback } from "react";
import {
  ApiRider,
  ApiPagination,
  SCHEDULE_DATA,
  riderStatusLabel,
  avatarColorFromName,
  initials,
  Badge,
  DayBadge,
  InnerTabs,
  EmptyState,
  TableSkeleton,
  ApiRiderAvatar,
} from "./shared";
import { ridersAPI } from "../../services/api";

const AvailabilityPanel: React.FC = () => {
  const [innerTab, setInnerTab] = useState("today");
  const [riders, setRiders] = useState<ApiRider[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await ridersAPI.getAll({ limit: 50 });
      setRiders(res.data?.data?.riders ?? []);
    } catch (e: any) {
      setError(
        e?.response?.data?.message ?? "Failed to load rider availability.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // ── Status update ──
  const handleStatusUpdate = async (riderId: string, newStatus: string) => {
    try {
      await ridersAPI.updateStatus(riderId, { status: newStatus });
      load();
    } catch (e: any) {
      alert(e?.response?.data?.message ?? "Failed to update status.");
    }
  };

  // ── Derived counts ──
  const onDuty = riders.filter(
    (r) => r.status === "Active" || r.status === "OnDelivery",
  ).length;
  const onLeave = riders.filter((r) => r.status === "OnLeave").length;
  const inactive = riders.filter(
    (r) => r.status === "Inactive" || r.status === "Suspended",
  ).length;

  const availLabel = (r: ApiRider): string => {
    if (r.status === "OnDelivery") return "Busy";
    if (r.status === "OnLeave") return "On Leave";
    if (r.status === "Inactive") return "Inactive";
    if (r.status === "Suspended") return "Suspended";
    if (r.isAvailable) return "Available";
    return "Offline";
  };

  const shiftLabel = (r: ApiRider) => {
    // No shift field in API — derive from status
    if (r.status === "Active") return "Morning (9AM–5PM)";
    if (r.status === "OnDelivery") return "Full Day";
    return "—";
  };

  return (
    <>
      <div className="panel-heading">Rider Availability</div>
      <div className="panel-desc">
        View and manage rider shifts, day-off schedules, and real-time
        availability. Ensure adequate coverage for each zone.
      </div>

      <InnerTabs
        tabs={[
          { id: "today", label: "Today" },
          { id: "week", label: "This Week" },
          { id: "schedule", label: "Shift Schedule" },
        ]}
        active={innerTab}
        onChange={setInnerTab}
      />

      {/* ── TODAY ── */}
      {innerTab === "today" && (
        <>
          <div
            className="mini-stats"
            style={{ gridTemplateColumns: "repeat(3,1fr)" }}
          >
            <div className="mini-stat">
              <div className="ms-label">On Duty</div>
              <div className="ms-value" style={{ color: "var(--green)" }}>
                {loading ? "…" : onDuty}
              </div>
              <div className="ms-trend">Currently active</div>
            </div>
            <div className="mini-stat">
              <div className="ms-label">On Leave</div>
              <div className="ms-value" style={{ color: "var(--text-muted)" }}>
                {loading ? "…" : onLeave}
              </div>
              <div className="ms-trend">Scheduled off</div>
            </div>
            <div className="mini-stat">
              <div className="ms-label">Inactive / Suspended</div>
              <div className="ms-value" style={{ color: "var(--red)" }}>
                {loading ? "…" : inactive}
              </div>
              <div className="ms-trend down">Unavailable</div>
            </div>
          </div>

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
              <div className="c-toolbar-left" />
              <div className="c-toolbar-right">
                <button className="c-btn" onClick={load}>
                  <i className="fa-solid fa-rotate" /> Refresh
                </button>
              </div>
            </div>
            <div className="tbl-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Rider</th>
                    <th>Phone</th>
                    <th>Zone</th>
                    <th>Vehicle</th>
                    <th>Active Deliveries</th>
                    <th>Availability</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <TableSkeleton rows={6} cols={8} />
                  ) : riders.length === 0 ? (
                    <tr>
                      <td colSpan={8}>
                        <EmptyState
                          icon="fa-person-biking"
                          title="No Riders Found"
                          desc="No rider data available."
                        />
                      </td>
                    </tr>
                  ) : (
                    riders.map((r) => (
                      <tr key={r._id}>
                        <td>
                          <div className="td-flex">
                            <ApiRiderAvatar rider={r} size={26} fontSize={9} />
                            <div>
                              <div style={{ fontWeight: 600 }}>
                                {r.fullName}
                              </div>
                              <div className="td-sub">{r.email ?? ""}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ fontSize: 10.5 }}>{r.phone}</td>
                        <td>
                          <span className="tag">{r.assignedZone ?? "—"}</span>
                        </td>
                        <td>
                          <span className="tag">
                            <i
                              className="fa-solid fa-motorcycle"
                              style={{ fontSize: 9, marginRight: 3 }}
                            />
                            {r.vehicle?.type ?? "—"}
                          </span>
                        </td>
                        <td style={{ textAlign: "center", fontWeight: 700 }}>
                          {r.activeDeliveries ?? 0}
                        </td>
                        <td>
                          <Badge label={availLabel(r)} />
                        </td>
                        <td>
                          <Badge label={riderStatusLabel(r.status)} />
                        </td>
                        <td style={{ display: "flex", gap: 3 }}>
                          {r.status !== "Active" && (
                            <button
                              className="c-btn"
                              style={{
                                height: 22,
                                fontSize: 9.5,
                                color: "var(--green)",
                              }}
                              title="Set Active"
                              onClick={() =>
                                handleStatusUpdate(r._id, "Active")
                              }
                            >
                              <i className="fa-solid fa-play" />
                            </button>
                          )}
                          {r.status === "Active" && (
                            <button
                              className="c-btn"
                              style={{
                                height: 22,
                                fontSize: 9.5,
                                color: "var(--yellow)",
                              }}
                              title="Set On Leave"
                              onClick={() =>
                                handleStatusUpdate(r._id, "OnLeave")
                              }
                            >
                              <i className="fa-solid fa-pause" />
                            </button>
                          )}
                          <button
                            className="c-btn"
                            style={{ height: 22, fontSize: 9.5 }}
                          >
                            <i className="fa-solid fa-pen" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── WEEK ── */}
      {innerTab === "week" && (
        <div className="card">
          <div className="card-body">
            <EmptyState
              icon="fa-calendar-week"
              title="Weekly Schedule"
              desc="Weekly view of rider shift assignments and off days."
            />
          </div>
        </div>
      )}

      {/* ── SCHEDULE ── */}
      {innerTab === "schedule" && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <i className="fa-solid fa-calendar-alt" /> Shift Schedule
              Configuration
            </div>
            <button className="c-btn primary">
              <i className="fa-solid fa-plus" /> Add Shift
            </button>
          </div>
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr>
                  <th>Rider</th>
                  <th>Mon</th>
                  <th>Tue</th>
                  <th>Wed</th>
                  <th>Thu</th>
                  <th>Fri</th>
                  <th>Sat</th>
                  <th>Sun</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableSkeleton rows={4} cols={9} />
                ) : riders.length === 0 ? (
                  SCHEDULE_DATA.map((s) => (
                    <tr key={s.rider}>
                      <td>
                        <strong>{s.rider.split(" ")[0]}</strong>
                      </td>
                      {s.days.map((d, i) => (
                        <td key={i} style={{ textAlign: "center" }}>
                          <DayBadge d={d} />
                        </td>
                      ))}
                      <td>
                        <button
                          className="c-btn"
                          style={{ height: 22, fontSize: 9.5 }}
                        >
                          <i className="fa-solid fa-pen" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  riders.map((r) => (
                    <tr key={r._id}>
                      <td>
                        <div className="td-flex">
                          <ApiRiderAvatar rider={r} size={22} fontSize={8} />
                          <strong>{r.fullName.split(" ")[0]}</strong>
                        </div>
                      </td>
                      {/* Placeholder days — schedule management not in API */}
                      {["M", "M", "M", "M", "M", "-", "-"].map((d, i) => (
                        <td key={i} style={{ textAlign: "center" }}>
                          <DayBadge d={d} />
                        </td>
                      ))}
                      <td>
                        <button
                          className="c-btn"
                          style={{ height: 22, fontSize: 9.5 }}
                        >
                          <i className="fa-solid fa-pen" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
};

export default AvailabilityPanel;
