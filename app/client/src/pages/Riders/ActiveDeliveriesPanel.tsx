// ActiveDeliveriesPanel.tsx — dynamic
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  ApiRider,
  ApiDelivery,
  ApiPagination,
  ACTIVE_DELIVERIES,
  riderStatusLabel,
  badgeClass,
  Badge,
  InnerTabs,
  CPagination,
  EmptyState,
  TableSkeleton,
  ApiRiderAvatar,
} from "./shared";
import { ridersAPI } from "../../services/api";
import { GoogleMap, useJsApiLoader, InfoWindow } from "@react-google-maps/api";

// ── Types ──────────────────────────────────────────────────
interface LiveDelivery {
  _id: string;
  trackingNumber?: string;
  orderReference?: string;
  currentStatus: string;
  customer?: { name?: string; phone?: string };
  shippingAddress?: { city?: string; street?: string };
  codAmount?: number;
  estimatedDelivery?: string;
  rider?: { id: string; name: string; phone: string };
  createdAt?: string;
}

interface RiderWithDeliveries {
  rider: ApiRider;
  deliveries: LiveDelivery[];
}

const STATUS_COLOR: Record<string, string> = {
  in_transit: "var(--accent)",
  out_for_delivery: "var(--blue)",
  delayed: "var(--red)",
  pending_pickup: "var(--yellow)",
  assigned: "var(--yellow)",
  picked_up: "var(--accent)",
  delivered: "var(--green)",
  failed: "var(--red)",
  returned: "var(--red)",
};

const fmtStatus = (s: string) =>
  s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const GOOGLE_MAPS_API_KEY = "AIzaSyCwt2k3uCNQi-ww4Cj84q6BiljGx4sdm6A";

const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  Lahore:     { lat: 31.5204, lng: 74.3587 },
  Karachi:    { lat: 24.8607, lng: 67.0011 },
  Islamabad:  { lat: 33.6844, lng: 73.0479 },
  Rawalpindi: { lat: 33.5651, lng: 73.0169 },
  Faisalabad: { lat: 31.4504, lng: 73.135 },
  Multan:     { lat: 30.1575, lng: 71.5249 },
  Peshawar:   { lat: 34.0151, lng: 71.5249 },
  Quetta:     { lat: 30.1798, lng: 66.975 },
  "DHA Lahore": { lat: 31.4697, lng: 74.4082 },
};

const DEFAULT_CENTER = { lat: 31.5204, lng: 74.3587 };

// ── AdvancedMarkerWrapper ──────────────────────────────────
interface AdvancedMarkerWrapperProps {
  map: google.maps.Map | null;
  position: { lat: number; lng: number };
  rider: ApiRider;
  riderDeliveries: LiveDelivery[];
  isSelected: boolean;
  onSelect: () => void;
  onClose: () => void;
}

