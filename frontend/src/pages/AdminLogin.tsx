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
      navigate('/');
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Invalid email or password.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      fontFamily: "'Inter', 'system-ui', sans-serif",
      background: '#F8FAFC',
    }}>

      {/* ── Left branding panel ──────────────────────────── */}
      <div style={{
        width: '52%',
        background: 'linear-gradient(145deg, #0F172A 0%, #1E3A5F 50%, #1E1B4B 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'flex-start',
        padding: '60px 72px',
        position: 'relative',
        overflow: 'hidden',
        flexShrink: 0,
      }}>
        {/* Background dot grid */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0,
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)',
          backgroundSize: '36px 36px',
        }} />
        {/* Decorative orbs */}
        <div style={{ position: 'absolute', top: -80, right: -80, width: 320, height: 320, borderRadius: '50%', background: 'rgba(37,99,235,0.15)', filter: 'blur(60px)' }} />
        <div style={{ position: 'absolute', bottom: -60, left: -60, width: 260, height: 260, borderRadius: '50%', background: 'rgba(220,38,38,0.12)', filter: 'blur(50px)' }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 480 }}>
          {/* Logo + app name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 48 }}>
            <img
              src="/logo.jpg"
              alt="SRQ Logo"
              style={{
                width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                objectFit: 'cover',
                boxShadow: '0 8px 24px rgba(220,38,38,0.4)',
              }}
            />
            <div>
              <div style={{ color: 'white', fontSize: 18, fontWeight: 800, letterSpacing: '-0.3px' }}>SendResqPls</div>
              <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, fontWeight: 500 }}>MDRRMO Balayan, Batangas</div>
            </div>
          </div>

          <h1 style={{
            color: 'white', fontSize: 40, fontWeight: 900,
            lineHeight: 1.15, margin: '0 0 20px',
            letterSpacing: '-0.5px',
          }}>
            Disaster Incident<br />
            <span style={{ color: '#60A5FA' }}>Response Portal</span>
          </h1>

          <p style={{
            color: 'rgba(255,255,255,0.55)', fontSize: 15,
            lineHeight: 1.7, margin: '0 0 48px', maxWidth: 380,
          }}>
            Real-time emergency monitoring, AI-assisted triage, and dispatch coordination for MDRRMO Balayan personnel.
          </p>

          {/* Feature bullets */}
          {[
            'Live incident feed with AI classification',
            'One-click department dispatch & call',
            'Balayan barangay risk heat map',
            'Full report history & analytics',
          ].map((feat) => (
            <div key={feat} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <CheckCircle size={16} color="#34D399" style={{ flexShrink: 0 }} />
              <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>{feat}</span>
            </div>
          ))}

          {/* Bottom badge */}
          <div style={{
            marginTop: 56,
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 20, padding: '8px 16px',
          }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#34D399', boxShadow: '0 0 8px #34D399' }} />
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: 600 }}>
              System Operational · Authorized Access Only
            </span>
          </div>
        </div>
      </div>

      {/* ── Right login form ─────────────────────────────── */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '60px 40px',
        background: '#F8FAFC',
      }}>
        <div style={{ width: '100%', maxWidth: 420 }}>

          {/* Header */}
          <div style={{ marginBottom: 36 }}>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: '#0F172A', margin: '0 0 8px', letterSpacing: '-0.3px' }}>
              Administrator Sign In
            </h2>
            <p style={{ fontSize: 14, color: '#64748B', margin: 0 }}>
              Enter your MDRRMO credentials to access the portal.
            </p>
          </div>

          {/* Default credentials hint */}
          <div style={{
            background: '#EFF6FF',
            border: '1px solid #BFDBFE',
            borderRadius: 12,
            padding: '12px 16px',
            marginBottom: 24,
            display: 'flex', alignItems: 'flex-start', gap: 10,
          }}>
            <ShieldAlert size={16} color="#2563EB" style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#1D4ED8', marginBottom: 2 }}>Default Admin Account</div>
              <div style={{ fontSize: 12, color: '#3730A3' }}>
                <strong>Email:</strong> admin@mdrrmo.gov.ph<br />
                <strong>Password:</strong> MdrrmoAdmin2026!
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              background: '#FEF2F2', border: '1px solid #FECACA',
              borderRadius: 12, padding: '12px 16px',
              marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <AlertTriangle size={16} color="#DC2626" style={{ flexShrink: 0 }} />
              <span style={{ color: '#B91C1C', fontSize: 13, fontWeight: 500 }}>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Email */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{
                  position: 'absolute', left: 14, top: '50%',
                  transform: 'translateY(-50%)', color: '#9CA3AF',
                }} />
                <input
                  type="email"
                  autoComplete="username"
                  placeholder="admin@mdrrmo.gov.ph"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: 'white',
                    border: '1.5px solid #E2E8F0',
                    borderRadius: 12,
                    padding: '13px 14px 13px 40px',
                    color: '#0F172A', fontSize: 14,
                    outline: 'none',
                    fontFamily: 'inherit',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#2563EB';
                    e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#E2E8F0';
                    e.target.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)';
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{
                  position: 'absolute', left: 14, top: '50%',
                  transform: 'translateY(-50%)', color: '#9CA3AF',
                }} />
                <input
                  type={showPass ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: 'white',
                    border: '1.5px solid #E2E8F0',
                    borderRadius: 12,
                    padding: '13px 44px 13px 40px',
                    color: '#0F172A', fontSize: 14,
                    outline: 'none',
                    fontFamily: 'inherit',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#2563EB';
                    e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#E2E8F0';
                    e.target.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#9CA3AF', padding: 4,
                  }}
                >
                  {showPass ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: 4,
                background: loading ? '#94A3B8' : 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                color: 'white', border: 'none', borderRadius: 12,
                padding: '15px', fontSize: 15, fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                boxShadow: loading ? 'none' : '0 4px 16px rgba(37,99,235,0.35)',
                transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              }}
            >
              {loading ? (
                <>
                  <span style={{
                    width: 16, height: 16,
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: 'white', borderRadius: '50%',
                    display: 'inline-block',
                    animation: 'spin 0.8s linear infinite',
                  }} />
                  Signing in...
                </>
              ) : (
                <>
                  <ShieldAlert size={18} />
                  Sign In to Admin Portal
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <p style={{
            color: '#94A3B8', fontSize: 12,
            textAlign: 'center', marginTop: 32,
            lineHeight: 1.6,
          }}>
            SendResqPls · MDRRMO Disaster Incident Reporting System<br />
            <span style={{ color: '#CBD5E1' }}>Balayan, Batangas · © 2026</span>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 900px) {
          .admin-login-left { display: none !important; }
        }
      `}</style>
    </div>
  );
}
