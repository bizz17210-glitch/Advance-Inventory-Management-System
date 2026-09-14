// ═══════════════════════════════════════════════════════════
// ReportsPage.tsx  —  Shell only; each tab lives in its own file
// ═══════════════════════════════════════════════════════════
import React, { useState } from "react";
import "./ReportsPage.css";
import TopLoadingBar from "../../components/ui/TopLoadingBar";
import { usePageLoading } from "../../hooks/usePageLoading";
import { useTabLoading } from "../../hooks/useTabLoading";

import SalesReportsTab from "./SalesReportsTab";
import InventoryReportsTab from "./InventoryReportsTab";
import FinancialReportsTab from "./FinancialReportsTab";
import StaffReportsTab from "./StaffReportsTab";
import ExportDataTab from "./ExportDataTab";

import { ReportTab } from "./ReportsShared";

// ── Tab config ───────────────────────────────────────────────
const TABS: { id: ReportTab; icon: string; label: string }[] = [
  { id: "sales", icon: "fa-chart-line", label: "Sales Reports" },
  { id: "inventory", icon: "fa-boxes-stacked", label: "Inventory Reports" },
  { id: "financial", icon: "fa-coins", label: "Financial Reports" },
  { id: "staff", icon: "fa-users-gear", label: "Staff Reports" },
  { id: "export", icon: "fa-file-export", label: "Export Data" },
];

// ── Page ─────────────────────────────────────────────────────
const ReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ReportTab>("sales");
  const { isLoading, loadingProgress, switchTab } = useTabLoading(
    setActiveTab,
    activeTab,
  );

  return (
    <div id="page-reports">
      <TopLoadingBar progress={loadingProgress} isLoading={isLoading} />

      <div className="section-heading">Reports &amp; Analytics</div>
      <div className="section-subheading">
        Track sales performance, monitor inventory health, review financials,
        and export data across all operations in real time.
      </div>

      {/* Horizontal Tabs */}
      <div className="h-tabs">
        {TABS.map((t) => (
          <div
            key={t.id}
            className={`h-tab ${activeTab === t.id ? "active" : ""}`}
            onClick={() => switchTab(t.id)}
          >
            <i className={`fa-solid ${t.icon}`} /> {t.label}
          </div>
        ))}
      </div>

      {/* Tab Panels */}
      {activeTab === "sales" && <SalesReportsTab />}
      {activeTab === "inventory" && <InventoryReportsTab />}
      {activeTab === "financial" && <FinancialReportsTab />}
      {activeTab === "staff" && <StaffReportsTab />}
      {activeTab === "export" && <ExportDataTab />}
    </div>
  );
};

export default ReportsPage;
