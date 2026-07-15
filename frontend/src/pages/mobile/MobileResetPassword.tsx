import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, EyeOff, Eye, CheckCircle } from 'lucide-react';
import { resetPassword } from '../../api/client';

export default function MobileResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) setError('Invalid or expired reset link. Please request a new one.');
  }, [token]);

  const handleReset = async () => {
    if (newPass.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (newPass !== confirmPass) { setError('Passwords do not match. Please try again.'); return; }
    setLoading(true); setError('');
    try {
      await resetPassword(token, newPass);
      setDone(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Reset failed. The link might have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mobile-shell">
      <div className="mobile-auth">
        <img src="/logo.jpg" alt="SRQ Logo" style={{ width: 80, height: 80, borderRadius: 20, boxShadow: '0 8px 32px rgba(0,0,0,0.15)', objectFit: 'cover', marginBottom: 8 }} />
        <h1>Reset Password</h1>
        <p className="auth-subtitle">Enter your new password below.</p>

        {done ? (
          <div style={{ background: '#F0FDF4', border: '1.5px solid #22C55E', borderRadius: 12, padding: '24px 16px', textAlign: 'center', marginTop: 16 }}>
            <CheckCircle size={40} color="#22C55E" style={{ marginBottom: 12 }} />
            <div style={{ fontWeight: 700, color: '#15803D', marginBottom: 4 }}>Password Updated!</div>
            <div style={{ fontSize: 13, color: '#166534', marginBottom: 16 }}>You can now log in using your new password.</div>
            <button onClick={() => navigate('/mobile/login')} style={{
              padding: '10px 24px', background: '#22C55E', color: 'white',
              border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer',
            }}>
              Go to Login
            </button>
          </div>
        ) : (
          <>
            {error && <p style={{ color: '#DC2626', fontSize: 13, marginBottom: 12, fontWeight: 600 }}>{error}</p>}
            <div className="input-group">
              <label>New Password</label>
              <div className="input-wrapper">
                <Lock size={18} className="input-icon" />
                <input type={showPass ? 'text' : 'password'} placeholder="At least 6 characters" value={newPass} onChange={(e) => setNewPass(e.target.value)} />
                <button className="toggle-pass" onClick={() => setShowPass(!showPass)}>{showPass ? <Eye size={18} /> : <EyeOff size={18} />}</button>
              </div>
            </div>
            <div className="input-group">
              <label>Confirm Password</label>
              <div className="input-wrapper">
                <Lock size={18} className="input-icon" />
                <input type={showPass ? 'text' : 'password'} placeholder="Repeat new password" value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} />
              </div>
            </div>
            <button className="auth-btn login" onClick={handleReset} disabled={loading || !token}>
              {loading ? 'Updating...' : 'Set New Password'} <CheckCircle size={18} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
