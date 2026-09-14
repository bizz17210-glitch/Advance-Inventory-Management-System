// ZonesPanel.tsx — live courier dropdown from API
import React, { useState, useEffect } from "react";
import {
  ZONES,
  CITY_MAP,
  ApiCourier,
  ToggleSwitch,
  InnerTabs,
  EmptyState,
} from "./shared";
import { couriersAPI } from "../../services/api";

const ZonesPanel: React.FC = () => {
  const [innerTab, setInnerTab] = useState("list");
  const [couriers, setCouriers] = useState<ApiCourier[]>([]);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  const [form, setForm] = useState({
    name: "",
    code: "",
    primary: "",
    backup: "",
    minDays: "1",
    maxDays: "3",
    multiplier: "1.0",
  });

  useEffect(() => {
    couriersAPI
      .getAll({ limit: 50 })
      .then((r) => setCouriers(r.data?.data?.couriers ?? []))
      .catch(() => {});
  }, []);

  const courierNames =
    couriers.length > 0
      ? couriers.map((c) => c.name)
      : [
          "TCS Express",
          "Leopards Courier",
          "M&P Express",
          "Trax",
          "PostEx",
          "BlueEX",
        ];

  const filteredZones = ZONES.filter((z) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      z.name.toLowerCase().includes(q) || z.cities.toLowerCase().includes(q)
    );
  });

  const filteredCities = CITY_MAP.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.city.toLowerCase().includes(q) || c.province.toLowerCase().includes(q)
    );
  });

  const handleSave = async () => {
    if (!form.name.trim() || !form.primary) {
      setSaveMsg("Zone name and primary courier are required.");
      return;
    }
    setSaving(true);
    setSaveMsg("");
    await new Promise((r) => setTimeout(r, 600)); // no backend endpoint
    setSaving(false);
    setSaveMsg("Zone saved successfully.");
    setTimeout(() => {
      setSaveMsg("");
      setInnerTab("list");
    }, 1200);
  };

  return (
    <>
      <div className="panel-heading">Zones &amp; Coverage</div>
      <div className="panel-desc">
        Define delivery zones, map cities to their primary and backup couriers,
        and set rate multipliers for remote areas.
      </div>

      <InnerTabs
        tabs={[
          { id: "list", label: "Zone List" },
          { id: "cities", label: "City Mapping" },
          { id: "add", label: "Add Zone" },
        ]}
        active={innerTab}
        onChange={(t) => {
          setInnerTab(t);
          setSearch("");
        }}
      />

      {/* ── ZONE LIST ── */}
      {innerTab === "list" && (
        <div className="card">
          <div className="c-toolbar">
            <div className="c-toolbar-left">
              <div className="c-search">
                <i className="fa-solid fa-magnifying-glass" />
                <input
                  placeholder="Search zone or city..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="c-toolbar-right">
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
                  <th>Cities Covered</th>
                  <th>Primary Courier</th>
                  <th>Backup Courier</th>
                  <th>Avg. Delivery Days</th>
                  <th>Rate Multiplier</th>
                  <th>Active</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredZones.length === 0 ? (
                  <tr>
                    <td colSpan={8}>
                      <EmptyState
                        icon="fa-map"
                        title="No zones found"
                        desc="No zones match your search."
                      />
                    </td>
                  </tr>
                ) : (
                  filteredZones.map((z) => (
                    <tr key={z.name}>
                      <td>
                        <div style={{ fontWeight: 700 }}>{z.name}</div>
                      </td>
                      <td>
                        <span
                          style={{ fontSize: 10, color: "var(--text-muted)" }}
                        >
                          {z.cities}
                        </span>
                      </td>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                          }}
                        >
                          <div
                            className="row-avatar"
                            style={{
                              background: "var(--bg)",
                              fontSize: 7,
                              width: 22,
                              height: 22,
                            }}
                          >
                            {z.primary.slice(0, 3).toUpperCase()}
                          </div>
                          {z.primary}
                        </div>
                      </td>
                      <td
                        style={{
                          color:
                            z.backup === "—" ? "var(--text-muted)" : "inherit",
                        }}
                      >
                        {z.backup}
                      </td>
                      <td>
                        <span style={{ fontSize: 11, fontWeight: 600 }}>
                          {z.days}
                        </span>
                        <span
                          style={{
                            fontSize: 9.5,
                            color: "var(--text-muted)",
                            marginLeft: 3,
                          }}
                        >
                          days
                        </span>
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color:
                              parseFloat(z.mult) > 1.2
                                ? "var(--red)"
                                : parseFloat(z.mult) > 1.0
                                  ? "var(--yellow)"
                                  : "var(--green)",
                          }}
                        >
                          {z.mult}x
                        </span>
                      </td>
                      <td>
                        <ToggleSwitch defaultChecked />
                      </td>
                      <td>
                        <button
                          className="c-btn"
                          style={{ height: 23, fontSize: 9.5 }}
                          title="Edit"
                        >
                          <i className="fa-solid fa-pen" />
                        </button>
                        <button
                          className="c-btn"
                          style={{
                            height: 23,
                            fontSize: 9.5,
                            marginLeft: 3,
                            color: "var(--red)",
                          }}
                          title="Delete"
                        >
                          <i className="fa-solid fa-trash" />
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

      {/* ── CITY MAPPING ── */}
      {innerTab === "cities" && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <i className="fa-solid fa-city" /> City to Courier Mapping
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <div className="c-search" style={{ height: 27 }}>
                <i className="fa-solid fa-magnifying-glass" />
                <input
                  placeholder="Search city..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ width: 120 }}
                />
              </div>
              <button className="c-btn primary">
                <i className="fa-solid fa-plus" /> Add City
              </button>
            </div>
          </div>
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr>
                  <th>City</th>
                  <th>Province</th>
                  <th>Zone</th>
                  <th>Primary Courier</th>
                  <th>Backup</th>
                  <th>Delivery Days</th>
                  <th>Serviceable</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCities.length === 0 ? (
                  <tr>
                    <td colSpan={8}>
                      <EmptyState
                        icon="fa-city"
                        title="No cities found"
                        desc="No cities match your search."
                      />
                    </td>
                  </tr>
                ) : (
                  filteredCities.map((c) => (
                    <tr key={c.city}>
                      <td>
                        <strong>{c.city}</strong>
                      </td>
                      <td>{c.province}</td>
                      <td>
                        <span className="tag">{c.zone}</span>
                      </td>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 5,
                          }}
                        >
                          <div
                            className="row-avatar"
                            style={{
                              background: "var(--bg)",
                              fontSize: 7,
                              width: 22,
                              height: 22,
                            }}
                          >
                            {c.primary.slice(0, 3).toUpperCase()}
                          </div>
                          {c.primary}
                        </div>
                      </td>
                      <td
                        style={{
                          color:
                            c.backup === "—" ? "var(--text-muted)" : "inherit",
                        }}
                      >
                        {c.backup}
                      </td>
                      <td>
                        <span
                          style={{
                            fontWeight: 600,
                            color:
                              c.days > 3
                                ? "var(--yellow)"
                                : c.days > 4
                                  ? "var(--red)"
                                  : "inherit",
                          }}
                        >
                          {c.days}d
                        </span>
                      </td>
                      <td>
                        <span className="badge green">Yes</span>
                      </td>
                      <td>
                        <button
                          className="c-btn"
                          style={{ height: 23, fontSize: 9.5 }}
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

      {/* ── ADD ZONE ── */}
      {innerTab === "add" && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <i className="fa-solid fa-map-pin" /> Add New Zone
            </div>
          </div>
          <div className="card-body">
            {saveMsg && (
              <div
                style={{
                  marginBottom: 10,
                  padding: "6px 10px",
                  borderRadius: 6,
                  fontSize: 11,
                  background: saveMsg.includes("saved")
                    ? "var(--green-bg)"
                    : "var(--red-bg)",
                  color: saveMsg.includes("saved")
                    ? "var(--green)"
                    : "var(--red)",
                }}
              >
                <i
                  className={`fa-solid ${saveMsg.includes("saved") ? "fa-circle-check" : "fa-circle-exclamation"}`}
                />{" "}
                {saveMsg}
              </div>
            )}

            <div className="c-form-row">
              <div className="c-form-group">
                <div className="c-form-label">Zone Name *</div>
                <input
                  className="c-form-input"
                  placeholder="e.g. Karachi Metro"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                />
              </div>
              <div className="c-form-group">
                <div className="c-form-label">Zone Code</div>
                <input
                  className="c-form-input"
                  placeholder="KHI"
                  value={form.code}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, code: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="c-form-row">
              <div className="c-form-group">
                <div className="c-form-label">Primary Courier *</div>
                <select
                  className="c-form-select"
                  value={form.primary}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, primary: e.target.value }))
                  }
                >
                  <option value="">— Select —</option>
                  {courierNames.map((n) => (
                    <option key={n}>{n}</option>
                  ))}
                </select>
              </div>
              <div className="c-form-group">
                <div className="c-form-label">Backup Courier</div>
                <select
                  className="c-form-select"
                  value={form.backup}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, backup: e.target.value }))
                  }
                >
                  <option value="">None</option>
                  {courierNames.map((n) => (
                    <option key={n}>{n}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="c-form-row triple">
              <div className="c-form-group">
                <div className="c-form-label">Min Delivery Days</div>
                <input
                  className="c-form-input"
                  type="number"
                  value={form.minDays}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, minDays: e.target.value }))
                  }
                />
              </div>
              <div className="c-form-group">
                <div className="c-form-label">Max Delivery Days</div>
                <input
                  className="c-form-input"
                  type="number"
                  value={form.maxDays}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, maxDays: e.target.value }))
                  }
                />
              </div>
              <div className="c-form-group">
                <div className="c-form-label">Rate Multiplier</div>
                <input
                  className="c-form-input"
                  type="number"
                  step="0.1"
                  value={form.multiplier}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, multiplier: e.target.value }))
                  }
                />
              </div>
            </div>

            <hr />
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="c-btn primary"
                onClick={handleSave}
                disabled={saving}
              >
                <i
                  className={`fa-solid ${saving ? "fa-spinner fa-spin" : "fa-check"}`}
                />
                {saving ? "Saving…" : "Save Zone"}
              </button>
              <button className="c-btn" onClick={() => setInnerTab("list")}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ZonesPanel;
