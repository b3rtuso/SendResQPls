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

  const handleSubmit = async () => {
    if (!email || !email.includes('@')) {
      setError('Enter ng valid email address mo.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await forgotPassword(email);
      setSent(true);
    } catch {
      setError('May nangyaring error. Try mo ulit.');
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
          <ArrowLeft size={16} /> Back sa Login
        </button>

        <img src="/logo.jpg" alt="SRQ Logo" style={{ width: 80, height: 80, borderRadius: 20, boxShadow: '0 8px 32px rgba(0,0,0,0.15)', objectFit: 'cover', marginBottom: 8 }} />
        <h1>Forgot Password? 🔑</h1>
        <p className="auth-subtitle">I-enter ang email mo, mag-se-send kami ng reset link.</p>

        {sent ? (
          <div style={{ background: '#F0FDF4', border: '1.5px solid #22C55E', borderRadius: 12, padding: '20px 16px', textAlign: 'center', marginTop: 16 }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📧</div>
            <div style={{ fontWeight: 700, color: '#15803D', marginBottom: 4 }}>Sent na ang reset link! 📧</div>
            <div style={{ fontSize: 13, color: '#166534' }}>
              Paki-check ang inbox mo sa <strong>{email}</strong>. Mag-e-expire ang link pagkalipas ng 30 minuto.
            </div>
            <button onClick={() => navigate('/mobile/login')} style={{
              marginTop: 16, padding: '10px 24px', background: '#22C55E', color: 'white',
              border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer',
            }}>
              Balik sa Login
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
              {loading ? 'Sending...' : 'Send Reset Link'} <Send size={18} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
