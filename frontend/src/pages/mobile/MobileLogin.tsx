import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { login as apiLogin } from '../../api/client';
import { setupPushNotifications } from '../../utils/pushNotificationHelper';
import { Lock, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function MobileLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  // Field-level errors for inline UX
  const [emailError, setEmailError] = useState('');
  const [passError, setPassError] = useState('');
  const [globalError, setGlobalError] = useState('');
  const [sessionExpired, setSessionExpired] = useState(false);
  const [focusField, setFocusField] = useState<'email'|'pass'|null>(null);

  useEffect(() => {
    if (new URLSearchParams(location.search).get('expired') === '1') {
      setSessionExpired(true);
    }
  }, [location.search]);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    // Field-level validation
    let valid = true;
    setEmailError(''); setPassError(''); setGlobalError('');
    if (!email.trim()) { setEmailError('Please enter your email address.'); valid = false; }
    else if (!/^[^@]+@[^@]+\.[^@]+$/.test(email.trim())) { setEmailError('Enter a valid email address.'); valid = false; }
    if (!password) { setPassError('Please enter your password.'); valid = false; }
    if (!valid) return;

    setLoading(true);
    try {
      const res = await apiLogin(email.trim(), password);
      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem('token', res.data.token);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('userId', res.data.user?.id || '');
      localStorage.setItem('userName', res.data.user?.name || 'User');
      localStorage.setItem('userEmail', res.data.user?.email || '');
      localStorage.setItem('userPhone', res.data.user?.phoneNumber || '');
      localStorage.setItem('userRole', res.data.user?.role || 'CITIZEN');
      setupPushNotifications().catch(err => console.warn('[Login] Push notification setup failed:', err));
      if (res.data.role === 'ADMIN') { navigate('/'); } else { navigate('/mobile'); }
    } catch {
      setEmailError('error');
      setPassError('error');
      setGlobalError('Incorrect email or password. Please try again.');
    } finally { setLoading(false); }
  };

  const inputStyle = (): React.CSSProperties => ({
    width: '100%', border: 'none', background: 'transparent',
    outline: 'none', fontSize: 15, fontFamily: 'inherit',
    color: '#0F172A', padding: '16px 16px 16px 46px',
  });

  const wrapStyle = (field: 'email'|'pass', hasError?: boolean): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', position: 'relative',
    background: hasError ? '#FFF8F8' : focusField === field ? '#fff' : '#F8FAFC',
    border: `1.5px solid ${hasError ? '#EF4444' : focusField === field ? '#2563EB' : '#E2E8F0'}`,
    borderRadius: 14, transition: 'all 0.18s',
    boxShadow: hasError
      ? '0 0 0 3px rgba(239,68,68,0.09)'
      : focusField === field ? '0 0 0 3px rgba(37,99,235,0.1)' : 'none',
  });

  return (
    <div className="mobile-shell mobile-auth-transition" style={{ background: '#F1F5F9' }}>
      <style>{`
        .ml-login-header {
          background: linear-gradient(160deg, #0F1F38 0%, #1D4ED8 60%, #2563EB 100%);
          padding: 56px 28px 44px;
          position: relative;
          overflow: hidden;
          border-radius: 0 0 32px 32px;
        }
        .ml-login-header::after {
          content: '';
          position: absolute;
          top: -40px; right: -40px;
          width: 160px; height: 160px;
          background: rgba(255,255,255,0.05);
          border-radius: 50%;
        }
        .ml-login-header::before {
          content: '';
          position: absolute;
          bottom: 20px; left: -30px;
          width: 100px; height: 100px;
          background: rgba(255,255,255,0.04);
          border-radius: 50%;
        }
        .ml-form-card {
          margin: 16px 20px 30px;
          background: #fff;
          border-radius: 22px;
          padding: 28px 24px;
          box-shadow: 0 8px 40px rgba(30,58,95,0.12), 0 2px 8px rgba(0,0,0,0.06);
          position: relative; z-index: 2;
          animation: authCardEntrance 0.35s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .ml-auth-btn {
          width: 100%; padding: 16px;
          background: linear-gradient(135deg, #2563EB, #1D4ED8);
          color: white; border: none; border-radius: 14px;
          font-size: 15px; font-weight: 700; font-family: inherit;
          cursor: pointer; display: flex; align-items: center;
          justify-content: center; gap: 10px;
          box-shadow: 0 4px 16px rgba(37,99,235,0.38);
          transition: transform 0.18s, box-shadow 0.18s;
          margin-top: 8px; letter-spacing: 0.01em;
        }
        .ml-auth-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 22px rgba(37,99,235,0.46); }
        .ml-auth-btn:active:not(:disabled) { transform: translateY(0) scale(0.98); }
        .ml-auth-btn:disabled { background: #94A3B8; box-shadow: none; cursor: not-allowed; }
        .ml-spin { width:16px; height:16px; border:2px solid rgba(255,255,255,0.3); border-top-color:#fff; border-radius:50%; animation:mlspin .75s linear infinite; }
        @keyframes mlspin { to { transform: rotate(360deg); } }
        .ml-input-error::placeholder {
          color: #EF4444 !important;
          opacity: 0.85 !important;
        }
      `}</style>

      {/* Branded header */}
      <div className="ml-login-header">
        <div style={{ position: 'relative', zIndex: 1 }}>
          <img
            src="/logo.jpg" alt="SRQ"
            style={{ width: 56, height: 56, borderRadius: 16, objectFit: 'cover', marginBottom: 16, border: '2px solid rgba(255,255,255,0.2)', boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}
          />
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6, fontWeight: 600 }}>
            MDRRMO Balayan, Batangas
          </div>
          <h1 style={{ color: 'white', fontSize: 26, fontWeight: 900, letterSpacing: '-0.5px', lineHeight: 1.15, margin: 0 }}>
            Log in to<br />
            <span style={{ color: '#93C5FD' }}>SendResQPls</span>
          </h1>
        </div>
      </div>

      {/* Floating form card */}
      <form className="ml-form-card" onSubmit={handleLogin} noValidate>
        <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 20px', lineHeight: 1.55 }}>
          I-login ang iyong account para makapag-report ng emergency.
        </p>

        {sessionExpired && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, padding: '10px 12px', marginBottom: 16 }}>
            <AlertTriangle size={14} color="#D97706" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: '#92400E', fontWeight: 600 }}>Your session has expired for security. Please log in again.</span>
          </div>
        )}

        {globalError && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 10, padding: '10px 12px', marginBottom: 16 }}>
            <AlertTriangle size={14} color="#EF4444" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: '#B91C1C', fontWeight: 500 }}>{globalError}</span>
          </div>
        )}

        {/* Email field */}
        <div style={{ marginBottom: emailError && emailError !== 'error' ? 6 : 14 }}>
          <Label htmlFor="mobile-email" style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: emailError ? '#DC2626' : '#374151', marginBottom: 6, letterSpacing: '0.01em' }}>Email Address</Label>
          <div style={wrapStyle('email', !!emailError)}>
            <span style={{ position: 'absolute', left: 14, color: emailError ? '#EF4444' : focusField === 'email' ? '#2563EB' : '#94A3B8', display: 'flex', transition: 'color 0.18s' }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
            </span>
            <Input
              id="mobile-email"
              type="email"
              className={emailError ? 'ml-input-error' : ''}
              placeholder="juan@example.com"
              autoComplete="email"
              value={email}
              onChange={e => {
                setEmail(e.target.value);
                if (emailError) setEmailError('');
                if (globalError) setGlobalError('');
              }}
              onFocus={() => setFocusField('email')}
              onBlur={() => setFocusField(null)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              style={inputStyle()}
            />
          </div>
        </div>
        {emailError && emailError !== 'error' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 10, marginTop: 4 }}>
            <AlertTriangle size={12} color="#EF4444" />
            <span style={{ fontSize: 11.5, color: '#DC2626', fontWeight: 600 }}>{emailError}</span>
          </div>
        )}

        {/* Password field */}
        <div style={{ marginBottom: passError && passError !== 'error' ? 4 : 8 }}>
          <Label htmlFor="mobile-password" style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: passError ? '#DC2626' : '#374151', marginBottom: 6, letterSpacing: '0.01em' }}>Password</Label>
          <div style={wrapStyle('pass', !!passError)}>
            <span style={{ position: 'absolute', left: 14, color: passError ? '#EF4444' : focusField === 'pass' ? '#2563EB' : '#94A3B8', display: 'flex', transition: 'color 0.18s' }}>
              <Lock size={17} />
            </span>
            <Input
              id="mobile-password"
              type={showPass ? 'text' : 'password'}
              className={passError ? 'ml-input-error' : ''}
              placeholder="••••••••"
              autoComplete="current-password"
              value={password}
              onChange={e => {
                setPassword(e.target.value);
                if (passError) setPassError('');
                if (globalError) setGlobalError('');
              }}
              onFocus={() => setFocusField('pass')}
              onBlur={() => setFocusField(null)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              style={{ ...inputStyle(), paddingRight: 52 }}
            />
            {/* 44×44 tap target for eye toggle */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setShowPass(!showPass)}
              aria-label={showPass ? 'Hide password' : 'Show password'}
              style={{
                position: 'absolute', right: 4,
                width: 44, height: 44,
                color: '#94A3B8',
              }}
            >
              {showPass ? <Eye size={18} /> : <EyeOff size={18} />}
            </Button>
          </div>
        </div>
        {passError && passError !== 'error' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8, marginTop: 2 }}>
            <AlertTriangle size={12} color="#EF4444" />
            <span style={{ fontSize: 11.5, color: '#DC2626', fontWeight: 600 }}>{passError}</span>
          </div>
        )}

        {/* Remember Me + Forgot password row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', userSelect: 'none' }}>
            <div
              onClick={() => setRememberMe(!rememberMe)}
              style={{
                width: 36, height: 20, borderRadius: 10,
                background: rememberMe ? '#2563EB' : '#E2E8F0',
                position: 'relative', transition: 'background 0.2s',
                flexShrink: 0, cursor: 'pointer',
              }}
            >
              <div style={{
                position: 'absolute', top: 3, left: rememberMe ? 19 : 3,
                width: 14, height: 14, borderRadius: '50%',
                background: 'white', transition: 'left 0.2s',
                boxShadow: '0 1px 4px rgba(0,0,0,0.18)',
              }} />
            </div>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: '#475569' }}>Remember me</span>
          </label>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              navigate('/mobile/forgot-password');
            }}
            style={{ background: 'none', border: 'none', color: '#2563EB', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}
          >
            Forgot password?
          </button>
        </div>

        {/* Login button */}
        <Button type="submit" className="ml-auth-btn" disabled={loading} style={{ minHeight: 48 }}>
          {loading
            ? <><span className="ml-spin" /> Please wait...</>
            : 'Log In'
          }
        </Button>

        {/* Footer */}
        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13.5, color: '#64748B' }}>
          Don't have an account?{' '}
          <button
            type="button"
            onClick={() => navigate('/mobile/signup')}
            style={{ background: 'none', border: 'none', color: '#2563EB', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13.5, padding: 0 }}
          >
            Sign up now!
          </button>
        </p>
      </form>

      {/* Bottom spacer */}
      <div style={{ flex: 1 }} />
      <div style={{ textAlign: 'center', padding: '16px 24px', fontSize: 11, color: '#CBD5E1' }}>
        MDRRMO Balayan, Batangas · SendResQPls v2
      </div>
    </div>
  );
}
