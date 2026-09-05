import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, MapPin, RefreshCw, ChevronLeft, Loader2, CheckCircle2, Clock, ShieldCheck, XCircle, AlertTriangle, PlusCircle, X, Phone, Siren, ChevronRight, Check } from 'lucide-react';
import { getMyIncidents, getIncidents, getIncident, invalidateCache } from '../../api/client';
import type { Incident, Status } from '../../types';
import BottomNav from '../../components/BottomNav';
import { FCM_FOREGROUND_EVENT } from '../../utils/pushNotificationHelper';
import type { FcmNotificationPayload } from '../../utils/pushNotificationHelper';
import { Button } from '@/components/ui/button';
import { getNearestBarangay } from '../../data/balayan-data';
import { MobileHistorySkeleton } from '../../components/PageLoader';


const STATUS_ICONS: Record<Status, any> = {
  PENDING: Clock,
  REVIEWING: AlertCircle,
  DISPATCHED: ShieldCheck,
  RESOLVED: CheckCircle2,
  REJECTED: XCircle,
};

const STATUS_THEMES: Record<Status, { bg: string; color: string; border: string; label: string }> = {
  PENDING:    { bg: '#FEF3C7', color: '#92400E', border: '#FDE68A', label: 'Pending' },
  REVIEWING:  { bg: '#DBEAFE', color: '#1E40AF', border: '#BFDBFE', label: 'Reviewing' },
  DISPATCHED: { bg: '#EDE9FE', color: '#5B21B6', border: '#DDD6FE', label: 'Dispatched' },
  RESOLVED:   { bg: '#DCFCE7', color: '#14532D', border: '#BBF7D0', label: 'Resolved' },
  REJECTED:   { bg: '#FEE2E2', color: '#7F1D1D', border: '#FECACA', label: 'Rejected' },
};

const TAB_THEMES: Record<string, {
  activeBg: string;
  activeColor: string;
  activeBorder: string;
  activeGlow: string;
  inactiveBg: string;
  inactiveColor: string;
  inactiveBorder: string;
  dotColor: string;
}> = {
  ALL: {
    activeBg: '#0F2942',
    activeColor: '#FFFFFF',
    activeBorder: '#0F2942',
    activeGlow: 'rgba(15, 41, 66, 0.25)',
    inactiveBg: '#FFFFFF',
    inactiveColor: '#475569',
    inactiveBorder: '#E2E8F0',
    dotColor: '#64748B',
  },
  PENDING: {
    activeBg: '#F59E0B',
    activeColor: '#FFFFFF',
    activeBorder: '#D97706',
    activeGlow: 'rgba(245, 158, 11, 0.3)',
    inactiveBg: '#FEF3C7',
    inactiveColor: '#92400E',
    inactiveBorder: '#FDE68A',
    dotColor: '#F59E0B',
  },
  REVIEWING: {
    activeBg: '#2563EB',
    activeColor: '#FFFFFF',
    activeBorder: '#1D4ED8',
    activeGlow: 'rgba(37, 99, 235, 0.3)',
    inactiveBg: '#DBEAFE',
    inactiveColor: '#1E40AF',
    inactiveBorder: '#BFDBFE',
    dotColor: '#2563EB',
  },
  DISPATCHED: {
    activeBg: '#8B5CF6',
    activeColor: '#FFFFFF',
    activeBorder: '#7C3AED',
    activeGlow: 'rgba(139, 92, 246, 0.3)',
    inactiveBg: '#EDE9FE',
    inactiveColor: '#5B21B6',
    inactiveBorder: '#DDD6FE',
    dotColor: '#8B5CF6',
  },
  RESOLVED: {
    activeBg: '#10B981',
    activeColor: '#FFFFFF',
    activeBorder: '#059669',
    activeGlow: 'rgba(16, 185, 129, 0.3)',
    inactiveBg: '#DCFCE7',
    inactiveColor: '#14532D',
    inactiveBorder: '#BBF7D0',
    dotColor: '#10B981',
  },
  REJECTED: {
    activeBg: '#EF4444',
    activeColor: '#FFFFFF',
    activeBorder: '#DC2626',
    activeGlow: 'rgba(239, 68, 68, 0.3)',
    inactiveBg: '#FEE2E2',
    inactiveColor: '#7F1D1D',
    inactiveBorder: '#FECACA',
    dotColor: '#EF4444',
  },
};

