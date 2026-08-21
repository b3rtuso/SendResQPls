import { Search, Bell, X, AlertCircle, AlertTriangle, CheckCircle, XCircle, Menu } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getIncidents, updateIncidentStatus } from '../api/client';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { useAdminNav } from '../context/AdminNavContext';

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

interface UnrecognizedIncident {
  id: string;
  type: string;
  confidence: string;
}

const SEEN_KEY = 'admin_seen_incident_ids';
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function Header({ title, subtitle }: HeaderProps) {
  const navigate = useNavigate();
  const { toggleSidebar } = useAdminNav();
  const [notifications, setNotifications] = useState<NotifItem[]>([]);
  const [showPanel, setShowPanel] = useState(false);
  const [unseenCount, setUnseenCount] = useState(0);
  const [newReportBanner, setNewReportBanner] = useState<NewReportBanner | null>(null);
  const [unrecognizedModal, setUnrecognizedModal] = useState<UnrecognizedIncident | null>(null);
  const [decidingIncident, setDecidingIncident] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const bannerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sseRef = useRef<AbortController | null>(null);

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

  const showBanner = useCallback((banner: NewReportBanner) => {
    setNewReportBanner(banner);
    if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
    bannerTimerRef.current = setTimeout(() => setNewReportBanner(null), 8000);
  }, []);

  // Real-time SSE listener
  useEffect(() => {
    let aborted = false;

    const connect = () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      sseRef.current?.abort();
      const ctrl = new AbortController();
      sseRef.current = ctrl;

      fetchEventSource(`${API_BASE}/incidents/sse`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: ctrl.signal,

        onmessage(event) {
          if (event.event === 'new_incident') {
            try {
              const data = JSON.parse(event.data);
              showBanner({
                id: data.id,
                type: data.aiDetectedType || 'Emergency',
                dept: data.aiRecommendedDept || 'MDRRMO',
              });
              const newItem: NotifItem = {
                id: data.id,
                type: data.aiDetectedType || 'Emergency',
                status: 'PENDING',
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                isNew: true,
              };
              setNotifications(prev => [newItem, ...prev].slice(0, 20));
              setUnseenCount(prev => prev + 1);
            } catch { /* ignore */ }
          }

          if (event.event === 'unrecognized_incident') {
            try {
              const data = JSON.parse(event.data);
              setUnrecognizedModal({
                id: data.id,
                type: data.aiDetectedType || 'Unknown',
                confidence: data.aiConfidence || 'low',
              });
              const newItem: NotifItem = {
                id: data.id,
                type: `⚠️ ${data.aiDetectedType || 'Unrecognized'}`,
                status: 'REVIEWING',
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                isNew: true,
              };
              setNotifications(prev => [newItem, ...prev].slice(0, 20));
              setUnseenCount(prev => prev + 1);
            } catch { /* ignore */ }
          }
        },

        onerror(err) {
          if (!aborted) {
            setTimeout(connect, 5000);
          }
          throw err;
        },

        openWhenHidden: true,
      }).catch(() => {});
    };

    connect();
    fetchNotifications();

    return () => {
      aborted = true;
      sseRef.current?.abort();
      if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
    };
  }, [fetchNotifications, showBanner]);

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
      case 'REVIEWING': return '#2563EB';
      case 'DISPATCHED': return '#8B5CF6';
      case 'RESOLVED': return '#10B981';
      case 'REJECTED': return '#EF4444';
      default: return '#64748B';
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

  const handleDecision = async (action: 'reject' | 'keep') => {
    if (!unrecognizedModal) return;
    setDecidingIncident(true);
    try {
      if (action === 'reject') {
        await updateIncidentStatus(unrecognizedModal.id, {
          status: 'REJECTED',
          adminNotes: 'Rejected by admin — AI could not recognize the incident and admin determined it is not a valid emergency.'
        });
      } else {
        await updateIncidentStatus(unrecognizedModal.id, {
          adminNotes: 'Flagged for manual review — AI could not classify this incident. Admin will assess.'
        });
        window.location.href = `/requests/${unrecognizedModal.id}`;
      }
    } catch (e) {
      console.error('Failed to process decision:', e);
    } finally {
      setDecidingIncident(false);
      setUnrecognizedModal(null);
    }
  };

  return (
    <>
      <style>{`
        .top-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 32px;
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          border-bottom: 1px solid #E2E8F0;
          position: sticky;
          top: 0;
          z-index: 40;
          gap: 16px;
        }

        .header-title-box h2 {
          font-size: 20px;
          font-weight: 800;
          color: #0F172A;
          letter-spacing: -0.4px;
          margin: 0;
          line-height: 1.2;
        }

        .header-title-box p {
          font-size: 12.5px;
          color: #64748B;
          margin: 3px 0 0;
          font-weight: 500;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .header-search-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 10px;
          padding: 8px 14px;
          width: 240px;
          transition: all 0.15s ease;
        }

        .header-search-wrap:focus-within {
          background: #FFFFFF;
          border-color: #2563EB;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
          width: 280px;
        }

        .header-search-input {
          border: none;
          background: transparent;
          outline: none;
          font-size: 13px;
          font-family: inherit;
          color: #0F172A;
          width: 100%;
        }

        .header-icon-btn {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #475569;
          position: relative;
          transition: all 0.15s ease;
          flex-shrink: 0;
        }

        .header-icon-btn:hover {
          background: #F8FAFC;
          color: #0F172A;
          border-color: #CBD5E1;
        }

        .header-hamburger-btn {
          display: none;
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #0F172A;
          margin-right: 12px;
          flex-shrink: 0;
          transition: all 0.15s ease;
        }

        .header-hamburger-btn:hover {
          background: #F8FAFC;
          border-color: #CBD5E1;
        }

        @media (max-width: 1024px) {
          .header-hamburger-btn {
            display: flex;
          }
        }

        @media (max-width: 768px) {
          .top-header {
            padding: 14px 16px;
          }
          .header-title-box h2 {
            font-size: 17px;
          }
          .header-title-box p {
            font-size: 11.5px;
          }
          .header-search-wrap {
            display: none;
          }
        }
      `}</style>

      {/* Unrecognized Incident Modal */}
      {unrecognizedModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 10000,
          background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 'clamp(12px, 3vw, 24px)',
          overflowY: 'auto',
        }}>
          <div style={{
            background: 'white', borderRadius: 20,
            width: 'min(480px, calc(100vw - 32px))',
            maxHeight: 'calc(100vh - 32px)',
            boxShadow: '0 24px 60px rgba(0,0,0,0.3)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            animation: 'slideDown 0.3s cubic-bezier(0.16,1,0.3,1)',
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #F59E0B, #D97706)',
              padding: '20px 24px',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: '50%',
                background: 'rgba(255,255,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <AlertTriangle size={24} color="white" />
              </div>
              <div>
                <h3 style={{ color: 'white', margin: 0, fontSize: 17, fontWeight: 800 }}>
                  Unrecognized Incident Reported
                </h3>
                <p style={{ color: 'rgba(255,255,255,0.85)', margin: '2px 0 0', fontSize: 12.5 }}>
                  AI Confidence: {unrecognizedModal.confidence}
                </p>
              </div>
            </div>

            <div style={{ padding: '20px 24px' }}>
              <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.5, margin: '0 0 20px' }}>
                A report was submitted that could not be confidently identified by the AI system. Please review and decide whether to keep or reject this report.
              </p>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => handleDecision('reject')}
                  disabled={decidingIncident}
                  style={{
                    flex: 1, padding: '12px', borderRadius: 10,
                    background: '#FEE2E2', color: '#DC2626',
                    border: '1px solid #FCA5A5', fontWeight: 700, fontSize: 13,
                    cursor: decidingIncident ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    fontFamily: 'inherit',
                  }}
                >
                  <XCircle size={16} />
                  {decidingIncident ? 'Processing...' : 'Reject Report'}
                </button>
                <button
                  onClick={() => handleDecision('keep')}
                  disabled={decidingIncident}
                  style={{
                    flex: 1, padding: '12px', borderRadius: 10,
                    background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                    color: 'white', border: 'none',
                    fontWeight: 700, fontSize: 13,
                    cursor: decidingIncident ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    boxShadow: '0 4px 14px rgba(37,99,235,0.3)',
                    fontFamily: 'inherit',
                  }}
                >
                  <CheckCircle size={16} />
                  {decidingIncident ? 'Processing...' : 'Keep for Review'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Real-time Emergency Banner */}
      {newReportBanner && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0,
            zIndex: 9999,
            background: 'linear-gradient(90deg, #DC2626 0%, #EF4444 100%)',
            color: 'white', display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 24px', boxShadow: '0 4px 20px rgba(220,38,38,0.4)',
            animation: 'slideDown 0.3s cubic-bezier(0.16,1,0.3,1)',
          }}
        >
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <AlertTriangle size={18} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: 14 }}>
              NEW EMERGENCY REPORT
            </div>
            <div style={{ fontSize: 12, opacity: 0.9, marginTop: 1 }}>
              <strong>{newReportBanner.type}</strong> · Recommended Unit: {newReportBanner.dept}
            </div>
          </div>
          <a
            href={`/requests/${newReportBanner.id}`}
            style={{
              padding: '7px 16px', borderRadius: 8, background: 'white',
              color: '#DC2626', fontWeight: 700, fontSize: 12.5,
              textDecoration: 'none', flexShrink: 0,
            }}
          >
            Review Report →
          </a>
          <button
            onClick={() => setNewReportBanner(null)}
            style={{
              background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%',
              width: 28, height: 28, display: 'flex', alignItems: 'center',
              justifyContent: 'center', cursor: 'pointer', color: 'white', flexShrink: 0,
            }}
            aria-label="Dismiss"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Top Header Bar */}
      <header className="top-header">
        <div style={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
          <button
            className="header-hamburger-btn"
            onClick={toggleSidebar}
            aria-label="Toggle navigation drawer"
          >
            <Menu size={19} />
          </button>
          <div className="header-title-box">
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
        </div>

        <div className="header-actions">
          <div className="header-search-wrap">
            <Search size={15} color="#94A3B8" />
            <input
              type="text"
              placeholder="Search reports or incidents..."
              className="header-search-input"
            />
          </div>

          {/* Notification Bell */}
          <div ref={panelRef} style={{ position: 'relative' }}>
            <button
              className="header-icon-btn"
              aria-label="Notifications"
              onClick={handleBellClick}
              style={showPanel ? { borderColor: '#2563EB', color: '#2563EB', background: 'rgba(37,99,235,0.08)' } : undefined}
            >
              <Bell size={17} />
              {unseenCount > 0 && (
                <span style={{
                  position: 'absolute', top: -2, right: -2,
                  minWidth: 18, height: 18, borderRadius: 9,
                  background: '#DC2626', border: '2px solid white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 800, color: 'white',
                  lineHeight: 1, padding: '0 4px',
                }}>
                  {unseenCount > 9 ? '9+' : unseenCount}
                </span>
              )}
            </button>

            {/* Notification Drawer Panel */}
            {showPanel && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 10px)', right: 0,
                width: 'min(330px, calc(100vw - 24px))',
                background: 'white',
                border: '1px solid #E2E8F0',
                borderRadius: 14, boxShadow: '0 12px 36px rgba(15,23,42,0.14)',
                zIndex: 200, overflow: 'hidden',
                maxHeight: 'min(420px, 75vh)',
                display: 'flex',
                flexDirection: 'column',
              }}>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 16px',
                  borderBottom: '1px solid #F1F5F9',
                  background: '#F8FAFC',
                }}>
                  <span style={{ fontWeight: 800, fontSize: 13.5, color: '#0F172A' }}>
                    Recent Incidents
                  </span>
                  <button
                    onClick={() => setShowPanel(false)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 0 }}
                  >
                    <X size={16} />
                  </button>
                </div>

                <div style={{ maxHeight: 320, overflowY: 'auto', flex: 1 }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '28px 16px', textAlign: 'center', color: '#94A3B8' }}>
                      <Bell size={24} style={{ marginBottom: 6, opacity: 0.3 }} />
                      <div style={{ fontSize: 12.5 }}>No recent incidents</div>
                    </div>
                  ) : (
                    notifications.map((n, i) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          setShowPanel(false);
                          navigate(`/requests/${n.id}`);
                        }}
                        style={{
                          display: 'flex', alignItems: 'flex-start', gap: 10,
                          padding: '12px 16px',
                          borderTop: i === 0 ? 'none' : '1px solid #F1F5F9',
                          background: n.isNew ? 'rgba(37,99,235,0.04)' : 'transparent',
                          cursor: 'pointer',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(37,99,235,0.06)')}
                        onMouseLeave={e => (e.currentTarget.style.background = n.isNew ? 'rgba(37,99,235,0.04)' : 'transparent')}
                      >
                        <AlertCircle size={16} color={statusColor(n.status)} style={{ marginTop: 2, flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {n.type}
                            {n.isNew && (
                              <span style={{
                                marginLeft: 6, fontSize: 9.5, fontWeight: 800, color: '#2563EB',
                                background: 'rgba(37,99,235,0.1)', padding: '2px 6px', borderRadius: 6,
                              }}>NEW</span>
                            )}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: statusColor(n.status) }}>
                              {statusLabel(n.status)}
                            </span>
                            <span style={{ fontSize: 11, color: '#94A3B8' }}>• {n.time}</span>
                          </div>
                        </div>
                        <span style={{ fontSize: 11, color: '#94A3B8', flexShrink: 0, alignSelf: 'center' }}>→</span>
                      </div>
                    ))
                  )}
                </div>

                <div style={{
                  padding: '10px 16px',
                  borderTop: '1px solid #F1F5F9',
                  textAlign: 'center',
                  background: '#FAFBFC',
                }}>
                  <button
                    onClick={() => {
                      setShowPanel(false);
                      navigate('/requests');
                    }}
                    style={{ background: 'none', border: 'none', padding: 0, fontSize: 12, color: '#2563EB', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    View full request queue →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
