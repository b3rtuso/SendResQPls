import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { DashboardSkeleton } from '../components/PageLoader';
import {
  AlertTriangle, RefreshCw, ArrowRight, Phone, Flame,
  Stethoscope, HardHat, Anchor, ShieldCheck, Clock,
  TrendingUp, TrendingDown, Minus, Calculator, X, ExternalLink,
  Info, Sparkles,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import type { Incident, Status } from '../types';
import { getIncidents, getIncidentStats, invalidateCache } from '../api/client';
import { getNearestBarangay } from '../data/balayan-data';
import { normalizeIncidentType } from '../utils/normalizeIncidentType';
import { dashboardChartData, monthlyByType2024, monthlyByType2025, yearlyTotals, monthlyDetails } from '../data/mdrrmo-data';

const DEPARTMENTS = [
  { label: 'BFP',         sub: 'Bureau of Fire Protection', icon: Flame,       color: '#EF4444', bg: '#FEF2F2', tel: 'tel:(043) 211-6387' },
  { label: 'PNP',         sub: 'Philippine National Police', icon: ShieldCheck, color: '#3B82F6', bg: '#EFF6FF', tel: 'tel:(043) 211-4325' },
  { label: 'Medical',     sub: 'EMS / Health Services',      icon: Stethoscope, color: '#22C55E', bg: '#ECFDF5', tel: 'tel:(043) 911-0012' },
  { label: 'Engineering', sub: 'Public Works & Infra',       icon: HardHat,     color: '#F59E0B', bg: '#FEFCE8', tel: 'tel:(043) 211-5678' },
  { label: 'Rescue',      sub: 'Search & Rescue Team',       icon: Anchor,      color: '#8B5CF6', bg: '#F5F3FF', tel: 'tel:(043) 211-1234' },
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
  'Trauma':             { emoji: '🩹', color: '#F59E0B' },
  'Accident':           { emoji: '🚗', color: '#3B82F6' },
  'Crime':              { emoji: '🚨', color: '#8B5CF6' },
  'Typhoon':            { emoji: '🌀', color: '#8B5CF6' },
  'Landslide':          { emoji: '⛰️', color: '#78716C' },
};

const DONUT_COLORS: Record<string, string> = {
  'Fire': '#EF4444',
  'Flood': '#3B82F6',
  'Medical': '#22C55E',
  'Accident': '#3B82F6',
  'Trauma': '#F59E0B',
  'Typhoon': '#8B5CF6',
  'Landslide': '#78716C',
  'Crime': '#8B5CF6',
  'Other': '#94A3B8',
};

const defaultColor = '#64748B';

// ── Count-up animation hook ──────────────────────────────────────────
function useCountUp(target: number, duration = 900) {
  const [count, setCount] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (target === 0) { setCount(0); return; }
    startRef.current = null;
    const step = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);

  return count;
}

function StatValue({ value }: { value: number }) {
  const displayed = useCountUp(value);
  return (
    <div style={{ fontSize: 36, fontWeight: 900, color: '#0F172A', lineHeight: 1, letterSpacing: '-1px' }}>
      {displayed}
    </div>
  );
}

