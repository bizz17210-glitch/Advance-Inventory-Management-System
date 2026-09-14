// ContractsPanel.tsx — live courier dropdown + static contracts table
import React, { useState, useEffect } from "react";
import { ApiCourier, Badge, InnerTabs, EmptyState } from "./shared";
import { couriersAPI, courierContractsAPI } from "../../services/api";

interface ApiContract {
  _id: string;
  courier: string | { _id: string; name: string };
  ref?: string;
  contractNumber?: string;
  startDate?: string;
  endDate?: string;
  sla?: number;
  penalty?: number;
  codDays?: number;
  autoRenew?: boolean | string;
  renewalNoticeDays?: number;
  status?: string;
}

const ContractsPanel: React.FC = () => {
  const [innerTab, setInnerTab] = useState("active");
  const [couriers, setCouriers] = useState<ApiCourier[]>([]);
  const [contracts, setContracts] = useState<ApiContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedContract, setSelectedContract] = useState<ApiContract | null>(
    null,
  );

  const [form, setForm] = useState({
    courier: "",
    ref: "",
    startDate: "",
    endDate: "",
    sla: "3",
    penalty: "50",
    codDays: "7",
    autoRenew: "Yes",
    renewalNotice: "30",
  });

  const fetchContracts = () => {
    setLoading(true);
    courierContractsAPI
      .getAll({ limit: 100 })
      .then((r) => setContracts(r.data?.data?.contracts ?? r.data?.data ?? []))
      .catch(() => setContracts([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    couriersAPI
      .getAll({ limit: 50 })
      .then((r) => setCouriers(r.data?.data?.couriers ?? []))
      .catch(() => {});
    fetchContracts();
  }, []);

  const getCourierName = (c: ApiContract) => {
    if (
      typeof c.courier === "object" &&
      c.courier !== null &&
      c.courier?.name
    ) {
      return c.courier.name;
    }
    if (typeof c.courier === "string") {
      const found = couriers.find((x) => x._id === c.courier);
      if (found) return found.name;
      // ID string as fallback — pata chal jaye ga kya aa rha hai
      return c.courier || "—";
    }
    return "—";
  };

  const getRef = (c: ApiContract) => c.ref ?? c.contractNumber ?? "—";

  const filteredContracts = contracts.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      getCourierName(c).toLowerCase().includes(q) ||
      getRef(c).toLowerCase().includes(q)
    );
  });

  const handleSave = async () => {
    if (!form.courier || !form.ref.trim()) {
      setSaveMsg("Courier and Contract # are required.");
      return;
    }
    setSaving(true);
    setSaveMsg("");
    try {
      await courierContractsAPI.create({
        courierId: form.courier,
        contractNumber: form.ref,
        ref: form.ref,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        sla: Number(form.sla),
        penalty: Number(form.penalty),
        codDays: Number(form.codDays),
        autoRenew: form.autoRenew === "Yes",
        renewalNoticeDays: Number(form.renewalNotice),
      });
      setSaveMsg("Contract saved successfully.");
      fetchContracts();
      setForm({
        courier: "",
        ref: "",
        startDate: "",
        endDate: "",
        sla: "3",
        penalty: "50",
        codDays: "7",
        autoRenew: "Yes",
        renewalNotice: "30",
      });
      setTimeout(() => {
        setSaveMsg("");
        setInnerTab("active");
      }, 1200);
    } catch {
      setSaveMsg("Failed to save contract. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this contract?")) return;
    setDeletingId(id);
    try {
      await courierContractsAPI.delete(id);
      setContracts((prev) => prev.filter((c) => c._id !== id));
    } catch {
      alert("Failed to delete contract.");
    } finally {
      setDeletingId(null);
    }
  };

  const daysUntilExpiry = (endDate?: string) => {
    if (!endDate) return null;
    return Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000);
  };

  const fmtDate = (d?: string) =>
    d
      ? new Date(d).toLocaleDateString("en-PK", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "—";

  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div>
          <div className="panel-heading">Contracts &amp; Terms</div>
          <div className="panel-desc">
            Formal agreements, SLAs, and payment terms with each courier. Track
            expiry dates and auto-renewal settings.
          </div>
        </div>
        <button
          className="c-btn primary"
          style={{ flexShrink: 0, marginTop: 4 }}
          onClick={() => setInnerTab("add")}
        >
          <i className="fa-solid fa-plus" /> Add Contract
        </button>
      </div>

      <InnerTabs
        tabs={[
          { id: "active", label: "Active Contracts" },
          { id: "expired", label: "Expired" },
          { id: "add", label: "New Contract" },
        ]}
        active={innerTab}
        onChange={setInnerTab}
      />

      {/* ── ACTIVE ── */}
      {innerTab === "active" && (
        <>
          {/* Expiry warnings */}
          {/* Expiry warnings */}
          {contracts.some((c) => {
            const d = daysUntilExpiry(c.endDate);
            return d !== null && d > 0 && d <= 60;
          }) && (
            <div className="alert-strip warn">
              <i className="fa-solid fa-triangle-exclamation" />
              Some contracts expire within 60 days. Review auto-renewal
              settings.
            </div>
          )}

          <div className="card">
            <div className="c-toolbar">
              <div className="c-toolbar-left">
                <div className="c-search">
                  <i className="fa-solid fa-magnifying-glass" />
                  <input
                    placeholder="Search courier or contract #..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
              <div className="c-toolbar-right">
                <button className="c-btn">
                  <i className="fa-solid fa-file-export" /> Export
                </button>
                <button
                  className="c-btn primary"
                  onClick={() => setInnerTab("add")}
                >
                  <i className="fa-solid fa-plus" /> New Contract
                </button>
              </div>
            </div>

            <div className="tbl-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Courier</th>
                    <th>Contract #</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>SLA (Days)</th>
                    <th>Penalty/Day</th>
                    <th>COD Settlement</th>
                    <th>Auto-renew</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td
                        colSpan={10}
                        style={{
                          textAlign: "center",
                          padding: 20,
                          color: "var(--text-muted)",
                          fontSize: 12,
                        }}
                      >
                        <i className="fa-solid fa-spinner fa-spin" /> Loading
                        contracts…
                      </td>
                    </tr>
                  ) : filteredContracts.length === 0 ? (
                    <tr>
                      <td colSpan={10}>
                        <EmptyState
                          icon="fa-file-contract"
                          title="No contracts found"
                          desc="No contracts match your search."
                        />
                      </td>
                    </tr>
                  ) : (
                    filteredContracts.map((c) => {
                      const days = daysUntilExpiry(c.endDate);
                      const autoRenewVal =
                        c.autoRenew === true || c.autoRenew === "Yes";
                      return (
                        <tr key={c._id}>
                          <td>
                            <div className="td-flex">
                              <div
                                className="row-avatar"
                                style={{
                                  background: "var(--bg)",
                                  fontSize: 8,
                                  width: 26,
                                  height: 26,
                                }}
                              >
                                {getCourierName(c).slice(0, 3).toUpperCase()}
                              </div>
                              <strong>{getCourierName(c)}</strong>
                            </div>
                          </td>
                          <td>
                            <code className="sku">{getRef(c)}</code>
                          </td>
                          <td style={{ fontSize: 11 }}>
                            {fmtDate(c.startDate)}
                          </td>
                          <td style={{ fontSize: 11 }}>
                            {fmtDate(c.endDate)}
                            {days !== null && days <= 60 && days > 0 && (
                              <span
                                style={{
                                  marginLeft: 4,
                                  fontSize: 9,
                                  color: "var(--yellow)",
                                }}
                              >
                                ({days}d left)
                              </span>
                            )}
                          </td>
                          <td>{c.sla ?? "—"} days</td>
                          <td>₨{c.penalty ?? "—"}/day</td>
                          <td>{c.codDays ?? "—"} days</td>
                          <td>
                            <span
                              style={{
                                fontSize: 10.5,
                                color: autoRenewVal
                                  ? "var(--green)"
                                  : "var(--text-muted)",
                              }}
                            >
                              {autoRenewVal ? (
                                <>
                                  <i className="fa-solid fa-check" /> Yes
                                </>
                              ) : (
                                "No"
                              )}
                            </span>
                          </td>
                          <td>
                            <Badge label={c.status ?? "Active"} />
                          </td>
                          <td>
                            <button
                              className="c-btn"
                              style={{ height: 23, fontSize: 9.5 }}
                              onClick={() => setSelectedContract(c)}
                            >
                              <i className="fa-solid fa-eye" />
                            </button>
                            <button
                              className="c-btn"
                              style={{
                                height: 23,
                                fontSize: 9.5,
                                marginLeft: 3,
                                color: "var(--red)",
                              }}
                              disabled={deletingId === c._id}
                              onClick={() => handleDelete(c._id)}
                            >
                              {deletingId === c._id ? (
                                <i className="fa-solid fa-spinner fa-spin" />
                              ) : (
                                <i className="fa-solid fa-trash" />
                              )}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── EXPIRED ── */}
      {innerTab === "expired" && (
        <div className="card">
          <div className="card-body">
            <EmptyState
              icon="fa-file-circle-xmark"
              title="No Expired Contracts"
              desc="All contracts are currently active."
            />
          </div>
        </div>
      )}

      {/* ── ADD ── */}
      {innerTab === "add" && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <i className="fa-solid fa-file-pen" /> New Contract
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
                <div className="c-form-label">Courier Company *</div>
                <select
                  className="c-form-select"
                  value={form.courier}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, courier: e.target.value }))
                  }
                >
                  <option value="">— Select Courier —</option>
                  {couriers.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="c-form-group">
                <div className="c-form-label">Contract Reference # *</div>
                <input
                  className="c-form-input"
                  placeholder="CTR-2026-XXX"
                  value={form.ref}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, ref: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="c-form-row">
              <div className="c-form-group">
                <div className="c-form-label">Start Date</div>
                <input
                  className="c-form-input"
                  type="date"
                  value={form.startDate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, startDate: e.target.value }))
                  }
                />
              </div>
              <div className="c-form-group">
                <div className="c-form-label">End Date</div>
                <input
                  className="c-form-input"
                  type="date"
                  value={form.endDate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, endDate: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="c-form-row triple">
              <div className="c-form-group">
                <div className="c-form-label">SLA (Days)</div>
                <input
                  className="c-form-input"
                  type="number"
                  placeholder="3"
                  value={form.sla}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, sla: e.target.value }))
                  }
                />
              </div>
              <div className="c-form-group">
                <div className="c-form-label">Penalty/Day (₨)</div>
                <input
                  className="c-form-input"
                  type="number"
                  placeholder="50"
                  value={form.penalty}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, penalty: e.target.value }))
                  }
                />
              </div>
              <div className="c-form-group">
                <div className="c-form-label">COD Settlement (Days)</div>
                <input
                  className="c-form-input"
                  type="number"
                  placeholder="7"
                  value={form.codDays}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, codDays: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="c-form-row">
              <div className="c-form-group">
                <div className="c-form-label">Auto-renew</div>
                <select
                  className="c-form-select"
                  value={form.autoRenew}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, autoRenew: e.target.value }))
                  }
                >
                  <option>Yes</option>
                  <option>No</option>
                </select>
              </div>
              <div className="c-form-group">
                <div className="c-form-label">Renewal Notice (Days)</div>
                <input
                  className="c-form-input"
                  type="number"
                  placeholder="30"
                  value={form.renewalNotice}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, renewalNotice: e.target.value }))
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
                {saving ? "Saving…" : "Save Contract"}
              </button>
              <button className="c-btn" onClick={() => setInnerTab("active")}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {selectedContract && (
        <>
          <div
            className="prod-backdrop open"
            onClick={() => setSelectedContract(null)}
          />
          <div className="prod-detail-panel open">
            {/* Header */}
            <div className="detail-header">
              <div className="detail-title">{getRef(selectedContract)}</div>
              <button
                className="detail-close"
                onClick={() => setSelectedContract(null)}
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            {/* Panel Tabs */}
            <div className="prod-tabs">
              <div className="prod-tab active">Contract Details</div>
            </div>

            {/* Body */}
            <div
              className="detail-body"
              style={{ overflowY: "auto", padding: 0 }}
            >
              <div
                style={{
                  padding: "12px 16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                {/* Courier Info */}
                <div className="info-banner">
                  <i
                    className="fa-solid fa-truck"
                    style={{ color: "var(--accent)" }}
                  />
                  <div className="info-banner-text">
                    <strong>{getCourierName(selectedContract)}</strong> ·
                    Courier Partner
                  </div>
                </div>

                {/* Contract Period */}
                <div className="card" style={{ margin: 0 }}>
                  <div className="card-header">
                    <div className="card-title">
                      <i className="fa-solid fa-calendar-days" /> Contract
                      Period
                    </div>
                  </div>
                  <div className="card-body">
                    <div className="form-row">
                      <div className="form-group">
                        <div className="form-label">Start Date</div>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            marginTop: 4,
                          }}
                        >
                          {fmtDate(selectedContract.startDate)}
                        </div>
                      </div>
                      <div className="form-group">
                        <div className="form-label">End Date</div>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            marginTop: 4,
                          }}
                        >
                          {fmtDate(selectedContract.endDate)}
                          {(() => {
                            const d = daysUntilExpiry(selectedContract.endDate);
                            return d !== null && d > 0 && d <= 60 ? (
                              <span
                                style={{
                                  marginLeft: 6,
                                  fontSize: 10,
                                  color: "var(--yellow)",
                                }}
                              >
                                ({d}d left)
                              </span>
                            ) : null;
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SLA & Terms */}
                <div className="card" style={{ margin: 0 }}>
                  <div className="card-header">
                    <div className="card-title">
                      <i className="fa-solid fa-file-contract" /> SLA &amp;
                      Terms
                    </div>
                  </div>
                  <div className="card-body">
                    <div className="form-row">
                      <div className="form-group">
                        <div className="form-label">SLA</div>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            marginTop: 4,
                          }}
                        >
                          {selectedContract.sla ?? "—"} days
                        </div>
                      </div>
                      <div className="form-group">
                        <div className="form-label">Penalty / Day</div>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            marginTop: 4,
                          }}
                        >
                          ₨{selectedContract.penalty ?? "—"}
                        </div>
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <div className="form-label">COD Settlement</div>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            marginTop: 4,
                          }}
                        >
                          {selectedContract.codDays ?? "—"} days
                        </div>
                      </div>
                      <div className="form-group">
                        <div className="form-label">Renewal Notice</div>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            marginTop: 4,
                          }}
                        >
                          {selectedContract.renewalNoticeDays ?? "—"} days
                        </div>
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <div className="form-label">Auto-Renew</div>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            marginTop: 4,
                            color:
                              selectedContract.autoRenew === true ||
                              selectedContract.autoRenew === "Yes"
                                ? "var(--green)"
                                : "var(--text-muted)",
                          }}
                        >
                          {selectedContract.autoRenew === true ||
                          selectedContract.autoRenew === "Yes" ? (
                            <>
                              <i className="fa-solid fa-check" /> Yes
                            </>
                          ) : (
                            "No"
                          )}
                        </div>
                      </div>
                      <div className="form-group">
                        <div className="form-label">Status</div>
                        <div style={{ marginTop: 4 }}>
                          <Badge label={selectedContract.status ?? "Active"} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div
              className="detail-footer"
              style={{
                padding: "12px 16px",
                borderTop: "1px solid var(--border)",
                display: "flex",
                gap: 8,
              }}
            >
              <button
                className="header-btn"
                style={{
                  flex: 1,
                  justifyContent: "center",
                  color: "var(--red)",
                  borderColor: "var(--red)",
                }}
                onClick={() => {
                  handleDelete(selectedContract._id);
                  setSelectedContract(null);
                }}
              >
                <i className="fa-solid fa-trash" /> Delete
              </button>
              <button
                className="header-btn"
                style={{ flex: 1, justifyContent: "center" }}
                onClick={() => setSelectedContract(null)}
              >
                Close
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default ContractsPanel;
