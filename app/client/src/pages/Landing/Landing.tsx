import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Landing.css";
import { ShaderAnimation } from "../../components/ui/shader-animation";
import { LiquidMetalButton } from "../../components/ui/LiquidMetalButton";

// ── Types ──────────────────────────────────────────────────
interface Slide {
  img: string;
  alt: string;
  tag: string;
  title: string;
  desc: string;
}

interface FeatureCard {
  icon: string;
  title: string;
  desc: string;
  iconStyle: React.CSSProperties;
}

interface HowStep {
  step: string;
  icon: string;
  title: string;
  desc: string;
}

interface RoleCard {
  icon: string;
  title: string;
  desc: string;
  dashed?: boolean;
}

interface TechBadge {
  icon: string;
  iconColor: string;
  label: string;
}

interface Testimonial {
  quote: string;
  name: string;
  role: string;
  initials: string;
  avatarBg: string;
  halfStar?: boolean;
}

// ── Static Data ────────────────────────────────────────────
const SLIDES: Slide[] = [
  {
    img: "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=1000&auto=format&fit=crop",
    alt: "Operations Dashboard",
    tag: "Dashboard",
    title: "Real-time Operations Dashboard",
    desc: "Monitor orders, inventory, and financials at a glance with live-updating metrics and KPI tracking.",
  },
  {
    img: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1000&auto=format&fit=crop",
    alt: "Inventory Management",
    tag: "Inventory",
    title: "Smart Inventory Management",
    desc: "Track stock levels per variant, get low-stock alerts automatically, and maintain full audit history.",
  },
  {
    img: "https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?w=1000&auto=format&fit=crop",
    alt: "Order Management",
    tag: "Orders",
    title: "Seamless Order Processing",
    desc: "From WhatsApp orders to Shopify sync — manage all channels in one place with automated workflows.",
  },
  {
    img: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1000&auto=format&fit=crop",
    alt: "Analytics",
    tag: "Analytics",
    title: "Advanced Reporting & Analytics",
    desc: "Exportable reports in Excel/CSV, trend analysis, and predictive insights for smarter decision-making.",
  },
  {
    img: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1000&auto=format&fit=crop",
    alt: "Team Management",
    tag: "Team",
    title: "Role-based Team Management",
    desc: "Assign tasks, track performance, and give each team member exactly the access they need — nothing more.",
  },
  {
    img: "https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=1000&auto=format&fit=crop",
    alt: "Delivery",
    tag: "Logistics",
    title: "Courier & Rider Management",
    desc: "Automated courier assignment, real-time status tracking, and delivery performance analytics built in.",
  },
];

const FEATURES: FeatureCard[] = [
  {
    icon: "fa-boxes-stacked",
    title: "Product & Inventory",
    desc: "Manage products with multiple variants, bulk CSV upload, and automatic stock tracking. Low-stock alerts keep you always informed.",
    iconStyle: { background: "#FFF3EB", color: "var(--accent)" },
  },
  {
    icon: "fa-cart-shopping",
    title: "Order Management",
    desc: "Manual entry plus optional Shopify sync. Real-time inventory updates on every order, with configurable status workflows.",
    iconStyle: { background: "var(--info-bg)", color: "var(--info-icon)" },
  },
  {
    icon: "fa-users",
    title: "Customer Profiles",
    desc: "Auto-created profiles from every order. Full purchase history, segmentation by value or frequency, and advanced search.",
    iconStyle: { background: "#F0FDF4", color: "#059669" },
  },
  {
    icon: "fa-coins",
    title: "Financial Tracking",
    desc: "COD and prepaid tracking, expense categorization, supplier balances, and automated daily, weekly, and monthly reports.",
    iconStyle: { background: "#FFF3EB", color: "var(--accent)" },
  },
  {
    icon: "fa-truck",
    title: "Courier & Rider",
    desc: "Automated courier assignment with optional API integration. Real-time status updates and performance analytics for every delivery.",
    iconStyle: { background: "#F5F3FF", color: "#7C3AED" },
  },
  {
    icon: "fa-chart-bar",
    title: "Reports & Analytics",
    desc: "Live dashboards, KPI tracking, exportable Excel/CSV reports, trend analysis, and predictive inventory insights.",
    iconStyle: { background: "var(--info-bg)", color: "var(--info-icon)" },
  },
  {
    icon: "fa-list-check",
    title: "Task Assignment",
    desc: "Create, assign, and track daily staff tasks with priority levels and deadlines. Automatic notifications keep everyone aligned.",
    iconStyle: { background: "#F0FDF4", color: "#059669" },
  },
  {
    icon: "fa-user-chart",
    title: "Staff Performance",
    desc: "Automated tracking of task completion, delivery timeliness, and error rates. Historical dashboards for managers.",
    iconStyle: { background: "#FFF3EB", color: "var(--accent)" },
  },
  {
    icon: "fa-shield-halved",
    title: "Security & Backups",
    desc: "JWT auth, HTTPS, encrypted data, role-based access control, automated daily cloud backups, and full audit logs.",
    iconStyle: { background: "#F5F3FF", color: "#7C3AED" },
  },
];

