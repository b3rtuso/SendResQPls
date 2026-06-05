import { Search, Bell, X, AlertCircle } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { getIncidents } from '../api/client';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

interface NotifItem {
  id: string;
  type: string;
  status: string;
  time: string;
  isNew: boolean;
}

const SEEN_KEY = 'admin_seen_incident_ids';

export default function Header({ title, subtitle }: HeaderProps) {
  const [notifications, setNotifications] = useState<NotifItem[]>([]);
  const [showPanel, setShowPanel] = useState(false);
  const [unseenCount, setUnseenCount] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await getIncidents();
      const incidents: any[] = res.data || [];
      const seen: string[] = JSON.parse(localStorage.getItem(SEEN_KEY) || '[]');

      // Show the 10 most recent incidents, marking unseen ones
      const items: NotifItem[] = incidents
        .slice(0, 20)
        .map((inc: any) => ({
          id: inc.id,
          type: inc.aiDetectedType || 'Emergency',
          status: inc.status,
          time: new Date(inc.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isNew: !seen.includes(inc.id),
        }));

      const newCount = items.filter(n => n.isNew).length;
      setNotifications(items);
      setUnseenCount(newCount);
    } catch {
      // fail silently
    }
  };

  useEffect(() => {
    fetchNotifications();
    pollRef.current = setInterval(fetchNotifications, 30000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setShowPanel(false);
      }
    };
    if (showPanel) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showPanel]);

  const handleBellClick = () => {
    setShowPanel(prev => !prev);
    if (!showPanel) {
      // Mark all as seen when opening
      const allIds = notifications.map(n => n.id);
      localStorage.setItem(SEEN_KEY, JSON.stringify(allIds));
      setUnseenCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, isNew: false })));
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return '#D97706';
      case 'REVIEWING': return '#3B82F6';
      case 'DISPATCHED': return '#8B5CF6';
      case 'RESOLVED': return '#22C55E';
      case 'REJECTED': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Pending';
      case 'REVIEWING': return 'Reviewing';
      case 'DISPATCHED': return 'Dispatched';
      case 'RESOLVED': return 'Resolved';
      case 'REJECTED': return 'Rejected';
      default: return status;
    }
  };

  const userName  = localStorage.getItem('userName')  || 'MDRRMO Admin';
  const initials   = userName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <header className="top-header">
      <div className="header-left">
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </div>
      <div className="header-right">
        <div className="search-bar">
          <Search size={16} color="var(--text-muted)" />
          <input type="text" placeholder="Search incidents, reports..." />
        </div>
        <div className="system-status active">
          <span className="dot" />
          System Active
        </div>

        {/* Notification Bell */}
        <div ref={panelRef} style={{ position: 'relative' }}>
          <button
            className="header-icon-btn"
            aria-label="Notifications"
            onClick={handleBellClick}
            style={showPanel ? { borderColor: 'var(--primary)', color: 'var(--primary)', background: 'var(--primary-bg)' } : undefined}
          >
            <Bell size={18} />
            {unseenCount > 0 && (
              <span style={{
                position: 'absolute', top: 2, right: 2,
                minWidth: 18, height: 18, borderRadius: 9,
                background: '#DC2626', border: '2px solid white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 700, color: 'white',
                lineHeight: 1, padding: '0 3px',
              }}>{unseenCount > 9 ? '9+' : unseenCount}</span>
            )}
          </button>

          {/* Notification Dropdown */}
          {showPanel && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 8px)', right: 0,
              width: 320, background: 'white',
              border: '1px solid var(--border)',
              borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              zIndex: 200, overflow: 'hidden',
            }}>
              {/* Panel Header */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 16px 10px',
                borderBottom: '1px solid var(--border-light)',
              }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>
                  Recent Incidents
                </span>
                <button
                  onClick={() => setShowPanel(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Notification Items */}
              <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <Bell size={28} style={{ marginBottom: 8, opacity: 0.4 }} />
                    <div style={{ fontSize: 13 }}>No recent incidents</div>
                  </div>
                ) : (
                  notifications.map((n, i) => (
                    <div key={n.id} style={{
                      display: 'flex', alignItems: 'flex-start', gap: 10,
                      padding: '10px 16px',
                      borderTop: i === 0 ? 'none' : '1px solid var(--border-light)',
                      background: n.isNew ? 'rgba(59,130,246,0.04)' : 'transparent',
                    }}>
                      <AlertCircle size={16} color={statusColor(n.status)} style={{ marginTop: 2, flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
                          {n.type}
                          {n.isNew && (
                            <span style={{
                              marginLeft: 6, fontSize: 10, fontWeight: 700, color: 'var(--primary)',
                              background: 'var(--primary-bg)', padding: '1px 6px', borderRadius: 8,
                            }}>NEW</span>
                          )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{
                            fontSize: 11, fontWeight: 600, color: statusColor(n.status),
                          }}>
                            {statusLabel(n.status)}
                          </span>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>• {n.time}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div style={{
                padding: '10px 16px',
                borderTop: '1px solid var(--border-light)',
                textAlign: 'center',
              }}>
                <a href="/requests" style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
                  View all requests →
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 32, background: '#E2E8F0', flexShrink: 0 }} />

        {/* Admin Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'default' }}>
          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#1E293B', lineHeight: 1.3 }}>{userName}</span>
            <span style={{ fontSize: 11, color: '#94A3B8' }}>Administrator</span>
          </div>
          <div style={{
            width: 38, height: 38, borderRadius: '50%',
            background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 700, color: 'white', flexShrink: 0,
            border: '2px solid #BFDBFE',
          }}>{initials}</div>
        </div>
      </div>
    </header>
  );
}
