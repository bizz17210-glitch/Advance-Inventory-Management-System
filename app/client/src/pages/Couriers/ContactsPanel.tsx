import React, { useState, useEffect, useCallback } from "react";
import { ApiCourier, EmptyState, TableSkeleton } from "./shared";
import { couriersAPI, courierContactsAPI } from "../../services/api";
import CitySearchInput from "../../components/shared/CitySearchInput";

// ── Type ──────────────────────────────────────────────────
interface ApiContact {
  _id: string;
  courier: string;
  courierName: string;
  name: string;
  role: string;
  phone: string;
  email?: string;
  city?: string;
  lastContact?: string;
  notes?: string;
}

const ContactsPanel: React.FC = () => {
  const [contacts, setContacts] = useState<ApiContact[]>([]);
  const [couriers, setCouriers] = useState<ApiCourier[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ApiContact | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState("");

  // Form state
  const [form, setForm] = useState({
    courierId: "",
    name: "",
    role: "Account Manager",
    city: "",
    phone: "",
    email: "",
    lastContact: "",
    notes: "",
  });

  // ── Fetch contacts ────────────────────────────────────
  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await courierContactsAPI.getAll({ limit: 100 });
      setContacts(res.data?.data?.contacts ?? []);
    } catch {
      setContacts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Fetch couriers for dropdown ───────────────────────
  useEffect(() => {
    fetchContacts();
    couriersAPI
      .getAll({ limit: 50 })
      .then((r) => setCouriers(r.data?.data?.couriers ?? []))
      .catch(() => {});
  }, [fetchContacts]);

  // ── Open Add drawer ───────────────────────────────────
  const openAdd = () => {
    setEditTarget(null);
    setForm({
      courierId: "",
      name: "",
      role: "Account Manager",
      city: "",
      phone: "",
      email: "",
      lastContact: "",
      notes: "",
    });
    setSaveErr("");
    setDrawerOpen(true);
  };

  // ── Open Edit drawer ──────────────────────────────────
  const openEdit = (c: ApiContact) => {
    setEditTarget(c);
    setForm({
      courierId: c.courier,
      name: c.name,
      role: c.role,
      city: c.city ?? "",
      phone: c.phone,
      email: c.email ?? "",
      lastContact: c.lastContact ? c.lastContact.slice(0, 10) : "",
      notes: c.notes ?? "",
    });
    setSaveErr("");
    setDrawerOpen(true);
  };

  // ── Save (create or update) ───────────────────────────
  const handleSave = async () => {
    if (!form.name.trim() || !form.phone.trim() || !form.courierId) {
      setSaveErr("Courier, name and phone are required.");
      return;
    }
    setSaving(true);
    setSaveErr("");
    try {
      const payload = {
        courierId: form.courierId,
        name: form.name.trim(),
        role: form.role,
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        city: form.city.trim() || undefined,
        lastContact: form.lastContact || undefined,
        notes: form.notes.trim() || undefined,
      };
      if (editTarget) {
        await courierContactsAPI.update(editTarget._id, payload);
      } else {
        await courierContactsAPI.create(payload);
      }
      fetchContacts();
      setDrawerOpen(false);
    } catch (e: any) {
      setSaveErr(e?.response?.data?.message ?? "Failed to save contact.");
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this contact?")) return;
    try {
      await courierContactsAPI.delete(id);
      fetchContacts();
    } catch {
      /* ignore */
    }
  };

  // ── Client-side search filter ─────────────────────────
  const filtered = search.trim()
    ? contacts.filter((c) => {
        const q = search.toLowerCase();
        return (
          c.name.toLowerCase().includes(q) ||
          c.courierName.toLowerCase().includes(q) ||
          c.role.toLowerCase().includes(q)
        );
      })
    : contacts;

  return (
    <>
      <div className="panel-heading">Contacts &amp; Rates</div>
      <div className="panel-desc">
        Directory of all courier contact persons, account managers, and their
        agreed rate structures.
      </div>

      {/* ── CONTACTS TABLE ── */}
      <div className="card">
        <div className="c-toolbar">
          <div className="c-toolbar-left">
            <div className="c-search">
              <i className="fa-solid fa-magnifying-glass" />
              <input
                placeholder="Search name, courier, role..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button className="c-btn" onClick={fetchContacts}>
              <i className="fa-solid fa-rotate-right" /> Refresh
            </button>
          </div>
          <div className="c-toolbar-right">
            <button className="c-btn primary" onClick={openAdd}>
              <i className="fa-solid fa-plus" /> Add Contact
            </button>
          </div>
        </div>

        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>Courier</th>
                <th>Contact Name</th>
                <th>Role</th>
                <th>Phone</th>
                <th>Email</th>
                <th>City</th>
                <th>Last Contact</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeleton rows={5} cols={8} />
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <EmptyState
                      icon="fa-address-book"
                      title="No contacts found"
                      desc="Add your first courier contact."
                    />
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
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
                          {c.courierName.slice(0, 3).toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 500 }}>{c.courierName}</span>
                      </div>
                    </td>
                    <td>
                      <strong>{c.name}</strong>
                    </td>
                    <td>
                      <span className="tag">{c.role}</span>
                    </td>
                    <td style={{ fontSize: 11 }}>{c.phone}</td>
                    <td>
                      {c.email ? (
                        <a
                          href={`mailto:${c.email}`}
                          style={{
                            color: "var(--blue)",
                            fontSize: 10.5,
                            textDecoration: "none",
                          }}
                        >
                          {c.email}
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>{c.city ?? "—"}</td>
                    <td style={{ fontSize: 10.5, color: "var(--text-muted)" }}>
                      {c.lastContact
                        ? new Date(c.lastContact).toLocaleDateString()
                        : "—"}
                    </td>
                    <td>
                      <button
                        className="c-btn"
                        style={{ height: 23, fontSize: 9.5 }}
                        onClick={() => openEdit(c)}
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
                        onClick={() => handleDelete(c._id)}
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

        <div className="pagination">
          <div className="pagination-info">
            Showing <strong>{filtered.length}</strong> of{" "}
            <strong>{contacts.length}</strong> contacts
          </div>
        </div>
      </div>

      {/* ── BACKDROP ── */}
      {drawerOpen && (
        <div
          onClick={() => setDrawerOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.18)",
            zIndex: 500,
          }}
        />
      )}

      {/* ── RIGHT DRAWER ── */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: 420,
          background: "var(--card)",
          borderLeft: "1px solid var(--border)",
          zIndex: 501,
          display: "flex",
          flexDirection: "column",
          boxShadow: "-4px 0 24px rgba(0,0,0,0.10)",
          transform: drawerOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.25s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 18px",
            borderBottom: "1px solid var(--border)",
            flexShrink: 0,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 800,
                color: "var(--text-primary)",
              }}
            >
              <i
                className={`fa-solid ${editTarget ? "fa-pen" : "fa-user-plus"}`}
                style={{ marginRight: 7, color: "var(--accent)" }}
              />
              {editTarget ? "Edit Contact" : "Add New Contact"}
            </div>
            <div
              style={{
                fontSize: 10.5,
                color: "var(--text-muted)",
                marginTop: 2,
              }}
            >
              {editTarget
                ? `Editing ${editTarget.name}`
                : "Fill in the details below and save."}
            </div>
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            style={{
              width: 30,
              height: 30,
              border: "1px solid var(--border)",
              background: "var(--bg)",
              borderRadius: 6,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              fontSize: 13,
              color: "var(--text-muted)",
            }}
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: 18 }}>
          {saveErr && (
            <div
              style={{
                color: "var(--red)",
                fontSize: 12,
                marginBottom: 12,
                padding: "6px 10px",
                background: "var(--red-bg)",
                borderRadius: 6,
              }}
            >
              <i className="fa-solid fa-circle-exclamation" /> {saveErr}
            </div>
          )}

          <div className="c-form-group" style={{ marginBottom: 12 }}>
            <div className="c-form-label">Courier Company *</div>
            <select
              className="c-form-select"
              style={{ width: "100%" }}
              value={form.courierId}
              onChange={(e) =>
                setForm((f) => ({ ...f, courierId: e.target.value }))
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

          <div className="c-form-group" style={{ marginBottom: 12 }}>
            <div className="c-form-label">Contact Name *</div>
            <input
              className="c-form-input"
              style={{ width: "100%" }}
              placeholder="e.g. Ahmed Khan"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>

          <div className="c-form-group" style={{ marginBottom: 12 }}>
            <div className="c-form-label">Role / Designation</div>
            <select
              className="c-form-select"
              style={{ width: "100%" }}
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
            >
              <option>Account Manager</option>
              <option>Sales Rep</option>
              <option>Ops Manager</option>
              <option>Key Account</option>
              <option>Support</option>
            </select>
          </div>

          <div className="c-form-group" style={{ marginBottom: 12 }}>
            <div className="c-form-label">City</div>
            <CitySearchInput
              value={form.city}
              onChange={(val) => setForm((f) => ({ ...f, city: val }))}
              placeholder="Search city..."
            />
          </div>

          <div className="c-form-group" style={{ marginBottom: 12 }}>
            <div className="c-form-label">Phone *</div>
            <input
              className="c-form-input"
              style={{ width: "100%" }}
              placeholder="03XX-XXXXXXX"
              value={form.phone}
              onChange={(e) =>
                setForm((f) => ({ ...f, phone: e.target.value }))
              }
            />
          </div>

          <div className="c-form-group" style={{ marginBottom: 12 }}>
            <div className="c-form-label">Email</div>
            <input
              className="c-form-input"
              style={{ width: "100%" }}
              type="email"
              placeholder="contact@courier.com"
              value={form.email}
              onChange={(e) =>
                setForm((f) => ({ ...f, email: e.target.value }))
              }
            />
          </div>

          <div className="c-form-group" style={{ marginBottom: 12 }}>
            <div className="c-form-label">Last Contact Date</div>
            <input
              className="c-form-input"
              style={{ width: "100%" }}
              type="date"
              value={form.lastContact}
              onChange={(e) =>
                setForm((f) => ({ ...f, lastContact: e.target.value }))
              }
            />
          </div>

          <div className="c-form-group" style={{ marginBottom: 12 }}>
            <div className="c-form-label">Notes</div>
            <textarea
              className="c-form-textarea"
              style={{ width: "100%", height: 80 }}
              placeholder="Any additional notes about this contact..."
              value={form.notes}
              onChange={(e) =>
                setForm((f) => ({ ...f, notes: e.target.value }))
              }
            />
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "14px 18px",
            borderTop: "1px solid var(--border)",
            display: "flex",
            gap: 8,
            flexShrink: 0,
            background: "var(--card)",
          }}
        >
          <button
            className="c-btn primary"
            style={{ flex: 1, justifyContent: "center" }}
            onClick={handleSave}
            disabled={
              saving ||
              !form.name.trim() ||
              !form.phone.trim() ||
              !form.courierId
            }
          >
            <i
              className={`fa-solid ${saving ? "fa-spinner fa-spin" : "fa-check"}`}
            />{" "}
            {saving
              ? "Saving…"
              : editTarget
                ? "Update Contact"
                : "Save Contact"}
          </button>
          <button
            className="c-btn"
            style={{ flex: 1, justifyContent: "center" }}
            onClick={() => setDrawerOpen(false)}
          >
            Cancel
          </button>
        </div>
      </div>
    </>
  );
};

export default ContactsPanel;
