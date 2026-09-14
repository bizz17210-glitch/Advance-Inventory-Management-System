import React, { useEffect, useState, useCallback } from "react";
import { usersAPI } from "../../services/api";
import type { AuthUser } from "../../services/types/auth";

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

interface UserRow extends AuthUser {
  _suspended?: boolean;
}

// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════

const AVATAR_COLORS = [
  "#FF6A00",
  "#16A34A",
  "#2563EB",
  "#EC4899",
  "#059669",
  "#D97706",
  "#7C3AED",
  "#0891B2",
  "#DC2626",
];

const initials = (u: AuthUser) =>
  `${u.firstName?.[0] ?? ""}${u.lastName?.[0] ?? ""}`.toUpperCase() ||
  u.username[0].toUpperCase();

const roleLabel: Record<string, string> = {
  Administrator: "Administrator",
  OperationsManager: "Ops Manager",
  InventoryManager: "Inventory Mgr",
  SalesOperator: "Sales Operator",
  Accounts: "Accounts",
  CourierHandler: "Courier Handler",
  Rider: "Rider",
};

// ═══════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════

const SessionsPanel: React.FC = () => {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [suspending, setSuspending] = useState<Set<string>>(new Set());
  const [totalActive, setTotalActive] = useState(0);

  // ── Fetch active users ───────────────────────────────────
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await usersAPI.getAll({ status: "Active", limit: 50 });
      const data = res.data?.data;
      const list: AuthUser[] = data?.users ?? [];
      setUsers(list);
      setTotalActive(data?.pagination?.totalItems ?? list.length);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Failed to load users.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // ── Suspend (terminate session proxy) ───────────────────
  const suspendUser = async (id: string) => {
    setSuspending((prev) => new Set(prev).add(id));
    try {
      await usersAPI.updateStatus(id, "Suspended");
      setUsers((prev) =>
        prev.map((u) =>
          u._id === id ? { ...u, status: "Suspended", _suspended: true } : u,
        ),
      );
      setTotalActive((prev) => prev - 1);
    } catch (err: any) {
      alert(err?.response?.data?.message ?? "Failed to suspend user.");
    } finally {
      setSuspending((prev) => {
        const s = new Set(prev);
        s.delete(id);
        return s;
      });
    }
  };

  // ── Reactivate ───────────────────────────────────────────
  const reactivateUser = async (id: string) => {
    setSuspending((prev) => new Set(prev).add(id));
    try {
      await usersAPI.updateStatus(id, "Active");
      setUsers((prev) =>
        prev.map((u) =>
          u._id === id ? { ...u, status: "Active", _suspended: false } : u,
        ),
      );
      setTotalActive((prev) => prev + 1);
    } catch (err: any) {
      alert(err?.response?.data?.message ?? "Failed to reactivate user.");
    } finally {
      setSuspending((prev) => {
        const s = new Set(prev);
        s.delete(id);
        return s;
      });
    }
  };

  // ── Suspend all except self (Administrator) ──────────────
  const suspendAll = async () => {
    const meRes = await import("../../services/api")
      .then((m) => m.authAPI.me())
      .catch(() => null);
    const myId = meRes?.data?.data?._id;

    const targets = users.filter(
      (u) => u._id !== myId && u.status === "Active",
    );
    for (const u of targets) {
      await suspendUser(u._id);
    }
  };

  const activeCount = users.filter((u) => u.status === "Active").length;
  const suspendedCount = users.filter(
    (u) => u.status === "Suspended" && u._suspended,
  ).length;

  return (
    <>
      {/* Stats */}
      <div className="mini-stats cols-3">
        <div className="mini-stat">
          <div className="ms-label">Active Users</div>
          <div className="ms-value">{loading ? "—" : totalActive}</div>
          <div className="ms-trend">Right now</div>
        </div>
        <div className="mini-stat">
          <div className="ms-label">Shown in List</div>
          <div className="ms-value">{loading ? "—" : users.length}</div>
          <div className="ms-trend">Active accounts</div>
        </div>
        <div className="mini-stat">
          <div className="ms-label">Suspended This Session</div>
          <div
            className="ms-value"
            style={{ color: suspendedCount > 0 ? "var(--red)" : undefined }}
          >
            {suspendedCount}
          </div>
          <div className="ms-trend">Since page load</div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <i className="fa-solid fa-users" /> All Active Users
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button className="t-btn" onClick={fetchUsers} disabled={loading}>
              <i className={`fa-solid fa-rotate${loading ? " fa-spin" : ""}`} />{" "}
              Refresh
            </button>
            <button
              className="t-btn danger"
              onClick={suspendAll}
              disabled={loading || activeCount <= 1}
            >
              <i className="fa-solid fa-ban" /> Suspend All Other Sessions
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="alert-strip danger" style={{ margin: "8px 14px" }}>
            <i className="fa-solid fa-circle-xmark" /> {error}
            <button
              className="t-btn"
              style={{ marginLeft: "auto" }}
              onClick={fetchUsers}
            >
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div
            style={{
              textAlign: "center",
              padding: 32,
              color: "var(--text-muted)",
              fontSize: 11,
            }}
          >
            <i
              className="fa-solid fa-spinner fa-spin"
              style={{ fontSize: 18, marginBottom: 8, display: "block" }}
            />
            Loading users…
          </div>
        ) : users.length === 0 && !error ? (
          <div className="card-body">
            <div className="empty-state">
              <i className="fa-solid fa-users" />
              <h4>No Active Users Found</h4>
              <p>No users with Active status were returned from the server.</p>
            </div>
          </div>
        ) : (
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Email</th>
                  <th>Last Login</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => {
                  const isSuspended = u.status === "Suspended";
                  const isBusy = suspending.has(u._id);
                  return (
                    <tr key={u._id} style={{ opacity: isSuspended ? 0.5 : 1 }}>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 7,
                          }}
                        >
                          <div
                            className="row-avatar"
                            style={{
                              background:
                                AVATAR_COLORS[i % AVATAR_COLORS.length],
                            }}
                          >
                            {initials(u)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 11 }}>
                              {u.firstName} {u.lastName}
                            </div>
                            <div
                              style={{
                                fontSize: 9.5,
                                color: "var(--text-muted)",
                              }}
                            >
                              @{u.username}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="tag">
                          {roleLabel[u.role] ?? u.role}
                        </span>
                      </td>
                      <td
                        style={{
                          fontSize: "10.5px",
                          color: "var(--text-secondary)",
                        }}
                      >
                        {u.email}
                      </td>
                      <td
                        style={{
                          fontSize: "10.5px",
                          color: "var(--text-muted)",
                        }}
                      >
                        {u.lastLogin
                          ? new Date(u.lastLogin).toLocaleDateString("en-PK", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "—"}
                      </td>
                      <td>
                        <span
                          className={`badge ${isSuspended ? "red" : "green"}`}
                        >
                          {isSuspended ? "Suspended" : "Active"}
                        </span>
                      </td>
                      <td>
                        {isSuspended ? (
                          <button
                            className="t-btn"
                            style={{ height: 22, fontSize: 9.5 }}
                            onClick={() => reactivateUser(u._id)}
                            disabled={isBusy}
                          >
                            {isBusy ? (
                              <i className="fa-solid fa-spinner fa-spin" />
                            ) : (
                              <>
                                <i className="fa-solid fa-unlock" /> Reactivate
                              </>
                            )}
                          </button>
                        ) : (
                          <button
                            className="t-btn danger"
                            style={{ height: 22, fontSize: 9.5 }}
                            onClick={() => suspendUser(u._id)}
                            disabled={isBusy}
                          >
                            {isBusy ? (
                              <i className="fa-solid fa-spinner fa-spin" />
                            ) : (
                              <>
                                <i className="fa-solid fa-ban" /> Suspend
                              </>
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info note — no dedicated session/IP block API */}
      <div className="alert-strip info">
        <i className="fa-solid fa-circle-info" />
        Session tracking shows Active user accounts from the backend. Suspending
        a user invalidates their access until reactivated. IP blocking is
        managed via the IP Whitelist tab once that API is available.
      </div>
    </>
  );
};

export default SessionsPanel;
