import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[SendResQPls ErrorBoundary] Uncaught runtime error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    const isMobile = window.location.pathname.startsWith('/mobile');
    window.location.href = isMobile ? '/mobile' : '/dashboard';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0F2942',
          color: 'white',
          padding: '24px',
          fontFamily: "'Geist', 'Inter', system-ui, sans-serif",
          textAlign: 'center',
        }}>
          <div style={{
            maxWidth: 440,
            width: '100%',
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: 24,
            padding: '36px 28px',
            boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
            backdropFilter: 'blur(16px)',
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: 20,
              background: 'rgba(239, 68, 68, 0.2)',
              border: '1.5px solid rgba(239, 68, 68, 0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px', color: '#EF4444',
            }}>
              <AlertTriangle size={32} />
            </div>

            <h1 style={{ fontSize: 22, fontWeight: 900, margin: '0 0 8px', letterSpacing: '-0.3px' }}>
              Something went wrong
            </h1>

            <p style={{ fontSize: 13.5, color: 'rgba(255, 255, 255, 0.7)', lineHeight: 1.6, margin: '0 0 24px' }}>
              An unexpected error occurred. Your report data and system connections remain safe.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                onClick={this.handleReload}
                style={{
                  width: '100%', padding: '14px', borderRadius: 14,
                  background: '#2563EB', color: 'white', border: 'none',
                  fontSize: 14, fontWeight: 800, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: '0 4px 16px rgba(37,99,235,0.35)',
                  fontFamily: 'inherit',
                }}
              >
                <RefreshCw size={16} /> Reload Page
              </button>

              <button
                onClick={this.handleGoHome}
                style={{
                  width: '100%', padding: '13px', borderRadius: 14,
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  fontFamily: 'inherit',
                }}
              >
                <Home size={16} /> Return to Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
