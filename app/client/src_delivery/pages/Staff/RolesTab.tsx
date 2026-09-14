// ═══════════════════════════════════════════════════════════
// RolesTab.tsx — Tab 2: Roles & Access
// Member counts are fetched live from GET /api/users
// ═══════════════════════════════════════════════════════════

import React, { useState, useEffect } from "react";
import { AccessLevel, ApiRole } from "./staff.types";
import { ROLES_DATA, MATRIX_MODULES, levelBadgeClass } from "./staffData";
import { usersAPI } from "../../services/api";
import ThreeDot from "./ThreeDot";
import Toggle from "./Toggle";
import PermissionsPanel from "./PermissionsPanel";

const MATRIX_COLS = [
  "Admin",
  "Ops Manager",
  "Inventory Mgr",
  "Sales Operator",
  "Accounts",
  "Courier Handler",
  "Rider",
];

// ── Role → ApiRole key map (display name → backend key) ──
const ROLE_NAME_TO_API: Record<string, ApiRole> = {
  Administrator: "Administrator",
  "Ops Manager": "OperationsManager",
  "Inventory Manager": "InventoryManager",
  "Sales Operator": "SalesOperator",
  Accounts: "Accounts",
  "Courier Handler": "CourierHandler",
  Rider: "Rider",
};

// ── Role Form Side Panel ───────────────────────────────────
interface RolePanelProps {
  editRoleName: string | null;
  onClose: () => void;
}

const RoleFormPanel: React.FC<RolePanelProps> = ({ editRoleName, onClose }) => (
  <>
    <div id="staff-backdrop" className="open" onClick={onClose} />
    <div id="staff-detail-panel" className="open">
      <div className="staff-panel-header">
        <div className="staff-panel-title">
          {editRoleName ? `Edit Role: ${editRoleName}` : "Add New Role"}
        </div>
        <button className="staff-panel-close" onClick={onClose}>
          <i className="fa-solid fa-xmark" />
        </button>
      </div>
      <div id="staff-panel-body">
        <div className="staff-panel-form">
          <div className="form-group" style={{ marginBottom: 10 }}>
            <div className="form-label">Role Name *</div>
            <input
              className="form-input"
              defaultValue={editRoleName ?? ""}
              placeholder="e.g. Warehouse Staff"
              style={{ width: "100%" }}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 10 }}>
            <div className="form-label">Description</div>
            <input
              className="form-input"
              placeholder="Brief description of this role..."
              style={{ width: "100%" }}
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <div className="form-label">Access Level</div>
              <select className="form-select">
                {(
                  [
                    "Full",
                    "High",
                    "Medium",
                    "Limited",
                    "Minimal",
                  ] as AccessLevel[]
                ).map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <div className="form-label">Status</div>
              <select className="form-select">
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </div>
          </div>
          <div className="panel-section-label" style={{ margin: "12px 0 8px" }}>
            Module Permissions
          </div>
          <div
            style={{
              fontSize: 11,
              color: "var(--text-muted)",
              marginBottom: 10,
            }}
          >
            Toggle which modules this role can access.
          </div>
          {[
            "Dashboard",
            "Products",
            "Orders",
            "Inventory",
            "Customers",
            "Couriers",
            "Riders",
            "Finance",
            "Tasks",
            "Staff",
            "Reports",
            "Settings",
          ].map((mod) => (
            <div className="perm-row" key={mod}>
              <div className="perm-label">
                {mod}
                <small>Grant access to {mod} module</small>
              </div>
              <Toggle
                checked={["Dashboard", "Orders", "Tasks"].includes(mod)}
              />
            </div>
          ))}
          <hr />
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="header-btn primary"
              style={{ flex: 1, justifyContent: "center" }}
            >
              <i className="fa-solid fa-check" />{" "}
              {editRoleName ? "Save Changes" : "Create Role"}
            </button>
            <button className="header-btn" onClick={onClose}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  </>
);

