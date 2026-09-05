import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, EyeOff, Eye, CheckCircle2, ArrowLeft, AlertTriangle } from 'lucide-react';
import { resetPassword } from '../../api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
  const [focusField, setFocusField] = useState<'new' | 'confirm' | null>(null);

  useEffect(() => {
    if (!token) setError('Invalid or expired reset link. Please request a new one.');
  }, [token]);

  const handleReset = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newPass) { setError('Please enter a new password.'); return; }
    if (newPass.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (newPass !== confirmPass) { setError('Passwords do not match. Please try again.'); return; }

    setLoading(true);
    setError('');
    try {
      await resetPassword(token, newPass);
      setDone(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Reset failed. The link might have expired.');
    } finally {
      setLoading(false);
    }
  };

  const wrapStyle = (field: 'new' | 'confirm', hasError?: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    position: 'relative',
    background: hasError ? '#FFF8F8' : focusField === field ? '#FFFFFF' : '#F8FAFC',
    border: `1.5px solid ${hasError ? '#EF4444' : focusField === field ? '#2563EB' : '#E2E8F0'}`,
    borderRadius: 14,
    transition: 'all 0.18s',
    boxShadow: hasError
      ? '0 0 0 3px rgba(239,68,68,0.09)'
      : focusField === field ? '0 0 0 3px rgba(37,99,235,0.1)' : 'none',
  });

  return (
    <div className="mobile-shell mobile-auth-transition" style={{ background: '#F1F5F9' }}>
      <style>{`
        .mr-header {
          background: linear-gradient(160deg, #0F1F38 0%, #1D4ED8 60%, #2563EB 100%);
          padding: 48px 24px 38px;
          position: relative;
          overflow: hidden;
          border-radius: 0 0 32px 32px;
          color: white;
        }
        .mr-header::after {
          content: '';
          position: absolute;
          top: -40px; right: -40px;
          width: 160px; height: 160px;
          background: rgba(255,255,255,0.05);
          border-radius: 50%;
        }
        .mr-header::before {
          content: '';
          position: absolute;
          bottom: 10px; left: -30px;
          width: 100px; height: 100px;
          background: rgba(255,255,255,0.04);
          border-radius: 50%;
        }
        .mr-form-card {
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
          .mr-form-card {
            max-width: 480px;
            margin: 20px auto 40px;
            padding: 34px 28px;
          }
        }
        .mr-input-error::placeholder {
          color: #EF4444 !important;
          opacity: 0.85 !important;
        }
        .mr-auth-btn {
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
        .mr-auth-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 22px rgba(37,99,235,0.46);
        }
        .mr-auth-btn:active:not(:disabled) {
          transform: translateY(0) scale(0.98);
        }
        .mr-auth-btn:disabled {
          background: #94A3B8;
          box-shadow: none;
          cursor: not-allowed;
        }
        .mr-spin {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: mrspin .75s linear infinite;
        }
        @keyframes mrspin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Branded Header */}
      <div className="mr-header">
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
                Security Portal
              </div>
            </div>
          </div>

          <h1 style={{ color: 'white', fontSize: 24, fontWeight: 900, letterSpacing: '-0.4px', margin: 0 }}>
            Reset Password
          </h1>
        </div>
      </div>

      {/* Floating Form Card */}
      <div className="mr-form-card">
        {done ? (
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
              Password Updated!
            </h2>
            <p style={{ fontSize: 13.5, color: '#64748B', lineHeight: 1.6, margin: '0 0 20px' }}>
              Your password has been successfully updated. You can now log in using your new credentials.
            </p>
            <button
              onClick={() => navigate('/mobile/login')}
              className="mr-auth-btn"
              style={{ background: 'linear-gradient(135deg, #10B981, #059669)', boxShadow: '0 4px 16px rgba(16,185,129,0.35)' }}
            >
              Go to Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleReset} noValidate>
            <p style={{ fontSize: 13.5, color: '#64748B', margin: '0 0 20px', lineHeight: 1.55 }}>
              Choose a strong password with at least 6 characters for your SendResQPls account.
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

            {/* New Password */}
            <div style={{ marginBottom: 14 }}>
              <Label htmlFor="reset-new-password" style={{
                display: 'block',
                fontSize: 12.5,
                fontWeight: 700,
                color: error ? '#DC2626' : '#374151',
                marginBottom: 6,
                letterSpacing: '0.01em',
              }}>
                New Password
              </Label>
              <div style={wrapStyle('new', !!error)}>
                <span style={{
                  position: 'absolute',
                  left: 14,
                  color: error ? '#EF4444' : focusField === 'new' ? '#2563EB' : '#94A3B8',
                  display: 'flex',
                  transition: 'color 0.18s',
                }}>
                  <Lock size={17} />
                </span>
                <Input
                  id="reset-new-password"
                  type={showPass ? 'text' : 'password'}
                  className={error ? 'mr-input-error' : ''}
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                  value={newPass}
                  onChange={(e) => {
                    setNewPass(e.target.value);
                    if (error) setError('');
                  }}
                  onFocus={() => setFocusField('new')}
                  onBlur={() => setFocusField(null)}
                  onKeyDown={(e) => e.key === 'Enter' && handleReset()}
                  style={{
                    width: '100%',
                    border: 'none',
                    background: 'transparent',
                    outline: 'none',
                    fontSize: 15,
                    color: '#0F172A',
                    padding: '16px 52px 16px 46px',
                    boxSizing: 'border-box',
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowPass(!showPass)}
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                  style={{
                    position: 'absolute',
                    right: 4,
                    width: 44,
                    height: 44,
                    color: '#94A3B8',
                  }}
                >
                  {showPass ? <Eye size={18} /> : <EyeOff size={18} />}
                </Button>
              </div>
            </div>

            {/* Confirm Password */}
            <div style={{ marginBottom: 20 }}>
              <Label htmlFor="reset-confirm-password" style={{
                display: 'block',
                fontSize: 12.5,
                fontWeight: 700,
                color: error ? '#DC2626' : '#374151',
                marginBottom: 6,
                letterSpacing: '0.01em',
              }}>
                Confirm New Password
              </Label>
              <div style={wrapStyle('confirm', !!error)}>
                <span style={{
                  position: 'absolute',
                  left: 14,
                  color: error ? '#EF4444' : focusField === 'confirm' ? '#2563EB' : '#94A3B8',
                  display: 'flex',
                  transition: 'color 0.18s',
                }}>
                  <Lock size={17} />
                </span>
                <Input
                  id="reset-confirm-password"
                  type={showPass ? 'text' : 'password'}
                  className={error ? 'mr-input-error' : ''}
                  placeholder="Repeat new password"
                  autoComplete="new-password"
                  value={confirmPass}
                  onChange={(e) => {
                    setConfirmPass(e.target.value);
                    if (error) setError('');
                  }}
                  onFocus={() => setFocusField('confirm')}
                  onBlur={() => setFocusField(null)}
                  onKeyDown={(e) => e.key === 'Enter' && handleReset()}
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

            <Button type="submit" className="mr-auth-btn" disabled={loading || !token} style={{ minHeight: 48 }}>
              {loading ? (
                <>
                  <span className="mr-spin" /> Updating Password…
                </>
              ) : (
                'Save New Password'
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
