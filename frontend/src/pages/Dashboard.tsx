import { useState, useEffect } from 'react';
import Header from '../components/Header';
import { AlertTriangle, Clock, Truck, CheckCircle, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { Incident, Status } from '../types';
import { getIncidents, getIncidentStats } from '../api/client';

// Chart data (analytics trend — this stays as-is since there's no analytics endpoint yet)
const chartData = [
  { month: 'Jan', Fire: 12, Flood: 8, Earthquake: 2, Other: 4 },
  { month: 'Feb', Fire: 15, Flood: 5, Earthquake: 1, Other: 6 },
  { month: 'Mar', Fire: 10, Flood: 12, Earthquake: 3, Other: 5 },
  { month: 'Apr', Fire: 8, Flood: 18, Earthquake: 0, Other: 3 },
  { month: 'May', Fire: 14, Flood: 10, Earthquake: 1, Other: 7 },
  { month: 'Jun', Fire: 20, Flood: 6, Earthquake: 2, Other: 4 },
];

const statusColor: Record<Status, string> = {
  PENDING: 'pending',
  REVIEWING: 'reviewing',
  DISPATCHED: 'dispatched',
  RESOLVED: 'resolved',
  REJECTED: 'rejected',
};

export default function Dashboard() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, dispatched: 0, resolved: 0 });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [incRes, statsRes] = await Promise.all([
        getIncidents(),
        getIncidentStats().catch(() => null),
      ]);

      setIncidents(incRes.data);

      if (statsRes) {
        const s = statsRes.data;
        setStats({ total: s.total, pending: s.pending, dispatched: s.dispatched, resolved: s.resolved });
      } else {
        // Compute stats from incidents if stats endpoint fails
        const d = incRes.data;
        setStats({
          total: d.length,
          pending: d.filter((i: Incident) => i.status === 'PENDING').length,
          dispatched: d.filter((i: Incident) => i.status === 'DISPATCHED').length,
          resolved: d.filter((i: Incident) => i.status === 'RESOLVED').length,
        });
      }
    } catch {
      setIncidents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Auto-refresh every 10 seconds
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <Header title="Dashboard" subtitle="Real-time overview of disaster incidents" />
      <div className="page-content">
        {/* Stats Cards */}
        <div className="stats-grid fade-in">
          <div className="stat-card">
            <div className="stat-info">
              <h3>Total Incidents</h3>
              <div className="stat-value">{stats.total}</div>
              <div className="stat-change up"><TrendingUp size={14} /> Live from database</div>
            </div>
            <div className="stat-icon blue"><AlertTriangle size={22} /></div>
          </div>
          <div className="stat-card">
            <div className="stat-info">
              <h3>Pending</h3>
              <div className="stat-value">{stats.pending}</div>
              <div className="stat-change up"><TrendingUp size={14} /> Needs attention</div>
            </div>
            <div className="stat-icon yellow"><Clock size={22} /></div>
          </div>
          <div className="stat-card">
            <div className="stat-info">
              <h3>Dispatched</h3>
              <div className="stat-value">{stats.dispatched}</div>
              <div className="stat-change down"><TrendingDown size={14} /> Active responses</div>
            </div>
            <div className="stat-icon purple"><Truck size={22} /></div>
          </div>
          <div className="stat-card">
            <div className="stat-info">
              <h3>Resolved</h3>
              <div className="stat-value">{stats.resolved}</div>
              <div className="stat-change up"><TrendingUp size={14} /> Completed</div>
            </div>
            <div className="stat-icon green"><CheckCircle size={22} /></div>
          </div>
        </div>

        {/* Chart + Recent Activity */}
        <div className="grid-3-1 fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="card">
            <div className="card-header">
              <h3>Incident Trends</h3>
              <select className="filter-select">
                <option>Last 6 Months</option>
                <option>Last 12 Months</option>
                <option>This Year</option>
              </select>
            </div>
            <div className="card-body">
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} />
                    <YAxis tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} />
                    <Tooltip
                      contentStyle={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '13px',
                      }}
                    />
                    <Legend />
                    <Bar dataKey="Fire" fill="#EF4444" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Flood" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Earthquake" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Other" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Recent Incidents — from database */}
          <div className="card">
            <div className="card-header">
              <h3>Recent Activity</h3>
              <button
                onClick={fetchData}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <RefreshCw size={16} />
              </button>
            </div>
            <div style={{ padding: 0 }}>
              {loading && incidents.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                  <div className="spin" style={{ display: 'inline-block', marginBottom: 8 }}><RefreshCw size={20} /></div>
                  <p>Loading from database...</p>
                </div>
              ) : incidents.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                  <p style={{ fontSize: 28, marginBottom: 8 }}>📋</p>
                  <p>No incidents yet. Mobile reports will appear here.</p>
                </div>
              ) : (
                incidents.slice(0, 8).map((inc) => (
                  <div
                    key={inc.id}
                    style={{
                      padding: '14px 20px',
                      borderBottom: '1px solid var(--border-light)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '13px' }}>
                        {inc.aiDetectedType || 'Unidentified'}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {new Date(inc.createdAt).toLocaleTimeString()} — {inc.aiRecommendedDept || ''}
                      </div>
                    </div>
                    <span className={`badge ${statusColor[inc.status]}`}>
                      {inc.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
