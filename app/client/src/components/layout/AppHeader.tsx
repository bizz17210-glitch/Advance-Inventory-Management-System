import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./AppHeader.css";

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

type SearchItemType =
  | "page"
  | "order"
  | "product"
  | "customer"
  | "action"
  | "setting";
type BadgeClass = "green" | "orange" | "red" | "blue" | "yellow" | "";

interface SearchItem {
  type: SearchItemType;
  title: string;
  sub: string;
  badge?: string;
  badgeClass?: BadgeClass;
  page?: string;
  icon?: string;
  color?: string;
  bg?: string;
  action?: () => void;
}

export interface AppHeaderProps {
  onMenuToggle: () => void;
  pageTitle?: string;
  pageCrumb?: string;
  headerActionLabel?: React.ReactNode;
  onHeaderAction?: () => void;
  onExport?: () => void;
}

// ═══════════════════════════════════════════════════════════
// SEARCH INDEX
// ═══════════════════════════════════════════════════════════

const SEARCH_INDEX: SearchItem[] = [
  // Pages
  {
    type: "page",
    color: "#FF6A00",
    bg: "#FFF5EE",
    title: "Dashboard",
    sub: "Overview & KPIs",
    page: "dashboard",
    badge: "Page",
    badgeClass: "blue",
  },
  {
    type: "page",
    color: "#2563EB",
    bg: "#EFF6FF",
    title: "Orders",
    sub: "All orders, status, COD",
    page: "orders",
    badge: "Page",
    badgeClass: "blue",
  },
  {
    type: "page",
    color: "#16A34A",
    bg: "#F0FDF4",
    title: "Products",
    sub: "Catalog, SKUs, variants",
    page: "products",
    badge: "Page",
    badgeClass: "blue",
  },
  {
    type: "page",
    color: "#D97706",
    bg: "#FFFBEB",
    title: "Inventory",
    sub: "Stock levels & movements",
    page: "inventory",
    badge: "Page",
    badgeClass: "blue",
  },
  {
    type: "page",
    color: "#7C3AED",
    bg: "#F5F3FF",
    title: "Customers",
    sub: "Customer profiles & segments",
    page: "customers",
    badge: "Page",
    badgeClass: "blue",
  },
  {
    type: "page",
    color: "#0891B2",
    bg: "#F0FDFA",
    title: "Couriers",
    sub: "Courier companies & shipments",
    page: "couriers",
    badge: "Page",
    badgeClass: "blue",
  },
  {
    type: "page",
    color: "#059669",
    bg: "#F0FDF4",
    title: "Riders",
    sub: "Delivery staff & tracking",
    page: "riders",
    badge: "Page",
    badgeClass: "blue",
  },
  {
    type: "page",
    color: "#16A34A",
    bg: "#F0FDF4",
    title: "Financials",
    sub: "COD, expenses, payments",
    page: "finance",
    badge: "Page",
    badgeClass: "blue",
  },
  {
    type: "page",
    color: "#FF6A00",
    bg: "#FFF5EE",
    title: "Tasks",
    sub: "Staff tasks & assignments",
    page: "tasks",
    badge: "Page",
    badgeClass: "blue",
  },
  {
    type: "page",
    color: "#7C3AED",
    bg: "#F5F3FF",
    title: "Staff & Roles",
    sub: "Team members & permissions",
    page: "staff",
    badge: "Page",
    badgeClass: "blue",
  },
  {
    type: "page",
    color: "#2563EB",
    bg: "#EFF6FF",
    title: "Reports",
    sub: "Sales, inventory, financial",
    page: "reports",
    badge: "Page",
    badgeClass: "blue",
  },
  {
    type: "page",
    color: "#6B7280",
    bg: "#F3F4F6",
    title: "Settings",
    sub: "System configuration",
    page: "settings",
    badge: "Page",
    badgeClass: "blue",
  },
  {
    type: "page",
    color: "#DC2626",
    bg: "#FEF2F2",
    title: "Security & Backup",
    sub: "Auth, IPs, backups",
    page: "security",
    badge: "Page",
    badgeClass: "blue",
  },
  // { type: 'page', color: '#6B7280', bg: '#F3F4F6', title: 'Audit Logs',         sub: 'System activity trail',              page: 'audit',     badge: 'Page', badgeClass: 'blue' },
  // Quick Actions
  {
    type: "action",
    icon: "fa-plus-circle",
    color: "#FF6A00",
    bg: "#FFF5EE",
    title: "New Order",
    sub: "Create a new order",
    badge: "Action",
    badgeClass: "orange",
  },
  {
    type: "action",
    icon: "fa-plus-circle",
    color: "#16A34A",
    bg: "#F0FDF4",
    title: "Add Product",
    sub: "Add product to catalog",
    page: "products",
    badge: "Action",
    badgeClass: "orange",
  },
  {
    type: "action",
    icon: "fa-money-bill-transfer",
    color: "#D97706",
    bg: "#FFFBEB",
    title: "Log COD Collection",
    sub: "Record cash on delivery",
    page: "finance",
    badge: "Action",
    badgeClass: "orange",
  },
  // Sample Orders
  {
    type: "order",
    icon: "fa-bag-shopping",
    color: "#2563EB",
    bg: "#EFF6FF",
    title: "ORD-1048 — Amna Bibi",
    sub: "₨4,200 · Pending · WhatsApp",
    page: "orders",
    badge: "Pending",
    badgeClass: "yellow",
  },
  {
    type: "order",
    icon: "fa-bag-shopping",
    color: "#2563EB",
    bg: "#EFF6FF",
    title: "ORD-1047 — Fatima Zara",
    sub: "₨1,800 · Confirmed · Shopify",
    page: "orders",
    badge: "Confirmed",
    badgeClass: "blue",
  },
  {
    type: "order",
    icon: "fa-bag-shopping",
    color: "#2563EB",
    bg: "#EFF6FF",
    title: "ORD-1046 — Sara Khan",
    sub: "₨3,600 · Packed",
    page: "orders",
    badge: "Packed",
    badgeClass: "blue",
  },
  // Sample Products
  {
    type: "product",
    icon: "fa-box-open",
    color: "#16A34A",
    bg: "#F0FDF4",
    title: "Classic Lawn Suit — SKU-0041",
    sub: "₨1,800 · 3 in stock",
    page: "products",
    badge: "Low Stock",
    badgeClass: "red",
  },
  {
    type: "product",
    icon: "fa-box-open",
    color: "#16A34A",
    bg: "#F0FDF4",
    title: "Chiffon Dupatta White — SKU-0028",
    sub: "₨600 · 7 in stock",
    page: "products",
    badge: "Low Stock",
    badgeClass: "red",
  },
  {
    type: "product",
    icon: "fa-box-open",
    color: "#16A34A",
    bg: "#F0FDF4",
    title: "Embroidered Kurta — SKU-0017",
    sub: "₨2,800 · 42 in stock",
    page: "products",
    badge: "In Stock",
    badgeClass: "green",
  },
  // Customers
  {
    type: "customer",
    icon: "fa-user",
    color: "#7C3AED",
    bg: "#F5F3FF",
    title: "Amna Bibi",
    sub: "0300-1234567 · 12 orders · Lahore",
    page: "customers",
    badge: "Regular",
    badgeClass: "",
  },
  {
    type: "customer",
    icon: "fa-user",
    color: "#7C3AED",
    bg: "#F5F3FF",
    title: "Fatima Zara",
    sub: "0321-9876543 · 29 orders · VIP",
    page: "customers",
    badge: "VIP",
    badgeClass: "orange",
  },
  // Settings shortcuts
  {
    type: "setting",
    icon: "fa-sliders",
    color: "#6B7280",
    bg: "#F3F4F6",
    title: "General Settings",
    sub: "Language, currency, display",
    page: "settings",
    badge: "Settings",
    badgeClass: "",
  },
  {
    type: "setting",
    icon: "fa-plug",
    color: "#6B7280",
    bg: "#F3F4F6",
    title: "Integrations",
    sub: "Shopify, couriers, payments",
    page: "settings",
    badge: "Settings",
    badgeClass: "",
  },
  {
    type: "setting",
    icon: "fa-bell",
    color: "#6B7280",
    bg: "#F3F4F6",
    title: "Notification Settings",
    sub: "Order, inventory alerts",
    page: "settings",
    badge: "Settings",
    badgeClass: "",
  },
];

