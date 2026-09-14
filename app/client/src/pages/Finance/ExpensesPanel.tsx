import React, { useState, useEffect, useCallback } from "react";
import type { NavPanel, ApiExpense } from "./types";
import {
  Badge,
  FPagination,
  EmptyState,
  fmt,
  fmtDate,
  SkeletonRows,
  ErrorBanner,
} from "./helpers";
import { expensesAPI } from "../../services/api";

// ── Expense Detail Overlay ──
export const ExpenseDetailContent: React.FC<{
  e: ApiExpense;
  onDelete?: () => void;
  onEdit?: () => void;
}> = ({ e, onDelete, onEdit }) => (
  <div>
    {(
      [
        ["Description", e.description],
        ["Category", <span className="f-tag">{e.category}</span>],
        [
          "Amount",
          <span style={{ fontSize: 15, fontWeight: 900, color: "var(--red)" }}>
            {fmt(e.amount)}
          </span>,
        ],
        ["Date", fmtDate(e.date)],
        ["Status", <Badge label={e.status} />],
        ["Logged By", e.recordedBy?.username || "—"],
      ] as [string, React.ReactNode][]
    ).map(([k, v], i) => (
      <div className="detail-row" key={i}>
        <div className="detail-key">{k}</div>
        <div className="detail-val">{v}</div>
      </div>
    ))}
    <hr />
    <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
      <button className="f-btn primary" onClick={onEdit}>
        <i className="fa-solid fa-pen" /> Edit
      </button>
      {onDelete && (
        <button className="f-btn danger" onClick={onDelete}>
          <i className="fa-solid fa-trash" /> Cancel
        </button>
      )}
    </div>
  </div>
);

// ── ExpensesPanel ──
interface Props {
  onNav: (p: NavPanel) => void;
  onOpenOverlay: (title: string, content: React.ReactNode) => void;
  onEdit: (expense: ApiExpense) => void;
}

const CHIPS = [
  "All Categories",
  "Shipping",
  "Marketing",
  "Utilities",
  "Salaries",
  "Supplies",
  "Software",
  "Other",
];
const PER_PAGE = 10;