// ── Trend badge component ─────────────────────────────────────────────
function TrendBadge({ value }: { value: number }) {
  const isUp = value > 0;
  const isFlat = value === 0;
  const Icon = isFlat ? Minus : isUp ? TrendingUp : TrendingDown;
  const color = isFlat ? '#94A3B8' : isUp ? '#EF4444' : '#22C55E';
  const text = isFlat ? 'Same as yesterday' : `${isUp ? '+' : ''}${value} vs yesterday`;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8, fontSize: 11, fontWeight: 700, color }}>
      <Icon size={12} />
      <span>{text}</span>
    </div>
  );
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'rgba(15, 23, 42, 0.92)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 12,
        padding: '10px 14px',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.3)',
        color: 'white',
      }}>
        {label && <p style={{ margin: 0, fontWeight: 700, fontSize: 13, marginBottom: 6 }}>{label}</p>}
        {payload.map((p: any) => (
          <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.fill || p.color }} />
            <span style={{ textTransform: 'capitalize' }}>{p.name}:</span>
            <strong style={{ marginLeft: 'auto', color: 'white' }}>{p.value}</strong>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, dispatched: 0, resolved: 0 });
  const [prevStats, setPrevStats] = useState({ total: 0, pending: 0, dispatched: 0, resolved: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<Status | 'ALL'>('ALL');
  const [dashboardYear, setDashboardYear] = useState<string>(String(new Date().getFullYear()));
  const [activeDonutIndex, setActiveDonutIndex] = useState<number | null>(null);
  const [showComputationModal, setShowComputationModal] = useState(false);

  // Live operational clock & dynamic dispatcher greeting
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hour = time.getHours();
    if (hour >= 5 && hour < 12) return 'Good morning';
    if (hour >= 12 && hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const adminName = localStorage.getItem('userName') || 'MDRRMO Balayan Admin';
  const greetingText = getGreeting();

  const handleManualRefresh = async () => {
    setRefreshing(true);
    invalidateCache('incidents');
    await fetchData();
    setRefreshing(false);
  };

  // Map each year to its monthly breakdown dataset
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const YEAR_CHART_DATA: Record<string, any[]> = {
    '2024': monthlyByType2024,
    '2025': monthlyByType2025,
    '2026': dashboardChartData,
  };
  const activeChartData = YEAR_CHART_DATA[dashboardYear] ?? dashboardChartData;
  // Only show years that have a dataset
  const availableChartYears = yearlyTotals
    .filter(y => YEAR_CHART_DATA[String(y.year)] !== undefined && y.total > 0)
    .map(y => y.year);

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
        const today = new Date().toDateString();
        const resolvedToday = incRes.data.filter(
          (i: Incident) => i.status === 'RESOLVED' && new Date(i.updatedAt).toDateString() === today
        ).length;
        setPrevStats(stats); // store previous for trend delta
        setStats({ total: s.total, pending: s.pending, dispatched: s.dispatched, resolved: resolvedToday });
      } else {
        const d = incRes.data;
        const today = new Date().toDateString();
        const next = {
          total:      d.length,
          pending:    d.filter((i: Incident) => i.status === 'PENDING').length,
          dispatched: d.filter((i: Incident) => i.status === 'DISPATCHED').length,
          resolved:   d.filter((i: Incident) => i.status === 'RESOLVED' && new Date(i.updatedAt).toDateString() === today).length,
        };
        setPrevStats(stats);
        setStats(next);
      }
    } catch { setIncidents([]); }
    finally  { setLoading(false); }
  };

  useEffect(() => {
    fetchData();
    const iv = setInterval(fetchData, 60000); // 60s — SSE handles real-time alerts
    return () => clearInterval(iv);
  }, []);

  const pendingCount = stats.pending;

  const handleStatCardClick = (filter: Status | 'ALL') => {
    setStatusFilter(prev => prev === filter ? 'ALL' : filter);
  };

  const filteredIncidents = useMemo(() => {
    if (statusFilter === 'ALL') return incidents;
    if (statusFilter === 'RESOLVED') {
      const today = new Date().toDateString();
      return incidents.filter(inc => inc.status === 'RESOLVED' && new Date(inc.updatedAt).toDateString() === today);
    }
    return incidents.filter(inc => inc.status === statusFilter);
  }, [incidents, statusFilter]);

  const donutData = useMemo(() => {
    if (incidents.length === 0) {
      return [
        { name: 'Fire', value: 0 },
        { name: 'Flood', value: 0 },
        { name: 'Medical', value: 0 },
        { name: 'Accident', value: 0 },
      ];
    }
    const counts: Record<string, number> = {};
    incidents.forEach(inc => {
      const type = normalizeIncidentType(inc.aiDetectedType);
      counts[type] = (counts[type] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({
      name,
      value,
    }));
  }, [incidents]);

  // Dynamic Computation Analysis for 'See detail' modal & Donut Chart
  const computationAnalysis = useMemo(() => {
    const total = incidents.length;
    const currentMonthShort = new Date().toLocaleDateString('en-PH', { month: 'short' });
    const currentMonthLong = new Date().toLocaleDateString('en-PH', { month: 'long' });
    const currentMonthIdx = new Date().getMonth();

    const categoryMap: Record<string, { count: number; active: number; resolved: number }> = {};
    incidents.forEach(inc => {
      const type = normalizeIncidentType(inc.aiDetectedType);
      if (!categoryMap[type]) {
        categoryMap[type] = { count: 0, active: 0, resolved: 0 };
      }
      categoryMap[type].count += 1;
      if (inc.status === 'RESOLVED') {
        categoryMap[type].resolved += 1;
      } else {
        categoryMap[type].active += 1;
      }
    });

    const categories = Object.entries(categoryMap)
      .map(([name, data]) => ({
        name,
        count: data.count,
        active: data.active,
        resolved: data.resolved,
        percentage: total > 0 ? ((data.count / total) * 100).toFixed(1) : '0.0',
        dept: name === 'Fire' ? 'BFP Fire' : name === 'Crime' ? 'PNP Police' : name === 'Medical' || name === 'Trauma' ? 'Medical EMS' : name === 'Flood' ? 'MDRRMO Rescue' : 'Engineering',
      }))
      .sort((a, b) => b.count - a.count);

    const forecast = monthlyDetails.find(m => m.month.toLowerCase() === currentMonthShort.toLowerCase()) || monthlyDetails[currentMonthIdx];
    const topHazard = categories[0]?.name || forecast?.type || 'Medical';
    const topHazardCount = categories[0]?.count || 0;
    const topHazardShare = categories[0]?.percentage || '0.0';

    return {
      total,
      currentMonthLong,
      currentMonthShort,
      categories,
      forecast,
      topHazard,
      topHazardCount,
      topHazardShare,
    };
  }, [incidents]);

  const STAT_CARDS = [
    { label: 'Total Reports',   value: stats.total,      accent: '#2563EB', bg: 'rgba(37, 99, 235, 0.05)', glow: 'rgba(37, 99, 235, 0.15)', activeGlow: 'rgba(37, 99, 235, 0.3)', filter: 'ALL' },
    { label: 'Pending',         value: stats.pending,    accent: '#F59E0B', bg: 'rgba(245, 158, 11, 0.05)', glow: 'rgba(245, 158, 11, 0.15)', activeGlow: 'rgba(245, 158, 11, 0.3)', filter: 'PENDING' },
    { label: 'Dispatched',      value: stats.dispatched, accent: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.05)', glow: 'rgba(139, 92, 246, 0.15)', activeGlow: 'rgba(139, 92, 246, 0.3)', filter: 'DISPATCHED' },
    { label: 'Resolved Today',  value: stats.resolved,   accent: '#22C55E', bg: 'rgba(34, 197, 94, 0.05)', glow: 'rgba(34, 197, 94, 0.15)', activeGlow: 'rgba(34, 197, 94, 0.3)', filter: 'RESOLVED' },
  ];

  if (loading && incidents.length === 0) {
    return (
      <>
        <Header title="Dashboard" subtitle="Real-time overview of disaster incidents" />
        <DashboardSkeleton />
      </>
    );
  }

  return (
    <>
      <Header title="Dashboard" subtitle="Real-time overview of disaster incidents" />
      <div className="page-content" style={{ paddingTop: 8 }}>

        {/* ── Operational Greeting & Live Operational Clock (Minimal) ── */}
        <div className="fade-in" style={{
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          padding: '0 4px',
        }}>
          {/* Left Greeting */}
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.4px' }}>
            {greetingText}, <span style={{ color: '#2563EB' }}>{adminName}</span>
          </h2>

          {/* Right Live Operational PST Clock */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            color: '#475569',
          }}>
            <Clock size={16} style={{ color: '#2563EB' }} />
            <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', fontFamily: 'monospace', letterSpacing: '0.05em' }}>
              {time.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
            </div>
          </div>
        </div>

        {/* ── Monthly Incident Forecast Hero Card (White Container & Sidebar Blue Inner Panel) ── */}
        {(() => {
          const currentMonthName = new Date().toLocaleDateString('en-PH', { month: 'long' });
          const currentMonthShort = new Date().toLocaleDateString('en-PH', { month: 'short' });
          const forecast = monthlyDetails.find(m => m.month.toLowerCase() === currentMonthShort.toLowerCase()) || monthlyDetails[new Date().getMonth()];
          const predictedCount = forecast?.desc.match(/~(\d+)|\b(\d+)\s+incidents/)?.[1] || forecast?.desc.match(/\d+/)?.[0] || '41';

          return (
            <div className="fade-in" style={{
              marginBottom: 28,
              background: '#FFFFFF',
              borderRadius: 24,
              padding: '16px 20px 20px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
            }}>
              {/* Top Header Row */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 8px 14px',
              }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#475569', letterSpacing: '0.02em' }}>
                  Incident Risk Forecast
                </span>
                <button
                  onClick={() => setShowComputationModal(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#2563EB',
                    fontSize: 12.5,
                    fontWeight: 600,
                    fontStyle: 'italic',
                    cursor: 'pointer',
                    padding: 0,
                    fontFamily: 'inherit',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  See detail
                </button>
              </div>

              {/* Inner Sidebar Blue Card Panel */}
              <div style={{
                background: 'linear-gradient(135deg, #0F2942 0%, #1E3A5F 100%)',
                borderRadius: 18,
                padding: '22px 28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 24,
                boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.15), 0 8px 24px rgba(15, 41, 66, 0.25)',
              }}>
                {/* Left Content Column */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 14, flex: 1 }}>
                  {/* Floating White Month Pill Badge with Sidebar Dark Blue Text */}
                  <span style={{
                    background: '#FFFFFF',
                    color: '#0F2942',
                    fontSize: 12,
                    fontWeight: 800,
                    padding: '4px 16px',
                    borderRadius: 9999,
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                  }}>
                    {currentMonthName}
                  </span>

                  {/* Main Phrasing Line */}
                  <div style={{
                    fontSize: 18,
                    fontWeight: 400,
                    color: '#FFFFFF',
                    lineHeight: 1.4,
                    fontStyle: 'italic',
                  }}>
                    The incident most likely to occur this month is <strong style={{ fontWeight: 800, fontStyle: 'normal', textDecoration: 'underline', textUnderlineOffset: '4px' }}>{forecast?.type || 'Trauma'} Emergency</strong>.
                  </div>
                </div>

                {/* Right Content Column: Donut Chart Indicator */}
                <div style={{
                  position: 'relative',
                  width: 92,
                  height: 92,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <svg width="92" height="92" viewBox="0 0 92 92" style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx="46" cy="46" r="36" fill="none" stroke="rgba(255, 255, 255, 0.25)" strokeWidth="12" />
                    <circle cx="46" cy="46" r="36" fill="none" stroke="#FFFFFF" strokeWidth="12" strokeDasharray="226.19" strokeDashoffset="75" strokeLinecap="round" />
                    <circle cx="46" cy="46" r="36" fill="none" stroke="#93C5FD" strokeWidth="12" strokeDasharray="226.19" strokeDashoffset="160" strokeLinecap="round" />
                  </svg>
                  <div style={{
                    position: 'absolute',
                    fontSize: 22,
                    fontWeight: 800,
                    color: '#FFFFFF',
                    fontStyle: 'italic',
                  }}>
                    {predictedCount}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

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

        {/* ── Stat Cards Filter Section ─────────────────────── */}
        {/* ── Active Emergencies Banner ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }} aria-live="polite" role="status">
          <span style={{ fontSize: 13, fontWeight: 700, color: '#475569', letterSpacing: '0.01em' }}>
            Filter by:
          </span>
        </div>
        <div className="stats-grid fade-in">
          {STAT_CARDS.map(({ label, value, accent, bg, activeGlow, filter }) => {
            const isActive = statusFilter === filter;
            const prevValue = prevStats[filter === 'ALL' ? 'total' : filter === 'PENDING' ? 'pending' : filter === 'DISPATCHED' ? 'dispatched' : 'resolved'];
            const delta = value - prevValue;
            const isUrgentPending = filter === 'PENDING' && value > 10;
            return (
              <div
                key={label}
                onClick={() => handleStatCardClick(filter as Status | 'ALL')}
                style={{
                  background: isActive ? bg : 'white',
                  borderRadius: 14,
                  padding: '22px',
                  boxShadow: isUrgentPending && !isActive
                    ? `0 0 0 2px ${accent}20, 0 4px 20px rgba(245,158,11,0.2), 0 0 0 4px rgba(245,158,11,0.08)`
                    : isActive
                      ? `0 0 0 2px ${accent}30, 0 4px 20px ${activeGlow}`
                      : '0 1px 4px rgba(0,0,0,0.05)',
                  borderTop: `1px solid ${isActive ? accent + '40' : '#E2E8F0'}`,
                  borderRight: `1px solid ${isActive ? accent + '40' : '#E2E8F0'}`,
                  borderBottom: `1px solid ${isActive ? accent + '40' : '#E2E8F0'}`,
                  borderLeft: `4px solid ${accent}`,
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.16,1,0.3,1)',
                  transform: isActive ? 'translateY(-2px)' : 'none',
                }}
              >
                <div style={{ fontSize: 10.5, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                  {label}
                </div>
                <StatValue value={value} />
                <TrendBadge value={delta} />
                {isActive && (
                  <div style={{ marginTop: 6, fontSize: 11, fontWeight: 700, color: accent, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: accent, display: 'inline-block' }} />
                    Filtering by {label}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Two-column Charts Grid ────────────────────────── */}
        <div className="dashboard-charts-grid fade-in">
          {/* Incident Trends Bar Chart */}
          <div className="card">
            <div className="card-header">
              <h3 style={{ fontWeight: 700, fontSize: 16, color: '#0F172A' }}>Incident Trends</h3>
              <select
                className="filter-select"
                value={dashboardYear}
                onChange={e => setDashboardYear(e.target.value)}
              >
                {availableChartYears.map(yr => (
                  <option key={yr} value={String(yr)}>{yr}</option>
                ))}
              </select>
            </div>
            <div className="card-body">
              <div className="chart-container" style={{ height: '300px', minWidth: 0 }}>
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <BarChart data={activeChartData} barCategoryGap="35%">
                    <defs>
                      <linearGradient id="medicalGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22C55E" />
                        <stop offset="100%" stopColor="#16A34A" />
                      </linearGradient>
                      <linearGradient id="traumaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#F59E0B" />
                        <stop offset="100%" stopColor="#B45309" />
                      </linearGradient>
                      <linearGradient id="accidentGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#F59E0B" />
                        <stop offset="100%" stopColor="#B45309" />
                      </linearGradient>
                      <linearGradient id="fireGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#EF4444" />
                        <stop offset="100%" stopColor="#991B1B" />
                      </linearGradient>
                      <linearGradient id="crimeGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8B5CF6" />
                        <stop offset="100%" stopColor="#6D28D9" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="Medical" fill="url(#medicalGrad)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Trauma" fill="url(#traumaGrad)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Accident" fill="url(#accidentGrad)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Fire" fill="url(#fireGrad)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Crime" fill="url(#crimeGrad)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Incident Distribution Donut Chart */}
          <div className="card">
            <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontWeight: 700, fontSize: 16, color: '#0F172A' }}>Incident Distribution</h3>
              <button
                onClick={() => setShowComputationModal(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#2563EB',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3,
                  fontFamily: 'inherit',
                }}
              >
                <Calculator size={13} /> View Computation
              </button>
            </div>
            <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16, alignItems: 'center' }}>
              <div style={{ height: '260px', width: '100%', position: 'relative', minWidth: 0 }}>
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <PieChart>
                    <Pie
                      data={donutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={62}
                      outerRadius={84}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {donutData.map((entry, index) => {
                        const baseColor = DONUT_COLORS[entry.name] || defaultColor;
                        const isHovered = activeDonutIndex === index;
                        const hasHover = activeDonutIndex !== null;
                        return (
                          <Cell
                            key={`cell-${index}`}
                            fill={baseColor}
                            opacity={hasHover ? (isHovered ? 1 : 0.35) : 1}
                            style={{ transition: 'opacity 0.2s ease', cursor: 'pointer' }}
                          />
                        );
                      })}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>

                {/* Center Donut Total Label */}
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center',
                  pointerEvents: 'none',
                }}>
                  <div style={{ fontSize: 24, fontWeight: 900, color: '#0F172A', lineHeight: 1, letterSpacing: '-0.5px' }}>
                    {donutData.reduce((acc, curr) => acc + curr.value, 0)}
                  </div>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 3 }}>
                    Reports
                  </div>
                </div>
              </div>

              <div className="donut-legend-list">
                {donutData.map((entry, index) => {
                  const color = DONUT_COLORS[entry.name] || defaultColor;
                  const isHovered = activeDonutIndex === index;
                  return (
                    <div
                      key={entry.name}
                      className="donut-legend-item"
                      onMouseEnter={() => setActiveDonutIndex(index)}
                      onMouseLeave={() => setActiveDonutIndex(null)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: 8,
                        background: isHovered ? `${color}14` : 'transparent',
                        cursor: 'pointer',
                        transition: 'background 0.15s ease',
                      }}
                    >
                      <div className="donut-legend-color" style={{ background: color }} />
                      <span style={{ textTransform: 'capitalize', fontWeight: isHovered ? 700 : 500 }}>
                        {entry.name}
                      </span>
                      <span className="donut-legend-value" style={{ color: isHovered ? color : '#0F172A' }}>
                        {entry.value}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── Two-column: incidents table + departments ─────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 24 }}>

          {/* Recent Incidents */}
          <div style={{ background: 'white', borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden', border: '1px solid #F1F5F9' }}>
            <div style={{ padding: '18px 22px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ fontWeight: 700, fontSize: 16, color: '#0F172A' }}>Recent Incidents</div>
                {statusFilter !== 'ALL' && (
                  <span
                    onClick={() => setStatusFilter('ALL')}
                    style={{
                      background: 'var(--primary-bg)',
                      color: 'var(--primary)',
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: 12,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    Filter: {statusFilter === 'RESOLVED' ? 'RESOLVED TODAY' : statusFilter} ✕
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button
                  onClick={handleManualRefresh}
                  disabled={refreshing || loading}
                  title="Refresh incidents"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: refreshing || loading ? 'not-allowed' : 'pointer',
                    color: refreshing ? '#2563EB' : '#94A3B8',
                    padding: 6,
                    borderRadius: 6,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s',
                  }}
                >
                  <RefreshCw size={16} className={refreshing ? 'spin' : ''} />
                </button>
                <button onClick={() => navigate('/requests')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2563EB', fontSize: 13, fontWeight: 600, padding: '4px 8px', borderRadius: 6, fontFamily: 'inherit' }}>
                  View All →
                </button>
              </div>
            </div>
            {loading && filteredIncidents.length === 0 ? (
              <div style={{ padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[0,1,2,3,4].map(i => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '6px 0' }}>
                    {['72px','110px','140px','90px','70px','60px'].map((w, j) => (
                      <div key={j} style={{
                        width: w, height: 12, borderRadius: 4, flexShrink: 0,
                        background: 'linear-gradient(90deg,#F1F5F9 25%,#E8EEF5 50%,#F1F5F9 75%)',
                        backgroundSize: '200% 100%',
                        animation: 'skeletonShimmer 1.4s ease infinite',
                        animationDelay: `${i * 0.08}s`,
                      }} />
                    ))}
                  </div>
                ))}
              </div>
            ) : filteredIncidents.length === 0 ? (
              <div style={{ padding: 48, textAlign: 'center' }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12, background: '#F1F5F9',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 12px',
                }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#475569' }}>No reports match filter</div>
                <div style={{ fontSize: 12.5, marginTop: 4, color: '#94A3B8' }}>Clear the status filter to see all items.</div>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #F1F5F9' }}>
                      {['ID', 'Type', 'Location', 'Status', 'Time', 'Action'].map(h => (
                        <th key={h} style={{ padding: '11px 18px', textAlign: 'left', fontSize: 10.5, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredIncidents.slice(0, 8).map((inc) => {
                      const ss = STATUS_STYLE[inc.status] || STATUS_STYLE.PENDING;
                      const normalized = normalizeIncidentType(inc.aiDetectedType);
                      const ti = TYPE_ICON[normalized] || { emoji: '⚠️', color: '#64748B' };
                      return (
                        <tr
                          key={inc.id}
                          style={{ borderBottom: '1px solid #F8FAFC', cursor: 'pointer', transition: 'background 0.1s' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#F5F8FF'}
                          onMouseLeave={e => e.currentTarget.style.background = ''}
                          onClick={() => navigate(`/requests/${inc.id}`)}
                        >
                          <td style={{ padding: '13px 18px', fontFamily: 'monospace', fontSize: 10.5, color: '#94A3B8', whiteSpace: 'nowrap' }}>
                            #{inc.id.slice(0, 8).toUpperCase()}
                          </td>
                          <td style={{ padding: '13px 18px', whiteSpace: 'nowrap' }}>
                            <span style={{ marginRight: 6 }}>{ti.emoji}</span>
                            <span style={{ fontWeight: 600, color: '#1E293B' }}>{inc.aiDetectedType || 'Unknown'}</span>
                          </td>
                          <td style={{ padding: '13px 18px', color: '#475569', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {inc.latitude && inc.longitude
                              ? getNearestBarangay(inc.latitude, inc.longitude).split(',')[0]
                              : '—'}
                          </td>
                          <td style={{ padding: '13px 18px' }}>
                            <span style={{
                              padding: '3px 9px', borderRadius: 6,
                              background: ss.bg, color: ss.color,
                              fontSize: 10, fontWeight: 800, letterSpacing: '0.06em',
                              textTransform: 'uppercase',
                            }}>
                              {ss.label}
                            </span>
                          </td>
                          <td style={{ padding: '13px 18px', color: '#94A3B8', fontSize: 12, whiteSpace: 'nowrap' }}>
                            {timeAgo(inc.createdAt)}
                          </td>
                          <td style={{ padding: '13px 18px' }}>
                            <button
                              onClick={e => { e.stopPropagation(); navigate(`/requests/${inc.id}`); }}
                              style={{
                                padding: '5px 12px', borderRadius: 7,
                                background: 'var(--primary-bg)', color: 'var(--primary)',
                                border: '1px solid rgba(37,99,235,0.2)', fontSize: 11.5, fontWeight: 700,
                                cursor: 'pointer', fontFamily: 'inherit',
                                transition: 'all 0.15s',
                              }}
                              onMouseEnter={e => { e.currentTarget.style.background = 'var(--primary)'; e.currentTarget.style.color = 'white'; }}
                              onMouseLeave={e => { e.currentTarget.style.background = 'var(--primary-bg)'; e.currentTarget.style.color = 'var(--primary)'; }}
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
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                      <div style={{ width: 38, height: 38, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon size={18} style={{ color }} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13, color: '#1E293B' }}>{label}</div>
                        <div style={{ fontSize: 10, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{sub}</div>
                      </div>
                    </div>
                    <div
                      className="status-pulse-dot"
                      style={{ '--pulse-color': '#22C55E', background: '#22C55E', marginLeft: 'auto' } as any}
                    />
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

      </div>

      {/* ── Dynamic Incident Computation & Breakdown Modal ── */}
      {showComputationModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 10000,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: 24,
            width: '100%',
            maxWidth: 680,
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 24px 60px rgba(15, 23, 42, 0.25)',
            border: '1px solid #E2E8F0',
            overflow: 'hidden',
            animation: 'scaleUp 0.25s cubic-bezier(0.16,1,0.3,1) both',
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #F1F5F9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#FAFAFB',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: '#EFF6FF',
                  color: '#2563EB',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Calculator size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0F172A' }}>
                    Incident Distribution & Risk Computation
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748B' }}>
                    Mathematical breakdown of {computationAnalysis.total} total reports for {computationAnalysis.currentMonthLong}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowComputationModal(false)}
                style={{
                  background: '#F1F5F9',
                  border: 'none',
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#64748B',
                }}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>

              {/* Total Reports Equation Card */}
              <div style={{
                background: 'linear-gradient(135deg, #0F2942 0%, #1E3A5F 100%)',
                color: 'white',
                borderRadius: 18,
                padding: '20px 24px',
                marginBottom: 20,
                boxShadow: '0 8px 24px rgba(15,41,66,0.2)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#93C5FD', fontWeight: 700 }}>
                      Active Incident Pool (N)
                    </div>
                    <div style={{ fontSize: 32, fontWeight: 900, marginTop: 4, letterSpacing: '-0.5px' }}>
                      {computationAnalysis.total} <span style={{ fontSize: 15, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>Total Logged Reports</span>
                    </div>
                  </div>

                  <div style={{
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.18)',
                    borderRadius: 12,
                    padding: '8px 14px',
                    textAlign: 'right',
                  }}>
                    <div style={{ fontSize: 11, color: '#FCD34D', fontWeight: 700 }}>Top Hazard Risk</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: 'white' }}>
                      {computationAnalysis.topHazard} ({computationAnalysis.topHazardShare}%)
                    </div>
                  </div>
                </div>

                <div style={{
                  marginTop: 14,
                  paddingTop: 12,
                  borderTop: '1px solid rgba(255,255,255,0.15)',
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.8)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}>
                  <Sparkles size={14} color="#93C5FD" />
                  <span>
                    Formula: <strong>Category Share P(H) = (Category Count / {computationAnalysis.total}) × 100%</strong>
                  </span>
                </div>
              </div>

              {/* Category Breakdown List */}
              <h4 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Hazard Category Distribution ({computationAnalysis.categories.length} Categories)
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                {computationAnalysis.categories.map(cat => {
                  const info = TYPE_ICON[cat.name] || { emoji: '⚠️', color: '#2563EB' };
                  return (
                    <div
                      key={cat.name}
                      style={{
                        background: '#F8FAFC',
                        borderRadius: 14,
                        padding: '12px 16px',
                        border: '1px solid #E2E8F0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 140 }}>
                        <span style={{ fontSize: 20 }}>{info.emoji}</span>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>{cat.name}</div>
                          <div style={{ fontSize: 11, color: '#64748B' }}>Unit: {cat.dept}</div>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div style={{ flex: 1, margin: '0 12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                          <span>{cat.count} of {computationAnalysis.total} reports</span>
                          <span>{cat.percentage}%</span>
                        </div>
                        <div style={{ height: 6, background: '#E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{
                            width: `${cat.percentage}%`,
                            height: '100%',
                            background: info.color,
                            borderRadius: 3,
                            transition: 'width 0.3s ease',
                          }} />
                        </div>
                      </div>

                      {/* Filter link */}
                      <button
                        onClick={() => {
                          setShowComputationModal(false);
                          navigate(`/requests?type=${cat.name}`);
                        }}
                        style={{
                          background: '#FFFFFF',
                          border: '1px solid #CBD5E1',
                          borderRadius: 8,
                          padding: '6px 10px',
                          fontSize: 11.5,
                          fontWeight: 700,
                          color: '#2563EB',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          flexShrink: 0,
                        }}
                      >
                        View Reports <ArrowRight size={12} />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Monthly Forecast Rationale */}
              <div style={{
                background: '#F0FDF4',
                border: '1px solid #BBF7D0',
                borderRadius: 14,
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
              }}>
                <Info size={20} color="#16A34A" style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#15803D' }}>
                    {computationAnalysis.currentMonthLong} Forecast Methodology
                  </div>
                  <div style={{ fontSize: 12.5, color: '#166534', lineHeight: 1.5, marginTop: 3 }}>
                    Calculated by combining historical MDRRMO disaster records with live seasonal weather indicators. {computationAnalysis.forecast?.desc || 'Trauma and Medical emergencies remain the highest volume.'}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid #F1F5F9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#FAFAFB',
            }}>
              <button
                onClick={() => {
                  setShowComputationModal(false);
                  navigate('/analytics');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#2563EB',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontFamily: 'inherit',
                }}
              >
                <ExternalLink size={14} /> Open Full Historical Analytics
              </button>

              <button
                onClick={() => setShowComputationModal(false)}
                style={{
                  background: '#2563EB',
                  color: 'white',
                  border: 'none',
                  padding: '9px 18px',
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