const TYPE_LABELS: Record<SearchItemType, string> = {
  page: "Pages & Modules",
  order: "Orders",
  product: "Products",
  customer: "Customers",
  action: "Quick Actions",
  setting: "Settings",
};

// ═══════════════════════════════════════════════════════════
// SEARCH RESULT ITEM
// ═══════════════════════════════════════════════════════════

interface SearchResultItemProps {
  item: SearchItem;
  idx: number;
  selected: boolean;
  onHover: (idx: number) => void;
  onClick: (idx: number) => void;
}

const SearchResultItem: React.FC<SearchResultItemProps> = ({
  item,
  idx,
  selected,
  onHover,
  onClick,
}) => (
  <div
    className={`search-result-item ${selected ? "selected" : ""}`}
    onMouseEnter={() => onHover(idx)}
    onClick={() => onClick(idx)}
  >
    <div style={{ flex: 1, minWidth: 0 }}>
      <div className="search-result-title">{item.title}</div>
      <div className="search-result-sub">{item.sub}</div>
    </div>
    {item.badge && (
      <span className={`search-result-badge ${item.badgeClass || ""}`}>
        {item.badge}
      </span>
    )}
    <i className="fa-solid fa-arrow-right search-result-arrow" />
  </div>
);

// ═══════════════════════════════════════════════════════════
// SEARCH DROPDOWN
// ═══════════════════════════════════════════════════════════

