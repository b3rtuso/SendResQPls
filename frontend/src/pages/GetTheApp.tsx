import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

/* ─── Bauhaus Geometric Design System ───────────────────────────────────────
   Page: GetTheApp (APK Download & Installation Guide)
   Palette: #0D1B2A (bg) · #E63946 (red) · #F4D03F (yellow) · #2563EB (blue) · #FFFFFF
   Font: Inter Tight
   Zero border-radius. Zero gradient. Zero shadow. Zero em-dashes.
─────────────────────────────────────────────────────────────────────────── */

const APK_DOWNLOAD_URL = 'https://github.com/b3rtuso/SendResQPls/releases/latest/download/SendResQPls.apk';

export default function GetTheApp() {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <style>{`
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
          --text-muted: rgba(255,255,255,0.6);
          --divider: rgba(255,255,255,0.12);
          --font:    'Inter Tight', system-ui, sans-serif;
        }

        .gta-root {
          background: var(--bg);
          color: var(--white);
          font-family: var(--font);
          min-height: 100dvh;
          display: flex;
          flex-direction: column;
          overflow-x: hidden;
        }

        /* ─── NAV ─── */
        .gta-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 clamp(20px, 5vw, 72px);
          height: 64px;
          border-bottom: 1px solid var(--divider);
          background: var(--bg);
          position: sticky;
          top: 0;
          z-index: 100;
        }
        .gta-nav-logo {
          font-size: 15px;
          font-weight: 900;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--white);
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .gta-nav-shapes {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .gta-shape-circle {
          width: 14px; height: 14px;
          border-radius: 50%;
          background: var(--red);
          flex-shrink: 0;
        }
        .gta-shape-square {
          width: 14px; height: 14px;
          background: var(--yellow);
          flex-shrink: 0;
        }
        .gta-shape-triangle {
          width: 0; height: 0;
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-bottom: 14px solid var(--blue);
          flex-shrink: 0;
        }
        .gta-nav-back {
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--white);
          background: transparent;
          border: 1px solid var(--divider);
          padding: 8px 16px;
          cursor: pointer;
          transition: background 0.15s linear, border-color 0.15s linear;
        }
        .gta-nav-back:hover {
          background: rgba(255,255,255,0.08);
          border-color: rgba(255,255,255,0.4);
        }

        /* ─── HERO ─── */
        .gta-hero {
          padding: clamp(48px, 8vw, 96px) clamp(20px, 5vw, 72px) clamp(40px, 6vw, 64px);
          border-bottom: 1px solid var(--divider);
          position: relative;
        }
        .gta-hero-eyebrow {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: var(--yellow);
          margin-bottom: 20px;
        }
        .gta-hero-eyebrow-sq {
          width: 10px; height: 10px;
          background: var(--yellow);
          flex-shrink: 0;
        }
        .gta-hero-title {
          font-size: clamp(42px, 7vw, 92px);
          font-weight: 900;
          line-height: 0.95;
          letter-spacing: -0.03em;
          text-transform: uppercase;
          color: var(--white);
          max-width: 900px;
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.6s ease, transform 0.6s cubic-bezier(0.16,1,0.3,1);
        }
        .gta-hero-title.visible {
          opacity: 1;
          transform: translateY(0);
        }
        .gta-hero-rule {
          height: 6px;
          background: var(--yellow);
          border: none;
          margin: clamp(24px, 3.5vw, 36px) 0;
          width: clamp(120px, 30vw, 360px);
          opacity: 0;
          transform: scaleX(0);
          transform-origin: left;
          transition: opacity 0.5s ease 0.2s, transform 0.6s cubic-bezier(0.16,1,0.3,1) 0.2s;
        }
        .gta-hero-rule.visible {
          opacity: 1;
          transform: scaleX(1);
        }
        .gta-hero-desc {
          font-size: clamp(15px, 1.6vw, 19px);
          font-weight: 400;
          line-height: 1.6;
          color: var(--text-muted);
          max-width: 620px;
          margin-bottom: clamp(32px, 4vw, 48px);
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.6s ease 0.35s, transform 0.6s cubic-bezier(0.16,1,0.3,1) 0.35s;
        }
        .gta-hero-desc.visible {
          opacity: 1;
          transform: translateY(0);
        }
        .gta-hero-actions {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 20px;
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.6s ease 0.45s, transform 0.6s cubic-bezier(0.16,1,0.3,1) 0.45s;
        }
        .gta-hero-actions.visible {
          opacity: 1;
          transform: translateY(0);
        }

        /* ─── BUTTONS ─── */
        .btn-download {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          padding: 16px 36px;
          background: var(--blue);
          color: var(--white);
          font-family: var(--font);
          font-size: 15px;
          font-weight: 800;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          border: none;
          cursor: pointer;
          text-decoration: none;
          transition: background 0.15s linear, transform 0.1s ease;
        }
        .btn-download:hover { background: var(--blue-dk); }
        .btn-download:active { transform: translateY(1px); }

        .gta-meta-text {
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--text-muted);
        }

        /* ─── INSTRUCTIONS (HOW TO INSTALL) ─── */
        .gta-steps-header {
          padding: clamp(32px, 4vw, 48px) clamp(20px, 5vw, 72px) 0;
        }
        .gta-section-title {
          font-size: clamp(24px, 3.5vw, 36px);
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: -0.02em;
          color: var(--white);
        }
        .gta-steps-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          border-top: 1px solid var(--divider);
          border-bottom: 1px solid var(--divider);
          margin-top: clamp(24px, 3vw, 36px);
        }
        .gta-step-card {
          padding: clamp(32px, 5vw, 64px) clamp(20px, 3.5vw, 48px);
          border-right: 1px solid var(--divider);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .gta-step-card:last-child { border-right: none; }

        .gta-step-num {
          font-size: clamp(52px, 6vw, 80px);
          font-weight: 900;
          line-height: 1;
          letter-spacing: -0.04em;
          margin-bottom: 16px;
        }
        .gta-step-num.red { color: var(--red); }
        .gta-step-num.yellow { color: var(--yellow); }
        .gta-step-num.blue { color: var(--blue); }

        .gta-step-title {
          font-size: clamp(18px, 2.2vw, 24px);
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: var(--white);
          margin-bottom: 12px;
        }
        .gta-step-body {
          font-size: 14px;
          font-weight: 400;
          line-height: 1.65;
          color: var(--text-muted);
          max-width: 320px;
        }
        .gta-step-shape {
          margin-top: 36px;
        }

        /* ─── FOOTER ─── */
        .gta-footer {
          margin-top: auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 clamp(20px, 5vw, 72px);
          height: 56px;
          border-top: 1px solid var(--divider);
        }
        .gta-footer-copy {
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--text-muted);
        }

        /* ─── RESPONSIVE ─── */
        @media (max-width: 768px) {
          .gta-nav-back {
            display: none !important;
          }
          .gta-steps-grid {
            grid-template-columns: 1fr;
          }
          .gta-step-card {
            border-right: none;
            border-bottom: 1px solid var(--divider);
          }
          .gta-step-card:last-child {
            border-bottom: none;
          }
          .gta-notice-bar {
            flex-direction: column;
            align-items: flex-start;
          }
          .gta-footer {
            flex-direction: column;
            gap: 12px;
            height: auto;
            padding: 20px clamp(20px,5vw,72px);
          }
        }
      `}</style>

      <div className="gta-root">
        {/* ─── NAV ─── */}
        <nav className="gta-nav">
          <a href="/" className="gta-nav-logo">
            <img
              src="/logo.jpg"
              alt="SendResQPls Logo"
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                objectFit: 'cover',
                border: '1.5px solid rgba(255, 255, 255, 0.25)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                flexShrink: 0,
              }}
            />
            <span>SendResQPls</span>
            <div className="gta-nav-shapes" aria-hidden="true">
              <div className="gta-shape-circle" />
              <div className="gta-shape-square" />
              <div className="gta-shape-triangle" />
            </div>
          </a>
          <button
            className="gta-nav-back"
            onClick={() => navigate('/')}
            aria-label="Back to home"
          >
            ← Back to Home
          </button>
        </nav>

        {/* ─── HERO ─── */}
        <section className="gta-hero">
          <div className="gta-hero-eyebrow">
            <div className="gta-hero-eyebrow-sq" aria-hidden="true" />
            Android Application Package (APK)
          </div>

          <h1 className={`gta-hero-title ${mounted ? 'visible' : ''}`}>
            Install SendResQPls on Android
          </h1>

          <hr className={`gta-hero-rule ${mounted ? 'visible' : ''}`} />

          <p className={`gta-hero-desc ${mounted ? 'visible' : ''}`}>
            The citizen emergency reporting system is exclusively available as a native Android application. Download the official package directly below to get started.
          </p>

          <div className={`gta-hero-actions ${mounted ? 'visible' : ''}`}>
            <a
              href={APK_DOWNLOAD_URL}
              className="btn-download"
              download="SendResQPls.apk"
              aria-label="Download SendResQPls Android APK file"
            >
              Download APK
            </a>
            <span className="gta-meta-text">
              Android 8.0+ · Direct Package Download
            </span>
          </div>
        </section>

        {/* ─── INSTALLATION STEPS ─── */}
        <div className="gta-steps-header">
          <h2 className="gta-section-title">Installation Guide</h2>
        </div>

        <section className="gta-steps-grid">
          {/* Step 1 */}
          <div className="gta-step-card">
            <div>
              <div className="gta-step-num red">01</div>
              <h3 className="gta-step-title">Download File</h3>
              <p className="gta-step-body">
                Click the Download APK button above to save the SendResQPls.apk installer file to your device.
              </p>
            </div>
            <div className="gta-step-shape">
              <div style={{ width: 20, height: 20, background: 'var(--red)' }} aria-hidden="true" />
            </div>
          </div>

          {/* Step 2 */}
          <div className="gta-step-card">
            <div>
              <div className="gta-step-num yellow">02</div>
              <h3 className="gta-step-title">Allow Install</h3>
              <p className="gta-step-body">
                Open the downloaded APK file. If Android prompts you with a security notice, enable "Install Unknown Apps" for your browser or file manager.
              </p>
            </div>
            <div className="gta-step-shape">
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--yellow)' }} aria-hidden="true" />
            </div>
          </div>

          {/* Step 3 */}
          <div className="gta-step-card">
            <div>
              <div className="gta-step-num blue">03</div>
              <h3 className="gta-step-title">Launch App</h3>
              <p className="gta-step-body">
                Complete the installation and launch SendResQPls from your home screen. Register an account to submit emergency reports.
              </p>
            </div>
            <div className="gta-step-shape">
              <div style={{
                width: 0, height: 0,
                borderLeft: '10px solid transparent',
                borderRight: '10px solid transparent',
                borderBottom: '18px solid var(--blue)'
              }} aria-hidden="true" />
            </div>
          </div>
        </section>

        {/* ─── FOOTER ─── */}
        <footer className="gta-footer">
          <span className="gta-footer-copy">
            &copy; 2026 MDRRMO Balayan, Batangas
          </span>
          <div className="gta-nav-shapes" aria-hidden="true">
            <div className="gta-shape-circle" />
            <div className="gta-shape-square" />
            <div className="gta-shape-triangle" />
          </div>
        </footer>
      </div>
    </>
  );
}
