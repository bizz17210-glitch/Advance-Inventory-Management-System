// ─── components/layout/Header.tsx ────────────────────────────

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";

// ── Search index ──────────────────────────────────────────────
const SEARCH_INDEX = [
  {
    title: "Dashboard",
    sub: "Overview & KPIs",
    page: "dashboard",
    icon: "fa-solid fa-gauge-high",
    color: "#FF6A00",
    bg: "#FFF5EE",
    badge: "Page",
    badgeClass: "blue",
  },
  {
    title: "Orders",
    sub: "All orders, status, COD",
    page: "orders",
    icon: "fa-solid fa-bag-shopping",
    color: "#2563EB",
    bg: "#EFF6FF",
    badge: "Page",
    badgeClass: "blue",
  },
  {
    title: "Products",
    sub: "Catalog, SKUs, variants",
    page: "products",
    icon: "fa-solid fa-box-open",
    color: "#16A34A",
    bg: "#F0FDF4",
    badge: "Page",
    badgeClass: "blue",
  },
  {
    title: "Inventory",
    sub: "Stock levels & movements",
    page: "inventory",
    icon: "fa-solid fa-warehouse",
    color: "#D97706",
    bg: "#FFFBEB",
    badge: "Page",
    badgeClass: "blue",
  },
  {
    title: "Customers",
    sub: "Customer profiles",
    page: "customers",
    icon: "fa-solid fa-users",
    color: "#7C3AED",
    bg: "#F5F3FF",
    badge: "Page",
    badgeClass: "blue",
  },
  {
    title: "Couriers",
    sub: "Courier companies",
    page: "couriers",
    icon: "fa-solid fa-truck",
    color: "#0891B2",
    bg: "#F0FDFA",
    badge: "Page",
    badgeClass: "blue",
  },
  {
    title: "Financials",
    sub: "COD, expenses, payments",
    page: "finance",
    icon: "fa-solid fa-sack-dollar",
    color: "#16A34A",
    bg: "#F0FDF4",
    badge: "Page",
    badgeClass: "blue",
  },
  {
    title: "Reports",
    sub: "Sales, inventory reports",
    page: "reports",
    icon: "fa-solid fa-chart-pie",
    color: "#2563EB",
    bg: "#EFF6FF",
    badge: "Page",
    badgeClass: "blue",
  },
  {
    title: "New Order",
    sub: "Create a new order",
    page: "orders",
    icon: "fa-solid fa-plus-circle",
    color: "#FF6A00",
    bg: "#FFF5EE",
    badge: "Action",
    badgeClass: "orange",
  },
  {
    title: "Settings",
    sub: "System configuration",
    page: "settings",
    icon: "fa-solid fa-gear",
    color: "#6B7280",
    bg: "#F3F4F6",
    badge: "Page",
    badgeClass: "blue",
  },
  // { title: 'Audit Logs',    sub: 'System activity trail',     page: 'audit',      icon: 'fa-solid fa-file-alt',        color: '#6B7280', bg: '#F3F4F6', badge: 'Page',   badgeClass: 'blue' },
];

const BREADCRUMB_MAP: Record<string, { title: string; crumb: string }> = {
  "": { title: "Dashboard", crumb: "Overview" },
  dashboard: { title: "Dashboard", crumb: "Overview" },
  orders: { title: "Orders", crumb: "All Orders" },
  products: { title: "Products", crumb: "All Products" },
  customers: { title: "Customers", crumb: "All Customers" },
  inventory: { title: "Inventory", crumb: "Stock Levels" },
  couriers: { title: "Couriers", crumb: "Courier Companies" },
  riders: { title: "Riders", crumb: "All Riders" },
  finance: { title: "Financials", crumb: "COD Tracking" },
  tasks: { title: "Tasks", crumb: "All Tasks" },
  staff: { title: "Staff & Roles", crumb: "Staff Members" },
  reports: { title: "Reports", crumb: "Sales Reports" },
  settings: { title: "Settings", crumb: "General" },
  security: { title: "Security", crumb: "Overview" },
  // 'audit':     { title: 'Audit Logs',      crumb: 'All Logs' },
};

