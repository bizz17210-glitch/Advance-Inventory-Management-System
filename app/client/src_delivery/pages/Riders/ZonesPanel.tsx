// ZonesPanel.tsx — dynamic (riders from API, zones remain config-based)
import React, { useState, useEffect, useCallback } from "react";
import {
  ApiRider,
  ZONES_DATA,
  ToggleSwitch,
  InnerTabs,
  EmptyState,
} from "./shared";
import { ridersAPI } from "../../services/api";

const ZonesPanel: React.FC = () => {
  const [innerTab, setInnerTab] = useState("list");
  const [riders, setRiders] = useState<ApiRider[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");

  // Add Zone form
  const [zoneName, setZoneName] = useState("");
  const [zoneCode, setZoneCode] = useState("");
  const [primaryRider, setPrimaryRider] = useState("");
  const [backupRider, setBackupRider] = useState("");
  const [minTime, setMinTime] = useState("20");
  const [maxTime, setMaxTime] = useState("60");
  const [charge, setCharge] = useState("0");
  const [areas, setAreas] = useState("");

  const loadRiders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ridersAPI.getAll({ limit: 50, status: "Active" });
      setRiders(res.data?.data?.riders ?? []);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRiders();
  }, [loadRiders]);

  const handleSaveZone = async () => {
    if (!zoneName.trim()) {
      alert("Zone name is required.");
      return;
    }
    setSaving(true);
    // No dedicated zones API — simulate save
    await new Promise((res) => setTimeout(res, 700));
    setSuccess(`Zone "${zoneName}" saved successfully.`);
    setSaving(false);
    setZoneName("");
    setZoneCode("");
    setAreas("");
    setTimeout(() => setSuccess(""), 3000);
    setInnerTab("list");
  };

  // Merge static zone data with real rider names if possible
  const enrichedZones = ZONES_DATA.map((z) => {
    const primaryRiderObj = riders.find(
      (r) =>
        r.fullName.toLowerCase().includes(z.primary.toLowerCase()) ||
        z.primary
          .toLowerCase()
          .includes(r.fullName.split(" ")[0].toLowerCase()),
    );
    const backupRiderObj =
      z.backup !== "—"
        ? riders.find(
            (r) =>
              r.fullName.toLowerCase().includes(z.backup.toLowerCase()) ||
              z.backup
                .toLowerCase()
                .includes(r.fullName.split(" ")[0].toLowerCase()),
          )
        : null;
    return { ...z, primaryRiderObj, backupRiderObj };
  });

  return (
    <>
      <div className="panel-heading">Delivery Zones</div>
      <div className="panel-desc">
        Define geographic delivery zones, map areas to primary riders, and set
        delivery time targets per zone.
      </div>

      <InnerTabs
        tabs={[
          { id: "list", label: "Zone List" },
          { id: "add", label: "Add Zone" },
          { id: "areas", label: "Area Mapping" },
        ]}
        active={innerTab}
        onChange={setInnerTab}
      />

      {/* ── ZONE LIST ── */}
      {innerTab === "list" && (
        <div className="card">
          <div className="c-toolbar">
            <div className="c-toolbar-left">
              <div className="c-search">
                <i className="fa-solid fa-magnifying-glass" />
                <input placeholder="Search zone..." />
              </div>
            </div>
            <div className="c-toolbar-right">
              <button className="c-btn" onClick={loadRiders}>
                <i className="fa-solid fa-rotate" />
              </button>
              <button
                className="c-btn primary"
                onClick={() => setInnerTab("add")}
              >
                <i className="fa-solid fa-plus" /> Add Zone
              </button>
            </div>
          </div>
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr>
                  <th>Zone Name</th>
                  <th>Areas / Neighbourhoods</th>
                  <th>Primary Rider</th>
                  <th>Backup Rider</th>
                  <th>Avg. Delivery Time</th>
                  <th>Active Orders</th>
                  <th>Active</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {enrichedZones.map((z) => (
                  <tr key={z.name}>
                    <td>
                      <strong>{z.name}</strong>
                    </td>
                    <td style={{ fontSize: 10, color: "var(--text-muted)" }}>
                      {z.areas}
                    </td>
                    <td>
                      <div className="td-flex">
                        {z.primaryRiderObj ? (
                          <>
                            <div
                              className="row-avatar"
                              style={{
                                background: "#FF6A00",
                                width: 20,
                                height: 20,
                                fontSize: 8,
                              }}
                            >
                              {z.primaryRiderObj.fullName
                                .split(" ")
                                .map((w) => w[0])
                                .join("")
                                .slice(0, 2)
                                .toUpperCase()}
                            </div>
                            <span>
                              {z.primaryRiderObj.fullName.split(" ")[0]}
                            </span>
                          </>
                        ) : (
                          <span style={{ color: "var(--text-muted)" }}>
                            {z.primary}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      {z.backupRiderObj ? (
                        <span>{z.backupRiderObj.fullName.split(" ")[0]}</span>
                      ) : (
                        <span style={{ color: "var(--text-muted)" }}>
                          {z.backup}
                        </span>
                      )}
                    </td>
                    <td>{z.time}</td>
                    <td>
                      <span className="badge orange">{z.active}</span>
                    </td>
                    <td>
                      <ToggleSwitch defaultChecked />
                    </td>
                    <td>
                      <button
                        className="c-btn"
                        style={{ height: 22, fontSize: 9.5 }}
                      >
                        <i className="fa-solid fa-pen" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── ADD ZONE ── */}
      {innerTab === "add" && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <i className="fa-solid fa-map-pin" /> Add Delivery Zone
            </div>
          </div>
          <div className="card-body">
            {success && (
              <div className="alert-strip success" style={{ marginBottom: 12 }}>
                <i className="fa-solid fa-circle-check" /> {success}
              </div>
            )}
            <div className="c-form-row">
              <div className="c-form-group">
                <div className="c-form-label">Zone Name *</div>
                <input
                  className="c-form-input"
                  placeholder="e.g. DHA / Cantt"
                  value={zoneName}
                  onChange={(e) => setZoneName(e.target.value)}
                />
              </div>
              <div className="c-form-group">
                <div className="c-form-label">Zone Code</div>
                <input
                  className="c-form-input"
                  placeholder="DHA"
                  value={zoneCode}
                  onChange={(e) => setZoneCode(e.target.value)}
                />
              </div>
            </div>
            <div className="c-form-row">
              <div className="c-form-group">
                <div className="c-form-label">Primary Rider</div>
                <select
                  className="c-form-select"
                  value={primaryRider}
                  onChange={(e) => setPrimaryRider(e.target.value)}
                >
                  <option value="">— Select Rider —</option>
                  {loading ? (
                    <option disabled>Loading…</option>
                  ) : (
                    riders.map((r) => (
                      <option key={r._id} value={r._id}>
                        {r.fullName} ({r.assignedZone ?? "No Zone"})
                      </option>
                    ))
                  )}
                </select>
              </div>
              <div className="c-form-group">
                <div className="c-form-label">Backup Rider</div>
                <select
                  className="c-form-select"
                  value={backupRider}
                  onChange={(e) => setBackupRider(e.target.value)}
                >
                  <option value="">None</option>
                  {riders.map((r) => (
                    <option key={r._id} value={r._id}>
                      {r.fullName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="c-form-row triple">
              <div className="c-form-group">
                <div className="c-form-label">Min Delivery Time (min)</div>
                <input
                  className="c-form-input"
                  type="number"
                  value={minTime}
                  onChange={(e) => setMinTime(e.target.value)}
                />
              </div>
              <div className="c-form-group">
                <div className="c-form-label">Max Delivery Time (min)</div>
                <input
                  className="c-form-input"
                  type="number"
                  value={maxTime}
                  onChange={(e) => setMaxTime(e.target.value)}
                />
              </div>
              <div className="c-form-group">
                <div className="c-form-label">Delivery Charge (₨)</div>
                <input
                  className="c-form-input"
                  type="number"
                  value={charge}
                  onChange={(e) => setCharge(e.target.value)}
                />
              </div>
            </div>
            <div className="c-form-row single">
              <div className="c-form-group">
                <div className="c-form-label">Areas / Neighbourhoods</div>
                <textarea
                  className="c-form-textarea"
                  placeholder="e.g. DHA Phase 1, DHA Phase 2, Cantonment, Walton..."
                  value={areas}
                  onChange={(e) => setAreas(e.target.value)}
                />
              </div>
            </div>
            <hr
              style={{
                border: "none",
                borderTop: "1px solid var(--divider)",
                margin: "12px 0",
              }}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="c-btn primary"
                onClick={handleSaveZone}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin" /> Saving…
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-check" /> Save Zone
                  </>
                )}
              </button>
              <button
                className="c-btn"
                onClick={() => setInnerTab("list")}
                disabled={saving}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── AREA MAPPING ── */}
      {innerTab === "areas" && (
        <div className="card">
          <div className="card-body">
            <EmptyState
              icon="fa-map"
              title="Area Mapping"
              desc="Map specific areas and postal codes to their delivery zones."
            />
          </div>
        </div>
      )}
    </>
  );
};

export default ZonesPanel;
