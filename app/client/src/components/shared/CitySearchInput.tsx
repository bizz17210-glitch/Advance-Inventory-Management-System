import React, { useState, useEffect, useRef, useCallback } from "react";

// ── Types ──────────────────────────────────────────────────
interface CityEntry {
  name: string;
  countryCode: string;
  stateCode: string;
}

interface CitySearchInputProps {
  value: string;
  onChange: (city: string) => void;
  placeholder?: string;
}

// ── Flatten all cities from nested JSON ────────────────────
function flattenCities(
  data: Record<string, Record<string, CityEntry[]>>,
): CityEntry[] {
  const all: CityEntry[] = [];
  for (const countryKey of Object.keys(data)) {
    const states = data[countryKey];
    for (const stateKey of Object.keys(states)) {
      for (const city of states[stateKey]) {
        all.push(city);
      }
    }
  }
  return all;
}

// ── Sort: Pakistan cities first, then rest ─────────────────
function sortCities(cities: CityEntry[]): CityEntry[] {
  return [...cities].sort((a, b) => {
    if (a.countryCode === "PK" && b.countryCode !== "PK") return -1;
    if (a.countryCode !== "PK" && b.countryCode === "PK") return 1;
    return a.name.localeCompare(b.name);
  });
}

// ── Component ──────────────────────────────────────────────
const CitySearchInput: React.FC<CitySearchInputProps> = ({
  value,
  onChange,
  placeholder = "Search city...",
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value || "");
  const [results, setResults] = useState<CityEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [allCities, setAllCities] = useState<CityEntry[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // ── Load JSON lazily on first open ───────────────────────
  const loadData = useCallback(async () => {
    if (dataLoaded) return;
    setLoading(true);
    try {
      // Dynamic import — CRA bundles it, loads only when needed
      const mod =
        await import("../../assets/data/all_cities/allCitiesNested.lite.json");
      const data = mod.default as Record<string, Record<string, CityEntry[]>>;
      const flat = flattenCities(data);
      const sorted = sortCities(flat);
      setAllCities(sorted);
      setDataLoaded(true);
      // Show initial results after load
      setResults(sorted.slice(0, 50));
    } catch (err) {
      console.error("City data load failed:", err);
    } finally {
      setLoading(false);
    }
  }, [dataLoaded]);

  // ── Filter cities on query change ─────────────────────────
  useEffect(() => {
    if (!dataLoaded || !open) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim()) {
      setResults(allCities.slice(0, 50));
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(() => {
      const q = query.toLowerCase();
      const filtered = allCities
        .filter((c) => c.name.toLowerCase().includes(q))
        .slice(0, 80);
      setResults(filtered);
      setLoading(false);
    }, 250);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, allCities, dataLoaded, open]);

  // ── Close on outside click ────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Sync external value ───────────────────────────────────
  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  const handleFocus = async () => {
    setOpen(true);
    await loadData();
    if (dataLoaded && !query.trim()) {
      setResults(allCities.slice(0, 50));
    }
  };

  const handleSelect = (city: CityEntry) => {
    onChange(city.name);
    setQuery(city.name);
    setOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    onChange(val); // keep parent in sync as user types
    if (!open) setOpen(true);
  };

  return (
    <div ref={wrapperRef} style={{ position: "relative" }}>
      {/* Input */}
      <div style={{ position: "relative" }}>
        <input
          className="form-input"
          style={{ width: "100%", paddingRight: 28 }}
          value={query}
          onChange={handleInputChange}
          onFocus={handleFocus}
          placeholder={placeholder}
          autoComplete="off"
        />
        {/* Right icon */}
        <span
          style={{
            position: "absolute",
            right: 8,
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--text-muted)",
            fontSize: 11,
            pointerEvents: "none",
          }}
        >
          {loading ? (
            <i className="fa-solid fa-spinner fa-spin" />
          ) : (
            <i
              className="fa-solid fa-chevron-down"
              style={{ opacity: open ? 1 : 0.5 }}
            />
          )}
        </span>
      </div>

      {/* Dropdown */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 2px)",
            left: 0,
            right: 0,
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-input, 6px)",
            zIndex: 999,
            boxShadow: "0 6px 20px rgba(0,0,0,0.10)",
            maxHeight: 220,
            overflowY: "auto",
          }}
        >
          {/* Loading state */}
          {loading && results.length === 0 && (
            <div
              style={{
                padding: "12px 10px",
                fontSize: 12,
                color: "var(--text-muted)",
                textAlign: "center",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <i className="fa-solid fa-spinner fa-spin" />
              Loading cities...
            </div>
          )}

          {/* No results */}
          {!loading && results.length === 0 && query.trim().length > 0 && (
            <div
              style={{
                padding: "10px",
                fontSize: 12,
                color: "var(--text-muted)",
                textAlign: "center",
              }}
            >
              No cities found for "<strong>{query}</strong>"
            </div>
          )}

          {/* Results */}
          {results.map((city, i) => (
            <div
              key={`${city.countryCode}-${city.stateCode}-${city.name}-${i}`}
              onMouseDown={() => handleSelect(city)}
              style={{
                padding: "7px 10px",
                cursor: "pointer",
                fontSize: 12,
                borderBottom: "1px solid var(--border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                transition: "background 0.1s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "var(--bg)")
              }
              onMouseLeave={(e) => (e.currentTarget.style.background = "")}
            >
              <span style={{ fontWeight: 600 }}>{city.name}</span>
              <span
                style={{
                  fontSize: 10,
                  color: "var(--text-muted)",
                  background:
                    city.countryCode === "PK" ? "#EFF6FF" : "var(--bg)",
                  color:
                    city.countryCode === "PK"
                      ? "var(--accent)"
                      : "var(--text-muted)",
                  padding: "1px 5px",
                  borderRadius: 4,
                  fontWeight: city.countryCode === "PK" ? 700 : 400,
                }}
              >
                {city.countryCode}
              </span>
            </div>
          ))}

          {/* Count hint */}
          {results.length > 0 && (
            <div
              style={{
                padding: "5px 10px",
                fontSize: 10,
                color: "var(--text-muted)",
                textAlign: "center",
                borderTop: "1px solid var(--border)",
                background: "var(--bg)",
                position: "sticky",
                bottom: 0,
              }}
            >
              {loading
                ? "Searching..."
                : `${results.length} cities shown${results.length === 80 ? " — type to narrow down" : ""}`}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CitySearchInput;
