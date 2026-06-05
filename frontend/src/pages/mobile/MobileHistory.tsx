import { useState, useEffect } from 'react';
import { AlertCircle, MapPin, RefreshCw } from 'lucide-react';
import { getMyIncidents, getIncidents } from '../../api/client';
import type { Incident, Status } from '../../types';
import BottomNav from '../../components/BottomNav';
import { getNearestBarangay } from '../../data/balayan-data';

const badgeClass: Record<Status, string> = {
  PENDING: 'pending',
  REVIEWING: 'pending',
  DISPATCHED: 'dispatched',
  RESOLVED: 'resolved',
  REJECTED: 'pending',
};

const statusLabel: Record<Status, string> = {
  PENDING: 'Naghihintay',
  REVIEWING: 'Nire-review',
  DISPATCHED: 'Naka-dispatch',
  RESOLVED: 'Naresolba',
  REJECTED: 'Na-reject',
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

  return (
    <div className="mobile-shell">
      <div className="mobile-page">
        <div style={{ padding: '20px 0 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800 }}>History ng Reports</h1>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Subaybayan ang iyong mga active at nakaraang alert</p>
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
            aria-label="I-refresh"
          >
            <RefreshCw size={18} color="var(--text-secondary)" />
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
            <div className="spin" style={{ display: 'inline-block' }}><RefreshCw size={28} /></div>
            <p style={{ marginTop: 12 }}>Kino-load ang iyong mga report...</p>
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
                      <h4>{inc.aiDetectedType || 'Hindi na-identify na Emergency'}</h4>
                      <div className="location">
                        <MapPin size={12} />
                        {inc.latitude && inc.longitude
                          ? getNearestBarangay(inc.latitude, inc.longitude)
                          : 'Hindi available ang lokasyon'}
                      </div>
                    </div>
                  </div>
                  <div className="history-card-bottom">
                    <div>
                      <div className="reported-on">Na-report noong</div>
                      <div className="reported-date">
                        {new Date(inc.createdAt).toLocaleDateString('fil-PH')} •{' '}
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
                      Naipadala sa: <strong style={{ color: 'var(--text-primary)' }}>{inc.aiRecommendedDept}</strong>
                    </div>
                  )}
                </div>
              );
            })}
            {incidents.length === 0 && (
              <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
                <p style={{ fontSize: 48, marginBottom: 12 }}>📋</p>
                <h3 style={{ fontWeight: 700, marginBottom: 4, color: 'var(--text-primary)' }}>Wala pang report</h3>
                <p>Ang mga na-submit na emergency alert ay lalabas dito</p>
              </div>
            )}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
