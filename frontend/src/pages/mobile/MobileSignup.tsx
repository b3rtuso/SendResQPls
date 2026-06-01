import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Phone, Mail, Lock, EyeOff, Eye, CheckCircle, Send } from 'lucide-react';
import { register as apiRegister, sendVerificationCode, verifyCode } from '../../api/client';
import Toast, { type ToastType } from '../../components/Toast';

export default function MobileSignup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Verification state
  const [codeSent, setCodeSent] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [verified, setVerified] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [toast, setToast] = useState<{ show: boolean; message: string; detail?: string; type: ToastType }>({ show: false, message: '', type: 'info' });

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const update = (key: string, val: string) => setForm({ ...form, [key]: val });

  const handleSendCode = async () => {
    if (!form.email || !form.email.includes('@')) {
      setError('Please enter a valid email address first.');
      return;
    }
    setSendingCode(true);
    setError('');
    try {
      await sendVerificationCode(form.email);
      setCodeSent(true);
      setCooldown(60);
      setToast({ show: true, message: 'Code sent!', detail: `Check your inbox at ${form.email}`, type: 'success' });
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to send code';
      setError(msg);
    } finally {
      setSendingCode(false);
    }
  };

  const handleVerifyCode = async () => {
    if (codeInput.length !== 6) {
      setError('Please enter the 6-digit code.');
      return;
    }
    setVerifying(true);
    setError('');
    try {
      await verifyCode(form.email, codeInput);
      setVerified(true);
      setToast({ show: true, message: 'Email verified!', detail: 'You can now complete registration.', type: 'success' });
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Invalid code';
      setError(msg);
    } finally {
      setVerifying(false);
    }
  };

  const handleSignup = async () => {
    if (!verified) {
      setError('Please verify your email first.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await apiRegister({ name: form.name, email: form.email, password: form.password, phoneNumber: form.phone });
      // Pre-fill localStorage so profile shows correct data on first login
      localStorage.setItem('userName', form.name);
      localStorage.setItem('userEmail', form.email);
      localStorage.setItem('userPhone', form.phone);
      setToast({ show: true, message: 'Account created!', detail: 'Redirecting to login...', type: 'success' });
      setTimeout(() => navigate('/mobile/login'), 1500);
    } catch {
      setError('Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mobile-shell">
      <div className="mobile-auth">
        <h1>Create Account</h1>
        <p className="auth-subtitle">Sign up to report emergencies securely.</p>

        {toast.show && (
          <Toast type={toast.type} message={toast.message} detail={toast.detail} onClose={() => setToast({ ...toast, show: false })} />
        )}

        {error && <p style={{ color: '#DC2626', fontSize: 13, marginBottom: 12, fontWeight: 600, textAlign: 'center' }}>{error}</p>}

        <div className="input-group">
          <label>Full Name</label>
          <div className="input-wrapper"><User size={18} className="input-icon" /><input placeholder="Juan Dela Cruz" value={form.name} onChange={(e) => update('name', e.target.value)} /></div>
        </div>
        <div className="input-group">
          <label>Mobile Number</label>
          <div className="input-wrapper"><Phone size={18} className="input-icon" /><input placeholder="+63 900 000 0000" value={form.phone} onChange={(e) => update('phone', e.target.value)} /></div>
        </div>

        {/* Email + Send Code */}
        <div className="input-group">
          <label>Email Address</label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'stretch', flexWrap: 'nowrap' }}>
            <div className="input-wrapper" style={{ flex: 1, minWidth: 0 }}>
              <Mail size={18} className="input-icon" style={{ flexShrink: 0 }} />
              <input
                type="email"
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
                `${cooldown}s`
              ) : codeSent ? (
                <><Send size={13} /> Resend</>
              ) : (
                <><Send size={13} /> Send</>
              )}
            </button>
          </div>
        </div>

        {/* Verification Code Input — shows after code is sent */}
        {codeSent && !verified && (
          <div className="input-group" style={{ animation: 'fadeIn 0.3s ease' }}>
            <label>Verification Code</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <div className="input-wrapper" style={{ flex: 1 }}>
                <Lock size={18} className="input-icon" />
                <input
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  style={{ letterSpacing: 6, fontWeight: 700, fontSize: 18 }}
                />
              </div>
              <button
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
            <input type={showPass ? 'text' : 'password'} placeholder="••••••••" value={form.password} onChange={(e) => update('password', e.target.value)} />
            <button className="toggle-pass" onClick={() => setShowPass(!showPass)}>{showPass ? <Eye size={18} /> : <EyeOff size={18} />}</button>
          </div>
        </div>

        <button
          className="auth-btn signup"
          onClick={handleSignup}
          disabled={loading || !verified}
          style={{ marginTop: 8, opacity: !verified ? 0.5 : 1 }}
        >
          {loading ? 'Creating...' : 'Create Account'} <CheckCircle size={18} />
        </button>

        <p className="auth-footer">
          Already have an account? <a href="#" onClick={(e) => { e.preventDefault(); navigate('/mobile/login'); }}>Log in</a>
        </p>
      </div>
    </div>
  );
}
