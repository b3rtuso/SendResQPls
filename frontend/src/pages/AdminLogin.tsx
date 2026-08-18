import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { login as apiLogin } from '../api/client';
import { Lock, Eye, EyeOff, AlertTriangle, ShieldCheck, Clock, Activity, MapPin, Radio } from 'lucide-react';

export default function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sessionExpired, setSessionExpired] = useState(false);
  const [focusField, setFocusField] = useState<'email' | 'pass' | null>(null);

  useEffect(() => {
    if (new URLSearchParams(location.search).get('expired') === '1') {
      setSessionExpired(true);
    }
  }, [location.search]);

  const handleLogin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await apiLogin(email.trim(), password);
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
      setError(err.response?.data?.error || 'Incorrect email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (): React.CSSProperties => ({
    width: '100%',
    border: 'none',
    background: 'transparent',
    outline: 'none',
    fontSize: 15,
    fontFamily: 'inherit',
    color: '#0F172A',
    padding: '16px 16px 16px 46px',
  });

  const wrapStyle = (field: 'email' | 'pass'): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    position: 'relative',
    background: focusField === field ? '#FFFFFF' : '#F8FAFC',
    border: `1.5px solid ${focusField === field ? '#2563EB' : '#E2E8F0'}`,
    borderRadius: 14,
    transition: 'all 0.18s',
    boxShadow: focusField === field ? '0 0 0 3px rgba(37,99,235,0.1)' : 'none',
  });

  return (
    <div className="al-page-wrapper">
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .al-page-wrapper {
          min-height: 100dvh;
          width: 100%;
          background: #F1F5F9;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: clamp(16px, 3vw, 48px);
          font-family: var(--font, 'Inter', system-ui, -apple-system, sans-serif);
        }

        .al-container {
          width: 100%;
          max-width: 460px;
          background: #FFFFFF;
          border-radius: 28px;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(15, 23, 42, 0.09), 0 1px 3px rgba(0, 0, 0, 0.04);
          display: flex;
          flex-direction: column;
          transition: all 0.3s ease;
        }

        /* ─── Desktop Large Screen Layout (≥ 920px) ─── */
        @media (min-width: 920px) {
          .al-container {
            max-width: 1060px;
            display: grid;
            grid-template-columns: 1.15fr 1fr;
            min-height: 620px;
            border-radius: 32px;
            box-shadow: 0 24px 80px rgba(15, 23, 42, 0.12), 0 2px 6px rgba(0, 0, 0, 0.04);
          }
        }

        /* ─── Left Brand Showcase ─── */
        .al-showcase {
          background: linear-gradient(155deg, #0A1628 0%, #0F2347 45%, #1D4ED8 100%);
          padding: clamp(36px, 4vw, 56px);
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          color: #FFFFFF;
        }
        .al-showcase::after {
          content: '';
          position: absolute;
          top: -60px;
          right: -60px;
          width: 220px;
          height: 220px;
          background: radial-gradient(circle, rgba(147,197,253,0.15) 0%, rgba(255,255,255,0) 70%);
          border-radius: 50%;
          pointer-events: none;
        }
        .al-showcase::before {
          content: '';
          position: absolute;
          bottom: -40px;
          left: -40px;
          width: 180px;
          height: 180px;
          background: radial-gradient(circle, rgba(37,99,235,0.2) 0%, rgba(255,255,255,0) 70%);
          border-radius: 50%;
          pointer-events: none;
        }

        @media (max-width: 919px) {
          .al-showcase {
            padding: 40px 24px 32px;
            border-radius: 0 0 28px 28px;
          }
          .al-showcase-desktop-only {
            display: none !important;
          }
        }

        /* ─── Feature Pill List ─── */
        .al-feature-pill {
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.12);
          padding: 12px 16px;
          border-radius: 14px;
          color: #E2E8F0;
          font-size: 13px;
          font-weight: 600;
          line-height: 1.4;
        }

        /* ─── Right Form Side ─── */
        .al-form-section {
          padding: clamp(28px, 4vw, 48px);
          display: flex;
          flex-direction: column;
          justify-content: center;
          background: #FFFFFF;
        }

        .al-auth-btn {
          width: 100%;
          padding: 16px;
          background: linear-gradient(135deg, #2563EB, #1D4ED8);
          color: #FFFFFF;
          border: none;
          border-radius: 14px;
          font-size: 15px;
          font-weight: 700;
          font-family: inherit;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          box-shadow: 0 4px 18px rgba(37,99,235,0.35);
          transition: transform 0.18s, box-shadow 0.18s;
          margin-top: 8px;
          letter-spacing: 0.01em;
        }
        .al-auth-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 24px rgba(37,99,235,0.45);
        }
        .al-auth-btn:active:not(:disabled) {
          transform: translateY(0) scale(0.98);
        }
        .al-auth-btn:disabled {
          background: #94A3B8;
          box-shadow: none;
          cursor: not-allowed;
        }

        .al-spin {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: alspin .75s linear infinite;
        }
        @keyframes alspin {
          to { transform: rotate(360deg); }
        }

        .al-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #EFF6FF;
          color: #2563EB;
          border: 1px solid #DBEAFE;
          padding: 5px 12px;
          border-radius: 999px;
          font-size: 11.5px;
          font-weight: 700;
          letter-spacing: 0.03em;
          text-transform: uppercase;
          margin-bottom: 14px;
          align-self: flex-start;
        }
      `}</style>

      <div className="al-container">
        {/* ── Left Column: Brand & Command Center Showcase ── */}
        <div className="al-showcase">
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
              <img
                src="/logo.jpg"
                alt="MDRRMO Balayan Logo"
                style={{
                  width: 58,
                  height: 58,
                  borderRadius: 16,
                  objectFit: 'cover',
                  border: '2px solid rgba(255,255,255,0.25)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                }}
              />
              <div>
                <div
                  style={{
                    fontSize: 11,
                    color: 'rgba(255,255,255,0.65)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.12em',
                    fontWeight: 800,
                  }}
                >
                  MDRRMO Balayan
                </div>
                <div style={{ fontSize: 13, color: '#93C5FD', fontWeight: 700 }}>
                  Batangas Province
                </div>
              </div>
            </div>

            <h1
              style={{
                color: '#FFFFFF',
                fontSize: 'clamp(26px, 2.8vw, 36px)',
                fontWeight: 900,
                letterSpacing: '-0.03em',
                lineHeight: 1.15,
                margin: '0 0 12px',
              }}
            >
              Command Center<br />
              <span style={{ color: '#93C5FD' }}>Admin & Dispatch</span>
            </h1>

            <p
              style={{
                fontSize: 14,
                color: 'rgba(255,255,255,0.78)',
                lineHeight: 1.6,
                maxWidth: 420,
                margin: '0 0 24px',
              }}
            >
              Official MDRRMO Balayan municipal incident management portal for live disaster response, triage, and multi-agency fleet coordination.
            </p>

            {/* Desktop feature highlights */}
            <div className="al-showcase-desktop-only" style={{ display: 'flex', flexDirection: 'column', gap: 10, margin: '24px 0 32px' }}>
              <div className="al-feature-pill">
                <Activity size={18} color="#93C5FD" style={{ flexShrink: 0 }} />
                <span>Real-Time Disaster Triage & Severity AI Detection</span>
              </div>
              <div className="al-feature-pill">
                <MapPin size={18} color="#93C5FD" style={{ flexShrink: 0 }} />
                <span>Live GIS Incident Heatmaps & Grid Route Tracking</span>
              </div>
              <div className="al-feature-pill">
                <Radio size={18} color="#93C5FD" style={{ flexShrink: 0 }} />
                <span>Multi-Agency Dispatch (MDRRMO, BFP, PNP, EMS)</span>
              </div>
            </div>
          </div>

          {/* Bottom active status badge */}
          <div
            style={{
              position: 'relative',
              zIndex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 12,
              color: 'rgba(255,255,255,0.85)',
              fontWeight: 700,
              paddingTop: 16,
              borderTop: '1px solid rgba(255,255,255,0.12)',
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#22C55E',
                boxShadow: '0 0 10px #22C55E',
                display: 'inline-block',
              }}
            />
            <span>24/7 Balayan Command Grid Active</span>
          </div>
        </div>

        {/* ── Right Column: Admin Login Form ── */}
        <div className="al-form-section">
          <form onSubmit={handleLogin} noValidate>
            <div className="al-badge">
              <ShieldCheck size={14} />
              Authorized Personnel Only
            </div>

            <h2
              style={{
                fontSize: 'clamp(20px, 2vw, 26px)',
                fontWeight: 900,
                color: '#0F172A',
                letterSpacing: '-0.02em',
                marginBottom: 6,
              }}
            >
              Sign In to Portal
            </h2>

            <p style={{ fontSize: 13.5, color: '#64748B', margin: '0 0 24px', lineHeight: 1.55 }}>
              Enter your official administrative credentials to access the live command center dashboard.
            </p>

            {sessionExpired && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: '#FFFBEB',
                  border: '1px solid #FDE68A',
                  borderRadius: 12,
                  padding: '12px 14px',
                  marginBottom: 16,
                }}
              >
                <Clock size={16} color="#D97706" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: '#92400E', fontWeight: 600 }}>
                  Your session has expired for security. Please sign in again.
                </span>
              </div>
            )}

            {error && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: '#FEF2F2',
                  border: '1px solid #FCA5A5',
                  borderRadius: 12,
                  padding: '12px 14px',
                  marginBottom: 16,
                }}
              >
                <AlertTriangle size={16} color="#EF4444" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: '#B91C1C', fontWeight: 600 }}>{error}</span>
              </div>
            )}

            {/* Email field */}
            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 12.5,
                  fontWeight: 700,
                  color: '#374151',
                  marginBottom: 6,
                  letterSpacing: '0.01em',
                }}
              >
                Admin Email Address
              </label>
              <div style={wrapStyle('email')}>
                <span
                  style={{
                    position: 'absolute',
                    left: 14,
                    color: focusField === 'email' ? '#2563EB' : '#94A3B8',
                    display: 'flex',
                    transition: 'color 0.18s',
                  }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </span>
                <input
                  type="email"
                  placeholder="admin@mdrrmo.gov.ph"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusField('email')}
                  onBlur={() => setFocusField(null)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  style={inputStyle()}
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password field */}
            <div style={{ marginBottom: 24 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 12.5,
                  fontWeight: 700,
                  color: '#374151',
                  marginBottom: 6,
                  letterSpacing: '0.01em',
                }}
              >
                Password
              </label>
              <div style={wrapStyle('pass')}>
                <span
                  style={{
                    position: 'absolute',
                    left: 14,
                    color: focusField === 'pass' ? '#2563EB' : '#94A3B8',
                    display: 'flex',
                    transition: 'color 0.18s',
                  }}
                >
                  <Lock size={18} />
                </span>
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusField('pass')}
                  onBlur={() => setFocusField(null)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  style={{ ...inputStyle(), paddingRight: 48 }}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: 'absolute',
                    right: 12,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#94A3B8',
                    display: 'flex',
                    padding: 4,
                  }}
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                >
                  {showPass ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
              </div>
            </div>

            {/* Login button */}
            <button type="submit" className="al-auth-btn" disabled={loading}>
              {loading ? (
                <>
                  <span className="al-spin" /> Authenticating...
                </>
              ) : (
                'Access Command Center'
              )}
            </button>

            {/* Return to landing page */}
            <div style={{ textAlign: 'center', marginTop: 20 }}>
              <button
                type="button"
                onClick={() => navigate('/')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748B',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  transition: 'color 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#2563EB')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#64748B')}
              >
                Return to Main Page
              </button>
            </div>
          </form>

          {/* Bottom security footer */}
          <div
            style={{
              textAlign: 'center',
              marginTop: 24,
              fontSize: 11,
              color: '#94A3B8',
              fontWeight: 500,
            }}
          >
            MDRRMO Balayan Command Center · SendResQPls Admin v2
          </div>
        </div>
      </div>
    </div>
  );
}
