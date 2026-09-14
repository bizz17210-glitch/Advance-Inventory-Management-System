import React, { useState, useEffect } from "react";
import type { NavPanel, ExpenseCategoryName, ApiExpense } from "./types";
import { fmt, fmtDate, ErrorBanner } from "./helpers";
import api, { expensesAPI } from "../../services/api";

interface Props {
  onNav: (p: NavPanel) => void;
  editData?: ApiExpense | null;
}

interface ApiCategory {
  _id: string;
  name: string;
  isActive: boolean;
}

const LogExpensePanel: React.FC<Props> = ({ onNav, editData }) => {
  const isEdit = !!editData;
  const [description, setDescription] = useState(editData?.description || "");
  const [category, setCategory] = useState<string>(editData?.category || "");
  const [amount, setAmount] = useState(editData?.amount?.toString() || "");
  const [date, setDate] = useState(
    editData?.date
      ? new Date(editData.date).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [recent, setRecent] = useState<ApiExpense[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [categories, setCategories] = useState<ApiCategory[]>([]);

  useEffect(() => {
    expensesAPI
      .getAll({ limit: 4, status: "Active" })
      .then((r) => setRecent(r.data.data?.expenses || []))
      .catch(() => null);
    expensesAPI
      .getAnalytics({ groupBy: "category" })
      .then((r) => setSummary(r.data.data))
      .catch(() => null);
    api
      .get("/expense-categories")
      .then((r) => {
        const all: ApiCategory[] = r.data.data?.categories || [];
        setCategories(all.filter((c) => c.isActive));
      })
      .catch(() => null);
  }, [success]);

  const handleSubmit = async () => {
    if (!description || !amount || !date) return;
    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      if (isEdit && editData) {
        await expensesAPI.update(editData._id, {
          description,
          category: category as ExpenseCategoryName,
          amount: Number(amount),
          date,
        });
      } else {
        await expensesAPI.create({
          description,
          category: category as ExpenseCategoryName,
          amount: Number(amount),
          date,
        });
      }
      setSuccess(true);
      if (!isEdit) {
        setDescription("");
        setAmount("");
      }
      setTimeout(() => onNav("expenses"), 1500);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to save expense.");
    } finally {
      setSaving(false);
    }
  };

  const kpis = summary?.kpis;
  const catBreakdown: any[] = summary?.categoryBreakdown || [];

  return (
    <>
      <div className="panel-heading">
        {isEdit ? "Edit Expense" : "Log Expense"}
      </div>
      <div className="panel-desc">
        {isEdit
          ? "Update the expense details below."
          : "Record a new business expense. Provide category, amount, and payment method for accurate financial tracking."}
      </div>

      {error && <ErrorBanner message={error} />}
      {success && (
        <div className="alert-strip success" style={{ marginBottom: 14 }}>
          <i className="fa-solid fa-circle-check" />
          <div>
            {isEdit
              ? "Expense updated successfully."
              : "Expense saved successfully."}
          </div>
          <button
            className="f-btn"
            style={{ marginLeft: "auto", fontSize: 9.5 }}
            onClick={() => onNav("expenses")}
          >
            View All
          </button>
        </div>
      )}

      <div className="detail-grid-2" style={{ alignItems: "start" }}>
        {/* Form */}
        <div className="card" style={{ marginBottom: 0 }}>
          <div className="card-header">
            <div className="card-title">
              <i
                className={`fa-solid ${isEdit ? "fa-pen" : "fa-circle-plus"}`}
                style={{ color: "var(--accent)" }}
              />{" "}
              {isEdit ? "Edit Expense Entry" : "New Expense Entry"}
            </div>
          </div>
          <div className="card-body">
            <div className="f-form-row single">
              <div className="f-form-group">
                <div className="f-form-label">Description *</div>
                <input
                  className="f-form-input"
                  placeholder="e.g. Petrol for delivery riders — May Week 2"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>
            <div className="f-form-row">
              <div className="f-form-group">
                <div className="f-form-label">Category *</div>
                <select
                  className="f-form-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="">-- Select Category --</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="f-form-group">
                <div className="f-form-label">Amount (₨) *</div>
                <input
                  className="f-form-input"
                  type="number"
                  placeholder="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
            </div>
            <div className="f-form-row single">
              <div className="f-form-group">
                <div className="f-form-label">Date *</div>
                <input
                  className="f-form-input"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
            </div>
            <hr />
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="f-btn primary"
                onClick={handleSubmit}
                disabled={saving || !description || !amount}
              >
                <i className="fa-solid fa-check" />{" "}
                {saving
                  ? "Saving…"
                  : isEdit
                    ? "Update Expense"
                    : "Save Expense"}
              </button>
              <button className="f-btn" onClick={() => onNav("expenses")}>
                Cancel
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div>
          <div className="summary-box">
            <div className="summary-box-title">Category Breakdown</div>
            {catBreakdown.length === 0 ? (
              <div
                style={{
                  fontSize: 10.5,
                  color: "var(--text-muted)",
                  padding: "6px 0",
                }}
              >
                Loading…
              </div>
            ) : (
              catBreakdown.map((c: any) => (
                <div className="summary-row" key={c.category}>
                  <span>{c.category}</span>
                  <span style={{ fontWeight: 600 }}>
                    {fmt(Number(c.total))}
                  </span>
                </div>
              ))
            )}
            {kpis && (
              <div className="summary-row total">
                <span>Total</span>
                <span className="summary-val" style={{ color: "var(--red)" }}>
                  {fmt(Number(kpis.totalAmount))}
                </span>
              </div>
            )}
          </div>

          <div className="card" style={{ marginBottom: 0 }}>
            <div className="card-header">
              <div className="card-title">
                <i className="fa-solid fa-clock-rotate-left" /> Recent Entries
              </div>
            </div>
            <div className="card-body" style={{ padding: "6px 14px" }}>
              {recent.length === 0 ? (
                <div
                  style={{
                    fontSize: 10.5,
                    color: "var(--text-muted)",
                    padding: "8px 0",
                  }}
                >
                  No recent entries.
                </div>
              ) : (
                recent.map((e) => (
                  <div className="list-item" key={e._id}>
                    <div className="list-content">
                      <div className="list-title" style={{ fontSize: 10.5 }}>
                        {e.description}
                      </div>
                      <div className="list-meta">
                        {e.category} · {fmtDate(e.date)}
                      </div>
                    </div>
                    <div className="list-right">
                      <strong style={{ color: "var(--red)", fontSize: 11 }}>
                        {fmt(e.amount)}
                      </strong>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LogExpensePanel;