// ── Main Tab ───────────────────────────────────────────────
const RolesTab: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<{
    name: string;
    idx: number;
  } | null>(null);
  const [showRolePanel, setShowRolePanel] = useState(false);
  const [editRoleName, setEditRoleName] = useState<string | null>(null);

  // Live member counts keyed by ApiRole string
  const [memberCounts, setMemberCounts] = useState<Record<string, number>>({});
  const [countsLoading, setCountsLoading] = useState(true);

  // Fetch all users (no pagination limit — use large limit) and count by role
  useEffect(() => {
    const load = async () => {
      setCountsLoading(true);
      try {
        // Fetch up to 200 users; backend default is 20 so we pass limit explicitly
        const res = await usersAPI.getAll({ limit: 200, page: 1 });
        const users: { role: ApiRole }[] = res.data.data.users;
        const counts: Record<string, number> = {};
        users.forEach((u) => {
          counts[u.role] = (counts[u.role] ?? 0) + 1;
        });
        setMemberCounts(counts);
      } catch {
        // Non-critical — member count stays 0 if this fails
      } finally {
        setCountsLoading(false);
      }
    };
    load();
  }, []);

  // Merge static ROLES_DATA with live member counts
  const rolesWithCounts = ROLES_DATA.map((r) => ({
    ...r,
    members: memberCounts[ROLE_NAME_TO_API[r.name] ?? r.name] ?? 0,
  }));

  const totalMembers = Object.values(memberCounts).reduce((s, n) => s + n, 0);

  return (
    <>
      {/* Info Banner */}
      <div className="info-banner">
        <i className="fa-solid fa-circle-info" />
        <div className="info-banner-text">
          Role-based access control (RBAC) restricts system access based on each
          user's assigned role. Changes to permissions apply immediately to all
          staff with that role. <strong>Admin role cannot be modified.</strong>
          {!countsLoading && totalMembers > 0 && (
            <>
              {" "}
              &nbsp;·&nbsp; <strong>{totalMembers}</strong> registered user
              {totalMembers !== 1 ? "s" : ""} across all roles.
            </>
          )}
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 14 }}>
        {/* ── Roles Table ──────────────────────────────── */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <i className="fa-solid fa-shield-halved" /> System Roles
            </div>
            <div className="card-actions">
              <button
                className="header-btn primary"
                onClick={() => {
                  setEditRoleName(null);
                  setShowRolePanel(true);
                }}
              >
                <i className="fa-solid fa-plus" /> Add Role
              </button>
            </div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Role</th>
                  <th>Members</th>
                  <th>Access Level</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rolesWithCounts.map((r, i) => (
                  <tr
                    key={r.name}
                    onClick={() => setSelectedRole({ name: r.name, idx: i })}
                    style={{ cursor: "pointer" }}
                  >
                    <td>
                      <div className="td-flex">
                        <div
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background: r.color,
                            flexShrink: 0,
                          }}
                        />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 12 }}>
                            {r.name}
                          </div>
                          <div
                            style={{ fontSize: 10, color: "var(--text-muted)" }}
                          >
                            {r.desc}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      {countsLoading ? (
                        <div
                          style={{
                            width: 24,
                            height: 10,
                            background: "var(--divider)",
                            borderRadius: 3,
                          }}
                        />
                      ) : (
                        <strong>{r.members}</strong>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${levelBadgeClass[r.level]}`}>
                        {r.level}
                      </span>
                    </td>
                    <td>
                      <span className="badge green">Active</span>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <ThreeDot
                        id={`role-dot-${i}`}
                        items={[
                          {
                            label: "View Permissions",
                            icon: "fa-eye",
                            onClick: () =>
                              setSelectedRole({ name: r.name, idx: i }),
                          },
                          ...(r.name !== "Administrator"
                            ? [
                                {
                                  label: "Edit Role",
                                  icon: "fa-pen",
                                  onClick: () => {
                                    setEditRoleName(r.name);
                                    setShowRolePanel(true);
                                  },
                                },
                                { label: "---", icon: "", onClick: () => {} },
                                {
                                  label: "Delete Role",
                                  icon: "fa-trash",
                                  danger: true,
                                  onClick: () => {},
                                },
                              ]
                            : []),
                        ]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Role Detail / Permissions ─────────────────── */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <i className="fa-solid fa-sliders" />{" "}
              {selectedRole
                ? selectedRole.name
                : "Select a role to view permissions"}
            </div>
          </div>
          <div className="card-body">
            {!selectedRole ? (
              <div className="empty-state">
                <i className="fa-solid fa-hand-pointer" />
                <h4>Click a role to view its permissions</h4>
                <p>
                  Select any role from the left panel to inspect or modify its
                  access rights.
                </p>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: 12 }}>
                  <div
                    style={{ fontSize: 11.5, color: "var(--text-secondary)" }}
                  >
                    {rolesWithCounts[selectedRole.idx].desc}
                  </div>
                  <div style={{ marginTop: 6, display: "flex", gap: 6 }}>
                    <span className="tag">
                      {rolesWithCounts[selectedRole.idx].members} member
                      {rolesWithCounts[selectedRole.idx].members !== 1
                        ? "s"
                        : ""}
                    </span>
                    <span className="tag">
                      Access: {rolesWithCounts[selectedRole.idx].level}
                    </span>
                  </div>
                </div>
                <PermissionsPanel role={selectedRole.name} />
                <hr />
                {selectedRole.name !== "Administrator" ? (
                  <button className="header-btn primary">
                    <i className="fa-solid fa-check" /> Save Permissions
                  </button>
                ) : (
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    <i
                      className="fa-solid fa-lock"
                      style={{ marginRight: 4 }}
                    />
                    Admin permissions cannot be modified.
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Permissions Matrix ────────────────────────── */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <i className="fa-solid fa-table-columns" /> Permissions Matrix
          </div>
          <div className="card-actions">
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
              Overview of all roles vs modules
            </span>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Module</th>
                {MATRIX_COLS.map((c) => (
                  <th key={c} style={{ textAlign: "center" }}>
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MATRIX_MODULES.map((m) => (
                <tr key={m.mod}>
                  <td>
                    <strong style={{ fontSize: 12 }}>{m.mod}</strong>
                  </td>
                  {m.perms.map((p, i) => (
                    <td key={i} style={{ textAlign: "center" }}>
                      {p ? (
                        <i
                          className="fa-solid fa-circle-check"
                          style={{ color: "#22C55E", fontSize: 13 }}
                        />
                      ) : (
                        <i
                          className="fa-solid fa-circle-xmark"
                          style={{ color: "#E5E7EB", fontSize: 13 }}
                        />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Add / Edit Role Panel ─────────────────────── */}
      {showRolePanel && (
        <RoleFormPanel
          editRoleName={editRoleName}
          onClose={() => setShowRolePanel(false)}
        />
      )}
    </>
  );
};

export default RolesTab;
