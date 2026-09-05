import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { login as apiLogin } from '../api/client';
import { Lock, Eye, EyeOff, AlertTriangle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 40);
    if (new URLSearchParams(location.search).get('expired') === '1') {
      setSessionExpired(true);
    }
    return () => clearTimeout(t);
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
    background: error ? '#FFF8F8' : focusField === field ? '#FFFFFF' : '#F8FAFC',
    border: `1.5px solid ${error ? '#EF4444' : focusField === field ? '#2563EB' : '#E2E8F0'}`,
    borderRadius: 14,
    transition: 'all 0.18s',
    boxShadow: error
      ? '0 0 0 3px rgba(239,68,68,0.09)'
      : focusField === field ? '0 0 0 3px rgba(37,99,235,0.1)' : 'none',
  });

  return (
    <div className="al-page-wrapper">
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        .al-input-error::placeholder {
          color: #EF4444 !important;
          opacity: 0.85 !important;
        }

        @keyframes alOrbPulse {
          0%, 100% { transform: scale(1) translate(0, 0); opacity: 0.18; }
          50% { transform: scale(1.15) translate(8px, -6px); opacity: 0.32; }
        }

        .al-page-wrapper {
          min-height: 100dvh;
          width: 100%;
          background: #F1F5F9;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: clamp(16px, 3vw, 48px);
          font-family: var(--font, 'Inter', system-ui, -apple-system, sans-serif);
          overflow-x: hidden;
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
          opacity: 0;
          transform: translateY(32px) scale(0.97);
          transition: opacity 0.65s cubic-bezier(0.16, 1, 0.3, 1), transform 0.65s cubic-bezier(0.16, 1, 0.3, 1);
          will-change: transform, opacity;
        }
        .al-container.mounted {
          opacity: 1;
          transform: translateY(0) scale(1);
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
          padding: clamp(36px, 4.5vw, 60px);
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          justify-content: center;
          color: #FFFFFF;
        }
        .al-showcase::after {
          content: '';
          position: absolute;
          top: -60px;
          right: -60px;
          width: 240px;
          height: 240px;
          background: radial-gradient(circle, rgba(147,197,253,0.2) 0%, rgba(255,255,255,0) 70%);
          border-radius: 50%;
          pointer-events: none;
          animation: alOrbPulse 8s ease-in-out infinite;
        }
        .al-showcase::before {
          content: '';
          position: absolute;
          bottom: -40px;
          left: -40px;
          width: 200px;
          height: 200px;
          background: radial-gradient(circle, rgba(37,99,235,0.25) 0%, rgba(255,255,255,0) 70%);
          border-radius: 50%;
          pointer-events: none;
          animation: alOrbPulse 10s ease-in-out infinite reverse;
        }

        .al-showcase-inner {
          position: relative;
          z-index: 1;
          opacity: 0;
          transform: translateX(-24px);
          transition: opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.08s, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.08s;
          will-change: transform, opacity;
        }
        .al-showcase-inner.mounted {
          opacity: 1;
          transform: translateX(0);
        }

        @media (max-width: 919px) {
          .al-showcase {
            padding: 40px 24px 32px;
            border-radius: 0 0 28px 28px;
          }
        }

        /* ─── Right Form Side ─── */
        .al-form-section {
          padding: clamp(28px, 4vw, 48px);
          display: flex;
          flex-direction: column;
          justify-content: center;
          background: #FFFFFF;
        }

        .al-form-content {
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.15s, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.15s;
          will-change: transform, opacity;
        }
        .al-form-content.mounted {
          opacity: 1;
          transform: translateY(0);
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
      `}</style>

      <div className={`al-container ${mounted ? 'mounted' : ''}`}>
        {/* ── Left Column: Brand & Command Center Showcase ── */}
        <div className="al-showcase">
          <div className={`al-showcase-inner ${mounted ? 'mounted' : ''}`}>
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
                margin: 0,
              }}
            >
              Official MDRRMO Balayan municipal incident management portal for live disaster response, triage, and multi-agency fleet coordination.
            </p>
          </div>
        </div>

        {/* ── Right Column: Admin Login Form ── */}
        <div className="al-form-section">
          <form className={`al-form-content ${mounted ? 'mounted' : ''}`} onSubmit={handleLogin} noValidate>
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
              <Label
                htmlFor="admin-email"
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
              </Label>
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
                <Input
                  id="admin-email"
                  type="email"
                  className={error ? 'al-input-error' : ''}
                  placeholder="admin@balayan.gov.ph"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (error) setError(''); }}
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
              <Label
                htmlFor="admin-password"
                style={{
                  display: 'block',
                  fontSize: 12.5,
                  fontWeight: 700,
                  color: error ? '#DC2626' : '#374151',
                  marginBottom: 6,
                  letterSpacing: '0.01em',
                }}
              >
                Password
              </Label>
              <div style={wrapStyle('pass')}>
                <span
                  style={{
                    position: 'absolute',
                    left: 14,
                    color: error ? '#EF4444' : focusField === 'pass' ? '#2563EB' : '#94A3B8',
                    display: 'flex',
                    transition: 'color 0.18s',
                  }}
                >
                  <Lock size={18} />
                </span>
                <Input
                  id="admin-password"
                  type={showPass ? 'text' : 'password'}
                  className={error ? 'al-input-error' : ''}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); if (error) setError(''); }}
                  onFocus={() => setFocusField('pass')}
                  onBlur={() => setFocusField(null)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  style={{ ...inputStyle(), paddingRight: 48 }}
                  autoComplete="current-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: 'absolute',
                    right: 4,
                    background: 'none',
                    color: '#94A3B8',
                    padding: 4,
                    height: 32,
                    width: 32,
                  }}
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                >
                  {showPass ? <Eye size={18} /> : <EyeOff size={18} />}
                </Button>
              </div>
            </div>

            {/* Login button */}
            <Button type="submit" className="al-auth-btn" disabled={loading}>
              {loading ? (
                <>
                  <span className="al-spin" /> Authenticating...
                </>
              ) : (
                'Access Command Center'
              )}
            </Button>

            {/* Return to landing page */}
            <div style={{ textAlign: 'center', marginTop: 20 }}>
              <Button
                type="button"
                variant="ghost"
                onClick={() => navigate('/')}
                style={{
                  color: '#64748B',
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                Return to Main Page
              </Button>
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
