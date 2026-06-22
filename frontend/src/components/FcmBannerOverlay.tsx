import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { FCM_FOREGROUND_EVENT } from '../utils/pushNotificationHelper';
import type { FcmNotificationPayload } from '../utils/pushNotificationHelper';

/**
 * FcmBannerOverlay — Instagram-style heads-up notification banner.
 * Drop this into any mobile page that should show foreground push alerts.
 * It listens for the 'srq-push-foreground' event dispatched by pushNotificationHelper.
 */
export default function FcmBannerOverlay() {
  const navigate = useNavigate();
  const [banner, setBanner] = useState<FcmNotificationPayload | null>(null);
  const dismissRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const payload = (e as CustomEvent<FcmNotificationPayload>).detail;
      setBanner(payload);
      // Auto-dismiss after 5 seconds
      if (dismissRef.current) clearTimeout(dismissRef.current);
      dismissRef.current = setTimeout(() => setBanner(null), 5000);
    };

    window.addEventListener(FCM_FOREGROUND_EVENT, handler);
    return () => {
      window.removeEventListener(FCM_FOREGROUND_EVENT, handler);
      if (dismissRef.current) clearTimeout(dismissRef.current);
    };
  }, []);

  if (!banner) return null;

  const handleTap = () => {
    setBanner(null);
    if (banner.type === 'NEW_INCIDENT' && banner.incidentId) {
      // Admin tapped a new-report notification
      navigate(`/requests/${banner.incidentId}`);
    } else if (banner.incidentId) {
      // Citizen tapped a status-update notification → go to history
      navigate('/mobile/history');
    }
  };

  const getStatusEmoji = (status?: string) => {
    switch (status) {
      case 'DISPATCHED': return '🚒';
      case 'RESOLVED':   return '✅';
      case 'REVIEWING':  return '🔍';
      case 'REJECTED':   return '❌';
      default:           return '🔔';
    }
  };

  return (
    <div
      onClick={handleTap}
      style={{
        position: 'fixed',
        top: 12,
        left: 12,
        right: 12,
        zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.93)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderRadius: 18,
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.3)',
        border: '1px solid rgba(255,255,255,0.1)',
        cursor: 'pointer',
        animation: 'slideDown 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {/* App icon */}
      <div style={{
        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
        overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      }}>
        <img src="/logo.jpg" alt="SRQ" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>

      {/* App name + text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.45)',
          textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2,
        }}>
          SendResqPls
        </div>
        <div style={{
          fontSize: 13, fontWeight: 700, color: 'white',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {getStatusEmoji(banner.status)} {banner.title}
        </div>
        <div style={{
          fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 2,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {banner.body}
        </div>
      </div>

      {/* Dismiss "×" button */}
      <button
        onClick={(e) => { e.stopPropagation(); setBanner(null); }}
        style={{
          background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%',
          width: 28, height: 28, display: 'flex', alignItems: 'center',
          justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.7)',
          flexShrink: 0,
        }}
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  );
}