const HOW_STEPS: HowStep[] = [
  {
    step: "Step 01",
    icon: "fa-user-plus",
    title: "Create Account",
    desc: "Sign up, select your role, and get access code from your administrator to join the platform.",
  },
  {
    step: "Step 02",
    icon: "fa-boxes-stacked",
    title: "Set Up Inventory",
    desc: "Add products with variants, upload via CSV, link suppliers, and configure low-stock thresholds.",
  },
  {
    step: "Step 03",
    icon: "fa-plug",
    title: "Connect Channels",
    desc: "Enable Shopify sync for automated order flow, or use manual order entry for WhatsApp-based sales.",
  },
  {
    step: "Step 04",
    icon: "fa-gauge-high",
    title: "Manage & Scale",
    desc: "Monitor dashboards, assign tasks, track performance, and generate reports to grow with confidence.",
  },
];

const ROLES: RoleCard[] = [
  {
    icon: "fa-user-shield",
    title: "Administrator",
    desc: "Full system access, user management, configuration, and complete oversight of all modules.",
  },
  {
    icon: "fa-chart-bar",
    title: "Operations Manager",
    desc: "Oversight of orders, staff performance, operational reports, and workflow configuration.",
  },
  {
    icon: "fa-warehouse",
    title: "Inventory Manager",
    desc: "Product variants, stock control, low-stock alerts, and supplier linkage management.",
  },
  {
    icon: "fa-headset",
    title: "Sales Operator",
    desc: "Manual order entry from WhatsApp, customer profile management, and status updates.",
  },
  {
    icon: "fa-calculator",
    title: "Accounts",
    desc: "COD and prepaid tracking, expense logging, and supplier payment reconciliation.",
  },
  {
    icon: "fa-truck",
    title: "Courier Handler",
    desc: "External shipment assignment, tracking, and courier service performance monitoring.",
  },
  {
    icon: "fa-motorcycle",
    title: "Rider (Internal)",
    desc: "View assigned deliveries, update delivery status, and track personal delivery performance.",
  },
  {
    icon: "fa-plus",
    title: "Custom Roles",
    desc: "Additional roles can be configured by the administrator to match your team structure.",
    dashed: true,
  },
];

const TECH_BADGES: TechBadge[] = [
  { icon: "fa-brands fa-react", iconColor: "#61DAFB", label: "React.js" },
  { icon: "fa-brands fa-node-js", iconColor: "#68A063", label: "Node.js" },
  { icon: "fa-solid fa-database", iconColor: "#47A248", label: "MongoDB" },
  {
    icon: "fa-solid fa-server",
    iconColor: "var(--accent)",
    label: "Express.js",
  },
  {
    icon: "fa-solid fa-cloud",
    iconColor: "var(--info-icon)",
    label: "Vercel Cloud",
  },
  { icon: "fa-solid fa-lock", iconColor: "#475569", label: "JWT Auth" },
  { icon: "fa-brands fa-shopify", iconColor: "#96BF48", label: "Shopify API" },
];

