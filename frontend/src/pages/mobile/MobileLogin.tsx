import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login as apiLogin } from '../../api/client';
import { setupPushNotifications } from '../../utils/pushNotificationHelper';
import { Lock, Eye, EyeOff, AlertTriangle, ArrowRight } from 'lucide-react';

export default function MobileLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focusField, setFocusField] = useState<'email'|'pass'|null>(null);

  const handleLogin = async () => {
    if (!email || !password) { setError('Fill in muna ang email at password mo.'); return; }
    setLoading(true); setError('');
    try {
      const res = await apiLogin(email, password);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('userId', res.data.user?.id || '');
      localStorage.setItem('userName', res.data.user?.name || 'User');
      localStorage.setItem('userEmail', res.data.user?.email || '');
      localStorage.setItem('userPhone', res.data.user?.phoneNumber || '');
      localStorage.setItem('userRole', res.data.user?.role || 'CITIZEN');
      setupPushNotifications().catch(err => console.warn('[Login] Push notification setup failed:', err));
      if (res.data.role === 'ADMIN') { navigate('/'); } else { navigate('/mobile'); }
    } catch {
      setError('Mali ang email o password. Try mo ulit.');
    } finally { setLoading(false); }
  };

  const inputStyle = (): React.CSSProperties => ({
    width: '100%', border: 'none', background: 'transparent',
    outline: 'none', fontSize: 15, fontFamily: 'inherit',
    color: '#0F172A', padding: '16px 16px 16px 46px',
  });

  const wrapStyle = (field: 'email'|'pass'): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', position: 'relative',
    background: focusField === field ? '#fff' : '#F8FAFC',
    border: `1.5px solid ${focusField === field ? '#2563EB' : '#E2E8F0'}`,
    borderRadius: 14, transition: 'all 0.18s',
    boxShadow: focusField === field ? '0 0 0 3px rgba(37,99,235,0.1)' : 'none',
  });

  return (
    <div className="mobile-shell" style={{ background: '#F1F5F9' }}>
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
            Mag-login sa<br />
            <span style={{ color: '#93C5FD' }}>SendResQPls</span>
          </h1>
        </div>
      </div>

      {/* Floating form card */}
      <div className="ml-form-card">
        <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 20px', lineHeight: 1.55 }}>
          I-login ang iyong account para makapag-report ng emergency.
        </p>

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 10, padding: '10px 12px', marginBottom: 16 }}>
            <AlertTriangle size={14} color="#EF4444" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: '#B91C1C', fontWeight: 500 }}>{error}</span>
          </div>
        )}

        {/* Email field */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#374151', marginBottom: 6, letterSpacing: '0.01em' }}>Email Address</label>
          <div style={wrapStyle('email')}>
            <span style={{ position: 'absolute', left: 14, color: focusField === 'email' ? '#2563EB' : '#94A3B8', display: 'flex', transition: 'color 0.18s' }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
            </span>
            <input
              type="email" placeholder="juan@example.com"
              value={email} onChange={e => setEmail(e.target.value)}
              onFocus={() => setFocusField('email')}
              onBlur={() => setFocusField(null)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              style={inputStyle()}
            />
          </div>
        </div>

        {/* Password field */}
        <div style={{ marginBottom: 8 }}>
          <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#374151', marginBottom: 6, letterSpacing: '0.01em' }}>Password</label>
          <div style={wrapStyle('pass')}>
            <span style={{ position: 'absolute', left: 14, color: focusField === 'pass' ? '#2563EB' : '#94A3B8', display: 'flex', transition: 'color 0.18s' }}>
              <Lock size={17} />
            </span>
            <input
              type={showPass ? 'text' : 'password'} placeholder="••••••••"
              value={password} onChange={e => setPassword(e.target.value)}
              onFocus={() => setFocusField('pass')}
              onBlur={() => setFocusField(null)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              style={{ ...inputStyle(), paddingRight: 44 }}
            />
            <button
              onClick={() => setShowPass(!showPass)}
              style={{ position: 'absolute', right: 12, background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', display: 'flex', padding: 4 }}
            >
              {showPass ? <Eye size={17} /> : <EyeOff size={17} />}
            </button>
          </div>
        </div>

        {/* Forgot password */}
        <div style={{ textAlign: 'right', marginBottom: 20 }}>
          <button
            onClick={() => navigate('/mobile/forgot-password')}
            style={{ background: 'none', border: 'none', color: '#2563EB', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}
          >
            Nakalimutan ang password?
          </button>
        </div>

        {/* Login button */}
        <button className="ml-auth-btn" onClick={handleLogin} disabled={loading}>
          {loading
            ? <><span className="ml-spin" /> Sandali lang...</>
            : <>Mag-Login <ArrowRight size={16} /></>
          }
        </button>

        {/* Footer */}
        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13.5, color: '#64748B' }}>
          Wala pang account?{' '}
          <button
            onClick={() => navigate('/mobile/signup')}
            style={{ background: 'none', border: 'none', color: '#2563EB', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13.5, padding: 0 }}
          >
            Mag-register na!
          </button>
        </p>
      </div>

      {/* Bottom spacer */}
      <div style={{ flex: 1 }} />
      <div style={{ textAlign: 'center', padding: '16px 24px', fontSize: 11, color: '#CBD5E1' }}>
        MDRRMO Balayan, Batangas · SendResQPls v2
      </div>
    </div>
  );
}
