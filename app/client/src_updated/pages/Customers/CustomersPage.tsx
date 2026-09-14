import React, { useState, useEffect, useCallback, useRef } from "react";
import "./CustomersPage.css";
import TopLoadingBar from "../../components/ui/TopLoadingBar";
import { useTabLoading } from "../../hooks/useTabLoading";
import { customersAPI, authAPI } from "../../services/api";
import CitySearchInput from "../../components/shared/CitySearchInput";

// ═══════════════════════════════════════════════════════════
// TYPES  (aligned with backend response)
// ═══════════════════════════════════════════════════════════

type CustomerTab = "all" | "vip" | "segments" | "settings";
type CustomerFilter = "all" | "vip" | "inactive";
type Segment = "VIP" | "Regular" | "Occasional" | "New" | "Inactive";

interface ApiCustomer {
  _id: string;
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
  segment: Segment;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate?: string;
  source?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
}

interface ApiSegmentStat {
  segment: string;
  count: number;
  percentage: string;
  totalRevenue: string;
  avgOrderValue: string;
}

interface ApiPagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

interface CustomerOrder {
  _id: string;
  orderId: string;
  totalAmount: number;
  orderStatus: string;
  createdAt?: string;
}

const CUSTOMERS_PER_PAGE = 15;

// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════

const fmt = (n: number) => "₨" + n.toLocaleString();
const fullName = (c: ApiCustomer) =>
  `${c.firstName}${c.lastName ? " " + c.lastName : ""}`;
const initials = (c: ApiCustomer) =>
  `${c.firstName[0] ?? ""}${c.lastName?.[0] ?? c.firstName[1] ?? ""}`.toUpperCase();

const segmentBadgeClass: Record<string, string> = {
  VIP: "yellow",
  Regular: "blue",
  Occasional: "gray",
  New: "green",
  Inactive: "gray",
};

function statusBadgeClass(s: string): string {
  const m: Record<string, string> = {
    Delivered: "green",
    Pending: "yellow",
    Confirmed: "blue",
    Packed: "blue",
    Shipped: "orange",
    Cancelled: "red",
    Returned: "red",
  };
  return m[s] || "gray";
}

// ═══════════════════════════════════════════════════════════
// SHARED SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════

const Badge: React.FC<{ label: string; cls?: string }> = ({ label, cls }) => (
  <span className={`badge ${cls ?? ""}`}>{label}</span>
);

