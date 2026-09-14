import React, { useState, useEffect, useCallback, useRef } from "react";
import "./InventoryPage.css";
import TopLoadingBar from "../../components/ui/TopLoadingBar";
import { useTabLoading } from "../../hooks/useTabLoading";
import { stockAPI, productsAPI } from "../../services/api";

// ═══════════════════════════════════════════════════════════
// TYPES  (aligned with backend response shapes)
// ═══════════════════════════════════════════════════════════

type InventoryTab =
  | "stock"
  | "movements"
  | "alerts"
  | "adjustments"
  | "settings";

interface StockItem {
  productId: string;
  productName: string;
  productSku: string;
  variantId: string;
  attributes: Record<string, string>;
  currentStock: number;
  lowStockThreshold: number;
  isLowStock: boolean;
  unitPrice: number;
  estimatedValue: number;
  supplierName?: string;
  categoryName?: string;
}

interface LowStockItem {
  productName: string;
  productSku?: string;
  variantId: string;
  currentStock: number;
  threshold: number;
  stockDeficit: number;
  supplierName?: string;
}

interface StockHistoryEntry {
  _id: string;
  productId: string;
  variantId: string;
  changeType: string;
  quantityChange: number;
  newStockLevel: number;
  reason?: string;
  reference?: string;
  createdAt: string;
  recordedBy?: { username: string };
}

interface StockKpis {
  totalInventoryValue: string;
  totalStockUnits: number;
  totalVariants: number;
  avgStockPerVariant: string;
  lowStockAlerts: number;
}

interface ApiPagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

// For the product dropdown in adjustment/movement forms
interface ProductOption {
  _id: string;
  name: string;
  sku: string;
  variants: { variantId: string; attributes: Record<string, string> }[];
}

const ITEMS_PER_PAGE = 15;

// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════

type HealthStatus = "Critical" | "Low" | "Good";

function getHealth(current: number, threshold: number): HealthStatus {
  if (current === 0) return "Critical";
  if (current < threshold / 2) return "Critical";
  if (current < threshold) return "Low";
  return "Good";
}

function statusBadgeClass(s: string): string {
  const m: Record<string, string> = {
    Good: "green",
    Low: "yellow",
    Critical: "red",
    Inbound: "green",
    Outbound: "red",
    Adjustment: "yellow",
    Return: "green",
    Damaged: "red",
    Audit: "blue",
    In: "green",
    Out: "red",
    Adjust: "yellow",
    Active: "green",
    Inactive: "gray",
  };
  return m[s] || "gray";
}

const fmt = (n: number) => "₨" + n.toLocaleString();

// ═══════════════════════════════════════════════════════════
// SHARED SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════

const Badge: React.FC<{ label: string }> = ({ label }) => (
  <span className={`badge ${statusBadgeClass(label)}`}>{label}</span>
);

interface ThreeDotItem {
  label: string;
  icon: string;
  danger?: boolean;
  onClick: () => void;
}
const ThreeDot: React.FC<{ id: string; items: ThreeDotItem[] }> = ({
  id,
  items,
}) => {
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
        of <strong>{totalItems}</strong> items
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
        className="fa-solid fa-circle-exclamation"
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
// SHARED: Stock Adjust Panel
// Used by both StockLevelsTab and AdjustmentsTab
// ═══════════════════════════════════════════════════════════

interface StockAdjustPanelProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  products: ProductOption[];
  preselectedProductId?: string;
  preselectedVariantId?: string;
  title?: string;
}

