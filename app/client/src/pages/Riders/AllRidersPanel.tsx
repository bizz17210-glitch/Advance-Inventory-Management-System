// AllRidersPanel.tsx — dynamic
import React, { useState, useEffect, useCallback } from "react";
import {
  NavPanel,
  ApiRider,
  ApiPagination,
  SCHEDULE_DATA,
  rColor,
  initials,
  avatarColorFromName,
  isRiderOnline,
  riderStatusLabel,
  Badge,
  PerfBar,
  StarRating,
  ApiRiderAvatar,
  DayBadge,
  InnerTabs,
  CPagination,
  EmptyState,
  TableSkeleton,
} from "./shared";
import { ridersAPI } from "../../services/api";

// ── Rider Documents Tab ──────────────────────────────────────────────────────
const DOC_TYPES = [
  "CNIC",
  "License",
  "VehicleRegistration",
  "Insurance",
] as const;
type DocType = (typeof DOC_TYPES)[number];

interface RiderDoc {
  _id?: string;
  type: DocType;
  url: string;
  uploadedAt: string;
}

interface RiderWithDocs {
  _id: string;
  fullName: string;
  documents: RiderDoc[];
}

const RiderDocumentsTab: React.FC<{ ridersAPI: typeof ridersAPI }> = ({
  ridersAPI,
}) => {
  const [riders, setRiders] = useState<RiderWithDocs[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [selectedRiderId, setSelectedRiderId] = useState("");
  const [selectedDocType, setSelectedDocType] = useState<DocType>("CNIC");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const fetchRidersWithDocs = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await ridersAPI.getAll({ limit: 100 });
      const data = res.data?.data?.riders ?? [];
      setRiders(
        data.map((r: any) => ({
          _id: r._id,
          fullName: r.fullName,
          documents: r.documents ?? [],
        })),
      );
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Failed to load riders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRidersWithDocs();
  }, []);

  const handleUpload = async () => {
    if (!selectedRiderId) {
      setUploadError("Please select a rider.");
      return;
    }
    if (!selectedFile) {
      setUploadError("Please select a file.");
      return;
    }
    setUploading(true);
    setUploadError("");
    setUploadSuccess("");
    try {
      const formData = new FormData();
      formData.append("document", selectedFile);
      formData.append("type", selectedDocType);
      await ridersAPI.uploadDocument(selectedRiderId, formData);
      setUploadSuccess("Document uploaded successfully!");
      setShowUpload(false);
      setSelectedFile(null);
      setSelectedRiderId("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      fetchRidersWithDocs();
      setTimeout(() => setUploadSuccess(""), 3000);
    } catch (e: any) {
      setUploadError(e?.response?.data?.message ?? "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (
    riderId: string,
    docIndex: number,
    docType: string,
  ) => {
    if (!window.confirm(`Delete ${docType} document?`)) return;
    try {
      await ridersAPI.deleteDocument(riderId, docIndex);
      fetchRidersWithDocs();
    } catch (e: any) {
      alert(e?.response?.data?.message ?? "Failed to delete document.");
    }
  };

  const allRows: { rider: RiderWithDocs; doc: RiderDoc; docIndex: number }[] =
    [];
  riders.forEach((r) => {
    r.documents.forEach((doc, i) => {
      allRows.push({ rider: r, doc, docIndex: i });
    });
  });

  const getDocStatus = (doc: RiderDoc): string => {
    const uploaded = new Date(doc.uploadedAt);
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - uploaded.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (diffDays > 365) return "Expired";
    if (diffDays > 300) return "Expiring Soon";
    return "Valid";
  };

  const getFileNameFromUrl = (url: string): string => {
    try {
      const parts = url.split("/");
      return parts[parts.length - 1].split("?")[0];
    } catch {
      return "document";
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">
          <i className="fa-solid fa-file-alt" /> Rider Documents
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button className="c-btn" onClick={fetchRidersWithDocs}>
            <i className="fa-solid fa-rotate" /> Refresh
          </button>
          <button
            className="c-btn primary"
            onClick={() => {
              setShowUpload(true);
              setUploadError("");
              setUploadSuccess("");
            }}
          >
            <i className="fa-solid fa-upload" /> Upload Document
          </button>
        </div>
      </div>

      {uploadSuccess && (
        <div className="alert-strip success" style={{ margin: "0 0 8px 0" }}>
          <i className="fa-solid fa-circle-check" /> {uploadSuccess}
        </div>
      )}

      {showUpload && (
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            padding: 16,
            margin: "0 0 12px 0",
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              marginBottom: 12,
              color: "var(--text-primary)",
            }}
          >
            <i
              className="fa-solid fa-upload"
              style={{ marginRight: 6, color: "var(--accent)" }}
            />
            Upload Document
          </div>
          <div className="c-form-row">
            <div className="c-form-group">
              <div className="c-form-label">Select Rider *</div>
              <select
                className="c-form-select"
                value={selectedRiderId}
                onChange={(e) => setSelectedRiderId(e.target.value)}
              >
                <option value="">— Choose Rider —</option>
                {riders.map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.fullName}
                  </option>
                ))}
              </select>
            </div>
            <div className="c-form-group">
              <div className="c-form-label">Document Type *</div>
              <select
                className="c-form-select"
                value={selectedDocType}
                onChange={(e) => setSelectedDocType(e.target.value as DocType)}
              >
                {DOC_TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="c-form-group" style={{ marginBottom: 12 }}>
            <div className="c-form-label">
              File * (JPG, PNG, WebP, PDF — max 10MB)
            </div>
            <input
              ref={fileInputRef}
              type="file"
              className="c-form-input"
              accept=".jpg,.jpeg,.png,.webp,.pdf"
              onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
              style={{ padding: "4px 8px" }}
            />
            {selectedFile && (
              <div
                style={{
                  fontSize: 10,
                  color: "var(--text-muted)",
                  marginTop: 4,
                }}
              >
                <i className="fa-solid fa-file" style={{ marginRight: 4 }} />
                {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
              </div>
            )}
          </div>
          {uploadError && (
            <div
              className="alert-strip danger"
              style={{ marginBottom: 8, fontSize: 11 }}
            >
              <i className="fa-solid fa-circle-exclamation" /> {uploadError}
            </div>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="c-btn primary"
              onClick={handleUpload}
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin" /> Uploading…
                </>
              ) : (
                <>
                  <i className="fa-solid fa-check" /> Upload
                </>
              )}
            </button>
            <button
              className="c-btn"
              onClick={() => {
                setShowUpload(false);
                setSelectedFile(null);
                setUploadError("");
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div
          style={{
            padding: 32,
            textAlign: "center",
            color: "var(--text-muted)",
            fontSize: 13,
          }}
        >
          <i
            className="fa-solid fa-spinner fa-spin"
            style={{ marginRight: 8 }}
          />
          Loading documents…
        </div>
      ) : error ? (
        <div className="alert-strip danger" style={{ margin: 12 }}>
          <i className="fa-solid fa-circle-exclamation" /> {error}
          <button
            className="c-btn"
            style={{ marginLeft: "auto" }}
            onClick={fetchRidersWithDocs}
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="tbl-wrap">
          <table>
            <thead>
              <tr>
                <th>Rider</th>
                <th>Document Type</th>
                <th>File</th>
                <th>Status</th>
                <th>Uploaded</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {allRows.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyState
                      icon="fa-file-alt"
                      title="No documents uploaded"
                      desc="Upload CNIC, License, or Vehicle Registration for your riders."
                    />
                  </td>
                </tr>
              ) : (
                allRows.map(({ rider, doc, docIndex }) => {
                  const status = getDocStatus(doc);
                  return (
                    <tr key={`${rider._id}-${docIndex}`}>
                      <td>
                        <strong>{rider.fullName}</strong>
                      </td>
                      <td>
                        <span className="tag">
                          <i
                            className="fa-solid fa-file"
                            style={{ fontSize: 9, marginRight: 4 }}
                          />
                          {doc.type}
                        </span>
                      </td>
                      <td>
                        <code className="sku">
                          {getFileNameFromUrl(doc.url)}
                        </code>
                      </td>
                      <td>
                        <Badge label={status} />
                      </td>
                      <td>{new Date(doc.uploadedAt).toLocaleDateString()}</td>
                      <td style={{ display: "flex", gap: 4 }}>
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="c-btn"
                          style={{ height: 22, fontSize: 9.5 }}
                          title="View"
                        >
                          <i className="fa-solid fa-eye" />
                        </a>
                        <button
                          className="c-btn"
                          style={{
                            height: 22,
                            fontSize: 9.5,
                            color: "var(--red)",
                          }}
                          title="Delete"
                          onClick={() =>
                            handleDelete(rider._id, docIndex, doc.type)
                          }
                        >
                          <i className="fa-solid fa-trash" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

interface Props {
  onNav: (p: NavPanel) => void;
  onOpenRider: (r: ApiRider) => void;
}

const AllRidersPanel: React.FC<Props> = ({ onNav, onOpenRider }) => {
  const [innerTab, setInnerTab] = useState("grid");
  const [riders, setRiders] = useState<ApiRider[]>([]);
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
  const PER_PAGE = 12;

  const fetchRiders = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, any> = { page, limit: PER_PAGE };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const res = await ridersAPI.getAll(params);
      const data = res.data?.data;
      setRiders(data?.riders ?? []);
      setPagination(
        data?.pagination ?? {
          currentPage: 1,
          totalPages: 1,
          totalItems: 0,
          itemsPerPage: PER_PAGE,
        },
      );
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Failed to load riders.");
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    if (innerTab === "grid" || innerTab === "table") fetchRiders();
  }, [fetchRiders, innerTab]);

  const handleStatusUpdate = async (riderId: string, status: string) => {
    try {
      await ridersAPI.updateStatus(riderId, { status });
      fetchRiders();
    } catch (e: any) {
      alert(e?.response?.data?.message ?? "Failed to update status.");
    }
  };

  const handleDelete = async (riderId: string) => {
    if (!window.confirm("Deactivate this rider?")) return;
    try {
      await ridersAPI.delete(riderId);
      fetchRiders();
    } catch (e: any) {
      alert(e?.response?.data?.message ?? "Failed to deactivate rider.");
    }
  };

  const { currentPage, totalPages, totalItems } = pagination;
  const start = (currentPage - 1) * PER_PAGE + 1;
  const end = Math.min(currentPage * PER_PAGE, totalItems);

  const activeCount = riders.filter((r) => r.status === "Active").length;
  const onlineCount = riders.filter((r) => isRiderOnline(r)).length;

  return (
    <>
      <div className="panel-heading">All Riders</div>
      <div className="panel-desc">
        Full directory of internal delivery riders. View profiles, contact
        details, vehicle info, and current status.
      </div>

      <div className="mini-stats">
        <div className="mini-stat">
          <div className="ms-label">Total Riders</div>
          <div className="ms-value">{loading ? "…" : totalItems}</div>
          <div className="ms-trend">{activeCount} active</div>
        </div>
        <div className="mini-stat">
          <div className="ms-label">Online Now</div>
          <div className="ms-value">{loading ? "…" : onlineCount}</div>
          <div className="ms-trend up">
            <i
              className="fa-solid fa-circle"
              style={{ color: "var(--green)", fontSize: 7 }}
            />{" "}
            This page
          </div>
        </div>
        <div className="mini-stat">
          <div className="ms-label">Available</div>
          <div className="ms-value">
            {loading ? "…" : riders.filter((r) => r.isAvailable).length}
          </div>
          <div className="ms-trend up">Ready for dispatch</div>
        </div>
        <div className="mini-stat">
          <div className="ms-label">On Delivery</div>
          <div className="ms-value">
            {loading
              ? "…"
              : riders.filter((r) => r.status === "OnDelivery").length}
          </div>
          <div className="ms-trend">Active routes</div>
        </div>
      </div>

      <InnerTabs
        tabs={[
          { id: "grid", label: "Grid View" },
          { id: "table", label: "Table View" },
          { id: "docs", label: "Documents" },
          // { id: "schedule", label: "Schedules" },
        ]}
        active={innerTab}
        onChange={(t) => {
          setInnerTab(t);
          setPage(1);
        }}
      />

      {/* ── GRID VIEW ── */}
      {innerTab === "grid" && (
        <>
          <div
            className="c-toolbar"
            style={{
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-card) var(--radius-card) 0 0",
              borderBottom: "1px solid var(--divider)",
            }}
          >
            <div className="c-toolbar-left">
              <div className="c-search">
                <i className="fa-solid fa-magnifying-glass" />
                <input
                  placeholder="Search rider..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
              {(
                ["", "Active", "Inactive", "OnDelivery", "OnLeave"] as const
              ).map((f) => (
                <button
                  key={f}
                  className={`c-btn ${statusFilter === f ? "active" : ""}`}
                  onClick={() => {
                    setStatusFilter(f);
                    setPage(1);
                  }}
                >
                  {f === "" ? "All" : riderStatusLabel(f)}
                </button>
              ))}
            </div>
            <div className="c-toolbar-right">
              <button className="c-btn" onClick={fetchRiders}>
                <i className="fa-solid fa-rotate" /> Refresh
              </button>
              <button className="c-btn primary" onClick={() => onNav("add")}>
                <i className="fa-solid fa-plus" /> Add Rider
              </button>
            </div>
          </div>

          {error && (
            <div className="alert-strip danger" style={{ borderRadius: 0 }}>
              <i className="fa-solid fa-circle-exclamation" /> {error}
              <button
                className="c-btn"
                style={{ marginLeft: "auto" }}
                onClick={fetchRiders}
              >
                Retry
              </button>
            </div>
          )}

          {loading ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3,1fr)",
                gap: 12,
                padding: "12px 0",
              }}
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="card" style={{ padding: 14 }}>
                  <div
                    style={{
                      height: 36,
                      width: 36,
                      borderRadius: "50%",
                      background: "#F3F4F6",
                      marginBottom: 8,
                    }}
                  />
                  <div
                    style={{
                      height: 12,
                      background: "#F3F4F6",
                      borderRadius: 4,
                      width: "60%",
                      marginBottom: 6,
                    }}
                  />
                  <div
                    style={{
                      height: 10,
                      background: "#F3F4F6",
                      borderRadius: 4,
                      width: "40%",
                    }}
                  />
                </div>
              ))}
            </div>
          ) : riders.length === 0 ? (
            <div className="card">
              <div className="card-body">
                <EmptyState
                  icon="fa-person-biking"
                  title="No riders found"
                  desc="No riders match your current filters."
                />
              </div>
            </div>
          ) : (
            <div className="rider-grid">
              {riders.map((r) => {
                const rate = parseFloat(r.completionRate ?? "0");
                return (
                  <div
                    className="rider-card"
                    key={r._id}
                    onClick={() => onOpenRider(r)}
                  >
                    <div className="rider-card-status">
                      <Badge label={riderStatusLabel(r.status)} />
                    </div>
                    <div className="rider-card-top">
                      <ApiRiderAvatar rider={r} size={36} fontSize={12} />
                      <div>
                        <div className="rider-card-name">{r.fullName}</div>
                        <div className="rider-card-id">
                          <i
                            className="fa-solid fa-person-biking"
                            style={{ fontSize: 9, color: "var(--text-muted)" }}
                          />{" "}
                          {r.assignedZone ?? "—"}
                        </div>
                      </div>
                    </div>
                    <div className="rider-card-stats">
                      <div className="rider-stat">
                        <div className="rider-stat-val">
                          {r.performanceMetrics?.totalDeliveries ?? "—"}
                        </div>
                        <div className="rider-stat-lbl">Deliveries</div>
                      </div>
                      <div className="rider-stat">
                        <div className="rider-stat-val">
                          {r.completionRate
                            ? `${parseFloat(r.completionRate).toFixed(0)}%`
                            : "—"}
                        </div>
                        <div className="rider-stat-lbl">Completion</div>
                      </div>
                      <div className="rider-stat">
                        <div className="rider-stat-val">
                          {r.activeDeliveries ?? 0}
                        </div>
                        <div className="rider-stat-lbl">Active</div>
                      </div>
                      <div className="rider-stat">
                        <div className="rider-stat-val">
                          {r.isAvailable ? (
                            <span style={{ color: "var(--green)" }}>Yes</span>
                          ) : (
                            "No"
                          )}
                        </div>
                        <div className="rider-stat-lbl">Available</div>
                      </div>
                    </div>
                    <div className="rider-card-footer">
                      <div style={{ fontSize: 10, color: "var(--text-muted)" }}>
                        <i
                          className="fa-solid fa-motorcycle"
                          style={{ fontSize: 9 }}
                        />{" "}
                        {r.vehicle?.type ?? "—"} ·{" "}
                        {r.vehicle?.registrationNumber ?? "—"}
                      </div>
                      <span className="tag" style={{ fontSize: 9 }}>
                        {r.serviceCities?.[0] ?? r.assignedZone ?? "—"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {totalPages > 1 && (
            <div style={{ marginTop: 8 }}>
              <CPagination
                current={currentPage}
                total={totalPages}
                totalItems={totalItems}
                start={start}
                end={end}
                onChange={setPage}
              />
            </div>
          )}
        </>
      )}

      {/* ── TABLE VIEW ── */}
      {innerTab === "table" && (
        <div className="card">
          <div className="c-toolbar">
            <div className="c-toolbar-left">
              <div className="c-search">
                <i className="fa-solid fa-magnifying-glass" />
                <input
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
              {(["", "Active", "Inactive", "OnDelivery"] as const).map((f) => (
                <button
                  key={f}
                  className={`c-btn ${statusFilter === f ? "active" : ""}`}
                  onClick={() => {
                    setStatusFilter(f);
                    setPage(1);
                  }}
                >
                  {f === "" ? "All" : riderStatusLabel(f)}
                </button>
              ))}
            </div>
            <div className="c-toolbar-right">
              <button className="c-btn" onClick={fetchRiders}>
                <i className="fa-solid fa-rotate" /> Refresh
              </button>
              <button className="c-btn">
                <i className="fa-solid fa-file-export" /> Export
              </button>
              <button className="c-btn primary" onClick={() => onNav("add")}>
                <i className="fa-solid fa-plus" /> Add Rider
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
                  <th>Rider</th>
                  <th>Phone</th>
                  <th>Vehicle</th>
                  <th>Zone</th>
                  <th>Total Deliveries</th>
                  <th>Completion %</th>
                  <th>Active Deliveries</th>
                  <th>Status</th>
                  <th>Available</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableSkeleton rows={8} cols={11} />
                ) : error ? (
                  <tr>
                    <td
                      colSpan={11}
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
                        onClick={fetchRiders}
                      >
                        Retry
                      </button>
                    </td>
                  </tr>
                ) : riders.length === 0 ? (
                  <tr>
                    <td colSpan={11}>
                      <EmptyState
                        icon="fa-person-biking"
                        title="No riders found"
                        desc="No riders match your search."
                      />
                    </td>
                  </tr>
                ) : (
                  riders.map((r) => {
                    const rate = parseFloat(r.completionRate ?? "0");
                    return (
                      <tr key={r._id} onClick={() => onOpenRider(r)}>
                        <td onClick={(e) => e.stopPropagation()}>
                          <input type="checkbox" />
                        </td>
                        <td>
                          <div className="td-flex">
                            <ApiRiderAvatar rider={r} fontSize={9} />
                            <div>
                              <div style={{ fontWeight: 600 }}>
                                {r.fullName}
                              </div>
                              <div className="td-sub">{r.email ?? r.phone}</div>
                            </div>
                          </div>
                        </td>
                        <td>{r.phone}</td>
                        <td>
                          <span className="tag">
                            <i
                              className="fa-solid fa-motorcycle"
                              style={{ fontSize: 9, marginRight: 3 }}
                            />
                            {r.vehicle?.type ?? "—"}
                          </span>
                        </td>
                        <td>
                          <span className="tag">{r.assignedZone ?? "—"}</span>
                        </td>
                        <td>{r.performanceMetrics?.totalDeliveries ?? "—"}</td>
                        <td>
                          <PerfBar pct={rate} color={rColor(rate)} />
                        </td>
                        <td>{r.activeDeliveries ?? "—"}</td>
                        <td>
                          <Badge label={riderStatusLabel(r.status)} />
                        </td>
                        <td>
                          <span
                            style={{
                              fontSize: 10.5,
                              color: r.isAvailable
                                ? "var(--green)"
                                : "var(--text-muted)",
                              fontWeight: 600,
                            }}
                          >
                            {r.isAvailable ? "Yes" : "No"}
                          </span>
                        </td>
                        <td
                          onClick={(e) => e.stopPropagation()}
                          style={{ display: "flex", gap: 3 }}
                        >
                          <button
                            className="c-btn"
                            style={{ height: 23, fontSize: 9.5 }}
                            onClick={() => onOpenRider(r)}
                          >
                            <i className="fa-solid fa-eye" />
                          </button>
                          <button
                            className="c-btn"
                            style={{
                              height: 23,
                              fontSize: 9.5,
                              color:
                                r.status === "Active"
                                  ? "var(--yellow)"
                                  : "var(--green)",
                            }}
                            title={
                              r.status === "Active"
                                ? "Set On Leave"
                                : "Set Active"
                            }
                            onClick={() =>
                              handleStatusUpdate(
                                r._id,
                                r.status === "Active" ? "OnLeave" : "Active",
                              )
                            }
                          >
                            <i
                              className={`fa-solid fa-${r.status === "Active" ? "pause" : "play"}`}
                            />
                          </button>
                          <button
                            className="c-btn"
                            style={{
                              height: 23,
                              fontSize: 9.5,
                              color: "var(--red)",
                            }}
                            title="Deactivate"
                            onClick={() => handleDelete(r._id)}
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
      )}

      {/* ── DOCUMENTS (static) ── */}
      {/* {innerTab === "docs" && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <i className="fa-solid fa-file-alt" /> Rider Documents
            </div>
            <button className="c-btn primary">
              <i className="fa-solid fa-upload" /> Upload Document
            </button>
          </div>
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr>
                  <th>Rider</th>
                  <th>Document Type</th>
                  <th>File Name</th>
                  <th>Expiry Date</th>
                  <th>Status</th>
                  <th>Uploaded</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {DOCS_DATA.map((d, i) => (
                  <tr key={i}>
                    <td>
                      <strong>{d.rider}</strong>
                    </td>
                    <td>{d.type}</td>
                    <td>
                      <code className="sku">{d.file}</code>
                    </td>
                    <td>{d.expiry}</td>
                    <td>
                      <Badge label={d.status} />
                    </td>
                    <td>{d.uploaded}</td>
                    <td>
                      <button
                        className="c-btn"
                        style={{ height: 22, fontSize: 9.5 }}
                      >
                        <i className="fa-solid fa-eye" />
                      </button>
                      <button
                        className="c-btn"
                        style={{
                          height: 22,
                          fontSize: 9.5,
                          marginLeft: 3,
                          color: "var(--red)",
                        }}
                      >
                        <i className="fa-solid fa-trash" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )} */}
      {/* ── DOCUMENTS (dynamic) ── */}
      {innerTab === "docs" && <RiderDocumentsTab ridersAPI={ridersAPI} />}

      {/* ── SCHEDULE (static) ── */}
      {innerTab === "schedule" && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <i className="fa-solid fa-calendar-alt" /> Shift Schedule
              Configuration
            </div>
            <button className="c-btn primary">
              <i className="fa-solid fa-plus" /> Add Shift
            </button>
          </div>
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr>
                  <th>Rider</th>
                  <th>Mon</th>
                  <th>Tue</th>
                  <th>Wed</th>
                  <th>Thu</th>
                  <th>Fri</th>
                  <th>Sat</th>
                  <th>Sun</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {SCHEDULE_DATA.map((s) => (
                  <tr key={s.rider}>
                    <td>
                      <strong>{s.rider.split(" ")[0]}</strong>
                    </td>
                    {s.days.map((d, i) => (
                      <td key={i} style={{ textAlign: "center" }}>
                        <DayBadge d={d} />
                      </td>
                    ))}
                    <td>
                      <button
                        className="c-btn"
                        style={{ height: 22, fontSize: 9.5 }}
                      >
                        <i className="fa-solid fa-pen" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
};

export default AllRidersPanel;
