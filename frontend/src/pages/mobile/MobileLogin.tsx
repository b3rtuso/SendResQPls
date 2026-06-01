import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, EyeOff, Eye, ArrowRight } from 'lucide-react';
import { login as apiLogin } from '../../api/client';

export default function MobileLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in both email and password.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await apiLogin(email, password);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('userId', res.data.user?.id || '');
      localStorage.setItem('userName', res.data.user?.name || 'User');
      localStorage.setItem('userEmail', res.data.user?.email || '');
      localStorage.setItem('userPhone', res.data.user?.phoneNumber || '');
      localStorage.setItem('userRole', res.data.user?.role || 'CITIZEN');
      navigate('/mobile');
    } catch {
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mobile-shell">
      <div className="mobile-auth">
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <img src="/logo.jpg" alt="SRQ Logo" style={{ width: 90, height: 90, borderRadius: 22, boxShadow: '0 8px 32px rgba(0,0,0,0.35)', objectFit: 'cover', margin: '0 auto' }} />
          <h1>Welcome Back</h1>
          <p className="auth-subtitle">Log in to SendResqPls to report and track emergencies.</p>
        </div>

        {error && <p style={{ color: '#DC2626', fontSize: 13, marginBottom: 12, fontWeight: 600, textAlign: 'center' }}>{error}</p>}

        <div className="input-group">
          <label>Email Address</label>
          <div className="input-wrapper">
            <Mail size={18} className="input-icon" />
            <input type="email" placeholder="juan@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
        </div>

        <div className="input-group">
          <label>Password</label>
          <div className="input-wrapper">
            <Lock size={18} className="input-icon" />
            <input type={showPass ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button className="toggle-pass" onClick={() => setShowPass(!showPass)}>{showPass ? <Eye size={18} /> : <EyeOff size={18} />}</button>
          </div>
        </div>

        <a href="#" className="forgot-link" onClick={(e) => { e.preventDefault(); navigate('/mobile/forgot-password'); }}>Forgot password?</a>

        <button className="auth-btn login" onClick={handleLogin} disabled={loading}>
          {loading ? 'Logging in...' : 'Log In'} <ArrowRight size={18} />
        </button>

        <p className="auth-footer">
          Don't have an account? <a href="#" onClick={(e) => { e.preventDefault(); navigate('/mobile/signup'); }}>Sign up</a>
        </p>
      </div>
    </div>
  );
}