const StockAdjustPanel: React.FC<StockAdjustPanelProps> = ({
  open,
  onClose,
  onSuccess,
  products,
  preselectedProductId,
  preselectedVariantId,
  title = "Stock Adjustment",
}) => {
  const [selectedProductId, setSelectedProductId] = useState(
    preselectedProductId ?? "",
  );
  const [selectedVariantId, setSelectedVariantId] = useState(
    preselectedVariantId ?? "",
  );
  const [changeType, setChangeType] = useState("Inbound");
  const [quantity, setQuantity] = useState(0);
  const [reason, setReason] = useState("Supplier Restock");
  const [reference, setReference] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setSelectedProductId(preselectedProductId ?? "");
    setSelectedVariantId(preselectedVariantId ?? "");
    setError("");
  }, [preselectedProductId, preselectedVariantId, open]);

  const selectedProduct = products.find((p) => p._id === selectedProductId);

  // Auto-select variant if product has only one variant (since dropdown is hidden in that case)
  useEffect(() => {
    if (
      selectedProduct &&
      selectedProduct.variants.length === 1 &&
      !selectedVariantId
    ) {
      setSelectedVariantId(selectedProduct.variants[0].variantId);
    }
  }, [selectedProduct, selectedVariantId]);

  // Backend changeType mapping from UI label
  const changeTypeMap: Record<string, string> = {
    "Add Stock": "Inbound",
    "Remove Stock": "Outbound",
    "Damage Write-off": "Damaged",
    "Return Received": "Return",
    "Manual Correction": "Adjustment",
    "Audit Count": "Audit",
  };

  const handleApply = async () => {
    if (!selectedProductId) {
      setError("Please select a product.");
      return;
    }
    if (!quantity || quantity <= 0) {
      setError("Quantity must be greater than 0.");
      return;
    }

    // Fallback: if variant wasn't auto-selected for some reason, use the product's first variant
    const finalVariantId =
      selectedVariantId || selectedProduct?.variants?.[0]?.variantId;
    if (!finalVariantId) {
      setError("This product has no variants to adjust.");
      return;
    }

    const backendChangeType = changeTypeMap[changeType] ?? changeType;
    const isNegative =
      backendChangeType === "Outbound" || backendChangeType === "Damaged";
    const finalQty = isNegative ? -Math.abs(quantity) : Math.abs(quantity);

    setSaving(true);
    setError("");
    try {
      await stockAPI.adjust({
        productId: selectedProductId,
        variantId: finalVariantId,
        changeType: backendChangeType,
        quantityChange: finalQty,
        reason,
        reference: reference || undefined,
      });
      onSuccess();
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Failed to apply adjustment.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div
        className={`prod-backdrop ${open ? "open" : ""}`}
        onClick={onClose}
      />
      <div className={`prod-detail-panel ${open ? "open" : ""}`}>
        <div className="detail-header">
          <div className="detail-title">{title}</div>
          <button className="detail-close" onClick={onClose}>
            <i className="fa-solid fa-xmark" />
          </button>
        </div>
        <div className="detail-body" style={{ overflowY: "auto" }}>
          <div style={{ padding: "12px 16px" }}>
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

            <div className="form-group" style={{ marginBottom: 10 }}>
              <div className="form-label">Select Product *</div>
              <select
                className="form-select"
                style={{ width: "100%" }}
                value={selectedProductId}
                onChange={(e) => {
                  setSelectedProductId(e.target.value);
                  setSelectedVariantId("");
                }}
              >
                <option value="">— Select Product —</option>
                {products.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.sku} — {p.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedProduct && selectedProduct.variants.length > 1 && (
              <div className="form-group" style={{ marginBottom: 10 }}>
                <div className="form-label">Select Variant</div>
                <select
                  className="form-select"
                  style={{ width: "100%" }}
                  value={selectedVariantId}
                  onChange={(e) => setSelectedVariantId(e.target.value)}
                >
                  <option value="">— All / Default —</option>
                  {selectedProduct.variants.map((v) => {
                    const label =
                      Object.entries(v.attributes)
                        .map(([k, val]) => val)
                        .join(" / ") || v.variantId;
                    return (
                      <option key={v.variantId} value={v.variantId}>
                        {label}
                      </option>
                    );
                  })}
                </select>
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <div className="form-label">Adjustment Type *</div>
                <select
                  className="form-select"
                  value={changeType}
                  onChange={(e) => setChangeType(e.target.value)}
                >
                  <option>Add Stock</option>
                  <option>Remove Stock</option>
                  <option>Damage Write-off</option>
                  <option>Return Received</option>
                  <option>Manual Correction</option>
                  <option>Audit Count</option>
                </select>
              </div>
              <div className="form-group">
                <div className="form-label">Quantity *</div>
                <input
                  className="form-input"
                  type="number"
                  min={1}
                  value={quantity || ""}
                  onChange={(e) =>
                    setQuantity(Math.abs(parseInt(e.target.value) || 0))
                  }
                  placeholder="0"
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 10 }}>
              <div className="form-label">Reason</div>
              <select
                className="form-select"
                style={{ width: "100%" }}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              >
                <option>Supplier Restock</option>
                <option>Order Fulfillment</option>
                <option>Damage Write-off</option>
                <option>Return Received</option>
                <option>Manual Correction</option>
                <option>Initial Stock</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 10 }}>
              <div className="form-label">Reference / Notes</div>
              <input
                className="form-input"
                style={{ width: "100%" }}
                placeholder="e.g. PO-2026-041 or order number…"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
            </div>

            <hr />
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="header-btn primary"
                style={{ flex: 1, justifyContent: "center" }}
                onClick={handleApply}
                disabled={saving}
              >
                <i
                  className={`fa-solid ${saving ? "fa-spinner fa-spin" : "fa-check"}`}
                />{" "}
                {saving ? "Applying…" : "Apply Adjustment"}
              </button>
              <button className="header-btn" onClick={onClose}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// ═══════════════════════════════════════════════════════════
// TAB: STOCK LEVELS  (dynamic)
// ═══════════════════════════════════════════════════════════

