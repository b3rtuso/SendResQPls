import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login as apiLogin } from '../api/client';
import { ShieldAlert, Mail, Lock, Eye, EyeOff, AlertTriangle, CheckCircle } from 'lucide-react';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!email || !password) { setError('Please enter your email and password.'); return; }
    setLoading(true); setError('');
    try {
      const res = await apiLogin(email, password);
      const { token, role, user } = res.data;
      if (role !== 'ADMIN') { setError('Access denied. This portal is for MDRRMO administrators only.'); return; }
      localStorage.setItem('token', token);
      localStorage.setItem('userId', user?.id || '');
      localStorage.setItem('userName', user?.name || 'Admin');
      localStorage.setItem('userEmail', user?.email || '');
      localStorage.setItem('userRole', role);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid email or password.');
    } finally { setLoading(false); }
  };

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .al-wrap {
          display: flex;
          min-height: 100vh;
          width: 100vw;
          font-family: 'Inter', system-ui, sans-serif;
          overflow: hidden;
        }

        /* ════════════════════════════════
           LEFT PANEL — spans left → center
           ════════════════════════════════ */
        .al-left {
          position: relative;
          width: 50%;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(150deg, #0F172A 0%, #1E3A5F 55%, #1A1040 100%);
          overflow: hidden;
          padding: 60px 64px;
        }

        /* subtle dot grid */
        .al-left::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px);
          background-size: 32px 32px;
          pointer-events: none;
        }

        /* glowing orbs */
        .al-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
        }
        .al-orb-1 { width: 380px; height: 380px; background: rgba(37,99,235,0.22); top: -100px; right: -100px; }
        .al-orb-2 { width: 300px; height: 300px; background: rgba(220,38,38,0.15); bottom: -80px; left: -80px; }
        .al-orb-3 { width: 200px; height: 200px; background: rgba(139,92,246,0.12); top: 50%; left: 30%; transform: translate(-50%,-50%); }

        .al-left-inner {
          position: relative;
          z-index: 1;
          max-width: 480px;
          width: 100%;
        }

        /* logo row */
        .al-logo {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 44px;
        }
        .al-logo img {
          width: 58px;
          height: 58px;
          border-radius: 16px;
          object-fit: cover;
          box-shadow: 0 8px 28px rgba(220,38,38,0.5);
          flex-shrink: 0;
        }
        .al-logo-text-top {
          color: #fff;
          font-size: 20px;
          font-weight: 800;
          letter-spacing: -0.4px;
          line-height: 1.2;
        }
        .al-logo-text-bot {
          color: rgba(255,255,255,0.45);
          font-size: 12px;
          font-weight: 500;
          margin-top: 3px;
        }

        /* big headline */
        .al-headline {
          color: #fff;
          font-size: 46px;
          font-weight: 900;
          line-height: 1.12;
          letter-spacing: -1px;
          margin-bottom: 22px;
        }
        .al-headline span {
          color: #60A5FA;
          display: block;
        }

        .al-desc {
          color: rgba(255,255,255,0.55);
          font-size: 15px;
          line-height: 1.75;
          margin-bottom: 44px;
          max-width: 400px;
        }

        /* feature bullets */
        .al-features { display: flex; flex-direction: column; gap: 13px; margin-bottom: 52px; }
        .al-feat {
          display: flex;
          align-items: center;
          gap: 10px;
          color: rgba(255,255,255,0.72);
          font-size: 14px;
        }

        /* operational badge */
        .al-badge {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.14);
          border-radius: 999px;
          padding: 8px 18px;
        }
        .al-badge-dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          background: #34D399;
          box-shadow: 0 0 10px #34D399;
          animation: pulse-dot 2s ease-in-out infinite;
        }
        @keyframes pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.6;transform:scale(0.85)} }
        .al-badge span { color: rgba(255,255,255,0.6); font-size: 12px; font-weight: 600; }

        /* ════════════════════════════════
           RIGHT PANEL — spans center → right
           ════════════════════════════════ */
        .al-right {
          width: 50%;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #F1F5F9;
          padding: 60px 64px;
          overflow-y: auto;
        }

        .al-form-wrap {
          width: 100%;
          max-width: 440px;
        }

        /* heading */
        .al-form-title {
          font-size: 30px;
          font-weight: 800;
          color: #0F172A;
          letter-spacing: -0.5px;
          margin-bottom: 8px;
        }
        .al-form-sub {
          font-size: 14px;
          color: #64748B;
          line-height: 1.55;
          margin-bottom: 32px;
        }

        /* error box */
        .al-err {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #FEF2F2;
          border: 1px solid #FCA5A5;
          border-radius: 10px;
          padding: 12px 14px;
          margin-bottom: 20px;
          color: #B91C1C;
          font-size: 13px;
          font-weight: 500;
        }

        /* form */
        .al-form { display: flex; flex-direction: column; gap: 20px; }

        .al-field label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 7px;
        }
        .al-inp-wrap { position: relative; }
        .al-inp-icon {
          position: absolute;
          left: 14px; top: 50%;
          transform: translateY(-50%);
          color: #94A3B8;
          pointer-events: none;
          display: flex;
        }
        .al-inp {
          width: 100%;
          background: #fff;
          border: 1.5px solid #CBD5E1;
          border-radius: 12px;
          padding: 14px 14px 14px 42px;
          font-size: 14px;
          color: #0F172A;
          font-family: inherit;
          outline: none;
          transition: border-color .18s, box-shadow .18s;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        .al-inp::placeholder { color: #94A3B8; }
        .al-inp:focus {
          border-color: #2563EB;
          box-shadow: 0 0 0 3px rgba(37,99,235,0.13);
        }
        .al-inp-pass { padding-right: 46px; }

        .al-eye {
          position: absolute;
          right: 12px; top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #94A3B8;
          display: flex;
          padding: 4px;
          border-radius: 6px;
          transition: color .15s;
        }
        .al-eye:hover { color: #475569; }

        /* submit */
        .al-btn {
          width: 100%;
          padding: 15px;
          background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%);
          color: #fff;
          border: none;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 700;
          font-family: inherit;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          box-shadow: 0 4px 18px rgba(37,99,235,0.38);
          transition: transform .18s, box-shadow .18s, background .18s;
          margin-top: 4px;
        }
        .al-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 24px rgba(37,99,235,0.48);
        }
        .al-btn:active:not(:disabled) { transform: translateY(0); }
        .al-btn:disabled { background: #94A3B8; box-shadow: none; cursor: not-allowed; }

        .al-spin {
          width: 17px; height: 17px;
          border: 2.5px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin .75s linear infinite;
          flex-shrink: 0;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* footer */
        .al-foot {
          text-align: center;
          margin-top: 32px;
          font-size: 12px;
          color: #94A3B8;
          line-height: 1.65;
        }
        .al-foot span { color: #CBD5E1; }

        /* ── Mobile: stack vertically ── */
        @media (max-width: 840px) {
          .al-wrap { flex-direction: column; }
          .al-left {
            width: 100%;
            min-height: auto;
            padding: 48px 28px 44px;
          }
          .al-headline { font-size: 34px; }
          .al-right {
            width: 100%;
            min-height: auto;
            padding: 44px 24px 52px;
          }
        }
        @media (max-width: 480px) {
          .al-left  { padding: 36px 20px 32px; }
          .al-right { padding: 36px 18px 48px; }
          .al-headline { font-size: 28px; }
          .al-form-title { font-size: 24px; }
        }
      `}</style>

      <div className="al-wrap">

        {/* ═══════ LEFT — logo + branding ═══════ */}
        <div className="al-left">
          <div className="al-orb al-orb-1" />
          <div className="al-orb al-orb-2" />
          <div className="al-orb al-orb-3" />

          <div className="al-left-inner">

            {/* Logo row */}
            <div className="al-logo">
              <img src="/logo.jpg" alt="SendResqPls logo" />
              <div>
                <div className="al-logo-text-top">SendResqPls</div>
                <div className="al-logo-text-bot">MDRRMO Balayan, Batangas</div>
              </div>
            </div>

            {/* Headline */}
            <h1 className="al-headline">
              Disaster Incident
              <span>Response Portal</span>
            </h1>

            <p className="al-desc">
              Real-time emergency monitoring, AI-assisted triage, and dispatch coordination for MDRRMO Balayan personnel.
            </p>

            {/* Feature bullets */}
            <div className="al-features">
              {[
                'Live incident feed with AI classification',
                'One-click department dispatch & call',
                'Balayan barangay risk heat map',
                'Full report history & analytics',
              ].map(f => (
                <div key={f} className="al-feat">
                  <CheckCircle size={15} color="#34D399" style={{ flexShrink: 0 }} />
                  {f}
                </div>
              ))}
            </div>

            {/* Status badge */}
            <div className="al-badge">
              <div className="al-badge-dot" />
              <span>System Operational · Authorized Access Only</span>
            </div>

          </div>
        </div>

        {/* ═══════ RIGHT — login form ═══════ */}
        <div className="al-right">
          <div className="al-form-wrap">

            <h2 className="al-form-title">Administrator Sign In</h2>
            <p className="al-form-sub">Enter your MDRRMO credentials to access the portal.</p>

            {error && (
              <div className="al-err">
                <AlertTriangle size={15} style={{ flexShrink: 0 }} />
                {error}
              </div>
            )}

            <form className="al-form" onSubmit={handleLogin} autoComplete="on">

              {/* Email */}
              <div className="al-field">
                <label htmlFor="al-email">Email Address</label>
                <div className="al-inp-wrap">
                  <span className="al-inp-icon"><Mail size={15} /></span>
                  <input
                    id="al-email"
                    className="al-inp"
                    type="email"
                    autoComplete="username"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="al-field">
                <label htmlFor="al-password">Password</label>
                <div className="al-inp-wrap">
                  <span className="al-inp-icon"><Lock size={15} /></span>
                  <input
                    id="al-password"
                    className="al-inp al-inp-pass"
                    type={showPass ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="al-eye"
                    onClick={() => setShowPass(p => !p)}
                    aria-label={showPass ? 'Hide password' : 'Show password'}
                    tabIndex={-1}
                  >
                    {showPass ? <Eye size={15} /> : <EyeOff size={15} />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button type="submit" className="al-btn" disabled={loading}>
                {loading ? (
                  <><span className="al-spin" /> Signing in...</>
                ) : (
                  <><ShieldAlert size={17} /> Sign In to Admin Portal</>
                )}
              </button>

            </form>

            <p className="al-foot">
              SendResqPls · MDRRMO Disaster Incident Reporting System<br />
              <span>Balayan, Batangas · © 2026</span>
            </p>

          </div>
        </div>

      </div>
    </>
  );
}