interface SearchDropdownProps {
  query: string;
  selectedIdx: number;
  flatResults: SearchItem[];
  onHover: (idx: number) => void;
  onSelect: (idx: number) => void;
}

const SearchDropdown: React.FC<SearchDropdownProps> = ({
  query,
  selectedIdx,
  flatResults,
  onHover,
  onSelect,
}) => {
  // Defaults (no query): show pages + quick actions
  if (!query.trim()) {
    const recentPages = SEARCH_INDEX.filter((i) => i.type === "page").slice(
      0,
      5,
    );
    const quickActions = SEARCH_INDEX.filter((i) => i.type === "action").slice(
      0,
      3,
    );
    const combined = [...recentPages, ...quickActions];

    return (
      <>
        <div id="search-dropdown-content">
          <div className="search-section">
            <div className="search-section-label">Recently Visited</div>
            {recentPages.map((item, i) => (
              <SearchResultItem
                key={item.title}
                item={item}
                idx={i}
                selected={selectedIdx === i}
                onHover={onHover}
                onClick={onSelect}
              />
            ))}
          </div>
          <div className="search-section">
            <div className="search-section-label">Quick Actions</div>
            {quickActions.map((item, i) => (
              <SearchResultItem
                key={item.title}
                item={item}
                idx={recentPages.length + i}
                selected={selectedIdx === recentPages.length + i}
                onHover={onHover}
                onClick={onSelect}
              />
            ))}
          </div>
        </div>
        <SearchFooter />
      </>
    );
  }

  // With query: show grouped results
  if (flatResults.length === 0) {
    return (
      <>
        <div className="search-empty">
          <i className="fa-solid fa-magnifying-glass" />
          <div>
            No results for "<strong>{query}</strong>"
          </div>
        </div>
        <SearchFooter />
      </>
    );
  }

  // Group by type
  const groups = flatResults.reduce<
    Partial<Record<SearchItemType, SearchItem[]>>
  >((acc, item) => {
    if (!acc[item.type]) acc[item.type] = [];
    acc[item.type]!.push(item);
    return acc;
  }, {});

  let globalIdx = 0;
  return (
    <>
      <div id="search-dropdown-content">
        {(Object.entries(groups) as [SearchItemType, SearchItem[]][]).map(
          ([type, items]) => (
            <div key={type} className="search-section">
              <div className="search-section-label">
                {TYPE_LABELS[type] || type}
              </div>
              {items.map((item) => {
                const idx = globalIdx++;
                return (
                  <SearchResultItem
                    key={item.title}
                    item={item}
                    idx={idx}
                    selected={selectedIdx === idx}
                    onHover={onHover}
                    onClick={onSelect}
                  />
                );
              })}
            </div>
          ),
        )}
      </div>
      <SearchFooter />
    </>
  );
};

const SearchFooter: React.FC = () => (
  <div className="search-footer">
    <span>
      <kbd>↑</kbd>
      <kbd>↓</kbd> navigate
    </span>
    <span>
      <kbd>Enter</kbd> go
    </span>
    <span>
      <kbd>Esc</kbd> close
    </span>
  </div>
);

// ═══════════════════════════════════════════════════════════
// MAIN HEADER COMPONENT
// ═══════════════════════════════════════════════════════════

