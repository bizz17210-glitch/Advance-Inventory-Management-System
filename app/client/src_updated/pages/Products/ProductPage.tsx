import React, { useState, useEffect, useCallback, useRef } from "react";
import "./ProductPage.css";
import TopLoadingBar from "../../components/ui/TopLoadingBar";
import { usePageLoading } from "../../hooks/usePageLoading";
import { useTabLoading } from "../../hooks/useTabLoading";
import {
  productsAPI,
  categoriesAPI,
  suppliersAPI,
  stockAPI,
  authAPI,
} from "../../services/api";

// ═══════════════════════════════════════════════════════════
// TYPES  (aligned with backend response shapes)
// ═══════════════════════════════════════════════════════════

type ProductTab =
  | "all"
  | "variants"
  | "cats"
  | "suppliers"
  | "import"
  | "settings";
type PanelMode = "view" | "edit" | "new";

interface ApiProduct {
  _id: string;
  name: string;
  sku: string;
  description?: string;
  brand?: string;
  basePrice: number; // cost / wholesale price
  isActive: boolean;
  totalStock: number;
  variants: ApiVariant[];
  category?: { _id: string; name: string } | null;
  supplier?: { _id: string; name: string; contactPerson?: string } | null;
  tags?: string[];
  imageUrl?: string[];
}

interface ApiVariant {
  variantId: string;
  attributes: Record<string, string>; // e.g. { size: 'M', color: 'Red' }
  price: number;
  stock: number;
  lowStockThreshold?: number;
  barcode?: string;
}

interface ApiCategory {
  _id: string;
  name: string;
  description?: string;
  parentCategory?: string | null;
  hasChildren?: boolean;
  productCount?: number;
}

interface ApiSupplier {
  _id: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
  };
  paymentTerms?: string;
  balance?: number;
  hasOutstandingBalance?: boolean;
  productCount?: number;
}