const AdvancedMarkerWrapper: React.FC<AdvancedMarkerWrapperProps> = ({
  map,
  position,
  rider,
  riderDeliveries,
  isSelected,
  onSelect,
  onClose,
}) => {
  const markerRef = useRef<any>(null);

  useEffect(() => {
    if (!map) return;

    // FIX 6: agar AdvancedMarkerElement kisi wajah se available nahi hai
    // (key restricted / library attach hone mein delay), sirf yeh marker
    // skip ho — pura map/tab crash nahi hona chahiye.
    const markerLib = (window as any).google?.maps?.marker;
    if (!markerLib?.AdvancedMarkerElement) {
      console.warn(
        `Skipping marker for ${rider.fullName} — AdvancedMarkerElement unavailable`,
      );
      return;
    }
    const { AdvancedMarkerElement } = markerLib;

    const pinEl = document.createElement("div");
    pinEl.style.cssText = `
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: ${rider.status === "OnDelivery" ? "#FF6A00" : "#16A34A"};
      border: 2px solid white;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 14px;
      cursor: pointer;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    `;
    pinEl.textContent = rider.fullName.charAt(0).toUpperCase();

    const marker = new AdvancedMarkerElement({
      map,
      position,
      content: pinEl,
      title: rider.fullName,
    });

    marker.addListener("click", onSelect);
    markerRef.current = marker;

    return () => {
      marker.map = null;
    };
  }, [map, position, rider, onSelect]);

  if (!isSelected) return null;

  return (
    <InfoWindow position={position} onCloseClick={onClose}>
      <div style={{ minWidth: 160, fontSize: 12 }}>
        <strong style={{ fontSize: 13 }}>{rider.fullName}</strong>
        <div style={{ color: "#666", marginTop: 2 }}>
          📍 {rider.assignedZone ?? "Unknown Zone"}
        </div>
        <div style={{ marginTop: 4 }}>
          Status:{" "}
          <span
            style={{
              color: rider.status === "OnDelivery" ? "#FF6A00" : "#16A34A",
              fontWeight: 600,
            }}
          >
            {rider.status}
          </span>
        </div>
        <div style={{ marginTop: 4 }}>
          Active Deliveries: <strong>{riderDeliveries.length}</strong>
        </div>
        {riderDeliveries.slice(0, 2).map((d) => (
          <div
            key={d._id}
            style={{
              marginTop: 4,
              padding: "3px 6px",
              background: "#f5f5f5",
              borderRadius: 4,
              fontSize: 11,
            }}
          >
            {d.orderReference ?? d.trackingNumber ?? d._id}
          </div>
        ))}
      </div>
    </InfoWindow>
  );
};

// ── LiveMapView ────────────────────────────────────────────
// ── LiveMapView ────────────────────────────────────────────
// FIX 4: hoisted outside component — naya array/object literal har render
// pe pass karna useJsApiLoader ko reload trigger karta hai aur kabhi
// window.google.maps.marker undefined reh jata hai.
const MAP_LIBRARIES: "marker"[] = ["marker"];
const MAP_IDS = ["DEMO_MAP_ID"];

interface LiveMapViewProps {
  riders: ApiRider[];
  deliveries: LiveDelivery[];
}

const LiveMapView: React.FC<LiveMapViewProps> = ({ riders, deliveries }) => {
  const [selectedRider, setSelectedRider] = useState<ApiRider | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  // FIX 5: "marker" library load karna zaroori hai AdvancedMarkerElement ke liye.
  // loadError se ApiTargetBlockedMapError jaisi key-restriction issues
  // pehle hi pakdi ja sakti hain, crash hone se pehle.
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    mapIds: MAP_IDS,
    libraries: MAP_LIBRARIES,
  });

  if (loadError) {
    return (
      <div className="map-placeholder">
        <div className="map-badge" style={{ color: "var(--red)" }}>
          Maps load nahi hua. Google Cloud Console mein API key ki
          restrictions (referrer / billing / enabled APIs) check karein.
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="map-placeholder">
        <div className="map-badge">Loading Google Maps...</div>
      </div>
    );
  }

  const getRiderCoords = (rider: ApiRider) => {
    const zone = rider.assignedZone ?? "";
    if (CITY_COORDS[zone]) return CITY_COORDS[zone];
    const key = Object.keys(CITY_COORDS).find((c) =>
      zone.toLowerCase().includes(c.toLowerCase()),
    );
    return key ? CITY_COORDS[key] : DEFAULT_CENTER;
  };

  const getRiderDeliveries = (riderId: string) =>
    deliveries.filter((d) => d.rider?.id === riderId);

  return (
    <div
      style={{
        borderRadius: 10,
        overflow: "hidden",
        border: "1px solid var(--border)",
      }}
    >
      <GoogleMap
        mapContainerStyle={{ width: "100%", height: "420px" }}
        center={DEFAULT_CENTER}
        zoom={11}
        onLoad={(map) => { mapRef.current = map; }} // FIX 2: onLoad added
        options={{
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: true,
          mapId: "DEMO_MAP_ID",
        }}
      >
        {riders.map((rider) => {
          const coords = getRiderCoords(rider);
          const riderDeliveries = getRiderDeliveries(rider._id);

          return (
            <AdvancedMarkerWrapper
              key={rider._id}
              map={mapRef.current}
              position={coords}
              rider={rider}
              riderDeliveries={riderDeliveries}
              isSelected={selectedRider?._id === rider._id}
              onSelect={() => setSelectedRider(rider)}
              onClose={() => setSelectedRider(null)}
            />
          );
        })}
      </GoogleMap>

      {/* Legend */}
      <div
        style={{
          padding: "8px 14px",
          background: "var(--card-bg)",
          borderTop: "1px solid var(--border)",
          display: "flex",
          gap: 16,
          fontSize: 11,
          color: "var(--text-muted)",
        }}
      >
        <span>
          <i
            className="fa-solid fa-circle"
            style={{ color: "#FF6A00", fontSize: 8, marginRight: 4 }}
          />
          On Delivery
        </span>
        <span>
          <i
            className="fa-solid fa-circle"
            style={{ color: "#16A34A", fontSize: 8, marginRight: 4 }}
          />
          Active / Available
        </span>
        <span style={{ marginLeft: "auto" }}>
          {riders.length} riders on map · {deliveries.length} active deliveries
        </span>
      </div>
    </div>
  );
};

