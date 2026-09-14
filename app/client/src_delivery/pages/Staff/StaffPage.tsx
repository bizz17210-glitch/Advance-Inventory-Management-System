// ═══════════════════════════════════════════════════════════
// StaffPage.tsx — Main page shell (tabs only, no logic here)
// ═══════════════════════════════════════════════════════════

import React, { useState } from "react";
import "./StaffPage.css";

import TopLoadingBar from "../../components/ui/TopLoadingBar";
import { useTabLoading } from "../../hooks/useTabLoading";
import { StaffTab } from "./staff.types";

import StaffMembersTab from "./StaffMembersTab";
import RolesTab from "./RolesTab";
import PerformanceTab from "./PerformanceTab";
import ActivityTab from "./ActivityTab";
import IntegrationsTab from "./IntegrationsTab";

const TABS: { id: StaffTab; icon: string; label: string }[] = [
  { id: "members", icon: "fa-users-gear", label: "Staff Members" },
  { id: "roles", icon: "fa-shield-halved", label: "Roles & Access" },
  { id: "performance", icon: "fa-chart-simple", label: "Performance" },
  { id: "activity", icon: "fa-clock-rotate-left", label: "Activity Log" },
  { id: "integrations", icon: "fa-plug", label: "Integrations" },
];

const StaffPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<StaffTab>("members");
  const { isLoading, loadingProgress, switchTab } = useTabLoading(
    setActiveTab,
    activeTab,
  );

  return (
    <div id="page-staff">
      <TopLoadingBar progress={loadingProgress} isLoading={isLoading} />

      <div className="section-heading">Staff &amp; Roles</div>
      <div className="section-subheading">
        Manage your team members, define role-based permissions, track
        performance metrics, and monitor staff activity across all operations.
      </div>

      {/* ── Tab Bar ─────────────────────────────────────── */}
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

      {/* ── Tab Content ─────────────────────────────────── */}
      {activeTab === "members" && <StaffMembersTab />}
      {activeTab === "roles" && <RolesTab />}
      {activeTab === "performance" && <PerformanceTab />}
      {activeTab === "activity" && <ActivityTab />}
      {activeTab === "integrations" && <IntegrationsTab />}
    </div>
  );
};

export default StaffPage;
