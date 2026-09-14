import React, { useState } from "react";
import "./SettingsPage.css";
import TopLoadingBar from "../../components/ui/TopLoadingBar";
import { useTabLoading } from "../../hooks/useTabLoading";

// ── Tab imports ────────────────────────────────────────────
import GeneralTab from "./GeneralTab";
import BusinessTab from "./BusinessTab";
import OrdersTab from "./OrdersTab";
import InventorySettingsTab from "./InventorySettingsTab";
import NotificationsTab from "./NotificationsTab";
import IntegrationsTab from "./IntegrationsTab";
import UsersTab from "./UsersTab";
import SecurityTab from "./SecurityTab";
import BackupTab from "./BackupTab";

// ── Types ──────────────────────────────────────────────────

type SettingsTab =
  | "general"
  | "business"
  | "orders"
  | "inventory"
  | "notifications"
  | "integrations"
  | "users"
  | "security"
  | "backup";

// ── SettingsPage ───────────────────────────────────────────

const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");
  const { isLoading, loadingProgress, switchTab } = useTabLoading(
    setActiveTab,
    activeTab,
  );

  const tabs: { id: SettingsTab; icon: string; label: string }[] = [
    { id: "general", icon: "fa-sliders", label: "General" },
    { id: "business", icon: "fa-store", label: "Business Profile" },
    { id: "orders", icon: "fa-bag-shopping", label: "Orders" },
    { id: "inventory", icon: "fa-warehouse", label: "Inventory" },
    { id: "notifications", icon: "fa-bell", label: "Notifications" },
    { id: "integrations", icon: "fa-plug", label: "Integrations" },
    { id: "users", icon: "fa-users-gear", label: "Users & Access" },
    { id: "security", icon: "fa-shield-halved", label: "Security" },
    { id: "backup", icon: "fa-database", label: "Backup & Data" },
  ];

  return (
    <div id="page-settings">
      <TopLoadingBar progress={loadingProgress} isLoading={isLoading} />
      <div className="section-heading">Settings</div>
      <div className="section-subheading">
        Configure system-wide preferences, business information, integrations,
        and operational defaults for your inventory management system.
      </div>

      {/* Horizontal Tabs */}
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

      {/* Tab Panels */}
      {activeTab === "general" && <GeneralTab />}
      {activeTab === "business" && <BusinessTab />}
      {activeTab === "orders" && <OrdersTab />}
      {activeTab === "inventory" && <InventorySettingsTab />}
      {activeTab === "notifications" && <NotificationsTab />}
      {activeTab === "integrations" && <IntegrationsTab />}
      {activeTab === "users" && <UsersTab />}
      {activeTab === "security" && <SecurityTab />}
      {activeTab === "backup" && <BackupTab />}
    </div>
  );
};

export default SettingsPage;