const ThreeDot: React.FC<{
  id: string;
  items: {
    label: string;
    icon: string;
    danger?: boolean;
    onClick: () => void;
  }[];
}> = ({ id, items }) => {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const h = (e: MouseEvent) => {
      const el = document.getElementById(id);
      if (el && !el.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", h);
    return () => document.removeEventListener("click", h);
  }, [id]);
  return (
    <div
      id={id}
      className="three-dot"
      style={{ position: "relative", display: "inline-block" }}
    >
      <button
        className="three-dot-btn"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        <i className="fa-solid fa-ellipsis" />
      </button>
      {open && (
        <div className="three-dot-menu" style={{ display: "block" }}>
          {items.map((item, idx) =>
            item.label === "---" ? (
              <div key={idx} className="three-dot-menu-divider" />
            ) : (
              <div
                key={item.label}
                className={`three-dot-menu-item ${item.danger ? "danger" : ""}`}
                onClick={() => {
                  item.onClick();
                  setOpen(false);
                }}
              >
                <i className={`fa-solid ${item.icon}`} /> {item.label}
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
};

const PaginationBar: React.FC<{
  current: number;
  total: number;
  totalItems: number;
  start: number;
  end: number;
  onChange: (p: number) => void;
}> = ({ current, total, totalItems, start, end, onChange }) => {
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
    <div className="pagination">
      <div className="pagination-info">
        Showing{" "}
        <strong>
          {totalItems ? start : 0}–{end}
        </strong>{" "}
        of <strong>{totalItems.toLocaleString()}</strong> customers
      </div>
      <div className="pagination-controls">
        <button
          className="page-btn"
          disabled={current === 1}
          onClick={() => onChange(current - 1)}
        >
          <i className="fa-solid fa-chevron-left" style={{ fontSize: "9px" }} />
        </button>
        {pages.map((p, i) =>
          p === "…" ? (
            <button key={`d-${i}`} className="page-btn dots">
              …
            </button>
          ) : (
            <button
              key={p}
              className={`page-btn ${p === current ? "active" : ""}`}
              onClick={() => onChange(p as number)}
            >
              {p}
            </button>
          ),
        )}
        <button
          className="page-btn"
          disabled={current === total || total === 0}
          onClick={() => onChange(current + 1)}
        >
          <i
            className="fa-solid fa-chevron-right"
            style={{ fontSize: "9px" }}
          />
        </button>
      </div>
    </div>
  );
};

const SkeletonRow: React.FC<{ cols: number }> = ({ cols }) => (
  <tr>
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i}>
        <div
          style={{
            height: 14,
            background: "#F3F4F6",
            borderRadius: 4,
            width: "70%",
          }}
        />
      </td>
    ))}
  </tr>
);

const EmptyState: React.FC<{
  message: string;
  cols: number;
  onRetry?: () => void;
}> = ({ message, cols, onRetry }) => (
  <tr>
    <td
      colSpan={cols}
      style={{
        textAlign: "center",
        padding: "32px 0",
        color: "var(--text-muted)",
      }}
    >
      <i
        className="fa-solid fa-users-slash"
        style={{ fontSize: 20, marginBottom: 8, display: "block" }}
      />
      {message}
      {onRetry && (
        <button
          className="header-btn"
          style={{ marginTop: 8, display: "inline-flex" }}
          onClick={onRetry}
        >
          <i className="fa-solid fa-rotate-right" /> Retry
        </button>
      )}
    </td>
  </tr>
);

// ═══════════════════════════════════════════════════════════
// CUSTOMER PANEL  (view / add / edit)
// ═══════════════════════════════════════════════════════════

interface CustomerPanelProps {
  open: boolean;
  customer: ApiCustomer | null; // null = new
  onClose: () => void;
  onSaved: () => void;
}

const CustomerPanel: React.FC<CustomerPanelProps> = ({
  open,
  customer,
  onClose,
  onSaved,
}) => {
  const [panelTab, setPanelTab] = useState<"form" | "orders">("form");
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // ── Role check ──
  // Anonymize: Administrator only. Mark VIP (segment update): Administrator | Accounts.
  const [userRole, setUserRole] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const isAdmin = userRole === "Administrator";
  const canUpdateSegment =
    userRole === "Administrator" || userRole === "Accounts";

  useEffect(() => {
    authAPI
      .me()
      .then((r) => setUserRole((r.data as any)?.data?.role ?? null))
      .catch(() => setUserRole(null));
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  // form fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [street, setStreet] = useState("");
  const [source, setSource] = useState("WhatsApp");
  const [segment, setSegment] = useState<Segment>("New");

  useEffect(() => {
    if (!open) return;
    setPanelTab("form");
    setError("");
    if (customer) {
      setFirstName(customer.firstName);
      setLastName(customer.lastName ?? "");
      setEmail(customer.email ?? "");
      setPhone(customer.phone ?? "");
      setCity(customer.address?.city ?? "");
      setStreet(customer.address?.street ?? "");
      setSource(customer.source ?? "WhatsApp");
      setSegment(customer.segment);
    } else {
      setFirstName("");
      setLastName("");
      setEmail("");
      setPhone("");
      setCity("");
      setStreet("");
      setSource("WhatsApp");
      setSegment("New");
    }
  }, [open, customer]);

  useEffect(() => {
    if (customer && panelTab === "orders") {
      setOrdersLoading(true);
      customersAPI
        .getOrders(customer._id, { limit: 10 })
        .then((r) => setOrders(r.data?.data?.orders ?? []))
        .catch(() => setOrders([]))
        .finally(() => setOrdersLoading(false));
    }
  }, [customer, panelTab]);

  const handleSave = async () => {
    if (!firstName.trim()) {
      setError("First name is required.");
      return;
    }
    if (!phone.trim() && !email.trim()) {
      setError("Phone or email is required.");
      return;
    }
    setSaving(true);
    setError("");
    const payload = {
      firstName,
      lastName: lastName || undefined,
      email: email || undefined,
      phone: phone || undefined,
      source,
      address: {
        city: city || undefined,
        street: street || undefined,
        country: "Pakistan",
      },
    };
    try {
      if (customer) {
        await customersAPI.update(customer._id, payload);
        // update segment separately if changed (Administrator | Accounts only)
        if (segment !== customer.segment) {
          if (!canUpdateSegment) {
            showToast(
              "You don't have permission to change customer segments. Please contact an Administrator.",
            );
          } else {
            await customersAPI.updateSegment(
              customer._id,
              segment,
              "Manual override",
            );
          }
        }
      } else {
        await customersAPI.create(payload);
      }
      onSaved();
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Failed to save customer.");
    } finally {
      setSaving(false);
    }
  };

  const handleMarkVip = async () => {
    if (!customer) return;
    if (!canUpdateSegment) {
      showToast(
        "You don't have permission to mark customers as VIP. Please contact an Administrator.",
      );
      return;
    }
    try {
      await customersAPI.updateSegment(
        customer._id,
        "VIP",
        "Marked as VIP manually",
      );
      onSaved();
      onClose();
    } catch {
      /* ignore */
    }
  };

  const handleDelete = async () => {
    if (!customer) return;
    if (!isAdmin) {
      showToast(
        "You don't have permission to anonymize customers. Please contact an Administrator.",
      );
      return;
    }
    if (!window.confirm("Anonymize this customer? This cannot be undone."))
      return;
    try {
      await customersAPI.delete(customer._id);
      onSaved();
      onClose();
    } catch {
      /* ignore */
    }
  };

  const isNew = !customer;

  return (
    <>
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 9999,
            background: "#1F2937",
            color: "#fff",
            padding: "12px 18px",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 500,
            boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
            display: "flex",
            alignItems: "center",
            gap: 10,
            maxWidth: 360,
          }}
        >
          <i
            className="fa-solid fa-circle-exclamation"
            style={{ color: "#F59E0B" }}
          />
          {toast}
        </div>
      )}
      <div
        className={`prod-backdrop ${open ? "open" : ""}`}
        onClick={onClose}
      />
      <div className={`prod-detail-panel ${open ? "open" : ""}`}>
        <div className="detail-header">
          <div className="detail-title">
            {isNew ? "Add New Customer" : fullName(customer!)}
          </div>
          <button className="detail-close" onClick={onClose}>
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        {/* panel tabs — only for existing customers */}
        {!isNew && (
          <div className="prod-tabs">
            {(["form", "orders"] as const).map((t) => (
              <div
                key={t}
                className={`prod-tab ${panelTab === t ? "active" : ""}`}
                onClick={() => setPanelTab(t)}
              >
                {t === "form" ? "Profile" : "Orders"}
              </div>
            ))}
          </div>
        )}

        <div className="detail-body" style={{ overflowY: "auto", padding: 0 }}>
          <div style={{ padding: "12px 16px" }}>
            {/* ── FORM TAB ── */}
            {panelTab === "form" && (
              <>
                {error && (
                  <div
                    style={{
                      color: "var(--red)",
                      fontSize: 12,
                      marginBottom: 8,
                      padding: "6px 10px",
                      background: "var(--red-bg)",
                      borderRadius: 6,
                    }}
                  >
                    <i className="fa-solid fa-circle-exclamation" /> {error}
                  </div>
                )}

                {/* existing customer quick stats */}
                {customer && (
                  <div className="info-banner" style={{ marginBottom: 12 }}>
                    <i
                      className="fa-solid fa-chart-bar"
                      style={{ color: "var(--accent)" }}
                    />
                    <div className="info-banner-text">
                      <strong>{customer.totalOrders}</strong> orders ·
                      <strong> {fmt(customer.totalSpent)}</strong> spent · Last
                      order:{" "}
                      <strong>
                        {customer.lastOrderDate
                          ? new Date(
                              customer.lastOrderDate,
                            ).toLocaleDateString()
                          : "N/A"}
                      </strong>
                    </div>
                  </div>
                )}

                <div className="form-row">
                  <div className="form-group">
                    <div className="form-label">First Name *</div>
                    <input
                      className="form-input"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="e.g. Amna"
                    />
                  </div>
                  <div className="form-group">
                    <div className="form-label">Last Name</div>
                    <input
                      className="form-input"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="e.g. Bibi"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <div className="form-label">Phone *</div>
                    <input
                      className="form-input"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+92300-1234567"
                    />
                  </div>
                  <div className="form-group">
                    <div className="form-label">Email</div>
                    <input
                      className="form-input"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@example.com"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <div className="form-label">City</div>
                    <CitySearchInput
                      value={city}
                      onChange={setCity}
                      placeholder="Search city..."
                    />
                  </div>
                  <div className="form-group">
                    <div className="form-label">Source</div>
                    <select
                      className="form-select"
                      value={source}
                      onChange={(e) => setSource(e.target.value)}
                    >
                      {[
                        "WhatsApp",
                        "Instagram",
                        "Shopify",
                        "Website",
                        "Manual",
                      ].map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 10 }}>
                  <div className="form-label">Street Address</div>
                  <input
                    className="form-input"
                    style={{ width: "100%" }}
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="e.g. 45 Garden Town"
                  />
                </div>

                {customer && (
                  <div className="form-group" style={{ marginBottom: 10 }}>
                    <div className="form-label">Segment</div>
                    <select
                      className="form-select"
                      style={{ width: "100%" }}
                      value={segment}
                      onChange={(e) => setSegment(e.target.value as Segment)}
                    >
                      {(
                        [
                          "VIP",
                          "Regular",
                          "Occasional",
                          "New",
                          "Inactive",
                        ] as Segment[]
                      ).map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                )}

                <hr />
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button
                    className="header-btn primary"
                    style={{ flex: 1, justifyContent: "center" }}
                    onClick={handleSave}
                    disabled={saving}
                  >
                    <i
                      className={`fa-solid ${saving ? "fa-spinner fa-spin" : isNew ? "fa-plus" : "fa-check"}`}
                    />{" "}
                    {saving
                      ? "Saving…"
                      : isNew
                        ? "Add Customer"
                        : "Save Changes"}
                  </button>
                  {customer && customer.segment !== "VIP" && (
                    <button className="header-btn" onClick={handleMarkVip}>
                      <i
                        className="fa-solid fa-crown"
                        style={{ color: "var(--yellow)" }}
                      />{" "}
                      Mark VIP
                    </button>
                  )}
                  {customer && (
                    <button
                      className="header-btn"
                      style={{ color: "var(--red)", borderColor: "var(--red)" }}
                      onClick={handleDelete}
                    >
                      <i className="fa-solid fa-user-slash" /> Anonymize
                    </button>
                  )}
                  <button className="header-btn" onClick={onClose}>
                    Cancel
                  </button>
                </div>
              </>
            )}

            {/* ── ORDERS TAB ── */}
            {panelTab === "orders" && (
              <>
                <div className="stock-log-section-label">Recent Orders</div>
                {ordersLoading ? (
                  <div
                    style={{
                      textAlign: "center",
                      padding: 20,
                      color: "var(--text-muted)",
                    }}
                  >
                    <i className="fa-solid fa-spinner fa-spin" /> Loading…
                  </div>
                ) : orders.length === 0 ? (
                  <div
                    style={{
                      textAlign: "center",
                      padding: 20,
                      color: "var(--text-muted)",
                    }}
                  >
                    No orders found.
                  </div>
                ) : (
                  orders.map((o) => (
                    <div
                      key={o._id}
                      className="list-item"
                      style={{ padding: "6px 0" }}
                    >
                      <div className="list-icon">
                        <i
                          className="fa-solid fa-bag-shopping ic-orange"
                          style={{ fontSize: 11 }}
                        />
                      </div>
                      <div className="list-content">
                        <div className="list-title">{o.orderId}</div>
                        <div className="list-meta">
                          {o.createdAt
                            ? new Date(o.createdAt).toLocaleDateString()
                            : ""}{" "}
                          · {fmt(o.totalAmount)}
                        </div>
                      </div>
                      <div className="list-right">
                        <span
                          className={`badge ${statusBadgeClass(o.orderStatus)}`}
                        >
                          {o.orderStatus}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

// ═══════════════════════════════════════════════════════════
// TAB: ALL CUSTOMERS  (dynamic)
// ═══════════════════════════════════════════════════════════

const AllCustomersTab: React.FC = () => {
  const [customers, setCustomers] = useState<ApiCustomer[]>([]);
  const [pagination, setPagination] = useState<ApiPagination>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: CUSTOMERS_PER_PAGE,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<CustomerFilter>("all");
  const [page, setPage] = useState(1);
  // analytics summary (total customers, new this month, VIP count, avg orders)
  const [segmentData, setSegmentData] = useState<ApiSegmentStat[]>([]);

  const [showPanel, setShowPanel] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<ApiCustomer | null>(
    null,
  );

  // ── Role check (for table-row quick actions: Mark as VIP, Anonymize) ──
  const [userRole, setUserRole] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const isAdmin = userRole === "Administrator";
  const canUpdateSegment =
    userRole === "Administrator" || userRole === "Accounts";

  useEffect(() => {
    authAPI
      .me()
      .then((r) => setUserRole((r.data as any)?.data?.role ?? null))
      .catch(() => setUserRole(null));
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, any> = { page, limit: CUSTOMERS_PER_PAGE };
      if (search) params.search = search;
      if (filter === "vip") params.segment = "VIP";
      if (filter === "inactive") params.segment = "Inactive";
      const res = await customersAPI.getAll(params);
      const data = res.data?.data;
      // Filter out anonymized customers (backend doesn't support a status filter, so we filter client-side)
      const visibleCustomers = (data?.customers ?? []).filter(
        (c: ApiCustomer) => !c.email?.includes("@anonymized.local"),
      );
      setCustomers(visibleCustomers);
      setPagination(
        data?.pagination ?? {
          currentPage: 1,
          totalPages: 1,
          totalItems: 0,
          itemsPerPage: CUSTOMERS_PER_PAGE,
        },
      );
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Failed to load customers.");
    } finally {
      setLoading(false);
    }
  }, [page, search, filter]);

  const fetchSegments = useCallback(async () => {
    try {
      const res = await customersAPI.getSegmentAnalytics();
      setSegmentData(res.data?.data?.segments ?? []);
    } catch {
      /* non-fatal */
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);
  useEffect(() => {
    fetchSegments();
  }, [fetchSegments]);

  const { currentPage, totalPages, totalItems } = pagination;
  const start = (currentPage - 1) * CUSTOMERS_PER_PAGE + 1;
  const end = Math.min(currentPage * CUSTOMERS_PER_PAGE, totalItems);

  // derive stat card values from segment analytics
  const totalCusts = segmentData.reduce((a, s) => a + s.count, 0) || totalItems;
  const vipSeg = segmentData.find((s) => s.segment === "VIP");
  const vipCount = vipSeg?.count ?? 0;
  const vipPct =
    totalCusts > 0 ? ((vipCount / totalCusts) * 100).toFixed(1) : "0";
  const newSeg = segmentData.find((s) => s.segment === "New");
  const newCount = newSeg?.count ?? 0;

  const openPanel = (c: ApiCustomer | null) => {
    setEditingCustomer(c);
    setShowPanel(true);
  };
  const closePanel = () => {
    setShowPanel(false);
    setEditingCustomer(null);
  };

  const filterLabels: Record<CustomerFilter, string> = {
    all: "All",
    vip: "VIP",
    inactive: "Inactive",
  };
  const filterIcons: Partial<Record<CustomerFilter, string>> = {
    vip: "fa-crown",
    inactive: "fa-user-clock",
  };

  return (
    <>
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 9999,
            background: "#1F2937",
            color: "#fff",
            padding: "12px 18px",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 500,
            boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
            display: "flex",
            alignItems: "center",
            gap: 10,
            maxWidth: 360,
          }}
        >
          <i
            className="fa-solid fa-circle-exclamation"
            style={{ color: "#F59E0B" }}
          />
          {toast}
        </div>
      )}
      {/* Stat Cards */}
      <div className="stats-row" style={{ marginBottom: 14 }}>
        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-label">Total Customers</div>
            <div className="stat-icon" style={{ background: "#FFF5EE" }}>
              <i className="fa-solid fa-users ic-orange" />
            </div>
          </div>
          <div className="stat-value">
            {totalCusts > 0 ? totalCusts.toLocaleString() : "—"}
          </div>
          <div className="stat-trend up">
            <i className="fa-solid fa-arrow-trend-up" /> Live count
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-label">New Customers</div>
            <div
              className="stat-icon"
              style={{ background: "var(--green-bg)" }}
            >
              <i className="fa-solid fa-user-plus ic-green" />
            </div>
          </div>
          <div className="stat-value">
            {newCount > 0 ? newCount.toLocaleString() : "—"}
          </div>
          <div className="stat-trend up">
            <i className="fa-solid fa-arrow-trend-up" /> First-time buyers
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-label">VIP Customers</div>
            <div
              className="stat-icon"
              style={{ background: "var(--yellow-bg)" }}
            >
              <i className="fa-solid fa-crown ic-yellow" />
            </div>
          </div>
          <div className="stat-value">
            {vipCount > 0 ? vipCount.toLocaleString() : "—"}
          </div>
          <div className="stat-trend neutral">
            <i className="fa-solid fa-minus" /> {vipPct}% of total
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-label">Segments Tracked</div>
            <div className="stat-icon" style={{ background: "var(--blue-bg)" }}>
              <i
                className="fa-solid fa-chart-pie"
                style={{ color: "var(--blue)" }}
              />
            </div>
          </div>
          <div className="stat-value">{segmentData.length || "—"}</div>
          <div className="stat-trend neutral">
            <i className="fa-solid fa-minus" /> Active segments
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-toolbar">
          <div className="table-toolbar-left">
            <div className="table-search">
              <i className="fa-solid fa-magnifying-glass" />
              <input
                type="text"
                placeholder="Search name, phone…"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            {(["all", "vip", "inactive"] as CustomerFilter[]).map((f) => (
              <button
                key={f}
                className={`t-filter-btn ${filter === f ? "active" : ""}`}
                onClick={() => {
                  setFilter(f);
                  setPage(1);
                }}
              >
                {filterIcons[f] && (
                  <i className={`fa-solid ${filterIcons[f]}`} />
                )}{" "}
                {filterLabels[f]}
              </button>
            ))}
          </div>
          <div className="table-toolbar-right">
            <button className="t-filter-btn" onClick={fetchCustomers}>
              <i className="fa-solid fa-rotate-right" /> Refresh
            </button>
            <button
              className="header-btn primary"
              onClick={() => openPanel(null)}
            >
              <i className="fa-solid fa-plus" /> Add Customer
            </button>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: 32 }}>
                  <input type="checkbox" />
                </th>
                <th>Customer</th>
                <th>Phone</th>
                <th>City</th>
                <th>Orders</th>
                <th>Total Spent</th>
                <th>Last Order</th>
                <th>Source</th>
                <th>Segment</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <SkeletonRow key={i} cols={10} />
                ))
              ) : error ? (
                <EmptyState
                  message={error}
                  cols={10}
                  onRetry={fetchCustomers}
                />
              ) : customers.length === 0 ? (
                <EmptyState
                  message="No customers found."
                  cols={10}
                  onRetry={fetchCustomers}
                />
              ) : (
                customers.map((c, i) => (
                  <tr
                    key={c._id}
                    onClick={() => openPanel(c)}
                    style={{ cursor: "pointer" }}
                  >
                    <td onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" />
                    </td>
                    <td>
                      <div className="td-flex">
                        <div className="row-avatar">{initials(c)}</div>
                        <strong>{fullName(c)}</strong>
                      </div>
                    </td>
                    <td style={{ fontSize: 12 }}>{c.phone ?? "—"}</td>
                    <td>
                      <span className="tag">
                        <i
                          className="fa-solid fa-location-dot"
                          style={{ fontSize: 9 }}
                        />{" "}
                        {c.address?.city ?? "—"}
                      </span>
                    </td>
                    <td>{c.totalOrders}</td>
                    <td>
                      <strong>{fmt(c.totalSpent)}</strong>
                    </td>
                    <td>
                      <span
                        style={{ fontSize: 11, color: "var(--text-muted)" }}
                      >
                        {c.lastOrderDate
                          ? new Date(c.lastOrderDate).toLocaleDateString()
                          : "—"}
                      </span>
                    </td>
                    <td>
                      <span className="tag" style={{ fontSize: 10 }}>
                        {c.source ?? "—"}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge ${segmentBadgeClass[c.segment] ?? "gray"}`}
                      >
                        {c.segment === "VIP" && (
                          <i
                            className="fa-solid fa-crown"
                            style={{ marginRight: 3 }}
                          />
                        )}
                        {c.segment}
                      </span>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <ThreeDot
                        id={`cust-${i}`}
                        items={[
                          {
                            label: "View Profile",
                            icon: "fa-eye",
                            onClick: () => openPanel(c),
                          },
                          {
                            label: "Edit Customer",
                            icon: "fa-pen",
                            onClick: () => openPanel(c),
                          },
                          {
                            label: "View Orders",
                            icon: "fa-bag-shopping",
                            onClick: () => {
                              setEditingCustomer(c);
                              setShowPanel(true);
                            },
                          },
                          {
                            label: "Mark as VIP",
                            icon: "fa-crown",
                            onClick: async () => {
                              if (!canUpdateSegment) {
                                showToast(
                                  "You don't have permission to mark customers as VIP. Please contact an Administrator.",
                                );
                                return;
                              }
                              await customersAPI
                                .updateSegment(c._id, "VIP", "Marked as VIP")
                                .catch(() => {});
                              fetchCustomers();
                            },
                          },
                          { label: "---", icon: "", onClick: () => {} },
                          {
                            label: "Anonymize",
                            icon: "fa-user-slash",
                            danger: true,
                            onClick: async () => {
                              if (!isAdmin) {
                                showToast(
                                  "You don't have permission to anonymize customers. Please contact an Administrator.",
                                );
                                return;
                              }
                              if (
                                window.confirm(
                                  "Anonymize this customer? This cannot be undone.",
                                )
                              ) {
                                await customersAPI
                                  .delete(c._id)
                                  .catch(() => {});
                                fetchCustomers();
                              }
                            },
                          },
                        ]}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <PaginationBar
          current={currentPage}
          total={totalPages}
          totalItems={totalItems}
          start={start}
          end={end}
          onChange={(p) => setPage(p)}
        />
      </div>

      <CustomerPanel
        open={showPanel}
        customer={editingCustomer}
        onClose={closePanel}
        onSaved={() => {
          fetchCustomers();
          fetchSegments();
        }}
      />
    </>
  );
};

// ═══════════════════════════════════════════════════════════
// TAB: VIP CUSTOMERS  (dynamic)
// ═══════════════════════════════════════════════════════════

const VipCustomersTab: React.FC = () => {
  const [vipList, setVipList] = useState<ApiCustomer[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [selected, setSelected] = useState<ApiCustomer | null>(null);

  const fetchVip = useCallback(async () => {
    setLoading(true);
    try {
      const res = await customersAPI.getAll({ segment: "VIP", limit: 50 });
      setVipList(res.data?.data?.customers ?? []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVip();
  }, [fetchVip]);

  return (
    <>
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <i className="fa-solid fa-crown ic-yellow" /> VIP Customers
          </div>
          <button className="t-filter-btn" onClick={fetchVip}>
            <i className="fa-solid fa-rotate-right" /> Refresh
          </button>
        </div>
        <div className="card-body" style={{ padding: "0 16px" }}>
          {loading ? (
            <div
              style={{
                textAlign: "center",
                padding: 24,
                color: "var(--text-muted)",
              }}
            >
              <i
                className="fa-solid fa-spinner fa-spin"
                style={{ fontSize: 20 }}
              />
            </div>
          ) : vipList.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: 32,
                color: "var(--text-muted)",
              }}
            >
              No VIP customers found.
            </div>
          ) : (
            vipList.map((c) => (
              <div
                key={c._id}
                className="list-item"
                style={{ cursor: "pointer" }}
                onClick={() => {
                  setSelected(c);
                  setShowPanel(true);
                }}
              >
                <div className="cust-vip-avatar">{initials(c)}</div>
                <div className="list-content">
                  <div className="list-title">{fullName(c)}</div>
                  <div className="list-meta">
                    {c.phone ?? c.email ?? "—"} · {c.totalOrders} orders ·{" "}
                    {fmt(c.totalSpent)} spent
                  </div>
                </div>
                <div className="list-right">
                  <span className="badge yellow">
                    <i
                      className="fa-solid fa-crown"
                      style={{ marginRight: 3 }}
                    />{" "}
                    VIP
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <CustomerPanel
        open={showPanel}
        customer={selected}
        onClose={() => setShowPanel(false)}
        onSaved={fetchVip}
      />
    </>
  );
};

// ═══════════════════════════════════════════════════════════
// TAB: SEGMENTS  (dynamic — GET /api/customers/analytics/segments)
// ═══════════════════════════════════════════════════════════

const SegmentsTab: React.FC = () => {
  const [segments, setSegments] = useState<ApiSegmentStat[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchSegments = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await customersAPI.getSegmentAnalytics();
      const data = res.data?.data;
      setSegments(data?.segments ?? []);
      setTotal(data?.totalCustomers ?? 0);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Failed to load segment data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSegments();
  }, [fetchSegments]);

  const segmentColors: Record<string, string> = {
    VIP: "var(--yellow)",
    Regular: "var(--accent)",
    Occasional: "var(--text-muted)",
    New: "var(--green)",
    Inactive: "var(--red)",
  };

  const maxCount = segments.reduce((max, s) => Math.max(max, s.count), 1);

  return (
    <>
      {/* Summary Cards */}
      {loading ? (
        <div
          style={{
            textAlign: "center",
            padding: 32,
            color: "var(--text-muted)",
          }}
        >
          <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: 20 }} />
        </div>
      ) : error ? (
        <div style={{ padding: 16, color: "var(--red)", fontSize: 12 }}>
          <i className="fa-solid fa-circle-exclamation" /> {error}
          <button
            className="header-btn"
            style={{ marginLeft: 8 }}
            onClick={fetchSegments}
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          <div className="grid-3" style={{ marginBottom: 14 }}>
            {segments.map((s) => (
              <div key={s.segment} className="card">
                <div
                  className="card-body"
                  style={{ textAlign: "center", padding: 20 }}
                >
                  <div
                    className="cust-segment-value"
                    style={{
                      color: segmentColors[s.segment] ?? "var(--accent)",
                    }}
                  >
                    {s.count.toLocaleString()}
                  </div>
                  <div className="cust-segment-label">{s.segment}</div>
                  <div className="cust-segment-sub">
                    {s.percentage}% of customers
                  </div>
                  <div
                    style={{
                      marginTop: 8,
                      fontSize: 11,
                      color: "var(--text-secondary)",
                    }}
                  >
                    Avg order:{" "}
                    <strong>
                      {s.avgOrderValue
                        ? `₨${parseFloat(s.avgOrderValue).toLocaleString()}`
                        : "—"}
                    </strong>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                    Revenue:{" "}
                    <strong>
                      {s.totalRevenue
                        ? `₨${parseFloat(s.totalRevenue).toLocaleString()}`
                        : "—"}
                    </strong>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Distribution bar */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <i className="fa-solid fa-chart-bar" /> Segment Distribution
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                Total: {total.toLocaleString()} customers
              </div>
            </div>
            <div className="card-body" style={{ padding: "10px 16px" }}>
              {segments.map((s) => (
                <div
                  key={s.segment}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 10,
                  }}
                >
                  <div style={{ width: 80, fontSize: 12, fontWeight: 600 }}>
                    {s.segment}
                  </div>
                  <div className="prog-bar" style={{ flex: 1, height: 10 }}>
                    <div
                      className="prog-fill"
                      style={{
                        width: `${(s.count / maxCount) * 100}%`,
                        background: segmentColors[s.segment] ?? "var(--accent)",
                      }}
                    />
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--text-muted)",
                      width: 60,
                      textAlign: "right",
                    }}
                  >
                    {s.count.toLocaleString()} ({s.percentage}%)
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
};

// ═══════════════════════════════════════════════════════════
// TAB: SETTINGS  (UI-only — no dedicated endpoint)
// ═══════════════════════════════════════════════════════════

const CustomerSettingsTab: React.FC = () => {
  const [vipOrders, setVipOrders] = useState(6);
  const [vipSpend, setVipSpend] = useState(50000);

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">
          <i className="fa-solid fa-gear" /> Customer Settings
        </div>
      </div>
      <div className="card-body">
        <div className="info-banner" style={{ marginBottom: 14 }}>
          <i className="fa-solid fa-circle-info" />
          <div className="info-banner-text">
            Segment thresholds are applied server-side. A dedicated{" "}
            <strong>/api/settings/customers</strong> endpoint does not yet exist
            — these values are stored locally for now.
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <div className="form-label">VIP Threshold (Min. Orders)</div>
            <input
              className="form-input"
              type="number"
              value={vipOrders}
              onChange={(e) => setVipOrders(Number(e.target.value))}
            />
          </div>
          <div className="form-group">
            <div className="form-label">VIP Threshold (Min. Spend ₨)</div>
            <input
              className="form-input"
              type="number"
              value={vipSpend}
              onChange={(e) => setVipSpend(Number(e.target.value))}
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <div className="form-label">Default Source</div>
            <select className="form-select">
              {["WhatsApp", "Instagram", "Shopify", "Website", "Manual"].map(
                (s) => (
                  <option key={s}>{s}</option>
                ),
              )}
            </select>
          </div>
          <div className="form-group">
            <div className="form-label">Default Segment for New Customers</div>
            <select className="form-select">
              <option>New</option>
              <option>Regular</option>
            </select>
          </div>
        </div>
        <hr />
        <button className="header-btn primary">
          <i className="fa-solid fa-check" /> Save Settings
        </button>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════

const CustomersPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<CustomerTab>("all");
  const { isLoading, loadingProgress, switchTab } = useTabLoading(
    setActiveTab,
    activeTab,
  );

  const tabs: { id: CustomerTab; icon: string; label: string }[] = [
    { id: "all", icon: "fa-address-card", label: "All Customers" },
    { id: "vip", icon: "fa-star", label: "VIP Customers" },
    { id: "segments", icon: "fa-chart-line", label: "Segments" },
    { id: "settings", icon: "fa-gear", label: "Settings" },
  ];

  return (
    <div id="page-customers">
      <TopLoadingBar progress={loadingProgress} isLoading={isLoading} />
      <div className="section-heading">Customer Management</div>
      <div className="section-subheading">
        View, search, and manage all customers, VIPs, and segments.
      </div>

      <div className="h-tabs">
        {tabs.map((t) => (
          <div
            key={t.id}
            className={`h-tab ${activeTab === t.id ? "active" : ""}`}
            onClick={() => switchTab(t.id)}
          >
            <i className={`fa-solid ${t.icon}`} /> {t.label}
          </div>
        ))}
      </div>

      {activeTab === "all" && <AllCustomersTab />}
      {activeTab === "vip" && <VipCustomersTab />}
      {activeTab === "segments" && <SegmentsTab />}
      {activeTab === "settings" && <CustomerSettingsTab />}
    </div>
  );
};

export default CustomersPage;
