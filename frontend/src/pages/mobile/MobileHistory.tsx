import { useState, useEffect } from 'react';
import { AlertCircle, MapPin, RefreshCw } from 'lucide-react';
import { getMyIncidents, getIncidents } from '../../api/client';
import type { Incident, Status } from '../../types';
import BottomNav from '../../components/BottomNav';

const badgeClass: Record<Status, string> = {
  PENDING: 'pending',
  REVIEWING: 'pending',
  DISPATCHED: 'dispatched',
  RESOLVED: 'resolved',
  REJECTED: 'pending',
};

const dotColors: Record<string, string> = {
  Fire: '#EF4444',
  Flood: '#3B82F6',
  Earthquake: '#F59E0B',
  default: '#D97706',
};

export default function MobileHistory() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const userId = localStorage.getItem('userId');
      let res;

      if (userId) {
        // Fetch only this user's reports
        res = await getMyIncidents(userId);
      } else {
        // Fallback: fetch all incidents (for demo/testing without login)
        res = await getIncidents();
      }

      setIncidents(res.data);
    } catch {
      // If backend is down, show empty state
      setIncidents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <div className="mobile-shell">
      <div className="mobile-page">
        <div style={{ padding: '20px 0 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800 }}>Report History</h1>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Track your active and past alerts</p>
          </div>
          <button
            onClick={fetchHistory}
            style={{
              background: 'var(--bg-body)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: 10,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <RefreshCw size={18} color="var(--text-secondary)" />
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
            <div className="spin" style={{ display: 'inline-block' }}><RefreshCw size={28} /></div>
            <p style={{ marginTop: 12 }}>Loading your reports...</p>
          </div>
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
                          ? `${inc.latitude.toFixed(4)}, ${inc.longitude.toFixed(4)}`
                          : 'Location unavailable'}
                      </div>
                    </div>
                  </div>
                  <div className="history-card-bottom">
                    <div>
                      <div className="reported-on">Reported on</div>
                      <div className="reported-date">
                        {new Date(inc.createdAt).toLocaleDateString()} •{' '}
                        {new Date(inc.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <span className={`mobile-badge ${badgeClass[inc.status]}`}>{inc.status}</span>
                  </div>
                  {inc.aiRecommendedDept && (
                    <div style={{
                      marginTop: 10,
                      paddingTop: 10,
                      borderTop: '1px solid var(--border-light)',
                      fontSize: 12,
                      color: 'var(--text-secondary)',
                    }}>
                      Routed to: <strong style={{ color: 'var(--text-primary)' }}>{inc.aiRecommendedDept}</strong>
                    </div>
                  )}
                </div>
              );
            })}
            {incidents.length === 0 && (
              <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
                <p style={{ fontSize: 48, marginBottom: 12 }}>📋</p>
                <h3 style={{ fontWeight: 700, marginBottom: 4, color: 'var(--text-primary)' }}>No reports yet</h3>
                <p>Submitted emergency alerts will appear here</p>
              </div>
            )}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
