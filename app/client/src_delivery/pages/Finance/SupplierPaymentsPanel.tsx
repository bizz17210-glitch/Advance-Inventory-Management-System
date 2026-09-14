import React, { useState, useEffect, useCallback } from "react";
import type { ApiSupplierPayment } from "./types";
import {
  FPagination,
  EmptyState,
  fmt,
  fmtDate,
  SkeletonRows,
  ErrorBanner,
} from "./helpers";
import { supplierPaymentsAPI } from "../../services/api";

const PER_PAGE = 10;

const SupplierPaymentsPanel: React.FC = () => {
  const [payments, setPayments] = useState<ApiSupplierPayment[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async (pg: number) => {
    setLoading(true);
    setError("");
    try {
      const res = await supplierPaymentsAPI.getAll({
        page: pg,
        limit: PER_PAGE,
      });
      const data = res.data.data;
      setPayments(data.payments || []);
      setTotalItems(data.pagination?.totalItems ?? 0);
      setTotalPages(data.pagination?.totalPages ?? 1);
    } catch (e: any) {
      setError(
        e?.response?.data?.message || "Failed to load supplier payments.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(page);
  }, [page, load]);

  const filtered = search
    ? payments.filter((p) => {
        const supplierName = (p as any).supplier?.name || "";
        return supplierName.toLowerCase().includes(search.toLowerCase());
      })
    : payments;

  const start = (page - 1) * PER_PAGE + 1;
  const end = Math.min(page * PER_PAGE, totalItems);

  return (
    <>
      <div className="panel-heading">Supplier Payments Made</div>
      <div className="panel-desc">
        Complete history of all payments made to suppliers. Filter by supplier
        or date range.
      </div>

      {error && <ErrorBanner message={error} onRetry={() => load(page)} />}

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
            <button className="f-btn">
              <i className="fa-solid fa-calendar" /> Date Range
            </button>
          </div>
          <div className="f-toolbar-right">
            <button className="f-btn">
              <i className="fa-solid fa-file-export" /> Export
            </button>
          </div>
        </div>

        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Supplier</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Reference</th>
                <th>Logged By</th>
                <th>Voided</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonRows cols={8} rows={6} />
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <EmptyState
                      icon="fa-handshake"
                      title="No payments"
                      desc="No supplier payments found."
                    />
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p._id} style={{ opacity: p.isVoided ? 0.55 : 1 }}>
                    <td style={{ fontSize: 10 }}>{fmtDate(p.paymentDate)}</td>
                    <td>
                      <strong>{(p as any).supplier?.name || "—"}</strong>
                    </td>
                    <td>
                      <strong style={{ color: "var(--green)" }}>
                        {fmt(p.amount)}
                      </strong>
                    </td>
                    <td>
                      <span className="f-tag">{p.paymentMethod}</span>
                    </td>
                    <td>
                      <code className="ref">{p.referenceNumber || "—"}</code>
                    </td>
                    <td>{p.recordedBy?.username || "—"}</td>
                    <td
                      style={{
                        fontSize: 10,
                        color: p.isVoided ? "var(--red)" : "var(--text-muted)",
                      }}
                    >
                      {p.isVoided ? `Voided — ${p.voidReason || ""}` : "—"}
                    </td>
                    <td>
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

export default SupplierPaymentsPanel;
