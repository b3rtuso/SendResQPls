import { useNavigate } from 'react-router-dom';
import { Bell, AlertCircle, Truck, ShieldCheck, XCircle, Clock } from 'lucide-react';
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

const STATUS_META: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  DISPATCHED: { label: 'Responders have been dispatched',  color: '#2563EB', bg: '#EFF6FF', icon: Truck },
  RESOLVED:   { label: 'Your report has been resolved',  color: '#16A34A', bg: '#F0FDF4', icon: ShieldCheck },
  REJECTED:   { label: 'Report was not approved',   color: '#DC2626', bg: '#FEF2F2', icon: XCircle },
  REVIEWING:  { label: 'Under review by MDRRMO',         color: '#D97706', bg: '#FFFBEB', icon: Clock },
  PENDING:    { label: 'Awaiting review',         color: '#64748B', bg: '#F8FAFC', icon: AlertCircle },
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
      {/* ── Header ── */}
      <div style={{
        background: 'white',
        borderBottom: '1px solid #F1F5F9',
        padding: '56px 20px 16px',
        position: 'sticky', top: 0, zIndex: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.3px' }}>
              Notifications
              {unread > 0 && (
                <span style={{
                  marginLeft: 8, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  background: '#EF4444', color: 'white', fontSize: 11, fontWeight: 800,
                  minWidth: 20, height: 20, borderRadius: 10, padding: '0 5px',
                }}>
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </div>
            <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>
              Updates on your emergency reports
            </div>
          </div>
          {notifications.length > 0 && (
            <button
              onClick={handleClearAll}
              style={{
                background: '#F1F5F9', border: 'none', borderRadius: 8,
                padding: '7px 12px', fontSize: 12, fontWeight: 700, color: '#475569',
                cursor: 'pointer', fontFamily: 'var(--font)',
              }}
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* ── List ── */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 90 }}>
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
          <div style={{ padding: '12px 0' }}>
            {notifications.map((n, i) => {
              const meta = STATUS_META[n.status] || STATUS_META.PENDING;
              const Icon = meta.icon;
              return (
                <div
                  key={`${n.id}-${i}`}
                  onClick={() => handleMarkRead(n.id)}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 14,
                    padding: '14px 20px',
                    borderBottom: '1px solid #F1F5F9',
                    background: n.read ? 'white' : '#FAFBFF',
                    cursor: 'default',
                    position: 'relative',
                  }}
                >
                  {/* Unread dot */}
                  {!n.read && (
                    <div style={{
                      position: 'absolute', left: 8, top: '50%',
                      transform: 'translateY(-50%)',
                      width: 6, height: 6, borderRadius: '50%',
                      background: '#2563EB',
                    }} />
                  )}

                  {/* Icon circle */}
                  <div style={{
                    width: 44, height: 44, borderRadius: 13,
                    background: meta.bg, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon size={20} color={meta.color} />
                  </div>

                  {/* Text */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0F172A', marginBottom: 3 }}>
                      {n.type}
                    </div>
                    <div style={{ fontSize: 12.5, color: meta.color, fontWeight: 600, marginBottom: 4 }}>
                      {meta.label}
                    </div>
                    <div style={{ fontSize: 11, color: '#94A3B8' }}>
                      {n.time}
                    </div>
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
