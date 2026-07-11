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

        /* ── Full-screen background ── */
        .al-bg {
          min-height: 100vh;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px 16px;
          background: linear-gradient(135deg, #0A0F1E 0%, #0F2044 35%, #1a0a2e 65%, #0D1B2A 100%);
          position: relative;
          overflow: hidden;
          font-family: 'Inter', system-ui, sans-serif;
        }

        /* background decorative orbs */
        .al-bg-orb {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
          filter: blur(90px);
        }
        .al-bg-orb-1 { width: 500px; height: 500px; background: rgba(37,99,235,0.18); top: -160px; left: -160px; }
        .al-bg-orb-2 { width: 400px; height: 400px; background: rgba(220,38,38,0.14); bottom: -120px; right: -120px; }
        .al-bg-orb-3 { width: 300px; height: 300px; background: rgba(139,92,246,0.12); top: 50%; left: 60%; transform: translate(-50%,-50%); }

        /* dot grid overlay */
        .al-bg-grid {
          position: absolute;
          inset: 0;
          background-image: radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px);
          background-size: 30px 30px;
          pointer-events: none;
        }

        /* ── Centered card ── */
        .al-card {
          position: relative;
          z-index: 10;
          display: flex;
          width: 100%;
          max-width: 880px;
          min-height: 520px;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 32px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.07);
        }

        /* ── Card left — branding ── */
        .al-card-left {
          width: 45%;
          flex-shrink: 0;
          background: linear-gradient(155deg, #1E3A5F 0%, #0F172A 60%, #1a0a2e 100%);
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 48px 40px;
          position: relative;
          overflow: hidden;
        }
        .al-card-left::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px);
          background-size: 28px 28px;
        }
        .al-cl-orb-1 { position:absolute; width:220px; height:220px; border-radius:50%; background:rgba(37,99,235,0.2); top:-80px; right:-60px; filter:blur(60px); pointer-events:none; }
        .al-cl-orb-2 { position:absolute; width:160px; height:160px; border-radius:50%; background:rgba(220,38,38,0.15); bottom:-50px; left:-40px; filter:blur(50px); pointer-events:none; }

        .al-cl-inner { position: relative; z-index: 1; }

        .al-logo-row { display:flex; align-items:center; gap:12px; margin-bottom:36px; }
        .al-logo-row img {
          width: 52px; height: 52px;
          border-radius: 14px;
          object-fit: cover;
          box-shadow: 0 6px 20px rgba(220,38,38,0.5);
          flex-shrink: 0;
        }
        .al-logo-name { color:#fff; font-size:17px; font-weight:800; letter-spacing:-0.3px; }
        .al-logo-sub  { color:rgba(255,255,255,0.42); font-size:11px; font-weight:500; margin-top:3px; }

        .al-hl {
          color: #fff;
          font-size: 30px;
          font-weight: 900;
          line-height: 1.15;
          letter-spacing: -0.6px;
          margin-bottom: 14px;
        }
        .al-hl span { color: #60A5FA; display: block; }

        .al-tagline {
          color: rgba(255,255,255,0.5);
          font-size: 13px;
          line-height: 1.7;
          margin-bottom: 32px;
        }

        .al-feats { display:flex; flex-direction:column; gap:11px; margin-bottom:36px; }
        .al-feat  { display:flex; align-items:center; gap:9px; color:rgba(255,255,255,0.7); font-size:13px; }

        .al-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.13);
          border-radius: 999px;
          padding: 7px 14px;
        }
        .al-badge-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: #34D399;
          box-shadow: 0 0 8px #34D399;
          animation: bdot 2s ease-in-out infinite;
        }
        @keyframes bdot { 0%,100%{opacity:1} 50%{opacity:0.5} }
        .al-badge span { color:rgba(255,255,255,0.55); font-size:11px; font-weight:600; }

        /* ── Card right — form ── */
        .al-card-right {
          flex: 1;
          background: #ffffff;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 48px 44px;
          overflow-y: auto;
        }

        .al-form-title { font-size:24px; font-weight:800; color:#0F172A; letter-spacing:-0.4px; margin-bottom:6px; }
        .al-form-sub   { font-size:13px; color:#64748B; line-height:1.55; margin-bottom:28px; }

        .al-err {
          display:flex; align-items:center; gap:9px;
          background:#FEF2F2; border:1px solid #FCA5A5;
          border-radius:10px; padding:11px 13px;
          margin-bottom:18px;
          color:#B91C1C; font-size:13px; font-weight:500;
        }

        .al-form { display:flex; flex-direction:column; gap:18px; }

        .al-field label {
          display:block; font-size:13px; font-weight:600;
          color:#374151; margin-bottom:6px;
        }
        .al-inp-wrap { position:relative; }
        .al-inp-icon {
          position:absolute; left:13px; top:50%; transform:translateY(-50%);
          color:#94A3B8; pointer-events:none; display:flex;
        }
        .al-inp {
          width:100%;
          background:#F8FAFC;
          border:1.5px solid #E2E8F0;
          border-radius:11px;
          padding:13px 13px 13px 40px;
          font-size:14px; color:#0F172A;
          font-family:inherit; outline:none;
          transition:border-color .18s, box-shadow .18s, background .18s;
        }
        .al-inp::placeholder { color:#94A3B8; }
        .al-inp:focus {
          border-color:#2563EB;
          box-shadow:0 0 0 3px rgba(37,99,235,0.12);
          background:#fff;
        }
        .al-inp-pass { padding-right:44px; }

        .al-eye {
            position: absolute;
            top: 30%;
            right: 12px;
            background: none;
            border: none;
            cursor: pointer;
            color: #9CA3AF;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 4px;
            border-radius: 6px;
            transition: color .15s;
                }

        .al-eye:hover {
            color: #6B7280;
                      }

        .al-btn {
          width:100%; padding:14px;
          background:linear-gradient(135deg,#2563EB,#1D4ED8);
          color:#fff; border:none; border-radius:11px;
          font-size:15px; font-weight:700; font-family:inherit;
          cursor:pointer;
          display:flex; align-items:center; justify-content:center; gap:9px;
          box-shadow:0 4px 16px rgba(37,99,235,0.38);
          transition:transform .18s, box-shadow .18s;
          margin-top:4px;
        }
        .al-btn:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 6px 22px rgba(37,99,235,0.46); }
        .al-btn:active:not(:disabled) { transform:translateY(0); }
        .al-btn:disabled { background:#94A3B8; box-shadow:none; cursor:not-allowed; }

        .al-spin {
          width:16px; height:16px;
          border:2px solid rgba(255,255,255,0.3);
          border-top-color:#fff; border-radius:50%;
          animation:spin .75s linear infinite; flex-shrink:0;
        }
        @keyframes spin { to { transform:rotate(360deg); } }

        .al-foot {
          text-align:center; margin-top:28px;
          font-size:11px; color:#94A3B8; line-height:1.6;
        }
        .al-foot span { color:#CBD5E1; }

        /* ── Responsive ── */
        @media (max-width: 700px) {
          .al-card { flex-direction:column; max-width:420px; border-radius:20px; }
          .al-card-left { width:100%; padding:36px 28px 32px; }
          .al-hl { font-size:24px; }
          .al-card-right { padding:36px 28px 40px; }
        }
        @media (max-width: 420px) {
          .al-card-left  { padding:28px 22px 24px; }
          .al-card-right { padding:28px 22px 36px; }
          .al-form-title { font-size:20px; }
        }
      `}</style>

      {/* ── Full-screen background ── */}
      <div className="al-bg">
        <div className="al-bg-orb al-bg-orb-1" />
        <div className="al-bg-orb al-bg-orb-2" />
        <div className="al-bg-orb al-bg-orb-3" />
        <div className="al-bg-grid" />

        {/* ── Centered card ── */}
        <div className="al-card">

          {/* LEFT — logo + branding */}
          <div className="al-card-left">
            <div className="al-cl-orb-1" />
            <div className="al-cl-orb-2" />
            <div className="al-cl-inner">

              <div className="al-logo-row">
                <img src="/logo.jpg" alt="SendResqPls" />
                <div>
                  <div className="al-logo-name">SendResqPls</div>
                  <div className="al-logo-sub">MDRRMO Balayan, Batangas</div>
                </div>
              </div>

              <h1 className="al-hl">
                Disaster Incident
                <span>Response Portal</span>
              </h1>

              <p className="al-tagline">
                Real-time emergency monitoring and AI-assisted dispatch for MDRRMO Balayan personnel.
              </p>

              <div className="al-feats">
                {[
                  'Live incident feed with AI classification',
                  'One-click department dispatch & call',
                  'Balayan barangay risk heat map',
                  'Full report history & analytics',
                ].map(f => (
                  <div key={f} className="al-feat">
                    <CheckCircle size={14} color="#34D399" style={{ flexShrink: 0 }} />
                    {f}
                  </div>
                ))}
              </div>

              <div className="al-badge">
                <div className="al-badge-dot" />
                <span>System Operational · Authorized Access Only</span>
              </div>

            </div>
          </div>

          {/* RIGHT — login form */}
          <div className="al-card-right">

            <h2 className="al-form-title">Administrator Sign In</h2>
            <p className="al-form-sub">Enter your MDRRMO credentials to access the portal.</p>

            {error && (
              <div className="al-err">
                <AlertTriangle size={14} style={{ flexShrink: 0 }} />
                {error}
              </div>
            )}

            <form className="al-form" onSubmit={handleLogin} autoComplete="on">

              <div className="al-field">
                <label htmlFor="al-email">Email Address</label>
                <div className="al-inp-wrap">
                  <span className="al-inp-icon"><Mail size={15} /></span>
                  <input
                    id="al-email"
                    className="al-inp"
                    type="email"
                    autoComplete="username"
                    placeholder="Enter your email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>
              </div>

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

              <button type="submit" className="al-btn" disabled={loading}>
                {loading
                  ? <><span className="al-spin" /> Signing in...</>
                  : <><ShieldAlert size={16} /> Sign In to Admin Portal</>
                }
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
