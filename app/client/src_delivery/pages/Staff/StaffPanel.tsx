// ═══════════════════════════════════════════════════════════
// StaffPanel.tsx — Slide-in panel: view / edit / add
// APIs used:
//   GET  /api/users/:id          — refresh profile on open
//   PUT  /api/users/:id          — edit staff (UpdateUserPayload)
//   POST /api/auth/register      — add staff (CreateUserPayload)
//   PATCH /api/users/:id/status  — suspend / reactivate
//   GET  /api/tasks?assignee=:id&status=Pending,InProgress — tasks tab
// ═══════════════════════════════════════════════════════════

import React, { useState, useEffect } from "react";
import {
  StaffMember,
  StaffPanelTab,
  ApiRole,
  ApiStatus,
  CreateUserPayload,
  UpdateUserPayload,
} from "./staff.types";
import {
  statusDotClass,
  scoreColor,
  scoreFill,
  completionPct,
  PANEL_ACTIVITY,
  mapUserToStaff,
} from "./staffData";
import { usersAPI, authAPI, tasksAPI } from "../../services/api";
import ProgBar from "./ProgBar";
import Toggle from "./Toggle";
import PermissionsPanel from "./PermissionsPanel";

// ── Role options aligned to backend ───────────────────────
const API_ROLES: { value: ApiRole; label: string }[] = [
  { value: "Administrator", label: "Administrator" },
  { value: "OperationsManager", label: "Ops Manager" },
  { value: "InventoryManager", label: "Inventory Manager" },
  { value: "SalesOperator", label: "Sales Operator" },
  { value: "Accounts", label: "Accounts" },
  { value: "CourierHandler", label: "Courier Handler" },
  { value: "Rider", label: "Rider" },
];

// Task status helpers
const taskStatusIcon: Record<string, string> = {
  Pending: "fa-clock",
  InProgress: "fa-spinner",
  Completed: "fa-check",
  Cancelled: "fa-ban",
};
const taskStatusColor: Record<string, string> = {
  Pending: "var(--yellow)",
  InProgress: "var(--blue)",
  Completed: "var(--green)",
  Cancelled: "var(--text-muted)",
};
const taskStatusBg: Record<string, string> = {
  Pending: "var(--yellow-bg)",
  InProgress: "var(--blue-bg)",
  Completed: "var(--green-bg)",
  Cancelled: "var(--divider)",
};
const taskBadgeClass: Record<string, string> = {
  Pending: "yellow",
  InProgress: "blue",
  Completed: "green",
  Cancelled: "gray",
};

// ── Error banner ───────────────────────────────────────────
const ErrMsg: React.FC<{ msg: string }> = ({ msg }) => (
  <div
    style={{
      background: "#fef2f2",
      border: "1px solid #fecaca",
      borderRadius: 6,
      padding: "8px 12px",
      marginBottom: 12,
      fontSize: 12,
      color: "#dc2626",
      display: "flex",
      gap: 8,
    }}
  >
    <i className="fa-solid fa-circle-exclamation" /> {msg}
  </div>
);

// ── Props ──────────────────────────────────────────────────
interface Props {
  staff: StaffMember | null;
  mode: "view" | "edit" | "add";
  onClose: () => void;
  onEdit: (s: StaffMember) => void;
  onSaved: () => void;
}

