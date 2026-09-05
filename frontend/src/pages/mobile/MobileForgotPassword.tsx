import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, AlertTriangle, CheckCircle2, Send } from 'lucide-react';
import { forgotPassword } from '../../api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function MobileForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [focusField, setFocusField] = useState(false);

  const friendlyForgotError = (err: any): string => {
    const raw = err.response?.data?.error || err.message || '';
    const status = err.response?.status;
    const code = err.code;

    if (status === 404 || raw.toLowerCase().includes('not registered')) {
      return 'This email is not registered in our system. Please check your email or create a new account.';
    }
    if (code === 'ECONNABORTED' || raw.toLowerCase().includes('timeout')) {
      return 'Taking longer than expected — the server may be warming up. Please wait a moment and try again.';
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
    return raw || 'Could not send the reset link. Please try again.';
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    const cleanEmail = email.trim();

    if (!cleanEmail) {
      setError('Please enter your email address.');
      return;
    }
    if (!/^[^@]+@[^@]+\.[^@]+$/.test(cleanEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      await forgotPassword(cleanEmail);
      setSent(true);
    } catch (err: any) {
      setError(friendlyForgotError(err));
    } finally {
      setLoading(false);
    }
  };

  const wrapStyle = (hasError?: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    position: 'relative',
    background: hasError ? '#FFF8F8' : focusField ? '#FFFFFF' : '#F8FAFC',
    border: `1.5px solid ${hasError ? '#EF4444' : focusField ? '#2563EB' : '#E2E8F0'}`,
    borderRadius: 14,
    transition: 'all 0.18s',
    boxShadow: hasError
      ? '0 0 0 3px rgba(239,68,68,0.09)'
      : focusField ? '0 0 0 3px rgba(37,99,235,0.1)' : 'none',
  });

  return (
    <div className="mobile-shell mobile-auth-transition" style={{ background: '#F1F5F9' }}>
      <style>{`
        .mf-header {
          background: linear-gradient(160deg, #0F1F38 0%, #1D4ED8 60%, #2563EB 100%);
          padding: 48px 24px 38px;
          position: relative;
          overflow: hidden;
          border-radius: 0 0 32px 32px;
          color: white;
        }
        .mf-header::after {
          content: '';
          position: absolute;
          top: -40px; right: -40px;
          width: 160px; height: 160px;
          background: rgba(255,255,255,0.05);
          border-radius: 50%;
        }
        .mf-header::before {
          content: '';
          position: absolute;
          bottom: 10px; left: -30px;
          width: 100px; height: 100px;
          background: rgba(255,255,255,0.04);
          border-radius: 50%;
        }
        .mf-form-card {
          margin: 16px 20px 30px;
          background: #ffffff;
          border-radius: 22px;
          padding: 28px 22px;
          box-shadow: 0 8px 40px rgba(30,58,95,0.12), 0 2px 8px rgba(0,0,0,0.06);
          position: relative;
          z-index: 2;
          box-sizing: border-box;
          animation: authCardEntrance 0.35s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @media (min-width: 600px) {
          .mf-form-card {
            max-width: 480px;
            margin: 20px auto 40px;
            padding: 34px 28px;
          }
        }
        .mf-input-error::placeholder {
          color: #EF4444 !important;
          opacity: 0.85 !important;
        }
        .mf-auth-btn {
          width: 100%;
          padding: 16px;
          background: linear-gradient(135deg, #2563EB, #1D4ED8);
          color: white;
          border: none;
          border-radius: 14px;
          font-size: 15px;
          font-weight: 700;
          font-family: inherit;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          box-shadow: 0 4px 16px rgba(37,99,235,0.38);
          transition: transform 0.18s, box-shadow 0.18s;
          margin-top: 10px;
          letter-spacing: 0.01em;
        }
        .mf-auth-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 22px rgba(37,99,235,0.46);
        }
        .mf-auth-btn:active:not(:disabled) {
          transform: translateY(0) scale(0.98);
        }
        .mf-auth-btn:disabled {
          background: #94A3B8;
          box-shadow: none;
          cursor: not-allowed;
        }
        .mf-spin {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: mfspin .75s linear infinite;
        }
        @keyframes mfspin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Branded Header */}
      <div className="mf-header">
        <div style={{ position: 'relative', zIndex: 1 }}>
          <button
            type="button"
            onClick={() => navigate('/mobile/login')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(255, 255, 255, 0.15)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              borderRadius: 20,
              padding: '6px 14px',
              color: 'white',
              fontSize: 12.5,
              fontWeight: 700,
              cursor: 'pointer',
              marginBottom: 16,
              fontFamily: 'inherit',
              backdropFilter: 'blur(8px)',
            }}
          >
            <ArrowLeft size={14} /> Back to Login
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <img
              src="/logo.jpg"
              alt="SRQ Logo"
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                objectFit: 'cover',
                border: '2px solid rgba(255,255,255,0.2)',
                boxShadow: '0 6px 20px rgba(0,0,0,0.25)',
              }}
            />
            <div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
                MDRRMO Balayan
              </div>
              <div style={{ fontSize: 13, color: '#93C5FD', fontWeight: 700 }}>
                Account Recovery
              </div>
            </div>
          </div>

          <h1 style={{ color: 'white', fontSize: 24, fontWeight: 900, letterSpacing: '-0.4px', margin: 0 }}>
            Forgot Password?
          </h1>
        </div>
      </div>

      {/* Floating Form Card */}
      <div className="mf-form-card">
        {sent ? (
          <div style={{ textAlign: 'center', padding: '12px 6px' }}>
            <div style={{
              width: 58,
              height: 58,
              borderRadius: '50%',
              background: '#DCFCE7',
              color: '#16A34A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              boxShadow: '0 4px 16px rgba(22, 163, 74, 0.2)',
            }}>
              <CheckCircle2 size={32} />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', margin: '0 0 8px' }}>
              Reset Link Sent!
            </h2>
            <p style={{ fontSize: 13.5, color: '#64748B', lineHeight: 1.6, margin: '0 0 20px' }}>
              We have sent a secure password reset link to <strong>{email}</strong>. Please check your inbox or spam folder. The link will expire in 30 minutes.
            </p>
            <button
              onClick={() => navigate('/mobile/login')}
              className="mf-auth-btn"
              style={{ background: 'linear-gradient(135deg, #10B981, #059669)', boxShadow: '0 4px 16px rgba(16,185,129,0.35)' }}
            >
              Return to Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <p style={{ fontSize: 13.5, color: '#64748B', margin: '0 0 20px', lineHeight: 1.55 }}>
              Enter the email address registered to your account, and we'll send you a link to reset your password.
            </p>

            {error && (
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
                background: '#FEF2F2',
                border: '1.5px solid #FCA5A5',
                borderRadius: 12,
                padding: '12px 14px',
                marginBottom: 16,
              }}>
                <AlertTriangle size={16} color="#EF4444" style={{ flexShrink: 0, marginTop: 2 }} />
                <span style={{ fontSize: 13, color: '#B91C1C', fontWeight: 600, lineHeight: 1.45 }}>
                  {error}
                </span>
              </div>
            )}

            <div style={{ marginBottom: 18 }}>
              <Label htmlFor="forgot-email" style={{
                display: 'block',
                fontSize: 12.5,
                fontWeight: 700,
                color: error ? '#DC2626' : '#374151',
                marginBottom: 6,
                letterSpacing: '0.01em',
              }}>
                Registered Email Address
              </Label>
              <div style={wrapStyle(!!error)}>
                <span style={{
                  position: 'absolute',
                  left: 14,
                  color: error ? '#EF4444' : focusField ? '#2563EB' : '#94A3B8',
                  display: 'flex',
                  transition: 'color 0.18s',
                }}>
                  <Mail size={18} />
                </span>
                <Input
                  id="forgot-email"
                  type="email"
                  className={error ? 'mf-input-error' : ''}
                  placeholder="juan@example.com"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError('');
                  }}
                  onFocus={() => setFocusField(true)}
                  onBlur={() => setFocusField(false)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                  style={{
                    width: '100%',
                    border: 'none',
                    background: 'transparent',
                    outline: 'none',
                    fontSize: 15,
                    color: '#0F172A',
                    padding: '16px 16px 16px 46px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <Button type="submit" className="mf-auth-btn" disabled={loading} style={{ minHeight: 48 }}>
              {loading ? (
                <>
                  <span className="mf-spin" /> Sending Link…
                </>
              ) : (
                <>
                  <Send size={16} /> Send Reset Link
                </>
              )}
            </Button>

            <div style={{ textAlign: 'center', marginTop: 22 }}>
              <Button
                type="button"
                variant="ghost"
                onClick={() => navigate('/mobile/login')}
                style={{
                  color: '#2563EB',
                  fontSize: 13.5,
                  fontWeight: 700,
                }}
              >
                Remembered your password? Log in
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