const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(SEARCH_INDEX.slice(0, 8));
  const [selectedIdx, setSelectedIdx] = useState(-1);

  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const segment = location.pathname.replace(/^\//, "").split("/")[0];
  const { title, crumb } = BREADCRUMB_MAP[segment] ?? {
    title: segment.charAt(0).toUpperCase() + segment.slice(1),
    crumb: "Page",
  };

  // Filter results on query change
  useEffect(() => {
    if (!query.trim()) {
      setResults(SEARCH_INDEX.slice(0, 8));
      setSelectedIdx(-1);
      return;
    }
    const q = query.toLowerCase();
    const filtered = SEARCH_INDEX.filter(
      (i) =>
        i.title.toLowerCase().includes(q) || i.sub.toLowerCase().includes(q),
    );
    setResults(filtered);
    setSelectedIdx(filtered.length > 0 ? 0 : -1);
  }, [query]);

  // Keyboard shortcut ⌘K / Ctrl+K, arrow nav, Enter, Esc
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
        inputRef.current?.focus();
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
      }
      if (searchOpen && results.length > 0) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setSelectedIdx((p) => Math.min(p + 1, results.length - 1));
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setSelectedIdx((p) => Math.max(p - 1, 0));
        }
        if (e.key === "Enter" && selectedIdx >= 0) {
          e.preventDefault();
          navigate("/" + results[selectedIdx].page);
          setSearchOpen(false);
          setQuery("");
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [searchOpen, results, selectedIdx, navigate]);

  // Click outside to close
  useEffect(() => {
    const onOutside = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    if (searchOpen) document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [searchOpen]);

  const handleResultClick = useCallback(
    (item: (typeof SEARCH_INDEX)[0]) => {
      navigate("/" + item.page);
      setSearchOpen(false);
      setQuery("");
    },
    [navigate],
  );

  return (
    <header className="header">
      {/* Breadcrumb */}
      <div className="header-breadcrumb">
        <span className="page-title">{title}</span>
        <span className="sep">
          <i
            className="fa-solid fa-chevron-right"
            style={{ fontSize: "9px" }}
          />
        </span>
        <span className="crumb">{crumb}</span>
      </div>

      {/* Actions */}
      <div className="header-actions" ref={wrapRef}>
        {/* Search */}
        <div style={{ position: "relative" }}>
          <div
            className="header-search"
            onClick={() => {
              setSearchOpen(true);
              inputRef.current?.focus();
            }}
          >
            <i
              className="fa-solid fa-magnifying-glass"
              style={{ color: "var(--text-faint)" }}
            />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search orders, products, customers…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setSearchOpen(true)}
              autoComplete="off"
            />
            <span className="search-kbd">
              <kbd>⌘</kbd>
              <kbd>K</kbd>
            </span>
          </div>

          {/* Dropdown */}
          {searchOpen && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 6px)",
                left: 0,
                right: 0,
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "10px",
                boxShadow: "var(--shadow-lg)",
                zIndex: 500,
                overflow: "hidden",
              }}
            >
              <div style={{ maxHeight: "320px", overflowY: "auto" }}>
                {results.length === 0 ? (
                  <div
                    style={{
                      padding: "24px",
                      textAlign: "center",
                      color: "var(--text-faint)",
                      fontSize: "12px",
                    }}
                  >
                    No results for "
                    <strong style={{ color: "var(--text-primary)" }}>
                      {query}
                    </strong>
                    "
                  </div>
                ) : (
                  results.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleResultClick(item)}
                      onMouseEnter={() => setSelectedIdx(idx)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "9px 12px",
                        cursor: "pointer",
                        background:
                          idx === selectedIdx ? "var(--bg)" : "transparent",
                        borderBottom: "1px solid var(--divider)",
                        transition: "background 0.1s",
                      }}
                    >
                      <div
                        style={{
                          width: "30px",
                          height: "30px",
                          borderRadius: "7px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: item.bg,
                          color: item.color,
                          fontSize: "12px",
                          flexShrink: 0,
                        }}
                      >
                        <i className={item.icon} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: "12px",
                            fontWeight: 600,
                            color: "var(--text-primary)",
                          }}
                        >
                          {item.title}
                        </div>
                        <div
                          style={{
                            fontSize: "10.5px",
                            color: "var(--text-faint)",
                            marginTop: "1px",
                          }}
                        >
                          {item.sub}
                        </div>
                      </div>
                      <span className={`d-badge ${item.badgeClass}`}>
                        {item.badge}
                      </span>
                      <i
                        className="fa-solid fa-arrow-right"
                        style={{ fontSize: "10px", color: "var(--text-faint)" }}
                      />
                    </div>
                  ))
                )}
              </div>
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  padding: "8px 12px",
                  borderTop: "1px solid var(--divider)",
                  background: "var(--bg)",
                  fontSize: "10px",
                  color: "var(--text-faint)",
                }}
              >
                <span>
                  <kbd
                    style={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "3px",
                      padding: "1px 4px",
                    }}
                  >
                    ↑
                  </kbd>
                  <kbd
                    style={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "3px",
                      padding: "1px 4px",
                    }}
                  >
                    ↓
                  </kbd>{" "}
                  navigate
                </span>
                <span>
                  <kbd
                    style={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "3px",
                      padding: "1px 4px",
                    }}
                  >
                    Enter
                  </kbd>{" "}
                  go
                </span>
                <span>
                  <kbd
                    style={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "3px",
                      padding: "1px 4px",
                    }}
                  >
                    Esc
                  </kbd>{" "}
                  close
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Notification bell */}
        <button
          className="header-btn icon-only"
          style={{ position: "relative" }}
        >
          <i className="fa-solid fa-bell" />
          <span className="notif-dot" />
        </button>

        {/* Settings */}
        <button
          className="header-btn icon-only"
          onClick={() => navigate("/settings")}
        >
          <i className="fa-solid fa-gear" />
        </button>

        {/* New Order */}
        <button
          className="header-btn"
          onClick={() => navigate("/orders?new=true")}
        >
          <i className="fa-solid fa-plus" /> New Order
        </button>

        {/* Export */}
        <button
          className="header-btn primary"
          onClick={() => navigate("/reports")}
        >
          <i className="fa-solid fa-arrow-up-right-from-square" /> Export
        </button>
      </div>
    </header>
  );
};

export default Header;