interface StockLog {
  _id: string;
  changeType: string;
  quantityChange: number;
  newStockLevel: number;
  reason?: string;
  createdAt: string;
  recordedBy?: { username: string };
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

// ── product status derived from stock ──
type ProductStatus = "In Stock" | "Low Stock" | "Out of Stock";

function getProductStatus(p: ApiProduct): ProductStatus {
  const threshold = p.variants?.[0]?.lowStockThreshold ?? 10;
  if (p.totalStock === 0) return "Out of Stock";
  if (p.totalStock < threshold) return "Low Stock";
  return "In Stock";
}

// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════

const fmt = (n: number) => "₨" + n.toLocaleString();
const margin = (cost: number, price: number) =>
  price > 0 ? Math.round(((price - cost) / price) * 100) : 0;
const initials = (name: string) =>
  name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

function statusBadgeClass(s: string): string {
  const m: Record<string, string> = {
    Pending: "yellow",
    Confirmed: "blue",
    Packed: "blue",
    Shipped: "orange",
    Delivered: "green",
    Cancelled: "red",
    "In Stock": "green",
    "Low Stock": "yellow",
    "Out of Stock": "red",
    Good: "green",
    Low: "yellow",
    High: "red",
    "In Progress": "blue",
    Done: "green",
    Active: "green",
    Inactive: "gray",
    "On Hold": "yellow",
    Collected: "green",
  };
  return m[s] || "gray";
}

// ═══════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════

const Badge: React.FC<{ label: string }> = ({ label }) => (
  <span className={`badge ${statusBadgeClass(label)}`}>{label}</span>
);

interface ThreeDotProps {
  id: string;
  items: {
    label: string;
    icon: string;
    danger?: boolean;
    onClick: () => void;
  }[];
}
const ThreeDot: React.FC<ThreeDotProps> = ({ id, items }) => {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const el = document.getElementById(id);
      if (el && !el.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
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

interface PaginationProps {
  current: number;
  total: number;
  totalItems: number;
  perPage: number;
  start: number;
  end: number;
  onChange: (p: number) => void;
}
const Pagination: React.FC<PaginationProps> = ({
  current,
  total,
  totalItems,
  perPage,
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
    <div className="pagination">
      <div className="pagination-info">
        Showing{" "}
        <strong>
          {totalItems ? start : 0}–{end}
        </strong>{" "}
        of <strong>{totalItems}</strong> products
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
            <button key={`dots-${i}`} className="page-btn dots">
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

const StarRating: React.FC<{ rating: number }> = ({ rating }) => (
  <div className="stars">
    {[0, 1, 2, 3, 4].map((i) => (
      <i
        key={i}
        className={`${i < Math.floor(rating) ? "fa-solid fa-star star" : i < rating ? "fa-solid fa-star-half-stroke star" : "fa-regular fa-star star empty"}`}
      />
    ))}
    <span
      style={{
        fontSize: "10px",
        color: "var(--text-muted)",
        marginLeft: "4px",
      }}
    >
      {rating}/5
    </span>
  </div>
);

// ── Loading skeleton row ──
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

// ── Error / empty state ──
const EmptyState: React.FC<{ message: string; onRetry?: () => void }> = ({
  message,
  onRetry,
}) => (
  <tr>
    <td
      colSpan={20}
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
// PANEL: Product Detail / Edit / New
// ═══════════════════════════════════════════════════════════

interface ProductPanelProps {
  product: ApiProduct | null;
  mode: PanelMode;
  categories: ApiCategory[];
  suppliers: ApiSupplier[];
  onClose: () => void;
  onModeChange: (m: PanelMode) => void;
  onSaved: () => void;
  onSwitchToVariants?: () => void;
}

const ProductPanel: React.FC<ProductPanelProps> = ({
  product,
  mode,
  categories,
  suppliers,
  onClose,
  onModeChange,
  onSaved,
  onSwitchToVariants,
}) => {
  const [panelTab, setPanelTab] = useState<"overview" | "stock" | "variants">(
    "overview",
  );
  const [stockLogs, setStockLogs] = useState<StockLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  // form refs
  const nameRef = useRef<HTMLInputElement>(null);
  const skuRef = useRef<HTMLInputElement>(null);
  const catRef = useRef<HTMLSelectElement>(null);
  const costRef = useRef<HTMLInputElement>(null);
  const priceRef = useRef<HTMLInputElement>(null);
  const stockRef = useRef<HTMLInputElement>(null);
  const supRef = useRef<HTMLSelectElement>(null);
  const descRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setPanelTab("overview");
    setSaveError("");
  }, [product, mode]);

  useEffect(() => {
    if (product && panelTab === "stock") {
      setLogsLoading(true);
      stockAPI
        .getHistory({ productId: product._id, limit: 10 })
        .then((r) => setStockLogs(r.data?.data?.history ?? []))
        .catch(() => setStockLogs([]))
        .finally(() => setLogsLoading(false));
    }
  }, [product, panelTab]);

  const isNew = mode === "new";
  const isEdit = mode === "edit";
  const isView = mode === "view";
  const title = isNew
    ? "Add New Product"
    : isEdit
      ? "Edit Product"
      : (product?.name ?? "Product Details");

  const handleSave = async () => {
    if (!nameRef.current?.value) {
      setSaveError("Product name is required.");
      return;
    }
    setSaving(true);
    setSaveError("");

    // Auto-generate SKU if field is empty (placeholder said "Auto-generated" but it wasn't actually generating one)
    const enteredSku = skuRef.current?.value?.trim();
    const finalSku =
      enteredSku && enteredSku.length > 0 ? enteredSku : `SKU-${Date.now()}`;

    const payload = {
      name: nameRef.current?.value ?? "",
      sku: finalSku,
      description: descRef.current?.value ?? "",
      basePrice: parseFloat(costRef.current?.value ?? "0"),
      category: catRef.current?.value ?? undefined,
      supplier: supRef.current?.value ?? undefined,
      variants: [
        {
          variantId: finalSku,
          attributes: {},
          price: parseFloat(priceRef.current?.value ?? "0"),
          stock: parseInt(stockRef.current?.value ?? "0", 10),
          lowStockThreshold: 10,
        },
      ],
    };
    try {
      if (isNew) {
        await productsAPI.create(payload);
      } else if (product) {
        // Update main product fields
        await productsAPI.update(product._id, {
          name: payload.name,
          description: payload.description,
          basePrice: payload.basePrice,
          category: payload.category,
          supplier: payload.supplier,
        });

        // Update first variant's price/stock separately (variants have their own endpoint)
        const firstVariant = product.variants?.[0];
        if (firstVariant) {
          await productsAPI.updateVariant(product._id, firstVariant.variantId, {
            price: parseFloat(priceRef.current?.value ?? "0"),
            stock: parseInt(stockRef.current?.value ?? "0", 10),
          });
        }
      }
      onSaved();
      onClose();
    } catch (e: any) {
      setSaveError(e?.response?.data?.message ?? "Failed to save product.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!product || !window.confirm("Deactivate this product?")) return;
    try {
      await productsAPI.delete(product._id);
      onSaved();
      onClose();
    } catch {
      /* ignore */
    }
  };

  const renderForm = () => (
    <>
      {saveError && (
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
          <i className="fa-solid fa-circle-exclamation" /> {saveError}
        </div>
      )}
      <div className="form-group" style={{ marginBottom: 10 }}>
        <div className="form-label">Product Name *</div>
        <input
          ref={nameRef}
          className="form-input"
          defaultValue={product?.name ?? ""}
          placeholder="Enter product name"
          style={{ width: "100%" }}
        />
      </div>
      <div className="form-row">
        <div className="form-group">
          <div className="form-label">SKU</div>
          <input
            ref={skuRef}
            className="form-input"
            defaultValue={product?.sku ?? ""}
            placeholder="Auto-generated"
          />
        </div>
        <div className="form-group">
          <div className="form-label">Category</div>
          <select ref={catRef} className="form-select">
            <option value="">— Select —</option>
            {categories.map((c) => (
              <option
                key={c._id}
                value={c._id}
                selected={product?.category?._id === c._id}
              >
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <div className="form-label">Cost Price (₨) *</div>
          <input
            ref={costRef}
            className="form-input"
            type="number"
            defaultValue={product?.basePrice ?? ""}
            placeholder="0"
          />
        </div>
        <div className="form-group">
          <div className="form-label">Sale Price (₨) *</div>
          <input
            ref={priceRef}
            className="form-input"
            type="number"
            defaultValue={product?.variants?.[0]?.price ?? ""}
            placeholder="0"
          />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <div className="form-label">
            {isNew ? "Initial Stock" : "Stock (first variant)"}
          </div>
          <input
            ref={stockRef}
            className="form-input"
            type="number"
            defaultValue={product?.totalStock ?? 0}
          />
        </div>
        <div className="form-group">
          <div className="form-label">Supplier</div>
          <select ref={supRef} className="form-select">
            <option value="">— Select —</option>
            {suppliers.map((s) => (
              <option
                key={s._id}
                value={s._id}
                selected={product?.supplier?._id === s._id}
              >
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="form-group" style={{ marginBottom: 10 }}>
        <div className="form-label">Description</div>
        <textarea
          ref={descRef}
          className="form-input"
          style={{
            height: 64,
            width: "100%",
            resize: "vertical",
            paddingTop: 6,
          }}
          placeholder="Product description..."
          defaultValue={product?.description ?? ""}
        />
      </div>
      <hr />
      <div style={{ display: "flex", gap: 8 }}>
        <button
          className="header-btn primary"
          style={{ flex: 1, justifyContent: "center" }}
          onClick={handleSave}
          disabled={saving}
        >
          <i
            className={`fa-solid ${saving ? "fa-spinner fa-spin" : isNew ? "fa-plus" : "fa-check"}`}
          />{" "}
          {saving ? "Saving…" : isNew ? "Add Product" : "Save Changes"}
        </button>
        <button className="header-btn" onClick={onClose}>
          Cancel
        </button>
      </div>
    </>
  );

  const renderOverview = () => {
    if (!product) return null;
    const st = getProductStatus(product);
    const saleP = product.variants?.[0]?.price ?? 0;
    const mg = margin(product.basePrice, saleP);
    const mgColor =
      mg >= 50 ? "var(--green)" : mg >= 30 ? "var(--yellow)" : "var(--red)";
    return (
      <>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 14,
          }}
        >
          <div className="prod-panel-avatar">{initials(product.name)}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 800 }}>{product.name}</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
              {product.sku} · {product.category?.name ?? "—"}
            </div>
          </div>
          <Badge label={st} />
        </div>
        {product.description && (
          <div className="prod-panel-desc-box">{product.description}</div>
        )}
        <div className="detail-row">
          <div className="detail-key">Cost Price</div>
          <div className="detail-val">{fmt(product.basePrice)}</div>
        </div>
        <div className="detail-row">
          <div className="detail-key">Sale Price</div>
          <div className="detail-val">
            <strong>{saleP ? fmt(saleP) : "—"}</strong>
          </div>
        </div>
        <div className="detail-row">
          <div className="detail-key">Gross Margin</div>
          <div className="detail-val" style={{ color: mgColor }}>
            {saleP ? `${mg}%` : "—"}
          </div>
        </div>
        <div className="detail-row">
          <div className="detail-key">Total Stock</div>
          <div className="detail-val">
            <strong>{product.totalStock} units</strong>
          </div>
        </div>
        <div className="detail-row">
          <div className="detail-key">Variants</div>
          <div className="detail-val">{product.variants?.length ?? 0}</div>
        </div>
        <div className="detail-row">
          <div className="detail-key">Supplier</div>
          <div className="detail-val">{product.supplier?.name ?? "—"}</div>
        </div>
        <div className="detail-row">
          <div className="detail-key">Brand</div>
          <div className="detail-val">{product.brand ?? "—"}</div>
        </div>
        <div className="detail-row">
          <div className="detail-key">Status</div>
          <div className="detail-val">
            <Badge label={product.isActive ? "Active" : "Inactive"} />
          </div>
        </div>
        <hr />
        <div className="prod-panel-actions">
          <button
            className="header-btn primary"
            onClick={() => onModeChange("edit")}
          >
            <i className="fa-solid fa-pen" /> Edit
          </button>
          <button
            className="header-btn"
            style={{ color: "var(--red)", borderColor: "var(--red)" }}
            onClick={handleDelete}
          >
            <i className="fa-solid fa-trash" /> Delete
          </button>
        </div>
      </>
    );
  };

  const renderStockLog = () => (
    <>
      <div className="stock-log-section-label">Recent Stock Movements</div>
      {logsLoading ? (
        <div
          style={{
            textAlign: "center",
            padding: 20,
            color: "var(--text-muted)",
          }}
        >
          <i className="fa-solid fa-spinner fa-spin" /> Loading…
        </div>
      ) : stockLogs.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: 20,
            color: "var(--text-muted)",
          }}
        >
          No stock movements found.
        </div>
      ) : (
        stockLogs.map((m, i) => {
          const isIn = m.changeType === "Inbound" || m.changeType === "Return";
          const isAdj =
            m.changeType === "Adjustment" || m.changeType === "Audit";
          const bg = isIn
            ? "var(--green-bg)"
            : isAdj
              ? "var(--yellow-bg)"
              : "var(--red-bg)";
          const ic = isIn
            ? "fa-arrow-down ic-green"
            : isAdj
              ? "fa-arrows-rotate ic-yellow"
              : "fa-arrow-up ic-red";
          const color = isIn
            ? "var(--green)"
            : isAdj
              ? "var(--yellow)"
              : "var(--red)";
          return (
            <div key={m._id} className="list-item" style={{ padding: "6px 0" }}>
              <div className="list-icon" style={{ background: bg }}>
                <i className={`fa-solid ${ic}`} style={{ fontSize: 10 }} />
              </div>
              <div className="list-content">
                <div className="list-title">{m.reason ?? m.changeType}</div>
                <div className="list-meta">
                  {new Date(m.createdAt).toLocaleDateString()} · by{" "}
                  {m.recordedBy?.username ?? "System"}
                </div>
              </div>
              <div className="list-right">
                <div style={{ fontWeight: 600, color }}>
                  {m.quantityChange > 0 ? "+" : ""}
                  {m.quantityChange}
                </div>
                <div style={{ fontSize: 10, color: "var(--text-muted)" }}>
                  After: {m.newStockLevel}
                </div>
              </div>
            </div>
          );
        })
      )}
    </>
  );

  const renderVariants = () => {
    const variants = product?.variants ?? [];

    const getVariantLabel = (variantId: string): string => {
      const parts = variantId.split("-");
      const filtered = parts.filter((p) => !/^[a-f0-9]{24}$/i.test(p));
      return filtered.length > 0 ? filtered.join("-") : variantId;
    };

    const isHexColor = (val: string): boolean =>
      /^#([0-9a-f]{3}){1,2}$/i.test(val.trim());

    const isCssColor = (val: string): boolean => {
      const cssColors = [
        "red",
        "blue",
        "green",
        "black",
        "white",
        "yellow",
        "pink",
        "grey",
        "gray",
        "brown",
        "navy",
        "purple",
        "orange",
        "violet",
        "indigo",
        "teal",
        "cyan",
        "magenta",
        "maroon",
        "olive",
        "coral",
        "salmon",
        "gold",
        "silver",
        "lime",
      ];
      return cssColors.includes(val.trim().toLowerCase());
    };

    const isColor = (val: string) => isHexColor(val) || isCssColor(val);

    const getColorValue = (val: string): string => {
      if (isHexColor(val)) return val.trim();
      if (isCssColor(val)) return val.trim().toLowerCase();
      return "";
    };

    // luminance check — dark color pe white text, light color pe dark text
    const getTextColorForBg = (hex: string): string => {
      const clean = hex.replace("#", "");
      const r = parseInt(clean.slice(0, 2), 16);
      const g = parseInt(clean.slice(2, 4), 16);
      const b = parseInt(clean.slice(4, 6), 16);
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      return luminance > 0.55 ? "#1F2937" : "#ffffff";
    };

    const getAttrPairs = (
      attributes: Record<string, string>,
    ): { key: string; val: string }[] =>
      Object.entries(attributes ?? {}).map(([k, v]) => ({ key: k, val: v }));

    const getAvatarInfo = (
      attributes: Record<string, string>,
      variantId: string,
    ): { text: string; bg: string; textColor: string } => {
      const entries = Object.entries(attributes ?? {});

      const colorEntry = entries.find(([k]) =>
        ["color", "colour"].includes(k.toLowerCase()),
      );

      if (colorEntry) {
        const rawVal = colorEntry[1].trim();

        // Hex color directly use karo
        const resolvedBg = isHexColor(rawVal)
          ? rawVal
          : isCssColor(rawVal)
            ? rawVal.toLowerCase()
            : null;

        if (resolvedBg) {
          // Text color: hex pe luminance check, CSS color name pe always white
          const textColor = isHexColor(resolvedBg)
            ? getTextColorForBg(resolvedBg)
            : "#ffffff";

          // Avatar text: size se lo, warna doosra non-color attribute
          const sizeEntry = entries.find(([k]) => k.toLowerCase() === "size");
          const otherEntry = entries.find(
            ([k]) => !["color", "colour"].includes(k.toLowerCase()),
          );
          const text = sizeEntry
            ? sizeEntry[1].slice(0, 3).toUpperCase()
            : otherEntry
              ? otherEntry[1].slice(0, 2).toUpperCase()
              : "V";

          return { text, bg: resolvedBg, textColor };
        }
      }

      // Color attribute nahi mila — orange default
      const label = getVariantLabel(variantId);
      const nonColor = entries.filter(
        ([k]) => !["color", "colour"].includes(k.toLowerCase()),
      );
      const text =
        nonColor.length > 0
          ? nonColor[0][1].slice(0, 3).toUpperCase()
          : label.slice(0, 3).toUpperCase();

      return {
        text,
        bg: "#FFF5EE",
        textColor: "#F97316",
      };
    };

    return (
      <>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <div className="stock-log-section-label" style={{ margin: 0 }}>
            Product Variants
            <span
              style={{
                marginLeft: 8,
                background: "var(--accent)",
                color: "#fff",
                borderRadius: 20,
                padding: "1px 8px",
                fontSize: 10,
                fontWeight: 700,
              }}
            >
              {variants.length}
            </span>
          </div>
        </div>

        {variants.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "28px 16px",
              color: "var(--text-muted)",
              background: "var(--bg-soft, #F9FAFB)",
              borderRadius: 10,
              border: "1.5px dashed var(--border)",
            }}
          >
            <i
              className="fa-solid fa-layer-group"
              style={{
                fontSize: 22,
                marginBottom: 8,
                display: "block",
                opacity: 0.3,
              }}
            />
            No variants yet. Add one from Variants tab.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {variants.map((v) => {
              const threshold = v.lowStockThreshold ?? 10;
              const st =
                v.stock === 0
                  ? "Out of Stock"
                  : v.stock < threshold
                    ? "Low Stock"
                    : "In Stock";

              const pairs = getAttrPairs(v.attributes);
              const cleanId = getVariantLabel(v.variantId);
              const avatar = getAvatarInfo(v.attributes, v.variantId);

              // color entry for swatch row
              const colorEntry = pairs.find(({ key }) =>
                ["color", "colour"].includes(key.toLowerCase()),
              );
              const colorVal = colorEntry
                ? getColorValue(colorEntry.val)
                : null;

              const stockPct = Math.min(
                100,
                (v.stock / Math.max(threshold * 3, 1)) * 100,
              );
              const stockBarColor =
                v.stock === 0
                  ? "#EF4444"
                  : v.stock < threshold
                    ? "#F59E0B"
                    : "#10B981";

              const stBadgeBg =
                v.stock === 0
                  ? "var(--red-bg)"
                  : v.stock < threshold
                    ? "var(--yellow-bg)"
                    : "var(--green-bg)";
              const stBadgeColor =
                v.stock === 0
                  ? "var(--red)"
                  : v.stock < threshold
                    ? "#B45309"
                    : "var(--green)";

              return (
                <div
                  key={v.variantId}
                  style={{
                    background: "#fff",
                    border: "1.5px solid var(--border)",
                    borderRadius: 12,
                    padding: "12px 14px",
                    display: "flex",
                    gap: 12,
                    alignItems: "flex-start",
                    transition: "box-shadow 0.15s",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.boxShadow =
                      "0 4px 12px rgba(0,0,0,0.08)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.boxShadow =
                      "0 1px 3px rgba(0,0,0,0.04)")
                  }
                >
                  {/* ── Avatar ── */}
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 10,
                      background: avatar.bg,
                      color: avatar.textColor,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 800,
                      fontSize: 13,
                      flexShrink: 0,
                      border: "1.5px solid rgba(0,0,0,0.08)",
                      letterSpacing: 0.5,
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    {/* subtle shine overlay */}
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background:
                          "linear-gradient(135deg, rgba(255,255,255,0.25) 0%, transparent 60%)",
                        pointerEvents: "none",
                      }}
                    />
                    {avatar.text}
                  </div>

                  {/* ── Content ── */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Top row: ID + price */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 8,
                        marginBottom: 6,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: "var(--text-primary)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                        title={v.variantId}
                      >
                        {cleanId || v.variantId}
                      </div>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 800,
                          color: "var(--accent, #F97316)",
                          flexShrink: 0,
                        }}
                      >
                        {fmt(v.price)}
                      </div>
                    </div>

                    {/* Attribute pills */}
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 5,
                        marginBottom: 10,
                      }}
                    >
                      {pairs.map(({ key, val }) => {
                        const cv = getColorValue(val);
                        const isCol = isColor(val);
                        return (
                          <span
                            key={key}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 5,
                              fontSize: 10,
                              padding: "3px 8px",
                              borderRadius: 20,
                              background: "var(--bg-soft, #F3F4F6)",
                              color: "var(--text-secondary)",
                              border: "1px solid var(--border)",
                              fontWeight: 500,
                            }}
                          >
                            <span
                              style={{
                                color: "var(--text-muted)",
                                textTransform: "capitalize",
                                fontSize: 9,
                              }}
                            >
                              {key}
                            </span>
                            {isCol && cv ? (
                              <>
                                <span
                                  style={{
                                    display: "inline-block",
                                    width: 11,
                                    height: 11,
                                    borderRadius: "50%",
                                    background: cv,
                                    border: "1.5px solid rgba(0,0,0,0.15)",
                                    flexShrink: 0,
                                  }}
                                />
                                <strong
                                  style={{ color: "var(--text-primary)" }}
                                >
                                  {val}
                                </strong>
                              </>
                            ) : (
                              <strong style={{ color: "var(--text-primary)" }}>
                                {val}
                              </strong>
                            )}
                          </span>
                        );
                      })}

                      {/* barcode chip */}
                      {v.barcode && (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            fontSize: 10,
                            padding: "3px 8px",
                            borderRadius: 20,
                            background: "var(--blue-bg, #EFF6FF)",
                            color: "var(--blue, #3B82F6)",
                            border: "1px solid var(--blue-bg, #EFF6FF)",
                          }}
                        >
                          <i
                            className="fa-solid fa-barcode"
                            style={{ fontSize: 9 }}
                          />
                          {v.barcode}
                        </span>
                      )}
                    </div>

                    {/* Stock bar + info row */}
                    <div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: 4,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 11,
                            color: "var(--text-secondary)",
                          }}
                        >
                          <span
                            style={{
                              fontWeight: 700,
                              color: "var(--text-primary)",
                            }}
                          >
                            {v.stock}
                          </span>{" "}
                          / {threshold * 3} units
                        </div>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 600,
                            padding: "2px 8px",
                            borderRadius: 20,
                            background: stBadgeBg,
                            color: stBadgeColor,
                          }}
                        >
                          {st}
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div
                        style={{
                          height: 5,
                          borderRadius: 99,
                          background: "var(--bg-soft, #F3F4F6)",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `${stockPct}%`,
                            background: stockBarColor,
                            borderRadius: 99,
                            transition: "width 0.4s ease",
                          }}
                        />
                      </div>

                      {/* Low threshold note */}
                      {v.stock < threshold && v.stock > 0 && (
                        <div
                          style={{
                            marginTop: 5,
                            fontSize: 10,
                            color: "#B45309",
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <i
                            className="fa-solid fa-triangle-exclamation"
                            style={{ fontSize: 9 }}
                          />
                          {threshold - v.stock} units below threshold (
                          {threshold})
                        </div>
                      )}

                      {v.stock === 0 && (
                        <div
                          style={{
                            marginTop: 5,
                            fontSize: 10,
                            color: "var(--red)",
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <i
                            className="fa-solid fa-circle-xmark"
                            style={{ fontSize: 9 }}
                          />
                          Out of stock — reorder needed
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <hr style={{ margin: "16px 0 12px" }} />
        <button
          className="header-btn primary"
          style={{ width: "100%", justifyContent: "center" }}
          onClick={() => {
            onClose();
            if (onSwitchToVariants) onSwitchToVariants();
          }}
        >
          <i className="fa-solid fa-layer-group" /> Manage Variants
        </button>
      </>
    );
  };

  return (
    <>
      <div
        className={`prod-backdrop ${product || mode === "new" ? "open" : ""}`}
        onClick={onClose}
      />
      <div
        className={`prod-detail-panel ${product || mode === "new" ? "open" : ""}`}
      >
        <div className="detail-header">
          <div className="detail-title">{title}</div>
          <button className="detail-close" onClick={onClose}>
            <i className="fa-solid fa-xmark" />
          </button>
        </div>
        <div className="detail-body" style={{ overflowY: "auto", padding: 0 }}>
          {isNew || isEdit ? (
            <div style={{ padding: "12px 16px" }}>{renderForm()}</div>
          ) : (
            <>
              <div className="prod-tabs">
                {(["overview", "stock", "variants"] as const).map((t) => (
                  <div
                    key={t}
                    className={`prod-tab ${panelTab === t ? "active" : ""}`}
                    onClick={() => setPanelTab(t)}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </div>
                ))}
              </div>
              <div className="prod-tab-panel active">
                {panelTab === "overview" && renderOverview()}
                {panelTab === "stock" && renderStockLog()}
                {panelTab === "variants" && renderVariants()}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

// ═══════════════════════════════════════════════════════════
// TAB: ALL PRODUCTS  (fully dynamic)
// ═══════════════════════════════════════════════════════════

type ProdFilter = "all" | "instock" | "lowstock" | "oos" | "inactive";
type SortCol = "sku" | "name" | "stock" | "cost" | "price";
type SortDir = "asc" | "desc";

const PROD_PER_PAGE = 15;

const AllProductsTab: React.FC<{ onSwitchToVariants: () => void }> = ({
  onSwitchToVariants,
}) => {
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: PROD_PER_PAGE,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ProdFilter>("all");
  const [sortCol, setSortCol] = useState<SortCol>("sku");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<ApiProduct | null>(null);
  const [panelMode, setPanelMode] = useState<PanelMode>("view");
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [suppliers, setSuppliers] = useState<ApiSupplier[]>([]);
  // stock analytics for stat cards
  const [stockAnalytics, setStockAnalytics] = useState<any>(null);

  const { isLoading, loadingProgress, startLoading } = usePageLoading();

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, any> = {
        page,
        limit: PROD_PER_PAGE,
        isActive: filter === "inactive" ? false : true,
        ...(search ? { search } : {}),
      };
      // map filter → backend params
      if (filter === "instock") params.inStock = true;
      if (filter === "oos") params.inStock = false;
      // sort
      const sortMap: Record<SortCol, string> = {
        sku: "sku",
        name: "name",
        stock: "totalStock",
        cost: "basePrice",
        price: "basePrice",
      };
      params.sort = sortMap[sortCol];
      params.order = sortDir;

      const res = await productsAPI.getAll(params);
      const data = res.data?.data;
      let items: ApiProduct[] = data?.products ?? [];

      // client-side lowstock filter (backend doesn't have a direct param)
      if (filter === "lowstock") {
        items = items.filter((p) => {
          const st = getProductStatus(p);
          return st === "Low Stock";
        });
      }

      setProducts(items);
      setPagination(
        data?.pagination ?? {
          currentPage: 1,
          totalPages: 1,
          totalItems: items.length,
          itemsPerPage: PROD_PER_PAGE,
        },
      );
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Failed to load products.");
    } finally {
      setLoading(false);
    }
  }, [page, search, filter, sortCol, sortDir]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    categoriesAPI
      .getAll({ limit: 100 })
      .then((r) => setCategories(r.data?.data?.categories ?? []))
      .catch(() => {});
    suppliersAPI
      .getAll({ limit: 100 })
      .then((r) => setSuppliers(r.data?.data?.suppliers ?? []))
      .catch(() => {});
    stockAPI
      .getAnalytics()
      .then((r) => setStockAnalytics(r.data?.data))
      .catch(() => {});
  }, []);

  const handleSort = (col: SortCol) => {
    if (sortCol === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortCol(col);
      setSortDir("asc");
    }
    setPage(1);
  };

  const openPanel = (p: ApiProduct, mode: PanelMode = "view") => {
    startLoading(() => {
      setSelected(p);
      setPanelMode(mode);
    }, 300);
  };
  const openNew = () => {
    startLoading(() => {
      setSelected(null);
      setPanelMode("new");
    }, 300);
  };
  const closePanel = () => {
    setSelected(null);
    setPanelMode("view");
  };

  const handleFilter = (f: ProdFilter) => {
    setFilter(f);
    setPage(1);
  };

  const SortIcon: React.FC<{ col: SortCol }> = ({ col }) => (
    <i
      className={`fa-solid ${sortCol === col ? (sortDir === "asc" ? "fa-sort-up" : "fa-sort-down") : "fa-sort"} sort-icon`}
    />
  );

  const kpis = stockAnalytics?.kpis;
  const { currentPage, totalPages, totalItems } = pagination;
  const start = (currentPage - 1) * PROD_PER_PAGE + 1;
  const end = Math.min(currentPage * PROD_PER_PAGE, totalItems);

  return (
    <>
      {/* Stat Cards */}
      <div className="stats-row" style={{ marginBottom: 14 }}>
        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-label">Total Variants</div>
            <div className="stat-icon" style={{ background: "#FFF5EE" }}>
              <i className="fa-solid fa-box-open ic-orange" />
            </div>
          </div>
          <div className="stat-value">{kpis ? kpis.totalVariants : "—"}</div>
          <div className="stat-trend neutral">
            <i className="fa-solid fa-cubes" /> Across all products
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
            <i className="fa-solid fa-arrow-trend-down" /> Needs restocking
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-label">Inventory Value</div>
            <div className="stat-icon" style={{ background: "var(--blue-bg)" }}>
              <i
                className="fa-solid fa-tags"
                style={{ color: "var(--blue)" }}
              />
            </div>
          </div>
          <div className="stat-value">
            {kpis
              ? `₨${parseFloat(kpis.totalInventoryValue).toLocaleString()}`
              : "—"}
          </div>
          <div className="stat-trend up">
            <i className="fa-solid fa-arrow-trend-up" /> Estimated value
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="card">
        <div className="table-toolbar">
          <div className="table-toolbar-left">
            <div className="table-search">
              <i className="fa-solid fa-magnifying-glass" />
              <input
                type="text"
                placeholder="Search SKU, name…"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            {(
              ["all", "instock", "lowstock", "oos", "inactive"] as ProdFilter[]
            ).map((f) => {
              const labels: Record<ProdFilter, string> = {
                all: "All",
                instock: "In Stock",
                lowstock: "Low Stock",
                oos: "Out of Stock",
                inactive: "Inactive",
              };
              const icons: Record<ProdFilter, string> = {
                all: "",
                instock: "fa-circle-check",
                lowstock: "fa-triangle-exclamation",
                oos: "fa-circle-xmark",
                inactive: "fa-ban",
              };
              return (
                <button
                  key={f}
                  className={`t-filter-btn ${filter === f ? "active" : ""}`}
                  onClick={() => handleFilter(f)}
                >
                  {icons[f] && <i className={`fa-solid ${icons[f]}`} />}{" "}
                  {labels[f]}
                </button>
              );
            })}
          </div>
          <div className="table-toolbar-right">
            <button className="t-filter-btn" onClick={fetchProducts}>
              <i className="fa-solid fa-rotate-right" /> Refresh
            </button>
            <button className="header-btn primary" onClick={openNew}>
              <i className="fa-solid fa-plus" /> Add Product
            </button>
          </div>
        </div>

        <div className="table-wrap">
          <table id="products-table">
            <thead>
              <tr>
                <th style={{ width: 32 }}>
                  <input type="checkbox" />
                </th>
                <th
                  className={`sortable ${sortCol === "sku" ? "sorted" : ""}`}
                  onClick={() => handleSort("sku")}
                >
                  SKU <SortIcon col="sku" />
                </th>
                <th
                  className={`sortable ${sortCol === "name" ? "sorted" : ""}`}
                  onClick={() => handleSort("name")}
                >
                  Product Name <SortIcon col="name" />
                </th>
                <th>Category</th>
                <th
                  className={`sortable ${sortCol === "stock" ? "sorted" : ""}`}
                  onClick={() => handleSort("stock")}
                >
                  Stock <SortIcon col="stock" />
                </th>
                <th
                  className={`sortable ${sortCol === "cost" ? "sorted" : ""}`}
                  onClick={() => handleSort("cost")}
                >
                  Base Price <SortIcon col="cost" />
                </th>
                <th
                  className={`sortable ${sortCol === "price" ? "sorted" : ""}`}
                  onClick={() => handleSort("price")}
                >
                  Sale Price <SortIcon col="price" />
                </th>
                <th>Margin</th>
                <th>Supplier</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonRow key={i} cols={11} />
                ))
              ) : error ? (
                <EmptyState message={error} onRetry={fetchProducts} />
              ) : products.length === 0 ? (
                <EmptyState
                  message="No products found."
                  onRetry={fetchProducts}
                />
              ) : (
                products.map((p, i) => {
                  const st = getProductStatus(p);
                  const saleP = p.variants?.[0]?.price ?? 0;
                  const mg = saleP ? margin(p.basePrice, saleP) : 0;
                  const mgColor =
                    mg >= 50
                      ? "var(--green)"
                      : mg >= 30
                        ? "var(--yellow)"
                        : "var(--red)";
                  const threshold = p.variants?.[0]?.lowStockThreshold ?? 10;
                  const fillPct = Math.min(
                    100,
                    (p.totalStock / Math.max(threshold * 3, 1)) * 100,
                  );
                  const fillCls =
                    p.totalStock === 0
                      ? "red"
                      : p.totalStock < threshold
                        ? "yellow"
                        : "green";
                  return (
                    <tr key={p._id} onClick={() => openPanel(p, "view")}>
                      <td onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" />
                      </td>
                      <td>
                        <code className="code-chip">{p.sku}</code>
                      </td>
                      <td>
                        <div className="td-flex">
                          <div className="row-avatar" style={{ fontSize: 9 }}>
                            {initials(p.name)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600 }}>{p.name}</div>
                            <div className="td-sub">
                              {(p.description ?? "").substring(0, 40)}
                              {p.description && p.description.length > 40
                                ? "…"
                                : ""}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="tag">{p.category?.name ?? "—"}</span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>
                          {p.totalStock}
                        </div>
                        <div style={{ marginTop: 4 }}>
                          <div className="prog-bar" style={{ width: 72 }}>
                            <div
                              className={`prog-fill ${fillCls}`}
                              style={{ width: `${fillPct}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td>{fmt(p.basePrice)}</td>
                      <td>
                        <strong>{saleP ? fmt(saleP) : "—"}</strong>
                      </td>
                      <td>
                        <strong style={{ color: mgColor }}>
                          {saleP ? `${mg}%` : "—"}
                        </strong>
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: 11,
                            color: "var(--text-secondary)",
                          }}
                        >
                          {p.supplier?.name ?? "—"}
                        </span>
                      </td>
                      <td>
                        <Badge label={st} />
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <ThreeDot
                          id={`pd-${i}`}
                          items={[
                            {
                              label: "View Details",
                              icon: "fa-eye",
                              onClick: () => openPanel(p, "view"),
                            },
                            {
                              label: "Edit Product",
                              icon: "fa-pen",
                              onClick: () => openPanel(p, "edit"),
                            },
                            { label: "---", icon: "", onClick: () => {} },
                            {
                              label: "Delete",
                              icon: "fa-trash",
                              danger: true,
                              onClick: async () => {
                                if (window.confirm("Deactivate product?")) {
                                  await productsAPI
                                    .delete(p._id)
                                    .catch(() => {});
                                  fetchProducts();
                                }
                              },
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

        <Pagination
          current={currentPage}
          total={totalPages}
          totalItems={totalItems}
          perPage={PROD_PER_PAGE}
          start={start}
          end={end}
          onChange={(p) => setPage(p)}
        />
      </div>

      <ProductPanel
        product={selected}
        mode={panelMode}
        categories={categories}
        suppliers={suppliers}
        onClose={closePanel}
        onModeChange={(m) => setPanelMode(m)}
        onSaved={fetchProducts}
        onSwitchToVariants={onSwitchToVariants}
      />
    </>
  );
};

// ═══════════════════════════════════════════════════════════
// TAB: VARIANTS  (dynamic)
// ═══════════════════════════════════════════════════════════

interface FlatVariant {
  vsku: string;
  parent: string;
  parentId: string;
  type: string;
  value: string;
  attributes: string;
  stock: number;
  price: number;
}

const VariantsTab: React.FC = () => {
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterProd, setFilterProd] = useState("");
  const [showPanel, setShowPanel] = useState(false);
  const [editingVariant, setEditingVariant] = useState<{
    product: ApiProduct;
    variant: ApiVariant;
  } | null>(null);

  // form refs
  const parentRef = useRef<HTMLSelectElement>(null);
  const typeRef = useRef<HTMLSelectElement>(null);
  const valueRef = useRef<HTMLInputElement>(null);
  const varSkuRef = useRef<HTMLInputElement>(null);
  const priceRef = useRef<HTMLInputElement>(null);
  const stockRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [attributes, setAttributes] = useState<
    { key: string; value: string }[]
  >([{ key: "", value: "" }]);

  const addAttribute = () =>
    setAttributes((prev) => [...prev, { key: "", value: "" }]);

  const removeAttribute = (idx: number) =>
    setAttributes((prev) => prev.filter((_, i) => i !== idx));

  const updateAttribute = (idx: number, field: "key" | "value", val: string) =>
    setAttributes((prev) =>
      prev.map((a, i) => (i === idx ? { ...a, [field]: val } : a)),
    );

  const isColorKey = (key: string) =>
    key.toLowerCase() === "color" || key.toLowerCase() === "colour";

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await productsAPI.getAll({ limit: 200 });
      setProducts(res.data?.data?.products ?? []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // flatten all variants
  const allVariants: FlatVariant[] = products.flatMap((p) =>
    (p.variants ?? []).map((v) => {
      const allAttrs = Object.entries(v.attributes)
        .map(([k, val]) => `${k}: ${val}`)
        .join(", ");
      // Mongoose Map JSON mein object banta hai, but kabhi kabhi Map instance hota hai
      const attrEntries =
        v.attributes instanceof Map
          ? Array.from(v.attributes.entries())
          : Object.entries(v.attributes ?? {});
      const firstAttrKey = attrEntries.map(([k]) => k).join(", ") || "—";
      const firstAttrVal =
        attrEntries.map(([, val]) => val).join(" / ") || v.variantId;
      const attrDisplay =
        attrEntries.length > 0
          ? attrEntries.map(([k, val]) => `${k}: ${val}`).join(" · ")
          : "—";
      return {
        vsku: v.variantId,
        parent: p.name,
        parentId: p._id,
        type: firstAttrKey,
        value: firstAttrVal,
        attributes: attrDisplay, // ← new field
        stock: v.stock,
        price: v.price,
      };
    }),
  );

  const filtered = allVariants.filter((v) => {
    if (filterProd && v.parentId !== filterProd) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        v.vsku.toLowerCase().includes(q) ||
        v.parent.toLowerCase().includes(q) ||
        v.value.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleSaveVariant = async () => {
    const parentId = parentRef.current?.value;
    if (
      !parentId ||
      attributes.filter((a) => a.key.trim() && a.value.trim()).length === 0
    ) {
      alert("Parent product aur kam az kam ek attribute required hai.");
      return;
    }
    setSaving(true);

    const attrObj = Object.fromEntries(
      attributes
        .filter((a) => a.key.trim() && a.value.trim())
        .map((a) => [a.key.trim().toLowerCase(), a.value.trim()]),
    );

    const autoId = `${parentId}-${Object.values(attrObj).join("-").toUpperCase()}`;
    const finalVariantId = varSkuRef.current?.value?.trim() || autoId;

    const payload = {
      variant: {
        variantId: finalVariantId,
        attributes: attrObj,
        price: parseFloat(priceRef.current?.value ?? "0"),
        stock: parseInt(stockRef.current?.value ?? "0", 10),
        lowStockThreshold: 10,
      },
    };

    // Debug — remove karo baad mein
    console.log("Saving variant payload:", JSON.stringify(payload, null, 2));

    try {
      if (editingVariant) {
        await productsAPI.updateVariant(
          editingVariant.product._id,
          editingVariant.variant.variantId,
          payload.variant,
        );
      } else {
        await productsAPI.addVariant(parentId, payload);
      }
      await fetchProducts();
      setShowPanel(false);
      setAttributes([{ key: "", value: "" }]);
    } catch (e: any) {
      alert(e?.response?.data?.message ?? "Failed to save variant.");
      console.error("Variant save error:", e?.response?.data);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteVariant = async (prod: ApiProduct, variantId: string) => {
    if (!window.confirm("Remove this variant?")) return;
    try {
      await productsAPI.deleteVariant(prod._id, variantId);
      fetchProducts();
    } catch (e: any) {
      alert(e?.response?.data?.message ?? "Failed to delete variant.");
    }
  };

  // size / color distribution from loaded data
  const sizeMap: Record<string, number> = {};
  const colorMap: Record<string, number> = {};
  products.forEach((p) =>
    (p.variants ?? []).forEach((v) => {
      if (v.attributes.size)
        sizeMap[v.attributes.size] =
          (sizeMap[v.attributes.size] || 0) + v.stock;
      if (v.attributes.color)
        colorMap[v.attributes.color] =
          (colorMap[v.attributes.color] || 0) + v.stock;
    }),
  );
  const sizeEntries = Object.entries(sizeMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  const colorEntries = Object.entries(colorMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  const maxSize = sizeEntries[0]?.[1] ?? 1;
  const maxColor = colorEntries[0]?.[1] ?? 1;

  const totalVariants = allVariants.length;
  const productsWithVar = products.filter(
    (p) => (p.variants?.length ?? 0) > 0,
  ).length;
  const lowStockVar = allVariants.filter((v) => v.stock < 5).length;

  return (
    <>
      <div className="info-banner">
        <i className="fa-solid fa-circle-info" />
        <div className="info-banner-text">
          Variants let you manage{" "}
          <strong>size, color, and other attributes</strong> per parent product.
          Each variant tracks its own stock independently.
        </div>
      </div>

      <div className="stats-row" style={{ marginBottom: 14 }}>
        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-label">Total Variants</div>
            <div className="stat-icon" style={{ background: "#FFF5EE" }}>
              <i className="fa-solid fa-layer-group ic-orange" />
            </div>
          </div>
          <div className="stat-value">{totalVariants}</div>
          <div className="stat-trend neutral">
            <i className="fa-solid fa-minus" /> Live count
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-label">Products with Variants</div>
            <div className="stat-icon" style={{ background: "var(--blue-bg)" }}>
              <i
                className="fa-solid fa-boxes-stacked"
                style={{ color: "var(--blue)" }}
              />
            </div>
          </div>
          <div className="stat-value">{productsWithVar}</div>
          <div className="stat-trend neutral">
            <i className="fa-solid fa-minus" /> of {products.length} total
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-label">Avg. Variants/Product</div>
            <div
              className="stat-icon"
              style={{ background: "var(--green-bg)" }}
            >
              <i className="fa-solid fa-divide ic-green" />
            </div>
          </div>
          <div className="stat-value">
            {productsWithVar > 0
              ? (totalVariants / productsWithVar).toFixed(1)
              : "0"}
          </div>
          <div className="stat-trend neutral">
            <i className="fa-solid fa-minus" /> Stable
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-label">Low Stock Variants</div>
            <div className="stat-icon" style={{ background: "var(--red-bg)" }}>
              <i className="fa-solid fa-triangle-exclamation ic-red" />
            </div>
          </div>
          <div className="stat-value">{lowStockVar}</div>
          <div className="stat-trend down">
            <i className="fa-solid fa-arrow-trend-down" /> Needs attention
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="table-toolbar">
          <div className="table-toolbar-left">
            <div className="table-search">
              <i className="fa-solid fa-magnifying-glass" />
              <input
                type="text"
                placeholder="Search variant SKU or name…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="form-select"
              style={{ height: 28, fontSize: 11 }}
              value={filterProd}
              onChange={(e) => setFilterProd(e.target.value)}
            >
              <option value="">All Products</option>
              {products.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="table-toolbar-right">
            <button
              className="header-btn primary"
              onClick={() => {
                setEditingVariant(null);
                setAttributes(
                  editingVariant
                    ? Object.entries(editingVariant.variant.attributes).map(
                        ([key, value]) => ({ key, value }),
                      )
                    : [{ key: "", value: "" }],
                );
                setShowPanel(true);
              }}
            >
              <i className="fa-solid fa-plus" /> Add Variant
            </button>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>
                  <input type="checkbox" />
                </th>
                <th>Variant SKU</th>
                <th>Parent Product</th>
                <th>Type</th>
                <th>Value</th>
                <th>Attributes</th>
                <th>Stock</th>
                <th>Sale Price</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <SkeletonRow key={i} cols={9} />
                ))
              ) : filtered.length === 0 ? (
                <EmptyState message="No variants found." />
              ) : (
                filtered.map((v, i) => {
                  const st =
                    v.stock === 0
                      ? "Out of Stock"
                      : v.stock < 5
                        ? "Low Stock"
                        : "In Stock";
                  const prodObj = products.find((p) => p._id === v.parentId);
                  const varObj = prodObj?.variants?.find(
                    (vv) => vv.variantId === v.vsku,
                  );
                  return (
                    <tr key={v.vsku}>
                      <td>
                        <input type="checkbox" />
                      </td>
                      <td>
                        <code className="code-chip">{v.vsku}</code>
                      </td>
                      <td>
                        <strong>{v.parent}</strong>
                      </td>
                      <td>
                        <span className="tag">{v.type}</span>
                      </td>
                      <td>
                        <span
                          className={`badge ${v.type === "color" ? "blue" : "gray"}`}
                        >
                          {v.value}
                        </span>
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: 11,
                            color: "var(--text-secondary)",
                          }}
                        >
                          {v.attributes !== "—" ? (
                            v.attributes
                          ) : (
                            <em style={{ color: "var(--text-muted)" }}>—</em>
                          )}
                        </span>
                      </td>
                      <td>{v.stock}</td>
                      <td>{fmt(v.price)}</td>
                      <td>
                        <Badge label={st} />
                      </td>
                      <td>
                        <ThreeDot
                          id={`var-${i}`}
                          items={[
                            {
                              label: "Edit Variant",
                              icon: "fa-pen",
                              onClick: () => {
                                if (prodObj && varObj) {
                                  setEditingVariant({
                                    product: prodObj,
                                    variant: varObj,
                                  });
                                  setShowPanel(true);
                                }
                              },
                            },
                            // {
                            //   label: "Add Stock",
                            //   icon: "fa-plus",
                            //   onClick: () => {},
                            // },
                            { label: "---", icon: "", onClick: () => {} },
                            {
                              label: "Delete",
                              icon: "fa-trash",
                              danger: true,
                              onClick: async () => {
                                if (prodObj && varObj)
                                  await handleDeleteVariant(
                                    prodObj,
                                    varObj.variantId,
                                  );
                              },
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
        <div className="pagination">
          <div className="pagination-info">
            Showing <strong>{filtered.length}</strong> of{" "}
            <strong>{totalVariants}</strong> variants
          </div>
        </div>
      </div>

      {/* Distribution Charts */}
      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <i className="fa-solid fa-ruler-combined" /> Size Distribution
            </div>
          </div>
          <div className="card-body" style={{ padding: "10px 16px" }}>
            {sizeEntries.length === 0 ? (
              <div style={{ color: "var(--text-muted)", fontSize: 12 }}>
                No size data available.
              </div>
            ) : (
              sizeEntries.map(([s, count]) => (
                <div key={s} className="dist-row">
                  <div className="dist-label dist-label-narrow">{s}</div>
                  <div className="prog-bar" style={{ flex: 1, height: 8 }}>
                    <div
                      className="prog-fill"
                      style={{
                        width: `${(count / maxSize) * 100}%`,
                        background: "var(--accent)",
                      }}
                    />
                  </div>
                  <div className="dist-count">{count}</div>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <i className="fa-solid fa-palette" /> Color Distribution
            </div>
          </div>
          <div className="card-body" style={{ padding: "10px 16px" }}>
            {colorEntries.length === 0 ? (
              <div style={{ color: "var(--text-muted)", fontSize: 12 }}>
                No color data available.
              </div>
            ) : (
              colorEntries.map(([c, count]) => (
                <div key={c} className="dist-row">
                  <div
                    className="color-dot"
                    style={{
                      background:
                        c.toLowerCase() === "black"
                          ? "#1F2937"
                          : c.toLowerCase() === "white"
                            ? "#E5E7EB"
                            : c.toLowerCase(),
                    }}
                  />
                  <div className="dist-label dist-label-wide">{c}</div>
                  <div className="prog-bar" style={{ flex: 1, height: 8 }}>
                    <div
                      className="prog-fill"
                      style={{
                        width: `${(count / maxColor) * 100}%`,
                        background: "var(--accent)",
                      }}
                    />
                  </div>
                  <div className="dist-count">{count}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Backdrop + Panel */}
      <div
        className={`prod-backdrop ${showPanel ? "open" : ""}`}
        onClick={() => setShowPanel(false)}
      />
      <div className={`prod-detail-panel ${showPanel ? "open" : ""}`}>
        <div className="detail-header">
          <div className="detail-title">
            {editingVariant ? "Edit Variant" : "Add New Variant"}
          </div>
          <button className="detail-close" onClick={() => setShowPanel(false)}>
            <i className="fa-solid fa-xmark" />
          </button>
        </div>
        <div className="detail-body" style={{ overflowY: "auto" }}>
          <div style={{ padding: "12px 16px" }}>
            <div className="form-group" style={{ marginBottom: 10 }}>
              <div className="form-label">Parent Product *</div>
              <select
                ref={parentRef}
                className="form-select"
                style={{ width: "100%" }}
                defaultValue={editingVariant?.product._id ?? ""}
              >
                <option value="">— Select Product —</option>
                {products.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 10 }}>
              <div className="form-label">
                Attributes *
                <span
                  style={{
                    fontSize: 10,
                    color: "var(--text-muted)",
                    marginLeft: 6,
                  }}
                >
                  (e.g. size: M, color: Red, storage: 128GB)
                </span>
              </div>

              {attributes.map((attr, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    gap: 6,
                    marginBottom: 6,
                    alignItems: "center",
                  }}
                >
                  <input
                    className="form-input"
                    placeholder="Attribute (e.g. size)"
                    value={attr.key}
                    onChange={(e) =>
                      updateAttribute(idx, "key", e.target.value)
                    }
                    style={{ flex: 1 }}
                    list="attr-key-suggestions"
                  />

                  {/* ✅ Color key detect karo */}
                  {isColorKey(attr.key) ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        flex: 1,
                      }}
                    >
                      <input
                        type="color"
                        value={
                          attr.value.startsWith("#") ? attr.value : "#000000"
                        }
                        onChange={(e) =>
                          updateAttribute(idx, "value", e.target.value)
                        }
                        style={{
                          width: 36,
                          height: 32,
                          padding: 2,
                          border: "1px solid var(--border)",
                          borderRadius: 6,
                          cursor: "pointer",
                          background: "none",
                          flexShrink: 0,
                        }}
                      />
                      <input
                        className="form-input"
                        placeholder="e.g. Red or #FF0000"
                        value={attr.value}
                        onChange={(e) =>
                          updateAttribute(idx, "value", e.target.value)
                        }
                        style={{ flex: 1 }}
                      />
                    </div>
                  ) : (
                    <input
                      className="form-input"
                      placeholder="Value (e.g. M)"
                      value={attr.value}
                      onChange={(e) =>
                        updateAttribute(idx, "value", e.target.value)
                      }
                      style={{ flex: 1 }}
                      list={`attr-val-${attr.key}`}
                    />
                  )}

                  {attributes.length > 1 && (
                    <button
                      className="header-btn"
                      style={{
                        height: 28,
                        width: 28,
                        padding: 0,
                        color: "var(--red)",
                      }}
                      onClick={() => removeAttribute(idx)}
                    >
                      <i className="fa-solid fa-xmark" />
                    </button>
                  )}
                </div>
              ))}

              <button
                className="header-btn"
                style={{ fontSize: 11, marginTop: 4 }}
                onClick={addAttribute}
              >
                <i className="fa-solid fa-plus" /> Add Attribute
              </button>

              {/* Datalist suggestions */}
              <datalist id="attr-key-suggestions">
                {[
                  "size",
                  "color",
                  "material",
                  "weight",
                  "flavor",
                  "storage",
                  "ram",
                  "voltage",
                  "fit",
                  "sleeve",
                  "pattern",
                  "finish",
                  "capacity",
                  "length",
                  "frame_size",
                  "gear_count",
                  "dosage",
                  "form",
                  "pack_size",
                  "wattage",
                ].map((k) => (
                  <option key={k} value={k} />
                ))}
              </datalist>

              {/* Value suggestions per key */}
              <datalist id="attr-val-size">
                {[
                  "XS",
                  "S",
                  "M",
                  "L",
                  "XL",
                  "XXL",
                  "XXXL",
                  "28",
                  "30",
                  "32",
                  "34",
                  "36",
                  "38",
                  "40",
                ].map((v) => (
                  <option key={v} value={v} />
                ))}
              </datalist>
              <datalist id="attr-val-color">
                {[
                  "Red",
                  "Blue",
                  "Green",
                  "Black",
                  "White",
                  "Yellow",
                  "Pink",
                  "Grey",
                  "Brown",
                  "Navy",
                ].map((v) => (
                  <option key={v} value={v} />
                ))}
              </datalist>
              <datalist id="attr-val-material">
                {[
                  "Cotton",
                  "Polyester",
                  "Wool",
                  "Silk",
                  "Leather",
                  "Denim",
                  "Linen",
                ].map((v) => (
                  <option key={v} value={v} />
                ))}
              </datalist>
              <datalist id="attr-val-storage">
                {["32GB", "64GB", "128GB", "256GB", "512GB", "1TB"].map((v) => (
                  <option key={v} value={v} />
                ))}
              </datalist>
              <datalist id="attr-val-ram">
                {["2GB", "4GB", "6GB", "8GB", "12GB", "16GB"].map((v) => (
                  <option key={v} value={v} />
                ))}
              </datalist>
              <datalist id="attr-val-fit">
                {["Slim Fit", "Regular Fit", "Loose Fit", "Oversized"].map(
                  (v) => (
                    <option key={v} value={v} />
                  ),
                )}
              </datalist>
            </div>
            <div className="form-row">
              <div className="form-group">
                <div className="form-label">Variant SKU</div>
                <input
                  ref={varSkuRef}
                  className="form-input"
                  defaultValue={editingVariant?.variant.variantId ?? ""}
                  placeholder="Auto-generated"
                />
              </div>
              <div className="form-group">
                <div className="form-label">Sale Price (₨)</div>
                <input
                  ref={priceRef}
                  className="form-input"
                  type="number"
                  defaultValue={editingVariant?.variant.price ?? ""}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <div className="form-label">
                  {editingVariant ? "Update Stock" : "Initial Stock"}
                </div>
                <input
                  ref={stockRef}
                  className="form-input"
                  type="number"
                  defaultValue={editingVariant?.variant.stock ?? 0}
                />
              </div>
            </div>
            <hr />
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="header-btn primary"
                style={{ flex: 1, justifyContent: "center" }}
                onClick={handleSaveVariant}
                disabled={saving}
              >
                <i
                  className={`fa-solid ${saving ? "fa-spinner fa-spin" : editingVariant ? "fa-check" : "fa-plus"}`}
                />{" "}
                {saving
                  ? "Saving…"
                  : editingVariant
                    ? "Save Changes"
                    : "Add Variant"}
              </button>
              <button
                className="header-btn"
                onClick={() => {
                  setShowPanel(false);
                  setAttributes(
                    editingVariant
                      ? Object.entries(editingVariant.variant.attributes).map(
                          ([key, value]) => ({ key, value }),
                        )
                      : [{ key: "", value: "" }],
                  );
                }}
              >
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
// TAB: CATEGORIES  (dynamic)
// ═══════════════════════════════════════════════════════════

const CategoriesTab: React.FC = () => {
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [showPanel, setShowPanel] = useState(false);
  const [editingCat, setEditingCat] = useState<ApiCategory | null>(null);
  const [catName, setCatName] = useState("");
  const [catDesc, setCatDesc] = useState("");
  const [catParent, setCatParent] = useState("");
  const [catStatus, setCatStatus] = useState("Active");
  const [saving, setSaving] = useState(false);
  const [formLabel, setFormLabel] = useState("New Category");

  // ── Role check (only Administrator can create/edit/delete categories) ──
  const [userRole, setUserRole] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const isAdmin = userRole === "Administrator";

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

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await categoriesAPI.getAll({
        limit: 100,
        ...(search ? { search } : {}),
      });
      setCategories(res.data?.data?.categories ?? []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const openNew = () => {
    setEditingCat(null);
    setCatName("");
    setCatDesc("");
    setCatParent("");
    setCatStatus("Active");
    setFormLabel("New Category");
    setShowPanel(true);
  };
  const openEdit = (c: ApiCategory) => {
    setEditingCat(c);
    setCatName(c.name);
    setCatDesc(c.description ?? "");
    setCatParent(c.parentCategory ?? "");
    setFormLabel(`Edit: ${c.name}`);
    setShowPanel(true);
  };

  const handleSave = async () => {
    if (!catName.trim()) return;
    if (!isAdmin) {
      showToast(
        "You don't have permission to manage categories. Please contact an Administrator.",
      );
      return;
    }
    setSaving(true);
    const payload = {
      name: catName,
      description: catDesc,
      parentCategory: catParent || null,
    };
    try {
      if (editingCat) {
        await categoriesAPI.update(editingCat._id, payload);
      } else {
        await categoriesAPI.create(payload);
      }
      fetchCategories();
      setShowPanel(false);
    } catch {
      /* ignore */
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!isAdmin) {
      showToast(
        "You don't have permission to delete categories. Please contact an Administrator.",
      );
      return;
    }
    if (
      !window.confirm(
        "Delete this category? All products must be reassigned first.",
      )
    )
      return;
    await categoriesAPI.delete(id).catch(() => {});
    fetchCategories();
  };

  const totalProducts =
    categories.reduce((a, c) => a + (c.productCount ?? 0), 0) || 1;

  return (
    <div className="grid-2">
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
      <div>
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <i className="fa-solid fa-tags" /> All Categories
            </div>
            <div className="card-actions">
              <button className="header-btn primary" onClick={openNew}>
                <i className="fa-solid fa-plus" /> Add Category
              </button>
            </div>
          </div>
          <div
            className="table-toolbar"
            style={{ borderBottom: "none", paddingBottom: 0 }}
          >
            <div className="table-toolbar-left">
              <div className="table-search">
                <i className="fa-solid fa-magnifying-glass" />
                <input
                  type="text"
                  placeholder="Search categories…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Products</th>
                  <th>Has Children</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <SkeletonRow key={i} cols={4} />
                  ))
                ) : categories.length === 0 ? (
                  <EmptyState
                    message="No categories found."
                    onRetry={fetchCategories}
                  />
                ) : (
                  categories.map((c, i) => (
                    <tr key={c._id}>
                      <td>
                        <div className="td-flex">
                          <strong>{c.name}</strong>
                        </div>
                      </td>
                      <td>{c.productCount ?? 0}</td>
                      <td>
                        <Badge label={c.hasChildren ? "Yes" : "No"} />
                      </td>
                      <td>
                        <ThreeDot
                          id={`cat-${i}`}
                          items={[
                            {
                              label: "Edit",
                              icon: "fa-pen",
                              onClick: () => openEdit(c),
                            },
                            { label: "---", icon: "", onClick: () => {} },
                            {
                              label: "Delete",
                              icon: "fa-trash",
                              danger: true,
                              onClick: () => handleDelete(c._id),
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
        </div>
      </div>

      <div>
        <div className="card" style={{ marginBottom: 14 }}>
          <div className="card-header">
            <div className="card-title">
              <i className="fa-solid fa-plus-circle" /> {formLabel}
            </div>
          </div>
          <div className="card-body">
            <div className="form-group" style={{ marginBottom: 10 }}>
              <div className="form-label">Category Name *</div>
              <input
                className="form-input"
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                placeholder="e.g. Suits"
                style={{ width: "100%" }}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 10 }}>
              <div className="form-label">Parent Category (optional)</div>
              <select
                className="form-select"
                style={{ width: "100%" }}
                value={catParent}
                onChange={(e) => setCatParent(e.target.value)}
              >
                <option value="">— None (top-level) —</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 10 }}>
              <div className="form-label">Description</div>
              <input
                className="form-input"
                placeholder="Short description…"
                style={{ width: "100%" }}
                value={catDesc}
                onChange={(e) => setCatDesc(e.target.value)}
              />
            </div>
            <hr />
            <button
              className="header-btn primary"
              onClick={handleSave}
              disabled={saving}
            >
              <i
                className={`fa-solid ${saving ? "fa-spinner fa-spin" : "fa-check"}`}
              />{" "}
              {saving ? "Saving…" : "Save Category"}
            </button>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <i className="fa-solid fa-chart-pie" /> Category Breakdown
            </div>
          </div>
          <div className="card-body" style={{ padding: "10px 16px" }}>
            {categories
              .filter((c) => (c.productCount ?? 0) > 0)
              .map((c) => (
                <div key={c._id} className="cat-breakdown-row">
                  <div className="cat-breakdown-name">{c.name}</div>
                  <div className="prog-bar" style={{ flex: 1, height: 8 }}>
                    <div
                      className="prog-fill"
                      style={{
                        width: `${((c.productCount ?? 0) / totalProducts) * 100}%`,
                        background: "var(--accent)",
                      }}
                    />
                  </div>
                  <div className="cat-breakdown-count">{c.productCount}</div>
                </div>
              ))}
            {categories.filter((c) => (c.productCount ?? 0) > 0).length ===
              0 && (
              <div style={{ color: "var(--text-muted)", fontSize: 12 }}>
                No product data available.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Panel */}
      <div
        className={`prod-backdrop ${showPanel ? "open" : ""}`}
        onClick={() => setShowPanel(false)}
      />
      <div className={`prod-detail-panel ${showPanel ? "open" : ""}`}>
        <div className="detail-header">
          <div className="detail-title">{formLabel}</div>
          <button className="detail-close" onClick={() => setShowPanel(false)}>
            <i className="fa-solid fa-xmark" />
          </button>
        </div>
        <div className="detail-body" style={{ overflowY: "auto" }}>
          <div style={{ padding: "12px 16px" }}>
            <div className="form-group" style={{ marginBottom: 10 }}>
              <div className="form-label">Category Name *</div>
              <input
                className="form-input"
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                placeholder="e.g. Suits"
                style={{ width: "100%" }}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 10 }}>
              <div className="form-label">Parent Category (optional)</div>
              <select
                className="form-select"
                style={{ width: "100%" }}
                value={catParent}
                onChange={(e) => setCatParent(e.target.value)}
              >
                <option value="">— None (top-level) —</option>
                {categories
                  .filter((c) => c._id !== editingCat?._id)
                  .map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 10 }}>
              <div className="form-label">Description</div>
              <input
                className="form-input"
                value={catDesc}
                onChange={(e) => setCatDesc(e.target.value)}
                placeholder="Short description…"
                style={{ width: "100%" }}
              />
            </div>
            <hr />
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="header-btn primary"
                style={{ flex: 1, justifyContent: "center" }}
                onClick={handleSave}
                disabled={saving}
              >
                <i
                  className={`fa-solid ${saving ? "fa-spinner fa-spin" : "fa-check"}`}
                />{" "}
                {saving ? "Saving…" : "Save Category"}
              </button>
              <button
                className="header-btn"
                onClick={() => setShowPanel(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// TAB: SUPPLIERS  (dynamic)
// ═══════════════════════════════════════════════════════════

const SuppliersTab: React.FC = () => {
  const [suppliers, setSuppliers] = useState<ApiSupplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showPanel, setShowPanel] = useState(false);
  const [editing, setEditing] = useState<ApiSupplier | null>(null);
  const [saving, setSaving] = useState(false);
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20,
  });

  // form state
  const [form, setForm] = useState({
    name: "",
    contact: "",
    phone: "",
    email: "",
    street: "",
    city: "",
    country: "Pakistan",
    balance: 0,
    lead: 3,
    paymentTerms: "Net 30",
  });

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await suppliersAPI.getAll({
        limit: 50,
        ...(search ? { search } : {}),
      });
      const data = res.data?.data;
      let items: ApiSupplier[] = data?.suppliers ?? [];
      // client-side balance filter
      if (statusFilter === "outstanding")
        items = items.filter((s) => (s.balance ?? 0) > 0);
      if (statusFilter === "cleared")
        items = items.filter((s) => (s.balance ?? 0) === 0);
      setSuppliers(items);
      setPagination(
        data?.pagination ?? {
          currentPage: 1,
          totalPages: 1,
          totalItems: items.length,
          itemsPerPage: 50,
        },
      );
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const openNew = () => {
    setEditing(null);
    setForm({
      name: "",
      contact: "",
      phone: "",
      email: "",
      street: "",
      city: "",
      country: "Pakistan",
      balance: 0,
      lead: 3,
      paymentTerms: "Net 30",
    });
    setShowPanel(true);
  };
  const openEdit = (s: ApiSupplier) => {
    setEditing(s);
    setForm({
      name: s.name,
      contact: s.contactPerson ?? "",
      phone: s.phone ?? "",
      email: (s as any).email ?? "",
      street: (s as any).address?.street ?? "",
      city: s.address?.city ?? "",
      country: s.address?.country ?? "Pakistan",
      balance: s.balance ?? 0,
      lead: 3,
      paymentTerms: s.paymentTerms ?? "Net 30",
    });
    setShowPanel(true);
  };

  const handleSave = async () => {
    if (!form.name) return;
    setSaving(true);
    const payload = {
      name: form.name,
      contactPerson: form.contact,
      phone: form.phone,
      email: form.email,
      address: {
        street: form.street,
        city: form.city,
        country: form.country,
      },
      balance: form.balance,
      paymentTerms: form.paymentTerms,
    };
    try {
      if (editing) await suppliersAPI.update(editing._id, payload);
      else await suppliersAPI.create(payload);
      fetchSuppliers();
      setShowPanel(false);
    } catch {
      /* ignore */
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this supplier?")) return;
    await suppliersAPI.delete(id).catch(() => {});
    fetchSuppliers();
  };

  const outColor = (amt: number) =>
    amt > 50000 ? "var(--red)" : amt > 0 ? "var(--yellow)" : "var(--green)";

  const totalOutstanding = suppliers.reduce((a, s) => a + (s.balance ?? 0), 0);
  const topSupplier = [...suppliers].sort(
    (a, b) => (b.productCount ?? 0) - (a.productCount ?? 0),
  )[0];
  const highestBalance = [...suppliers].sort(
    (a, b) => (b.balance ?? 0) - (a.balance ?? 0),
  )[0];

  return (
    <>
      <div className="stats-row" style={{ marginBottom: 14 }}>
        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-label">Total Suppliers</div>
            <div className="stat-icon" style={{ background: "#FFF5EE" }}>
              <i className="fa-solid fa-truck-ramp-box ic-orange" />
            </div>
          </div>
          <div className="stat-value">{pagination.totalItems}</div>
          <div className="stat-trend up">
            <i className="fa-solid fa-arrow-trend-up" /> Active
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-label">Total Outstanding</div>
            <div className="stat-icon" style={{ background: "var(--red-bg)" }}>
              <i className="fa-solid fa-file-invoice-dollar ic-red" />
            </div>
          </div>
          <div className="stat-value">{fmt(totalOutstanding)}</div>
          <div className="stat-trend down">
            <i className="fa-solid fa-arrow-trend-down" /> Due
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-label">With Balance</div>
            <div
              className="stat-icon"
              style={{ background: "var(--yellow-bg)" }}
            >
              <i className="fa-solid fa-clock ic-yellow" />
            </div>
          </div>
          <div className="stat-value">
            {suppliers.filter((s) => (s.balance ?? 0) > 0).length}
          </div>
          <div className="stat-trend neutral">
            <i className="fa-solid fa-minus" /> of {suppliers.length}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-top">
            <div className="stat-label">Cleared Balance</div>
            <div
              className="stat-icon"
              style={{ background: "var(--green-bg)" }}
            >
              <i className="fa-solid fa-circle-check ic-green" />
            </div>
          </div>
          <div className="stat-value">
            {suppliers.filter((s) => (s.balance ?? 0) === 0).length}
          </div>
          <div className="stat-trend up">
            <i className="fa-solid fa-arrow-trend-up" /> Settled
          </div>
        </div>
      </div>

      <div className="card">
        <div className="table-toolbar">
          <div className="table-toolbar-left">
            <div className="table-search">
              <i className="fa-solid fa-magnifying-glass" />
              <input
                type="text"
                placeholder="Search supplier name…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button
              className={`t-filter-btn ${!statusFilter ? "active" : ""}`}
              onClick={() => setStatusFilter("")}
            >
              All
            </button>
            <button
              className={`t-filter-btn ${statusFilter === "outstanding" ? "active" : ""}`}
              onClick={() => setStatusFilter("outstanding")}
            >
              <i className="fa-solid fa-triangle-exclamation" /> Outstanding
            </button>
            <button
              className={`t-filter-btn ${statusFilter === "cleared" ? "active" : ""}`}
              onClick={() => setStatusFilter("cleared")}
            >
              <i className="fa-solid fa-circle-check" /> Cleared
            </button>
          </div>
          <div className="table-toolbar-right">
            <button className="header-btn primary" onClick={openNew}>
              <i className="fa-solid fa-plus" /> Add Supplier
            </button>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>
                  <input type="checkbox" />
                </th>
                <th>Supplier</th>
                <th>Contact Person</th>
                <th>Phone</th>
                <th>City</th>
                <th>Products</th>
                <th>Outstanding</th>
                <th>Payment Terms</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <SkeletonRow key={i} cols={9} />
                ))
              ) : suppliers.length === 0 ? (
                <EmptyState
                  message="No suppliers found."
                  onRetry={fetchSuppliers}
                />
              ) : (
                suppliers.map((s, i) => (
                  <tr key={s._id}>
                    <td>
                      <input type="checkbox" />
                    </td>
                    <td>
                      <div className="td-flex">
                        <div className="row-avatar">{initials(s.name)}</div>
                        <strong>{s.name}</strong>
                      </div>
                    </td>
                    <td>{s.contactPerson ?? "—"}</td>
                    <td>{s.phone ?? "—"}</td>
                    <td>
                      <span className="tag">
                        <i
                          className="fa-solid fa-location-dot"
                          style={{ fontSize: 9 }}
                        />{" "}
                        {s.address?.city ?? "—"}
                      </span>
                    </td>
                    <td>{s.productCount ?? 0}</td>
                    <td>
                      <strong style={{ color: outColor(s.balance ?? 0) }}>
                        {s.balance ? fmt(s.balance) : "₨0"}
                      </strong>
                    </td>
                    <td>{s.paymentTerms ?? "—"}</td>
                    <td>
                      <ThreeDot
                        id={`sup-${i}`}
                        items={[
                          {
                            label: "Edit",
                            icon: "fa-pen",
                            onClick: () => openEdit(s),
                          },
                          { label: "---", icon: "", onClick: () => {} },
                          {
                            label: "Delete",
                            icon: "fa-trash",
                            danger: true,
                            onClick: () => handleDelete(s._id),
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
        <div className="pagination">
          <div className="pagination-info">
            Showing <strong>{suppliers.length}</strong> of{" "}
            <strong>{pagination.totalItems}</strong> suppliers
          </div>
        </div>
      </div>

      {/* Quick cards */}
      {(topSupplier || highestBalance) && (
        <div className="sup-quick-cards">
          {topSupplier && (
            <div className="card">
              <div className="card-header">
                <div className="card-title">
                  <i className="fa-solid fa-star ic-yellow" /> Top Supplier
                </div>
              </div>
              <div className="card-body">
                <div style={{ fontSize: 15, fontWeight: 800 }}>
                  {topSupplier.name}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--text-muted)",
                    margin: "4px 0",
                  }}
                >
                  {topSupplier.productCount ?? 0} products
                </div>
              </div>
            </div>
          )}
          {highestBalance && (highestBalance.balance ?? 0) > 0 && (
            <div className="card">
              <div className="card-header">
                <div className="card-title">
                  <i className="fa-solid fa-triangle-exclamation ic-red" />{" "}
                  Highest Outstanding
                </div>
              </div>
              <div className="card-body">
                <div
                  style={{ fontSize: 15, fontWeight: 800, color: "var(--red)" }}
                >
                  {fmt(highestBalance.balance ?? 0)}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--text-muted)",
                    margin: "4px 0",
                  }}
                >
                  {highestBalance.name}
                </div>
                <button
                  className="header-btn"
                  style={{ marginTop: 6 }}
                  onClick={() => openEdit(highestBalance)}
                >
                  <i className="fa-solid fa-money-bill" /> Record Payment
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Backdrop + Panel */}
      <div
        className={`prod-backdrop ${showPanel ? "open" : ""}`}
        onClick={() => setShowPanel(false)}
      />
      <div className={`prod-detail-panel ${showPanel ? "open" : ""}`}>
        <div className="detail-header">
          <div className="detail-title">
            {editing ? "Edit Supplier" : "Add New Supplier"}
          </div>
          <button className="detail-close" onClick={() => setShowPanel(false)}>
            <i className="fa-solid fa-xmark" />
          </button>
        </div>
        <div className="detail-body" style={{ overflowY: "auto" }}>
          <div style={{ padding: "12px 16px" }}>
            {(["name", "contact", "phone", "email"] as const).map((field) => (
              <div
                key={field}
                className="form-group"
                style={{ marginBottom: 10 }}
              >
                <div className="form-label">
                  {field === "contact"
                    ? "Contact Person"
                    : field.charAt(0).toUpperCase() + field.slice(1)}
                  {field === "name" || field === "email" ? " *" : ""}
                </div>
                <input
                  className="form-input"
                  style={{ width: "100%" }}
                  type={field === "email" ? "email" : "text"}
                  value={(form as any)[field]}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, [field]: e.target.value }))
                  }
                  placeholder={
                    field === "name"
                      ? "e.g. Al-Karam Textile"
                      : field === "email"
                        ? "supplier@example.com"
                        : ""
                  }
                />
              </div>
            ))}

            <div className="form-group" style={{ marginBottom: 10 }}>
              <div className="form-label">Street Address *</div>
              <input
                className="form-input"
                style={{ width: "100%" }}
                value={form.street}
                onChange={(e) =>
                  setForm((f) => ({ ...f, street: e.target.value }))
                }
                placeholder="e.g. 123 Main Street"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <div className="form-label">City</div>
                <input
                  className="form-input"
                  value={form.city}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, city: e.target.value }))
                  }
                />
              </div>
              <div className="form-group">
                <div className="form-label">Country *</div>
                <input
                  className="form-input"
                  value={form.country}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, country: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <div className="form-label">Outstanding Balance (₨)</div>
                <input
                  className="form-input"
                  type="number"
                  value={form.balance}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      balance: parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>
              <div className="form-group">
                <div className="form-label">Payment Terms</div>
                <select
                  className="form-select"
                  value={form.paymentTerms}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, paymentTerms: e.target.value }))
                  }
                >
                  {[
                    "Net 7",
                    "Net 15",
                    "Net 30",
                    "Net 60",
                    "Cash on Delivery",
                  ].map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
            <hr />
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="header-btn primary"
                style={{ flex: 1, justifyContent: "center" }}
                onClick={handleSave}
                disabled={saving}
              >
                <i
                  className={`fa-solid ${saving ? "fa-spinner fa-spin" : editing ? "fa-check" : "fa-plus"}`}
                />{" "}
                {saving ? "Saving…" : editing ? "Save Changes" : "Add Supplier"}
              </button>
              <button
                className="header-btn"
                onClick={() => setShowPanel(false)}
              >
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
// TAB: BULK IMPORT  (UI only — CSV upload handled by backend)
// ═══════════════════════════════════════════════════════════

const BulkImportTab: React.FC = () => {
  const [hovering, setHovering] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const csvCols = [
    {
      col: "name",
      req: true,
      example: "Classic Lawn Suit",
      note: "Full product name",
    },
    {
      col: "sku",
      req: false,
      example: "SKU-0041",
      note: "Unique identifier (auto-generated if blank)",
    },
    {
      col: "category",
      req: false,
      example: "Suits",
      note: "Must match existing category name",
    },
    {
      col: "basePrice",
      req: true,
      example: "800",
      note: "Numeric, PKR (cost/wholesale price)",
    },
    {
      col: "variantPrice",
      req: true,
      example: "1800",
      note: "Sale price for default variant",
    },
    {
      col: "stock",
      req: false,
      example: "50",
      note: "Initial stock quantity (default 0)",
    },
    {
      col: "supplier",
      req: false,
      example: "Al-Karam Textile",
      note: "Must match existing supplier name",
    },
    {
      col: "description",
      req: false,
      example: "Premium lawn suit",
      note: "Product description",
    },
  ];

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (dropped?.name.endsWith(".csv")) setFile(dropped);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };

  // NOTE: Backend does not yet have a dedicated /api/products/import endpoint.
  // When added, replace the placeholder below with the actual API call.
  const handleImport = async () => {
    if (!file) return;
    setUploading(true);
    setMessage("");
    try {
      // TODO: productsAPI.import(formData) — endpoint not yet implemented on backend.
      // For now we show a notice.
      await new Promise((r) => setTimeout(r, 800));
      setMessage(
        "⚠️  Bulk import endpoint (/api/products/import) is not yet implemented on the backend. Please add it to enable this feature.",
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="grid-2">
      <div>
        <div className="card" style={{ marginBottom: 14 }}>
          <div className="card-header">
            <div className="card-title">
              <i className="fa-solid fa-file-import" /> Bulk Product Import
            </div>
          </div>
          <div className="card-body">
            <div className="info-banner" style={{ marginBottom: 14 }}>
              <i className="fa-solid fa-circle-info" />
              <div className="info-banner-text">
                Download the <strong>CSV template</strong>, fill product data,
                then upload. Max <strong>500 rows</strong> per import.
              </div>
            </div>

            <div
              className="prod-drop-zone"
              style={
                hovering
                  ? { borderColor: "var(--accent)", background: "#FFF5EE" }
                  : {}
              }
              onMouseEnter={() => setHovering(true)}
              onMouseLeave={() => setHovering(false)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
            >
              <i className="fa-solid fa-cloud-arrow-up" />
              <div className="prod-drop-zone-title">
                {file ? (
                  file.name
                ) : (
                  <>
                    Drop CSV file here or{" "}
                    <label
                      style={{ color: "var(--accent)", cursor: "pointer" }}
                    >
                      browse
                      <input
                        type="file"
                        accept=".csv"
                        style={{ display: "none" }}
                        onChange={handleFileChange}
                      />
                    </label>
                  </>
                )}
              </div>
              <div className="prod-drop-zone-sub">
                Accepts .csv only · Max 5MB · Up to 500 products
              </div>
            </div>

            {message && (
              <div
                style={{
                  marginTop: 10,
                  fontSize: 12,
                  color: "var(--yellow)",
                  background: "var(--yellow-bg)",
                  padding: "8px 12px",
                  borderRadius: 6,
                }}
              >
                {message}
              </div>
            )}

            <hr />
            <button
              className="header-btn primary"
              style={{ width: "100%", justifyContent: "center" }}
              onClick={handleImport}
              disabled={!file || uploading}
            >
              <i
                className={`fa-solid ${uploading ? "fa-spinner fa-spin" : "fa-upload"}`}
              />{" "}
              {uploading ? "Importing…" : "Start Import"}
            </button>
          </div>
        </div>

        <div className="card csv-ref-table">
          <div className="card-header">
            <div className="card-title">
              <i className="fa-solid fa-table" /> CSV Column Reference
            </div>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Column</th>
                    <th>Required</th>
                    <th>Example</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {csvCols.map((c) => (
                    <tr key={c.col}>
                      <td>
                        <code>{c.col}</code>
                      </td>
                      <td>
                        <span className={`badge ${c.req ? "red" : "yellow"}`}>
                          {c.req ? "Required" : "Optional"}
                        </span>
                      </td>
                      <td>{c.example}</td>
                      <td>{c.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <i className="fa-solid fa-circle-exclamation ic-yellow" /> Backend
              Status
            </div>
          </div>
          <div className="card-body">
            <div className="info-banner">
              <i className="fa-solid fa-triangle-exclamation ic-yellow" />
              <div className="info-banner-text">
                The <strong>bulk import endpoint</strong> (
                <code>/api/products/import</code>) does{" "}
                <strong>not yet exist</strong> on the backend. All other product
                endpoints are implemented. To enable bulk import, add this route
                to the server.
              </div>
            </div>
            <div style={{ marginTop: 14 }}>
              <div className="detail-row">
                <div className="detail-key">GET /api/products</div>
                <div className="detail-val">
                  <Badge label="Active" />
                </div>
              </div>
              <div className="detail-row">
                <div className="detail-key">POST /api/products</div>
                <div className="detail-val">
                  <Badge label="Active" />
                </div>
              </div>
              <div className="detail-row">
                <div className="detail-key">PUT /api/products/:id</div>
                <div className="detail-val">
                  <Badge label="Active" />
                </div>
              </div>
              <div className="detail-row">
                <div className="detail-key">DELETE /api/products/:id</div>
                <div className="detail-val">
                  <Badge label="Active" />
                </div>
              </div>
              <div className="detail-row">
                <div className="detail-key">
                  POST /api/products/:id/variants
                </div>
                <div className="detail-val">
                  <Badge label="Active" />
                </div>
              </div>
              <div className="detail-row">
                <div className="detail-key">POST /api/products/import</div>
                <div className="detail-val">
                  <Badge label="Not Implemented" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// TAB: SETTINGS  (UI only, no backend endpoint for product settings)
// ═══════════════════════════════════════════════════════════

const SettingsTab: React.FC = () => (
  <div className="grid-2">
    <div className="settings-section">
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <i className="fa-solid fa-barcode" /> SKU Configuration
          </div>
        </div>
        <div className="card-body">
          <div className="form-row">
            <div className="form-group">
              <div className="form-label">SKU Prefix</div>
              <input className="form-input" defaultValue="SKU-" />
            </div>
            <div className="form-group">
              <div className="form-label">Starting Number</div>
              <input className="form-input" type="number" defaultValue={1} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <div className="form-label">Auto-generate SKU on Add</div>
              <select className="form-select">
                <option>Yes</option>
                <option>No</option>
              </select>
            </div>
            <div className="form-group">
              <div className="form-label">SKU Format</div>
              <select className="form-select">
                <option>PREFIX-NNNN (e.g. SKU-0041)</option>
                <option>PREFIX-NAME</option>
                <option>Custom</option>
              </select>
            </div>
          </div>
          <hr />
          <button className="header-btn primary">Save SKU Settings</button>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <i className="fa-solid fa-cubes" /> Stock Settings
          </div>
        </div>
        <div className="card-body">
          <div className="form-row">
            <div className="form-group">
              <div className="form-label">Default Low Stock Threshold</div>
              <input className="form-input" type="number" defaultValue={10} />
            </div>
            <div className="form-group">
              <div className="form-label">Allow Negative Stock</div>
              <select className="form-select">
                <option>No — Block orders</option>
                <option>Yes — Allow oversell</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <div className="form-label">Auto-deduct on Order Confirm</div>
              <select className="form-select">
                <option>Yes</option>
                <option>No — Manual only</option>
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
          <hr />
          <button className="header-btn primary">Save Stock Settings</button>
        </div>
      </div>
    </div>

    <div className="settings-section">
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <i className="fa-solid fa-bell" /> Alert Settings
          </div>
        </div>
        <div className="card-body">
          <div className="info-banner" style={{ marginBottom: 12 }}>
            <i className="fa-solid fa-circle-info" />
            <div className="info-banner-text">
              Alert preferences are managed via{" "}
              <strong>Settings → Notifications</strong> and saved on the
              backend.
            </div>
          </div>
          <div className="alert-checkbox-group">
            <label className="alert-checkbox-label">
              <input type="checkbox" defaultChecked /> Email alert on low stock
            </label>
            <label className="alert-checkbox-label">
              <input type="checkbox" defaultChecked /> Dashboard notification on
              low stock
            </label>
            <label className="alert-checkbox-label">
              <input type="checkbox" /> Alert when product reaches 0 stock
            </label>
            <label className="alert-checkbox-label">
              <input type="checkbox" defaultChecked /> Weekly stock health
              summary
            </label>
          </div>
          <hr />
          <button className="header-btn primary">Save Alert Settings</button>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <i className="fa-solid fa-sliders" /> Display Settings
          </div>
        </div>
        <div className="card-body">
          <div className="form-row">
            <div className="form-group">
              <div className="form-label">Rows per Page</div>
              <select className="form-select">
                <option>10</option>
                <option selected>15</option>
                <option>25</option>
                <option>50</option>
              </select>
            </div>
            <div className="form-group">
              <div className="form-label">Default Sort</div>
              <select className="form-select">
                <option>SKU (ascending)</option>
                <option>Name (A–Z)</option>
                <option>Stock (low first)</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <div className="form-label">Show Base Price</div>
              <select className="form-select">
                <option>Yes — All roles</option>
                <option>Admin & Manager only</option>
              </select>
            </div>
            <div className="form-group">
              <div className="form-label">Currency Symbol</div>
              <input className="form-input" defaultValue="₨" />
            </div>
          </div>
          <hr />
          <button className="header-btn primary">Save Display Settings</button>
        </div>
      </div>
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════

const ProductPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ProductTab>("all");
  const { isLoading, loadingProgress, switchTab } = useTabLoading(
    setActiveTab,
    activeTab,
  );

  const tabs: { id: ProductTab; icon: string; label: string }[] = [
    { id: "all", icon: "fa-list", label: "All Products" },
    { id: "variants", icon: "fa-layer-group", label: "Variants" },
    { id: "cats", icon: "fa-tags", label: "Categories" },
    { id: "suppliers", icon: "fa-truck-ramp-box", label: "Suppliers" },
    { id: "import", icon: "fa-file-import", label: "Bulk Import" },
    { id: "settings", icon: "fa-gear", label: "Settings" },
  ];

  return (
    <div id="page-products">
      <TopLoadingBar progress={loadingProgress} isLoading={isLoading} />
      <div className="section-heading">Product Management</div>
      <div className="section-subheading">
        Manage your product catalog, variants, categories, suppliers, and bulk
        imports.
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

      {activeTab === "all" && (
        <AllProductsTab onSwitchToVariants={() => switchTab("variants")} />
      )}
      {activeTab === "variants" && <VariantsTab />}
      {activeTab === "cats" && <CategoriesTab />}
      {activeTab === "suppliers" && <SuppliersTab />}
      {activeTab === "import" && <BulkImportTab />}
      {activeTab === "settings" && <SettingsTab />}
    </div>
  );
};

export default ProductPage;