// ── ActiveDeliveriesPanel ──────────────────────────────────
const ActiveDeliveriesPanel: React.FC = () => {
  const [innerTab, setInnerTab] = useState("all");
  const [riders, setRiders] = useState<ApiRider[]>([]);
  const [allDeliveries, setAllDeliveries] = useState<LiveDelivery[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const PER_PAGE = 8;

  // ── Fetch all active riders then their active deliveries ──
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const rRes = await ridersAPI.getAll({ limit: 50, status: "Active" });
      const rList: ApiRider[] = rRes.data?.data?.riders ?? [];
      setRiders(rList);

      // FIX 3: removed status param (was causing 400), filter client-side instead
      const activeStatuses = [
        "in_transit",
        "out_for_delivery",
        "assigned",
        "picked_up",
      ];

      const deliveryPromises = rList.map((r) =>
        ridersAPI
          .getDeliveries(r._id, { limit: 20 })
          .then((res) => {
            const deliveries: LiveDelivery[] = (
              res.data?.data?.deliveries ?? []
            )
              .filter((d: any) => activeStatuses.includes(d.currentStatus))
              .map((d: any) => ({
                ...d,
                rider: { id: r._id, name: r.fullName, phone: r.phone },
              }));
            return deliveries;
          })
          .catch(() => [] as LiveDelivery[]),
      );

      const results = await Promise.all(deliveryPromises);
      setAllDeliveries(results.flat());
    } catch (e: any) {
      setError(
        e?.response?.data?.message ?? "Failed to load active deliveries.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // ── Update delivery status ──
  const handleStatusUpdate = async (
    riderId: string,
    deliveryId: string,
    status: string,
  ) => {
    try {
      await ridersAPI.updateDeliveryStatus(riderId, deliveryId, { status });
      load();
    } catch (e: any) {
      alert(e?.response?.data?.message ?? "Failed to update delivery status.");
    }
  };

  // ── Filter / paginate ──
  const filtered = allDeliveries.filter(
    (d) =>
      !search ||
      (d.orderReference ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (d.trackingNumber ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (d.rider?.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (d.customer?.name ?? "").toLowerCase().includes(search.toLowerCase()),
  );
  const delayed = allDeliveries.filter(
    (d) => d.currentStatus === "failed" || d.currentStatus === "delayed",
  );
  const total = filtered.length;
  const start = (page - 1) * PER_PAGE + 1;
  const end = Math.min(page * PER_PAGE, total);
  const pageItems = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <>
      <div className="panel-heading">Active Deliveries</div>
      <div className="panel-desc">
        All deliveries currently in progress by internal riders. Monitor
        real-time location updates, estimated arrival, and flag delays.
      </div>

      {delayed.length > 0 && (
        <div className="alert-strip warn">
          <i className="fa-solid fa-triangle-exclamation" />
          <strong>{delayed.length} deliveries</strong> are running behind
          schedule.
          <button
            className="c-btn"
            style={{ marginLeft: "auto" }}
            onClick={() => setInnerTab("delayed")}
          >
            View Delayed
          </button>
        </div>
      )}

      <InnerTabs
        tabs={[
          { id: "all", label: "All Active" },
          {
            id: "delayed",
            label: (
              <span>
                Delayed{" "}
                {delayed.length > 0 && (
                  <span
                    style={{
                      background: "var(--red-bg)",
                      color: "var(--red)",
                      padding: "1px 5px",
                      borderRadius: 8,
                      fontSize: 9,
                      marginLeft: 3,
                    }}
                  >
                    {delayed.length}
                  </span>
                )}
              </span>
            ),
          },
          { id: "map", label: "Live Map View" },
        ]}
        active={innerTab}
        onChange={(t) => {
          setInnerTab(t);
          setPage(1);
        }}
      />

      {/* ── ALL ACTIVE ── */}
      {innerTab === "all" && (
        <div className="card">
          <div className="c-toolbar">
            <div className="c-toolbar-left">
              <div className="c-search">
                <i className="fa-solid fa-magnifying-glass" />
                <input
                  placeholder="Search order or rider..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
              <button className="c-btn" onClick={load}>
                <i className="fa-solid fa-rotate" /> Refresh
              </button>
            </div>
            <div className="c-toolbar-right">
              <span style={{ fontSize: 10.5, color: "var(--text-muted)" }}>
                {loading ? "Loading…" : `${allDeliveries.length} active`}
              </span>
            </div>
          </div>

          {error && (
            <div className="alert-strip danger" style={{ borderRadius: 0 }}>
              <i className="fa-solid fa-circle-exclamation" /> {error}
              <button
                className="c-btn"
                style={{ marginLeft: "auto" }}
                onClick={load}
              >
                Retry
              </button>
            </div>
          )}

          <div className="tbl-wrap">
            <table>
              <thead>
                <tr>
                  <th>Order Ref</th>
                  <th>Tracking #</th>
                  <th>Rider</th>
                  <th>Customer</th>
                  <th>City</th>
                  <th>COD</th>
                  <th>ETA</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableSkeleton rows={6} cols={9} />
                ) : pageItems.length === 0 ? (
                  <tr>
                    <td colSpan={9}>
                      <EmptyState
                        icon="fa-truck"
                        title="No Active Deliveries"
                        desc="All riders are currently idle or no deliveries match your search."
                      />
                    </td>
                  </tr>
                ) : (
                  pageItems.map((d) => {
                    const rider = riders.find((r) => r._id === d.rider?.id);
                    return (
                      <tr key={d._id}>
                        <td>
                          <strong>{d.orderReference ?? "—"}</strong>
                        </td>
                        <td>
                          <code className="sku">
                            {d.trackingNumber ?? "—"}
                          </code>
                        </td>
                        <td>
                          <div className="td-flex">
                            {rider && (
                              <ApiRiderAvatar
                                rider={rider}
                                size={22}
                                fontSize={8}
                              />
                            )}
                            <span>{d.rider?.name?.split(" ")[0] ?? "—"}</span>
                          </div>
                        </td>
                        <td>
                          <div>
                            <div style={{ fontWeight: 600 }}>
                              {d.customer?.name ?? "—"}
                            </div>
                            <div className="td-sub">
                              {d.customer?.phone ?? ""}
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="tag">
                            {d.shippingAddress?.city ?? "—"}
                          </span>
                        </td>
                        <td>
                          <strong>
                            {d.codAmount
                              ? `₨${Number(d.codAmount).toLocaleString()}`
                              : "—"}
                          </strong>
                        </td>
                        <td style={{ fontSize: 10.5 }}>
                          {d.estimatedDelivery
                            ? new Date(d.estimatedDelivery).toLocaleTimeString(
                                "en-GB",
                                { hour: "2-digit", minute: "2-digit" },
                              )
                            : "—"}
                        </td>
                        <td>
                          <span
                            style={{
                              fontSize: 10.5,
                              fontWeight: 600,
                              color:
                                STATUS_COLOR[d.currentStatus] ??
                                "var(--text-muted)",
                            }}
                          >
                            {fmtStatus(d.currentStatus)}
                          </span>
                        </td>
                        <td style={{ display: "flex", gap: 3 }}>
                          <button
                            className="c-btn"
                            style={{ height: 22, fontSize: 9.5 }}
                            title="Track"
                          >
                            <i className="fa-solid fa-location-dot" />
                          </button>
                          {d.rider?.id && (
                            <button
                              className="c-btn"
                              style={{ height: 22, fontSize: 9.5 }}
                              title="Mark Out for Delivery"
                              onClick={() =>
                                handleStatusUpdate(
                                  d.rider!.id,
                                  d._id,
                                  "out_for_delivery",
                                )
                              }
                            >
                              <i className="fa-solid fa-truck" />
                            </button>
                          )}
                          {d.rider?.id && (
                            <button
                              className="c-btn"
                              style={{
                                height: 22,
                                fontSize: 9.5,
                                color: "var(--green)",
                              }}
                              title="Mark Delivered"
                              onClick={() =>
                                handleStatusUpdate(
                                  d.rider!.id,
                                  d._id,
                                  "delivered",
                                )
                              }
                            >
                              <i className="fa-solid fa-check" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <CPagination
            current={page}
            total={Math.ceil(total / PER_PAGE)}
            totalItems={total}
            start={start}
            end={end}
            onChange={setPage}
          />
        </div>
      )}

      {/* ── DELAYED ── */}
      {innerTab === "delayed" && (
        <>
          <div className="alert-strip danger">
            <i className="fa-solid fa-clock" />
            The following deliveries are past their expected time. Contact
            riders immediately.
          </div>
          <div className="card">
            {loading ? (
              <div className="card-body">
                <EmptyState
                  icon="fa-spinner"
                  title="Loading..."
                  desc="Fetching delayed deliveries."
                />
              </div>
            ) : delayed.length === 0 ? (
              <div className="card-body">
                <EmptyState
                  icon="fa-circle-check"
                  title="No Delayed Deliveries"
                  desc="All active deliveries are on schedule."
                />
              </div>
            ) : (
              <div className="tbl-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Order Ref</th>
                      <th>Rider</th>
                      <th>Customer</th>
                      <th>City</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {delayed.map((d) => (
                      <tr key={d._id}>
                        <td>
                          <strong>
                            {d.orderReference ?? d.trackingNumber ?? "—"}
                          </strong>
                        </td>
                        <td>{d.rider?.name ?? "—"}</td>
                        <td>{d.customer?.name ?? "—"}</td>
                        <td>
                          <span className="tag">
                            {d.shippingAddress?.city ?? "—"}
                          </span>
                        </td>
                        <td>
                          <span
                            style={{
                              fontSize: 10.5,
                              fontWeight: 600,
                              color: "var(--red)",
                            }}
                          >
                            {fmtStatus(d.currentStatus)}
                          </span>
                        </td>
                        <td>
                          <button
                            className="c-btn"
                            style={{ height: 22, fontSize: 9.5 }}
                          >
                            <i className="fa-solid fa-phone" /> Contact
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── MAP ── */}
      {innerTab === "map" && (
        <LiveMapView riders={riders} deliveries={allDeliveries} />
      )}
    </>
  );
};

export default ActiveDeliveriesPanel;