const TYPE_COLORS: Record<string, string> = {
  Fire: '#EF4444',
  Flood: '#3B82F6',
  Medical: '#22C55E',
  Trauma: '#F59E0B',
  Accident: '#3B82F6',
  Crime: '#8B5CF6',
  Typhoon: '#8B5CF6',
  Landslide: '#78716C',
};

const FILTER_TABS = ['ALL', 'PENDING', 'REVIEWING', 'DISPATCHED', 'RESOLVED', 'REJECTED'] as const;
type FilterTab = typeof FILTER_TABS[number];

const PAGE_SIZE = 6;

export default function MobileHistory() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const targetIncidentId = searchParams.get('incidentId');

  const [allIncidents, setAllIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [statusFilter, setStatusFilter] = useState<FilterTab>('ALL');
  const [page, setPage] = useState(1);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  // Pull-to-refresh states & refs
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const startYRef = useRef(0);
  const isPullingRef = useRef(false);
  const refreshingRef = useRef(false);
  const pullDistanceRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const selectedIncidentRef = useRef<Incident | null>(null);

  const updatePullDistance = (val: number) => {
    pullDistanceRef.current = val;
    setPullDistance(val);
  };

  useEffect(() => {
    refreshingRef.current = refreshing;
  }, [refreshing]);

  useEffect(() => {
    selectedIncidentRef.current = selectedIncident;
    if (selectedIncident) {
      isPullingRef.current = false;
      setIsPulling(false);
      updatePullDistance(0);
    }
  }, [selectedIncident]);

  const fetchHistory = async (forceNetwork = false) => {
    setLoading(true);
    try {
      if (forceNetwork) {
        invalidateCache('incidents');
      }
      const userId = localStorage.getItem('userId');
      let res;
      if (userId) {
        res = await getMyIncidents(userId);
      } else {
        res = await getIncidents();
      }
      const data: Incident[] = res.data || [];
      setAllIncidents(data);
      setPage(1);
    } catch (err) {
      console.warn('[MobileHistory] Fetch history error:', err);
      // Keep existing data if available
      setAllIncidents(prev => (prev.length > 0 ? prev : []));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHistory(); }, []);

  // ── Auto-open Track Status modal when navigating with ?incidentId=<id> ──
  useEffect(() => {
    if (!targetIncidentId) return;

    // Check if incident is already in loaded list
    const found = allIncidents.find(i => i.id === targetIncidentId);
    if (found) {
      setSelectedIncident(found);
    } else if (!loading) {
      // If list finished loading and not found in recent list, fetch directly
      getIncident(targetIncidentId)
        .then(res => {
          if (res.data) setSelectedIncident(res.data);
        })
        .catch(() => {});
    }
  }, [targetIncidentId, allIncidents, loading]);

  // ── FCM: patch in-place when admin updates a specific incident ─────────────
  // When a push arrives with an incidentId + status, we update ONLY that row
  // in local state — no full re-fetch, no stale data for other users' reports.
  useEffect(() => {
    const handler = (e: Event) => {
      const payload = (e as CustomEvent<FcmNotificationPayload>).detail;
      if (payload.incidentId && payload.status) {
        setAllIncidents(prev =>
          prev.map(inc =>
            inc.id === payload.incidentId
              ? { ...inc, status: payload.status as Status }
              : inc
          )
        );
      }
    };
    window.addEventListener(FCM_FOREGROUND_EVENT, handler);
    return () => window.removeEventListener(FCM_FOREGROUND_EVENT, handler);
  }, []);

  // ── Visibility change: full refresh when user returns from background ───────
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchHistory();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);


  useEffect(() => {
    if (selectedIncident) {
      // Lock
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      // Restore
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [selectedIncident]);

  const filteredIncidents = useMemo(() => {
    if (statusFilter === 'ALL') return allIncidents;
    return allIncidents.filter(inc => inc.status === statusFilter);
  }, [allIncidents, statusFilter]);

  const displayedIncidents = useMemo(() => {
    return filteredIncidents.slice(0, page * PAGE_SIZE);
  }, [filteredIncidents, page]);

  const hasMore = displayedIncidents.length < filteredIncidents.length;

  // Infinite Scroll Observer
  const loadNextPage = useCallback(() => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    setTimeout(() => {
      setPage(p => p + 1);
      setLoadingMore(false);
    }, 350);
  }, [loadingMore, hasMore]);

  useEffect(() => {
    if (loading || !hasMore || loadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadNextPage();
        }
      },
      { rootMargin: '120px' }
    );

    const el = sentinelRef.current;
    if (el) observer.observe(el);

    return () => {
      if (el) observer.unobserve(el);
    };
  }, [loading, hasMore, loadingMore, loadNextPage]);

  // Touch listener for pull-to-refresh
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchMove = (e: TouchEvent) => {
      if (selectedIncidentRef.current || !isPullingRef.current || refreshingRef.current) return;
      const currentY = e.touches[0].clientY;
      const deltaY = currentY - startYRef.current;

      if (deltaY > 0 && window.scrollY === 0) {
        const pull = Math.min(100, deltaY * 0.4);
        updatePullDistance(pull);
        if (pull > 5 && e.cancelable) {
          e.preventDefault();
        }
      }
    };

    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    return () => {
      container.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (selectedIncidentRef.current || window.scrollY !== 0 || refreshingRef.current) return;
    startYRef.current = e.touches[0].clientY;
    isPullingRef.current = true;
    setIsPulling(true);
  };

  const handleTouchEnd = async () => {
    if (selectedIncidentRef.current || !isPullingRef.current) return;
    isPullingRef.current = false;
    setIsPulling(false);

    if (pullDistanceRef.current > 60) {
      setRefreshing(true);
      updatePullDistance(50);
      await fetchHistory(true);
      setRefreshing(false);
    }
    updatePullDistance(0);
  };

  const countsByStatus = useMemo(() => {
    return allIncidents.reduce((acc, inc) => {
      acc[inc.status] = (acc[inc.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [allIncidents]);

  return (
    <div
      className="mobile-shell"
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{ background: '#F1F5F9' }}
    >
      <style>{`
        .mh-filter-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 14px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          white-space: nowrap;
          flex-shrink: 0;
          border-width: 1px;
          border-style: solid;
        }
        .mh-chip-count {
          font-size: 10px;
          padding: 1px 6px;
          border-radius: 8px;
          background: rgba(0,0,0,0.06);
        }
        .mh-filter-chip.active .mh-chip-count {
          background: rgba(255,255,255,0.25);
          color: white;
        }
        .mh-history-card {
          background: white;
          border-radius: 18px;
          padding: 16px;
          margin-bottom: 12px;
          border: 1px solid rgba(226,232,240,0.8);
          box-shadow: 0 2px 10px rgba(15,23,42,0.04);
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          cursor: pointer;
          position: relative;
        }
        .mh-history-card:hover {
          border-color: #CBD5E1;
          box-shadow: 0 4px 16px rgba(15,23,42,0.08);
          transform: translateY(-1px);
        }
        .mh-history-card:active {
          transform: scale(0.985);
        }

        /* ── Delivery Tracker Sheet ── */
        .srq-tracker-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 23, 42, 0.7);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          z-index: 1050;
          display: flex;
          align-items: center;
          justify-content: center;
          padding-top: max(env(safe-area-inset-top, 0px), 16px);
          padding-left: 16px;
          padding-right: 16px;
          padding-bottom: calc(68px + env(safe-area-inset-bottom, 0px) + 20px);
          box-sizing: border-box;
          animation: trackerFadeIn 0.22s ease;
        }
        .srq-tracker-sheet {
          width: 100%;
          max-width: 440px;
          background: white;
          border-radius: 24px;
          max-height: calc(100dvh - 68px - env(safe-area-inset-bottom, 0px) - max(env(safe-area-inset-top, 0px), 16px) - 44px);
          overflow-y: auto;
          box-shadow: 0 20px 60px rgba(15, 23, 42, 0.35);
          animation: modalScaleIn 0.28s cubic-bezier(0.16, 1, 0.3, 1);
          padding: 24px 20px;
          box-sizing: border-box;
        }
        .srq-tracker-handle {
          display: none;
        }
        .srq-stepper-track {
          position: relative;
          padding-left: 48px;
          margin: 20px 0;
        }
        .srq-stepper-line {
          position: absolute;
          left: 19px;
          top: 14px;
          bottom: 24px;
          width: 2px;
          background: #E2E8F0;
        }
        .srq-stepper-node {
          position: relative;
          margin-bottom: 24px;
        }
        .srq-stepper-node:last-child {
          margin-bottom: 0;
        }
        .srq-node-icon-wrap {
          position: absolute;
          left: -48px;
          top: 0;
          width: 38px;
          height: 38px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2;
          background: white;
          border: 2px solid #CBD5E1;
          color: #94A3B8;
        }
        .srq-node-icon-wrap.completed {
          background: #DCFCE7;
          border-color: #86EFAC;
          color: #16A34A;
        }
        .srq-node-icon-wrap.active {
          background: #EDE9FE;
          border-color: #8B5CF6;
          color: #7C3AED;
          box-shadow: 0 0 0 5px rgba(139, 92, 246, 0.2);
        }
        .srq-node-icon-wrap.rejected {
          background: #FEE2E2;
          border-color: #FCA5A5;
          color: #DC2626;
        }

        @keyframes trackerFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes trackerSlideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>

      <div className="mobile-page" style={{ paddingBottom: 90 }}>
        {/* Header (flush top, matching Home header gradient) */}
        <div style={{
          background: 'linear-gradient(155deg, #0F1F38 0%, #1E3A5F 40%, #2563EB 100%)',
          margin: 0,
          padding: '24px 20px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 0,
          color: 'white',
          boxShadow: '0 6px 24px rgba(15, 31, 56, 0.35)',
          borderRadius: '0 0 24px 24px',
          marginBottom: 0,
        }}>
          {/* Pull-to-refresh Indicator — only shows when user is actively pulling */}
          {(pullDistance > 0 || refreshing) && (
            <div style={{
              height: refreshing ? 40 : Math.min(pullDistance, 50),
              opacity: pullDistance > 0 || refreshing ? 1 : 0,
              transition: isPulling ? 'none' : 'height 0.2s ease, opacity 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              color: 'rgba(255,255,255,0.85)',
              fontSize: 12,
              fontWeight: 600,
              gap: 8,
              marginBottom: 8,
            }}>
              <RefreshCw
                size={14}
                className={refreshing ? "spin" : ""}
                style={{
                  transform: refreshing ? undefined : `rotate(${pullDistance * 3}deg)`,
                  transition: refreshing ? undefined : 'transform 0.1s linear'
                }}
              />
              <span>{refreshing ? 'Syncing...' : pullDistance > 60 ? 'Release to refresh' : 'Pull to refresh'}</span>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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
            <div>
              <h1 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: 'white', letterSpacing: '-0.2px' }}>Report History</h1>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', margin: '2px 0 0' }}>Tap any report to view live response status</p>
            </div>
          </div>
        </div>

        <div style={{ padding: '16px 20px 0' }}>

        {/* ── Status Filter Chips with Admin Portal Palette ── */}
        <div style={{
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          margin: '0 0 16px',
          padding: '0 0 4px',
          scrollbarWidth: 'none',
        }}>
          {FILTER_TABS.map(tab => {
            const isActive = statusFilter === tab;
            const theme = TAB_THEMES[tab] || TAB_THEMES.ALL;
            const count = tab === 'ALL' ? allIncidents.length : (countsByStatus[tab] || 0);
            return (
              <button
                key={tab}
                className={`mh-filter-chip ${isActive ? 'active' : ''}`}
                style={{
                  background: isActive ? theme.activeBg : theme.inactiveBg,
                  color: isActive ? theme.activeColor : theme.inactiveColor,
                  borderColor: isActive ? theme.activeBorder : theme.inactiveBorder,
                  boxShadow: isActive ? `0 2px 10px ${theme.activeGlow}` : 'none',
                }}
                onClick={() => { setStatusFilter(tab); setPage(1); }}
              >
                <span>{tab === 'ALL' ? 'All' : tab.charAt(0) + tab.slice(1).toLowerCase()}</span>
                <span className="mh-chip-count">{count}</span>
              </button>
            );
          })}
        </div>

        {loading ? (
          <MobileHistorySkeleton count={5} />
        ) : (
          <div className="history-list">
            {displayedIncidents.map((inc) => {
              const theme = STATUS_THEMES[inc.status] || STATUS_THEMES.PENDING;
              const StatusIcon = STATUS_ICONS[inc.status] || Clock;
              const typeFirstWord = (inc.aiDetectedType || 'Emergency').split(' ')[0];
              const accentColor = TYPE_COLORS[typeFirstWord] || '#2563EB';

              return (
                <div
                  className="mh-history-card"
                  key={inc.id}
                  onClick={() => setSelectedIncident(inc)}
                  role="button"
                  tabIndex={0}
                  aria-label={`View details for ${inc.aiDetectedType || 'Emergency'}`}
                >
                  {/* Top Row: Thumbnail + Info */}
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
                    {/* Thumbnail Image or Icon box */}
                    {inc.photoUrl ? (
                      <img
                        src={inc.photoUrl}
                        alt="Incident photo"
                        style={{
                          width: 54,
                          height: 54,
                          borderRadius: 14,
                          objectFit: 'cover',
                          flexShrink: 0,
                          border: '1.5px solid #E2E8F0',
                        }}
                      />
                    ) : (
                      <div style={{
                        width: 54,
                        height: 54,
                        borderRadius: 14,
                        background: `${accentColor}12`,
                        border: `1.5px solid ${accentColor}25`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: accentColor,
                        flexShrink: 0,
                      }}>
                        <AlertTriangle size={24} />
                      </div>
                    )}

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 14.5,
                        fontWeight: 800,
                        color: '#0F172A',
                        letterSpacing: '-0.2px',
                        marginBottom: 4,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}>
                        {inc.aiDetectedType || 'Unidentified Emergency'}
                      </div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: 12,
                        color: '#64748B',
                        fontWeight: 500,
                      }}>
                        <MapPin size={12} color="#2563EB" />
                        <span>
                          {inc.latitude && inc.longitude
                            ? getNearestBarangay(inc.latitude, inc.longitude).split(',')[0]
                            : 'Balayan, Batangas'}
                        </span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '5px 10px',
                      borderRadius: 999,
                      background: theme.bg,
                      color: theme.color,
                      border: `1px solid ${theme.border}`,
                      fontSize: 11,
                      fontWeight: 800,
                      flexShrink: 0,
                    }}>
                      <StatusIcon size={12} />
                      <span>{theme.label}</span>
                    </div>
                  </div>

                  {/* Bottom Row: Date & Assigned Dept */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: 10,
                    borderTop: '1px solid #F1F5F9',
                    fontSize: 11.5,
                    color: '#94A3B8',
                  }}>
                    <div>
                      {new Date(inc.createdAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })} •{' '}
                      {new Date(inc.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      fontWeight: 700,
                      color: '#2563EB',
                      background: '#EFF6FF',
                      padding: '4px 10px',
                      borderRadius: 8,
                      border: '1px solid #DBEAFE',
                      fontSize: 11.5,
                    }}>
                      <span>Track Status</span>
                      <ChevronRight size={13} strokeWidth={2.5} />
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Infinite Scroll Sentinel Element */}
            <div ref={sentinelRef} style={{ height: 1 }} />

            {/* Bottom Loading Indicator */}
            {loadingMore && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '16px 0',
                color: '#64748B',
                fontSize: 12.5,
                fontWeight: 600,
              }}>
                <Loader2 size={16} className="spin" style={{ color: '#2563EB' }} />
                <span>Loading more history...</span>
              </div>
            )}

            {/* End of results indicator */}
            {!hasMore && displayedIncidents.length > 0 && (
              <div style={{
                textAlign: 'center',
                padding: '16px 0 20px',
                fontSize: 11.5,
                fontWeight: 600,
                color: '#94A3B8',
                letterSpacing: '0.04em',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}>
                <CheckCircle2 size={13} color="#10B981" />
                <span>All {filteredIncidents.length} incident reports loaded</span>
              </div>
            )}

            {/* Empty State */}
            {displayedIncidents.length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: '48px 24px',
                background: 'white',
                borderRadius: 20,
                border: '1px solid #E2E8F0',
                marginTop: 12,
              }}>
                <div style={{
                  width: 56,
                  height: 56,
                  borderRadius: 18,
                  background: '#EFF6FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 14px',
                  color: '#2563EB',
                }}>
                  <Clock size={28} />
                </div>
                <h3 style={{ fontWeight: 800, margin: '0 0 6px', color: '#0F172A', fontSize: 16 }}>
                  {statusFilter === 'ALL' ? 'No reports yet' : `No ${statusFilter.toLowerCase()} reports`}
                </h3>
                <p style={{ color: '#64748B', fontSize: 13, margin: '0 0 20px', lineHeight: 1.5 }}>
                  {statusFilter === 'ALL'
                    ? 'When you submit an emergency alert, its real-time response progress will appear here.'
                    : `There are currently no reports with ${statusFilter.toLowerCase()} status.`}
                </p>
                <button
                  onClick={() => navigate('/mobile/report')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '12px 20px',
                    borderRadius: 14,
                    background: '#2563EB',
                    color: 'white',
                    border: 'none',
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    boxShadow: '0 4px 14px rgba(37,99,235,0.3)',
                  }}
                >
                  <PlusCircle size={17} /> Create an Alert
                </button>
              </div>
            )}
          </div>
        )}
        </div>
      </div>

      {/* ─── LIVE DELIVERY-STYLE INCIDENT STATUS TRACKER MODAL ─── */}
      {selectedIncident && (
        <div
          className="srq-tracker-overlay"
          onClick={() => setSelectedIncident(null)}
          onTouchStart={e => e.stopPropagation()}
          onTouchMove={e => e.stopPropagation()}
          onTouchEnd={e => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          style={{ touchAction: 'none' }}
        >
          <div
            className="srq-tracker-sheet"
            onClick={e => e.stopPropagation()}
            onTouchStart={e => e.stopPropagation()}
            onTouchMove={e => e.stopPropagation()}
            onTouchEnd={e => e.stopPropagation()}
            style={{ overscrollBehavior: 'contain', touchAction: 'pan-y' }}
          >
            {/* Drag Handle */}
            <div className="srq-tracker-handle" />

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 10.5, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Live Status Tracker
                </div>
                <h2 style={{ fontSize: 18, fontWeight: 900, color: '#0F172A', margin: '2px 0 0', letterSpacing: '-0.3px' }}>
                  {selectedIncident.aiDetectedType || 'Emergency Report'}
                </h2>
              </div>
              <button
                onClick={() => setSelectedIncident(null)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  border: '1px solid #E2E8F0',
                  background: '#F8FAFC',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#64748B',
                }}
                aria-label="Close tracker"
              >
                <X size={16} />
              </button>
            </div>

            {/* Live Dispatch Badge / Status Summary */}
            {selectedIncident.status === 'DISPATCHED' && (
              <div style={{
                background: 'linear-gradient(135deg, #EDE9FE 0%, #DDD6FE 100%)',
                border: '1.5px solid #C4B5FD',
                borderRadius: 16,
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginBottom: 16,
              }}>
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  background: '#8B5CF6',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 4px 12px rgba(139, 92, 246, 0.35)',
                }}>
                  <Siren size={22} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#5B21B6' }}>
                    Responders En Route
                  </div>
                  <div style={{ fontSize: 11.5, color: '#6D28D9', marginTop: 1 }}>
                    {selectedIncident.assignedDepartment ? `Assigned: ${selectedIncident.assignedDepartment}` : 'Emergency team dispatched to your GPS location'}
                  </div>
                </div>
              </div>
            )}

            {/* Vertical Delivery Stepper */}
            <div className="srq-stepper-track">
              <div className="srq-stepper-line" />

              {/* Step 1: Report Submitted */}
              <div className="srq-stepper-node">
                <div className="srq-node-icon-wrap completed">
                  <Check size={18} strokeWidth={3} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <div style={{ fontSize: 13.5, fontWeight: 800, color: '#0F172A' }}>Report Submitted</div>
                  <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600 }}>
                    {new Date(selectedIncident.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2 }}>
                  Emergency incident logged with GPS & photo evidence.
                </div>
              </div>

              {/* Step 2: MDRRMO Verification & Triage */}
              {selectedIncident.status === 'REJECTED' ? (
                <div className="srq-stepper-node">
                  <div className="srq-node-icon-wrap rejected">
                    <XCircle size={18} strokeWidth={2.5} />
                  </div>
                  <div style={{ fontSize: 13.5, fontWeight: 800, color: '#DC2626' }}>Report Cancelled / Rejected</div>
                  <div style={{ fontSize: 11.5, color: '#7F1D1D', marginTop: 2 }}>
                    Command center reviewed and closed this report.
                  </div>
                </div>
              ) : (
                <>
                  <div className="srq-stepper-node">
                    <div className={`srq-node-icon-wrap ${
                      selectedIncident.status === 'PENDING' ? 'active' : 'completed'
                    }`}>
                      {selectedIncident.status === 'PENDING' ? (
                        <Clock size={18} />
                      ) : (
                        <Check size={18} strokeWidth={3} />
                      )}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <div style={{ fontSize: 13.5, fontWeight: 800, color: '#0F172A' }}>
                        MDRRMO Triage & Verification
                      </div>
                      {selectedIncident.status !== 'PENDING' && (
                        <span style={{ fontSize: 10, fontWeight: 800, color: '#16A34A', background: '#DCFCE7', padding: '1px 6px', borderRadius: 6 }}>
                          VERIFIED
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2 }}>
                      {selectedIncident.status === 'PENDING'
                        ? 'Command center is currently reviewing priority and location.'
                        : 'Disaster hazard and response priority confirmed.'}
                    </div>
                  </div>

                  {/* Step 3: Responders Dispatched */}
                  <div className="srq-stepper-node">
                    <div className={`srq-node-icon-wrap ${
                      selectedIncident.status === 'DISPATCHED'
                        ? 'active'
                        : (selectedIncident.status === 'RESOLVED' ? 'completed' : '')
                    }`}>
                      {selectedIncident.status === 'RESOLVED' ? (
                        <Check size={18} strokeWidth={3} />
                      ) : (
                        <ShieldCheck size={18} />
                      )}
                    </div>
                    <div style={{ fontSize: 13.5, fontWeight: 800, color: '#0F172A' }}>
                      Responders Dispatched
                    </div>
                    <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2 }}>
                      {selectedIncident.assignedDepartment
                        ? `Unit: ${selectedIncident.assignedDepartment} mobilized`
                        : (selectedIncident.status === 'DISPATCHED' ? 'Nearest emergency response team en route' : 'Awaiting team deployment')}
                    </div>
                  </div>

                  {/* Step 4: On-Scene Operations */}
                  <div className="srq-stepper-node">
                    <div className={`srq-node-icon-wrap ${
                      selectedIncident.status === 'RESOLVED' ? 'completed' : ''
                    }`}>
                      {selectedIncident.status === 'RESOLVED' ? (
                        <Check size={18} strokeWidth={3} />
                      ) : (
                        <MapPin size={18} />
                      )}
                    </div>
                    <div style={{ fontSize: 13.5, fontWeight: 800, color: '#0F172A' }}>
                      On-Scene Arrival
                    </div>
                    <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2 }}>
                      {selectedIncident.status === 'RESOLVED'
                        ? 'Responders arrived on-site and rendered emergency assistance.'
                        : 'Emergency personnel arriving at your location.'}
                    </div>
                  </div>

                  {/* Step 5: Incident Resolved */}
                  <div className="srq-stepper-node">
                    <div className={`srq-node-icon-wrap ${
                      selectedIncident.status === 'RESOLVED' ? 'completed' : ''
                    }`}>
                      <CheckCircle2 size={18} />
                    </div>
                    <div style={{ fontSize: 13.5, fontWeight: 800, color: '#0F172A' }}>
                      Incident Resolved & Safe
                    </div>
                    <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2 }}>
                      {selectedIncident.status === 'RESOLVED'
                        ? 'Emergency operation completed and verified by MDRRMO.'
                        : 'Final resolution and safety clearance.'}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Incident Details Card */}
            <div style={{
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: 18,
              padding: 14,
              display: 'flex',
              gap: 12,
              alignItems: 'center',
              margin: '16px 0 12px',
            }}>
              {selectedIncident.photoUrl ? (
                <img
                  src={selectedIncident.photoUrl}
                  alt="Incident Scene"
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 12,
                    objectFit: 'cover',
                    border: '1.5px solid #CBD5E1',
                    flexShrink: 0,
                  }}
                />
              ) : (
                <div style={{
                  width: 60,
                  height: 60,
                  borderRadius: 12,
                  background: '#EFF6FF',
                  color: '#2563EB',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <AlertTriangle size={24} />
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>
                  {selectedIncident.latitude && selectedIncident.longitude
                    ? getNearestBarangay(selectedIncident.latitude, selectedIncident.longitude)
                    : 'Balayan, Batangas'}
                </div>
                <div style={{ fontSize: 11, color: '#64748B', marginTop: 3 }}>
                  GPS: {selectedIncident.latitude?.toFixed(4)}, {selectedIncident.longitude?.toFixed(4)}
                </div>
                {selectedIncident.adminNotes && (
                  <div style={{ fontSize: 11.5, color: '#475569', marginTop: 4, fontStyle: 'italic' }}>
                    "{selectedIncident.adminNotes}"
                  </div>
                )}
              </div>
            </div>

            {/* ── ACTIVITY TIMELINE ── */}
            <div style={{
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: 18,
              padding: '16px 14px',
              margin: '12px 0 16px',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 14,
                paddingBottom: 8,
                borderBottom: '1px solid #E2E8F0',
              }}>
                <div style={{ fontSize: 11.5, fontWeight: 900, color: '#0F172A', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  ACTIVITY TIMELINE
                </div>
                <span style={{
                  fontSize: 10,
                  fontWeight: 800,
                  color: '#2563EB',
                  background: '#EFF6FF',
                  border: '1px solid #DBEAFE',
                  padding: '2px 8px',
                  borderRadius: 6,
                }}>
                  {(() => {
                    const activities = selectedIncident.activities && selectedIncident.activities.length > 0
                      ? selectedIncident.activities
                      : [
                          { id: '1', title: `Incident reported by ${selectedIncident.reporter?.name || 'Citizen'} via mobile app`, createdAt: selectedIncident.createdAt },
                          ...(selectedIncident.aiDetectedType && selectedIncident.aiDetectedType !== 'Processing...' ? [{ id: '2', title: `AI analysis completed — ${selectedIncident.aiDetectedType.toUpperCase()} detected`, createdAt: new Date(new Date(selectedIncident.createdAt).getTime() + 3000).toISOString() }] : []),
                          ...(selectedIncident.aiRecommendedDept ? [{ id: '3', title: `Auto-assigned to ${selectedIncident.aiRecommendedDept} based on AI recommendation`, createdAt: new Date(new Date(selectedIncident.createdAt).getTime() + 5000).toISOString() }] : []),
                          ...(selectedIncident.status !== 'PENDING' ? [{ id: '4', title: `Status changed to ${selectedIncident.status}`, createdAt: selectedIncident.updatedAt }] : []),
                          ...(selectedIncident.adminNotes ? [{ id: '5', title: `Admin note: "${selectedIncident.adminNotes}"`, createdAt: selectedIncident.updatedAt }] : []),
                        ];
                    return `${activities.length} Events`;
                  })()}
                </span>
              </div>

              <div style={{ position: 'relative', paddingLeft: 18 }}>
                <div style={{
                  position: 'absolute',
                  left: 4,
                  top: 6,
                  bottom: 8,
                  width: 2,
                  background: '#CBD5E1',
                }} />

                {(() => {
                  const formatTimelineDate = (dateInput: string | Date) => {
                    const d = new Date(dateInput);
                    if (isNaN(d.getTime())) return '';
                    const datePart = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                    const timePart = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
                    return `${datePart} • ${timePart}`;
                  };

                  const activities: Array<{ id: string; title: string; description?: string; createdAt: string }> =
                    selectedIncident.activities && selectedIncident.activities.length > 0
                      ? selectedIncident.activities
                      : [
                          { id: '1', title: `Incident reported by ${selectedIncident.reporter?.name || 'Citizen'} via mobile app`, description: undefined, createdAt: selectedIncident.createdAt },
                          ...(selectedIncident.aiDetectedType && selectedIncident.aiDetectedType !== 'Processing...' ? [{ id: '2', title: `AI analysis completed — ${selectedIncident.aiDetectedType.toUpperCase()} detected`, description: undefined, createdAt: new Date(new Date(selectedIncident.createdAt).getTime() + 3000).toISOString() }] : []),
                          ...(selectedIncident.aiRecommendedDept ? [{ id: '3', title: `Auto-assigned to ${selectedIncident.aiRecommendedDept} based on AI recommendation`, description: undefined, createdAt: new Date(new Date(selectedIncident.createdAt).getTime() + 5000).toISOString() }] : []),
                          ...(selectedIncident.status !== 'PENDING' ? [{ id: '4', title: `Status changed to ${selectedIncident.status}`, description: undefined, createdAt: selectedIncident.updatedAt }] : []),
                          ...(selectedIncident.adminNotes ? [{ id: '5', title: `Admin note: "${selectedIncident.adminNotes}"`, description: undefined, createdAt: selectedIncident.updatedAt }] : []),
                        ];

                  return activities.map((item, idx) => (
                    <div key={item.id || idx} style={{ position: 'relative', marginBottom: idx === activities.length - 1 ? 0 : 16 }}>
                      <div style={{
                        position: 'absolute',
                        left: -18,
                        top: 3,
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: '#2563EB',
                        border: '2px solid white',
                        boxShadow: '0 0 0 1px #93C5FD',
                      }} />
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span style={{ color: '#2563EB', fontSize: 12 }}>●</span>
                        <span>{formatTimelineDate(item.createdAt)}</span>
                      </div>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A', marginTop: 3, lineHeight: 1.45 }}>
                        {item.title}
                      </div>
                      {item.description && (
                        <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2, fontStyle: 'italic' }}>
                          {item.description}
                        </div>
                      )}
                    </div>
                  ));
                })()}
              </div>
            </div>

            {/* Direct Call Command Center Action */}
            <a
              href="tel:09171234567"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                width: '100%',
                padding: '14px 20px',
                borderRadius: 14,
                background: '#DC2626',
                color: 'white',
                textDecoration: 'none',
                fontSize: 14,
                fontWeight: 800,
                letterSpacing: '0.02em',
                boxShadow: '0 4px 14px rgba(220, 38, 38, 0.35)',
                boxSizing: 'border-box',
              }}
            >
              <Phone size={16} />
              <span>Call MDRRMO Balayan (0917-123-4567)</span>
            </a>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
