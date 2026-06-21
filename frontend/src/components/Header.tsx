import { Search, Bell, X, AlertCircle, AlertTriangle } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
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

interface NewReportBanner {
  id: string;
  type: string;
  dept: string;
}

const SEEN_KEY = 'admin_seen_incident_ids';
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function Header({ title, subtitle }: HeaderProps) {
  const [notifications, setNotifications] = useState<NotifItem[]>([]);
  const [showPanel, setShowPanel] = useState(false);
  const [unseenCount, setUnseenCount] = useState(0);
  const [newReportBanner, setNewReportBanner] = useState<NewReportBanner | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const bannerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sseRef = useRef<EventSource | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await getIncidents();
      const incidents: any[] = res.data || [];
      const seen: string[] = JSON.parse(localStorage.getItem(SEEN_KEY) || '[]');

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
  }, []);

  /** Show the animated banner and auto-dismiss after 8 seconds */
  const showBanner = useCallback((banner: NewReportBanner) => {
    setNewReportBanner(banner);
    if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
    bannerTimerRef.current = setTimeout(() => setNewReportBanner(null), 8000);
  }, []);

  // ── SSE: Subscribe to real-time new-incident events ───────────────────────
  useEffect(() => {
    const connect = () => {
      const sse = new EventSource(`${API_BASE}/incidents/sse`);
      sseRef.current = sse;

      sse.addEventListener('new_incident', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          // Show animated banner
          showBanner({
            id: data.id,
            type: data.aiDetectedType || 'Emergency',
            dept: data.aiRecommendedDept || 'MDRRMO',
          });
          // Add to notification list immediately (optimistic)
          const newItem: NotifItem = {
            id: data.id,
            type: data.aiDetectedType || 'Emergency',
            status: 'PENDING',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isNew: true,
          };
          setNotifications(prev => [newItem, ...prev].slice(0, 20));
          setUnseenCount(prev => prev + 1);
        } catch { /* ignore malformed events */ }
      });

      sse.onerror = () => {
        // Reconnect after 5s if SSE drops
        sse.close();
        setTimeout(connect, 5000);
      };
    };

    connect();
    fetchNotifications(); // Initial load

    return () => {
      sseRef.current?.close();
      if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
    };
  }, [fetchNotifications, showBanner]);
  // ──────────────────────────────────────────────────────────────────────────

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
    <>
      {/* ── Real-time New Report Banner ──────────────────────────────────── */}
      {newReportBanner && (
        <div
          id="new-report-banner"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 9999,
            background: 'linear-gradient(90deg, #DC2626 0%, #EF4444 100%)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 20px',
            boxShadow: '0 4px 24px rgba(220, 38, 38, 0.45)',
            animation: 'slideDown 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <div style={{
            width: 38, height: 38, borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, animation: 'pulse-emergency 1.2s infinite',
          }}>
            <AlertTriangle size={20} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: 14, letterSpacing: '0.2px' }}>
              🚨 BAGONG EMERGENCY REPORT!
            </div>
            <div style={{ fontSize: 12, opacity: 0.9, marginTop: 2 }}>
              <strong>{newReportBanner.type}</strong> · Recommended: {newReportBanner.dept} · ID: {newReportBanner.id.slice(0, 8)}...
            </div>
          </div>
          <a
            href={`/requests/${newReportBanner.id}`}
            style={{
              padding: '7px 16px', borderRadius: 8, background: 'white',
              color: '#DC2626', fontWeight: 700, fontSize: 13,
              textDecoration: 'none', flexShrink: 0,
              transition: 'opacity 0.15s',
            }}
          >
            View Now →
          </a>
          <button
            onClick={() => setNewReportBanner(null)}
            style={{
              background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%',
              width: 30, height: 30, display: 'flex', alignItems: 'center',
              justifyContent: 'center', cursor: 'pointer', color: 'white', flexShrink: 0,
            }}
            aria-label="Dismiss"
          >
            <X size={15} />
          </button>
        </div>
      )}

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
    </>
  );
}
