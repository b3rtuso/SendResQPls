import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, X, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  detail?: string;
  duration?: number;
  onClose: () => void;
}

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const colors = {
  success: { bg: '#ECFDF5', border: '#86EFAC', icon: '#22C55E', text: '#065F46' },
  error: { bg: '#FEF2F2', border: '#FECACA', icon: '#EF4444', text: '#991B1B' },
  warning: { bg: '#FEF3C7', border: '#FDE68A', icon: '#F59E0B', text: '#92400E' },
  info: { bg: '#EFF6FF', border: '#BFDBFE', icon: '#3B82F6', text: '#1E40AF' },
};

export default function Toast({ message, type, detail, duration = 5000, onClose }: ToastProps) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const Icon = icons[type];
  const color = colors[type];

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(onClose, 350);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div
      style={{
        position: 'fixed',
        top: 24,
        left: '50%',
        transform: `translateX(-50%) translateY(${visible && !exiting ? '0' : '-20px'})`,
        opacity: visible && !exiting ? 1 : 0,
        transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: 10000,
        width: '90%',
        maxWidth: 400,
        background: color.bg,
        border: `1.5px solid ${color.border}`,
        borderRadius: 16,
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 14,
        boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
        fontFamily: 'var(--font)',
      }}
    >
      <Icon size={24} color={color.icon} style={{ flexShrink: 0, marginTop: 2 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: color.text, marginBottom: detail ? 4 : 0 }}>
          {message}
        </div>
        {detail && (
          <div style={{ fontSize: 13, color: color.text, opacity: 0.75, lineHeight: 1.4 }}>
            {detail}
          </div>
        )}
      </div>
      <button
        onClick={() => { setExiting(true); setTimeout(onClose, 350); }}
        style={{
          background: 'none', border: 'none', cursor: 'pointer', padding: 4,
          color: color.text, opacity: 0.5, flexShrink: 0,
        }}
      >
        <X size={16} />
      </button>
    </div>
  );
}
