import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, MapPin, RefreshCw, ChevronLeft, Loader2, CheckCircle2, Clock, ShieldCheck, XCircle, AlertTriangle, PlusCircle } from 'lucide-react';
import { getMyIncidents, getIncidents } from '../../api/client';
import type { Incident, Status } from '../../types';
import BottomNav from '../../components/BottomNav';
import FcmBannerOverlay from '../../components/FcmBannerOverlay';
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

const FILTER_TABS = ['ALL', 'PENDING', 'DISPATCHED', 'RESOLVED', 'REJECTED'] as const;
type FilterTab = typeof FILTER_TABS[number];

const PAGE_SIZE = 6;

export default function MobileHistory() {
  const navigate = useNavigate();
  const [allIncidents, setAllIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [statusFilter, setStatusFilter] = useState<FilterTab>('ALL');
  const [page, setPage] = useState(1);

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

  const updatePullDistance = (val: number) => {
    pullDistanceRef.current = val;
    setPullDistance(val);
  };

  useEffect(() => {
    refreshingRef.current = refreshing;
  }, [refreshing]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
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
    } catch {
      setAllIncidents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHistory(); }, []);

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
      if (!isPullingRef.current || refreshingRef.current) return;
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
    if (window.scrollY === 0 && !refreshingRef.current) {
      startYRef.current = e.touches[0].clientY;
      isPullingRef.current = true;
      setIsPulling(true);
    }
  };

  const handleTouchEnd = async () => {
    if (!isPullingRef.current) return;
    isPullingRef.current = false;
    setIsPulling(false);

    if (pullDistanceRef.current > 60) {
      setRefreshing(true);
      updatePullDistance(50);
      await fetchHistory();
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
          background: white;
          border: 1px solid #E2E8F0;
          color: #475569;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.15s ease;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .mh-filter-chip.active {
          background: #0F2942;
          border-color: #0F2942;
          color: white;
          box-shadow: 0 2px 8px rgba(15,41,66,0.25);
        }
        .mh-chip-count {
          font-size: 10px;
          padding: 1px 6px;
          border-radius: 8px;
          background: rgba(0,0,0,0.06);
        }
        .mh-filter-chip.active .mh-chip-count {
          background: rgba(255,255,255,0.2);
          color: white;
        }
        .mh-history-card {
          background: white;
          border-radius: 18px;
          padding: 16px;
          margin-bottom: 12px;
          border: 1px solid rgba(226,232,240,0.8);
          box-shadow: 0 2px 10px rgba(15,23,42,0.04);
          transition: transform 0.15s ease;
        }
        .mh-history-card:active {
          transform: scale(0.985);
        }
      `}</style>

      <div className="mobile-page" style={{ paddingBottom: 90 }}>
        {/* Pull-to-refresh Indicator */}
        <div style={{
          height: pullDistance > 0 || refreshing ? Math.max(pullDistance, refreshing ? 50 : 0) : 0,
          opacity: pullDistance > 0 || refreshing ? 1 : 0,
          transition: isPulling ? 'none' : 'height 0.2s ease, opacity 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          background: 'rgba(37, 99, 235, 0.05)',
          borderBottom: pullDistance > 0 || refreshing ? '1px solid var(--border-light)' : 'none',
          color: 'var(--text-secondary)',
          fontSize: 13,
          fontWeight: 600,
          gap: 8,
          margin: '0 -24px',
          borderRadius: '0 0 16px 16px',
        }}>
          <RefreshCw
            size={16}
            className={refreshing ? "spin" : ""}
            style={{
              transform: refreshing ? undefined : `rotate(${pullDistance * 3}deg)`,
              transition: refreshing ? undefined : 'transform 0.1s linear'
            }}
          />
          <span>{refreshing ? 'Syncing...' : pullDistance > 60 ? 'Release to refresh' : 'Pull down to refresh'}</span>
        </div>

        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #0F2942 0%, #1E3A5F 100%)',
          margin: '0 -24px 16px',
          padding: '18px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          color: 'white',
          boxShadow: '0 4px 16px rgba(15, 41, 66, 0.18)',
        }}>
          <button 
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
              cursor: 'pointer',
              color: 'white',
              padding: 0,
            }}
            aria-label="Back"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: 'white', letterSpacing: '-0.2px' }}>Report History</h1>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', margin: '2px 0 0' }}>Track all your emergency requests</p>
          </div>
        </div>

        {/* ── Status Filter Chips ── */}
        <div style={{
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          margin: '0 -24px 16px',
          padding: '0 24px 4px',
          scrollbarWidth: 'none',
        }}>
          {FILTER_TABS.map(tab => {
            const isActive = statusFilter === tab;
            const count = tab === 'ALL' ? allIncidents.length : (countsByStatus[tab] || 0);
            return (
              <button
                key={tab}
                className={`mh-filter-chip ${isActive ? 'active' : ''}`}
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
                <div className="mh-history-card" key={inc.id}>
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
                    {inc.assignedDepartment && (
                      <div style={{ fontWeight: 700, color: '#2563EB' }}>
                        Unit: {inc.assignedDepartment}
                      </div>
                    )}
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
      <BottomNav />
      <FcmBannerOverlay />
    </div>
  );
}
