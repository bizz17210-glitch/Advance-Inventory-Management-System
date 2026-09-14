import React, { useState, useEffect, useCallback } from "react";
import { ToggleSwitch, fmt, ErrorBanner } from "./helpers";
import { expensesAPI } from "../../services/api";
import api from "../../services/api";

// ── Types ──────────────────────────────────────────────────
interface ApiCategory {
  _id: string;
  name: string;
  color: string;
  isActive: boolean;
}

interface CategoryRow {
  _id: string;
  name: string;
  count: number;
  amount: number;
  color: string;
  isActive: boolean;
}

// ── Modal Component ────────────────────────────────────────
interface CategoryModalProps {
  open: boolean;
  editData: ApiCategory | null;
  onClose: () => void;
  onSaved: () => void;
}

const PRESET_COLORS = [
  "#FF6A00",
  "#7C3AED",
  "#D97706",
  "#16A34A",
  "#2563EB",
  "#0891B2",
  "#EF4444",
  "#9CA3AF",
  "#F59E0B",
  "#10B981",
  "#6366F1",
  "#EC4899",
];

const CategoryModal: React.FC<CategoryModalProps> = ({
  open,
  editData,
  onClose,
  onSaved,
}) => {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#9CA3AF");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (open) {
      setName(editData?.name || "");
      setColor(editData?.color || "#9CA3AF");
      setErr("");
    }
  }, [open, editData]);

  const handleSave = async () => {
    if (!name.trim()) {
      setErr("Category name is required.");
      return;
    }
    setSaving(true);
    setErr("");
    try {
      if (editData) {
        await api.put(`/expense-categories/${editData._id}`, {
          name: name.trim(),
          color,
        });
      } else {
        await api.post("/expense-categories", { name: name.trim(), color });
      }
      onSaved();
      onClose();
    } catch (e: any) {
      setErr(e?.response?.data?.message || "Failed to save category.");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.45)",
          zIndex: 1000,
        }}
      />
      {/* Modal Box */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          background: "var(--card)",
          border: "1px solid var(--divider)",
          borderRadius: 10,
          padding: 24,
          width: 360,
          zIndex: 1001,
          boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 20,
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 14 }}>
            <i
              className={`fa-solid ${editData ? "fa-pen" : "fa-plus"}`}
              style={{ marginRight: 8, color: "var(--accent)" }}
            />
            {editData ? "Edit Category" : "Add Category"}
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-muted)",
              fontSize: 16,
            }}
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        {/* Name Input */}
        <div style={{ marginBottom: 16 }}>
          <label
            style={{
              fontSize: 11,
              color: "var(--text-muted)",
              display: "block",
              marginBottom: 6,
            }}
          >
            Category Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Rent, Travel, Packaging"
            maxLength={50}
            style={{
              width: "100%",
              padding: "8px 10px",
              borderRadius: 6,
              border: "1px solid var(--divider)",
              background: "var(--bg)",
              color: "var(--text)",
              fontSize: 12,
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Color Picker */}
        <div style={{ marginBottom: 20 }}>
          <label
            style={{
              fontSize: 11,
              color: "var(--text-muted)",
              display: "block",
              marginBottom: 8,
            }}
          >
            Color
          </label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {PRESET_COLORS.map((c) => (
              <div
                key={c}
                onClick={() => setColor(c)}
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: c,
                  cursor: "pointer",
                  border:
                    color === c
                      ? "2px solid var(--text)"
                      : "2px solid transparent",
                  boxSizing: "border-box",
                }}
              />
            ))}
          </div>
          {/* Preview */}
          <div
            style={{
              marginTop: 10,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: color,
              }}
            />
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
              Preview:{" "}
            </span>
            <strong style={{ fontSize: 12 }}>{name || "Category Name"}</strong>
          </div>
        </div>

        {/* Error */}
        {err && (
          <div
            style={{
              marginBottom: 12,
              fontSize: 11,
              color: "#EF4444",
              background: "rgba(239,68,68,0.1)",
              padding: "8px 10px",
              borderRadius: 6,
            }}
          >
            <i
              className="fa-solid fa-circle-exclamation"
              style={{ marginRight: 6 }}
            />
            {err}
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button className="f-btn" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button
            className="f-btn primary"
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
                {editData ? "Update" : "Add"}
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
};

// ── Main Panel ─────────────────────────────────────────────
const CategoriesPanel: React.FC = () => {
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ApiCategory | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // ── Load: categories list + analytics merged ──
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [catRes, analyticsRes] = await Promise.all([
        api.get("/expense-categories"),
        expensesAPI.getAnalytics({ groupBy: "category" }),
      ]);

      const cats: ApiCategory[] = catRes.data.data?.categories || [];
      const breakdown: any[] = analyticsRes.data.data?.categoryBreakdown || [];

      // Merge analytics data into category rows
      const rows: CategoryRow[] = cats.map((c) => {
        const match = breakdown.find(
          (b) => b.category.toLowerCase() === c.name.toLowerCase(),
        );
        return {
          _id: c._id,
          name: c.name,
          color: c.color,
          isActive: c.isActive,
          count: match?.count || 0,
          amount: match ? Number(match.total) : 0,
        };
      });

      setCategories(rows);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to load categories.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // ── Toggle active/inactive ──
  const handleToggle = async (cat: CategoryRow) => {
    setTogglingId(cat._id);
    try {
      await api.put(`/expense-categories/${cat._id}`, {
        isActive: !cat.isActive,
      });
      setCategories((prev) =>
        prev.map((c) =>
          c._id === cat._id ? { ...c, isActive: !cat.isActive } : c,
        ),
      );
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to update status.");
    } finally {
      setTogglingId(null);
    }
  };

  // ── Donut chart ──
  const total = categories.reduce((s, c) => s + c.amount, 0);
  const gradient =
    categories.length > 0
      ? categories
          .map((c, i, arr) => {
            const pct = (c.amount / total) * 100;
            const start = arr
              .slice(0, i)
              .reduce((s, x) => s + (x.amount / total) * 100, 0);
            return `${c.color} ${start.toFixed(1)}% ${(start + pct).toFixed(1)}%`;
          })
          .join(",")
      : "var(--divider) 0% 100%";

  return (
    <>
      <div className="panel-heading">Expense Categories</div>
      <div className="panel-desc">
        Manage expense categories. Add, rename, or deactivate categories to keep
        your financial records organised.
      </div>

      {error && <ErrorBanner message={error} onRetry={load} />}

      <div className="detail-grid-2">
        {/* Category List */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <div className="card-title">
              <i className="fa-solid fa-tags" /> Category List
            </div>
            <button
              className="f-btn primary"
              onClick={() => {
                setEditTarget(null);
                setModalOpen(true);
              }}
            >
              <i className="fa-solid fa-plus" /> Add Category
            </button>
          </div>
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Expenses</th>
                  <th>Amount</th>
                  <th>Active</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 5 }).map((_, j) => (
                        <td key={j}>
                          <div
                            style={{
                              height: 10,
                              borderRadius: 3,
                              background: "var(--divider)",
                              width: j === 0 ? "70%" : "50%",
                            }}
                          />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : categories.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      style={{
                        textAlign: "center",
                        padding: 24,
                        color: "var(--text-muted)",
                        fontSize: 11,
                      }}
                    >
                      No categories found.
                    </td>
                  </tr>
                ) : (
                  categories.map((c) => (
                    <tr key={c._id} style={{ opacity: c.isActive ? 1 : 0.5 }}>
                      <td>
                        <div className="td-flex">
                          <div
                            style={{
                              width: 12,
                              height: 12,
                              borderRadius: "50%",
                              background: c.color,
                              flexShrink: 0,
                              boxShadow: `0 0 0 2px ${c.color}33, 0 0 6px ${c.color}66`,
                            }}
                          />
                          <strong>{c.name}</strong>
                        </div>
                      </td>
                      <td>{c.count}</td>
                      <td>
                        <strong>{fmt(c.amount)}</strong>
                      </td>
                      <td>
                        <ToggleSwitch
                          key={`${c._id}-${c.isActive}`}
                          defaultChecked={c.isActive}
                          disabled={togglingId !== null && togglingId !== c._id}
                          loading={togglingId === c._id}
                          onChange={() => handleToggle(c)}
                        />
                      </td>
                      <td>
                        <button
                          className="f-btn"
                          style={{ height: 22, fontSize: 9.5 }}
                          onClick={() => {
                            setEditTarget({
                              _id: c._id,
                              name: c.name,
                              color: c.color,
                              isActive: c.isActive,
                            });
                            setModalOpen(true);
                          }}
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

        {/* Donut Chart */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <div className="card-title">
              <i className="fa-solid fa-chart-pie" /> Expense Breakdown
            </div>
          </div>
          <div className="card-body">
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  width: 110,
                  height: 110,
                  borderRadius: "50%",
                  background: `conic-gradient(${gradient})`,
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    width: 70,
                    height: 70,
                    borderRadius: "50%",
                    background: "var(--card)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 900 }}>
                    {loading ? "…" : `₨${(total / 1000).toFixed(0)}k`}
                  </div>
                  <div style={{ fontSize: 8.5, color: "var(--text-muted)" }}>
                    Total
                  </div>
                </div>
              </div>
            </div>
            <div className="donut-legend">
              {categories
                .filter((c) => c.amount > 0)
                .map((c) => (
                  <div className="donut-legend-item" key={c._id}>
                    <div
                      className="donut-dot"
                      style={{ background: c.color }}
                    />
                    <span style={{ flex: 1 }}>{c.name}</span>
                    <strong>{fmt(c.amount)}</strong>
                    <span
                      style={{
                        color: "var(--text-muted)",
                        marginLeft: 6,
                        fontSize: 9.5,
                      }}
                    >
                      {total > 0 ? ((c.amount / total) * 100).toFixed(1) : "0"}%
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      <CategoryModal
        open={modalOpen}
        editData={editTarget}
        onClose={() => setModalOpen(false)}
        onSaved={load}
      />
    </>
  );
};

export default CategoriesPanel;
