import React, { useState, useEffect, useCallback } from "react";
import type { NavPanel, SupplierSummaryItem } from "./types";
import {
  Badge,
  FPagination,
  EmptyState,
  fmt,
  fmtDate,
  SkeletonRows,
  ErrorBanner,
} from "./helpers";
import { suppliersAPI } from "../../services/api";

// ── Supplier Detail Overlay ──
export const SupplierDetailContent: React.FC<{
  s: SupplierSummaryItem;
  onNav: (p: NavPanel) => void;
}> = ({ s, onNav }) => (
  <div>
    <div style={{ marginBottom: 14 }}>
      <Badge label={s.status} />
    </div>
    {(
      [
        ["Total Purchased", fmt(s.totalPurchases)],
        [
          "Total Paid",
          <span style={{ color: "var(--green)" }}>{fmt(s.totalPaid)}</span>,
        ],
        [
          "Balance Due",
          <span
            style={{
              fontSize: 16,
              fontWeight: 900,
              color: s.outstanding > 0 ? "var(--red)" : "var(--green)",
            }}
          >
            {s.outstanding > 0 ? fmt(s.outstanding) : "Cleared"}
          </span>,
        ],
        ["Last Payment", s.lastPaymentDate ? fmtDate(s.lastPaymentDate) : "—"],
      ] as [string, React.ReactNode][]
    ).map(([k, v], i) => (
      <div className="detail-row" key={i}>
        <div className="detail-key">{k}</div>
        <div className="detail-val">{v}</div>
      </div>
    ))}
    <hr />
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
      {s.outstanding > 0 && (
        <button className="f-btn primary" onClick={() => onNav("sup-add")}>
          <i className="fa-solid fa-money-bill-transfer" /> Record Payment
        </button>
      )}
      <button className="f-btn" onClick={() => onNav("sup-payments")}>
        <i className="fa-solid fa-clock-rotate-left" /> Payment History
      </button>
    </div>
  </div>
);

// ── SuppliersPanel ──
interface Props {
  onNav: (p: NavPanel) => void;
  onOpenOverlay: (title: string, content: React.ReactNode) => void;
}

const PER_PAGE = 10;

