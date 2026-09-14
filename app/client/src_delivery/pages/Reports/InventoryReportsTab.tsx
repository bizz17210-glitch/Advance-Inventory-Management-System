// ═══════════════════════════════════════════════════════════
// InventoryReportsTab.tsx  —  Live API data
// ═══════════════════════════════════════════════════════════
import React, { useState, useEffect } from "react";
import { fmt, fmtL } from "./ReportsShared";
import { analyticsAPI, stockAPI } from "../../services/api";

// ── Skeleton helpers ─────────────────────────────────────────
const SkeletonRow: React.FC<{ cols: number }> = ({ cols }) => (
  <tr>
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i}>
        <div
          style={{
            height: 12,
            background: "var(--divider)",
            borderRadius: 4,
            width: "80%",
          }}
        />
      </td>
    ))}
  </tr>
);

const InventoryReportsTab: React.FC = () => {
  const [invData, setInvData] = useState<any>(null);
  const [invLoading, setInvLoading] = useState(true);
  const [invError, setInvError] = useState<string | null>(null);

  const [lowStock, setLowStock] = useState<any[]>([]);
  const [lowLoading, setLowLoading] = useState(true);

  const [stockAnalytics, setStockAnalytics] = useState<any>(null);

  useEffect(() => {
    const fetchAll = async () => {
      // Inventory analytics
      try {
        const res = await analyticsAPI.getInventory();
        setInvData(res.data?.data ?? res.data);
      } catch (e: any) {
        setInvError(
          e?.response?.data?.message || "Failed to load inventory analytics",
        );
      } finally {
        setInvLoading(false);
      }

      // Low stock items
      try {
        const res = await stockAPI.getLowStock({ limit: 20 });
        const items =
          res.data?.data?.items ?? res.data?.data ?? res.data?.items ?? [];
        setLowStock(Array.isArray(items) ? items : []);
      } catch {
        setLowStock([]);
      } finally {
        setLowLoading(false);
      }

      // Stock analytics (movement)
      try {
        const res = await stockAPI.getAnalytics({ groupBy: "week" });
        setStockAnalytics(res.data?.data ?? res.data);
      } catch {
        setStockAnalytics(null);
      }
    };
    fetchAll();
  }, []);

  // Derived values
  const kpi = invData?.summary ?? invData?.kpi ?? {};
  const stockValue = kpi.totalStockValue ?? kpi.stockValue ?? 0;
  const turnover = kpi.stockTurnoverRate ?? kpi.turnoverRate ?? 0;
  const lowCount = kpi.lowStockCount ?? lowStock.length ?? 0;
  const deadCount = kpi.deadStockCount ?? 0;

  // Stock health by category
  const healthCats: any[] =
    invData?.stockHealthByCategory ?? invData?.categoryHealth ?? [];

  // Dead stock
  const deadStock: any[] = invData?.deadStock ?? invData?.dead ?? [];

  // Valuation by category
  const valuation: any[] =
    invData?.valuation ?? invData?.categoryValuation ?? [];

  // Stock movement weeks
  const movementWeeks: any[] =
    stockAnalytics?.movement ?? stockAnalytics?.trend ?? [];
  const hasMovement = movementWeeks.length > 0;
  const movH = 100;
  const maxMov = hasMovement
    ? Math.max(
        ...movementWeeks.map((w: any) =>
          Math.max(w.in ?? w.stockIn ?? 0, w.out ?? w.stockOut ?? 0),
        ),
        1,
      )
    : 1;

  // Urgency badge color
  const urgencyBadge: Record<string, string> = {
    Critical: "orange",
    High: "yellow",
    Medium: "blue",
  };

  return (
    <>
      {/* KPI Row */}
      <div className="stats-row" style={{ marginBottom: 14 }}>
        {invLoading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="stat-card"
                style={{ animation: "pulse 1.5s ease-in-out infinite" }}
              >
                <div
                  style={{
                    height: 10,
                    width: "60%",
                    background: "var(--divider)",
                    borderRadius: 4,
                    marginBottom: 10,
                  }}
                />
                <div
                  style={{
                    height: 24,
                    width: "40%",
                    background: "var(--divider)",
                    borderRadius: 4,
                    marginBottom: 8,
                  }}
                />
                <div
                  style={{
                    height: 10,
                    width: "70%",
                    background: "var(--divider)",
                    borderRadius: 4,
                  }}
                />
              </div>
            ))}
          </>
        ) : invError ? (
          <div className="info-banner" style={{ color: "var(--red)" }}>
            <i className="fa-solid fa-circle-exclamation" />
            <div className="info-banner-text">{invError}</div>
          </div>
        ) : (
          <>
            <div className="stat-card">
              <div className="stat-card-top">
                <div className="stat-label">Total Stock Value</div>
                <div className="stat-icon" style={{ background: "#FFF5EE" }}>
                  <i className="fa-solid fa-warehouse ic-orange" />
                </div>
              </div>
              <div className="stat-value">{fmtL(stockValue)}</div>
              <div className="stat-trend up">
                <i className="fa-solid fa-arrow-trend-up" /> current valuation
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-card-top">
                <div className="stat-label">Stock Turnover Rate</div>
                <div className="stat-icon" style={{ background: "#EFF6FF" }}>
                  <i
                    className="fa-solid fa-rotate"
                    style={{ color: "var(--blue)" }}
                  />
                </div>
              </div>
              <div className="stat-value">
                {turnover ? `${turnover}x` : "—"}
              </div>
              <div className="stat-trend up">
                <i className="fa-solid fa-arrow-trend-up" />{" "}
                {turnover >= 4 ? "Healthy range" : "Monitor closely"}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-card-top">
                <div className="stat-label">Low Stock Items</div>
                <div className="stat-icon" style={{ background: "#FFFBEB" }}>
                  <i
                    className="fa-solid fa-triangle-exclamation"
                    style={{ color: "var(--yellow)" }}
                  />
                </div>
              </div>
              <div className="stat-value">{lowCount}</div>
              <div className="stat-trend down">
                <i className="fa-solid fa-arrow-trend-down" /> Needs restocking
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-card-top">
                <div className="stat-label">Dead Stock Items</div>
                <div className="stat-icon" style={{ background: "#FEF2F2" }}>
                  <i
                    className="fa-solid fa-box-archive"
                    style={{ color: "var(--red)" }}
                  />
                </div>
              </div>
              <div className="stat-value">{deadCount}</div>
              <div className="stat-trend down">
                <i className="fa-solid fa-arrow-trend-down" /> No movement 30d+
              </div>
            </div>
          </>
        )}
      </div>

      {/* Stock Health + Movement */}
      <div className="grid-2" style={{ marginBottom: 14 }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <i className="fa-solid fa-chart-bar ic-orange" /> Stock Health by
              Category
            </div>
          </div>
          <div className="card-body" style={{ padding: "10px 16px" }}>
            {invLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} style={{ marginBottom: 10 }}>
                  <div
                    style={{
                      height: 10,
                      background: "var(--divider)",
                      borderRadius: 4,
                      marginBottom: 4,
                    }}
                  />
                  <div
                    style={{
                      height: 8,
                      background: "var(--divider)",
                      borderRadius: 4,
                    }}
                  />
                </div>
              ))
            ) : healthCats.length ? (
              healthCats.map((c: any) => {
                const instock = c.instock ?? c.inStock ?? c.ok ?? 0;
                const low = c.low ?? c.lowStock ?? 0;
                const oos = c.oos ?? c.outOfStock ?? 0;
                const total = instock + low + oos || 1;
                const iP = Math.round((instock / total) * 100);
                const lP = Math.round((low / total) * 100);
                const oP = 100 - iP - lP;
                return (
                  <div key={c.name} style={{ marginBottom: 10 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 3,
                      }}
                    >
                      <span
                        style={{ fontSize: 11, color: "var(--text-muted)" }}
                      >
                        {c.name}
                      </span>
                      <span
                        style={{ fontSize: 10, color: "var(--text-muted)" }}
                      >
                        {total} products
                      </span>
                    </div>
                    <div className="stock-health-bar">
                      <div
                        style={{
                          width: `${iP}%`,
                          background: "var(--green)",
                          height: 8,
                        }}
                      />
                      <div
                        style={{
                          width: `${lP}%`,
                          background: "var(--yellow)",
                          height: 8,
                        }}
                      />
                      <div
                        style={{
                          width: `${oP}%`,
                          background: "var(--red)",
                          height: 8,
                        }}
                      />
                    </div>
                    <div style={{ display: "flex", gap: 10, marginTop: 3 }}>
                      <span style={{ fontSize: 9.5, color: "var(--green)" }}>
                        ● {instock} OK
                      </span>
                      <span style={{ fontSize: 9.5, color: "var(--yellow)" }}>
                        ● {low} Low
                      </span>
                      <span style={{ fontSize: 9.5, color: "var(--red)" }}>
                        ● {oos} OOS
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div
                style={{
                  color: "var(--text-muted)",
                  fontSize: 12,
                  padding: "20px 0",
                  textAlign: "center",
                }}
              >
                No category health data
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <i className="fa-solid fa-arrow-trend-up ic-orange" /> Stock
              Movement (Last 30 Days)
            </div>
          </div>
          <div className="card-body" style={{ padding: "10px 16px" }}>
            <div style={{ display: "flex", gap: 12, marginBottom: 8 }}>
              <span
                style={{
                  fontSize: 10,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <span
                  style={{
                    width: 10,
                    height: 4,
                    background: "var(--green)",
                    display: "inline-block",
                    borderRadius: 2,
                  }}
                />{" "}
                Stock In
              </span>
              <span
                style={{
                  fontSize: 10,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <span
                  style={{
                    width: 10,
                    height: 4,
                    background: "var(--accent)",
                    display: "inline-block",
                    borderRadius: 2,
                  }}
                />{" "}
                Stock Out
              </span>
            </div>
            {hasMovement ? (
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  alignItems: "flex-end",
                  height: movH,
                }}
              >
                {movementWeeks.map((w: any, i: number) => {
                  const inVal = w.in ?? w.stockIn ?? 0;
                  const outVal = w.out ?? w.stockOut ?? 0;
                  return (
                    <div
                      key={i}
                      style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 2,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          gap: 2,
                          alignItems: "flex-end",
                          width: "100%",
                          height: movH - 20,
                        }}
                      >
                        <div
                          style={{
                            flex: 1,
                            background: "var(--green)",
                            borderRadius: "3px 3px 0 0",
                            height: Math.round((inVal / maxMov) * (movH - 20)),
                            opacity: 0.85,
                          }}
                        />
                        <div
                          style={{
                            flex: 1,
                            background: "var(--accent)",
                            borderRadius: "3px 3px 0 0",
                            height: Math.round((outVal / maxMov) * (movH - 20)),
                            opacity: 0.85,
                          }}
                        />
                      </div>
                      <div
                        style={{ fontSize: 9.5, color: "var(--text-muted)" }}
                      >
                        {w.label ?? w.week ?? `W${i + 1}`}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div
                style={{
                  height: movH - 20,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--text-muted)",
                  fontSize: 12,
                }}
              >
                No movement data available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Low Stock Alert Table */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-header">
          <div className="card-title">
            <i
              className="fa-solid fa-triangle-exclamation"
              style={{ color: "var(--yellow)" }}
            />{" "}
            Low Stock Alert Report
          </div>
          <div className="card-actions">
            <button
              className="t-filter-btn"
              onClick={() => analyticsAPI.exportReport("inventory")}
            >
              <i className="fa-solid fa-file-export" /> Export
            </button>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>SKU</th>
                <th>Product</th>
                <th>Category</th>
                <th>Current Stock</th>
                <th>Threshold</th>
                <th>Days Until Stockout</th>
                <th>Last Restocked</th>
                <th>Supplier</th>
                <th>Urgency</th>
              </tr>
            </thead>
            <tbody>
              {lowLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <SkeletonRow key={i} cols={9} />
                ))
              ) : lowStock.length ? (
                lowStock.map((p: any) => {
                  const sku = p.sku ?? p.product?.sku ?? "—";
                  const name =
                    p.name ?? p.productName ?? p.product?.name ?? "—";
                  const cat = p.category ?? p.product?.category?.name ?? "—";
                  const stock = p.currentStock ?? p.quantity ?? p.stock ?? 0;
                  const thr = p.threshold ?? p.reorderPoint ?? p.minStock ?? 0;
                  const days = p.daysUntilStockout ?? p.daysLeft ?? 0;
                  const last = p.lastRestocked ?? p.lastUpdated ?? "—";
                  const supplier = p.supplier ?? p.supplierName ?? "—";
                  const urgency =
                    p.urgency ??
                    (stock === 0
                      ? "Critical"
                      : days <= 3
                        ? "Critical"
                        : days <= 5
                          ? "High"
                          : "Medium");
                  return (
                    <tr key={sku}>
                      <td>
                        <code className="code-chip">{sku}</code>
                      </td>
                      <td>
                        <strong>{name}</strong>
                      </td>
                      <td>
                        <span className="tag">{cat}</span>
                      </td>
                      <td>
                        <strong
                          style={{
                            color: stock === 0 ? "var(--red)" : "var(--yellow)",
                          }}
                        >
                          {stock}
                        </strong>
                      </td>
                      <td style={{ color: "var(--text-muted)" }}>{thr}</td>
                      <td
                        style={{
                          fontWeight: 600,
                          color:
                            days <= 2
                              ? "var(--red)"
                              : days <= 5
                                ? "var(--yellow)"
                                : "var(--text-secondary)",
                        }}
                      >
                        {days === 0 ? "Stockout" : `~${days}d`}
                      </td>
                      <td style={{ color: "var(--text-muted)" }}>{last}</td>
                      <td style={{ color: "var(--text-secondary)" }}>
                        {supplier}
                      </td>
                      <td>
                        <span
                          className={`badge ${urgencyBadge[urgency] || "gray"}`}
                        >
                          {urgency}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={9}
                    style={{
                      textAlign: "center",
                      padding: "20px 0",
                      color: "var(--text-muted)",
                      fontSize: 12,
                    }}
                  >
                    No low stock alerts
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dead Stock + Valuation */}
      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <i
                className="fa-solid fa-box-archive"
                style={{ color: "var(--red)", fontSize: 12 }}
              />{" "}
              Dead Stock Report
            </div>
            <div className="card-actions">
              <button className="t-filter-btn">
                <i className="fa-solid fa-file-export" /> Export
              </button>
            </div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Product</th>
                  <th>Stock</th>
                  <th>Last Sold</th>
                  <th>Days Idle</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                {invLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <SkeletonRow key={i} cols={6} />
                  ))
                ) : deadStock.length ? (
                  deadStock.map((d: any) => (
                    <tr key={d.sku ?? d._id}>
                      <td>
                        <code className="code-chip">
                          {d.sku ?? d.product?.sku ?? "—"}
                        </code>
                      </td>
                      <td>{d.name ?? d.product?.name ?? "—"}</td>
                      <td style={{ fontWeight: 600 }}>
                        {d.stock ?? d.quantity ?? 0}
                      </td>
                      <td style={{ color: "var(--text-muted)" }}>
                        {d.lastSold ?? d.last ?? "—"}
                      </td>
                      <td>
                        <span className="badge red">
                          {d.daysIdle ?? d.days ?? 0}d
                        </span>
                      </td>
                      <td>
                        <strong style={{ color: "var(--red)" }}>
                          {typeof d.value === "number"
                            ? fmt(d.value)
                            : (d.val ?? d.value ?? "—")}
                        </strong>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      style={{
                        textAlign: "center",
                        padding: "20px 0",
                        color: "var(--text-muted)",
                        fontSize: 12,
                      }}
                    >
                      No dead stock
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <i className="fa-solid fa-coins ic-orange" /> Inventory Valuation
            </div>
          </div>
          <div className="card-body" style={{ padding: "10px 16px" }}>
            {invLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "5px 0",
                    borderBottom: "1px solid var(--divider)",
                  }}
                >
                  <div
                    style={{
                      height: 12,
                      width: "40%",
                      background: "var(--divider)",
                      borderRadius: 4,
                    }}
                  />
                  <div
                    style={{
                      height: 12,
                      width: "30%",
                      background: "var(--divider)",
                      borderRadius: 4,
                    }}
                  />
                </div>
              ))
            ) : (
              <>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 8,
                    paddingBottom: 6,
                    borderBottom: "1px solid var(--divider)",
                  }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}
                  >
                    Category
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}
                  >
                    Cost / Retail
                  </span>
                </div>
                {valuation.length ? (
                  valuation.map((v: any) => (
                    <div
                      key={v.name ?? v.category}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "5px 0",
                        borderBottom: "1px solid var(--divider)",
                      }}
                    >
                      <span style={{ fontSize: 12, fontWeight: 500 }}>
                        {v.name ?? v.category}
                      </span>
                      <div style={{ textAlign: "right" }}>
                        <div
                          style={{ fontSize: 11, color: "var(--text-muted)" }}
                        >
                          {typeof v.cost === "number" ? fmt(v.cost) : v.cost}
                        </div>
                        <div
                          style={{
                            fontSize: 11.5,
                            fontWeight: 700,
                            color: "var(--green)",
                          }}
                        >
                          {typeof v.retail === "number"
                            ? fmt(v.retail)
                            : v.retail}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div
                    style={{
                      color: "var(--text-muted)",
                      fontSize: 12,
                      padding: "20px 0",
                      textAlign: "center",
                    }}
                  >
                    No valuation data
                  </div>
                )}
                {valuation.length > 0 &&
                  (() => {
                    const totalCost = valuation.reduce(
                      (a: number, v: any) =>
                        a + (typeof v.cost === "number" ? v.cost : 0),
                      0,
                    );
                    const totalRetail = valuation.reduce(
                      (a: number, v: any) =>
                        a + (typeof v.retail === "number" ? v.retail : 0),
                      0,
                    );
                    return (
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          padding: "8px 0 0",
                          marginTop: 4,
                        }}
                      >
                        <span style={{ fontSize: 12, fontWeight: 700 }}>
                          Total
                        </span>
                        <div style={{ textAlign: "right" }}>
                          {totalCost > 0 && (
                            <div
                              style={{
                                fontSize: 11,
                                color: "var(--text-muted)",
                              }}
                            >
                              {fmt(totalCost)} cost
                            </div>
                          )}
                          {totalRetail > 0 && (
                            <div
                              style={{
                                fontSize: 13,
                                fontWeight: 800,
                                color: "var(--accent)",
                              }}
                            >
                              {fmt(totalRetail)} retail
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default InventoryReportsTab;
