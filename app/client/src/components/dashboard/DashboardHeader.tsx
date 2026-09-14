// ─── components/dashboard/DashboardHeader.tsx ────────────────

import React, { useEffect, useState } from "react";
import { KpiStat } from "../../types/dashboard";
import { authAPI } from "../../services/api";
import { analyticsAPI } from "../../services/api";

interface DashboardHeaderProps {
  kpis: KpiStat[];
  onNewOrder: () => void;
  onExport: () => void;
}

function formatLiveDate(): string {
  const now = new Date();
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  let h = now.getHours();
  const m = now.getMinutes().toString().padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()} · ${h}:${m} ${ampm} PKT`;
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

const trendIcon: Record<string, string> = {
  up: "fa-arrow-trend-up",
  down: "fa-arrow-trend-down",
  neutral: "fa-minus",
};

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  kpis,
  onNewOrder,
  onExport,
}) => {
  const [dateStr, setDateStr] = useState(formatLiveDate);
  const [firstName, setFirstName] = useState<string>("");
  const [subtitle, setSubtitle] = useState<string>(
    "Here's your operations snapshot.",
  );

  // ── Live clock ──────────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => setDateStr(formatLiveDate()), 60_000);
    return () => clearInterval(id);
  }, []);

  // ── Fetch user name ─────────────────────────────────────────
  useEffect(() => {
    authAPI
      .me()
      .then((res) => {
        const user = res.data?.data;
        if (user?.firstName) setFirstName(user.firstName);
      })
      .catch(() => {
        // silently fall back — greeting will just omit the name
      });
  }, []);

  // ── Fetch dashboard snapshot for subtitle ───────────────────
  useEffect(() => {
    const today = new Date();
    const from = today.toISOString().split("T")[0];
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    Promise.all([
      analyticsAPI.getDashboard({ from, to: from }),
      analyticsAPI.getDashboard({
        from: yesterday.toISOString().split("T")[0],
        to: yesterday.toISOString().split("T")[0],
      }),
    ])
      .then(([todayRes, yestRes]) => {
        const todayData = todayRes.data?.data;
        const yestData = yestRes.data?.data;

        const ordersToday = todayData?.totalOrders ?? null;
        const revenueToday = todayData?.totalRevenue ?? null;
        const revenueYest = yestData?.totalRevenue ?? null;

        if (
          ordersToday === null ||
          revenueToday === null ||
          revenueYest === null
        )
          return;

        const revDiff =
          revenueYest > 0
            ? (((revenueToday - revenueYest) / revenueYest) * 100).toFixed(1)
            : null;
        const direction = revenueToday >= revenueYest ? "up" : "down";

        let text = `Here's your operations snapshot — ${ordersToday} order${ordersToday !== 1 ? "s" : ""} processed today`;
        if (revDiff !== null) {
          text += `, revenue ${direction === "up" ? "up" : "down"} ${Math.abs(Number(revDiff))}% vs yesterday`;
        }
        text += ".";
        setSubtitle(text);
      })
      .catch(() => {
        // silently keep default subtitle
      });
  }, []);

  const greeting = getGreeting();
  const nameLabel = firstName ? `, ${firstName}` : "";

  return (
    <div className="d-page-header">
      <div className="d-header-top">
        <div>
          <div className="d-header-date">{dateStr}</div>
          <h1 className="d-header-title">
            {greeting}
            {nameLabel} 👋
          </h1>
          <p className="d-header-sub">{subtitle}</p>
        </div>

        <div className="d-header-actions">
          <button className="d-btn-dark" onClick={onNewOrder}>
            <i className="fa-solid fa-bag-shopping" /> New Order
          </button>
          <button className="d-btn-dark accent" onClick={onExport}>
            <i className="fa-solid fa-arrow-up-right-from-square" /> Export
            Report
          </button>
        </div>
      </div>

      <div className="d-header-kpis">
        {kpis.map((kpi, idx) => (
          <div className="d-header-kpi" key={kpi.label}>
            <div className="d-kpi-label">{kpi.label}</div>
            <div className="d-kpi-value">{kpi.value}</div>
            <div className={`d-kpi-trend ${kpi.trendDir}`}>
              <i className={`fa-solid ${trendIcon[kpi.trendDir]}`} />
              {kpi.trend}
            </div>
            {idx < kpis.length - 1 && <div className="d-kpi-divider" />}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DashboardHeader;
