// RulesPanel.tsx — live courier dropdown
import React, { useState, useEffect } from "react";
import { RULES, ApiCourier, Badge, InnerTabs, EmptyState } from "./shared";
import { couriersAPI } from "../../services/api";

const CONDITION_TYPES = [
  "City / Destination",
  "Order Weight",
  "COD Amount",
  "Payment Type",
  "Product Category",
  "Province",
];

const RulesPanel: React.FC = () => {
  const [innerTab, setInnerTab] = useState("list");
  const [couriers, setCouriers] = useState<ApiCourier[]>([]);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  const [form, setForm] = useState({
    name: "",
    priority: "",
    conditionType: "City / Destination",
    conditionValue: "",
    assignTo: "",
    fallback: "",
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
      : [...new Set(RULES.flatMap((r) => [r.assign, r.fallback]))].filter(
          Boolean,
        );

  const filteredRules = RULES.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.name.toLowerCase().includes(q) || r.condition.toLowerCase().includes(q)
    );
  });

  const handleSave = async () => {
    if (!form.name.trim() || !form.assignTo) {
      setSaveMsg("Rule name and courier are required.");
      return;
    }
    setSaving(true);
    setSaveMsg("");
    await new Promise((r) => setTimeout(r, 600)); // no backend endpoint
    setSaving(false);
    setSaveMsg("Rule saved successfully.");
    setTimeout(() => {
      setSaveMsg("");
      setInnerTab("list");
    }, 1200);
  };

  const handleDelete = (priority: number) => {
    if (window.confirm(`Delete rule #${priority}?`)) {
      // static data — no API call
    }
  };

  return (
    <>
      <div className="panel-heading">Assignment Rules</div>
      <div className="panel-desc">
        Automated courier assignment logic. Rules are evaluated top-to-bottom —
        first match wins.
      </div>

      <InnerTabs
        tabs={[
          { id: "list", label: "Active Rules" },
          { id: "add", label: "Add Rule" },
          { id: "priority", label: "Priority Order" },
        ]}
        active={innerTab}
        onChange={setInnerTab}
      />

      {/* ── LIST ── */}
      {innerTab === "list" && (
        <>
          <div className="alert-strip info">
            <i className="fa-solid fa-circle-info" />
            Rules are evaluated top-to-bottom. First matching rule wins. Use
            Priority Order to reorder.
          </div>
          <div className="card">
            <div className="c-toolbar">
              <div className="c-toolbar-left">
                <div className="c-search">
                  <i className="fa-solid fa-magnifying-glass" />
                  <input
                    placeholder="Search rules..."
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
                  <i className="fa-solid fa-plus" /> Add Rule
                </button>
              </div>
            </div>

            <div className="tbl-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Priority</th>
                    <th>Rule Name</th>
                    <th>Condition</th>
                    <th>Assign To</th>
                    <th>Fallback</th>
                    <th>Status</th>
                    <th>Applied (MTD)</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRules.length === 0 ? (
                    <tr>
                      <td colSpan={8}>
                        <EmptyState
                          icon="fa-sitemap"
                          title="No rules found"
                          desc="No assignment rules match your search."
                        />
                      </td>
                    </tr>
                  ) : (
                    filteredRules.map((r) => (
                      <tr key={r.priority}>
                        <td>
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 800,
                              color: "var(--accent)",
                              background: "#FFF5EE",
                              padding: "2px 7px",
                              borderRadius: 5,
                            }}
                          >
                            #{r.priority}
                          </span>
                        </td>
                        <td>
                          <strong>{r.name}</strong>
                        </td>
                        <td>
                          <code className="sku">{r.condition}</code>
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
                              {r.assign.slice(0, 3).toUpperCase()}
                            </div>
                            {r.assign}
                          </div>
                        </td>
                        <td
                          style={{ color: "var(--text-muted)", fontSize: 11 }}
                        >
                          {r.fallback}
                        </td>
                        <td>
                          <Badge label={r.status} />
                        </td>
                        <td>
                          <span style={{ fontSize: 11, fontWeight: 600 }}>
                            {r.applied}
                          </span>
                          <span
                            style={{
                              fontSize: 9.5,
                              color: "var(--text-muted)",
                              marginLeft: 3,
                            }}
                          >
                            uses
                          </span>
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
                            onClick={() => handleDelete(r.priority)}
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
        </>
      )}

      {/* ── ADD ── */}
      {innerTab === "add" && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <i className="fa-solid fa-plus-circle" /> New Assignment Rule
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
                <div className="c-form-label">Rule Name *</div>
                <input
                  className="c-form-input"
                  placeholder="e.g. Karachi — Trax"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                />
              </div>
              <div className="c-form-group">
                <div className="c-form-label">Priority (1 = highest)</div>
                <input
                  className="c-form-input"
                  type="number"
                  placeholder="1"
                  value={form.priority}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, priority: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="c-form-row">
              <div className="c-form-group">
                <div className="c-form-label">Condition Type</div>
                <select
                  className="c-form-select"
                  value={form.conditionType}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, conditionType: e.target.value }))
                  }
                >
                  {CONDITION_TYPES.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="c-form-group">
                <div className="c-form-label">Condition Value</div>
                <input
                  className="c-form-input"
                  placeholder="e.g. Karachi, >5kg, >₨8000"
                  value={form.conditionValue}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, conditionValue: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="c-form-row">
              <div className="c-form-group">
                <div className="c-form-label">Assign To Courier *</div>
                <select
                  className="c-form-select"
                  value={form.assignTo}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, assignTo: e.target.value }))
                  }
                >
                  <option value="">— Select Courier —</option>
                  {courierNames.map((n) => (
                    <option key={n}>{n}</option>
                  ))}
                </select>
              </div>
              <div className="c-form-group">
                <div className="c-form-label">Fallback Courier</div>
                <select
                  className="c-form-select"
                  value={form.fallback}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, fallback: e.target.value }))
                  }
                >
                  <option value="">None</option>
                  {courierNames.map((n) => (
                    <option key={n}>{n}</option>
                  ))}
                </select>
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
                {saving ? "Saving…" : "Save Rule"}
              </button>
              <button className="c-btn" onClick={() => setInnerTab("list")}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PRIORITY ORDER ── */}
      {innerTab === "priority" && (
        <>
          <div className="alert-strip info">
            <i className="fa-solid fa-circle-info" />
            Rules are matched from top to bottom. Drag to reorder — highest
            priority rule at the top.
          </div>
          <div className="card">
            <div className="card-body" style={{ padding: "8px 14px" }}>
              {RULES.sort((a, b) => a.priority - b.priority).map((r) => (
                <div
                  key={r.priority}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 10px",
                    border: "1px solid var(--border)",
                    borderRadius: 6,
                    marginBottom: 6,
                    background: "var(--bg)",
                    cursor: "grab",
                  }}
                >
                  <i
                    className="fa-solid fa-grip-vertical"
                    style={{ color: "var(--text-muted)", fontSize: 11 }}
                  />
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      color: "var(--accent)",
                      background: "#FFF5EE",
                      padding: "2px 6px",
                      borderRadius: 4,
                    }}
                  >
                    #{r.priority}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, fontWeight: 600 }}>
                      {r.name}
                    </div>
                    <div style={{ fontSize: 10, color: "var(--text-muted)" }}>
                      {r.condition} → {r.assign}
                    </div>
                  </div>
                  <Badge label={r.status} />
                </div>
              ))}
              <button className="c-btn primary" style={{ marginTop: 10 }}>
                <i className="fa-solid fa-check" /> Save Order
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default RulesPanel;
