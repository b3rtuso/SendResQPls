import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Phone, Mail, Lock, EyeOff, Eye, CheckCircle } from 'lucide-react';
import { register as apiRegister, sendVerificationCode, verifyCode } from '../../api/client';
import Toast, { type ToastType } from '../../components/Toast';

export default function MobileSignup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [codeSent, setCodeSent] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [verified, setVerified] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [toast, setToast] = useState<{ show: boolean; message: string; detail?: string; type: ToastType }>({ show: false, message: '', type: 'info' });

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const update = (key: string, val: string) => setForm({ ...form, [key]: val });

  const handleSendCode = async () => {
    if (!form.email || !form.email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    setSendingCode(true);
    setError('');
    try {
      await sendVerificationCode(form.email);
      setCodeSent(true);
      setCooldown(600);
      setToast({ show: true, message: 'Code sent! 📩', detail: `The code might be in your Spam folder. Sent to ${form.email}`, type: 'success' });
    } catch (err: any) {
      console.error('[SendCode] Error:', err.response?.data || err.message);
      const msg = err.response?.data?.error || err.response?.data?.details || err.message || 'Verification code failed to send';
      setError(msg);
    } finally {
      setSendingCode(false);
    }
  };

  const handleVerifyCode = async () => {
    if (codeInput.length !== 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }
    setVerifying(true);
    setError('');
    try {
      await verifyCode(form.email, codeInput);
      setVerified(true);
      setToast({ show: true, message: 'Verified! ✅', detail: 'You can now complete your registration.', type: 'success' });
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Incorrect code. Please try again.';
      setError(msg);
    } finally {
      setVerifying(false);
    }
  };

  const handleSignup = async () => {
    if (!verified) {
      setError('Please verify your email address first.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await apiRegister({ name: form.name, email: form.email, password: form.password, phoneNumber: form.phone });
      localStorage.setItem('userName', form.name);
      localStorage.setItem('userEmail', form.email);
      localStorage.setItem('userPhone', form.phone);
      setToast({ show: true, message: 'Account created! 🎉', detail: 'Redirecting to login...', type: 'success' });
      setTimeout(() => navigate('/mobile/login'), 1500);
    } catch {
      setError('Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mobile-shell mobile-auth" style={{ background: '#F1F5F9' }}>
      <style>{`
        .ms-signup-header {
          background: linear-gradient(160deg, #0F1F38 0%, #1D4ED8 60%, #2563EB 100%);
          padding: 56px 28px 44px;
          position: relative;
          overflow: hidden;
          border-radius: 0 0 32px 32px;
        }
        .ms-signup-header::after {
          content: '';
          position: absolute;
          top: -40px; right: -40px;
          width: 160px; height: 160px;
          background: rgba(255,255,255,0.05);
          border-radius: 50%;
        }
        .ms-signup-header::before {
          content: '';
          position: absolute;
          bottom: 20px; left: -30px;
          width: 100px; height: 100px;
          background: rgba(255,255,255,0.04);
          border-radius: 50%;
        }
        .ms-form-card {
          margin: 16px 20px 30px;
          background: #fff;
          border-radius: 22px;
          padding: 28px 24px;
          box-shadow: 0 8px 40px rgba(30,58,95,0.12), 0 2px 8px rgba(0,0,0,0.06);
          position: relative; z-index: 2;
        }
      `}</style>

      {/* Branded header */}
      <div className="ms-signup-header">
        <div style={{ position: 'relative', zIndex: 1 }}>
          <img
            src="/logo.jpg" alt="SRQ"
            style={{ width: 56, height: 56, borderRadius: 16, objectFit: 'cover', marginBottom: 16, border: '2px solid rgba(255,255,255,0.2)', boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}
          />
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6, fontWeight: 600 }}>
            MDRRMO Balayan, Batangas
          </div>
          <h1 style={{ color: 'white', fontSize: 26, fontWeight: 900, letterSpacing: '-0.5px', lineHeight: 1.15, margin: 0 }}>
            Create an<br />
            <span style={{ color: '#93C5FD' }}>Account</span>
          </h1>
        </div>
      </div>

      {/* Floating form card */}
      <div className="ms-form-card">
        <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 20px', lineHeight: 1.55 }}>
          Register now to report emergencies immediately.
        </p>

        {toast.show && (
          <Toast type={toast.type} message={toast.message} detail={toast.detail} onClose={() => setToast({ ...toast, show: false })} />
        )}

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 10, padding: '10px 12px', marginBottom: 16 }}>
            <span style={{ fontSize: 13, color: '#B91C1C', fontWeight: 600 }}>{error}</span>
          </div>
        )}

        <form autoComplete="on" onSubmit={(e) => e.preventDefault()} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="input-group">
            <label>Full Name</label>
            <div className="input-wrapper">
              <User size={18} className="input-icon" />
              <input autoComplete="name" placeholder="Juan Dela Cruz" value={form.name} onChange={(e) => update('name', e.target.value)} />
            </div>
          </div>

          <div className="input-group">
            <label>Phone Number</label>
            <div className="input-wrapper">
              <Phone size={18} className="input-icon" />
              <input type="tel" autoComplete="tel" placeholder="+63 900 000 0000" value={form.phone} onChange={(e) => update('phone', e.target.value.replace(/[^0-9+ ]/g, ''))} />
            </div>
          </div>

          {/* Email + Send Code */}
          <div className="input-group">
            <label>Email Address</label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'stretch', flexWrap: 'nowrap' }}>
              <div className="input-wrapper" style={{ flex: 1, minWidth: 0 }}>
                <Mail size={18} className="input-icon" style={{ flexShrink: 0 }} />
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="juan@example.com"
                  value={form.email}
                  onChange={(e) => {
                    update('email', e.target.value);
                    if (verified) { setVerified(false); setCodeSent(false); setCodeInput(''); }
                  }}
                  disabled={verified}
                  style={verified ? { color: '#22C55E', fontWeight: 600 } : undefined}
                />
              </div>
              <button
                type="button"
                onClick={handleSendCode}
                disabled={sendingCode || cooldown > 0 || verified || !form.email}
                style={{
                  flexShrink: 0,
                  width: 90,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                  padding: '0 10px', borderRadius: 12,
                  fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap',
                  background: verified ? '#22C55E' : '#DC2626',
                  color: 'white', border: 'none', cursor: verified ? 'default' : 'pointer',
                  opacity: (sendingCode || (cooldown > 0 && !verified)) ? 0.6 : 1,
                  fontFamily: 'var(--font)', transition: 'all 0.2s ease',
                  minHeight: 50,
                }}
              >
                {verified ? (
                  <><CheckCircle size={14} /> ✓</>
                ) : sendingCode ? (
                  '...'
                ) : cooldown > 0 ? (
                  `${Math.floor(cooldown / 60)}:${String(cooldown % 60).padStart(2, '0')}`
                ) : codeSent ? (
                  'Resend'
                ) : (
                  'Send Code'
                )}
              </button>
            </div>
          </div>

          {/* Verification Code Input */}
          {codeSent && !verified && (
            <div className="input-group" style={{ animation: 'fadeIn 0.3s ease' }}>
              <label>Verification Code</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'stretch', flexWrap: 'nowrap' }}>
                <div className="input-wrapper" style={{ flex: 1, minWidth: 0 }}>
                  <Lock size={18} className="input-icon" />
                  <input
                    type="text"
                    autoComplete="one-time-code"
                    placeholder="Enter the code"
                    value={codeInput}
                    onChange={(e) => setCodeInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6}
                    style={{ letterSpacing: 2, fontWeight: 700, fontSize: 18, paddingLeft: 46 }}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleVerifyCode}
                  disabled={verifying || codeInput.length !== 6}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    padding: '0 16px', borderRadius: 12,
                    fontSize: 13, fontWeight: 700,
                    background: '#3B82F6', color: 'white',
                    border: 'none', cursor: 'pointer',
                    opacity: (verifying || codeInput.length !== 6) ? 0.5 : 1,
                    fontFamily: 'var(--font)', minHeight: 50,
                  }}
                >
                  {verifying ? '...' : 'Verify'}
                </button>
              </div>
            </div>
          )}

          <div className="input-group">
            <label>Password</label>
            <div className="input-wrapper">
              <Lock size={18} className="input-icon" />
              <input
                type={showPass ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => update('password', e.target.value)}
              />
              <button type="button" className="toggle-pass" onClick={() => setShowPass(!showPass)}>
                {showPass ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
            </div>
          </div>

          <button
            type="button"
            className="auth-btn signup"
            onClick={handleSignup}
            disabled={loading || !verified}
            style={{ marginTop: 8, opacity: !verified ? 0.5 : 1 }}
          >
            {loading ? 'Creating...' : 'Create Account'}
          </button>
        </form>

        <p className="auth-footer" style={{ marginTop: 24 }}>
          Already have an account?{' '}
          <a href="#" onClick={(e) => { e.preventDefault(); navigate('/mobile/login'); }}>Log In</a>
        </p>
      </div>
    </div>
  );
}
