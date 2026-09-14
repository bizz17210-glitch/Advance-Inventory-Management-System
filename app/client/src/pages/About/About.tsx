import React from "react";
import { Link } from "react-router-dom";
import "./About.css";

const About: React.FC = () => {
  const stats = [
    { value: "10+", label: "Core Modules" },
    { value: "7", label: "User Roles" },
    { value: "99.5%", label: "System Uptime" },
    { value: "MERN", label: "Tech Stack" },
  ];

  const missionPoints = [
    {
      highlight: "Real-time visibility",
      text: "across inventory, orders, and financials",
    },
    {
      highlight: "Role-based access",
      text: "ensuring each team member sees what they need",
    },
    {
      highlight: "Automation-first",
      text: "design to reduce manual effort and human error",
    },
    {
      highlight: "Shopify-ready",
      text: "with optional e-commerce integration built in",
    },
  ];

  const miniStats = [
    {
      cls: "orange",
      icon: "fa-boxes-stacked",
      label: "Total Inventory Items",
      val: "1,284",
      trend: "12%",
    },
    {
      cls: "blue",
      icon: "fa-cart-shopping",
      label: "Orders This Month",
      val: "342",
      trend: "8%",
    },
    {
      cls: "slate",
      icon: "fa-users",
      label: "Active Customers",
      val: "891",
      trend: "5%",
    },
  ];

  const values = [
    {
      icon: "fa-bolt",
      title: "Speed & Efficiency",
      desc: "Every workflow is optimized for speed. API responses under 500ms, dashboards in under 3 seconds — performance is non-negotiable.",
      style: { background: "#FFF3EB", color: "var(--accent)" },
    },
    {
      icon: "fa-shield-halved",
      title: "Security First",
      desc: "JWT authentication, HTTPS enforcement, encrypted data at rest, automated backups, and comprehensive audit logs protect your business data.",
      style: { background: "#E6F4FA", color: "#0284C7" },
    },
    {
      icon: "fa-chart-line",
      title: "Data-Driven Insights",
      desc: "Real-time dashboards, KPI tracking, trend analysis, and predictive insights help you make decisions based on facts, not guesses.",
      style: { background: "#F0FDF4", color: "#059669" },
    },
    {
      icon: "fa-expand",
      title: "Built to Scale",
      desc: "Designed to handle 5x growth in users and data volume without architectural changes. Your platform grows as your business grows.",
      style: { background: "#F5F3FF", color: "#7C3AED" },
    },
    {
      icon: "fa-users-gear",
      title: "Team Accountability",
      desc: "Role-based dashboards, task tracking, and staff performance analytics keep every team member aligned and accountable.",
      style: { background: "#FFF3EB", color: "var(--accent)" },
    },
    {
      icon: "fa-plug",
      title: "Integration Ready",
      desc: "Optional Shopify synchronization, courier API hooks, and a modular architecture designed for future integrations as your needs evolve.",
      style: { background: "#E6F4FA", color: "#0284C7" },
    },
  ];

  const modules = [
    {
      icon: "fa-boxes-stacked",
      title: "Product Management",
      desc: "Manage products with variants, bulk CSV upload, and automated stock tracking per SKU.",
    },
    {
      icon: "fa-cart-shopping",
      title: "Order Management",
      desc: "Manual entry plus optional Shopify sync with real-time inventory updates and status workflows.",
    },
    {
      icon: "fa-warehouse",
      title: "Inventory Control",
      desc: "Automated stock tracking, low-stock alerts, historical logs, and supplier linkage.",
    },
    {
      icon: "fa-users",
      title: "Customer Management",
      desc: "Auto-created profiles, order history, purchase patterns, and segmentation tools.",
    },
    {
      icon: "fa-truck",
      title: "Courier & Rider Management",
      desc: "Automated assignment, real-time tracking, and performance analytics for deliveries.",
    },
    {
      icon: "fa-coins",
      title: "Financial Management",
      desc: "COD tracking, expense categorization, supplier balances, and automated reports.",
    },
    {
      icon: "fa-list-check",
      title: "Task Assignment",
      desc: "Assign, track, and analyze daily staff tasks with deadline alerts and completion dashboards.",
    },
    {
      icon: "fa-chart-bar",
      title: "Reporting & Analytics",
      desc: "Real-time dashboards, KPI tracking, exportable reports in Excel/CSV, and trend analysis.",
    },
    {
      icon: "fa-user-chart",
      title: "Staff Performance",
      desc: "Automated tracking of task rates, delivery timeliness, error rates, and historical dashboards.",
    },
  ];

  const team = [
    {
      initials: "AR",
      name: "Abdul Rehman",
      role: "Lead Engineer & Architect",
      color: "var(--accent)",
      links: [
        "fa-brands fa-linkedin-in",
        "fa-brands fa-github",
        "fa-regular fa-envelope",
      ],
    },
    {
      initials: "SA",
      name: "Sara Ahmad",
      role: "Product Manager",
      color: "#0284C7",
      links: [
        "fa-brands fa-linkedin-in",
        "fa-brands fa-github",
        "fa-regular fa-envelope",
      ],
    },
    {
      initials: "MK",
      name: "Muhammad Kamran",
      role: "Backend Developer",
      color: "#475569",
      links: [
        "fa-brands fa-linkedin-in",
        "fa-brands fa-github",
        "fa-regular fa-envelope",
      ],
    },
    {
      initials: "FN",
      name: "Fatima Noor",
      role: "UI/UX Designer",
      color: "#059669",
      links: [
        "fa-brands fa-linkedin-in",
        "fa-brands fa-dribbble",
        "fa-regular fa-envelope",
      ],
    },
  ];

  return (
    <div className="about-page">
      {/* ── HEADER ── */}
      <header className="about-header">
        <Link to="/" className="about-logo">
          <div className="about-logo-icon">
            <i className="fa-solid fa-chart-network" />
          </div>
          <span className="about-logo-text">
            Inventory<span>OS</span>
          </span>
        </Link>
        <nav className="about-nav">
          <Link to="/">Home</Link>
          <Link to="/about" className="active">
            About
          </Link>
          <Link to="/login" className="btn-outline">
            Sign In
          </Link>
          {/* <Link to="/signup" className="btn-accent">Get Started</Link> */}
        </nav>
      </header>

      {/* ── HERO ── */}
      <section className="about-hero">
        <div className="hero-badge">
          <i className="fa-solid fa-circle-info" /> Our Story
        </div>
        <h1>
          Built for businesses that move <span>fast</span>
        </h1>
        <p>
          Inventory OS is an advanced inventory and operations management
          platform designed to centralize, automate, and scale your business
          processes — from WhatsApp orders to full e-commerce integration.
        </p>
        <div className="hero-cta">
          <Link to="/signup" className="btn-lg btn-lg-accent">
            <i className="fa-solid fa-rocket" /> Start Free
          </Link>
          <Link to="/login" className="btn-lg btn-lg-outline">
            <i className="fa-solid fa-sign-in-alt" /> Sign In
          </Link>
        </div>
      </section>

      {/* ── MAIN CONTENT ── */}
      <main className="about-content">
        {/* Stats */}
        <div className="about-stats-row">
          {stats.map((s) => (
            <div key={s.label} className="about-stat-card">
              <div className="about-stat-num">{s.value}</div>
              <div className="about-stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Mission */}
        <div className="mission-grid">
          <div className="mission-text">
            <h2>Our Mission</h2>
            <p>
              We believe operational complexity shouldn't slow you down.
              Inventory OS was built to give growing businesses the same
              operational power that enterprise giants enjoy — without the
              enterprise price tag or complexity.
            </p>
            <p>
              From a single operator managing WhatsApp orders to a full team
              running multi-channel logistics, our platform scales with your
              needs.
            </p>
            <div className="mission-points">
              {missionPoints.map((pt) => (
                <div key={pt.highlight} className="mission-point">
                  <i className="fa-solid fa-check-circle" />
                  <span>
                    <strong>{pt.highlight}</strong> {pt.text}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mission-visual">
            <div className="mini-dash-title">
              <i className="fa-solid fa-gauge-high" /> Live Dashboard Preview
            </div>
            <div className="mini-dashboard">
              {miniStats.map((item) => (
                <div key={item.label} className="mini-stat">
                  <div className={`mini-stat-icon ${item.cls}`}>
                    <i className={`fa-solid ${item.icon}`} />
                  </div>
                  <div className="mini-stat-info">
                    <div className="mini-stat-label">{item.label}</div>
                    <div className="mini-stat-val">{item.val}</div>
                  </div>
                  <div className="mini-stat-trend">
                    <i className="fa-solid fa-arrow-up" /> {item.trend}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Values */}
        <div className="section-title">
          <h2>What We Stand For</h2>
          <p>
            Our core values guide every feature we build and every decision we
            make.
          </p>
        </div>
        <div className="values-grid">
          {values.map((v) => (
            <div key={v.title} className="value-card">
              <div className="value-icon" style={v.style}>
                <i className={`fa-solid ${v.icon}`} />
              </div>
              <h3>{v.title}</h3>
              <p>{v.desc}</p>
            </div>
          ))}
        </div>

        {/* Modules */}
        <div className="section-title">
          <h2>Platform Modules</h2>
          <p>
            A comprehensive suite of tools covering every aspect of your
            inventory and operations lifecycle.
          </p>
        </div>
        <div className="modules-grid">
          {modules.map((m) => (
            <div key={m.title} className="module-item">
              <div className="module-icon">
                <i className={`fa-solid ${m.icon}`} />
              </div>
              <div className="module-info">
                <h4>{m.title}</h4>
                <p>{m.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Team */}
        <div className="section-title">
          <h2>Meet the Team</h2>
          <p>
            A passionate team of engineers, designers, and product thinkers
            building the future of operational management.
          </p>
        </div>
        <div className="team-grid">
          {team.map((member) => (
            <div key={member.initials} className="team-card">
              <div className="team-avatar" style={{ background: member.color }}>
                {member.initials}
              </div>
              <div className="team-name">{member.name}</div>
              <div className="team-role">{member.role}</div>
              <div className="team-links">
                {member.links.map((icon) => (
                  // eslint-disable-next-line jsx-a11y/anchor-is-valid
                  <button
                    key={icon}
                    className="team-link"
                    aria-label="social link"
                  >
                    <i className={icon} />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="about-cta">
          <h2>Ready to transform your operations?</h2>
          <p>
            Join businesses already using Inventory OS to manage inventory,
            orders, and teams from one powerful platform.
          </p>
          <div className="cta-buttons">
            {/* <Link to="/signup" className="btn-lg btn-lg-accent">
              <i className="fa-solid fa-rocket" /> Get Started Free
            </Link> */}
            <Link to="/login" className="btn-lg cta-ghost">
              <i className="fa-solid fa-sign-in-alt" /> Sign In
            </Link>
          </div>
        </div>
      </main>

      {/* ── FOOTER ── */}
      <footer className="about-footer">
        <div className="about-footer-inner">
          <div className="footer-brand">
            <div className="footer-brand-icon">
              <i className="fa-solid fa-chart-network" />
            </div>
            <span className="footer-brand-text">
              Inventory<span>OS</span>
            </span>
          </div>
          <div className="footer-center">
            © 2026 <span>Zone In</span>. All rights reserved. Built with MERN
            Stack.
          </div>
          <div className="footer-links">
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms of Service</Link>
            <Link to="/support">Support</Link>
            <Link to="/about">About</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default About;
