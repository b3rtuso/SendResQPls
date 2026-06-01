import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, Send } from 'lucide-react';
import { forgotPassword } from '../../api/client';

export default function MobileForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [sandboxUrl, setSandboxUrl] = useState('');

  const handleSubmit = async () => {
    if (!email || !email.includes('@')) { setError('Please enter a valid email address.'); return; }
    setLoading(true); setError('');
    try {
      const res = await forgotPassword(email);
      setSent(true);
      if (res.data && res.data.sandbox && res.data.resetUrl) {
        setSandboxUrl(res.data.resetUrl);
      }
    } catch {
      setError('Something went wrong. Please try again.');
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

        <img src="/logo.jpg" alt="SRQ Logo" style={{ width: 80, height: 80, borderRadius: 20, boxShadow: '0 8px 32px rgba(0,0,0,0.15)', objectFit: 'cover', marginBottom: 8 }} />
        <h1>Forgot Password</h1>
        <p className="auth-subtitle">Enter your registered email and we'll send you a reset link.</p>

        {sent ? (
          <div style={{ background: '#F0FDF4', border: '1.5px solid #22C55E', borderRadius: 12, padding: '20px 16px', textAlign: 'center', marginTop: 16 }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📧</div>
            <div style={{ fontWeight: 700, color: '#15803D', marginBottom: 4 }}>Reset link sent!</div>
            <div style={{ fontSize: 13, color: '#166534' }}>Check your inbox at <strong>{email}</strong>. The link expires in 30 minutes.</div>
            {sandboxUrl && (
              <div style={{ marginTop: 16, padding: 12, background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8, textAlign: 'left' }}>
                <p style={{ fontSize: 12, color: '#1E40AF', margin: '0 0 8px 0', fontWeight: 600 }}>🛠️ Resend Sandbox Mode:</p>
                <a href={sandboxUrl} style={{ fontSize: 12, color: '#2563EB', wordBreak: 'break-all', fontWeight: 700 }}>Click here to reset your password directly</a>
              </div>
            )}
            <button onClick={() => navigate('/mobile/login')} style={{
              marginTop: 16, padding: '10px 24px', background: '#22C55E', color: 'white',
              border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer',
            }}>Back to Login</button>
          </div>
        ) : (
          <>
            {error && <p style={{ color: '#DC2626', fontSize: 13, marginBottom: 12, fontWeight: 600 }}>{error}</p>}
            <div className="input-group">
              <label>Email Address</label>
              <div className="input-wrapper">
                <Mail size={18} className="input-icon" />
                <input type="email" placeholder="juan@example.com" value={email} onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit()} />
              </div>
            </div>
            <button className="auth-btn login" onClick={handleSubmit} disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Link'} <Send size={18} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
