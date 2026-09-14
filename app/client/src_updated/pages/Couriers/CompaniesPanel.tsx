// CompaniesPanel.tsx  —  fully dynamic
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  ApiCourier,
  ApiPagination,
  fmt,
  rColor,
  courierInitials,
  Badge,
  PerfBar,
  StarRating,
  CPagination,
  InnerTabs,
  EmptyState,
  TableSkeleton,
  ToggleSwitch,
} from "./shared";
import { couriersAPI } from "../../services/api";

// ── City Search Hook ──────────────────────────────────────
interface CityEntry {
  name: string;
  countryCode: string;
  stateCode: string;
}

function useCitySearch() {
  const [allCities, setAllCities] = useState<CityEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    import("../../assets/data/all_cities/allCitiesNested.lite.json")
      .then((mod: any) => {
        const raw = mod.default ?? mod;
        const flat: CityEntry[] = [];
        // Structure: { "Country-CC": { "State-SC": [ { name, countryCode, stateCode } ] } }
        Object.values(raw).forEach((states: any) => {
          Object.values(states).forEach((cities: any) => {
            if (Array.isArray(cities)) {
              cities.forEach((c: CityEntry) => flat.push(c));
            }
          });
        });
        setAllCities(flat);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  const search = useCallback(
    (query: string): CityEntry[] => {
      if (!query.trim() || query.length < 2) return [];
      const q = query.toLowerCase();
      const results: CityEntry[] = [];
      for (const c of allCities) {
        if (c.name.toLowerCase().startsWith(q)) results.push(c);
        if (results.length >= 40) break;
      }
      // secondary pass — contains match
      if (results.length < 10) {
        for (const c of allCities) {
          if (!results.includes(c) && c.name.toLowerCase().includes(q)) {
            results.push(c);
          }
          if (results.length >= 40) break;
        }
      }
      return results;
    },
    [allCities],
  );

  return { search, loaded };
}

// ── CityInput Component ───────────────────────────────────
interface CityInputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

// ── Courier Name Search Hook ──────────────────────────────
// ── Courier Name Search Hook ──────────────────────────────
function useCourierSearch() {
  const [allCouriers, setAllCouriers] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    import("../../assets/data/all_couriers/allCourierslist.json")
      .then((mod: any) => {
        const raw = mod.default ?? mod;
        // Handle both: flat array OR { couriers: [...] } object
        let list: string[] = [];
        if (Array.isArray(raw)) {
          list = raw;
        } else if (Array.isArray(raw.couriers)) {
          list = raw.couriers;
        } else {
          // Fallback: flatten any array values from the object
          list = Object.values(raw).flat() as string[];
        }
        setAllCouriers(list.filter((x) => typeof x === "string"));
        setLoaded(true);
      })
      .catch((err) => {
        console.error("Failed to load couriers JSON:", err);
        setLoaded(true);
      });
  }, []);

  const search = useCallback(
    (query: string): string[] => {
      if (!query.trim() || query.length < 1) return [];
      const q = query.toLowerCase();
      const starts: string[] = [];
      const contains: string[] = [];
      for (const name of allCouriers) {
        const n = name.toLowerCase();
        if (n.startsWith(q)) starts.push(name);
        else if (n.includes(q)) contains.push(name);
        if (starts.length >= 40) break;
      }
      return [...starts, ...contains].slice(0, 40);
    },
    [allCouriers],
  );

  return { search, loaded };
}

// ── CourierNameInput Component ────────────────────────────
interface CourierNameInputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