const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "We went from manually tracking WhatsApp orders in spreadsheets to having real-time inventory dashboards. The difference is night and day.",
    name: "Ahmed Khan",
    role: "Operations Manager, e-commerce brand",
    initials: "AK",
    avatarBg: "var(--accent)",
  },
  {
    quote:
      "The role-based access is exactly what we needed. Our accounts team only sees financials, riders see their deliveries — no overlap, no confusion.",
    name: "Sara Baig",
    role: "Administrator, logistics company",
    initials: "SB",
    avatarBg: "#0284C7",
  },
  {
    quote:
      "Shopify integration reduced our manual data entry by 80%. Stock updates automatically, and we get low-stock alerts before we even realize we're running out.",
    name: "Usman Malik",
    role: "Inventory Manager, retail business",
    initials: "UM",
    avatarBg: "#059669",
    halfStar: true,
  },
];

// ── Scroll Reveal Hook ─────────────────────────────────────
function useScrollReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("reveal-visible");
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );

    const elements = document.querySelectorAll(".reveal");
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);
}

// ── Component ──────────────────────────────────────────────
const Landing: React.FC = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const autoSlideRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useScrollReveal();

  // Auto-advance slideshow
  const startAutoSlide = useCallback(() => {
    autoSlideRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, 4500);
  }, []);

  const stopAutoSlide = useCallback(() => {
    if (autoSlideRef.current) clearInterval(autoSlideRef.current);
  }, []);

  useEffect(() => {
    startAutoSlide();
    return () => stopAutoSlide();
  }, [startAutoSlide, stopAutoSlide]);

  const changeSlide = (dir: 1 | -1) => {
    setCurrentSlide((prev) => (prev + dir + SLIDES.length) % SLIDES.length);
  };

  const goToSlide = (idx: number) => setCurrentSlide(idx);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="landing-page">
      {/* ── HEADER ── */}
      <header className="landing-header">
        <Link to="/" className="landing-logo">
          <div className="landing-logo-icon">
            <i className="fa-solid fa-chart-network" />
          </div>
          <span className="landing-logo-text">
            Zone<span>In</span>
          </span>
        </Link>

        <nav className="landing-nav">
          <button
            onClick={() => scrollTo("features")}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "13px",
              color: "var(--text-secondary)",
              padding: "6px 12px",
              borderRadius: "var(--radius-btn)",
            }}
          >
            Features
          </button>
          <button
            onClick={() => scrollTo("how")}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "13px",
              color: "var(--text-secondary)",
              padding: "6px 12px",
              borderRadius: "var(--radius-btn)",
            }}
          >
            How It Works
          </button>
          <button
            onClick={() => scrollTo("roles")}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "13px",
              color: "var(--text-secondary)",
              padding: "6px 12px",
              borderRadius: "var(--radius-btn)",
            }}
          >
            Roles
          </button>
          <Link
            to="/about"
            style={{
              fontSize: "13px",
              color: "var(--text-secondary)",
              textDecoration: "none",
              padding: "6px 12px",
              borderRadius: "var(--radius-btn)",
            }}
          >
            About
          </Link>
        </nav>

        <div className="landing-header-actions">
          <Link to="/login" className="landing-btn-outline">
            Sign In
          </Link>
          {/* <Link to="/signup" className="landing-btn-accent">Get Started</Link> */}
          <button
            className="landing-hamburger"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>

      {/* Mobile Menu */}
      <div
        className={`landing-mobile-menu ${mobileMenuOpen ? "open" : ""}`}
        id="mobileMenu"
      >
        <button
          onClick={() => {
            scrollTo("features");
            closeMobileMenu();
          }}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: "14px",
            color: "var(--text-secondary)",
            padding: "10px 0",
            textAlign: "left",
            borderBottom: "1px solid var(--divider)",
          }}
        >
          Features
        </button>
        <button
          onClick={() => {
            scrollTo("how");
            closeMobileMenu();
          }}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: "14px",
            color: "var(--text-secondary)",
            padding: "10px 0",
            textAlign: "left",
            borderBottom: "1px solid var(--divider)",
          }}
        >
          How It Works
        </button>
        <button
          onClick={() => {
            scrollTo("roles");
            closeMobileMenu();
          }}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: "14px",
            color: "var(--text-secondary)",
            padding: "10px 0",
            textAlign: "left",
            borderBottom: "1px solid var(--divider)",
          }}
        >
          Roles
        </button>
        <Link
          to="/about"
          onClick={closeMobileMenu}
          style={{
            fontSize: "14px",
            color: "var(--text-secondary)",
            textDecoration: "none",
            padding: "10px 0",
            borderBottom: "1px solid var(--divider)",
            display: "block",
          }}
        >
          About
        </Link>
        <Link
          to="/login"
          onClick={closeMobileMenu}
          style={{
            fontSize: "14px",
            color: "var(--text-secondary)",
            textDecoration: "none",
            padding: "10px 0",
            borderBottom: "1px solid var(--divider)",
            display: "block",
          }}
        >
          Sign In
        </Link>
        {/* <Link to="/signup" onClick={closeMobileMenu} style={{ fontSize: '14px', color: 'var(--accent)', textDecoration: 'none', padding: '10px 0', display: 'block', fontWeight: 600 }}>Get Started →</Link> */}
      </div>

      {/* ── HERO ── */}
      <section className="landing-hero">
        {/* Full-bleed shader canvas in the background */}
        <div className="landing-hero-shader">
          <ShaderAnimation className="w-full h-full" />
        </div>

        {/* Dark overlay so text stays readable */}
        <div className="landing-hero-overlay" />

        <div className="landing-hero-content">
          {/* LEFT SIDE */}
          <div className="landing-hero-left hero-animate-left">
            <div className="landing-hero-badge">
              <i className="fa-solid fa-sparkles" />
              Advanced Inventory &amp; Operations Platform
            </div>

            <h1>
              Run your operations with <span>clarity</span> and speed
            </h1>

            <p>
              Zone In centralizes inventory, orders, customers, financials, and
              staff — with real-time dashboards and automation built for growing
              businesses.
            </p>

            <div className="landing-hero-cta">
              <LiquidMetalButton
                to="/signup"
                className="landing-btn-hero-primary"
                icon="fa-solid fa-rocket"
              >
                Start for Free
              </LiquidMetalButton>

              <Link to="/about" className="landing-btn-hero-secondary">
                <i className="fa-solid fa-play-circle" />
                Learn More
              </Link>
            </div>

            <div className="landing-hero-stats">
              {[
                { num: "10+", label: "Core Modules" },
                { num: "7", label: "User Roles" },
                { num: "99.5%", label: "Uptime SLA" },
                { num: "MERN", label: "Modern Stack" },
              ].map((s) => (
                <div key={s.label} className="landing-hero-stat-item">
                  <div className="landing-hero-stat-num">{s.num}</div>
                  <div className="landing-hero-stat-label">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT SIDE — floating glass card over the shader */}
          <div className="landing-hero-right hero-animate-right">
            <div className="landing-hero-glass-card">
              <div className="landing-hero-glass-inner">
                <div className="glass-card-header">
                  <div className="glass-dot red" />
                  <div className="glass-dot yellow" />
                  <div className="glass-dot green" />
                  <span className="glass-card-title">Live Dashboard</span>
                </div>
                <div className="glass-metrics">
                  {[
                    {
                      label: "Orders Today",
                      value: "284",
                      delta: "+12%",
                      up: true,
                    },
                    {
                      label: "Stock Items",
                      value: "1,492",
                      delta: "in stock",
                      up: true,
                    },
                    {
                      label: "Pending COD",
                      value: "₨ 84k",
                      delta: "18 orders",
                      up: false,
                    },
                    {
                      label: "Active Riders",
                      value: "7",
                      delta: "on route",
                      up: true,
                    },
                  ].map((m) => (
                    <div key={m.label} className="glass-metric-item">
                      <div className="glass-metric-label">{m.label}</div>
                      <div className="glass-metric-value">{m.value}</div>
                      <div
                        className={`glass-metric-delta ${m.up ? "up" : "neutral"}`}
                      >
                        {m.delta}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="glass-bar-section">
                  <div className="glass-bar-label">
                    <span>Weekly Fulfillment</span>
                    <span className="glass-bar-pct">87%</span>
                  </div>
                  <div className="glass-bar-track">
                    <div className="glass-bar-fill" style={{ width: "87%" }} />
                  </div>
                </div>
                <div className="glass-bar-section">
                  <div className="glass-bar-label">
                    <span>Inventory Health</span>
                    <span className="glass-bar-pct">94%</span>
                  </div>
                  <div className="glass-bar-track">
                    <div
                      className="glass-bar-fill green"
                      style={{ width: "94%" }}
                    />
                  </div>
                </div>
                <div className="glass-status-row">
                  <span className="glass-status-dot pulse" />
                  <span className="glass-status-text">
                    All systems operational
                  </span>
                  <span className="glass-status-time">Updated just now</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="landing-hero-scroll-hint">
          <span>Scroll to explore</span>
          <i className="fa-solid fa-chevron-down" />
        </div>
      </section>

      {/* ── SLIDESHOW ── */}
      <section className="landing-slideshow-section reveal">
        <div className="landing-slideshow-container">
          <div
            className="landing-slides-wrapper"
            onMouseEnter={stopAutoSlide}
            onMouseLeave={startAutoSlide}
          >
            {SLIDES.map((slide, idx) => (
              <div
                key={idx}
                className={`landing-slide ${idx === currentSlide ? "active" : ""}`}
              >
                <img src={slide.img} alt={slide.alt} />
                <div className="landing-slide-overlay">
                  <span className="landing-slide-tag">{slide.tag}</span>
                  <div className="landing-slide-title">{slide.title}</div>
                  <div className="landing-slide-desc">{slide.desc}</div>
                </div>
              </div>
            ))}

            <button
              className="landing-slide-btn prev"
              onClick={() => changeSlide(-1)}
              aria-label="Previous slide"
            >
              <i className="fa-solid fa-chevron-left" />
            </button>
            <button
              className="landing-slide-btn next"
              onClick={() => changeSlide(1)}
              aria-label="Next slide"
            >
              <i className="fa-solid fa-chevron-right" />
            </button>
          </div>

          <div className="landing-slide-dots">
            {SLIDES.map((_, idx) => (
              <button
                key={idx}
                className={`landing-slide-dot ${idx === currentSlide ? "active" : ""}`}
                onClick={() => goToSlide(idx)}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── INFO BANNER ── */}
      <div className="landing-info-banner-wrap reveal">
        <div className="landing-info-banner-inner">
          <div className="landing-info-banner">
            <i className="fa-solid fa-circle-info" />
            <div className="landing-info-banner-text">
              <h4>Two deployment options — one powerful platform</h4>
              <p>
                Choose manual operations for fast deployment, or enable full
                automation with Shopify sync, real-time updates, and advanced
                analytics. Scale at your own pace.
              </p>
            </div>
            {/* <div className="landing-info-banner-action">
              <Link to="/signup" className="landing-banner-btn">
                <i className="fa-solid fa-arrow-right" /> Get Started
              </Link>
            </div> */}
          </div>
        </div>
      </div>

      {/* ── FEATURES ── */}
      <section className="landing-section" id="features">
        <div className="landing-section-inner">
          <div className="landing-section-title reveal">
            <div className="landing-badge">
              <i className="fa-solid fa-star" /> Platform Features
            </div>
            <h2>Everything your business needs</h2>
            <p>
              A comprehensive suite of modules covering every aspect of
              inventory and operations management — from order creation to
              financial reporting.
            </p>
          </div>
          <div className="landing-features-grid">
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                className="landing-feature-card reveal"
                style={{ transitionDelay: `${(i % 3) * 80}ms` }}
              >
                <div className="landing-feature-icon" style={f.iconStyle}>
                  <i className={`fa-solid ${f.icon}`} />
                </div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="landing-section landing-how-section" id="how">
        <div className="landing-section-inner">
          <div className="landing-section-title reveal">
            <div
              className="landing-badge"
              style={{
                background: "rgba(255,106,0,0.12)",
                borderColor: "rgba(255,106,0,0.25)",
              }}
            >
              <i className="fa-solid fa-route" /> How It Works
            </div>
            <h2 style={{ color: "#fff" }}>Up and running in 4 steps</h2>
            <p style={{ color: "#6b7280" }}>
              From sign-up to live operations — get your team onboarded and
              workflows automated quickly.
            </p>
          </div>
          <div className="landing-how-grid">
            {HOW_STEPS.map((step, i) => (
              <div
                key={step.step}
                className="landing-how-item reveal"
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <div className="landing-how-num">{step.step}</div>
                <div className="landing-how-icon">
                  <i className={`fa-solid ${step.icon}`} />
                </div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ROLES ── */}
      <section className="landing-section" id="roles">
        <div className="landing-section-inner">
          <div className="landing-section-title reveal">
            <div className="landing-badge">
              <i className="fa-solid fa-users-gear" /> User Roles
            </div>
            <h2>Built for every team member</h2>
            <p>
              Role-based access ensures each user sees exactly what they need —
              no more, no less. Configure permissions at both API and UI levels.
            </p>
          </div>
          <div className="landing-roles-grid">
            {ROLES.map((role, i) => (
              <div
                key={role.title}
                className="landing-role-card reveal"
                style={{
                  ...(role.dashed
                    ? { borderStyle: "dashed", cursor: "default" }
                    : undefined),
                  transitionDelay: `${(i % 4) * 70}ms`,
                }}
              >
                <div
                  className="landing-role-icon"
                  style={
                    role.dashed
                      ? { background: "var(--bg)", color: "var(--text-muted)" }
                      : undefined
                  }
                >
                  <i className={`fa-solid ${role.icon}`} />
                </div>
                <h4>{role.title}</h4>
                <p>{role.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TECH STACK ── */}
      <section className="landing-tech-section reveal">
        <div className="landing-section-inner">
          <div
            className="landing-section-title"
            style={{ marginBottom: "28px" }}
          >
            <h2 style={{ fontSize: "22px" }}>Powered by modern technology</h2>
            <p style={{ fontSize: "13px" }}>
              Built on the MERN stack with cloud-first architecture for
              reliability, speed, and scalability.
            </p>
          </div>
          <div className="landing-tech-row">
            {TECH_BADGES.map((tech) => (
              <div key={tech.label} className="landing-tech-badge">
                <i className={tech.icon} style={{ color: tech.iconColor }} />
                {tech.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="landing-section">
        <div className="landing-section-inner">
          <div className="landing-section-title reveal">
            <div className="landing-badge">
              <i className="fa-solid fa-comment-dots" /> Testimonials
            </div>
            <h2>Trusted by operations teams</h2>
            <p>
              See what teams say about managing inventory and operations with
              Zone In.
            </p>
          </div>
          <div className="landing-testimonial-grid">
            {TESTIMONIALS.map((t, i) => (
              <div
                key={t.initials}
                className="landing-testimonial-card reveal"
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <div className="landing-testimonial-stars">
                  {[1, 2, 3, 4].map((x) => (
                    <i key={x} className="fa-solid fa-star" />
                  ))}
                  {t.halfStar ? (
                    <i className="fa-solid fa-star-half-stroke" />
                  ) : (
                    <i className="fa-solid fa-star" />
                  )}
                </div>
                <p>"{t.quote}"</p>
                <div className="landing-testimonial-author">
                  <div
                    className="landing-t-avatar"
                    style={{ background: t.avatarBg }}
                  >
                    {t.initials}
                  </div>
                  <div>
                    <div className="landing-t-name">{t.name}</div>
                    <div className="landing-t-role">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="landing-cta-section reveal">
        <h2>
          Ready to <span>streamline</span> your operations?
        </h2>
        <p>
          Join teams already running smarter with Zone In. Get started in
          minutes — no credit card required.
        </p>
        <div className="landing-cta-btns">
          {/* <Link to="/signup" className="landing-btn-hero-primary">
            <i className="fa-solid fa-rocket" /> Create Free Account
          </Link> */}
          <Link to="/login" className="landing-btn-hero-secondary">
            <i className="fa-solid fa-sign-in-alt" /> Sign In
          </Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="landing-footer">
        <div className="landing-footer-grid">
          <div className="landing-footer-brand">
            <Link to="/" className="landing-logo">
              <div className="landing-logo-icon">
                <i className="fa-solid fa-chart-network" />
              </div>
              <span className="landing-logo-text">
                Zone<span>In</span>
              </span>
            </Link>
            <p>
              Advanced inventory and operations management platform built for
              growing businesses. Centralize, automate, and scale with
              confidence.
            </p>
          </div>

          <div className="landing-footer-col">
            <h5>Platform</h5>
            <button
              onClick={() => scrollTo("features")}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                display: "block",
                fontSize: "13px",
                color: "var(--text-secondary)",
                marginBottom: "8px",
                padding: 0,
                textAlign: "left",
              }}
            >
              Features
            </button>
            <button
              onClick={() => scrollTo("how")}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                display: "block",
                fontSize: "13px",
                color: "var(--text-secondary)",
                marginBottom: "8px",
                padding: 0,
                textAlign: "left",
              }}
            >
              How It Works
            </button>
            <button
              onClick={() => scrollTo("roles")}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                display: "block",
                fontSize: "13px",
                color: "var(--text-secondary)",
                marginBottom: "8px",
                padding: 0,
                textAlign: "left",
              }}
            >
              User Roles
            </button>
            <Link to="/about">About</Link>
          </div>

          <div className="landing-footer-col">
            <h5>Account</h5>
            <Link to="/login">Sign In</Link>
            <Link to="/signup">Create Account</Link>
            <a href="#">Reset Password</a>
            <a href="#">Admin Portal</a>
          </div>

          <div className="landing-footer-col">
            <h5>Support</h5>
            <a href="#">Documentation</a>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Contact Us</a>
          </div>
        </div>

        <div className="landing-footer-bottom">
          <p>
            © 2026 <span>Zone In</span>. All rights reserved. Built on MERN
            Stack.
          </p>
          <div className="landing-footer-social">
            <a href="#" className="landing-social-link" aria-label="LinkedIn">
              <i className="fa-brands fa-linkedin-in" />
            </a>
            <a href="#" className="landing-social-link" aria-label="GitHub">
              <i className="fa-brands fa-github" />
            </a>
            <a href="#" className="landing-social-link" aria-label="Twitter">
              <i className="fa-brands fa-twitter" />
            </a>
            <a
              href="mailto:abdulrehman286ib@gmail.com"
              className="landing-social-link"
              aria-label="Email"
            >
              <i className="fa-regular fa-envelope" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
