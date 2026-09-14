import React, { useState } from "react";

// ── Formatters ─────────────────────────────────────────────
export const fmt = (n: number) => "₨" + Number(n).toLocaleString();

export function fmtDate(iso: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-PK", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function fmtDateTime(iso: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-PK", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

// ── Badge ──────────────────────────────────────────────────
export function badgeClass(s: string): string {
  const m: Record<string, string> = {
    Collected: "green",
    InTransit: "yellow",
    "In Transit": "yellow",
    Pending: "yellow",
    Submitted: "blue",
    Verified: "green",
    Overdue: "red",
    Paid: "green",
    Active: "green",
    Inactive: "gray",
    Available: "green",
    "Not Connected": "yellow",
    Optional: "orange",
    Cancelled: "red",
    Failed: "red",
    Delivered: "green",
    Partial: "orange",
    Refunded: "blue",
    high: "red",
    medium: "yellow",
    low: "green",
    cleared: "green",
  };
  return m[s] || "gray";
}

export const Badge: React.FC<{ label: string }> = ({ label }) => (
  <span className={`badge ${badgeClass(label)}`}>{label}</span>
);

// ── Empty State ────────────────────────────────────────────
export const EmptyState: React.FC<{
  icon: string;
  title: string;
  desc: string;
}> = ({ icon, title, desc }) => (
  <div className="empty-state">
    <i className={`fa-solid ${icon}`} />
    <h4>{title}</h4>
    <p>{desc}</p>
  </div>
);

// ── Skeleton loader row ────────────────────────────────────
export const SkeletonRows: React.FC<{ cols: number; rows?: number }> = ({
  cols,
  rows = 5,
}) => (
  <>
    {Array.from({ length: rows }).map((_, i) => (
      <tr key={i} style={{ opacity: 1 - i * 0.12 }}>
        {Array.from({ length: cols }).map((_, j) => (
          <td key={j}>
            <div
              style={{
                height: 11,
                borderRadius: 4,
                background:
                  "linear-gradient(90deg,var(--divider) 25%,var(--bg) 50%,var(--divider) 75%)",
                backgroundSize: "200% 100%",
                animation: "shimmer 1.4s infinite",
                width: j === 0 ? "60%" : "80%",
              }}
            />
          </td>
        ))}
      </tr>
    ))}
  </>
);

// ── Skeleton card ─────────────────────────────────────────
export const SkeletonCard: React.FC<{ lines?: number }> = ({ lines = 3 }) => (
  <div style={{ padding: "10px 14px" }}>
    {Array.from({ length: lines }).map((_, i) => (
      <div
        key={i}
        style={{
          height: 12,
          borderRadius: 4,
          marginBottom: 10,
          background:
            "linear-gradient(90deg,var(--divider) 25%,var(--bg) 50%,var(--divider) 75%)",
          backgroundSize: "200% 100%",
          animation: "shimmer 1.4s infinite",
          width: i === 0 ? "40%" : i === 1 ? "70%" : "55%",
        }}
      />
    ))}
  </div>
);

// ── Toggle Switch ──────────────────────────────────────────
export const ToggleSwitch: React.FC<{
  defaultChecked?: boolean;
  onChange?: (v: boolean) => void;
  disabled?: boolean;
  loading?: boolean;
}> = ({
  defaultChecked = false,
  onChange,
  disabled = false,
  loading = false,
}) => {
  const [on, setOn] = useState(defaultChecked);
  const isLocked = disabled || loading;

  return (
    <label
      className="toggle-switch"
      style={{
        opacity: isLocked && !loading ? 0.5 : 1,
        pointerEvents: isLocked ? "none" : "auto",
        position: "relative",
      }}
    >
      <input
        type="checkbox"
        checked={on}
        disabled={isLocked}
        onChange={(e) => {
          setOn(e.target.checked);
          onChange?.(e.target.checked);
        }}
      />
      <span
        className="toggle-track"
        style={{
          background: on ? "#ff6a00" : "#94a3b8",
          border: `1px solid ${on ? "#e65c00" : "#7c8fa3"}`,
          opacity: loading ? 0.6 : 1,
          transition: "background 0.2s, border-color 0.2s",
          display: "block",
          width: 32,
          height: 17,
          borderRadius: 17,
          position: "absolute",
          inset: 0,
          cursor: "pointer",
        }}
      />
      {loading && (
        <span
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            fontSize: 9,
            color: "var(--text-muted)",
          }}
        >
          <i className="fa-solid fa-spinner fa-spin" />
        </span>
      )}
    </label>
  );
};

// ── Pagination ────────────────────────────────────────────
interface FPagProps {
  current: number;
  total: number;
  totalItems: number;
  start: number;
  end: number;
  onChange: (p: number) => void;
}
export const FPagination: React.FC<FPagProps> = ({
  current,
  total,
  totalItems,
  start,
  end,
  onChange,
}) => {
  const pages: (number | "…")[] = [];
  if (total <= 7) {
    for (let p = 1; p <= total; p++) pages.push(p);
  } else {
    pages.push(1);
    if (current > 3) pages.push("…");
    for (
      let p = Math.max(2, current - 1);
      p <= Math.min(total - 1, current + 1);
      p++
    )
      pages.push(p);
    if (current < total - 2) pages.push("…");
    pages.push(total);
  }
  return (
    <div className="f-pagination">
      <div style={{ fontSize: 10.5, color: "var(--text-muted)" }}>
        Showing{" "}
        <strong>
          {totalItems ? start : 0}–{end}
        </strong>{" "}
        of <strong>{totalItems}</strong>
      </div>
      <div className="f-pag-controls">
        <button
          className="f-pag-btn"
          disabled={current === 1}
          onClick={() => onChange(current - 1)}
        >
          ‹
        </button>
        {pages.map((p, i) =>
          p === "…" ? (
            <button
              key={`d${i}`}
              className="f-pag-btn"
              style={{ pointerEvents: "none" }}
            >
              …
            </button>
          ) : (
            <button
              key={p}
              className={`f-pag-btn ${p === current ? "active" : ""}`}
              onClick={() => onChange(p as number)}
            >
              {p}
            </button>
          ),
        )}
        <button
          className="f-pag-btn"
          disabled={current === total || total === 0}
          onClick={() => onChange(current + 1)}
        >
          ›
        </button>
      </div>
    </div>
  );
};

// ── Inner Tabs ────────────────────────────────────────────
interface InnerTabsProps {
  tabs: { id: string; label: React.ReactNode }[];
  active: string;
  onChange: (id: string) => void;
}
export const InnerTabs: React.FC<InnerTabsProps> = ({
  tabs,
  active,
  onChange,
}) => (
  <div className="inner-tabs">
    {tabs.map((t) => (
      <div
        key={t.id}
        className={`itab ${active === t.id ? "active" : ""}`}
        onClick={() => onChange(t.id)}
      >
        {t.label}
      </div>
    ))}
  </div>
);

// ── Error Banner ──────────────────────────────────────────
export const ErrorBanner: React.FC<{
  message: string;
  onRetry?: () => void;
}> = ({ message, onRetry }) => (
  <div className="alert-strip danger" style={{ marginBottom: 14 }}>
    <i className="fa-solid fa-circle-exclamation" />
    <div>{message}</div>
    {onRetry && (
      <button
        className="f-btn danger"
        style={{ marginLeft: "auto", fontSize: 9.5 }}
        onClick={onRetry}
      >
        <i className="fa-solid fa-rotate-right" /> Retry
      </button>
    )}
  </div>
);
