import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login as apiLogin } from '../api/client';
import { Lock, Eye, EyeOff, Download, AlertTriangle, X } from 'lucide-react';

/* ─── Bauhaus Geometric Design System ───────────────────────────────────────
   DESIGN_VARIANCE: 8 | MOTION_INTENSITY: 6 | VISUAL_DENSITY: 4
   Font: Inter Tight (condensed geometric sans — Bauhaus lineage)
   Palette: #0D1B2A (bg) · #E63946 (red) · #F4D03F (yellow) · #2563EB (blue) · #FFFFFF
   Shape vocabulary: ● ■ ▲ — only pure geometry, no icons as decoration
   Zero border-radius. Zero gradient. Zero shadow. Zero em-dashes.
   All motion: CSS transform/opacity only, honors prefers-reduced-motion.
─────────────────────────────────────────────────────────────────────────── */

const APK_URL = 'https://github.com/b3rtuso/SendResQPls/releases/latest/download/SendResQPls.apk';

export default function LandingPage() {
  const navigate = useNavigate();
  const heroRef = useRef<HTMLDivElement>(null);
  const [heroVisible, setHeroVisible] = useState(false);
  const [step1Visible, setStep1Visible] = useState(false);
  const [step2Visible, setStep2Visible] = useState(false);
  const [step3Visible, setStep3Visible] = useState(false);
  const [accessVisible, setAccessVisible] = useState(false);

  // Modal Popups State
  const [activeModal, setActiveModal] = useState<'app' | 'admin' | null>(null);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPass, setShowAdminPass] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState('');

  // Close modal on Escape key & lock scroll when open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveModal(null);
    };
    if (activeModal) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeModal]);

  const handleAdminLoginModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminEmail.trim() || !adminPassword) {
      setAdminError('Please enter your email and password.');
      return;
    }
    setAdminLoading(true);
    setAdminError('');
    try {
      const res = await apiLogin(adminEmail.trim(), adminPassword);
      const { token, role, user } = res.data;
      if (role !== 'ADMIN') {
        setAdminError('Access denied. This portal is for MDRRMO administrators only.');
        return;
      }
      localStorage.setItem('token', token);
      localStorage.setItem('userId', user?.id || '');
      localStorage.setItem('userName', user?.name || 'Admin');
      localStorage.setItem('userEmail', user?.email || '');
      localStorage.setItem('userRole', role);
      navigate('/dashboard');
    } catch (err: any) {
      setAdminError(err.response?.data?.error || 'Incorrect credentials. Please try again.');
    } finally {
      setAdminLoading(false);
    }
  };

  useEffect(() => {
    // Trigger hero entrance after mount
    const t = setTimeout(() => setHeroVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    // Scroll-reveal via IntersectionObserver (no window scroll listener)
    const targets = [
      { id: 'step-1', setter: setStep1Visible },
      { id: 'step-2', setter: setStep2Visible },
      { id: 'step-3', setter: setStep3Visible },
      { id: 'access-section', setter: setAccessVisible },
    ];

    const observers = targets.map(({ id, setter }) => {
      const el = document.getElementById(id);
      if (!el) return null;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) { setter(true); obs.disconnect(); } },
        { threshold: 0.15 }
      );
      obs.observe(el);
      return obs;
    });

    return () => observers.forEach(obs => obs?.disconnect());
  }, []);

  return (
    <>
      <style>{`
        /* ─── Font ─── */
        @import url('https://fonts.googleapis.com/css2?family=Inter+Tight:wght@300;400;500;700;800;900&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg:      #0D1B2A;
          --surface: #112236;
          --red:     #E63946;
          --yellow:  #F4D03F;
          --blue:    #2563EB;
          --blue-dk: #1D4ED8;
          --white:   #FFFFFF;
          --text-muted: rgba(255,255,255,0.65);
          --divider: rgba(255,255,255,0.12);
          --font:    'Inter Tight', system-ui, sans-serif;
        }

        .lp-root {
          background: var(--bg);
          color: var(--white);
          font-family: var(--font);
          min-height: 100dvh;
          overflow-x: hidden;
          width: 100%;
        }

        /* ─── NAV ─── */
        .lp-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 clamp(16px, 4vw, 72px);
          height: 64px;
          border-bottom: 1px solid var(--divider);
          position: sticky;
          top: 0;
          background: var(--bg);
          z-index: 100;
        }
        .lp-nav-logo {
          font-size: 15px;
          font-weight: 900;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--white);
          text-decoration: none;
          white-space: nowrap;
        }
        .lp-nav-shapes {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .lp-shape-circle {
          width: 14px; height: 14px;
          border-radius: 50%;
          background: var(--red);
          flex-shrink: 0;
        }
        .lp-shape-square {
          width: 14px; height: 14px;
          background: var(--yellow);
          flex-shrink: 0;
        }
        .lp-shape-triangle {
          width: 0; height: 0;
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-bottom: 14px solid var(--blue);
          flex-shrink: 0;
        }
        .lp-nav-location {
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--text-muted);
          white-space: nowrap;
        }

        /* ─── HERO ─── */
        .lp-hero {
          display: grid;
          grid-template-columns: 1fr 1fr;
          min-height: calc(100dvh - 64px);
          border-bottom: 1px solid var(--divider);
        }

        /* Hero left */
        .lp-hero-left {
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: clamp(36px, 6vw, 88px) clamp(16px, 5vw, 72px);
          border-right: 1px solid var(--divider);
          position: relative;
          min-width: 0;
        }
        .lp-hero-circle {
          width: clamp(52px, 6.5vw, 100px);
          height: clamp(52px, 6.5vw, 100px);
          border-radius: 50%;
          background: var(--red);
          margin-bottom: clamp(16px, 2.5vw, 32px);
          opacity: 0;
          transform: scale(0.6);
          transition: opacity 0.5s ease, transform 0.6s cubic-bezier(0.16,1,0.3,1);
          flex-shrink: 0;
        }
        .lp-hero-circle.visible {
          opacity: 1;
          transform: scale(1);
        }
        .lp-hero-headline {
          font-size: clamp(36px, 6.5vw, 96px);
          font-weight: 900;
          line-height: 0.96;
          letter-spacing: -0.03em;
          text-transform: uppercase;
          color: var(--white);
          margin-top: 0;
          word-break: break-word;
          overflow-wrap: break-word;
          opacity: 0;
          transform: translateY(30px);
          transition: opacity 0.7s ease 0.15s, transform 0.7s cubic-bezier(0.16,1,0.3,1) 0.15s;
        }
        .lp-hero-headline.visible {
          opacity: 1;
          transform: translateY(0);
        }
        .lp-hero-rule {
          height: 6px;
          background: var(--yellow);
          border: none;
          margin: clamp(18px, 2.5vw, 28px) 0;
          width: 100%;
          opacity: 0;
          transform: scaleX(0);
          transform-origin: left;
          transition: opacity 0.5s ease 0.4s, transform 0.6s cubic-bezier(0.16,1,0.3,1) 0.4s;
        }
        .lp-hero-rule.visible {
          opacity: 1;
          transform: scaleX(1);
        }
        .lp-hero-tagline {
          font-size: clamp(14px, 1.3vw, 17px);
          font-weight: 400;
          line-height: 1.65;
          color: var(--text-muted);
          max-width: 520px;
          width: 100%;
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.6s ease 0.55s, transform 0.6s cubic-bezier(0.16,1,0.3,1) 0.55s;
        }
        .lp-hero-tagline.visible {
          opacity: 1;
          transform: translateY(0);
        }
        .lp-hero-ctas {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-top: clamp(24px, 3vw, 36px);
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.6s ease 0.7s, transform 0.6s cubic-bezier(0.16,1,0.3,1) 0.7s;
          flex-wrap: wrap;
        }
        .lp-hero-ctas.visible {
          opacity: 1;
          transform: translateY(0);
        }

        /* ─── BUTTONS ─── */
        .btn-primary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 14px 28px;
          min-height: 48px;
          background: var(--blue);
          color: var(--white);
          font-family: var(--font);
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          border: none;
          border-radius: 0;
          cursor: pointer;
          text-decoration: none;
          white-space: nowrap;
          transition: background 0.15s linear, transform 0.1s ease;
        }
        .btn-primary:hover { background: var(--blue-dk); }
        .btn-primary:active { transform: translateY(1px); }

        .btn-outline {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 14px 28px;
          min-height: 48px;
          background: transparent;
          color: var(--white);
          font-family: var(--font);
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          border: 1.5px solid rgba(255,255,255,0.35);
          border-radius: 0;
          cursor: pointer;
          text-decoration: none;
          white-space: nowrap;
          transition: background 0.15s linear, border-color 0.15s linear, transform 0.1s ease;
        }
        .btn-outline:hover {
          background: rgba(255,255,255,0.07);
          border-color: rgba(255,255,255,0.7);
        }
        .btn-outline:active { transform: translateY(1px); }

        .btn-admin {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 14px 28px;
          min-height: 48px;
          background: #0D1B2A;
          color: #FFFFFF;
          font-family: var(--font);
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          border: none;
          border-radius: 0;
          cursor: pointer;
          text-decoration: none;
          white-space: nowrap;
          transition: background 0.15s linear, transform 0.1s ease;
        }
        .btn-admin:hover { background: #1a2f45; }
        .btn-admin:active { transform: translateY(1px); }

        /* Hero right */
        .lp-hero-right {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          opacity: 0;
          transition: opacity 0.8s ease 0.3s;
          background: #07111D;
        }
        .lp-hero-right.visible { opacity: 1; }
        .lp-hero-right img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          display: block;
        }

        /* ─── TICKER ─── */
        .lp-ticker {
          border-bottom: 1px solid var(--divider);
          overflow: hidden;
          height: 48px;
          display: flex;
          align-items: center;
          position: relative;
          user-select: none;
          mask-image: linear-gradient(to right, transparent 0%, black 40px, black calc(100% - 40px), transparent 100%);
          -webkit-mask-image: linear-gradient(to right, transparent 0%, black 40px, black calc(100% - 40px), transparent 100%);
          background: var(--bg);
        }
        .lp-ticker-track {
          display: flex;
          width: max-content;
          flex-shrink: 0;
          animation: ticker 30s linear infinite;
          will-change: transform;
        }
        .lp-ticker:hover .lp-ticker-track {
          animation-play-state: paused;
        }
        @keyframes ticker {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
        .lp-ticker-group {
          display: flex;
          align-items: center;
          flex-shrink: 0;
        }
        .lp-ticker-item {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--text-muted);
          padding: 0 clamp(16px, 2.5vw, 36px);
          white-space: nowrap;
        }
        .lp-ticker-dot {
          color: var(--yellow);
        }

        /* ─── HOW IT WORKS ─── */
        .lp-how {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          border-bottom: 1px solid var(--divider);
        }
        .lp-how-cell {
          padding: clamp(32px, 5vw, 64px) clamp(20px, 3.5vw, 48px);
          border-right: 1px solid var(--divider);
          opacity: 0;
          transform: translateY(32px);
          transition: opacity 0.6s ease, transform 0.6s cubic-bezier(0.16,1,0.3,1);
          min-width: 0;
        }
        .lp-how-cell:last-child { border-right: none; }
        .lp-how-cell.visible { opacity: 1; transform: translateY(0); }
        #step-2.visible { transition-delay: 0.1s; }
        #step-3.visible { transition-delay: 0.2s; }

        .lp-how-num {
          font-size: clamp(48px, 6vw, 84px);
          font-weight: 900;
          line-height: 1;
          letter-spacing: -0.04em;
        }
        .lp-how-num.red { color: var(--red); }
        .lp-how-num.yellow { color: var(--yellow); }
        .lp-how-num.blue { color: var(--blue); }

        .lp-how-heading {
          font-size: clamp(20px, 2.2vw, 28px);
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin-top: 16px;
          color: var(--white);
        }
        .lp-how-body {
          font-size: 14.5px;
          font-weight: 400;
          line-height: 1.65;
          color: var(--text-muted);
          margin-top: 12px;
          max-width: 320px;
          width: 100%;
        }
        .lp-how-shape {
          margin-top: 32px;
        }

        /* ─── ACCESS PORTAL ─── */
        .lp-access {
          display: grid;
          grid-template-columns: 1fr 1fr;
          border-bottom: 1px solid var(--divider);
          opacity: 0;
          transform: translateY(40px);
          transition: opacity 0.7s ease, transform 0.7s cubic-bezier(0.16,1,0.3,1);
        }
        .lp-access.visible { opacity: 1; transform: translateY(0); }

        /* Citizen side */
        .lp-access-citizen {
          padding: clamp(40px, 6vw, 88px) clamp(20px, 5vw, 72px);
          border-right: 2px solid rgba(255,255,255,0.18);
          min-width: 0;
        }
        .lp-access-label {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--text-muted);
          margin-bottom: 20px;
        }
        .lp-access-label-square {
          width: 10px; height: 10px;
          background: var(--white);
          flex-shrink: 0;
        }
        .lp-access-heading {
          font-size: clamp(26px, 3.2vw, 44px);
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: -0.02em;
          line-height: 1.08;
          color: var(--white);
          margin-bottom: 16px;
        }
        .lp-access-body {
          font-size: 15px;
          font-weight: 400;
          line-height: 1.65;
          color: var(--text-muted);
          max-width: 460px;
          width: 100%;
          margin-bottom: 32px;
        }
        .lp-access-sub {
          font-size: 12px;
          color: var(--text-muted);
          margin-top: 14px;
          letter-spacing: 0.03em;
        }

        /* Admin side */
        .lp-access-admin {
          padding: clamp(40px, 6vw, 88px) clamp(20px, 5vw, 72px);
          background: #FFFFFF;
          min-width: 0;
        }
        .lp-access-label-red {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--red);
          margin-bottom: 20px;
        }
        .lp-access-label-red-sq {
          width: 10px; height: 10px;
          background: var(--red);
          flex-shrink: 0;
        }
        .lp-access-heading-dark {
          font-size: clamp(26px, 3.2vw, 44px);
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: -0.02em;
          line-height: 1.08;
          color: #0D1B2A;
          margin-bottom: 16px;
        }
        .lp-access-body-dark {
          font-size: 15px;
          font-weight: 400;
          line-height: 1.65;
          color: #4B5563;
          max-width: 460px;
          width: 100%;
          margin-bottom: 32px;
        }
        .lp-restricted-badge {
          display: inline-block;
          margin-top: 14px;
          padding: 4px 10px;
          background: var(--red);
          color: #FFFFFF;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }

        /* ─── FOOTER ─── */
        .lp-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 clamp(20px, 5vw, 72px);
          height: 56px;
          border-top: 1px solid var(--divider);
        }
        .lp-footer-copy {
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--text-muted);
        }
        .lp-footer-shapes {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        /* ─── RESPONSIVE BREAKPOINTS ─── */
        @media (max-width: 960px) {
          .lp-hero {
            grid-template-columns: 1fr;
            min-height: auto;
          }
          .lp-hero-left {
            border-right: none;
            border-bottom: 1px solid var(--divider);
          }
          .lp-hero-right {
            height: clamp(260px, 50vw, 420px);
            width: 100%;
            border-right: none;
          }
          .lp-how {
            grid-template-columns: 1fr;
          }
          .lp-how-cell {
            border-right: none;
            border-bottom: 1px solid var(--divider);
          }
          .lp-how-cell:last-child {
            border-bottom: none;
          }
          .lp-how-body {
            max-width: 100%;
          }
          .lp-access {
            grid-template-columns: 1fr;
          }
          .lp-access-citizen {
            border-right: none;
            border-bottom: 2px solid rgba(255,255,255,0.18);
          }
        }

        @media (max-width: 640px) {
          .lp-nav-location {
            display: none;
          }
          .lp-hero-headline {
            font-size: clamp(34px, 11vw, 56px);
            line-height: 1.0;
          }
          .lp-hero-ctas {
            flex-direction: column;
            align-items: stretch;
            width: 100%;
            gap: 12px;
          }
          .lp-cta-divider {
            display: none;
          }
          .btn-primary, .btn-outline, .btn-admin {
            width: 100%;
            justify-content: center;
            text-align: center;
          }
          .lp-footer {
            flex-direction: column;
            gap: 12px;
            height: auto;
            padding: 20px clamp(16px, 4vw, 32px);
            text-align: center;
          }
        }

        /* ─── MODAL POPUPS ─── */
        .lp-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(7, 17, 29, 0.88);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .lp-modal-card {
          background: #0F2035;
          border: 1.5px solid rgba(255, 255, 255, 0.18);
          width: 100%;
          max-width: 500px;
          padding: clamp(24px, 4vw, 36px);
          position: relative;
          color: var(--white);
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.7);
          animation: lpModalPop 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          font-family: var(--font);
        }
        @keyframes lpModalPop {
          0% { opacity: 0; transform: scale(0.95) translateY(16px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        .lp-modal-close-btn {
          position: absolute;
          top: 16px;
          right: 16px;
          width: 36px;
          height: 36px;
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: var(--white);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.15s, border-color 0.15s;
        }
        .lp-modal-close-btn:hover {
          background: rgba(255, 255, 255, 0.12);
          border-color: rgba(255, 255, 255, 0.5);
        }
        .lp-modal-input-wrap {
          display: flex;
          align-items: center;
          position: relative;
          background: #07111D;
          border: 1px solid rgba(255, 255, 255, 0.18);
          transition: border-color 0.18s;
          margin-bottom: 14px;
        }
        .lp-modal-input-wrap:focus-within {
          border-color: var(--blue);
        }
        .lp-modal-input {
          width: 100%;
          background: transparent;
          border: none;
          outline: none;
          color: var(--white);
          font-family: inherit;
          font-size: 14.5px;
          padding: 14px 14px 14px 44px;
        }
      `}</style>

      <div className="lp-root" ref={heroRef}>

        {/* ─── NAV ─── */}
        <nav className="lp-nav">
          <a href="/" className="lp-nav-logo">SendResQPls</a>
          <div className="lp-nav-shapes">
            <div className="lp-shape-circle" aria-hidden="true" />
            <div className="lp-shape-square" aria-hidden="true" />
            <div className="lp-shape-triangle" aria-hidden="true" />
          </div>
          <span className="lp-nav-location">MDRRMO · Balayan</span>
        </nav>

        {/* ─── HERO ─── */}
        <section className="lp-hero">
          {/* Left */}
          <div className="lp-hero-left">
            <div className={`lp-hero-circle ${heroVisible ? 'visible' : ''}`} aria-hidden="true" />

            <h1 className={`lp-hero-headline ${heroVisible ? 'visible' : ''}`}>
              Emergency<br />Response
            </h1>

            <hr className={`lp-hero-rule ${heroVisible ? 'visible' : ''}`} />

            <p className={`lp-hero-tagline ${heroVisible ? 'visible' : ''}`}>
              Digital emergency reporting for the citizens of Balayan, Batangas.
              Report incidents. Get help fast.
            </p>

            <div className={`lp-hero-ctas ${heroVisible ? 'visible' : ''}`}>
              <button
                className="btn-primary"
                onClick={() => setActiveModal('app')}
                aria-label="Open Get the App modal popup"
              >
                Get the App
              </button>
              <button
                className="btn-outline"
                onClick={() => setActiveModal('admin')}
                aria-label="Open Admin Portal modal popup"
              >
                Admin Portal
              </button>
            </div>
          </div>

          {/* Right — generated Bauhaus hero image */}
          <div className={`lp-hero-right ${heroVisible ? 'visible' : ''}`} aria-hidden="true">
            <img
              src="/bauhaus-hero.jpg"
              alt="SendResQPls mobile app — Bauhaus geometric composition"
              loading="eager"
            />
          </div>
        </section>

        {/* ─── TICKER ─── */}
        <div className="lp-ticker" aria-hidden="true">
          <div className="lp-ticker-track">
            {/* Two identical groups for seamless -50% translation */}
            {[0, 1].map(groupIdx => (
              <div key={groupIdx} className="lp-ticker-group">
                {[0, 1, 2, 3].map(seqIdx => (
                  <span key={seqIdx} style={{ display: 'inline-flex', alignItems: 'center' }}>
                    <span className="lp-ticker-item">Report</span>
                    <span className="lp-ticker-item lp-ticker-dot">·</span>
                    <span className="lp-ticker-item">Dispatch</span>
                    <span className="lp-ticker-item lp-ticker-dot">·</span>
                    <span className="lp-ticker-item">Respond</span>
                    <span className="lp-ticker-item lp-ticker-dot">·</span>
                    <span className="lp-ticker-item">Protect</span>
                    <span className="lp-ticker-item lp-ticker-dot">·</span>
                    <span className="lp-ticker-item">MDRRMO Balayan</span>
                    <span className="lp-ticker-item lp-ticker-dot">·</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* ─── HOW IT WORKS ─── */}
        <section className="lp-how">
          <div id="step-1" className={`lp-how-cell ${step1Visible ? 'visible' : ''}`}>
            <div className="lp-how-num red">01</div>
            <h2 className="lp-how-heading">Report</h2>
            <p className="lp-how-body">
              Photograph the emergency. The AI system classifies incident type and severity, then routes your report to the correct response team.
            </p>
            <div className="lp-how-shape">
              <div style={{ width: 20, height: 20, background: 'var(--red)' }} aria-hidden="true" />
            </div>
          </div>

          <div id="step-2" className={`lp-how-cell ${step2Visible ? 'visible' : ''}`}>
            <div className="lp-how-num yellow">02</div>
            <h2 className="lp-how-heading">Dispatch</h2>
            <p className="lp-how-body">
              MDRRMO command center reviews the report, confirms priority, and dispatches the nearest qualified response team to your location.
            </p>
            <div className="lp-how-shape">
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--yellow)' }} aria-hidden="true" />
            </div>
          </div>

          <div id="step-3" className={`lp-how-cell ${step3Visible ? 'visible' : ''}`}>
            <div className="lp-how-num blue">03</div>
            <h2 className="lp-how-heading">Respond</h2>
            <p className="lp-how-body">
              Trained emergency responders arrive on-site. You receive real-time status updates through the app until the incident is resolved.
            </p>
            <div className="lp-how-shape">
              <div style={{
                width: 0, height: 0,
                borderLeft: '10px solid transparent',
                borderRight: '10px solid transparent',
                borderBottom: '18px solid var(--blue)'
              }} aria-hidden="true" />
            </div>
          </div>
        </section>

        {/* ─── ACCESS PORTAL ─── */}
        <section id="access-section" className={`lp-access ${accessVisible ? 'visible' : ''}`}>
          {/* Citizen */}
          <div className="lp-access-citizen">
            <div className="lp-access-label">
              <div className="lp-access-label-square" aria-hidden="true" />
              Citizen Access
            </div>
            <h2 className="lp-access-heading">Get the App</h2>
            <p className="lp-access-body">
              Free to use. Report emergencies, track response status, and receive real-time alerts — all from your phone.
            </p>
            <button
              className="btn-primary"
              onClick={() => navigate('/get-the-app')}
              aria-label="Get the SendResQPls mobile app"
            >
              Get the App
            </button>
            <p className="lp-access-sub">Available for Android devices (APK)</p>
          </div>

          {/* Admin */}
          <div className="lp-access-admin">
            <div className="lp-access-label-red">
              <div className="lp-access-label-red-sq" aria-hidden="true" />
              Admin Access
            </div>
            <h2 className="lp-access-heading-dark">Command Center</h2>
            <p className="lp-access-body-dark">
              Authorized MDRRMO personnel only. Full incident management, team dispatch, analytics, and reporting tools.
            </p>
            <button
              className="btn-admin"
              onClick={() => navigate('/admin/login')}
              aria-label="Go to MDRRMO admin command center login"
            >
              Admin Login
            </button>
            <div>
              <span className="lp-restricted-badge">Restricted</span>
            </div>
          </div>
        </section>

        {/* ─── FOOTER ─── */}
        <footer className="lp-footer">
          <span className="lp-footer-copy">
            &copy; 2026 MDRRMO Balayan, Batangas
          </span>
          <div className="lp-footer-shapes" aria-hidden="true">
            <div className="lp-shape-circle" />
            <div className="lp-shape-square" />
            <div className="lp-shape-triangle" />
          </div>
        </footer>

      </div>

      {/* ─── GET THE APP MODAL POPUP ─── */}
      {activeModal === 'app' && (
        <div
          className="lp-modal-backdrop"
          onClick={(e) => { if (e.target === e.currentTarget) setActiveModal(null); }}
        >
          <div className="lp-modal-card" role="dialog" aria-modal="true">
            <button
              className="lp-modal-close-btn"
              onClick={() => setActiveModal(null)}
              aria-label="Close modal"
            >
              <X size={18} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 12, height: 12, background: 'var(--blue)' }} />
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                Citizen Mobile App
              </span>
            </div>

            <h2 style={{ fontSize: 26, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.02em', margin: '0 0 10px', color: 'var(--white)' }}>
              Get SendResQPls
            </h2>

            <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, margin: '0 0 24px' }}>
              Download the official emergency reporting app for Balayan, Batangas. Report fires, medical emergencies, trauma, and disasters directly to MDRRMO.
            </p>

            {/* Direct APK Download Link */}
            <a
              href={APK_URL}
              className="btn-primary"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                width: '100%',
                padding: '16px',
                fontSize: 15,
                fontWeight: 800,
                marginBottom: 20,
              }}
            >
              <Download size={18} /> Download APK (Direct)
            </a>

            {/* Quick Steps */}
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', padding: '16px', marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--yellow)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>
                Quick Installation Steps
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.4 }}>
                <div><strong>1.</strong> Download the SendResQPls APK above.</div>
                <div><strong>2.</strong> Tap to open and allow "Install from unknown sources" if prompted.</div>
                <div><strong>3.</strong> Open the app and log in or report an emergency immediately.</div>
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <button
                type="button"
                onClick={() => { setActiveModal(null); navigate('/get-the-app'); }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--blue)',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                View Full Step-by-Step Guide
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── ADMIN LOGIN MODAL POPUP ─── */}
      {activeModal === 'admin' && (
        <div
          className="lp-modal-backdrop"
          onClick={(e) => { if (e.target === e.currentTarget) setActiveModal(null); }}
        >
          <div className="lp-modal-card" role="dialog" aria-modal="true">
            <button
              className="lp-modal-close-btn"
              onClick={() => setActiveModal(null)}
              aria-label="Close modal"
            >
              <X size={18} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 12, height: 12, background: 'var(--red)' }} />
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                Command Center Access
              </span>
            </div>

            <h2 style={{ fontSize: 26, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.02em', margin: '0 0 10px', color: 'var(--white)' }}>
              MDRRMO Admin Portal
            </h2>

            <p style={{ fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.55, margin: '0 0 20px' }}>
              Authorized MDRRMO personnel only. Enter credentials to manage live incidents, triage, and responder dispatch.
            </p>

            {adminError && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(230,57,70,0.15)', border: '1px solid var(--red)', padding: '10px 14px', marginBottom: 16 }}>
                <AlertTriangle size={15} color="var(--red)" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 12.5, color: '#FFA8B0', fontWeight: 600 }}>{adminError}</span>
              </div>
            )}

            <form onSubmit={handleAdminLoginModal} noValidate>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                Email Address
              </label>
              <div className="lp-modal-input-wrap">
                <span style={{ position: 'absolute', left: 14, color: 'rgba(255,255,255,0.4)', display: 'flex' }}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                </span>
                <input
                  type="email"
                  placeholder="admin@mdrrmo.gov.ph"
                  value={adminEmail}
                  onChange={(e) => { setAdminEmail(e.target.value); if (adminError) setAdminError(''); }}
                  className="lp-modal-input"
                  autoComplete="email"
                />
              </div>

              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                Password
              </label>
              <div className="lp-modal-input-wrap">
                <span style={{ position: 'absolute', left: 14, color: 'rgba(255,255,255,0.4)', display: 'flex' }}>
                  <Lock size={17} />
                </span>
                <input
                  type={showAdminPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={adminPassword}
                  onChange={(e) => { setAdminPassword(e.target.value); if (adminError) setAdminError(''); }}
                  className="lp-modal-input"
                  style={{ paddingRight: 44 }}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowAdminPass(!showAdminPass)}
                  style={{ position: 'absolute', right: 10, background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex', padding: 4 }}
                  aria-label={showAdminPass ? 'Hide password' : 'Show password'}
                >
                  {showAdminPass ? <Eye size={17} /> : <EyeOff size={17} />}
                </button>
              </div>

              <button
                type="submit"
                className="btn-primary"
                disabled={adminLoading}
                style={{ width: '100%', padding: '16px', marginTop: 10, fontSize: 14.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}
              >
                {adminLoading ? 'Authenticating...' : 'Access Command Center'}
              </button>

              <div style={{ textAlign: 'center', marginTop: 18 }}>
                <button
                  type="button"
                  onClick={() => { setActiveModal(null); navigate('/admin/login'); }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'rgba(255,255,255,0.6)',
                    fontSize: 12.5,
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  Open Fullscreen Admin Portal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
