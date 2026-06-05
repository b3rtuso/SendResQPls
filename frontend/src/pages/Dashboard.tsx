import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import {
  AlertTriangle, Clock, Truck, CheckCircle,
  RefreshCw, ArrowRight, Phone, Flame,
  Stethoscope, HardHat, Anchor, ShieldCheck,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { Incident, Status } from '../types';
import { getIncidents, getIncidentStats } from '../api/client';
import { getNearestBarangay } from '../data/balayan-data';

const chartData = [
  { month: 'Jan', Fire: 12, Flood: 8, Accident: 4 },
  { month: 'Feb', Fire: 15, Flood: 5, Accident: 6 },
  { month: 'Mar', Fire: 10, Flood: 12, Accident: 5 },
  { month: 'Apr', Fire: 8,  Flood: 18, Accident: 3 },
  { month: 'May', Fire: 14, Flood: 10, Accident: 7 },
  { month: 'Jun', Fire: 20, Flood: 6,  Accident: 4 },
];

const DEPARTMENTS = [
  { label: 'BFP',         sub: 'Bureau of Fire Protection', icon: Flame,       color: '#EA580C', bg: '#FFF7ED', tel: 'tel:160' },
  { label: 'PNP',         sub: 'Philippine National Police', icon: ShieldCheck, color: '#2563EB', bg: '#EFF6FF', tel: 'tel:117' },
  { label: 'Medical',     sub: 'EMS / Health Services',      icon: Stethoscope, color: '#DC2626', bg: '#FEF2F2', tel: 'tel:911' },
  { label: 'Engineering', sub: 'Public Works & Infra',       icon: HardHat,     color: '#CA8A04', bg: '#FEFCE8', tel: 'tel:' },
  { label: 'Rescue',      sub: 'Search & Rescue Team',       icon: Anchor,      color: '#059669', bg: '#ECFDF5', tel: 'tel:' },
];

const STATUS_STYLE: Record<Status, { bg: string; color: string; label: string }> = {
  PENDING:    { bg: '#FEF3C7', color: '#92400E', label: 'PENDING'    },
  REVIEWING:  { bg: '#DBEAFE', color: '#1E40AF', label: 'REVIEWING'  },
  DISPATCHED: { bg: '#EDE9FE', color: '#5B21B6', label: 'DISPATCHED' },
  RESOLVED:   { bg: '#DCFCE7', color: '#14532D', label: 'RESOLVED'   },
  REJECTED:   { bg: '#FEE2E2', color: '#7F1D1D', label: 'REJECTED'   },
};

const TYPE_ICON: Record<string, { emoji: string; color: string }> = {
  'Fire':               { emoji: '🔥', color: '#DC2626' },
  'Flood':              { emoji: '🌊', color: '#3B82F6' },
  'Medical':            { emoji: '🏥', color: '#22C55E' },
  'Accident':           { emoji: '🚗', color: '#F59E0B' },
  'Typhoon':            { emoji: '🌀', color: '#8B5CF6' },
  'Landslide':          { emoji: '⛰️', color: '#78716C' },
};

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function Dashboard() {
  const navigate = useNavigate();
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
        const d = incRes.data;
        setStats({
          total: d.length,
          pending:    d.filter((i: Incident) => i.status === 'PENDING').length,
          dispatched: d.filter((i: Incident) => i.status === 'DISPATCHED').length,
          resolved:   d.filter((i: Incident) => i.status === 'RESOLVED').length,
        });
      }
    } catch { setIncidents([]); }
    finally  { setLoading(false); }
  };

  useEffect(() => {
    fetchData();
    const iv = setInterval(fetchData, 10000);
    return () => clearInterval(iv);
  }, []);

  const pendingCount = stats.pending;

  const STAT_CARDS = [
    { label: 'Total Reports',   value: stats.total,      accent: '#2563EB', icon: AlertTriangle },
    { label: 'Pending',         value: stats.pending,    accent: '#F59E0B', icon: Clock         },
    { label: 'Dispatched',      value: stats.dispatched, accent: '#8B5CF6', icon: Truck         },
    { label: 'Resolved Today',  value: stats.resolved,   accent: '#22C55E', icon: CheckCircle   },
  ];

  return (
    <>
      <Header title="Dashboard" subtitle="Real-time overview of disaster incidents" />
      <div className="page-content" style={{ paddingTop: 8 }}>

        {/* ── Emergency Banner ─────────────────────────────── */}
        {pendingCount > 0 && (
          <div className="fade-in" style={{
            marginBottom: 24,
            background: 'linear-gradient(135deg, #DC2626 0%, #EA580C 100%)',
            borderRadius: 14, padding: '18px 24px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            boxShadow: '0 4px 20px rgba(220,38,38,0.3)',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, zIndex: 1 }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                background: 'rgba(255,255,255,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                animation: 'pulse 2s infinite',
              }}>
                <AlertTriangle size={24} color="white" />
              </div>
              <div>
                <div style={{ color: 'white', fontWeight: 800, fontSize: 16, letterSpacing: '-0.2px' }}>
                  ACTIVE EMERGENCIES: {pendingCount} report{pendingCount !== 1 ? 's' : ''} need attention
                </div>
                <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 2 }}>
                  Critical incidents reported recently — dispatch pending
                </div>
              </div>
            </div>
            <button
              onClick={() => navigate('/requests')}
              style={{
                zIndex: 1, background: 'white', color: '#DC2626',
                border: 'none', borderRadius: 10, padding: '10px 20px',
                fontWeight: 700, fontSize: 14, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)', fontFamily: 'inherit',
                transition: 'transform 0.15s',
                flexShrink: 0,
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              View All <ArrowRight size={16} />
            </button>
            {/* Decorative skew strip */}
            <div style={{ position: 'absolute', right: -20, top: 0, width: 120, height: '100%', background: 'rgba(255,255,255,0.05)', transform: 'skewX(-12deg)' }} />
          </div>
        )}

        {/* ── Stat Cards ───────────────────────────────────── */}
        <div className="stats-grid fade-in" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: 18, marginBottom: 24 }}>
          {STAT_CARDS.map(({ label, value, accent, icon: Icon }) => (
            <div key={label} style={{
              background: 'white', borderRadius: 14, padding: '22px 22px',
              borderLeft: `4px solid ${accent}`,
              boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
              display: 'flex', flexDirection: 'column',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                    {label}
                  </div>
                  <div style={{ fontSize: 38, fontWeight: 900, color: '#0F172A', lineHeight: 1, letterSpacing: '-1px' }}>
                    {loading ? '—' : value}
                  </div>
                </div>
                <Icon size={28} style={{ color: accent, opacity: 0.18, marginTop: 4 }} />
              </div>
            </div>
          ))}
        </div>

        {/* ── Two-column: incidents table + departments ─────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 24 }}>

          {/* Recent Incidents */}
          <div style={{ background: 'white', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden', border: '1px solid #F1F5F9' }}>
            <div style={{ padding: '18px 22px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontWeight: 700, fontSize: 16, color: '#0F172A' }}>Recent Incidents</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={fetchData} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 4, display: 'flex' }}>
                  <RefreshCw size={16} />
                </button>
                <button onClick={() => navigate('/requests')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2563EB', fontSize: 13, fontWeight: 600, padding: '4px 8px', borderRadius: 6, fontFamily: 'inherit' }}>
                  View All →
                </button>
              </div>
            </div>
            {loading && incidents.length === 0 ? (
              <div style={{ padding: 48, textAlign: 'center', color: '#94A3B8' }}>
                <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }} />
                <div style={{ marginTop: 8, fontSize: 13 }}>Loading incidents…</div>
              </div>
            ) : incidents.length === 0 ? (
              <div style={{ padding: 48, textAlign: 'center', color: '#94A3B8' }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>📋</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>No incidents yet</div>
                <div style={{ fontSize: 13, marginTop: 4 }}>Mobile reports will appear here automatically.</div>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC' }}>
                      {['ID', 'Type', 'Location', 'Status', 'Time', 'Action'].map(h => (
                        <th key={h} style={{ padding: '12px 18px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {incidents.slice(0, 8).map((inc, idx) => {
                      const ss = STATUS_STYLE[inc.status] || STATUS_STYLE.PENDING;
                      const ti = TYPE_ICON[inc.aiDetectedType || ''] || { emoji: '⚠️', color: '#64748B' };
                      return (
                        <tr key={inc.id} style={{ borderBottom: '1px solid #F8FAFC', background: idx % 2 === 0 ? 'white' : '#FAFBFC' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#EFF6FF'}
                          onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? 'white' : '#FAFBFC'}
                        >
                          <td style={{ padding: '14px 18px', fontFamily: 'monospace', fontSize: 11, color: '#94A3B8', whiteSpace: 'nowrap' }}>
                            #{inc.id.slice(0, 8).toUpperCase()}
                          </td>
                          <td style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>
                            <span style={{ marginRight: 6 }}>{ti.emoji}</span>
                            <span style={{ fontWeight: 600, color: '#1E293B' }}>{inc.aiDetectedType || 'Unknown'}</span>
                          </td>
                          <td style={{ padding: '14px 18px', color: '#475569', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {inc.latitude && inc.longitude
                              ? getNearestBarangay(inc.latitude, inc.longitude).split(',')[0]
                              : '—'}
                          </td>
                          <td style={{ padding: '14px 18px' }}>
                            <span style={{
                              padding: '4px 10px', borderRadius: 20,
                              background: ss.bg, color: ss.color,
                              fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
                            }}>
                              {ss.label}
                            </span>
                          </td>
                          <td style={{ padding: '14px 18px', color: '#94A3B8', fontStyle: 'italic', whiteSpace: 'nowrap' }}>
                            {timeAgo(inc.createdAt)}
                          </td>
                          <td style={{ padding: '14px 18px' }}>
                            <button
                              onClick={() => navigate(`/requests/${inc.id}`)}
                              style={{
                                padding: '6px 14px', borderRadius: 7,
                                background: '#2563EB', color: 'white',
                                border: 'none', fontSize: 12, fontWeight: 700,
                                cursor: 'pointer', fontFamily: 'inherit',
                                transition: 'background 0.15s',
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = '#1D4ED8'}
                              onMouseLeave={e => e.currentTarget.style.background = '#2563EB'}
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Department Activity */}
          <div style={{ background: 'white', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden', border: '1px solid #F1F5F9', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '18px 22px', borderBottom: '1px solid #F1F5F9', fontWeight: 700, fontSize: 16, color: '#0F172A' }}>
              Department Activity
            </div>
            <div style={{ padding: '12px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {DEPARTMENTS.map(({ label, sub, icon: Icon, color, bg, tel }) => (
                <div key={label} style={{
                  padding: '14px', borderRadius: 10, border: '1px solid #F1F5F9',
                  transition: 'border-color 0.15s',
                }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = '#BFDBFE')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = '#F1F5F9')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 38, height: 38, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon size={18} style={{ color }} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13, color: '#1E293B' }}>{label}</div>
                        <div style={{ fontSize: 10, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{sub}</div>
                      </div>
                    </div>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 6px #22C55E' }} />
                  </div>
                  <a href={tel} style={{ textDecoration: 'none', display: 'block' }}>
                    <button style={{
                      width: '100%', padding: '8px', borderRadius: 8,
                      background: '#F8FAFC', border: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      fontSize: 12, fontWeight: 700, color: '#475569',
                      transition: 'all 0.15s', fontFamily: 'inherit',
                    }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#2563EB'; e.currentTarget.style.color = 'white'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.color = '#475569'; }}
                    >
                      <Phone size={13} /> Call
                    </button>
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Incident Trend Chart ──────────────────────────── */}
        <div className="card fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="card-header">
            <h3 style={{ fontWeight: 700, fontSize: 16, color: '#0F172A' }}>Incident Trends</h3>
            <select className="filter-select">
              <option>Last 6 Months</option>
              <option>Last 12 Months</option>
              <option>This Year</option>
            </select>
          </div>
          <div className="card-body">
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barCategoryGap="35%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 10, fontSize: 13 }} />
                  <Legend />
                  <Bar dataKey="Fire"     fill="#EF4444" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Flood"    fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Accident" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

      </div>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
        @keyframes spin  { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}
