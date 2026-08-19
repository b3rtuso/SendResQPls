import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';
import { forgotPassword } from '../../api/client';

export default function MobileForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const friendlyForgotError = (err: any): string => {
    const raw = err.response?.data?.error || err.message || '';
    const status = err.response?.status;
    const code = err.code;

    if (code === 'ECONNABORTED' || raw.toLowerCase().includes('timeout')) {
      return 'Taking longer than expected — the server may be warming up. Please wait 30 seconds and try again.';
    }
    if (!err.response && (code === 'ERR_NETWORK' || raw.toLowerCase().includes('network'))) {
      return 'No internet connection. Please check your Wi-Fi or mobile data and try again.';
    }
    if (status === 429) {
      return 'Too many requests. Please wait a minute before trying again.';
    }
    if (status && status >= 500) {
      return 'Our server encountered an issue. Please try again shortly.';
    }
    return 'Could not send the reset link. Please try again.';
  };

  const handleSubmit = async () => {
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err: any) {
      setError(friendlyForgotError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mobile-shell">
      <div className="mobile-auth">
        <button onClick={() => navigate('/mobile/login')} style={{
          display: 'flex', alignItems: 'center', gap: 6, background: 'none',
          border: 'none', color: '#2563EB', fontWeight: 600, cursor: 'pointer',
          fontSize: 14, marginBottom: 24, padding: 0,
        }}>
          <ArrowLeft size={16} /> Back to Login
        </button>

        <img src="/logo.jpg" alt="SRQ Logo" style={{ width: 80, height: 80, borderRadius: 20, boxShadow: '0 8px 32px rgba(0,0,0,0.15)', objectFit: 'cover', marginBottom: 8, display: 'block', marginLeft: 'auto', marginRight: 'auto' }} />
        <h1>Forgot Password?</h1>
        <p className="auth-subtitle">Enter the email address registered to your account to receive a reset link.</p>

        {sent ? (
          <div style={{ background: '#F0FDF4', border: '1.5px solid #22C55E', borderRadius: 12, padding: '20px 16px', textAlign: 'center', marginTop: 16 }}>
            <div style={{ fontWeight: 700, color: '#15803D', marginBottom: 4 }}>Reset link sent!</div>
            <div style={{ fontSize: 13, color: '#166534' }}>
              Please check your inbox or spam folder for <strong>{email}</strong>. The link will expire in 30 minutes.
            </div>
            <button onClick={() => navigate('/mobile/login')} style={{
              marginTop: 16, padding: '10px 24px', background: '#22C55E', color: 'white',
              border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer',
            }}>
              Back to Login
            </button>
          </div>
        ) : (
          <>
            {error && <p style={{ color: '#DC2626', fontSize: 13, marginBottom: 12, fontWeight: 600 }}>{error}</p>}
            <div className="input-group">
              <label>Email Address</label>
              <div className="input-wrapper">
                <Mail size={18} className="input-icon" />
                <input
                  type="email"
                  placeholder="juan@halimbawa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                />
              </div>
            </div>
            <button className="auth-btn login" onClick={handleSubmit} disabled={loading}>
              {loading ? 'Sending… (up to 30s)' : 'Send Reset Link'}
            </button>
            {loading && (
              <p style={{ fontSize: 12, color: '#64748B', textAlign: 'center', marginTop: 10, lineHeight: 1.5 }}>
                This may take a moment if the server is starting up. Please don't close this screen.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