const StockLevelsTab: React.FC = () => {
  const [items, setItems] = useState<StockItem[]>([]);
  const [kpis, setKpis] = useState<StockKpis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "low">("all");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<ApiPagination>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: ITEMS_PER_PAGE,
  });

  // For the adjust panel
  const [showPanel, setShowPanel] = useState(false);
  const [panelProductId, setPanelProductId] = useState("");
  const [panelVariantId, setPanelVariantId] = useState("");
  const [products, setProducts] = useState<ProductOption[]>([]);

  const fetchStock = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, any> = { page, limit: ITEMS_PER_PAGE };
      if (filter === "low") {
        // use /api/stock/low endpoint for low stock filter
        const res = await stockAPI.getLowStock({ page, limit: ITEMS_PER_PAGE });
        const data = res.data?.data;
        // map low stock shape to StockItem shape
        const mapped: StockItem[] = (data?.lowStockItems ?? []).map(
          (l: any) => ({
            productId: l.productId ?? "",
            productName: l.productName,
            productSku: l.productSku ?? l.variantId,
            variantId: l.variantId,
            attributes: l.attributes ?? {},
            currentStock: l.currentStock,
            lowStockThreshold: l.threshold,
            isLowStock: true,
            unitPrice: l.unitPrice ?? 0,
            estimatedValue: l.estimatedValue ?? 0,
            supplierName: l.supplierName,
            categoryName: l.categoryName,
          }),
        );
        setItems(mapped);
        setPagination({
          currentPage: data?.pagination?.currentPage ?? 1,
          totalPages: data?.pagination?.totalPages ?? 1,
          totalItems: data?.totalAlerts ?? mapped.length,
          itemsPerPage: ITEMS_PER_PAGE,
        });
      } else {
        const res = await stockAPI.getAll(params);
        const data = res.data?.data;
        setItems(data?.stockItems ?? []);
        setPagination(
          data?.pagination ?? {
            currentPage: 1,
            totalPages: 1,
            totalItems: 0,
            itemsPerPage: ITEMS_PER_PAGE,
          },
        );
      }
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Failed to load stock data.");
    } finally {
      setLoading(false);
    }
  }, [page, filter]);

  const fetchKpis = useCallback(async () => {
    try {
      const res = await stockAPI.getAnalytics();
      setKpis(res.data?.data?.kpis ?? null);
    } catch {
      /* non-fatal */
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await productsAPI.getAll({ limit: 200 });
      const prods = (res.data?.data?.products ?? []).map((p: any) => ({
        _id: p._id,
        name: p.name,
        sku: p.sku,
        variants: p.variants ?? [],
      }));
      setProducts(prods);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    fetchStock();
  }, [fetchStock]);
  useEffect(() => {
    fetchKpis();
    fetchProducts();
  }, [fetchKpis, fetchProducts]);

  // Client-side search (search across already-fetched page)
  const displayed = search
    ? items.filter(
        (it) =>
          it.productSku.toLowerCase().includes(search.toLowerCase()) ||
          it.productName.toLowerCase().includes(search.toLowerCase()),
      )
    : items;

  const { currentPage, totalPages, totalItems } = pagination;
  const start = (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const end = Math.min(currentPage * ITEMS_PER_PAGE, totalItems);

  const openPanel = (productId: string, variantId: string) => {
    setPanelProductId(productId);
    setPanelVariantId(variantId);
    setShowPanel(true);
  };

  return (
    <>
      {/* Stat Cards */}
      <div className="stats-row" style={{ marginBottom: 14 }}>
        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-label">Total Variants</div>
            <div className="stat-icon" style={{ background: "#FFF5EE" }}>
              <i className="fa-solid fa-box ic-orange" />
            </div>
          </div>
          <div className="stat-value">
            {kpis ? kpis.totalVariants.toLocaleString() : "—"}
          </div>
          <div className="stat-trend neutral">
            <i className="fa-solid fa-minus" /> Live count
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-label">Total Stock Units</div>
            <div
              className="stat-icon"
              style={{ background: "var(--green-bg)" }}
            >
              <i className="fa-solid fa-circle-check ic-green" />
            </div>
          </div>
          <div className="stat-value">
            {kpis ? kpis.totalStockUnits.toLocaleString() : "—"}
          </div>
          <div className="stat-trend up">
            <i className="fa-solid fa-arrow-trend-up" /> Live count
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-label">Low Stock Alerts</div>
            <div
              className="stat-icon"
              style={{ background: "var(--yellow-bg)" }}
            >
              <i className="fa-solid fa-triangle-exclamation ic-yellow" />
            </div>
          </div>
          <div className="stat-value">{kpis ? kpis.lowStockAlerts : "—"}</div>
          <div className="stat-trend down">
            <i className="fa-solid fa-arrow-trend-down" /> Needs attention
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-label">Inventory Value</div>
            <div className="stat-icon" style={{ background: "var(--red-bg)" }}>
              <i className="fa-solid fa-circle-exclamation ic-red" />
            </div>
          </div>
          <div className="stat-value">
            {kpis
              ? `₨${parseFloat(kpis.totalInventoryValue).toLocaleString()}`
              : "—"}
          </div>
          <div className="stat-trend neutral">
            <i className="fa-solid fa-minus" /> Estimated
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
                placeholder="Search SKU, product name…"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <button
              className={`t-filter-btn ${filter === "all" ? "active" : ""}`}
              onClick={() => {
                setFilter("all");
                setPage(1);
              }}
            >
              All Items
            </button>
            <button
              className={`t-filter-btn ${filter === "low" ? "active" : ""}`}
              onClick={() => {
                setFilter("low");
                setPage(1);
              }}
            >
              <i className="fa-solid fa-triangle-exclamation" /> Low Stock Only
            </button>
          </div>
          <div className="table-toolbar-right">
            <button className="t-filter-btn" onClick={fetchStock}>
              <i className="fa-solid fa-rotate-right" /> Refresh
            </button>
            <button
              className="header-btn primary"
              onClick={() => {
                setPanelProductId("");
                setPanelVariantId("");
                setShowPanel(true);
              }}
            >
              <i className="fa-solid fa-plus" /> Stock In
            </button>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>SKU</th>
                <th>Product</th>
                <th>Variant</th>
                <th>Stock</th>
                <th>Threshold</th>
                <th>Est. Value</th>
                <th>Supplier</th>
                <th>Health</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <SkeletonRow key={i} cols={9} />
                ))
              ) : error ? (
                <EmptyState message={error} cols={9} onRetry={fetchStock} />
              ) : displayed.length === 0 ? (
                <EmptyState
                  message="No stock records found."
                  cols={9}
                  onRetry={fetchStock}
                />
              ) : (
                displayed.map((item, i) => {
                  const health = getHealth(
                    item.currentStock,
                    item.lowStockThreshold,
                  );
                  const fillCls =
                    health === "Critical"
                      ? "red"
                      : health === "Low"
                        ? "yellow"
                        : "green";
                  const fillPct = Math.min(
                    100,
                    (item.currentStock /
                      Math.max(item.lowStockThreshold * 3, 1)) *
                      100,
                  );
                  const attrStr =
                    Object.values(item.attributes).join(" / ") || "—";
                  return (
                    <tr key={`${item.productId}-${item.variantId}`}>
                      <td>
                        <code className="inv-code-chip">{item.productSku}</code>
                      </td>
                      <td>
                        <strong>{item.productName}</strong>
                      </td>
                      <td>
                        <span className="tag" style={{ fontSize: 10 }}>
                          {attrStr}
                        </span>
                      </td>
                      <td>
                        <strong style={{ fontSize: 13 }}>
                          {item.currentStock}
                        </strong>
                      </td>
                      <td>{item.lowStockThreshold}</td>
                      <td
                        style={{ fontSize: 11, color: "var(--text-secondary)" }}
                      >
                        {fmt(item.estimatedValue)}
                      </td>
                      <td style={{ fontSize: 11, color: "var(--text-muted)" }}>
                        {item.supplierName ?? "—"}
                      </td>
                      <td>
                        <div className="inv-stock-health">
                          <Badge label={health} />
                          <div className="prog-bar" style={{ width: 60 }}>
                            <div
                              className={`prog-fill ${fillCls}`}
                              style={{ width: `${fillPct}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td>
                        <ThreeDot
                          id={`inv-${i}`}
                          items={[
                            {
                              label: "Add Stock",
                              icon: "fa-plus",
                              onClick: () =>
                                openPanel(item.productId, item.variantId),
                            },
                            {
                              label: "Remove Stock",
                              icon: "fa-minus",
                              onClick: () =>
                                openPanel(item.productId, item.variantId),
                            },
                            {
                              label: "View History",
                              icon: "fa-clock-rotate-left",
                              onClick: () => {},
                            },
                          ]}
                        />
                      </td>
                    </tr>
                  );
                })
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

      <StockAdjustPanel
        open={showPanel}
        onClose={() => setShowPanel(false)}
        onSuccess={() => {
          fetchStock();
          fetchKpis();
        }}
        products={products}
        preselectedProductId={panelProductId}
        preselectedVariantId={panelVariantId}
        title="Stock In / Adjustment"
      />
    </>
  );
};

// ═══════════════════════════════════════════════════════════
// TAB: MOVEMENTS  (dynamic)
// ═══════════════════════════════════════════════════════════

const MovementsTab: React.FC = () => {
  const [history, setHistory] = useState<StockHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<ApiPagination>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20,
  });
  const [typeFilter, setTypeFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [showPanel, setShowPanel] = useState(false);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, any> = { page, limit: 20 };
      if (typeFilter) params.changeType = typeFilter;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      const res = await stockAPI.getHistory(params);
      const data = res.data?.data;
      setHistory(data?.history ?? []);
      setPagination(
        data?.pagination ?? {
          currentPage: 1,
          totalPages: 1,
          totalItems: 0,
          itemsPerPage: 20,
        },
      );
    } catch (e: any) {
      setError(
        e?.response?.data?.message ?? "Failed to load movement history.",
      );
    } finally {
      setLoading(false);
    }
  }, [page, typeFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  useEffect(() => {
    productsAPI
      .getAll({ limit: 200 })
      .then((r) => {
        setProducts(
          (r.data?.data?.products ?? []).map((p: any) => ({
            _id: p._id,
            name: p.name,
            sku: p.sku,
            variants: p.variants ?? [],
          })),
        );
      })
      .catch(() => {});
  }, []);

  const moveBg: Record<string, string> = {
    Inbound: "var(--green-bg)",
    Outbound: "var(--red-bg)",
    Adjustment: "var(--yellow-bg)",
    Return: "var(--green-bg)",
    Damaged: "var(--red-bg)",
    Audit: "var(--blue-bg)",
  };
  const moveIcon: Record<string, string> = {
    Inbound: "fa-arrow-down ic-green",
    Outbound: "fa-arrow-up ic-red",
    Adjustment: "fa-arrows-up-down ic-yellow",
    Return: "fa-arrow-down ic-green",
    Damaged: "fa-arrow-up ic-red",
    Audit: "fa-clipboard-check",
  };

  const { currentPage, totalPages, totalItems } = pagination;
  const start = (currentPage - 1) * 20 + 1;
  const end = Math.min(currentPage * 20, totalItems);

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">
          <i className="fa-solid fa-arrows-left-right" /> Stock Movements
        </div>
        <button
          className="header-btn primary"
          onClick={() => setShowPanel(true)}
        >
          <i className="fa-solid fa-plus" /> Log Movement
        </button>
      </div>

      {/* Filters */}
      <div
        className="table-toolbar"
        style={{ borderBottom: "none", paddingBottom: 0 }}
      >
        <div className="table-toolbar-left">
          {[
            "",
            "Inbound",
            "Outbound",
            "Adjustment",
            "Return",
            "Damaged",
            "Audit",
          ].map((t) => (
            <button
              key={t}
              className={`t-filter-btn ${typeFilter === t ? "active" : ""}`}
              onClick={() => {
                setTypeFilter(t);
                setPage(1);
              }}
            >
              {t || "All Types"}
            </button>
          ))}
        </div>
        <div className="table-toolbar-right" style={{ gap: 6 }}>
          <input
            className="form-input"
            type="date"
            style={{ height: 28, fontSize: 11, width: 130 }}
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
          <span
            style={{
              fontSize: 11,
              color: "var(--text-muted)",
              alignSelf: "center",
            }}
          >
            to
          </span>
          <input
            className="form-input"
            type="date"
            style={{ height: 28, fontSize: 11, width: 130 }}
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
          <button className="t-filter-btn" onClick={fetchHistory}>
            <i className="fa-solid fa-rotate-right" />
          </button>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>SKU / Variant</th>
              <th>Product</th>
              <th>Type</th>
              <th>Qty Change</th>
              <th>Stock After</th>
              <th>Reason</th>
              <th>By</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <SkeletonRow key={i} cols={8} />
              ))
            ) : error ? (
              <EmptyState message={error} cols={8} onRetry={fetchHistory} />
            ) : history.length === 0 ? (
              <EmptyState message="No stock movements found." cols={8} />
            ) : (
              history.map((m, i) => (
                <tr key={m._id}>
                  <td>
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                      {new Date(m.createdAt).toLocaleString()}
                    </span>
                  </td>
                  <td>
                    <code className="inv-code-chip">{m.variantId}</code>
                  </td>
                  <td>
                    {/* productId is a MongoID; show it shortened if no name available */}
                    <strong style={{ fontSize: 11 }}>
                      {typeof m.productId === "object"
                        ? ((m.productId as any).name ?? "—")
                        : m.variantId.split("-").slice(0, 2).join("-")}
                    </strong>
                  </td>
                  <td>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 6 }}
                    >
                      <div
                        className="inv-move-icon"
                        style={{
                          background:
                            moveBg[m.changeType] ?? "var(--yellow-bg)",
                        }}
                      >
                        <i
                          className={`fa-solid ${moveIcon[m.changeType] ?? "fa-circle"}`}
                          style={{ fontSize: 10 }}
                        />
                      </div>
                      <Badge label={m.changeType} />
                    </div>
                  </td>
                  <td>
                    <strong
                      style={{
                        color:
                          m.quantityChange > 0
                            ? "var(--green)"
                            : m.quantityChange < 0
                              ? "var(--red)"
                              : "var(--yellow)",
                      }}
                    >
                      {m.quantityChange > 0
                        ? `+${m.quantityChange}`
                        : m.quantityChange}
                    </strong>
                  </td>
                  <td>{m.newStockLevel}</td>
                  <td style={{ fontSize: 11 }}>{m.reason ?? "—"}</td>
                  <td>
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                      {m.recordedBy?.username ?? "System"}
                    </span>
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

      <StockAdjustPanel
        open={showPanel}
        onClose={() => setShowPanel(false)}
        onSuccess={fetchHistory}
        products={products}
        title="Log Stock Movement"
      />
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// TAB: ALERTS  (dynamic)
// ═══════════════════════════════════════════════════════════

const AlertsTab: React.FC = () => {
  const [alerts, setAlerts] = useState<LowStockItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [showPanel, setShowPanel] = useState(false);
  const [panelProductId, setPanelProductId] = useState("");

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await stockAPI.getLowStock({ limit: 50 });
      setAlerts(res.data?.data?.lowStockItems ?? []);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Failed to load alerts.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);
  useEffect(() => {
    productsAPI
      .getAll({ limit: 200 })
      .then((r) => {
        setProducts(
          (r.data?.data?.products ?? []).map((p: any) => ({
            _id: p._id,
            name: p.name,
            sku: p.sku,
            variants: p.variants ?? [],
          })),
        );
      })
      .catch(() => {});
  }, []);

  const critical = alerts.filter(
    (a) => a.currentStock === 0 || a.currentStock < a.threshold / 2,
  );
  const low = alerts.filter(
    (a) => a.currentStock > 0 && a.currentStock >= a.threshold / 2,
  );

  return (
    <>
      <div className="stats-row" style={{ marginBottom: 14 }}>
        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-label">Total Alerts</div>
            <div className="stat-icon" style={{ background: "var(--red-bg)" }}>
              <i className="fa-solid fa-bell ic-red" />
            </div>
          </div>
          <div className="stat-value">{loading ? "…" : alerts.length}</div>
          <div className="stat-trend down">
            <i className="fa-solid fa-arrow-trend-down" /> Live
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-label">Critical (OOS / Near 0)</div>
            <div className="stat-icon" style={{ background: "var(--red-bg)" }}>
              <i className="fa-solid fa-circle-exclamation ic-red" />
            </div>
          </div>
          <div className="stat-value">{loading ? "…" : critical.length}</div>
          <div className="stat-trend down">
            <i className="fa-solid fa-arrow-trend-down" /> Restock ASAP
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-label">Low Stock</div>
            <div
              className="stat-icon"
              style={{ background: "var(--yellow-bg)" }}
            >
              <i className="fa-solid fa-triangle-exclamation ic-yellow" />
            </div>
          </div>
          <div className="stat-value">{loading ? "…" : low.length}</div>
          <div className="stat-trend down">
            <i className="fa-solid fa-arrow-trend-down" /> Monitor
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-label">Avg. Deficit</div>
            <div
              className="stat-icon"
              style={{ background: "var(--orange-bg, #FFF5EE)" }}
            >
              <i className="fa-solid fa-chart-bar ic-orange" />
            </div>
          </div>
          <div className="stat-value">
            {loading || alerts.length === 0
              ? "—"
              : Math.round(
                  alerts.reduce((a, i) => a + i.stockDeficit, 0) /
                    alerts.length,
                )}
          </div>
          <div className="stat-trend neutral">
            <i className="fa-solid fa-minus" /> Units short
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <i className="fa-solid fa-triangle-exclamation ic-red" /> Low Stock
            Alerts
          </div>
          <button className="t-filter-btn" onClick={fetchAlerts}>
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
          ) : error ? (
            <div style={{ padding: 16, color: "var(--red)", fontSize: 12 }}>
              <i className="fa-solid fa-circle-exclamation" /> {error}
              <button
                className="header-btn"
                style={{ marginLeft: 8, display: "inline-flex" }}
                onClick={fetchAlerts}
              >
                Retry
              </button>
            </div>
          ) : alerts.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: 32,
                color: "var(--text-muted)",
              }}
            >
              <i
                className="fa-solid fa-circle-check"
                style={{
                  fontSize: 24,
                  color: "var(--green)",
                  marginBottom: 8,
                  display: "block",
                }}
              />
              All stock levels are healthy!
            </div>
          ) : (
            alerts.map((alert, i) => {
              const isCritical =
                alert.currentStock === 0 ||
                alert.currentStock < alert.threshold / 2;
              const severity = isCritical ? "Critical" : "Low";
              // try to find product id for quick restock
              const prod = products.find(
                (p) =>
                  p.sku === alert.productSku || p.name === alert.productName,
              );
              return (
                <div key={`${alert.variantId}-${i}`} className="list-item">
                  <div
                    className="list-icon"
                    style={{
                      background: isCritical
                        ? "var(--red-bg)"
                        : "var(--yellow-bg)",
                    }}
                  >
                    <i
                      className={`fa-solid fa-box ${isCritical ? "ic-red" : "ic-yellow"}`}
                      style={{ fontSize: 12 }}
                    />
                  </div>
                  <div className="list-content">
                    <div className="list-title">
                      {alert.productName} —{" "}
                      <code style={{ fontSize: 10 }}>{alert.variantId}</code>
                    </div>
                    <div className="list-meta">
                      {alert.currentStock} unit
                      {alert.currentStock !== 1 ? "s" : ""} remaining ·
                      Threshold: {alert.threshold}· Deficit:{" "}
                      <strong style={{ color: "var(--red)" }}>
                        -{alert.stockDeficit}
                      </strong>
                      {alert.supplierName ? ` · ${alert.supplierName}` : ""}
                    </div>
                  </div>
                  <div
                    className="list-right"
                    style={{ gap: 6, display: "flex", alignItems: "center" }}
                  >
                    <Badge label={severity} />
                    {prod && (
                      <button
                        className="header-btn"
                        style={{ fontSize: 10, padding: "2px 8px", height: 24 }}
                        onClick={() => {
                          setPanelProductId(prod._id);
                          setShowPanel(true);
                        }}
                      >
                        <i className="fa-solid fa-plus" /> Restock
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <StockAdjustPanel
        open={showPanel}
        onClose={() => setShowPanel(false)}
        onSuccess={fetchAlerts}
        products={products}
        preselectedProductId={panelProductId}
        title="Quick Restock"
      />
    </>
  );
};

// ═══════════════════════════════════════════════════════════
// TAB: ADJUSTMENTS  (dynamic)
// ═══════════════════════════════════════════════════════════

const AdjustmentsTab: React.FC = () => {
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [history, setHistory] = useState<StockHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPanel, setShowPanel] = useState(false);

  // Inline form state (quick adjustment without opening panel)
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [changeType, setChangeType] = useState("Add Stock");
  const [quantity, setQuantity] = useState(0);
  const [reason, setReason] = useState("Supplier Restock");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const changeTypeMap: Record<string, string> = {
    "Add Stock": "Inbound",
    "Remove Stock": "Outbound",
    "Damage Write-off": "Damaged",
    "Return Received": "Return",
    "Manual Correction": "Adjustment",
  };

  const fetchData = useCallback(async () => {
    setLoading(true);

    // Fetch products independently — must not fail silently if history call fails
    try {
      const prodRes = await productsAPI.getAll({ limit: 200 });
      setProducts(
        (prodRes.data?.data?.products ?? []).map((p: any) => ({
          _id: p._id,
          name: p.name,
          sku: p.sku,
          variants: p.variants ?? [],
        })),
      );
    } catch {
      /* ignore */
    }

    // Fetch history separately (non-fatal if it fails)
    try {
      const histRes = await stockAPI.getHistory({ limit: 10 });
      setHistory(histRes.data?.data?.history ?? []);
    } catch {
      /* ignore */
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const selectedProduct = products.find((p) => p._id === selectedProductId);

  const handleApply = async () => {
    if (!selectedProductId) {
      setError("Please select a product.");
      return;
    }
    if (!quantity || quantity <= 0) {
      setError("Quantity must be > 0.");
      return;
    }

    const finalVariantId =
      selectedVariantId || selectedProduct?.variants?.[0]?.variantId;
    if (!finalVariantId) {
      setError("This product has no variants to adjust.");
      return;
    }

    const backendChangeType = changeTypeMap[changeType] ?? "Adjustment";
    const isNeg =
      backendChangeType === "Outbound" || backendChangeType === "Damaged";
    setSaving(true);
    setError("");
    setSuccessMsg("");
    try {
      const res = await stockAPI.adjust({
        productId: selectedProductId,
        variantId: finalVariantId,
        changeType: backendChangeType,
        quantityChange: isNeg ? -Math.abs(quantity) : Math.abs(quantity),
        reason: notes ? `${reason} — ${notes}` : reason,
      });
      const d = res.data?.data;
      setSuccessMsg(
        `✓ Stock updated: ${d?.oldStock ?? "?"} → ${d?.newStock ?? "?"} units`,
      );
      setQuantity(0);
      setNotes("");
      fetchData();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Failed to apply adjustment.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">
          <i className="fa-solid fa-sliders" /> Stock Adjustments
        </div>
        <button
          className="header-btn primary"
          onClick={() => setShowPanel(true)}
        >
          <i className="fa-solid fa-plus" /> New Adjustment
        </button>
      </div>
      <div className="card-body">
        <div className="info-banner">
          <i className="fa-solid fa-circle-info" />
          <div className="info-banner-text">
            All manual adjustments are logged with reason codes for full audit
            trail.
          </div>
        </div>

        <div className="inv-adj-form" style={{ marginTop: 14 }}>
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
          {successMsg && (
            <div
              style={{
                color: "var(--green)",
                fontSize: 12,
                marginBottom: 8,
                padding: "6px 10px",
                background: "var(--green-bg)",
                borderRadius: 6,
              }}
            >
              <i className="fa-solid fa-circle-check" /> {successMsg}
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <div className="form-label">Select Product</div>
              <select
                className="form-select"
                value={selectedProductId}
                onChange={(e) => {
                  setSelectedProductId(e.target.value);
                  setSelectedVariantId("");
                }}
              >
                <option value="">— Select —</option>
                {products.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.sku} — {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <div className="form-label">Adjustment Type</div>
              <select
                className="form-select"
                value={changeType}
                onChange={(e) => setChangeType(e.target.value)}
              >
                <option>Add Stock</option>
                <option>Remove Stock</option>
                <option>Damage Write-off</option>
                <option>Return Received</option>
                <option>Manual Correction</option>
              </select>
            </div>
          </div>

          {selectedProduct && selectedProduct.variants.length > 1 && (
            <div className="form-group" style={{ marginBottom: 10 }}>
              <div className="form-label">Variant</div>
              <select
                className="form-select"
                style={{ width: "100%" }}
                value={selectedVariantId}
                onChange={(e) => setSelectedVariantId(e.target.value)}
              >
                <option value="">— Default / All —</option>
                {selectedProduct.variants.map((v) => {
                  const label =
                    Object.values(v.attributes).join(" / ") || v.variantId;
                  return (
                    <option key={v.variantId} value={v.variantId}>
                      {label}
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <div className="form-label">Quantity</div>
              <input
                className="form-input"
                type="number"
                value={quantity || ""}
                onChange={(e) =>
                  setQuantity(Math.abs(parseInt(e.target.value) || 0))
                }
                min={1}
                placeholder="0"
              />
            </div>
            <div className="form-group">
              <div className="form-label">Reason Code</div>
              <select
                className="form-select"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              >
                <option>Supplier Restock</option>
                <option>Damage Write-off</option>
                <option>Return Received</option>
                <option>Manual Correction</option>
                <option>Order Fulfillment</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <div className="form-label">Notes (optional)</div>
            <input
              className="form-input"
              placeholder="Additional notes…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{ width: "100%" }}
            />
          </div>

          <hr />
          <button
            className="header-btn primary"
            onClick={handleApply}
            disabled={saving}
          >
            <i
              className={`fa-solid ${saving ? "fa-spinner fa-spin" : "fa-check"}`}
            />{" "}
            {saving ? "Applying…" : "Apply Adjustment"}
          </button>
        </div>

        {/* Recent adjustments */}
        {history.length > 0 && (
          <>
            <hr style={{ margin: "16px 0 10px" }} />
            <div
              className="stock-log-section-label"
              style={{
                fontSize: 12,
                fontWeight: 600,
                marginBottom: 8,
                color: "var(--text-secondary)",
              }}
            >
              Recent Adjustments
            </div>
            {loading ? (
              <div style={{ color: "var(--text-muted)", fontSize: 12 }}>
                <i className="fa-solid fa-spinner fa-spin" /> Loading…
              </div>
            ) : (
              history.slice(0, 8).map((m, i) => {
                const isIn = m.quantityChange > 0;
                const color = isIn ? "var(--green)" : "var(--red)";
                const bg = isIn
                  ? "var(--green-bg)"
                  : m.changeType === "Damaged"
                    ? "var(--red-bg)"
                    : "var(--yellow-bg)";
                const ic = isIn
                  ? "fa-arrow-down ic-green"
                  : "fa-arrow-up ic-red";
                return (
                  <div
                    key={m._id}
                    className="list-item"
                    style={{ padding: "5px 0" }}
                  >
                    <div className="list-icon" style={{ background: bg }}>
                      <i
                        className={`fa-solid ${ic}`}
                        style={{ fontSize: 10 }}
                      />
                    </div>
                    <div className="list-content">
                      <div className="list-title" style={{ fontSize: 12 }}>
                        {m.reason ?? m.changeType} —{" "}
                        <code style={{ fontSize: 10 }}>{m.variantId}</code>
                      </div>
                      <div className="list-meta">
                        {new Date(m.createdAt).toLocaleString()} ·{" "}
                        {m.recordedBy?.username ?? "System"}
                      </div>
                    </div>
                    <div className="list-right">
                      <strong style={{ color, fontSize: 12 }}>
                        {m.quantityChange > 0 ? "+" : ""}
                        {m.quantityChange}
                      </strong>
                      <div style={{ fontSize: 10, color: "var(--text-muted)" }}>
                        After: {m.newStockLevel}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </>
        )}
      </div>

      <StockAdjustPanel
        open={showPanel}
        onClose={() => setShowPanel(false)}
        onSuccess={fetchData}
        products={products}
        title="New Stock Adjustment"
      />
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// TAB: SETTINGS  (UI-only — no dedicated settings endpoint)
// ═══════════════════════════════════════════════════════════

const InventorySettingsTab: React.FC = () => (
  <div className="card">
    <div className="card-header">
      <div className="card-title">
        <i className="fa-solid fa-gear" /> Inventory Settings
      </div>
    </div>
    <div className="card-body">
      <div className="info-banner" style={{ marginBottom: 14 }}>
        <i className="fa-solid fa-circle-info" />
        <div className="info-banner-text">
          These settings are stored locally. A dedicated{" "}
          <strong>/api/settings/inventory</strong> endpoint does not yet exist
          on the backend.
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <div className="form-label">Auto-deduct on Order Confirm</div>
          <select className="form-select">
            <option>Yes</option>
            <option>No</option>
          </select>
        </div>
        <div className="form-group">
          <div className="form-label">Alert Notification To</div>
          <select className="form-select">
            <option>Inventory Manager</option>
            <option>Admin</option>
            <option>Both</option>
          </select>
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <div className="form-label">Allow Negative Stock</div>
          <select className="form-select">
            <option>No — Block orders</option>
            <option>Yes — Allow oversell</option>
          </select>
        </div>
        <div className="form-group">
          <div className="form-label">Reserve Stock on Pending</div>
          <select className="form-select">
            <option>Yes</option>
            <option>No</option>
          </select>
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <div className="form-label">Default Low Stock Threshold</div>
          <input className="form-input" type="number" defaultValue={10} />
        </div>
        <div className="form-group">
          <div className="form-label">Alert Frequency</div>
          <select className="form-select">
            <option>Real-time</option>
            <option>Daily digest</option>
            <option>Weekly digest</option>
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

// ═══════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════

const InventoryPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<InventoryTab>("stock");
  const [alertCount, setAlertCount] = useState<number | null>(null);
  const { isLoading, loadingProgress, switchTab } = useTabLoading(
    setActiveTab,
    activeTab,
  );

  // fetch alert count once for the tab badge
  useEffect(() => {
    stockAPI
      .getLowStock({ limit: 1 })
      .then((r) => {
        setAlertCount(r.data?.data?.totalAlerts ?? 0);
      })
      .catch(() => {});
  }, []);

  const tabs: {
    id: InventoryTab;
    icon: string;
    label: string;
    badge?: number | null;
  }[] = [
    { id: "stock", icon: "fa-cubes", label: "Stock Levels" },
    { id: "movements", icon: "fa-arrows-left-right", label: "Movements" },
    {
      id: "alerts",
      icon: "fa-triangle-exclamation",
      label: "Alerts",
      badge: alertCount,
    },
    { id: "adjustments", icon: "fa-sliders", label: "Adjustments" },
    { id: "settings", icon: "fa-gear", label: "Settings" },
  ];

  return (
    <div id="page-inventory">
      <TopLoadingBar progress={loadingProgress} isLoading={isLoading} />
      <div className="section-heading">Inventory Management</div>
      <div className="section-subheading">
        Real-time stock levels, movements, alerts, and manual adjustments.
      </div>

      <div className="h-tabs">
        {tabs.map((t) => (
          <div
            key={t.id}
            className={`h-tab ${activeTab === t.id ? "active" : ""}`}
            onClick={() => switchTab(t.id)}
          >
            <i className={`fa-solid ${t.icon}`} /> {t.label}
            {t.badge != null && t.badge > 0 && (
              <span className="badge red" style={{ marginLeft: 4 }}>
                {t.badge}
              </span>
            )}
          </div>
        ))}
      </div>

      {activeTab === "stock" && <StockLevelsTab />}
      {activeTab === "movements" && <MovementsTab />}
      {activeTab === "alerts" && <AlertsTab />}
      {activeTab === "adjustments" && <AdjustmentsTab />}
      {activeTab === "settings" && <InventorySettingsTab />}
    </div>
  );
};

export default InventoryPage;
