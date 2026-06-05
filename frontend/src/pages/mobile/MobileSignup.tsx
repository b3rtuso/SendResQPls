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
      setError('Lagay muna ng valid email.');
      return;
    }
    setSendingCode(true);
    setError('');
    try {
      await sendVerificationCode(form.email);
      setCodeSent(true);
      setCooldown(600);
      setToast({ show: true, message: 'Code sent! 📩', detail: `Check ang inbox mo sa ${form.email}`, type: 'success' });
    } catch (err: any) {
      console.error('[SendCode] Error:', err.response?.data || err.message);
      const msg = err.response?.data?.error || err.response?.data?.details || err.message || 'Hindi na-send ang code';
      setError(msg);
    } finally {
      setSendingCode(false);
    }
  };

  const handleVerifyCode = async () => {
    if (codeInput.length !== 6) {
      setError('I-enter ang 6-digit code.');
      return;
    }
    setVerifying(true);
    setError('');
    try {
      await verifyCode(form.email, codeInput);
      setVerified(true);
      setToast({ show: true, message: 'Verified na! ✅', detail: 'Pwede na mag-complete ng registration.', type: 'success' });
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Mali ang code. Try mo ulit.';
      setError(msg);
    } finally {
      setVerifying(false);
    }
  };

  const handleSignup = async () => {
    if (!verified) {
      setError('I-verify muna ang email mo.');
      return;
    }
    if (form.password.length < 6) {
      setError('Dapat 6 characters man lang ang password.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await apiRegister({ name: form.name, email: form.email, password: form.password, phoneNumber: form.phone });
      localStorage.setItem('userName', form.name);
      localStorage.setItem('userEmail', form.email);
      localStorage.setItem('userPhone', form.phone);
      setToast({ show: true, message: 'Account created! 🎉', detail: 'Papunta na sa login...', type: 'success' });
      setTimeout(() => navigate('/mobile/login'), 1500);
    } catch {
      setError('Hindi nagawa ang account. Try mo ulit.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mobile-shell">
      <div className="mobile-auth">
        <h1>Gawa tayo ng Account 🙌</h1>
        <p className="auth-subtitle">Mag-sign up para ma-report ang emergency safely.</p>

        {toast.show && (
          <Toast type={toast.type} message={toast.message} detail={toast.detail} onClose={() => setToast({ ...toast, show: false })} />
        )}

        {error && <p style={{ color: '#DC2626', fontSize: 13, marginBottom: 12, fontWeight: 600 }}>{error}</p>}

        <form autoComplete="on" onSubmit={(e) => e.preventDefault()} style={{ display: 'contents' }}>
          <div className="input-group">
            <label>Buong Pangalan</label>
            <div className="input-wrapper">
              <User size={18} className="input-icon" />
              <input autoComplete="name" placeholder="Juan Dela Cruz" value={form.name} onChange={(e) => update('name', e.target.value)} />
            </div>
          </div>

          <div className="input-group">
            <label>Numero ng Telepono</label>
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
                  placeholder="juan@halimbawa.com"
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
              <div style={{ display: 'flex', gap: 8 }}>
                <div className="input-wrapper" style={{ flex: 1 }}>
                  <Lock size={18} className="input-icon" />
                  <input
                    type="text"
                    autoComplete="one-time-code"
                    placeholder="I-enter ang 6-digit code"
                    value={codeInput}
                    onChange={(e) => setCodeInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6}
                    style={{ letterSpacing: 6, fontWeight: 700, fontSize: 18 }}
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
                    fontFamily: 'var(--font)', minHeight: 46,
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
            {loading ? 'Ginagawa...' : 'Create Account'} <CheckCircle size={18} />
          </button>
        </form>

        <p className="auth-footer">
          May account ka na?{' '}
          <a href="#" onClick={(e) => { e.preventDefault(); navigate('/mobile/login'); }}>Mag-login</a>
        </p>
      </div>
    </div>
  );
}
