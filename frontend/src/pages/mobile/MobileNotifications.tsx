import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, AlertCircle, Truck, ShieldCheck, XCircle, Clock, ChevronLeft, CheckCheck, Trash2, ArrowRight } from 'lucide-react';
import BottomNav from '../../components/BottomNav';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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
  const [notifications, setNotifications] = useState<StoredNotif[]>(() => getStoredNotifications());

  const handleClearAll = () => {
    clearNotifications();
    setNotifications([]);
  };

  const handleMarkAllRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    saveNotifications(updated);
    setNotifications(updated);
  };

  const handleMarkRead = (id: string) => {
    const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
    saveNotifications(updated);
    setNotifications(updated);
  };

  const handleDeleteOne = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = notifications.filter(n => n.id !== id);
    saveNotifications(updated);
    setNotifications(updated);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="mobile-shell" style={{ background: '#F8FAFC' }}>
      <div className="mobile-page" style={{ flex: 1, paddingBottom: 85 }}>
        {/* Header (flush top, matching Home header gradient) */}
        <div className="mobile-header-bar" style={{
          background: 'linear-gradient(135deg, #0F1F38 0%, #1A365D 60%, #1E40AF 100%)',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          color: 'white',
          boxShadow: '0 6px 24px rgba(15, 31, 56, 0.35)',
          borderRadius: '0 0 24px 24px',
          marginBottom: 16,
        }}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/mobile')}
            style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              border: '1.5px solid rgba(255, 255, 255, 0.25)',
              background: 'rgba(255, 255, 255, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              padding: 0,
            }}
            aria-label="Back"
          >
            <ChevronLeft size={20} />
          </Button>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: 'white', letterSpacing: '-0.2px', display: 'flex', alignItems: 'center', gap: 8 }}>
              Alerts & Updates
              {unreadCount > 0 && (
                <Badge style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  background: '#EF4444', color: 'white', fontSize: 10, fontWeight: 800,
                  minWidth: 18, height: 18, borderRadius: 9, padding: '0 4px',
                  border: '1.5px solid rgba(255,255,255,0.25)',
                }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Badge>
              )}
            </h1>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', margin: '2px 0 0' }}>Real-time notifications on your reports</p>
          </div>
        </div>

        <div style={{ padding: '0 20px' }}>

        {/* Action Bar (Mark all read & Clear all) */}
        {notifications.length > 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 14,
            padding: '0 4px',
          }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#64748B' }}>
              {unreadCount > 0 ? `${unreadCount} unread update${unreadCount > 1 ? 's' : ''}` : 'All caught up'}
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              {unreadCount > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleMarkAllRead}
                  style={{
                    background: 'white', border: '1px solid #E2E8F0', borderRadius: 8,
                    padding: '5px 10px', fontSize: 11.5, fontWeight: 700, color: '#2563EB',
                    display: 'flex', alignItems: 'center', gap: 4, height: 'auto',
                  }}
                >
                  <CheckCheck size={13} /> Mark all read
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={handleClearAll}
                style={{
                  background: 'white', border: '1px solid #E2E8F0', borderRadius: 8,
                  padding: '5px 10px', fontSize: 11.5, fontWeight: 700, color: '#94A3B8',
                  display: 'flex', alignItems: 'center', gap: 4, height: 'auto',
                }}
              >
                <Trash2 size={13} /> Clear
              </Button>
            </div>
          </div>
        )}

        {notifications.length === 0 ? (
          /* Empty state */
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', padding: '60px 24px', textAlign: 'center',
            background: 'white', borderRadius: 20, border: '1px solid #E2E8F0', marginTop: 10,
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: 18,
              background: '#EFF6FF',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 14, color: '#2563EB',
            }}>
              <Bell size={26} />
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>
              No notifications yet
            </div>
            <div style={{ fontSize: 13, color: '#64748B', lineHeight: 1.5, maxWidth: 260, marginBottom: 18 }}>
              You will receive alerts here whenever your emergency reports are reviewed or dispatched.
            </div>
            <Button
              variant="outline"
              onClick={() => navigate('/mobile/history')}
              style={{
                padding: '10px 18px', borderRadius: 12,
                background: '#F1F5F9', border: '1px solid #E2E8F0',
                fontSize: 13, fontWeight: 700, color: '#0F172A',
                display: 'flex', alignItems: 'center', gap: 6,
                minHeight: 44,
              }}
            >
              View Report History <ArrowRight size={14} />
            </Button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {notifications.map((n, i) => {
              const meta = STATUS_META[n.status] || STATUS_META.PENDING;
              const Icon = meta.icon;
              return (
                <div
                  key={`${n.id}-${i}`}
                  onClick={() => { handleMarkRead(n.id); navigate(`/mobile/history?incidentId=${n.id}`); }}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 12,
                    padding: '14px 16px',
                    borderRadius: 16,
                    background: 'white',
                    boxShadow: '0 1px 4px rgba(15,23,42,0.04)',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'all 0.15s ease',
                    border: '1px solid #E2E8F0',
                  }}
                >
                  {/* Icon square with tinted bg */}
                  <div style={{
                    width: 42, height: 42, borderRadius: 12,
                    background: meta.bg, flexShrink: 0,
                    border: `1.5px solid ${meta.color}25`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon size={20} color={meta.color} strokeWidth={2.2} />
                  </div>

                  {/* Text block */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.1px' }}>
                        {n.type}
                      </div>
                      <div style={{ fontSize: 10.5, color: '#94A3B8', fontWeight: 600, flexShrink: 0, marginLeft: 8 }}>
                        {n.time}
                      </div>
                    </div>
                    <div style={{ fontSize: 12.5, color: meta.color, fontWeight: 700, lineHeight: 1.35 }}>
                      {meta.label}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
                      {!n.read ? (
                        <span style={{
                          fontSize: 9.5, fontWeight: 800, color: meta.color,
                          background: `${meta.color}14`,
                          border: `1px solid ${meta.color}30`,
                          borderRadius: 6, padding: '1px 6px',
                          letterSpacing: '0.04em', textTransform: 'uppercase',
                        }}>
                          NEW UPDATE
                        </span>
                      ) : (
                        <span style={{ fontSize: 11, color: '#94A3B8' }}>Tap to view</span>
                      )}
                      <button
                        onClick={(e) => handleDeleteOne(e, n.id)}
                        style={{
                          background: 'none', border: 'none', color: '#CBD5E1',
                          cursor: 'pointer', padding: 2, display: 'flex',
                        }}
                        aria-label="Delete notification"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