// ═══════════════════════════════════════════════════════════
// Add / Edit Form — POST /api/auth/register | PUT /api/users/:id
// ═══════════════════════════════════════════════════════════
const StaffForm: React.FC<{
  staff: StaffMember | null;
  isAdd: boolean;
  onClose: () => void;
  onSaved: () => void;
}> = ({ staff, isAdd, onClose, onSaved }) => {
  const [form, setForm] = useState({
    firstName: staff?.name.split(" ")[0] ?? "",
    lastName: staff?.name.split(" ").slice(1).join(" ") ?? "",
    email: staff?.email ?? "",
    phone: staff?.phone ?? "",
    apiRole: (staff?.apiRole ?? "SalesOperator") as ApiRole,
    status: (staff?.status ?? "Active") as ApiStatus,
    password: "",
    confirmPwd: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSave = async () => {
    setError("");

    // Client-side validation
    if (!form.firstName.trim() || !form.lastName.trim())
      return setError("First and last name are required.");
    if (!form.email.trim()) return setError("Email is required.");
    if (isAdd) {
      if (!form.password) return setError("Password is required.");
      if (form.password.length < 8)
        return setError("Password must be at least 8 characters.");
      if (
        !/[A-Z]/.test(form.password) ||
        !/[a-z]/.test(form.password) ||
        !/[0-9]/.test(form.password) ||
        !/[@$!%*?&]/.test(form.password)
      )
        return setError(
          "Password must include uppercase, lowercase, number and special character (@$!%*?&).",
        );
      if (form.password !== form.confirmPwd)
        return setError("Passwords do not match.");
    }

    setSaving(true);
    try {
      if (isAdd) {
        // username: derived from email prefix, 3–30 chars, letters/numbers/underscores
        const raw = form.email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "_");
        const username = raw.slice(0, 30).padEnd(3, "_");
        const payload: CreateUserPayload = {
          username,
          email: form.email,
          password: form.password,
          firstName: form.firstName,
          lastName: form.lastName,
          phone: form.phone,
          role: form.apiRole,
        };
        await authAPI.register(payload);
      } else if (staff) {
        const payload: UpdateUserPayload = {
          firstName: form.firstName,
          lastName: form.lastName,
          phone: form.phone,
          role: form.apiRole,
          status: form.status,
        };
        await usersAPI.update(staff.id, payload);
      }
      onSaved();
      onClose();
    } catch (e: any) {
      const apiErrors = e?.response?.data?.errors;
      setError(
        apiErrors?.map((x: any) => x.message).join(", ") ??
          e?.response?.data?.message ??
          "Save failed. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="staff-panel-form">
      {error && <ErrMsg msg={error} />}

      <div className="form-row">
        <div className="form-group">
          <div className="form-label">First Name *</div>
          <input
            name="firstName"
            className="form-input"
            value={form.firstName}
            onChange={set}
            placeholder="First name"
          />
        </div>
        <div className="form-group">
          <div className="form-label">Last Name *</div>
          <input
            name="lastName"
            className="form-input"
            value={form.lastName}
            onChange={set}
            placeholder="Last name"
          />
        </div>
      </div>

      <div className="form-group" style={{ marginBottom: 10 }}>
        <div className="form-label">Email Address *</div>
        <input
          name="email"
          type="email"
          className="form-input"
          value={form.email}
          onChange={set}
          placeholder="email@company.pk"
          style={{ width: "100%" }}
          disabled={!isAdd}
        />
      </div>

      <div className="form-group" style={{ marginBottom: 10 }}>
        <div className="form-label">Phone Number</div>
        <input
          name="phone"
          className="form-input"
          value={form.phone}
          onChange={set}
          placeholder="03XX-XXXXXXX"
          style={{ width: "100%" }}
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <div className="form-label">Role *</div>
          <select
            name="apiRole"
            className="form-select"
            value={form.apiRole}
            onChange={set}
          >
            {API_ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
        {!isAdd && (
          <div className="form-group">
            <div className="form-label">Status</div>
            <select
              name="status"
              className="form-select"
              value={form.status}
              onChange={set}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Suspended">Suspended</option>
            </select>
          </div>
        )}
      </div>

      {isAdd && (
        <div className="form-row">
          <div className="form-group">
            <div className="form-label">Password *</div>
            <input
              name="password"
              type="password"
              className="form-input"
              value={form.password}
              onChange={set}
              placeholder="Min. 8 chars, mixed case + special"
            />
          </div>
          <div className="form-group">
            <div className="form-label">Confirm Password *</div>
            <input
              name="confirmPwd"
              type="password"
              className="form-input"
              value={form.confirmPwd}
              onChange={set}
              placeholder="Repeat password"
            />
          </div>
        </div>
      )}

      <hr />
      <div style={{ display: "flex", gap: 8 }}>
        <button
          className="header-btn primary"
          style={{ flex: 1, justifyContent: "center" }}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? (
            <>
              <i className="fa-solid fa-spinner fa-spin" /> Saving…
            </>
          ) : (
            <>
              <i className="fa-solid fa-check" />{" "}
              {isAdd ? "Add Staff Member" : "Save Changes"}
            </>
          )}
        </button>
        <button className="header-btn" onClick={onClose} disabled={saving}>
          Cancel
        </button>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// Profile Tab — GET /api/users/:id + PATCH /api/users/:id/status
// ═══════════════════════════════════════════════════════════
const ProfileTab: React.FC<{
  staff: StaffMember;
  onEdit: (s: StaffMember) => void;
  onStatusChange: () => void;
}> = ({ staff, onEdit, onStatusChange }) => {
  const pct = completionPct(staff);
  const sc = scoreColor(staff.score);
  const fill = scoreFill(staff.score);

  const handleStatusToggle = async (newStatus: ApiStatus) => {
    try {
      await usersAPI.updateStatus(staff.id, newStatus);
      onStatusChange();
    } catch (e: any) {
      alert(e?.response?.data?.message ?? "Status update failed.");
    }
  };

  return (
    <div className="staff-panel-content active">
      {/* Profile header */}
      <div className="panel-profile-header">
        <div
          className="panel-avatar"
          style={{ background: `${staff.color}20`, color: staff.color }}
        >
          {staff.avatar}
        </div>
        <div className="panel-profile-info">
          <div className="panel-profile-name">{staff.name}</div>
          <div className="panel-profile-sub">
            {staff.role} · {staff.dept}
          </div>
          <div className="panel-profile-status">
            <span
              className={`online-dot ${statusDotClass[staff.status]}`}
              style={{ width: 7, height: 7 }}
            />
            <span>
              {staff.status} · Last seen {staff.lastActive}
            </span>
          </div>
        </div>
        {staff.score > 0 && (
          <div className="panel-score-box">
            <div className="panel-score-val" style={{ color: sc }}>
              {staff.score}%
            </div>
            <div className="panel-score-lbl">Score</div>
          </div>
        )}
      </div>

      {/* Stats & completion bar — only shown if analytics data available */}
      {staff.tasks > 0 && (
        <>
          <div className="panel-stats-row">
            {[
              { val: staff.tasks, lbl: "Tasks MTD" },
              { val: staff.orders || "—", lbl: "Orders" },
              { val: staff.errors, lbl: "Cancelled" },
            ].map((item) => (
              <div className="panel-stat" key={item.lbl}>
                <div className="panel-stat-val">{item.val}</div>
                <div className="panel-stat-lbl">{item.lbl}</div>
              </div>
            ))}
          </div>
          <div className="panel-completion">
            <div className="panel-completion-top">
              <span>Task Completion Rate</span>
              <span style={{ color: sc, fontWeight: 700 }}>{pct}%</span>
            </div>
            <ProgBar pct={pct} fill={fill} width={999} />
          </div>
        </>
      )}

      {/* Detail rows */}
      <div className="detail-row">
        <div className="detail-key">Email</div>{" "}
        <div className="detail-val">{staff.email}</div>
      </div>
      <div className="detail-row">
        <div className="detail-key">Phone</div>{" "}
        <div className="detail-val">{staff.phone}</div>
      </div>
      <div className="detail-row">
        <div className="detail-key">Role</div>{" "}
        <div className="detail-val">
          <span className="tag">{staff.role}</span>
        </div>
      </div>
      <div className="detail-row">
        <div className="detail-key">Department</div>
        <div className="detail-val">{staff.dept}</div>
      </div>
      <div className="detail-row">
        <div className="detail-key">Joined</div>{" "}
        <div className="detail-val">{staff.joined}</div>
      </div>
      <div className="detail-row">
        <div className="detail-key">Staff ID</div>
        <div className="detail-val">
          <code className="staff-id-code">
            {staff.id.slice(-8).toUpperCase()}
          </code>
        </div>
      </div>

      <hr />
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button className="header-btn primary" onClick={() => onEdit(staff)}>
          <i className="fa-solid fa-pen" /> Edit
        </button>
        {staff.status !== "Suspended" ? (
          <button
            className="header-btn"
            style={{ color: "var(--red)", borderColor: "var(--red)" }}
            onClick={() => handleStatusToggle("Suspended")}
          >
            <i className="fa-solid fa-ban" /> Suspend
          </button>
        ) : (
          <button
            className="header-btn"
            style={{ color: "var(--green)", borderColor: "var(--green)" }}
            onClick={() => handleStatusToggle("Active")}
          >
            <i className="fa-solid fa-circle-check" /> Reactivate
          </button>
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// Tasks Tab — GET /api/tasks?assignee=:id&status=Pending,InProgress
// ═══════════════════════════════════════════════════════════
const TasksTab: React.FC<{ staffId: string }> = ({ staffId }) => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await tasksAPI.getAll({ assignee: staffId, limit: 10 });
        // Backend wraps in data.tasks or data (check actual shape)
        const raw = res.data?.data?.tasks ?? res.data?.data ?? [];
        setTasks(Array.isArray(raw) ? raw : []);
      } catch (e: any) {
        setError(e?.response?.data?.message ?? "Failed to load tasks.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [staffId]);

  return (
    <div className="staff-panel-content active">
      <div className="panel-section-label">Recent Tasks</div>

      {loading &&
        Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            style={{
              height: 40,
              background: "var(--divider)",
              borderRadius: 6,
              marginBottom: 8,
            }}
          />
        ))}

      {!loading && error && (
        <div style={{ fontSize: 11, color: "var(--red)", padding: "8px 0" }}>
          <i
            className="fa-solid fa-circle-exclamation"
            style={{ marginRight: 4 }}
          />
          {error}
        </div>
      )}

      {!loading && !error && tasks.length === 0 && (
        <div className="empty-state" style={{ padding: "20px 0" }}>
          <i className="fa-solid fa-clipboard-list" />
          <h4>No tasks assigned</h4>
          <p>This staff member has no active tasks.</p>
        </div>
      )}

      {!loading &&
        !error &&
        tasks.map((t: any) => {
          const status = t.status ?? "Pending";
          const priority = t.priority ?? "Normal";
          const due = t.dueDate
            ? new Date(t.dueDate).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
              })
            : "—";
          return (
            <div className="list-item" key={t._id} style={{ padding: "6px 0" }}>
              <div
                className="list-icon"
                style={{ background: taskStatusBg[status] ?? "var(--divider)" }}
              >
                <i
                  className={`fa-solid ${taskStatusIcon[status] ?? "fa-circle-dot"}`}
                  style={{
                    fontSize: 10,
                    color: taskStatusColor[status] ?? "var(--text-muted)",
                  }}
                />
              </div>
              <div className="list-content">
                <div className="list-title">{t.title}</div>
                <div className="list-meta">
                  Due: {due} ·{" "}
                  <span
                    style={{
                      color:
                        priority === "High"
                          ? "var(--accent)"
                          : "var(--text-muted)",
                    }}
                  >
                    {priority}
                  </span>
                </div>
              </div>
              <div className="list-right">
                <span className={`badge ${taskBadgeClass[status] ?? "gray"}`}>
                  {status}
                </span>
              </div>
            </div>
          );
        })}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// Activity Tab — static (no audit endpoint exposed)
// ═══════════════════════════════════════════════════════════
const ActivityTab: React.FC = () => (
  <div className="staff-panel-content active">
    <div className="panel-section-label">Recent Activity</div>
    {PANEL_ACTIVITY.map((a, i) => (
      <div className="list-item" key={i} style={{ padding: "5px 0" }}>
        <div className="list-icon">
          <i
            className="fa-solid fa-circle-dot ic-orange"
            style={{ fontSize: 9 }}
          />
        </div>
        <div className="list-content">
          <div className="list-title" style={{ fontSize: 11.5 }}>
            {a.action}
          </div>
          <div className="list-meta">
            {a.module} · {a.time}
          </div>
        </div>
      </div>
    ))}
  </div>
);

// ═══════════════════════════════════════════════════════════
// Main Panel shell
// ═══════════════════════════════════════════════════════════
const StaffPanel: React.FC<Props> = ({
  staff,
  mode,
  onClose,
  onEdit,
  onSaved,
}) => {
  const [activeTab, setActiveTab] = useState<StaffPanelTab>("profile");
  // Refreshed staff data from GET /api/users/:id
  const [liveStaff, setLiveStaff] = useState<StaffMember | null>(staff);
  const [profileLoading, setProfileLoading] = useState(false);

  // Reset tab + reload profile whenever staff/mode changes
  useEffect(() => {
    setActiveTab("profile");
    setLiveStaff(staff);

    if (mode === "view" && staff?.id) {
      setProfileLoading(true);
      usersAPI
        .getById(staff.id)
        .then((res) => {
          const fresh = mapUserToStaff(res.data.data);
          // Preserve perf data from the list (not returned by GET /api/users/:id)
          setLiveStaff({
            ...fresh,
            tasks: staff.tasks,
            completed: staff.completed,
            orders: staff.orders,
            errors: staff.errors,
            score: staff.score,
          });
        })
        .catch(() => {
          /* Keep stale data — non-critical */
        })
        .finally(() => setProfileLoading(false));
    }
  }, [staff, mode]);

  const isAdd = mode === "add";
  const isEdit = mode === "edit";
  const title = isAdd
    ? "Add New Staff Member"
    : isEdit
      ? "Edit Staff Member"
      : (liveStaff?.name ?? "");

  return (
    <>
      <div id="staff-backdrop" className="open" onClick={onClose} />
      <div id="staff-detail-panel" className="open">
        <div className="staff-panel-header">
          <div className="staff-panel-title">{title}</div>
          <button className="staff-panel-close" onClick={onClose}>
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <div id="staff-panel-body">
          {/* ── Add / Edit Form ─────────────────────────── */}
          {(isAdd || isEdit) && (
            <StaffForm
              staff={isEdit ? liveStaff : null}
              isAdd={isAdd}
              onClose={onClose}
              onSaved={onSaved}
            />
          )}

          {/* ── View Mode ───────────────────────────────── */}
          {mode === "view" && liveStaff && (
            <>
              <div className="staff-panel-tabs">
                {(
                  [
                    "profile",
                    "permissions",
                    "tasks",
                    "activity",
                  ] as StaffPanelTab[]
                ).map((t) => (
                  <div
                    key={t}
                    className={`staff-panel-tab ${activeTab === t ? "active" : ""}`}
                    onClick={() => setActiveTab(t)}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </div>
                ))}
              </div>

              {activeTab === "profile" &&
                (profileLoading ? (
                  <div style={{ padding: 16 }}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div
                        key={i}
                        style={{
                          height: 12,
                          background: "var(--divider)",
                          borderRadius: 4,
                          marginBottom: 10,
                          width: `${60 + (i % 3) * 20}%`,
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <ProfileTab
                    staff={liveStaff}
                    onEdit={onEdit}
                    onStatusChange={() => {
                      onSaved();
                      onClose();
                    }}
                  />
                ))}

              {activeTab === "permissions" && (
                <div className="staff-panel-content active">
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--text-muted)",
                      marginBottom: 12,
                    }}
                  >
                    Permissions are inherited from the{" "}
                    <strong>{liveStaff.role}</strong> role.
                  </div>
                  <PermissionsPanel role={liveStaff.role} />
                </div>
              )}

              {activeTab === "tasks" && <TasksTab staffId={liveStaff.id} />}
              {activeTab === "activity" && <ActivityTab />}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default StaffPanel;
