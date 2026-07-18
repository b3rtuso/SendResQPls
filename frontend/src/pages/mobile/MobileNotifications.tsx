import { useNavigate } from 'react-router-dom';
import { Bell, AlertCircle, Truck, ShieldCheck, XCircle, Clock, ChevronLeft } from 'lucide-react';
import BottomNav from '../../components/BottomNav';

// Pull notifications from localStorage (written by MobileHome polling)
const NOTIF_KEY = 'srq_notifications';

export function getStoredNotifications(): StoredNotif[] {
  try {
    return JSON.parse(localStorage.getItem(NOTIF_KEY) || '[]');
  } catch { return []; }
}

export function saveNotifications(notifs: StoredNotif[]) {
  localStorage.setItem(NOTIF_KEY, JSON.stringify(notifs));
}

export function clearNotifications() {
  localStorage.removeItem(NOTIF_KEY);
}

export interface StoredNotif {
  id: string;
  type: string;
  status: string;
  time: string;
  read: boolean;
}

const STATUS_META: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ElementType }> = {
  DISPATCHED: { label: 'Responders dispatched to your location', color: '#2563EB', bg: '#EFF6FF', border: '#2563EB', icon: Truck },
  RESOLVED:   { label: 'Your report has been resolved',          color: '#16A34A', bg: '#F0FDF4', border: '#16A34A', icon: ShieldCheck },
  REJECTED:   { label: 'Report was not approved',                color: '#DC2626', bg: '#FEF2F2', border: '#DC2626', icon: XCircle },
  REVIEWING:  { label: 'Under review by MDRRMO',                 color: '#D97706', bg: '#FFFBEB', border: '#D97706', icon: Clock },
  PENDING:    { label: 'Awaiting dispatcher review',             color: '#64748B', bg: '#F8FAFC', border: '#CBD5E1', icon: AlertCircle },
};

export default function MobileNotifications() {
  const navigate = useNavigate();
  const notifications = getStoredNotifications();

  const handleClearAll = () => {
    clearNotifications();
    // Force re-render by navigating to same page
    navigate('/mobile/notifications', { replace: true });
  };

  const handleMarkRead = (id: string) => {
    const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
    saveNotifications(updated);
  };

  const unread = notifications.filter(n => !n.read).length;

  return (
    <div className="mobile-shell" style={{ background: '#F8FAFC' }}>
      <div className="mobile-page" style={{ flex: 1, overflowY: 'auto', paddingBottom: 80 }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #1E3A5F 0%, #2563EB 100%)',
          margin: '0 -24px 20px',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          color: 'white',
          boxShadow: '0 4px 12px rgba(14, 165, 233, 0.15)',
        }}>
          <button 
            onClick={() => navigate('/mobile')}
            style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              border: '1.5px solid rgba(255, 255, 255, 0.3)',
              background: 'rgba(255, 255, 255, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'white',
              padding: 0,
            }}
            aria-label="Back"
          >
            <ChevronLeft size={20} />
          </button>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: 'white', letterSpacing: '0.3px', display: 'flex', alignItems: 'center', gap: 8 }}>
              Notifications
              {unread > 0 && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  background: '#EF4444', color: 'white', fontSize: 10, fontWeight: 800,
                  minWidth: 18, height: 18, borderRadius: 9, padding: '0 4px',
                  border: '1.5px solid #1E3A5F',
                }}>
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </h1>
            <p style={{ fontSize: 11, opacity: 0.85, margin: '2px 0 0' }}>Updates on your emergency reports</p>
          </div>
          {notifications.length > 0 && (
            <button
              onClick={handleClearAll}
              style={{
                background: 'rgba(255, 255, 255, 0.15)', border: '1.5px solid rgba(255, 255, 255, 0.3)', borderRadius: 10,
                padding: '6px 12px', fontSize: 12, fontWeight: 700, color: 'white',
                cursor: 'pointer', fontFamily: 'var(--font)',
              }}
            >
              Clear all
            </button>
          )}
        </div>
        {notifications.length === 0 ? (
          /* Empty state */
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', padding: '80px 32px', textAlign: 'center',
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: 18,
              background: '#F1F5F9',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 16,
            }}>
              <Bell size={28} color="#CBD5E1" />
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>
              No notifications yet
            </div>
            <div style={{ fontSize: 13, color: '#94A3B8', lineHeight: 1.6 }}>
              You will see updates here when the status of your report changes.
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {notifications.map((n, i) => {
              const meta = STATUS_META[n.status] || STATUS_META.PENDING;
              const Icon = meta.icon;
              return (
                <div
                  key={`${n.id}-${i}`}
                  onClick={() => handleMarkRead(n.id)}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 14,
                    padding: '16px 20px 16px 20px',
                    borderBottom: '1px solid rgba(241,245,249,0.9)',
                    background: n.read ? 'white' : 'rgba(239,246,255,0.5)',
                    cursor: 'default',
                    position: 'relative',
                    transition: 'background 0.15s',
                    /* colored left border via box-shadow to avoid layout shift */
                    borderLeft: `3px solid ${n.read ? 'transparent' : meta.border}`,
                  }}
                >
                  {/* Unread indicator dot */}
                  {!n.read && (
                    <div style={{
                      position: 'absolute', left: 11, top: '50%',
                      transform: 'translateY(-50%)',
                      width: 7, height: 7, borderRadius: '50%',
                      background: meta.color,
                      boxShadow: `0 0 0 3px ${meta.color}22`,
                    }} />
                  )}

                  {/* Icon square with tinted bg */}
                  <div style={{
                    width: 46, height: 46, borderRadius: 14,
                    background: meta.bg, flexShrink: 0,
                    border: `1.5px solid ${meta.color}22`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon size={20} color={meta.color} strokeWidth={2} />
                  </div>

                  {/* Text block */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.1px' }}>
                        {n.type}
                      </div>
                      <div style={{ fontSize: 10.5, color: '#94A3B8', fontWeight: 600, flexShrink: 0, marginLeft: 8 }}>
                        {n.time}
                      </div>
                    </div>
                    <div style={{ fontSize: 12.5, color: meta.color, fontWeight: 700, marginBottom: 2 }}>
                      {meta.label}
                    </div>
                    {!n.read && (
                      <div style={{
                        display: 'inline-flex', alignItems: 'center',
                        fontSize: 10, fontWeight: 700, color: meta.color,
                        background: `${meta.color}12`,
                        border: `1px solid ${meta.color}22`,
                        borderRadius: 6, padding: '2px 7px', marginTop: 4,
                        letterSpacing: '0.04em', textTransform: 'uppercase',
                      }}>
                        New
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