const AppHeader: React.FC<AppHeaderProps> = ({
  onMenuToggle,
  pageTitle = "Dashboard",
  pageCrumb = "Overview",
  headerActionLabel,
  onHeaderAction,
  onExport,
}) => {
  const navigate = useNavigate();

  // ── Search state ──
  const [query, setQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const [flatResults, setFlatResults] = useState<SearchItem[]>([]);

  const searchWrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Compute filtered results whenever query changes ──
  useEffect(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      setFlatResults([]);
      return;
    }

    const results = SEARCH_INDEX.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.sub.toLowerCase().includes(q) ||
        item.page?.includes(q),
    );
    setFlatResults(results);
    setSelectedIdx(-1);
  }, [query]);

  // ── Close on outside click ──
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        searchWrapRef.current &&
        !searchWrapRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Keyboard shortcuts ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // ⌘K / Ctrl+K — open search
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setDropdownOpen(true);
        return;
      }
      if (!dropdownOpen) return;

      const totalResults = query.trim()
        ? flatResults.length
        : SEARCH_INDEX.filter((i) => i.type === "page").slice(0, 5).length +
          SEARCH_INDEX.filter((i) => i.type === "action").slice(0, 3).length;

      if (e.key === "Escape") {
        setDropdownOpen(false);
        setSelectedIdx(-1);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIdx((prev) => Math.min(prev + 1, totalResults - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIdx((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter" && selectedIdx >= 0) {
        handleSelect(selectedIdx);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [dropdownOpen, selectedIdx, flatResults, query]);

  // ── Select a result ──
  const handleSelect = useCallback(
    (idx: number) => {
      // Build the same flat list used for rendering
      let allItems: SearchItem[];
      if (!query.trim()) {
        const pages = SEARCH_INDEX.filter((i) => i.type === "page").slice(0, 5);
        const actions = SEARCH_INDEX.filter((i) => i.type === "action").slice(
          0,
          3,
        );
        allItems = [...pages, ...actions];
      } else {
        allItems = flatResults;
      }

      const item = allItems[idx];
      if (!item) return;

      setDropdownOpen(false);
      setQuery("");

      if (item.action) {
        item.action();
      } else if (item.page) {
        navigate(`/${item.page}`);
      }
    },
    [query, flatResults, navigate],
  );

  return (
    <header className="app-header">
      {/* Hamburger */}
      <button
        className="header-btn icon-only hamburger-btn"
        onClick={onMenuToggle}
      >
        <i className="fa-solid fa-bars" />
      </button>

      {/* Breadcrumb */}
      <div className="header-breadcrumb">
        <span className="page-title">{pageTitle}</span>
        <span className="sep">
          <i className="fa-solid fa-chevron-right" style={{ fontSize: 9 }} />
        </span>
        <span className="crumb">{pageCrumb}</span>
      </div>

      <div className="header-actions">
        {/* Global Search */}
        <div className="header-search-wrap" ref={searchWrapRef}>
          <div className={`header-search ${dropdownOpen ? "focused" : ""}`}>
            <i className="fa-solid fa-magnifying-glass" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search orders, products, customers..."
              autoComplete="off"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setDropdownOpen(true)}
            />
            <span className="search-kbd">
              <kbd>⌘</kbd>
              <kbd>K</kbd>
            </span>
          </div>

          {dropdownOpen && (
            <div className="search-dropdown open">
              <SearchDropdown
                query={query}
                selectedIdx={selectedIdx}
                flatResults={flatResults}
                onHover={setSelectedIdx}
                onSelect={handleSelect}
              />
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="tooltip-wrap">
          <button className="header-btn icon-only notif-btn">
            <i className="fa-solid fa-bell" />
            <span className="notif-dot" />
          </button>
          <div className="tooltip-box">3 unread notifications</div>
        </div>

        {/* Settings icon */}
        <div className="tooltip-wrap">
          <button
            className="header-btn icon-only settings-btn"
            onClick={() => navigate("/settings")}
          >
            <i className="fa-solid fa-gear" />
          </button>
          <div className="tooltip-box">Settings</div>
        </div>

        {/* Context action (e.g. "New Order") */}
        {headerActionLabel !== undefined && (
          <button className="header-btn" onClick={onHeaderAction}>
            {headerActionLabel}
          </button>
        )}

        {/* Export */}
        <button className="header-btn primary" onClick={onExport}>
          <i className="fa-solid fa-arrow-up-right-from-square" /> Export
        </button>
      </div>
    </header>
  );
};

export default AppHeader;