const SuppliersPanel: React.FC<Props> = ({ onNav, onOpenOverlay }) => {
  const [suppliers, setSuppliers] = useState<SupplierSummaryItem[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [totals, setTotals] = useState<any>(null);

  const load = useCallback(
    async (pg: number) => {
      setLoading(true);
      setError("");
      try {
        const res = await suppliersAPI.getPaymentsSummary({
          sortBy: "outstanding",
          order: "desc",
        });
        const data = res.data.data;
        const summary: SupplierSummaryItem[] = data.summary || [];
        setTotals(data.totals || null);

        // client-side search + paginate since summary endpoint returns all
        const filtered = search
          ? summary.filter((s) =>
              s.name.toLowerCase().includes(search.toLowerCase()),
            )
          : summary;

        setTotalItems(filtered.length);
        setTotalPages(Math.ceil(filtered.length / PER_PAGE) || 1);
        setSuppliers(filtered.slice((pg - 1) * PER_PAGE, pg * PER_PAGE));
      } catch (e: any) {
        setError(e?.response?.data?.message || "Failed to load suppliers.");
      } finally {
        setLoading(false);
      }
    },
    [search],
  ); // re-run when search changes

  useEffect(() => {
    load(page);
  }, [page, load]);

  const start = (page - 1) * PER_PAGE + 1;
  const end = Math.min(page * PER_PAGE, totalItems);

  const overdue = suppliers.filter((s) => s.status === "high");

  return (
    <>
      <div className="panel-heading">Supplier Balances</div>
      <div className="panel-desc">
        View outstanding balances owed to each supplier. Track purchase history,
        payments made, and overdue amounts.
      </div>

      {error && <ErrorBanner message={error} onRetry={() => load(page)} />}

      {overdue.length > 0 && (
        <div className="alert-strip warn">
          <i className="fa-solid fa-triangle-exclamation" />
          <div>
            <strong>{overdue[0].name}</strong> has a high outstanding balance of{" "}
            <strong>{fmt(overdue[0].outstanding)}</strong>.
          </div>
          <button
            className="f-btn primary"
            style={{ marginLeft: "auto", fontSize: 9.5 }}
            onClick={() => onNav("sup-add")}
          >
            <i className="fa-solid fa-money-bill-transfer" /> Pay Now
          </button>
        </div>
      )}

      <div className="mini-stats cols-3">
        <div className="mini-stat">
          <div className="ms-label">Total Supplier Dues</div>
          <div className="ms-value" style={{ color: "var(--yellow)" }}>
            {totals ? fmt(totals.totalOutstanding) : "…"}
          </div>
          <div className="ms-trend down">
            {totals?.supplierCount ?? "—"} suppliers
          </div>
        </div>
        <div className="mini-stat">
          <div className="ms-label">Total Paid</div>
          <div className="ms-value" style={{ color: "var(--green)" }}>
            {totals ? fmt(totals.totalPaid) : "…"}
          </div>
          <div className="ms-trend up">
            <i className="fa-solid fa-circle-check" /> all time
          </div>
        </div>
        <div className="mini-stat">
          <div className="ms-label">Total Purchased</div>
          <div className="ms-value">
            {totals ? fmt(totals.totalPurchases) : "…"}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="f-toolbar">
          <div className="f-toolbar-left">
            <div className="f-search">
              <i className="fa-solid fa-magnifying-glass" />
              <input
                placeholder="Search supplier..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>
          <div className="f-toolbar-right">
            <button className="f-btn">
              <i className="fa-solid fa-file-export" /> Export
            </button>
            <button className="f-btn primary" onClick={() => onNav("sup-add")}>
              <i className="fa-solid fa-plus" /> Record Payment
            </button>
          </div>
        </div>

        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>Supplier</th>
                <th>Total Purchased</th>
                <th>Total Paid</th>
                <th>Balance Due</th>
                <th>Last Payment</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonRows cols={7} rows={6} />
              ) : suppliers.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <EmptyState
                      icon="fa-truck-ramp-box"
                      title="No suppliers"
                      desc="No supplier records found."
                    />
                  </td>
                </tr>
              ) : (
                suppliers.map((s) => (
                  <tr
                    key={s._id}
                    onClick={() =>
                      onOpenOverlay(
                        s.name,
                        <SupplierDetailContent s={s} onNav={onNav} />,
                      )
                    }
                  >
                    <td>
                      <strong>{s.name}</strong>
                    </td>
                    <td>{fmt(s.totalPurchases)}</td>
                    <td style={{ color: "var(--green)" }}>
                      {fmt(s.totalPaid)}
                    </td>
                    <td>
                      <strong
                        style={{
                          color:
                            s.outstanding > 0 ? "var(--red)" : "var(--green)",
                        }}
                      >
                        {s.outstanding > 0 ? fmt(s.outstanding) : "—"}
                      </strong>
                    </td>
                    <td style={{ fontSize: 10 }}>
                      {s.lastPaymentDate ? fmtDate(s.lastPaymentDate) : "—"}
                    </td>
                    <td>
                      <Badge label={s.status} />
                    </td>
                    <td
                      onClick={(ev) => ev.stopPropagation()}
                      style={{ display: "flex", gap: 3 }}
                    >
                      {s.outstanding > 0 && (
                        <button
                          className="f-btn primary"
                          style={{ height: 22, fontSize: 9.5 }}
                          onClick={() => onNav("sup-add")}
                        >
                          <i className="fa-solid fa-money-bill-transfer" /> Pay
                        </button>
                      )}
                      <button
                        className="f-btn"
                        style={{ height: 22, fontSize: 9.5 }}
                      >
                        <i className="fa-solid fa-eye" />
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

export default SuppliersPanel;
