import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, MapPin, RefreshCw, ChevronLeft } from 'lucide-react';
import { getMyIncidents, getIncidents } from '../../api/client';
import type { Incident, Status } from '../../types';
import BottomNav from '../../components/BottomNav';
import FcmBannerOverlay from '../../components/FcmBannerOverlay';
import { getNearestBarangay } from '../../data/balayan-data';
import { MobileHistorySkeleton } from '../../components/PageLoader';

const badgeClass: Record<Status, string> = {
  PENDING: 'pending',
  REVIEWING: 'pending',
  DISPATCHED: 'dispatched',
  RESOLVED: 'resolved',
  REJECTED: 'pending',
};

const statusLabel: Record<Status, string> = {
  PENDING: 'Pending',
  REVIEWING: 'Reviewing',
  DISPATCHED: 'Dispatched',
  RESOLVED: 'Resolved',
  REJECTED: 'Rejected',
};

const dotColors: Record<string, string> = {
  Fire: '#EF4444',
  Flood: '#3B82F6',
  Earthquake: '#F59E0B',
  default: '#D97706',
};

export default function MobileHistory() {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  // Pull-to-refresh states & refs
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const startYRef = useRef(0);
  const isPullingRef = useRef(false);
  const refreshingRef = useRef(false);
  const pullDistanceRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

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
      setIncidents(res.data);
    } catch {
      setIncidents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHistory(); }, []);

  // Set up touchmove listener with passive: false so we can preventDefault
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPullingRef.current || refreshingRef.current) return;
      const currentY = e.touches[0].clientY;
      const deltaY = currentY - startYRef.current;

      // Only drag if scrolled to the very top
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

  return (
    <div
      className="mobile-shell"
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="mobile-page">
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
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: 'white', letterSpacing: '0.3px' }}>Report History</h1>
            <p style={{ fontSize: 11, opacity: 0.85, margin: '2px 0 0' }}>Track your active and past emergency reports</p>
          </div>
        </div>

        {loading ? (
          <MobileHistorySkeleton count={5} />
        ) : (
          <div className="history-list">
            {incidents.map((inc) => {
              const typeColor = dotColors[inc.aiDetectedType?.split(' ')[0] || ''] || dotColors.default;
              return (
                <div className="history-card" key={inc.id}>
                  <div className="history-card-top">
                    <div className="incident-dot" style={{ background: `${typeColor}15` }}>
                      <AlertCircle size={20} color={typeColor} />
                    </div>
                    <div className="incident-info">
                      <h4>{inc.aiDetectedType || 'Unidentified Emergency'}</h4>
                      <div className="location">
                        <MapPin size={12} />
                        {inc.latitude && inc.longitude
                          ? getNearestBarangay(inc.latitude, inc.longitude)
                          : 'Location not available'}
                      </div>
                    </div>
                  </div>
                  <div className="history-card-bottom">
                    <div>
                      <div className="reported-on">Reported on</div>
                      <div className="reported-date">
                        {new Date(inc.createdAt).toLocaleDateString('en-US')} •{' '}
                        {new Date(inc.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <span className={`mobile-badge ${badgeClass[inc.status]}`}>
                      {statusLabel[inc.status] || inc.status}
                    </span>
                  </div>
                  {inc.aiRecommendedDept && (
                    <div style={{
                      marginTop: 10, paddingTop: 10,
                      borderTop: '1px solid var(--border-light)',
                      fontSize: 12, color: 'var(--text-secondary)',
                    }}>
                      Assigned to: <strong style={{ color: 'var(--text-primary)' }}>{inc.aiRecommendedDept}</strong>
                    </div>
                  )}
                </div>
              );
            })}
            {incidents.length === 0 && (
              <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
                <h3 style={{ fontWeight: 700, marginBottom: 4, color: 'var(--text-primary)' }}>No reports yet</h3>
                <p>Your submitted emergency alerts will appear here</p>
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
