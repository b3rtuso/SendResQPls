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
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await apiLogin(email, password);
      const { token, role, user } = res.data;
      if (role !== 'ADMIN') {
        setError('Access denied. This portal is for MDRRMO administrators only.');
        return;
      }
      localStorage.setItem('token', token);
      localStorage.setItem('userId', user?.id || '');
      localStorage.setItem('userName', user?.name || 'Admin');
      localStorage.setItem('userEmail', user?.email || '');
      localStorage.setItem('userRole', role);
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Invalid email or password.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    'Live incident feed with AI classification',
    'One-click department dispatch & call',
    'Balayan barangay risk heat map',
    'Full report history & analytics',
  ];

  return (
    <div className="al-root">

      {/* ── Left branding panel (50%) ── */}
      <div className="al-left">
        <div className="al-dot-grid" />
        <div className="al-orb al-orb-top" />
        <div className="al-orb al-orb-bottom" />

        <div className="al-left-content">
          {/* Logo */}
          <div className="al-logo-row">
            <img src="/logo.jpg" alt="SRQ Logo" className="al-logo-img" />
            <div>
              <div className="al-logo-name">SendResqPls</div>
              <div className="al-logo-sub">MDRRMO Balayan, Batangas</div>
            </div>
          </div>

          <h1 className="al-headline">
            Disaster Incident<br />
            <span className="al-headline-accent">Response Portal</span>
          </h1>

          <p className="al-tagline">
            Real-time emergency monitoring, AI-assisted triage, and dispatch coordination for MDRRMO Balayan personnel.
          </p>

          <div className="al-features">
            {features.map((feat) => (
              <div key={feat} className="al-feature-item">
                <CheckCircle size={15} color="#34D399" style={{ flexShrink: 0 }} />
                <span>{feat}</span>
              </div>
            ))}
          </div>

          <div className="al-status-badge">
            <div className="al-status-dot" />
            <span>System Operational · Authorized Access Only</span>
          </div>
        </div>
      </div>

      {/* ── Right login form (50%) ── */}
      <div className="al-right">
        <div className="al-form-card">

          {/* Mobile-only logo */}
          <div className="al-mobile-logo">
            <img src="/logo.jpg" alt="SRQ Logo" className="al-mobile-logo-img" />
            <div>
              <div className="al-mobile-logo-name">SendResqPls</div>
              <div className="al-mobile-logo-sub">MDRRMO Balayan, Batangas</div>
            </div>
          </div>

          <div className="al-form-header">
            <h2 className="al-form-title">Administrator Sign In</h2>
            <p className="al-form-subtitle">Enter your MDRRMO credentials to access the portal.</p>
          </div>

          {/* Error */}
          {error && (
            <div className="al-error">
              <AlertTriangle size={15} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="al-form" autoComplete="on">
            {/* Email */}
            <div className="al-field">
              <label className="al-label" htmlFor="al-email">Email Address</label>
              <div className="al-input-wrap">
                <Mail size={15} className="al-input-icon" />
                <input
                  id="al-email"
                  type="email"
                  autoComplete="username"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="al-input"
                />
              </div>
            </div>

            {/* Password */}
            <div className="al-field">
              <label className="al-label" htmlFor="al-password">Password</label>
              <div className="al-input-wrap">
                <Lock size={15} className="al-input-icon" />
                <input
                  id="al-password"
                  type={showPass ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="al-input al-input-pass"
                />
                <button
                  type="button"
                  className="al-eye-btn"
                  onClick={() => setShowPass(!showPass)}
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPass ? <Eye size={15} /> : <EyeOff size={15} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className={`al-submit${loading ? ' al-submit-loading' : ''}`}
            >
              {loading ? (
                <>
                  <span className="al-spinner" />
                  Signing in...
                </>
              ) : (
                <>
                  <ShieldAlert size={17} />
                  Sign In to Admin Portal
                </>
              )}
            </button>
          </form>

          <p className="al-footer">
            SendResqPls · MDRRMO Disaster Incident Reporting System<br />
            <span>Balayan, Batangas · © 2026</span>
          </p>
        </div>
      </div>

      <style>{`
        .al-root {
          min-height: 100vh;
          display: flex;
          font-family: 'Inter', 'system-ui', sans-serif;
          background: #F8FAFC;
        }

        /* ── Left 50% ── */
        .al-left {
          width: 50%;
          flex-shrink: 0;
          background: linear-gradient(145deg, #0F172A 0%, #1E3A5F 55%, #1E1B4B 100%);
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: flex-start;
          padding: 64px 72px;
          position: relative;
          overflow: hidden;
        }
        .al-dot-grid {
          position: absolute; inset: 0; z-index: 0;
          background-image: radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0);
          background-size: 36px 36px;
        }
        .al-orb { position: absolute; border-radius: 50%; }
        .al-orb-top    { top: -80px; right: -80px; width: 340px; height: 340px; background: rgba(37,99,235,0.18); filter: blur(70px); }
        .al-orb-bottom { bottom: -60px; left: -60px; width: 280px; height: 280px; background: rgba(220,38,38,0.14); filter: blur(55px); }

        .al-left-content { position: relative; z-index: 1; max-width: 500px; width: 100%; }

        .al-logo-row { display: flex; align-items: center; gap: 14px; margin-bottom: 52px; }
        .al-logo-img  { width: 54px; height: 54px; border-radius: 14px; object-fit: cover; box-shadow: 0 8px 24px rgba(220,38,38,0.45); flex-shrink: 0; }
        .al-logo-name { color: white; font-size: 18px; font-weight: 800; letter-spacing: -0.3px; }
        .al-logo-sub  { color: rgba(255,255,255,0.45); font-size: 12px; font-weight: 500; margin-top: 2px; }

        .al-headline { color: white; font-size: 42px; font-weight: 900; line-height: 1.15; margin: 0 0 22px; letter-spacing: -0.5px; }
        .al-headline-accent { color: #60A5FA; }
        .al-tagline { color: rgba(255,255,255,0.55); font-size: 15px; line-height: 1.75; margin: 0 0 44px; }

        .al-features { display: flex; flex-direction: column; gap: 14px; margin-bottom: 52px; }
        .al-feature-item { display: flex; align-items: center; gap: 10px; }
        .al-feature-item span { color: rgba(255,255,255,0.72); font-size: 14px; }

        .al-status-badge {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.13);
          border-radius: 20px; padding: 8px 16px;
        }
        .al-status-dot { width: 8px; height: 8px; border-radius: 50%; background: #34D399; box-shadow: 0 0 8px #34D399; animation: al-pulse 2s infinite; }
        @keyframes al-pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        .al-status-badge span { color: rgba(255,255,255,0.6); font-size: 12px; font-weight: 600; }

        /* ── Right 50% ── */
        .al-right {
          width: 50%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 48px 40px;
          background: #F8FAFC;
          min-height: 100vh;
          overflow-y: auto;
          box-sizing: border-box;
        }
        .al-form-card { width: 100%; max-width: 440px; }

        /* Mobile-only logo — hidden on desktop */
        .al-mobile-logo {
          display: none;
          align-items: center;
          gap: 12px;
          margin-bottom: 28px;
          padding-bottom: 24px;
          border-bottom: 1px solid #E2E8F0;
        }
        .al-mobile-logo-img  { width: 40px; height: 40px; border-radius: 10px; object-fit: cover; box-shadow: 0 4px 12px rgba(220,38,38,0.3); }
        .al-mobile-logo-name { color: #0F172A; font-size: 16px; font-weight: 800; }
        .al-mobile-logo-sub  { color: #64748B; font-size: 11px; margin-top: 2px; }

        .al-form-header { margin-bottom: 30px; }
        .al-form-title  { font-size: 28px; font-weight: 800; color: #0F172A; margin: 0 0 8px; letter-spacing: -0.4px; }
        .al-form-subtitle { font-size: 14px; color: #64748B; margin: 0; line-height: 1.5; }

        /* Error */
        .al-error {
          display: flex; align-items: center; gap: 10px;
          background: #FEF2F2; border: 1px solid #FECACA;
          border-radius: 10px; padding: 12px 14px;
          margin-bottom: 18px;
          color: #B91C1C; font-size: 13px; font-weight: 500;
        }

        /* Form */
        .al-form { display: flex; flex-direction: column; gap: 20px; }
        .al-field { display: flex; flex-direction: column; }
        .al-label { font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 7px; }

        .al-input-wrap { position: relative; }
        .al-input-icon {
          position: absolute; left: 13px; top: 50%; transform: translateY(-50%);
          color: #9CA3AF; pointer-events: none;
        }
        .al-input {
          width: 100%; box-sizing: border-box;
          background: white;
          border: 1.5px solid #E2E8F0;
          border-radius: 12px;
          padding: 14px 14px 14px 40px;
          color: #0F172A; font-size: 14px;
          outline: none;
          font-family: inherit;
          transition: border-color 0.2s, box-shadow 0.2s;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04);
        }
        .al-input:focus {
          border-color: #2563EB;
          box-shadow: 0 0 0 3px rgba(37,99,235,0.12);
        }
        .al-input-pass { padding-right: 46px; }

        .al-eye-btn {
          position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer;
          color: #9CA3AF; padding: 4px; border-radius: 6px;
          display: flex; align-items: center;
          transition: color 0.15s;
        }
        .al-eye-btn:hover { color: #475569; }

        /* Submit */
        .al-submit {
          margin-top: 6px;
          background: linear-gradient(135deg, #2563EB, #1D4ED8);
          color: white; border: none; border-radius: 12px;
          padding: 15px; font-size: 15px; font-weight: 700;
          cursor: pointer; font-family: inherit;
          box-shadow: 0 4px 16px rgba(37,99,235,0.35);
          transition: all 0.2s;
          display: flex; align-items: center; justify-content: center; gap: 10px;
          width: 100%;
        }
        .al-submit:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 22px rgba(37,99,235,0.45);
        }
        .al-submit:active:not(:disabled) { transform: translateY(0); }
        .al-submit-loading {
          background: #94A3B8 !important;
          box-shadow: none !important;
          cursor: not-allowed !important;
        }
        .al-spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,0.35);
          border-top-color: white; border-radius: 50%;
          display: inline-block; flex-shrink: 0;
          animation: al-spin 0.8s linear infinite;
        }
        @keyframes al-spin { to { transform: rotate(360deg); } }

        /* Footer */
        .al-footer {
          color: #94A3B8; font-size: 12px;
          text-align: center; margin-top: 32px; line-height: 1.65;
        }
        .al-footer span { color: #CBD5E1; }

        /* ── Responsive ── */
        @media (max-width: 860px) {
          .al-left  { display: none; }
          .al-right { width: 100%; padding: 40px 24px; }
          .al-mobile-logo { display: flex; }
          .al-form-title  { font-size: 24px; }
        }
        @media (max-width: 480px) {
          .al-right { padding: 28px 18px; }
          .al-submit { font-size: 14px; padding: 14px; }
        }
        @media (min-width: 861px) and (max-width: 1100px) {
          .al-left { padding: 48px 52px; }
          .al-headline { font-size: 36px; }
        }
      `}</style>
    </div>
  );
}
