import React, { useState, useCallback } from "react";
import "./FinancePage.css";
import TopLoadingBar from "../../components/ui/TopLoadingBar";
import { useTabLoading } from "../../hooks/useTabLoading";
import OverviewPanel from "./OverviewPanel";
import CODPanel from "./CODPanel";
import CODLogPanel from "./CODLogPanel";
import PrepaidPanel from "./PrepaidPanel";
import ExpensesPanel from "./ExpensesPanel";
import LogExpensePanel from "./LogExpensePanel";
import CategoriesPanel from "./CategoriesPanel";
import SuppliersPanel from "./SuppliersPanel";
import SupplierPaymentsPanel from "./SupplierPaymentsPanel";
import RecordPaymentPanel from "./RecordPaymentPanel";
import ReportsPanel from "./ReportsPanel";
import PLPanel from "./PLPanel";
import IntegrationsPanel from "./IntegrationsPanel";
import SettingsPanel from "./SettingsPanel";
import type { NavPanel, OverlayState, ApiExpense } from "./types";

// ═══════════════════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ═══════════════════════════════════════════════════════════

const FinancePage: React.FC = () => {
  const [activePanel, setActivePanel] = useState<NavPanel>("overview");
  const [editExpense, setEditExpense] = useState<ApiExpense | null>(null);
  const { isLoading, loadingProgress, switchTab } = useTabLoading(
    setActivePanel,
    activePanel,
  );

  const [overlay, setOverlay] = useState<OverlayState>({
    open: false,
    title: "",
    content: null,
  });

  const openOverlay = useCallback((title: string, content: React.ReactNode) => {
    setOverlay({ open: true, title, content });
  }, []);

  const closeOverlay = () => setOverlay((v) => ({ ...v, open: false }));

  type NavEntry = {
    panel: NavPanel;
    icon: string;
    label: string;
    badge?: number | string;
    badgeColor?: string;
  };
  type NavSection = { heading: string; items: NavEntry[] };

  const navSections: NavSection[] = [
    {
      heading: "Overview",
      items: [{ panel: "overview", icon: "fa-gauge", label: "Overview" }],
    },
    {
      heading: "COD",
      items: [
        {
          panel: "cod",
          icon: "fa-money-bills",
          label: "COD Tracking",
          // badge: 14,
        },
        { panel: "cod-log", icon: "fa-clipboard-check", label: "COD Log" },
        { panel: "prepaid", icon: "fa-credit-card", label: "Prepaid Orders" },
      ],
    },
    {
      heading: "Expenses",
      items: [
        { panel: "expenses", icon: "fa-receipt", label: "All Expenses" },
        { panel: "exp-add", icon: "fa-circle-plus", label: "Log Expense" },
        { panel: "exp-categories", icon: "fa-tags", label: "Categories" },
      ],
    },
    // {
    //   heading: "Suppliers",
    //   items: [
    //     {
    //       panel: "suppliers",
    //       icon: "fa-truck-ramp-box",
    //       label: "Supplier Balances",
    //     },
    //     { panel: "sup-payments", icon: "fa-handshake", label: "Payments Made" },
    //     { panel: "sup-add", icon: "fa-circle-plus", label: "Record Payment" },
    //   ],
    // },
    {
      heading: "Reports",
      items: [
        {
          panel: "reports",
          icon: "fa-file-invoice-dollar",
          label: "Financial Reports",
        },
        { panel: "pl", icon: "fa-chart-line", label: "P&L Summary" },
      ],
    },
    // {
    //   heading: "Integrations",
    //   items: [
    //     { panel: "integrations", icon: "fa-plug", label: "Integrations" },
    //   ],
    // },
    // {
    //   heading: "Settings",
    //   items: [{ panel: "settings", icon: "fa-gear", label: "Settings" }],
    // },
  ];

  const renderPanel = () => {
    switch (activePanel) {
      case "overview":
        return (
          <OverviewPanel onNav={setActivePanel} onOpenOverlay={openOverlay} />
        );
      case "cod":
        return <CODPanel onOpenOverlay={openOverlay} />;
      case "cod-log":
        return <CODLogPanel />;
      case "prepaid":
        return <PrepaidPanel />;
      case "expenses":
        return (
          <ExpensesPanel
            onNav={setActivePanel}
            onOpenOverlay={openOverlay}
            onEdit={(expense) => {
              setEditExpense(expense);
              setActivePanel("exp-edit");
            }}
          />
        );
      case "exp-add":
        return <LogExpensePanel onNav={setActivePanel} />;
      case "exp-edit":
        return (
          <LogExpensePanel onNav={setActivePanel} editData={editExpense} />
        );
      case "exp-categories":
        return <CategoriesPanel />;
      case "suppliers":
        return (
          <SuppliersPanel onNav={setActivePanel} onOpenOverlay={openOverlay} />
        );
      case "sup-payments":
        return <SupplierPaymentsPanel />;
      case "sup-add":
        return <RecordPaymentPanel onNav={setActivePanel} />;
      case "reports":
        return <ReportsPanel />;
      case "pl":
        return <PLPanel />;
      case "integrations":
        return <IntegrationsPanel />;
      case "settings":
        return <SettingsPanel />;
      default:
        return null;
    }
  };

  return (
    <div id="page-finance">
      <TopLoadingBar progress={loadingProgress} isLoading={isLoading} />
      <div className="page-hero">
        <div className="page-hero-title">Financial Management</div>
        <div className="page-hero-sub">
          Track COD collections, log expenses, manage supplier balances, and
          generate financial reports.
        </div>
      </div>

      <div className="finance-layout">
        {/* Vertical Nav */}
        <div className="vnav">
          {navSections.map((section) => (
            <React.Fragment key={section.heading}>
              <div className="vnav-section-label">{section.heading}</div>
              {section.items.map((item) => (
                <div
                  key={item.panel}
                  className={`vnav-item ${activePanel === item.panel ? "active" : ""}`}
                  onClick={() => switchTab(item.panel)}
                >
                  <i className={`fa-solid ${item.icon}`} />
                  {item.label}
                  {item.badge !== undefined && (
                    <span className={`vnav-badge ${item.badgeColor || ""}`}>
                      {item.badge}
                    </span>
                  )}
                </div>
              ))}
              <div className="vnav-divider" />
            </React.Fragment>
          ))}
        </div>

        {/* Content Panels */}
        <div className="finance-content">{renderPanel()}</div>
      </div>

      {/* Overlay */}
      <div
        className={`finance-backdrop ${overlay.open ? "open" : ""}`}
        onClick={closeOverlay}
      />
      <div className={`finance-overlay ${overlay.open ? "open" : ""}`}>
        <div className="overlay-header">
          <div className="overlay-title">{overlay.title}</div>
          <button className="close-btn" onClick={closeOverlay}>
            <i className="fa-solid fa-xmark" />
          </button>
        </div>
        <div className="overlay-body">{overlay.content}</div>
      </div>
    </div>
  );
};

export default FinancePage;