const CourierNameInput: React.FC<CourierNameInputProps> = ({
  value,
  onChange,
  placeholder = "e.g. TCS Express",
}) => {
  const { search, loaded } = useCourierSearch();
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setQuery(value); }, [value]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setQuery(q);
    onChange(q);
    if (q.length >= 1) {
      setSuggestions(search(q));
      setOpen(true);
      setHighlighted(0);
    } else {
      setSuggestions([]);
      setOpen(false);
    }
  };

  const pick = (name: string) => {
    setQuery(name);
    onChange(name);
    setSuggestions([]);
    setOpen(false);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (!open) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setHighlighted((h) => Math.min(h + 1, suggestions.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setHighlighted((h) => Math.max(h - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); if (suggestions[highlighted]) pick(suggestions[highlighted]); }
    else if (e.key === "Escape") setOpen(false);
  };

  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.children[highlighted] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [highlighted]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <input
        className="c-form-input"
        placeholder={loaded ? placeholder : "Loading couriers..."}
        disabled={!loaded}
        value={query}
        onChange={handleInput}
        onKeyDown={handleKey}
        onFocus={() => { if (query.length >= 1 && suggestions.length) setOpen(true); }}
        autoComplete="off"
      />
      {open && suggestions.length > 0 && (
        <ul
          ref={listRef}
          style={{
            position: "absolute",
            top: "calc(100% + 3px)",
            left: 0,
            right: 0,
            maxHeight: 220,
            overflowY: "auto",
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: 6,
            zIndex: 999,
            margin: 0,
            padding: 0,
            listStyle: "none",
            boxShadow: "0 4px 16px rgba(0,0,0,0.10)",
          }}
        >
          {suggestions.map((name, i) => (
            <li
              key={`${name}-${i}`}
              onMouseDown={() => pick(name)}
              onMouseEnter={() => setHighlighted(i)}
              style={{
                padding: "6px 11px",
                fontSize: 11,
                cursor: "pointer",
                background: i === highlighted ? "var(--accent)" : "transparent",
                color: i === highlighted ? "#fff" : "var(--text-primary)",
                fontWeight: i === highlighted ? 600 : 400,
              }}
            >
              {name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const CityInput: React.FC<CityInputProps> = ({
  value,
  onChange,
  placeholder = "Type city name...",
}) => {
  const { search, loaded } = useCitySearch();
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<CityEntry[]>([]);
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const listRef = useRef<HTMLUListElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  // sync external value → internal query
  useEffect(() => {
    setQuery(value);
  }, [value]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setQuery(q);
    onChange(q); // keep form value in sync while typing
    if (q.length >= 2) {
      setSuggestions(search(q));
      setOpen(true);
      setHighlighted(0);
    } else {
      setSuggestions([]);
      setOpen(false);
    }
  };

  const pick = (city: CityEntry) => {
    setQuery(city.name);
    onChange(city.name);
    setSuggestions([]);
    setOpen(false);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (suggestions[highlighted]) pick(suggestions[highlighted]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  // scroll highlighted item into view
  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.children[highlighted] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [highlighted]);

  // close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <input
        ref={inputRef}
        className="c-form-input"
        placeholder={loaded ? placeholder : "Loading cities..."}
        disabled={!loaded}
        value={query}
        onChange={handleInput}
        onKeyDown={handleKey}
        onFocus={() => {
          if (query.length >= 2 && suggestions.length) setOpen(true);
        }}
        autoComplete="off"
      />

      {/* Dropdown */}
      {open && suggestions.length > 0 && (
        <ul
          ref={listRef}
          style={{
            position: "absolute",
            top: "calc(100% + 3px)",
            left: 0,
            right: 0,
            maxHeight: 220,
            overflowY: "auto",
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: 6,
            zIndex: 999,
            margin: 0,
            padding: 0,
            listStyle: "none",
            boxShadow: "0 4px 16px rgba(0,0,0,0.10)",
          }}
        >
          {suggestions.map((c, i) => (
            <li
              key={`${c.name}-${c.countryCode}-${c.stateCode}-${i}`}
              onMouseDown={() => pick(c)} // mousedown fires before blur
              style={{
                padding: "6px 11px",
                fontSize: 11,
                cursor: "pointer",
                background: i === highlighted ? "var(--accent)" : "transparent",
                color: i === highlighted ? "#fff" : "var(--text-primary)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
              onMouseEnter={() => setHighlighted(i)}
            >
              <span style={{ fontWeight: i === highlighted ? 600 : 400 }}>
                {c.name}
              </span>
              <span
                style={{
                  fontSize: 9,
                  opacity: 0.7,
                  color: i === highlighted ? "#ffffffcc" : "var(--text-muted)",
                }}
              >
                {c.countryCode} · {c.stateCode}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// ── Main Panel ────────────────────────────────────────────
interface Props {
  onOpenOverlay: (c: ApiCourier) => void;
  initialEdit?: ApiCourier | null;
  onEditConsumed?: () => void;
  refreshTrigger?: number; // 👈 NEW
}

const CompaniesPanel: React.FC<Props> = ({
  onOpenOverlay,
  initialEdit,
  onEditConsumed,
  refreshTrigger,
}) => {
  const [innerTab, setInnerTab] = useState("list");

  // ── list state ──
  const [couriers, setCouriers] = useState<ApiCourier[]>([]);
  const [pagination, setPagination] = useState<ApiPagination>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const PER_PAGE = 10;

  // ── form state ──
  const [form, setForm] = useState({
    name: "",
    contactPerson: "",
    email: "",
    phone: "",
    city: "",
    baseRate: "",
    codPct: "",
    codDays: "",
    coverage: "Nationwide",
    apiIntegrationEnabled: false,
    apiKey: "",
    apiEndpoint: "",
    status: "Active", // 👈 NEW
  });
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState("");
  const [editTarget, setEditTarget] = useState<ApiCourier | null>(null);

  useEffect(() => {
    if (!editTarget) return;
    setForm({
      name: editTarget.name,
      contactPerson: editTarget.contactPerson ?? "",
      email: editTarget.email ?? "",
      phone: editTarget.phone ?? "",
      city: editTarget.serviceRegions?.[0] ?? "",
      baseRate: String(editTarget.baseRate ?? ""),
      codPct: String(editTarget.codPct ?? ""),
      codDays: String(editTarget.codDays ?? ""),
      coverage: editTarget.coverage ?? "Nationwide",
      apiIntegrationEnabled: editTarget.apiIntegrationEnabled ?? false,
      apiKey: "",
      apiEndpoint: editTarget.apiEndpoint ?? "",
      status: editTarget.status ?? "Active", // 👈 NEW
    });
  }, [editTarget]);

  // initialEdit — triggered from overlay Edit button in CouriersPage
  useEffect(() => {
    if (!initialEdit) return;
    setEditTarget(initialEdit);
    setInnerTab("add");
    onEditConsumed?.();
  }, [initialEdit]);

  const fetchCouriers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, any> = { page, limit: PER_PAGE };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const res = await couriersAPI.getAll(params);
      const data = res.data?.data;
      setCouriers(data?.couriers ?? []);
      setPagination(
        data?.pagination ?? {
          currentPage: 1,
          totalPages: 1,
          totalItems: 0,
          itemsPerPage: PER_PAGE,
        },
      );
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Failed to load couriers.");
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    if (innerTab === "list") fetchCouriers();
  }, [fetchCouriers, innerTab]);

  // Auto-refresh when overlay closes (refreshTrigger changes)
  useEffect(() => {
    if (refreshTrigger === undefined || refreshTrigger === 0) return;
    if (innerTab === "list") fetchCouriers();
  }, [refreshTrigger]); // 👈 NEW

  const handleSave = async () => {
    if (!form.name.trim()) {
      setSaveErr("Courier name is required.");
      return;
    }
    setSaving(true);
    setSaveErr("");
    const payload = {
      name: form.name,
      contactPerson: form.contactPerson || undefined,
      email: form.email || undefined,
      phone: form.phone || undefined,
      serviceRegions: form.city ? [form.city] : undefined,
      apiIntegrationEnabled: form.apiIntegrationEnabled,
      apiKey: form.apiKey || undefined,
      apiEndpoint: form.apiEndpoint || undefined,
      status: form.status || undefined, // 👈 NEW
    };
    try {
      if (editTarget) {
        await couriersAPI.update(editTarget._id, payload);
      } else {
        await couriersAPI.create(payload);
      }
      setEditTarget(null);
      setInnerTab("list");
      fetchCouriers();
    } catch (e: any) {
      setSaveErr(e?.response?.data?.message ?? "Failed to save courier.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Deactivate this courier?")) return;
    await couriersAPI
      .delete(id, "Deactivated from courier management")
      .catch(() => {});
    fetchCouriers();
  };

  const handleTestConnection = async (id: string) => {
    try {
      await couriersAPI.testConnection(id);
      alert("Connection test passed!");
    } catch {
      alert("Connection test failed.");
    }
  };

  const handleSync = async (id: string) => {
    try {
      const res = await couriersAPI.sync(id);
      const r = res.data?.syncResult;
      alert(
        `Sync complete: ${r?.syncedOrders ?? 0} orders synced, ${r?.failedUpdates ?? 0} failed.`,
      );
    } catch {
      alert("Sync failed.");
    }
  };

  const { currentPage, totalPages, totalItems } = pagination;
  const start = (currentPage - 1) * PER_PAGE + 1;
  const end = Math.min(currentPage * PER_PAGE, totalItems);

  const active = couriers.filter((c) => c.status === "Active").length;
  const paused = couriers.filter((c) => c.status === "Paused").length;
  const apiEnabled = couriers.filter((c) => c.apiIntegrationEnabled).length;
  const totalOutstanding = couriers.reduce(
    (a, c) => a + (c.outstanding ?? 0),
    0,
  );

  return (
    <>
      <div className="panel-heading">Courier Companies</div>
      <div className="panel-desc">
        View and manage all courier partners — their rates, API credentials, COD
        outstanding, and performance metrics.
      </div>

      <InnerTabs
        tabs={[
          { id: "list", label: "All Companies" },
          { id: "add", label: "Add Company" },
          { id: "api", label: "API Credentials" },
        ]}
        active={innerTab}
        onChange={(t) => {
          setInnerTab(t);
          if (t === "list") fetchCouriers();
        }}
      />

      {/* ── LIST ── */}
      {innerTab === "list" && (
        <>
          <div className="mini-stats">
            <div className="mini-stat">
              <div className="ms-label">Total Partners</div>
              <div className="ms-value">{totalItems}</div>
              <div className="ms-trend">
                {active} active · {paused} paused
              </div>
            </div>
            <div className="mini-stat">
              <div className="ms-label">Avg. Success Rate</div>
              <div className="ms-value">
                {couriers.length > 0
                  ? Math.round(
                      couriers.reduce(
                        (a, c) =>
                          a +
                          (c.successRate ??
                            parseFloat(c.completionRate ?? "0")),
                        0,
                      ) / couriers.length,
                    ) + "%"
                  : "—"}
              </div>
              <div className="ms-trend up">Live avg.</div>
            </div>
            <div className="mini-stat">
              <div className="ms-label">COD Outstanding</div>
              <div className="ms-value">{fmt(totalOutstanding)}</div>
              <div className="ms-trend down">Needs settlement</div>
            </div>
            <div className="mini-stat">
              <div className="ms-label">API Connected</div>
              <div className="ms-value">{apiEnabled}</div>
              <div className="ms-trend">
                {couriers.length - apiEnabled} manual
              </div>
            </div>
          </div>

          <div className="card">
            <div className="c-toolbar">
              <div className="c-toolbar-left">
                <div className="c-search">
                  <i className="fa-solid fa-magnifying-glass" />
                  <input
                    placeholder="Search courier..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                  />
                </div>
                {(["", "Active", "Paused", "Inactive"] as const).map((f) => (
                  <button
                    key={f}
                    className={`c-btn ${statusFilter === f ? "active" : ""}`}
                    onClick={() => {
                      setStatusFilter(f);
                      setPage(1);
                    }}
                  >
                    {f || "All"}
                  </button>
                ))}
              </div>
              <div className="c-toolbar-right">
                <button className="c-btn" onClick={fetchCouriers}>
                  <i className="fa-solid fa-rotate" /> Refresh
                </button>
                <button
                  className="c-btn primary"
                  onClick={() => setInnerTab("add")}
                >
                  <i className="fa-solid fa-plus" /> Add Courier
                </button>
              </div>
            </div>

            <div className="tbl-wrap">
              <table>
                <thead>
                  <tr>
                    <th>
                      <input type="checkbox" />
                    </th>
                    <th>Company</th>
                    <th>Regions</th>
                    <th>API</th>
                    <th>Active Shipments</th>
                    <th>In Transit</th>
                    <th>Success Rate</th>
                    <th>COD Outstanding</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <TableSkeleton rows={6} cols={10} />
                  ) : error ? (
                    <tr>
                      <td
                        colSpan={10}
                        style={{
                          textAlign: "center",
                          padding: 24,
                          color: "var(--red)",
                        }}
                      >
                        <i className="fa-solid fa-circle-exclamation" /> {error}
                        <button
                          className="c-btn"
                          style={{ marginLeft: 8 }}
                          onClick={fetchCouriers}
                        >
                          Retry
                        </button>
                      </td>
                    </tr>
                  ) : couriers.length === 0 ? (
                    <tr>
                      <td colSpan={10}>
                        <EmptyState
                          icon="fa-building"
                          title="No couriers found"
                          desc="Add your first courier partner."
                        />
                      </td>
                    </tr>
                  ) : (
                    couriers.map((c) => {
                      const rate =
                        c.successRate ?? parseFloat(c.completionRate ?? "0");
                      return (
                        <tr
                          key={c._id}
                          onClick={() => onOpenOverlay(c)}
                          style={{ cursor: "pointer" }}
                        >
                          <td onClick={(e) => e.stopPropagation()}>
                            <input type="checkbox" />
                          </td>
                          <td>
                            <div className="td-flex">
                              <div
                                className="row-avatar"
                                style={{ background: "var(--bg)", fontSize: 8 }}
                              >
                                {c.code ?? courierInitials(c.name)}
                              </div>
                              <div>
                                <div style={{ fontWeight: 600 }}>{c.name}</div>
                                <div className="td-sub">
                                  {c.phone ?? c.email ?? "—"}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="tag">
                              {c.serviceRegions?.slice(0, 2).join(", ") ??
                                c.coverage ??
                                "—"}
                            </span>
                          </td>
                          <td>
                            {c.apiIntegrationEnabled ? (
                              <Badge label={c.apiStatus ?? "live"} />
                            ) : (
                              <Badge label="Manual" />
                            )}
                          </td>
                          <td>{c.activeShipments ?? "—"}</td>
                          <td style={{ color: "var(--accent)" }}>
                            {c.inTransit ?? "—"}
                          </td>
                          <td>
                            <PerfBar pct={rate} color={rColor(rate)} />
                          </td>
                          <td>
                            <strong
                              style={{
                                color:
                                  (c.outstanding ?? 0) > 0
                                    ? "var(--red)"
                                    : "var(--green)",
                              }}
                            >
                              {fmt(c.outstanding ?? 0)}
                            </strong>
                          </td>
                          <td>
                            <Badge label={c.status ?? "Active"} />
                          </td>
                          <td
                            onClick={(e) => e.stopPropagation()}
                            style={{ display: "flex", gap: 3 }}
                          >
                            <button
                              className="c-btn"
                              style={{ height: 24, fontSize: 9.5 }}
                              title="View"
                              onClick={() => onOpenOverlay(c)}
                            >
                              <i className="fa-solid fa-eye" />
                            </button>
                            <button
                              className="c-btn"
                              style={{ height: 24, fontSize: 9.5 }}
                              title="Edit"
                              onClick={() => {
                                setEditTarget(c);
                                setInnerTab("add");
                              }}
                            >
                              <i className="fa-solid fa-pen" />
                            </button>
                            {c.apiIntegrationEnabled && (
                              <button
                                className="c-btn"
                                style={{ height: 24, fontSize: 9.5 }}
                                title="Test API"
                                onClick={() => handleTestConnection(c._id)}
                              >
                                <i className="fa-solid fa-plug" />
                              </button>
                            )}
                            {c.apiIntegrationEnabled && (
                              <button
                                className="c-btn"
                                style={{ height: 24, fontSize: 9.5 }}
                                title="Sync"
                                onClick={() => handleSync(c._id)}
                              >
                                <i className="fa-solid fa-rotate" />
                              </button>
                            )}
                            <button
                              className="c-btn"
                              style={{
                                height: 24,
                                fontSize: 9.5,
                                color: "var(--red)",
                              }}
                              onClick={() => handleDelete(c._id)}
                            >
                              <i className="fa-solid fa-ban" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <CPagination
              current={currentPage}
              total={totalPages}
              totalItems={totalItems}
              start={start}
              end={end}
              onChange={setPage}
            />
          </div>
        </>
      )}

      {/* ── ADD COURIER ── */}
      {innerTab === "add" && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <i
                className={`fa-solid ${editTarget ? "fa-pen" : "fa-plus-circle"}`}
              />
              {editTarget
                ? `Edit — ${editTarget.name}`
                : "Add New Courier Company"}
            </div>{" "}
          </div>
          <div className="card-body">
            {saveErr && (
              <div
                style={{
                  color: "var(--red)",
                  fontSize: 12,
                  marginBottom: 10,
                  padding: "6px 10px",
                  background: "var(--red-bg)",
                  borderRadius: 6,
                }}
              >
                <i className="fa-solid fa-circle-exclamation" /> {saveErr}
              </div>
            )}
            <div className="c-form-row">
              <div className="c-form-group">
                <div className="c-form-label">Company Name *</div>
                <CourierNameInput
                  value={form.name}
                  onChange={(val) => setForm((f) => ({ ...f, name: val }))}
                  placeholder="e.g. TCS Express"
                />
              </div>
              <div className="c-form-group">
                <div className="c-form-label">Contact Person</div>
                <input
                  className="c-form-input"
                  placeholder="Account manager name"
                  value={form.contactPerson}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, contactPerson: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="c-form-row">
              <div className="c-form-group">
                <div className="c-form-label">Email</div>
                <input
                  className="c-form-input"
                  type="email"
                  placeholder="ops@courier.com"
                  value={form.email}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, email: e.target.value }))
                  }
                />
              </div>
              <div className="c-form-group">
                <div className="c-form-label">Phone</div>
                <input
                  className="c-form-input"
                  placeholder="03XX-XXXXXXX"
                  value={form.phone}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, phone: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="c-form-row">
              {/* ── CITY DROPDOWN ── */}
              <div className="c-form-group">
                <div className="c-form-label">City / HQ</div>
                <CityInput
                  value={form.city}
                  onChange={(val) => setForm((f) => ({ ...f, city: val }))}
                  placeholder="Type city name..."
                />
              </div>
              <div className="c-form-group">
                <div className="c-form-label">Coverage Type</div>
                <select
                  className="c-form-select"
                  value={form.coverage}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, coverage: e.target.value }))
                  }
                >
                  <option>Nationwide</option>
                  <option>Regional</option>
                  <option>City Only</option>
                </select>
              </div>
            </div>

            <div className="c-form-row">
              <div className="c-form-group">
                <div className="c-form-label">API Integration</div>
                <select
                  className="c-form-select"
                  value={form.apiIntegrationEnabled ? "yes" : "no"}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      apiIntegrationEnabled: e.target.value === "yes",
                    }))
                  }
                >
                  <option value="no">No — Manual only</option>
                  <option value="yes">Yes — API connected</option>
                </select>
              </div>
            </div>

            {form.apiIntegrationEnabled && (
              <div className="c-form-row">
                <div className="c-form-group">
                  <div className="c-form-label">API Key</div>
                  <input
                    className="c-form-input"
                    placeholder="your-api-key"
                    value={form.apiKey}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, apiKey: e.target.value }))
                    }
                  />
                </div>
                <div className="c-form-group">
                  <div className="c-form-label">API Endpoint</div>
                  <input
                    className="c-form-input"
                    placeholder="https://api.courier.com/v1"
                    value={form.apiEndpoint}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, apiEndpoint: e.target.value }))
                    }
                  />
                </div>
              </div>
            )}

            <hr />
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="c-btn primary"
                onClick={handleSave}
                disabled={saving}
              >
                <i
                  className={`fa-solid ${saving ? "fa-spinner fa-spin" : "fa-check"}`}
                />
                {saving
                  ? "Saving…"
                  : editTarget
                    ? "Update Courier"
                    : "Save Courier"}
              </button>
              <button
                className="c-btn"
                onClick={() => {
                  setEditTarget(null);
                  setInnerTab("list");
                }}
              >
                Cancel
              </button>{" "}
            </div>
          </div>
        </div>
      )}

      {/* ── API CREDENTIALS ── */}
      {innerTab === "api" && (
        <>
          <div className="alert-strip info">
            <i className="fa-solid fa-circle-info" />
            API credentials are encrypted at rest. Keys are never displayed in
            full after saving.
          </div>
          {loading ? (
            <div
              style={{
                textAlign: "center",
                padding: 24,
                color: "var(--text-muted)",
              }}
            >
              <i className="fa-solid fa-spinner fa-spin" />
            </div>
          ) : couriers.filter((c) => c.apiIntegrationEnabled).length === 0 ? (
            <div className="card">
              <div className="card-body">
                <EmptyState
                  icon="fa-plug"
                  title="No API Couriers"
                  desc="Enable API integration when adding a courier."
                />
              </div>
            </div>
          ) : (
            couriers
              .filter((c) => c.apiIntegrationEnabled)
              .map((a) => (
                <div className="card" style={{ marginBottom: 10 }} key={a._id}>
                  <div className="card-header">
                    <div className="card-title">
                      <i className="fa-solid fa-building" /> {a.name}
                    </div>
                    <Badge
                      label={
                        a.apiStatus === "live"
                          ? "Connected"
                          : a.apiStatus === "test"
                            ? "Test Mode"
                            : "Disconnected"
                      }
                    />
                  </div>
                  <div className="card-body">
                    <div className="detail-row">
                      <div className="detail-key">Service Regions</div>
                      <div className="detail-val">
                        {a.serviceRegions?.join(", ") ?? "—"}
                      </div>
                    </div>
                    <div className="detail-row">
                      <div className="detail-key">Active Shipments</div>
                      <div className="detail-val">
                        {a.activeShipments ?? "—"}
                      </div>
                    </div>
                    <div className="detail-row">
                      <div className="detail-key">Completion Rate</div>
                      <div className="detail-val">
                        {a.completionRate ? `${a.completionRate}%` : "—"}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                      <button
                        className="c-btn primary"
                        style={{ fontSize: 10 }}
                        onClick={() => handleTestConnection(a._id)}
                      >
                        <i className="fa-solid fa-rotate" /> Test
                      </button>
                      <button
                        className="c-btn"
                        style={{ fontSize: 10 }}
                        onClick={() => handleSync(a._id)}
                      >
                        <i className="fa-solid fa-arrows-rotate" /> Sync Now
                      </button>
                    </div>
                  </div>
                </div>
              ))
          )}
        </>
      )}
    </>
  );
};

export default CompaniesPanel;
