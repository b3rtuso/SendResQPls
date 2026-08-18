import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { login as apiLogin } from '../api/client';
import { Lock, Eye, EyeOff, AlertTriangle, ShieldCheck, Clock } from 'lucide-react';

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
    if (!email || !password) {
      setError('Please fill in your email and password.');
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
    background: focusField === field ? '#fff' : '#F8FAFC',
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
          padding: 24px 16px;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
        }

        .al-container {
          width: 100%;
          max-width: 440px;
          background: #F1F5F9;
          border-radius: 32px;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(15, 23, 42, 0.12), 0 1px 3px rgba(0, 0, 0, 0.05);
          display: flex;
          flex-direction: column;
        }

        .al-login-header {
          background: linear-gradient(160deg, #0F1F38 0%, #1D4ED8 60%, #2563EB 100%);
          padding: 48px 28px 40px;
          position: relative;
          overflow: hidden;
          border-radius: 0 0 32px 32px;
        }
        .al-login-header::after {
          content: '';
          position: absolute;
          top: -40px;
          right: -40px;
          width: 160px;
          height: 160px;
          background: rgba(255,255,255,0.05);
          border-radius: 50%;
        }
        .al-login-header::before {
          content: '';
          position: absolute;
          bottom: 20px;
          left: -30px;
          width: 100px;
          height: 100px;
          background: rgba(255,255,255,0.04);
          border-radius: 50%;
        }

        .al-form-card {
          margin: 16px 20px 24px;
          background: #fff;
          border-radius: 22px;
          padding: 28px 24px;
          box-shadow: 0 8px 40px rgba(30,58,95,0.12), 0 2px 8px rgba(0,0,0,0.06);
          position: relative;
          z-index: 2;
        }

        .al-auth-btn {
          width: 100%;
          padding: 16px;
          background: linear-gradient(135deg, #2563EB, #1D4ED8);
          color: white;
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
          box-shadow: 0 4px 16px rgba(37,99,235,0.38);
          transition: transform 0.18s, box-shadow 0.18s;
          margin-top: 8px;
          letter-spacing: 0.01em;
        }
        .al-auth-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 22px rgba(37,99,235,0.46);
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
          background: rgba(37, 99, 235, 0.08);
          color: #2563EB;
          padding: 4px 10px;
          border-radius: 8px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          margin-bottom: 12px;
        }
      `}</style>

      <div className="al-container">
        {/* Branded header */}
        <div className="al-login-header">
          <div style={{ position: 'relative', zIndex: 1 }}>
            <img
              src="/logo.jpg"
              alt="SRQ Logo"
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                objectFit: 'cover',
                marginBottom: 16,
                border: '2px solid rgba(255,255,255,0.2)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
              }}
            />
            <div
              style={{
                fontSize: 11,
                color: 'rgba(255,255,255,0.6)',
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                marginBottom: 6,
                fontWeight: 700,
              }}
            >
              MDRRMO Balayan, Batangas
            </div>
            <h1
              style={{
                color: 'white',
                fontSize: 26,
                fontWeight: 900,
                letterSpacing: '-0.5px',
                lineHeight: 1.15,
                margin: 0,
              }}
            >
              Command Center<br />
              <span style={{ color: '#93C5FD' }}>Admin Portal</span>
            </h1>
          </div>
        </div>

        {/* Floating form card */}
        <form className="al-form-card" onSubmit={handleLogin} noValidate>
          <div className="al-badge">
            <ShieldCheck size={13} />
            Authorized Personnel Only
          </div>

          <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 20px', lineHeight: 1.55 }}>
            I-login ang iyong MDRRMO administrator account para ma-access ang command center dashboard.
          </p>

          {sessionExpired && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: '#FFFBEB',
                border: '1px solid #FDE68A',
                borderRadius: 10,
                padding: '10px 12px',
                marginBottom: 16,
              }}
            >
              <Clock size={15} color="#D97706" style={{ flexShrink: 0 }} />
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
                borderRadius: 10,
                padding: '10px 12px',
                marginBottom: 16,
              }}
            >
              <AlertTriangle size={14} color="#EF4444" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: '#B91C1C', fontWeight: 500 }}>{error}</span>
            </div>
          )}

          {/* Email field */}
          <div style={{ marginBottom: 14 }}>
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
                  width="17"
                  height="17"
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
          <div style={{ marginBottom: 20 }}>
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
                <Lock size={17} />
              </span>
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocusField('pass')}
                onBlur={() => setFocusField(null)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                style={{ ...inputStyle(), paddingRight: 44 }}
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
                {showPass ? <Eye size={17} /> : <EyeOff size={17} />}
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
              ← Return to Main Page
            </button>
          </div>
        </form>

        {/* Bottom footer */}
        <div
          style={{
            textAlign: 'center',
            padding: '8px 24px 20px',
            fontSize: 11,
            color: '#94A3B8',
            fontWeight: 500,
          }}
        >
          MDRRMO Balayan Command Center · SendResQPls Admin
        </div>
      </div>
    </div>
  );
}
