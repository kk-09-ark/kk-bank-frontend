import React, { useState, useEffect, useRef, useCallback } from "react";
import { register, login } from "../api/auth";
import { getAllNotes } from "../api/notes";
import { checkMyPurchase } from "../api/bundle";
import { downloadNote } from "../utils/download";

const PRODUCTS = [
  {
    id: "interview",
    badge: "Popular",
    title: "Interview Preparation",
    subtitle: "Crack your next interview with confidence",
    price: 22,
    oldPrice: 199,
    color: "#D97706",
    features: [
      "HR Interview Questions & Answers",
      "Technical Interview Prep (Java, Spring Boot)",
      "DSA Most Asked Problems",
      "SQL & Database Interview Guide",
      "Banking & Placement Papers",
      "System Design Basics",
    ],
  },
  {
    id: "notes",
    badge: "Best for Students",
    title: "Study Notes & Cheatsheets",
    subtitle: "Quick revision handouts for exams & prep",
    price: 22,
    oldPrice: 199,
    color: "#059669",
    features: [
      "Java Concepts Cheatsheet",
      "Spring Boot Handout",
      "SQL Queries Quick Reference",
      "REST API Design Notes",
      "DSA Revision Sheets",
      "Clean Code & Best Practices",
    ],
  },
  {
    id: "combo",
    badge: "Best Value",
    title: "Combo Bundle",
    subtitle: "Interview Prep + Study Notes — everything in one place",
    price: 39,
    oldPrice: 398,
    color: "#7C3AED",
    features: [
      "All Interview Preparation PDFs",
      "All Study Notes & Cheatsheets",
      "Lifetime access — no expiry",
      "Free updates forever",
      "Download anytime from dashboard",
      "Save ₹6 vs buying separately",
    ],
  },
];

const STEPS = [
  { num: "01", title: "Pick a bundle", body: "Choose Interview Prep, Study Notes, or grab the Combo." },
  { num: "02", title: "Pay securely", body: "One-time Razorpay checkout — UPI, card, netbanking." },
  { num: "03", title: "Download anytime", body: "Your dashboard stays unlocked. New PDFs appear automatically." },
];

const FAQS = [
  { q: "What's the difference between the bundles?", a: "Interview Preparation focuses on interview-specific questions and prep. Study Notes are cheatsheets and handouts for learning. The Combo includes both at a discounted price." },
  { q: "Can I upgrade to the Combo later?", a: "Yes — just purchase the Combo bundle and you'll get access to everything. Contact support if you need help." },
  { q: "Do I get new PDFs added later, for free?", a: "Yes — whichever bundle you buy, every future PDF in that bundle is included at no extra cost." },
  { q: "Is this a subscription?", a: "No — it's a single one-time payment for lifetime access. No renewals, no hidden charges." },
];

const REVIEWS = [
  { name: "Rahul Sharma", role: "Java Developer · Pune", quote: "The Interview Preparation bundle covered everything I got asked in my SDE-1 interviews. The Spring Boot notes alone are worth it." },
  { name: "Priya Patel", role: "CS Student · Ahmedabad", quote: "The Study Notes are clean, to the point, zero fluff. Perfect for quick revision before exams." },
  { name: "Aman Verma", role: "Backend Developer · Delhi", quote: "System Design + SQL + Postman in one place. Saved me hours of Googling. The Combo bundle is a steal." },
  { name: "Sneha Kulkarni", role: "SDE Intern · Bengaluru", quote: "The 'Most Asked Interview Questions' PDF is gold. These notes were a big part of my internship prep." },
  { name: "Vikram Singh", role: "Placement Aspirant · Lucknow", quote: "One-time payment, lifetime access, and new PDFs keep appearing. Best ₹22 I've spent on my career." },
  { name: "Neha Gupta", role: "Full Stack Developer · Hyderabad", quote: "Recommended the Combo to my whole college batch. The Logic + Java + roadmap is perfect for beginners." },
];

function Reveal({ children, className = "", as: Tag = "div", ...rest }) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) { setInView(true); obs.disconnect(); }
        });
      },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <Tag ref={ref} className={`reveal ${inView ? "in" : ""} ${className}`} {...rest}>
      {children}
    </Tag>
  );
}