const ExpensesPanel: React.FC<Props> = ({ onNav, onOpenOverlay, onEdit }) => {
  const [expenses, setExpenses] = useState<ApiExpense[]>([]);
  const [search, setSearch] = useState("");
  const [chip, setChip] = useState("All Categories");
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [analytics, setAnalytics] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const load = useCallback(async (pg: number, category: string) => {
    setLoading(true);
    setError("");
    try {
      const params: any = { page: pg, limit: PER_PAGE, status: "Active" };
      if (category !== "All Categories") params.category = category;

      const res = await expensesAPI.getAll(params);
      const data = res.data.data;
      setExpenses(data.expenses || []);
      setTotalItems(data.pagination?.totalItems ?? 0);
      setTotalPages(data.pagination?.totalPages ?? 1);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to load expenses.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Load analytics KPIs once
  useEffect(() => {
    expensesAPI
      .getAnalytics({ groupBy: "category" })
      .then((r) => setAnalytics(r.data.data))
      .catch(() => null);
  }, []);

  useEffect(() => {
    load(page, chip);
  }, [page, chip, load, refreshKey]);

  const filtered = search
    ? expenses.filter(
        (e) =>
          e.description.toLowerCase().includes(search.toLowerCase()) ||
          e.category.toLowerCase().includes(search.toLowerCase()),
      )
    : expenses;

  const start = (page - 1) * PER_PAGE + 1;
  const end = Math.min(page * PER_PAGE, totalItems);

  const handleChip = (c: string) => {
    setChip(c);
    setPage(1);
  };

  const handleDelete = async (id: string) => {
    try {
      await expensesAPI.delete(id, "Cancelled by user");
      load(page, chip);
    } catch {
      /* silent */
    }
  };

  const kpis = analytics?.kpis;
  const byCategory: any[] = analytics?.categoryBreakdown || [];

  const getCatAmount = (name: string) => {
    const found = byCategory.find((c: any) => c.category === name);
    return found ? Number(found.total) : 0;
  };

  return (
    <>
      <div className="panel-heading">All Expenses</div>
      <div className="panel-desc">
        Full record of all logged business expenses. Filter by category, date
        range, or amount.
      </div>

      {error && (
        <ErrorBanner message={error} onRetry={() => load(page, chip)} />
      )}

      <div className="mini-stats">
        <div className="mini-stat">
          <div className="ms-label">Total (This Month)</div>
          <div className="ms-value" style={{ color: "var(--red)" }}>
            {kpis ? fmt(Number(kpis.totalAmount)) : "…"}
          </div>
          <div className="ms-trend down">
            {kpis?.totalExpenses ?? "—"} entries
          </div>
        </div>
        <div className="mini-stat">
          <div className="ms-label">Marketing</div>
          <div className="ms-value">{fmt(getCatAmount("Marketing"))}</div>
        </div>
        <div className="mini-stat">
          <div className="ms-label">Supplies</div>
          <div className="ms-value">{fmt(getCatAmount("Supplies"))}</div>
        </div>
        <div className="mini-stat">
          <div className="ms-label">Avg Per Entry</div>
          <div className="ms-value">
            {kpis ? fmt(Number(kpis.avgPerExpense)) : "…"}
          </div>
        </div>
      </div>

      <div className="chip-group">
        {CHIPS.map((c) => (
          <div
            key={c}
            className={`chip ${chip === c ? "active" : ""}`}
            onClick={() => handleChip(c)}
          >
            {c === "All Categories" && <i className="fa-solid fa-list" />}
            {c}
          </div>
        ))}
      </div>

      <div className="card">
        <div className="f-toolbar">
          <div className="f-toolbar-left">
            <div className="f-search">
              <i className="fa-solid fa-magnifying-glass" />
              <input
                placeholder="Search expense..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <button className="f-btn">
              <i className="fa-solid fa-calendar" /> Date
            </button>
          </div>
          <div className="f-toolbar-right">
            <button
              className="f-btn"
              onClick={() => setRefreshKey((k) => k + 1)}
            >
              <i className="fa-solid fa-rotate-right" /> Refresh
            </button>
            <button className="f-btn">
              <i className="fa-solid fa-file-export" /> Export
            </button>
            <button className="f-btn primary" onClick={() => onNav("exp-add")}>
              <i className="fa-solid fa-plus" /> Log Expense
            </button>
          </div>
        </div>

        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Logged By</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonRows cols={7} rows={6} />
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <EmptyState
                      icon="fa-receipt"
                      title="No expenses"
                      desc="No expenses match the current filter."
                    />
                  </td>
                </tr>
              ) : (
                filtered.map((e) => (
                  <tr
                    key={e._id}
                    onClick={() =>
                      onOpenOverlay(
                        "Expense Detail",
                        <ExpenseDetailContent
                          e={e}
                          onDelete={() => handleDelete(e._id)}
                          onEdit={() => onEdit(e)}
                        />,
                      )
                    }
                  >
                    <td style={{ fontSize: 10 }}>{fmtDate(e.date)}</td>
                    <td>
                      <strong>{e.description}</strong>
                    </td>
                    <td>
                      <span className="f-tag">{e.category}</span>
                    </td>
                    <td>
                      <strong style={{ color: "var(--red)" }}>
                        {fmt(e.amount)}
                      </strong>
                    </td>
                    <td>{e.recordedBy?.username || "—"}</td>
                    <td>
                      <Badge label={e.status} />
                    </td>
                    <td
                      onClick={(ev) => ev.stopPropagation()}
                      style={{ display: "flex", gap: 3 }}
                    >
                      <button
                        className="f-btn"
                        style={{ height: 22, fontSize: 9.5 }}
                        onClick={() => onEdit(e)}
                      >
                        <i className="fa-solid fa-pen" />
                      </button>
                      <button
                        className="f-btn danger"
                        style={{ height: 22, fontSize: 9.5 }}
                        onClick={async () => {
                          await handleDelete(e._id);
                        }}
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
        <FPagination
          current={page}
          total={totalPages}
          totalItems={totalItems}
          start={start}
          end={end}
          onChange={setPage}
        />
      </div>
    </>
  );
};

export default ExpensesPanel;