function CountUp({ end, duration = 1600, suffix = "", decimals = 0 }) {
  const ref = useRef(null);
  const [started, setStarted] = useState(false);
  const [value, setValue] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) { setStarted(true); obs.disconnect(); }
        });
      },
      { threshold: 0.4 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    let raf;
    const startTime = performance.now();
    const tick = (now) => {
      const p = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(end * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [started, end, duration]);

  const formatted = decimals > 0
    ? value.toFixed(decimals)
    : Math.round(value).toLocaleString("en-IN");

  return <span ref={ref}>{formatted}{suffix}</span>;
}

export default function LandingPage({ user, setUser, onNavigate }) {
  const [lineVisible, setLineVisible] = useState([false, false, false, false]);
  const [termStarted, setTermStarted] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const [notes, setNotes] = useState([]);
  const [notesLoading, setNotesLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({ name: "", email: "", password: "" });
  const [authMsg, setAuthMsg] = useState("");
  const [purchaseStatus, setPurchaseStatus] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedBundle, setSelectedBundle] = useState(null);

  const termRef = useRef(null);
  const buyRef = useRef(null);

  useEffect(() => {
    getAllNotes()
      .then((res) => setNotes(Array.isArray(res.data) ? res.data : []))
      .catch(() => {})
      .finally(() => setNotesLoading(false));
  }, []);

  useEffect(() => {
    if (user.token) {
      checkMyPurchase()
        .then((res) => setPurchaseStatus(res.data?.purchased === true))
        .catch(() => setPurchaseStatus(null));
    } else {
      setPurchaseStatus(null);
    }
  }, [user]);

  useEffect(() => {
    const el = termRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) { setTermStarted(true); obs.disconnect(); }
        });
      },
      { threshold: 0.4 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!termStarted) return;
    const timers = [0, 1, 2, 3].map((i) =>
      setTimeout(() => {
        setLineVisible((prev) => { const next = [...prev]; next[i] = true; return next; });
      }, 450 * (i + 1))
    );
    return () => timers.forEach(clearTimeout);
  }, [termStarted]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width:768px)");
    const onChange = (e) => { if (e.matches) setMobileMenuOpen(false); };
    mq.addEventListener("change", onChange);
    const onKey = (e) => { if (e.key === "Escape") setMobileMenuOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => { mq.removeEventListener("change", onChange); window.removeEventListener("keydown", onKey); };
  }, []);

  const isLoggedIn = !!user.token;
  const firstName = user.email ? user.email.split("@")[0] : "";
  const avatarInitial = (firstName[0] || "?").toUpperCase();
  const closeMenu = () => setMobileMenuOpen(false);
  const resolveAsset = (url) =>
    url && !url.startsWith("http") ? `${import.meta.env.VITE_API_BASE_URL || ""}${url}` : url;

  const scrollToBuy = useCallback(() => {
    buyRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const handleAuthInput = (e) => {
    setAuthForm({ ...authForm, [e.target.name]: e.target.value });
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthMsg("");
    try {
      if (authMode === "login") {
        const res = await login({ email: authForm.email, password: authForm.password });
        const { token, email: em, role, userId } = res.data;
        localStorage.setItem("token", token);
        localStorage.setItem("email", em);
        localStorage.setItem("role", role);
        if (userId) localStorage.setItem("userId", userId);
        setUser({ email: em, token, role, userId });
        setShowAuth(false);
        setAuthForm({ name: "", email: "", password: "" });
        if (role === "ROLE_ADMIN") onNavigate("adminDashboard");
      } else {
        const res = await register({ name: authForm.name, email: authForm.email, password: authForm.password });
        setAuthMsg(res.data);
        if (res.data === "Registration Successful") {
          setAuthMode("login");
          setAuthForm({ name: "", email: "", password: "" });
        }
      }
    } catch (err) {
      const msg = typeof err.response?.data === "string"
        ? err.response.data
        : err.response?.data?.message || err.response?.data?.error || "Something went wrong";
      setAuthMsg(msg);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("email");
    localStorage.removeItem("role");
    localStorage.removeItem("userId");
    setUser({ email: null, token: null, role: null, userId: null });
    setPurchaseStatus(null);
    setMobileMenuOpen(false);
  };

  const switchAuthMode = () => {
    setAuthMode(authMode === "login" ? "register" : "login");
    setAuthMsg("");
  };

  const openAuthModal = (mode) => {
    setAuthMode(mode);
    setAuthMsg("");
    setAuthForm({ name: "", email: "", password: "" });
    setShowAuth(true);
  };

  const handleBuyBundle = (product) => {
    if (!isLoggedIn) {
      setSelectedBundle(product);
      openAuthModal("register");
      return;
    }
    setSelectedBundle(product);
    onNavigate("dashboard");
  };

  return (
    <div className="kkn-root">
      <style>{`
        .kkn-root{
          --bg:#FFFBF0;
          --surface:#FFFFFF;
          --surface-2:#FFF7E6;
          --surface-3:#FEF3D1;
          --border:#E8DCC8;
          --text:#1A1A1A;
          --text-dim:#6B6B6B;
          --accent:#D97706;
          --accent-light:#FDE68A;
          --accent-soft:#FEF3C7;
          --on-accent:#FFFFFF;
          --radius:14px;
          --font-mono:'JetBrains Mono', monospace;
          --font-sans:'Inter', sans-serif;
          --font-display:'Kalam', cursive;
          background:var(--bg);
          color:var(--text);
          font-family:var(--font-sans);
          overflow-x:hidden;
          -webkit-font-smoothing:antialiased;
          position:relative;
          min-height:100vh;
        }
        .kkn-root *{margin:0;padding:0;box-sizing:border-box;}
        .kkn-root ::selection{background:var(--accent);color:var(--on-accent);}

        .kkn-root .bgGrid{
          position:fixed;inset:0;
          background-image:
            linear-gradient(rgba(217,119,6,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(217,119,6,0.04) 1px, transparent 1px);
          background-size:48px 48px;
          pointer-events:none;z-index:0;
          mask-image:radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 100%);
        }

        .kkn-root .wrap{max-width:1120px;margin:0 auto;padding:0 24px;position:relative;z-index:1;}

        .kkn-root nav{
          position:sticky;top:0;z-index:50;
          background:rgba(255,251,240,0.85);
          backdrop-filter:blur(12px);
          border-bottom:1px solid var(--border);
        }
        .kkn-root nav .wrap{display:flex;align-items:center;justify-content:space-between;height:68px;}
        .kkn-root .logo{
          font-family:var(--font-mono);font-weight:700;font-size:16px;
          display:flex;align-items:center;gap:8px;letter-spacing:-0.02em;
        }
        .kkn-root .logo .dot{width:8px;height:8px;background:var(--accent);border-radius:2px;box-shadow:0 0 12px rgba(217,119,6,0.3);}
        .kkn-root .logo .brand{color:var(--text);}
        .kkn-root .logo .brand span{color:var(--accent);}
        .kkn-root .navlinks{display:flex;gap:32px;font-family:var(--font-mono);font-size:13px;color:var(--text-dim);align-items:center;}
        .kkn-root .navlinks a{color:inherit;text-decoration:none;transition:color .2s;cursor:pointer;}
        .kkn-root .navlinks a:hover{color:var(--accent);}
        .kkn-root .nav-cta{
          font-family:var(--font-mono);font-size:13px;font-weight:600;
          background:var(--accent);color:var(--on-accent);padding:8px 16px;border-radius:8px;
          text-decoration:none;transition:transform .15s, box-shadow .15s;
          border:none;cursor:pointer;
        }
        .kkn-root .nav-cta:hover{transform:translateY(-1px);box-shadow:0 4px 20px rgba(217,119,6,0.3);}
        .kkn-root .nav-btn{
          font-family:var(--font-mono);font-size:13px;font-weight:600;
          background:transparent;color:var(--text-dim);padding:8px 16px;border-radius:8px;
          border:1px solid var(--border);cursor:pointer;transition:color .2s, border-color .2s;
        }
        .kkn-root .nav-btn:hover{color:var(--accent);border-color:var(--accent);}

        .kkn-root .hero{padding:88px 0 64px;}
        .kkn-root .eyebrow{
          font-family:var(--font-mono);font-size:12px;color:var(--accent);
          letter-spacing:0.14em;text-transform:uppercase;
          display:flex;align-items:center;gap:10px;margin-bottom:20px;
        }
        .kkn-root .eyebrow::before{content:"";width:20px;height:1px;background:var(--accent);}
        .kkn-root h1{
          font-family:var(--font-display);font-weight:700;letter-spacing:-0.01em;
          font-size:clamp(32px,5.2vw,58px);line-height:1.06;max-width:820px;
        }
        .kkn-root h1 .accent{color:var(--accent);}
        .kkn-root .hero-sub{font-size:17px;color:var(--text-dim);max-width:560px;margin-top:22px;line-height:1.6;}
        .kkn-root .hero-actions{display:flex;align-items:center;gap:18px;margin-top:34px;flex-wrap:wrap;}

        .kkn-root .btn-buy{
          font-family:var(--font-mono);font-weight:700;font-size:15px;
          background:var(--accent);color:var(--on-accent);border:none;
          padding:16px 30px;border-radius:10px;cursor:pointer;
          display:inline-flex;align-items:center;gap:10px;
          transition:transform .15s, box-shadow .15s;position:relative;
        }
        .kkn-root .btn-buy:hover{transform:translateY(-2px);box-shadow:0 10px 32px rgba(217,119,6,0.35);}
        .kkn-root .btn-buy:active{transform:translateY(0);}
        .kkn-root .btn-buy .arrow{transition:transform .2s;display:inline-block;}
        .kkn-root .btn-buy:hover .arrow{transform:translateX(3px);}

        .kkn-root .price-tag{font-family:var(--font-mono);font-size:13px;color:var(--text-dim);}
        .kkn-root .price-tag .old{text-decoration:line-through;opacity:0.5;margin-right:6px;}
        .kkn-root .price-tag .new{color:var(--accent);font-weight:700;font-size:15px;}

        .kkn-root .badge-pill{
          font-family:var(--font-mono);font-size:11px;padding:4px 10px;
          border-radius:20px;background:var(--accent-soft);color:var(--accent);
          display:inline-block;font-weight:600;
        }

        .kkn-root .terminal{
          margin-top:56px;background:var(--surface);
          border:1px solid var(--border);border-radius:var(--radius);
          overflow:hidden;box-shadow:0 20px 60px -15px rgba(0,0,0,0.08);max-width:720px;
        }
        .kkn-root .term-bar{
          display:flex;align-items:center;gap:8px;
          padding:12px 16px;border-bottom:1px solid var(--border);background:var(--surface-2);
        }
        .kkn-root .term-bar .tdot{width:10px;height:10px;border-radius:50%;}
        .kkn-root .term-bar .tdot:nth-child(1){background:#ff5f56;}
        .kkn-root .term-bar .tdot:nth-child(2){background:#ffbd2e;}
        .kkn-root .term-bar .tdot:nth-child(3){background:#27c93f;}
        .kkn-root .term-title{font-family:var(--font-mono);font-size:12px;color:var(--text-dim);margin-left:8px;}
        .kkn-root .term-body{
          padding:22px 24px 26px;
          font-family:var(--font-mono);font-size:13.5px;line-height:1.9;min-height:190px;
          color:var(--text-dim);
        }
        .kkn-root .term-body .prompt{color:var(--accent);}
        .kkn-root .term-line{opacity:0;transition:opacity .3s;}
        .kkn-root .term-line.show{opacity:1;}
        .kkn-root .term-line .hl{color:var(--text);}
        .kkn-root .term-line .y{color:var(--accent);font-weight:600;}
        .kkn-root .cursor{display:inline-block;width:8px;height:15px;background:var(--accent);
          vertical-align:middle;animation:kkn-blink 1s steps(1) infinite;}
        @keyframes kkn-blink{50%{opacity:0;}}

        .kkn-root .stat-band{
          display:grid;grid-template-columns:repeat(4,1fr);gap:24px;
          background:var(--surface);border:1px solid var(--border);border-radius:20px;
          padding:40px 32px;margin-top:48px;
          box-shadow:0 8px 30px -10px rgba(0,0,0,0.06);
        }
        .kkn-root .stat{text-align:center;}
        .kkn-root .stat-num{
          font-family:var(--font-mono);font-weight:800;
          font-size:clamp(26px,3.4vw,40px);color:var(--accent);line-height:1;
        }
        .kkn-root .stat-label{
          font-family:var(--font-mono);font-size:11.5px;color:var(--text-dim);
          text-transform:uppercase;letter-spacing:0.09em;margin-top:10px;
        }

        .kkn-root .section{padding:88px 0;border-top:1px solid var(--border);}
        .kkn-root .section-head{margin-bottom:48px;}
        .kkn-root .section-eyebrow{
          font-family:var(--font-mono);font-size:12px;color:var(--accent);
          letter-spacing:0.12em;text-transform:uppercase;margin-bottom:10px;
        }
        .kkn-root .section-title{
          font-family:var(--font-display);font-weight:700;font-size:clamp(22px,3vw,32px);letter-spacing:-0.01em;
        }
        .kkn-root .section-sub{color:var(--text-dim);margin-top:10px;font-size:15px;max-width:520px;}

        .kkn-root .product-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;}
        .kkn-root .product-card{
          background:var(--surface);border:1px solid var(--border);border-radius:20px;
          padding:32px 28px;position:relative;overflow:hidden;
          transition:transform .25s, box-shadow .25s, border-color .25s;
          display:flex;flex-direction:column;
        }
        .kkn-root .product-card:hover{transform:translateY(-4px);box-shadow:0 20px 50px -12px rgba(0,0,0,0.1);}
        .kkn-root .product-card.featured{
          border-color:var(--accent);box-shadow:0 8px 40px -10px rgba(217,119,6,0.2);
        }
        .kkn-root .product-card.featured:hover{box-shadow:0 16px 50px -10px rgba(217,119,6,0.3);}
        .kkn-root .product-card .card-badge{
          position:absolute;top:16px;right:16px;
          font-family:var(--font-mono);font-size:11px;font-weight:700;
          padding:4px 12px;border-radius:20px;
          background:var(--accent-soft);color:var(--accent);
        }
        .kkn-root .product-card.featured .card-badge{background:var(--accent);color:var(--on-accent);}
        .kkn-root .product-card .card-icon{
          width:52px;height:52px;border-radius:14px;
          display:flex;align-items:center;justify-content:center;
          font-size:24px;margin-bottom:20px;
        }
        .kkn-root .product-card .card-title{
          font-family:var(--font-display);font-weight:700;font-size:22px;margin-bottom:6px;
        }
        .kkn-root .product-card .card-subtitle{
          color:var(--text-dim);font-size:14px;line-height:1.5;margin-bottom:20px;
        }
        .kkn-root .product-card .card-price{
          display:flex;align-items:baseline;gap:8px;margin-bottom:20px;
        }
        .kkn-root .product-card .card-price .amount{
          font-family:var(--font-mono);font-weight:800;font-size:36px;line-height:1;
        }
        .kkn-root .product-card .card-price .old{
          font-family:var(--font-mono);font-size:14px;color:var(--text-dim);text-decoration:line-through;
        }
        .kkn-root .product-card .card-features{list-style:none;margin-bottom:24px;flex:1;}
        .kkn-root .product-card .card-features li{
          display:flex;align-items:flex-start;gap:8px;
          font-size:13.5px;color:var(--text-dim);margin-bottom:10px;line-height:1.4;
        }
        .kkn-root .product-card .card-features li .check{font-weight:700;flex-shrink:0;margin-top:1px;}
        .kkn-root .product-card .card-btn{
          font-family:var(--font-mono);font-weight:700;font-size:14px;
          padding:14px 20px;border-radius:10px;border:none;cursor:pointer;
          transition:transform .15s, box-shadow .15s;width:100%;text-align:center;
        }
        .kkn-root .product-card .card-btn:hover{transform:translateY(-1px);}
        .kkn-root .product-card .card-btn.primary{
          background:var(--accent);color:var(--on-accent);
          box-shadow:0 4px 20px rgba(217,119,6,0.25);
        }
        .kkn-root .product-card .card-btn.primary:hover{box-shadow:0 8px 30px rgba(217,119,6,0.35);}
        .kkn-root .product-card .card-btn.secondary{
          background:var(--surface-2);color:var(--text);border:1px solid var(--border);
        }
        .kkn-root .product-card .card-btn.secondary:hover{border-color:var(--accent);color:var(--accent);}

        .kkn-root .steps{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;}
        .kkn-root .step{
          border:1px solid var(--border);border-radius:14px;padding:28px;
          background:var(--surface);transition:border-color .2s, transform .2s;
        }
        .kkn-root .step:hover{border-color:var(--accent);transform:translateY(-3px);}
        .kkn-root .step .num{font-family:var(--font-mono);color:var(--accent);font-size:13px;margin-bottom:14px;}
        .kkn-root .step h3{font-family:var(--font-mono);font-size:16px;margin-bottom:8px;}
        .kkn-root .step p{color:var(--text-dim);font-size:14px;line-height:1.6;}

        .kkn-root .review-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;}
        .kkn-root .review-card{
          background:var(--surface);border:1px solid var(--border);border-radius:14px;
          padding:24px;display:flex;flex-direction:column;
          transition:border-color .2s, transform .2s;
        }
        .kkn-root .review-card:hover{border-color:var(--accent);transform:translateY(-3px);}
        .kkn-root .review-stars{color:var(--accent);font-size:13px;letter-spacing:3px;margin-bottom:12px;}
        .kkn-root .review-quote{color:var(--text-dim);font-size:14px;line-height:1.65;margin-bottom:20px;flex:1;}
        .kkn-root .review-author{
          display:flex;align-items:center;gap:12px;
          border-top:1px solid var(--border);padding-top:16px;
        }
        .kkn-root .review-avatar{
          width:38px;height:38px;border-radius:50%;background:var(--accent-soft);color:var(--accent);
          display:flex;align-items:center;justify-content:center;
          font-family:var(--font-mono);font-weight:700;font-size:14px;flex-shrink:0;
        }
        .kkn-root .review-name{font-family:var(--font-mono);font-weight:700;font-size:13.5px;color:var(--text);}
        .kkn-root .review-role{font-size:12px;color:var(--text-dim);margin-top:2px;}

        .kkn-root .faq-item{border-bottom:1px solid var(--border);padding:22px 0;cursor:pointer;}
        .kkn-root .faq-q{display:flex;justify-content:space-between;align-items:center;font-family:var(--font-mono);font-weight:600;font-size:15px;}
        .kkn-root .faq-q .plus{color:var(--accent);transition:transform .25s;font-size:18px;display:inline-block;}
        .kkn-root .faq-item.open .plus{transform:rotate(45deg);}
        .kkn-root .faq-a{
          max-height:0;overflow:hidden;transition:max-height .3s ease, padding .3s ease;
          color:var(--text-dim);font-size:14.5px;line-height:1.7;
        }
        .kkn-root .faq-item.open .faq-a{max-height:200px;padding-top:14px;}

        .kkn-root footer{border-top:1px solid var(--border);padding:40px 0;}
        .kkn-root footer .wrap{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px;}
        .kkn-root footer .fmark{font-family:var(--font-mono);font-size:13px;color:var(--text-dim);}
        .kkn-root footer .fmark span{color:var(--accent);}
        .kkn-root .fsocial{display:flex;gap:20px;font-family:var(--font-mono);font-size:13px;}
        .kkn-root .fsocial a{color:var(--text-dim);text-decoration:none;transition:color .2s;}
        .kkn-root .fsocial a:hover{color:var(--accent);}

        .kkn-root .reveal{opacity:0;transform:translateY(18px);transition:opacity .6s ease, transform .6s ease;}
        .kkn-root .reveal.in{opacity:1;transform:translateY(0);}

        .kkn-overlay{
          position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:100;
          display:flex;align-items:center;justify-content:center;
          padding:24px;backdrop-filter:blur(4px);
        }
        .kkn-modal{
          background:var(--surface);border:1px solid var(--border);
          border-radius:20px;padding:36px;width:100%;max-width:420px;position:relative;
          box-shadow:0 25px 60px -15px rgba(0,0,0,0.15);
        }
        .kkn-modal h2{font-family:var(--font-display);font-size:24px;margin-bottom:6px;}
        .kkn-modal .sub{color:var(--text-dim);font-size:14px;margin-bottom:24px;}
        .kkn-modal .field{margin-bottom:16px;}
        .kkn-modal label{
          font-family:var(--font-mono);font-size:11px;color:var(--text-dim);
          display:block;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.06em;
        }
        .kkn-modal input{
          width:100%;padding:10px 14px;border-radius:8px;
          background:var(--surface-2);border:1px solid var(--border);
          color:var(--text);font-family:var(--font-mono);font-size:14px;
          outline:none;transition:border-color .2s;
        }
        .kkn-modal input:focus{border-color:var(--accent);}
        .kkn-modal .btn-submit{
          width:100%;padding:12px;border-radius:8px;
          background:var(--accent);color:var(--on-accent);
          font-family:var(--font-mono);font-weight:700;font-size:14px;
          border:none;cursor:pointer;transition:opacity .2s;margin-top:8px;
        }
        .kkn-modal .btn-submit:hover{opacity:0.9;}
        .kkn-modal .switch{text-align:center;margin-top:16px;font-size:13px;color:var(--text-dim);}
        .kkn-modal .switch a{color:var(--accent);cursor:pointer;text-decoration:underline;}
        .kkn-modal .msg{
          font-family:var(--font-mono);font-size:12px;padding:8px 12px;
          border-radius:6px;margin-bottom:16px;
        }
        .kkn-modal .msg.err{background:#FEF2F2;color:#DC2626;}
        .kkn-modal .msg.ok{background:#F0FDF4;color:#16A34A;}
        .kkn-modal .close{
          position:absolute;top:16px;right:20px;
          background:none;border:none;color:var(--text-dim);font-size:22px;cursor:pointer;
          font-family:var(--font-mono);
        }
        .kkn-modal .close:hover{color:var(--text);}

        .kkn-dashboard{padding:48px 0;}
        .kkn-dashboard .grid{
          display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:16px;margin-top:24px;
        }
        .kkn-dashboard .note-card{
          background:var(--surface);border:1px solid var(--border);
          border-radius:12px;padding:20px;transition:border-color .2s;
        }
        .kkn-dashboard .note-card:hover{border-color:var(--accent);}
        .kkn-dashboard .note-card .nttl{font-family:var(--font-mono);font-weight:700;font-size:14px;margin-bottom:6px;}
        .kkn-dashboard .note-card .ndesc{color:var(--text-dim);font-size:13px;line-height:1.5;margin-bottom:12px;}
        .kkn-dashboard .note-card .nlink{
          font-family:var(--font-mono);font-size:12px;color:var(--accent);
          text-decoration:none;display:inline-flex;align-items:center;gap:4px;
        }
        .kkn-dashboard .note-card .nlink:hover{text-decoration:underline;}

        .kkn-root .nav-mobile{display:none;align-items:center;gap:10px;flex-shrink:0;}
        .kkn-root .hamburger{
          display:none;flex-direction:column;align-items:center;justify-content:center;
          gap:4px;width:40px;height:40px;flex-shrink:0;
          background:transparent;border:1px solid var(--border);border-radius:9px;
          cursor:pointer;padding:0;
        }
        .kkn-root .hamburger span{
          display:block;width:18px;height:2px;border-radius:2px;background:var(--text);
          transition:transform .25s ease, opacity .25s ease;
        }
        .kkn-root .hamburger.open span:nth-child(1){transform:translateY(6px) rotate(45deg);}
        .kkn-root .hamburger.open span:nth-child(2){opacity:0;}
        .kkn-root .hamburger.open span:nth-child(3){transform:translateY(-6px) rotate(-45deg);}
        .kkn-root .nav-avatar{
          display:none;align-items:center;justify-content:center;
          width:36px;height:36px;border-radius:50%;flex-shrink:0;
          background:var(--accent);color:var(--on-accent);
          font-family:var(--font-mono);font-weight:700;font-size:15px;
          border:none;cursor:pointer;box-shadow:0 0 0 2px var(--border);
        }
        .kkn-drawer-backdrop{
          position:fixed;inset:0;background:rgba(0,0,0,0.3);z-index:110;
          opacity:0;pointer-events:none;transition:opacity .3s ease;backdrop-filter:blur(2px);
        }
        .kkn-drawer-backdrop.open{opacity:1;pointer-events:auto;}
        .kkn-drawer{
          position:fixed;top:0;right:0;bottom:0;width:min(320px,86vw);
          background:var(--surface);border-left:1px solid var(--border);
          z-index:120;padding:20px 16px 24px;overflow-y:auto;
          transform:translateX(102%);transition:transform .3s cubic-bezier(.2,.8,.2,1);
          display:flex;flex-direction:column;
        }
        .kkn-drawer.open{transform:translateX(0);}
        .kkn-drawer .drawer-close{
          align-self:flex-end;width:36px;height:36px;display:flex;align-items:center;justify-content:center;
          background:transparent;border:1px solid var(--border);border-radius:9px;
          color:var(--text-dim);font-size:15px;cursor:pointer;margin-bottom:10px;
        }
        .kkn-drawer .drawer-close:hover{color:var(--text);border-color:var(--accent);}
        .kkn-drawer .drawer-user{
          display:flex;align-items:center;gap:12px;
          padding:6px 8px 16px;margin-bottom:8px;border-bottom:1px solid var(--border);
        }
        .kkn-drawer .avatar-lg{
          width:44px;height:44px;border-radius:50%;flex-shrink:0;
          background:var(--accent);color:var(--on-accent);
          display:flex;align-items:center;justify-content:center;
          font-family:var(--font-mono);font-weight:700;font-size:18px;
        }
        .kkn-drawer .drawer-meta{min-width:0;flex:1;}
        .kkn-drawer .drawer-name{font-family:var(--font-mono);font-weight:700;font-size:15px;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .kkn-drawer .drawer-email{font-family:var(--font-mono);font-size:11.5px;color:var(--text-dim);margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .kkn-drawer .drawer-links{display:flex;flex-direction:column;gap:2px;}
        .kkn-drawer .drawer-links a,
        .kkn-drawer .drawer-links button{
          display:flex;align-items:center;width:100%;
          padding:14px 12px;border-radius:10px;
          font-family:var(--font-mono);font-size:14px;color:var(--text);
          text-decoration:none;background:none;border:none;cursor:pointer;text-align:left;
          transition:background .2s, color .2s;
        }
        .kkn-drawer .drawer-links a:hover,
        .kkn-drawer .drawer-links button:hover{background:var(--surface-2);color:var(--accent);}
        .kkn-drawer .drawer-links button.cta{margin-top:10px;background:var(--accent);color:var(--on-accent);font-weight:700;justify-content:center;}
        .kkn-drawer .drawer-links button.logout{color:#DC2626;}
        .kkn-drawer .drawer-links button.logout:hover{background:#FEF2F2;color:#DC2626;}

        @media (min-width:768px){
          .kkn-root .nav-mobile{display:none !important;}
          .kkn-drawer,.kkn-drawer-backdrop{display:none !important;}
        }
        @media (max-width:767px){
          .kkn-root .navlinks{display:none;}
          .kkn-root .nav-mobile{display:flex;}
          .kkn-root .hamburger{display:flex;}
          .kkn-root .nav-avatar{display:flex;}
        }

        @media (max-width:900px){
          .kkn-root .product-grid{grid-template-columns:1fr;max-width:420px;}
          .kkn-root .review-grid{grid-template-columns:1fr 1fr;}
        }
        @media (max-width:760px){
          .kkn-root .steps{grid-template-columns:1fr;}
          .kkn-root .review-grid{grid-template-columns:1fr;}
          .kkn-root .stat-band{grid-template-columns:1fr 1fr;gap:22px 16px;padding:28px 16px;margin-top:32px;border-radius:16px;}
        }
        @media (max-width:680px){
          .kkn-root .wrap{padding:0 18px;}
          .kkn-root .hero{padding:48px 0 36px;}
          .kkn-root h1{font-size:clamp(26px,7.8vw,34px);line-height:1.14;}
          .kkn-root .hero-sub{font-size:14.5px;margin-top:16px;}
          .kkn-root .eyebrow{font-size:11px;margin-bottom:14px;}
          .kkn-root .hero-actions{flex-direction:column;align-items:stretch;gap:14px;margin-top:26px;}
          .kkn-root .btn-buy{width:100%;justify-content:center;padding:15px 22px;font-size:14px;}
          .kkn-root .price-tag{text-align:center;}
          .kkn-root .terminal{margin-top:32px;border-radius:10px;}
          .kkn-root .term-bar{padding:10px 12px;}
          .kkn-root .term-title{font-size:11px;}
          .kkn-root .term-body{padding:16px 14px 20px;font-size:11.5px;line-height:1.85;min-height:auto;white-space:normal;word-break:break-word;}
          .kkn-root .section{padding:56px 0;}
          .kkn-root .product-card{padding:24px 20px;}
          .kkn-root .product-card .card-title{font-size:20px;}
          .kkn-root .product-card .card-price .amount{font-size:30px;}
          .kkn-root .step{padding:20px;}
          .kkn-root .step h3{font-size:15px;}
          .kkn-root .step p{font-size:13.5px;}
          .kkn-root .section-title{font-size:22px;}
          .kkn-root .section-sub{font-size:13.5px;}
          .kkn-root .faq-q{font-size:14px;}
          .kkn-root footer .wrap{flex-direction:column;align-items:flex-start;}
        }
        @media (max-width:380px){
          .kkn-root .term-body{font-size:10.5px;}
        }
        @media (prefers-reduced-motion: reduce){
          .kkn-root *{animation-duration:0.001ms !important;transition-duration:0.001ms !important;}
        }
      `}</style>

      <div className="bgGrid" />

      <nav>
        <div className="wrap">
          <div className="logo">
            <span className="dot"></span>
            <span className="brand">codewith<span>_kk</span> / notes</span>
          </div>
          <div className="navlinks">
            <a href="#products">Bundles</a>
            <a href="#how">How it works</a>
            <a href="#faq">FAQ</a>
            {isLoggedIn ? (
              <>
                <span className="badge-pill">{user.email}</span>
                <button className="nav-btn" onClick={() => onNavigate("dashboard")}>Dashboard</button>
                <button className="nav-btn" onClick={() => onNavigate("profile")}>Profile</button>
                <button className="nav-btn" onClick={handleLogout}>Logout</button>
              </>
            ) : (
              <>
                <a onClick={() => openAuthModal("login")}>Login</a>
                <button className="nav-cta" onClick={() => openAuthModal("register")}>Sign Up</button>
              </>
            )}
          </div>
          <div className="nav-mobile">
            {isLoggedIn && (
              <button className="nav-avatar" onClick={() => setMobileMenuOpen(true)} aria-label="Open menu">
                {avatarInitial}
              </button>
            )}
            <button
              className={`hamburger ${mobileMenuOpen ? "open" : ""}`}
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              <span></span><span></span><span></span>
            </button>
          </div>
        </div>
      </nav>

      <div className={`kkn-drawer-backdrop ${mobileMenuOpen ? "open" : ""}`} onClick={closeMenu} />
      <div className={`kkn-drawer ${mobileMenuOpen ? "open" : ""}`} role="dialog" aria-label="Menu">
        <button className="drawer-close" onClick={closeMenu} aria-label="Close menu">✕</button>
        {isLoggedIn && (
          <div className="drawer-user">
            <span className="avatar-lg">{avatarInitial}</span>
            <div className="drawer-meta">
              <div className="drawer-name">{firstName || "Account"}</div>
              {user.email && <div className="drawer-email">{user.email}</div>}
            </div>
          </div>
        )}
        <div className="drawer-links">
          <a href="#products" onClick={closeMenu}>Bundles</a>
          <a href="#how" onClick={closeMenu}>How it Works</a>
          <a href="#faq" onClick={closeMenu}>FAQ</a>
          {isLoggedIn ? (
            <>
              <button onClick={() => { closeMenu(); onNavigate("dashboard"); }}>My Notes</button>
              <button onClick={() => { closeMenu(); onNavigate("profile"); }}>Profile</button>
              <button className="logout" onClick={() => { closeMenu(); handleLogout(); }}>Logout</button>
            </>
          ) : (
            <>
              <button onClick={() => { closeMenu(); openAuthModal("login"); }}>Login</button>
              <button className="cta" onClick={() => { closeMenu(); openAuthModal("register"); }}>Sign Up</button>
            </>
          )}
        </div>
      </div>

      {isLoggedIn && purchaseStatus ? (
        <section className="section kkn-dashboard">
          <div className="wrap">
            <div className="section-eyebrow">Your Library</div>
            <div className="section-title">All your notes, unlocked.</div>
            <p className="section-sub">Download any PDF from your bundle — new ones appear automatically.</p>
            <div className="grid">
              {notes.filter((n) => n.active).map((note) => (
                <div className="note-card" key={note.id}>
                  {note.thumbnailUrl && (
                    <div style={{ marginBottom: 10, borderRadius: 8, overflow: "hidden", aspectRatio: "1.4", background: "var(--surface-2)" }}>
                      <img src={resolveAsset(note.thumbnailUrl)} alt={note.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    </div>
                  )}
                  <div className="nttl">{note.title}</div>
                  <div className="ndesc">{note.description}</div>
                  {note.pdfUrl ? (
                    <button className="nlink" onClick={() => downloadNote({ ...note, pdfUrl: resolveAsset(note.pdfUrl) })} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                      Download PDF →
                    </button>
                  ) : (
                    <span style={{ color: "var(--text-dim)", fontSize: 12 }}>Coming soon</span>
                  )}
                </div>
              ))}
              {notes.length === 0 && (
                <div style={{ color: "var(--text-dim)", fontSize: 14 }}>No notes available yet.</div>
              )}
            </div>
          </div>
        </section>
      ) : (
        <>
          <section className="hero">
            <div className="wrap">
              <div className="eyebrow">Premium Notes Bundles</div>
              <h1>
                Your complete toolkit for<br />
                <span className="accent">interviews &amp; studies.</span>
              </h1>
              <p className="hero-sub">
                Handcrafted PDFs for Java developers — interview prep, study notes, and cheatsheets.
                Pick a bundle or grab the combo for the best value.
              </p>
              <div className="hero-actions">
                <button className="btn-buy" onClick={scrollToBuy}>
                  View Bundles <span className="arrow">→</span>
                </button>
                <div className="price-tag">
                  Starting at <span className="new">₹22</span>
                </div>
              </div>

              <div className="terminal reveal in" ref={termRef}>
                <div className="term-bar">
                  <span className="tdot"></span><span className="tdot"></span><span className="tdot"></span>
                  <span className="term-title">bash — kk-notes</span>
                </div>
                <div className="term-body">
                  <div className="term-line show"><span className="prompt">$</span> ./unlock-bundle --plan=premium</div>
                  <div className={`term-line ${lineVisible[0] ? "show" : ""}`}>
                    → scanning archive<span className="hl">... {notesLoading ? "scanning..." : `${Array.isArray(notes) ? notes.length : 0} PDFs found`}</span>
                  </div>
                  <div className={`term-line ${lineVisible[1] ? "show" : ""}`}>
                    → bundles: <span className="hl">Interview Prep · Study Notes · Combo</span>
                  </div>
                  <div className={`term-line ${lineVisible[2] ? "show" : ""}`}>
                    → access: <span className="y">lifetime</span> · updates: <span className="y">included forever</span>
                  </div>
                  <div className={`term-line ${lineVisible[3] ? "show" : ""}`}>
                    → combo price: <span className="y">₹39</span> <span className="cursor"></span>
                  </div>
                </div>
              </div>

              <div className="stat-band reveal in">
                <div className="stat">
                  <div className="stat-num"><CountUp end={2000} suffix="+" /></div>
                  <div className="stat-label">Registered Users</div>
                </div>
                <div className="stat">
                  <div className="stat-num"><CountUp end={500} suffix="+" /></div>
                  <div className="stat-label">PDFs Downloaded</div>
                </div>
                <div className="stat">
                  <div className="stat-num"><CountUp end={4.9} decimals={1} suffix="★" /></div>
                  <div className="stat-label">Average Rating</div>
                </div>
                <div className="stat">
                  <div className="stat-num"><CountUp end={100} suffix="%" /></div>
                  <div className="stat-label">Happy Learners</div>
                </div>
              </div>
            </div>
          </section>

          <section className="section" id="products">
            <div className="wrap">
              <Reveal className="section-head">
                <div className="section-eyebrow">Choose your bundle</div>
                <div className="section-title">Three bundles, one goal — help you crack it.</div>
                <p className="section-sub">
                  Each bundle is crafted for real interview prep and student revision. Pick what fits your needs.
                </p>
              </Reveal>
              <div className="product-grid">
                {PRODUCTS.map((p, i) => (
                  <Reveal className={`product-card ${p.id === "combo" ? "featured" : ""}`} key={p.id}>
                    <span className="card-badge">{p.badge}</span>
                    <div className="card-icon" style={{ background: `${p.color}15`, color: p.color }}>
                      {p.id === "interview" ? "🎯" : p.id === "notes" ? "📚" : "⚡"}
                    </div>
                    <div className="card-title">{p.title}</div>
                    <div className="card-subtitle">{p.subtitle}</div>
                    <div className="card-price">
                      <span className="amount" style={{ color: p.color }}>₹{p.price}</span>
                      <span className="old">₹{p.oldPrice}</span>
                    </div>
                    <ul className="card-features">
                      {p.features.map((f) => (
                        <li key={f}><span className="check" style={{ color: p.color }}>✓</span> {f}</li>
                      ))}
                    </ul>
                    <button
                      className={`card-btn ${p.id === "combo" ? "primary" : "secondary"}`}
                      onClick={() => handleBuyBundle(p)}
                    >
                      Get {p.title} — ₹{p.price}
                    </button>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>

          <section className="section" id="how">
            <div className="wrap">
              <Reveal className="section-head">
                <div className="section-eyebrow">How it works</div>
                <div className="section-title">From payment to PDFs in under a minute.</div>
              </Reveal>
              <div className="steps">
                {STEPS.map((step) => (
                  <Reveal className="step" key={step.num}>
                    <div className="num">{step.num}</div>
                    <h3>{step.title}</h3>
                    <p>{step.body}</p>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>

          <section className="section" id="reviews">
            <div className="wrap">
              <Reveal className="section-head">
                <div className="section-eyebrow">Wall of love</div>
                <div className="section-title">Learners who unlocked it.</div>
                <p className="section-sub">Real people, real interviews — this is why the bundles keep selling.</p>
              </Reveal>
              <div className="review-grid">
                {REVIEWS.map((r) => (
                  <Reveal className="review-card" key={r.name}>
                    <div className="review-stars">★★★★★</div>
                    <p className="review-quote">"{r.quote}"</p>
                    <div className="review-author">
                      <span className="review-avatar">{r.name[0]}</span>
                      <div>
                        <div className="review-name">{r.name}</div>
                        <div className="review-role">{r.role}</div>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>

          <section className="section" id="faq">
            <div className="wrap">
              <Reveal className="section-head">
                <div className="section-eyebrow">Questions</div>
                <div className="section-title">Before you unlock</div>
              </Reveal>
              <div className="faqs">
                {FAQS.map((item, i) => (
                  <Reveal
                    as="div"
                    className={`faq-item ${openFaq === i ? "open" : ""}`}
                    key={item.q}
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  >
                    <div className="faq-q">
                      {item.q}
                      <span className="plus">+</span>
                    </div>
                    <div className="faq-a">{item.a}</div>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>
        </>
      )}

      <footer>
        <div className="wrap">
          <div className="fmark">codewith<span>_kk</span> notes — built for people who actually code.</div>
          <div className="fsocial">
            <a href="#">YouTube</a>
            <a href="#">Instagram</a>
            <a href="#">Telegram</a>
          </div>
        </div>
      </footer>

      {showAuth && (
        <div className="kkn-overlay" onClick={() => setShowAuth(false)}>
          <div className="kkn-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close" onClick={() => setShowAuth(false)}>✕</button>
            <h2>{authMode === "login" ? "Welcome back" : "Create account"}</h2>
            <p className="sub">
              {authMode === "login"
                ? "Sign in to access your dashboard."
                : "Sign up to unlock premium notes."}
            </p>
            {authMsg && (
              <div className={`msg ${authMsg.includes("Successful") ? "ok" : "err"}`}>
                {authMsg}
              </div>
            )}
            <form onSubmit={handleAuthSubmit}>
              {authMode === "register" && (
                <div className="field">
                  <label>Name</label>
                  <input name="name" value={authForm.name} onChange={handleAuthInput} required />
                </div>
              )}
              <div className="field">
                <label>Email</label>
                <input name="email" type="email" value={authForm.email} onChange={handleAuthInput} required />
              </div>
              <div className="field">
                <label>Password</label>
                <input name="password" type="password" value={authForm.password} onChange={handleAuthInput} required minLength={6} />
              </div>
              <button className="btn-submit" type="submit">
                {authMode === "login" ? "Sign In" : "Create Account"}
              </button>
            </form>
            <div className="switch">
              {authMode === "login" ? (
                <>Don't have an account? <a onClick={switchAuthMode}>Sign up</a></>
              ) : (
                <>Already have an account? <a onClick={switchAuthMode}>Sign in</a></>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
