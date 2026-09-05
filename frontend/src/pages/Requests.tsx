import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { RequestsTableSkeleton } from '../components/PageLoader';
import { Search, RefreshCw, ChevronLeft, ChevronRight, Image as ImageIcon, X, CheckCircle2, Filter, ArrowRight, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import type { Incident, Status, Department } from '../types';
import { getIncidents, updateIncidentStatus, invalidateCache } from '../api/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getNearestBarangay } from '../data/balayan-data';
import { normalizeIncidentType } from '../utils/normalizeIncidentType';

const STATUS_STYLE: Record<Status, { bg: string; color: string; border: string }> = {
  PENDING:    { bg: '#FEF3C7', color: '#92400E', border: '#FDE68A' },
  REVIEWING:  { bg: '#DBEAFE', color: '#1E40AF', border: '#BFDBFE' },
  DISPATCHED: { bg: '#EDE9FE', color: '#5B21B6', border: '#DDD6FE' },
  RESOLVED:   { bg: '#DCFCE7', color: '#14532D', border: '#BBF7D0' },
  REJECTED:   { bg: '#FEE2E2', color: '#7F1D1D', border: '#FECACA' },
};

const TYPE_ICON: Record<string, string> = {
  Fire: '🔥', Flood: '🌊', Medical: '🏥',
  Accident: '🚗', Typhoon: '🌀', Landslide: '⛰️',
  Trauma: '🩹', Crime: '🚨',
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

const STATUS_TABS: (Status | 'ALL')[] = ['ALL', 'PENDING', 'REVIEWING', 'DISPATCHED', 'RESOLVED', 'REJECTED'];
const PAGE_SIZE = 12;

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function getIncidentUrgencyScore(inc: Incident): number {
  let baseScore = inc.urgencyScore;
  if (!baseScore || typeof baseScore !== 'number') {
    const sev = (inc.severity || '').toUpperCase();
    if (sev === 'CRITICAL') baseScore = 90;
    else if (sev === 'HIGH') baseScore = 75;
    else if (sev === 'MEDIUM') baseScore = 50;
    else if (sev === 'LOW') baseScore = 25;
    else {
      const type = (inc.aiDetectedType || '').toLowerCase();
      if (type.includes('fire') || type.includes('explosion') || type.includes('trauma') || type.includes('shooting')) baseScore = 95;
      else if (type.includes('accident') || type.includes('medical') || type.includes('flood') || type.includes('landslide')) baseScore = 75;
      else if (type.includes('tree') || type.includes('road') || type.includes('hazard')) baseScore = 50;
      else baseScore = 30;
    }
  }

  let statusModifier = 0;
  if (inc.status === 'PENDING') statusModifier = 15;
  else if (inc.status === 'REVIEWING') statusModifier = 10;
  else if (inc.status === 'DISPATCHED') statusModifier = 0;
  else if (inc.status === 'RESOLVED' || inc.status === 'REJECTED') statusModifier = -100;

  let timeModifier = 0;
  if (inc.status === 'PENDING' || inc.status === 'REVIEWING') {
    const elapsedMinutes = Math.floor((Date.now() - new Date(inc.createdAt).getTime()) / 60000);
    timeModifier = Math.min(15, Math.floor(elapsedMinutes / 5));
  }

  return baseScore + statusModifier + timeModifier;
}

export default function Requests() {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Multi-select batch operations state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchLoading, setBatchLoading] = useState(false);

  // Sorting state
  type SortKey = 'id' | 'type' | 'location' | 'unit' | 'status' | 'createdAt' | 'urgency';
  const [sortKey, setSortKey] = useState<SortKey>('urgency');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const handleManualRefresh = async () => {
    setRefreshing(true);
    invalidateCache('incidents');
    await fetchIncidents();
    setRefreshing(false);
  };

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const res = await getIncidents();
      setIncidents(res.data);
    } catch {
      setIncidents([]);
    } finally {
      setLoading(false);
    }
  };

  const quickAction = async (e: React.MouseEvent, incId: string, status: Status) => {
    e.stopPropagation();
    setActionLoading(incId + status);
    try {
      await updateIncidentStatus(incId, { status });
      setIncidents(prev => prev.map(inc => inc.id === incId ? { ...inc, status } : inc));
    } catch {
      /* silent */
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    fetchIncidents();
    const iv = setInterval(fetchIncidents, 10000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    setPage(1);
    setSelectedIds(new Set());
  }, [filterStatus, filterType, search]);

  const toggleSelectAll = (currentPageItems: Incident[]) => {
    if (currentPageItems.every(inc => selectedIds.has(inc.id))) {
      setSelectedIds(new Set());
    } else {
      const next = new Set(selectedIds);
      currentPageItems.forEach(inc => next.add(inc.id));
      setSelectedIds(next);
    }
  };

  const toggleSelectOne = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleBatchAssign = async (dept: string) => {
    if (selectedIds.size === 0) return;
    setBatchLoading(true);
    try {
      await Promise.all(
        Array.from(selectedIds).map(id => updateIncidentStatus(id, { assignedDepartment: dept }))
      );
      setIncidents(prev =>
        prev.map(inc => (selectedIds.has(inc.id) ? { ...inc, assignedDepartment: dept as Department, aiRecommendedDept: dept as Department } : inc))
      );
      setSelectedIds(new Set());
      invalidateCache('incidents');
    } catch {
      /* silent fallback */
    } finally {
      setBatchLoading(false);
    }
  };

  const handleBatchStatus = async (status: Status) => {
    if (selectedIds.size === 0) return;
    setBatchLoading(true);
    try {
      await Promise.all(
        Array.from(selectedIds).map(id => updateIncidentStatus(id, { status }))
      );
      setIncidents(prev =>
        prev.map(inc => (selectedIds.has(inc.id) ? { ...inc, status } : inc))
      );
      setSelectedIds(new Set());
      invalidateCache('incidents');
    } catch {
      /* silent fallback */
    } finally {
      setBatchLoading(false);
    }
  };

  const countsByStatus = incidents.reduce((acc, inc) => {
    acc[inc.status] = (acc[inc.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sortedAndFiltered = useMemo(() => {
    const list = incidents.filter(inc => {
      const mStatus = filterStatus === 'ALL' || inc.status === filterStatus;
      const mType = filterType === 'ALL' || normalizeIncidentType(inc.aiDetectedType) === filterType;
      const mSearch = search === '' ||
        inc.id.toLowerCase().includes(search.toLowerCase()) ||
        (inc.aiDetectedType || '').toLowerCase().includes(search.toLowerCase()) ||
        (inc.aiRecommendedDept || '').toLowerCase().includes(search.toLowerCase()) ||
        (inc.latitude && inc.longitude && getNearestBarangay(inc.latitude, inc.longitude).toLowerCase().includes(search.toLowerCase()));
      return mStatus && mType && mSearch;
    });

    return list.sort((a, b) => {
      let valA: any = '';
      let valB: any = '';

      switch (sortKey) {
        case 'id':
          valA = a.id;
          valB = b.id;
          break;
        case 'type':
          valA = a.aiDetectedType || '';
          valB = b.aiDetectedType || '';
          break;
        case 'location':
          valA = a.latitude && a.longitude ? getNearestBarangay(a.latitude, a.longitude) : '';
          valB = b.latitude && b.longitude ? getNearestBarangay(b.latitude, b.longitude) : '';
          break;
        case 'unit':
          valA = a.assignedDepartment || a.aiRecommendedDept || '';
          valB = b.assignedDepartment || b.aiRecommendedDept || '';
          break;
        case 'status':
          valA = a.status;
          valB = b.status;
          break;
        case 'urgency':
          valA = getIncidentUrgencyScore(a);
          valB = getIncidentUrgencyScore(b);
          break;
        case 'createdAt':
        default:
          valA = new Date(a.createdAt).getTime();
          valB = new Date(b.createdAt).getTime();
          break;
      }

      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [incidents, filterStatus, filterType, search, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sortedAndFiltered.length / PAGE_SIZE));
  const paged = sortedAndFiltered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <>
      <style>{`
        .rq-filter-tabs {
          display: flex;
          align-items: center;
          gap: 6px;
          overflow-x: auto;
          padding-bottom: 4px;
          margin-bottom: 16px;
        }

        .rq-tab-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border-radius: 10px;
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          color: #475569;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.15s ease;
          white-space: nowrap;
        }

        .rq-tab-btn:hover {
          border-color: #CBD5E1;
          color: #0F172A;
        }

        .rq-tab-btn.active {
          background: #2563EB;
          border-color: #2563EB;
          color: #FFFFFF;
          box-shadow: 0 2px 8px rgba(37, 99, 235, 0.25);
        }

        .rq-tab-count {
          padding: 2px 7px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 800;
          background: rgba(0, 0, 0, 0.06);
          color: inherit;
        }

        .rq-tab-btn.active .rq-tab-count {
          background: rgba(255, 255, 255, 0.25);
          color: #FFFFFF;
        }

        .rq-card-container {
          background: #FFFFFF;
          border-radius: 16px;
          border: 1px solid #E2E8F0;
          box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04), 0 6px 18px rgba(15, 23, 42, 0.03);
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }

        .rq-table {
          width: 100%;
          min-width: 680px;
          border-collapse: collapse;
          font-size: 13px;
          text-align: left;
        }

        .rq-th {
          padding: 14px 18px;
          font-size: 11px;
          font-weight: 800;
          color: #64748B;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          background: #F8FAFC;
          border-bottom: 1px solid #E2E8F0;
          white-space: nowrap;
          user-select: none;
        }

        .rq-th.sortable {
          cursor: pointer;
          transition: background 0.12s, color 0.12s;
        }

        .rq-th.sortable:hover {
          background: #EEF2F6;
          color: #0F172A;
        }

        .rq-tr {
          border-bottom: 1px solid #F1F5F9;
          cursor: pointer;
          transition: background 0.12s ease;
        }

        .rq-tr:hover {
          background: #F8FAFC;
        }

        .rq-td {
          padding: 14px 18px;
          color: #334155;
          vertical-align: middle;
        }
      `}</style>

      <Header title="Emergency Requests" subtitle="Real-time incident triage and dispatch operations queue" />

      <div className="page-content" style={{ paddingTop: 12 }}>

        {/* ── Segmented Status Filter Tabs ── */}
        <div className="rq-filter-tabs fade-in">
          {STATUS_TABS.map(tab => {
            const isActive = filterStatus === tab;
            const count = tab === 'ALL' ? incidents.length : (countsByStatus[tab] || 0);
            const theme = TAB_THEMES[tab] || TAB_THEMES.ALL;
            return (
              <button
                key={tab}
                className={`rq-tab-btn ${isActive ? 'active' : ''}`}
                onClick={() => setFilterStatus(tab)}
                style={{
                  background: isActive ? theme.activeBg : theme.inactiveBg,
                  color: isActive ? theme.activeColor : theme.inactiveColor,
                  border: `1.5px solid ${isActive ? theme.activeBorder : theme.inactiveBorder}`,
                  boxShadow: isActive ? `0 2px 10px ${theme.activeGlow}` : 'none',
                }}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: isActive ? '#FFFFFF' : theme.dotColor,
                    display: 'inline-block',
                  }}
                />
                <span>{tab === 'ALL' ? 'All Incidents' : tab}</span>
                <span
                  className="rq-tab-count"
                  style={{
                    background: isActive ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.08)',
                    color: isActive ? '#FFFFFF' : theme.inactiveColor,
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Search & Filter Controls ── */}
        <div className="fade-in" style={{
          background: '#FFFFFF',
          borderRadius: 14,
          padding: '14px 18px',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        }}>
          {/* Search Box */}
          <div style={{ position: 'relative', flex: '1 1 240px', minWidth: 220 }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              type="text"
              placeholder="Search by ID, type, location, or unit..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
                border: '1px solid #E2E8F0',
                borderRadius: 9,
                fontSize: 13,
                outline: 'none',
                fontFamily: 'inherit',
                color: '#0F172A',
                background: '#F8FAFC',
              }}
              onFocus={e => { e.target.style.borderColor = '#2563EB'; e.target.style.background = '#FFFFFF'; }}
              onBlur={e => { e.target.style.borderColor = '#E2E8F0'; e.target.style.background = '#F8FAFC'; }}
            />
          </div>

          {/* Type Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Filter size={14} color="#94A3B8" />
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              style={{
                padding: '9px 12px',
                border: '1px solid #E2E8F0',
                borderRadius: 9,
                fontSize: 13,
                color: '#334155',
                background: '#F8FAFC',
                fontFamily: 'inherit',
                cursor: 'pointer',
                outline: 'none',
                fontWeight: 500,
              }}
            >
              {['ALL', 'Fire', 'Flood', 'Medical', 'Trauma', 'Accident', 'Crime', 'Typhoon', 'Landslide'].map(t => (
                <option key={t} value={t}>
                  {t === 'ALL' ? 'All Hazard Types' : `${TYPE_ICON[t] || ''} ${t}`}
                </option>
              ))}
            </select>
          </div>

          <div style={{ flex: 1 }} />

          {/* Actions */}
          <button
            onClick={handleManualRefresh}
            disabled={refreshing || loading}
            style={{
              padding: '9px 14px',
              borderRadius: 9,
              border: '1px solid #E2E8F0',
              background: '#FFFFFF',
              color: refreshing ? '#2563EB' : '#475569',
              cursor: refreshing || loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 13,
              fontWeight: 600,
              fontFamily: 'inherit',
              transition: 'all 0.15s',
            }}
          >
            <RefreshCw size={14} className={refreshing ? 'spin' : ''} />
            {refreshing ? 'Updating...' : 'Refresh'}
          </button>
        </div>

        {/* ── Incident Table Card ── */}
        <div className="rq-card-container fade-in">
          {loading ? (
            <RequestsTableSkeleton />
          ) : sortedAndFiltered.length === 0 ? (
            <div style={{ padding: '60px 24px', textAlign: 'center', color: '#94A3B8' }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: '#F8FAFC', border: '1px solid #E2E8F0',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 12px', color: '#64748B',
              }}>
                <Search size={22} />
              </div>
              <h4 style={{ margin: 0, color: '#0F172A', fontSize: 16, fontWeight: 700 }}>No Incidents Found</h4>
              <p style={{ margin: '4px 0 0', fontSize: 13 }}>No reports match the current filter or search criteria.</p>
            </div>
          ) : (
            <>
              <div style={{ overflowX: 'auto' }}>
                <table className="rq-table">
                  <thead>
                    <tr>
                      <th className="rq-th" style={{ width: 40, textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={paged.length > 0 && paged.every(inc => selectedIds.has(inc.id))}
                          onChange={() => toggleSelectAll(paged)}
                          aria-label="Select all incidents on page"
                          style={{ cursor: 'pointer', width: 16, height: 16, accentColor: '#2563EB' }}
                        />
                      </th>
                      <th className="rq-th sortable" onClick={() => handleSort('id')}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <span>Incident ID</span>
                          {sortKey === 'id' ? (
                            sortDir === 'asc' ? <ArrowUp size={13} color="#2563EB" /> : <ArrowDown size={13} color="#2563EB" />
                          ) : <ArrowUpDown size={12} style={{ opacity: 0.4 }} />}
                        </div>
                      </th>
                      <th className="rq-th">Evidence</th>
                      <th className="rq-th sortable" onClick={() => handleSort('type')}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <span>Hazard Type</span>
                          {sortKey === 'type' ? (
                            sortDir === 'asc' ? <ArrowUp size={13} color="#2563EB" /> : <ArrowDown size={13} color="#2563EB" />
                          ) : <ArrowUpDown size={12} style={{ opacity: 0.4 }} />}
                        </div>
                      </th>
                      <th className="rq-th sortable" onClick={() => handleSort('location')}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <span>Barangay Location</span>
                          {sortKey === 'location' ? (
                            sortDir === 'asc' ? <ArrowUp size={13} color="#2563EB" /> : <ArrowDown size={13} color="#2563EB" />
                          ) : <ArrowUpDown size={12} style={{ opacity: 0.4 }} />}
                        </div>
                      </th>
                      <th className="rq-th sortable" onClick={() => handleSort('unit')}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <span>Assigned Unit</span>
                          {sortKey === 'unit' ? (
                            sortDir === 'asc' ? <ArrowUp size={13} color="#2563EB" /> : <ArrowDown size={13} color="#2563EB" />
                          ) : <ArrowUpDown size={12} style={{ opacity: 0.4 }} />}
                        </div>
                      </th>
                      <th className="rq-th sortable" onClick={() => handleSort('status')}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <span>Triage Status</span>
                          {sortKey === 'status' ? (
                            sortDir === 'asc' ? <ArrowUp size={13} color="#2563EB" /> : <ArrowDown size={13} color="#2563EB" />
                          ) : <ArrowUpDown size={12} style={{ opacity: 0.4 }} />}
                        </div>
                      </th>
                      <th className="rq-th sortable" onClick={() => handleSort('createdAt')}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <span>Reported</span>
                          {sortKey === 'createdAt' ? (
                            sortDir === 'asc' ? <ArrowUp size={13} color="#2563EB" /> : <ArrowDown size={13} color="#2563EB" />
                          ) : <ArrowUpDown size={12} style={{ opacity: 0.4 }} />}
                        </div>
                      </th>
                      <th className="rq-th sortable" onClick={() => handleSort('urgency')}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <span>Urgency</span>
                          {sortKey === 'urgency' ? (
                            sortDir === 'asc' ? <ArrowUp size={13} color="#DC2626" /> : <ArrowDown size={13} color="#DC2626" />
                          ) : <ArrowUpDown size={12} style={{ opacity: 0.4 }} />}
                        </div>
                      </th>
                      <th className="rq-th" style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paged.map((inc) => {
                      const ss = STATUS_STYLE[inc.status] || STATUS_STYLE.PENDING;
                      const normalized = normalizeIncidentType(inc.aiDetectedType);
                      const emoji = TYPE_ICON[normalized] || '⚠️';
                      const brgyName = inc.latitude && inc.longitude
                        ? getNearestBarangay(inc.latitude, inc.longitude).split(',')[0]
                        : 'Balayan';

                      return (
                        <tr
                          key={inc.id}
                          className={`rq-tr ${selectedIds.has(inc.id) ? 'selected-row' : ''}`}
                          onClick={() => navigate(`/requests/${inc.id}`)}
                          style={{ background: selectedIds.has(inc.id) ? 'rgba(37, 99, 235, 0.04)' : undefined }}
                        >
                          {/* Selection Checkbox */}
                          <td className="rq-td" style={{ textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={selectedIds.has(inc.id)}
                              onChange={e => toggleSelectOne(inc.id, e as any)}
                              aria-label={`Select incident ${inc.id}`}
                              style={{ cursor: 'pointer', width: 16, height: 16, accentColor: '#2563EB' }}
                            />
                          </td>

                          {/* Incident ID */}
                          <td className="rq-td" style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 12, color: '#2563EB' }}>
                            #{inc.id.slice(0, 8).toUpperCase()}
                          </td>

                          {/* Evidence Photo */}
                          <td className="rq-td" onClick={e => e.stopPropagation()}>
                            {inc.photoUrl ? (
                              <div
                                onClick={e => { e.stopPropagation(); setPreviewUrl(inc.photoUrl); }}
                                title="Click to view photo evidence"
                                style={{
                                  width: 42, height: 34, borderRadius: 8, overflow: 'hidden',
                                  border: '1px solid #E2E8F0', cursor: 'zoom-in',
                                  background: '#F1F5F9', flexShrink: 0,
                                  transition: 'transform 0.15s ease',
                                }}
                                onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.08)')}
                                onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                              >
                                <img src={inc.photoUrl} alt="Evidence" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              </div>
                            ) : (
                              <div style={{ width: 42, height: 34, borderRadius: 8, background: '#F8FAFC', border: '1px dashed #CBD5E1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <ImageIcon size={15} color="#94A3B8" />
                              </div>
                            )}
                          </td>

                          {/* Type */}
                          <td className="rq-td">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span>{emoji}</span>
                              <strong style={{ color: '#0F172A', fontWeight: 700 }}>
                                {inc.aiDetectedType || 'Emergency'}
                              </strong>
                            </div>
                          </td>

                          {/* Location */}
                          <td className="rq-td">
                            <span style={{
                              background: '#F1F5F9',
                              color: '#334155',
                              padding: '3px 8px',
                              borderRadius: 6,
                              fontSize: 12,
                              fontWeight: 600,
                            }}>
                              📍 {brgyName}
                            </span>
                          </td>

                          {/* Unit */}
                          <td className="rq-td" style={{ fontWeight: 600, color: '#475569' }}>
                            {inc.aiRecommendedDept || 'MDRRMO'}
                          </td>

                          {/* Status */}
                          <td className="rq-td">
                            <Badge style={{
                              padding: '4px 10px',
                              borderRadius: 999,
                              background: ss.bg,
                              color: ss.color,
                              border: `1px solid ${ss.border}`,
                              fontSize: 11,
                              fontWeight: 800,
                              letterSpacing: '0.04em',
                            }}>
                              {inc.status}
                            </Badge>
                          </td>

                          {/* Reported time */}
                          <td className="rq-td" style={{ color: '#94A3B8', fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>
                            {timeAgo(inc.createdAt)}
                          </td>

                          {/* Urgency/Severity Badge */}
                          <td className="rq-td">
                            {(() => {
                              const sev = (inc.severity || '').toUpperCase() || 'MEDIUM';
                              const score = inc.urgencyScore ?? getIncidentUrgencyScore(inc);
                              const isTerminal = inc.status === 'RESOLVED' || inc.status === 'REJECTED';
                              const sevColors: Record<string, { bg: string; color: string; border: string; pulse?: boolean }> = {
                                CRITICAL: { bg: '#FEE2E2', color: '#DC2626', border: '#FECACA', pulse: true },
                                HIGH:     { bg: '#FFEDD5', color: '#EA580C', border: '#FED7AA', pulse: true },
                                MEDIUM:   { bg: '#DBEAFE', color: '#2563EB', border: '#BFDBFE' },
                                LOW:      { bg: '#F1F5F9', color: '#94A3B8', border: '#E2E8F0' },
                              };
                              const s = sevColors[sev] || sevColors.MEDIUM;
                              if (isTerminal) return <span style={{ fontSize: 11, color: '#94A3B8' }}>—</span>;
                              return (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                  <Badge style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 4,
                                    padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 800,
                                    background: s.bg, color: s.color, border: `1.5px solid ${s.border}`,
                                    whiteSpace: 'nowrap',
                                  }}>
                                    {sev === 'CRITICAL' ? '🚨' : sev === 'HIGH' ? '⚡' : sev === 'LOW' ? '🛡️' : '🔵'} {sev}
                                  </Badge>
                                  <span style={{ fontSize: 10, color: '#94A3B8', fontWeight: 600 }}>
                                    Score: {Math.min(score, 100)}
                                  </span>
                                </div>
                              );
                            })()}
                          </td>

                          {/* Actions */}
                          <td className="rq-td" style={{ textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
                              {inc.status === 'PENDING' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={e => quickAction(e, inc.id, 'REVIEWING')}
                                  disabled={actionLoading === inc.id + 'REVIEWING'}
                                  title="Accept report for review"
                                  style={{
                                    padding: '5px 10px', borderRadius: 7, border: '1px solid #BBF7D0',
                                    background: '#F0FDF4', color: '#16A34A', fontSize: 12, fontWeight: 700,
                                    height: 'auto', display: 'flex', alignItems: 'center', gap: 4,
                                  }}
                                >
                                  <CheckCircle2 size={13} /> Accept
                                </Button>
                              )}

                              <Button
                                size="sm"
                                onClick={() => navigate(`/requests/${inc.id}`)}
                                style={{
                                  padding: '5px 12px',
                                  borderRadius: 7,
                                  background: '#2563EB',
                                  color: '#FFFFFF',
                                  border: 'none',
                                  fontSize: 12,
                                  fontWeight: 700,
                                  height: 'auto',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 4,
                                }}
                              >
                                View <ArrowRight size={12} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* ── Table Footer & Pagination ── */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 20px',
                borderTop: '1px solid #E2E8F0',
                background: '#FAFBFC',
                fontSize: 13,
                color: '#64748B',
              }}>
                <div>
                  Showing <strong>{Math.min(sortedAndFiltered.length, (page - 1) * PAGE_SIZE + 1)}</strong> to <strong>{Math.min(sortedAndFiltered.length, page * PAGE_SIZE)}</strong> of <strong>{sortedAndFiltered.length}</strong> reports
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 8,
                      border: '1px solid #E2E8F0',
                      background: page === 1 ? '#F1F5F9' : '#FFFFFF',
                      color: page === 1 ? '#94A3B8' : '#0F172A',
                      cursor: page === 1 ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    <ChevronLeft size={14} /> Previous
                  </button>
                  <span style={{ fontWeight: 700, color: '#0F172A', fontSize: 12 }}>
                    {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 8,
                      border: '1px solid #E2E8F0',
                      background: page === totalPages ? '#F1F5F9' : '#FFFFFF',
                      color: page === totalPages ? '#94A3B8' : '#0F172A',
                      cursor: page === totalPages ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Floating Batch Action Bar ── */}
      {selectedIds.size > 0 && (
        <div style={{
          position: 'fixed',
          bottom: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'min(640px, calc(100% - 24px))',
          zIndex: 1000,
          background: '#0F172A',
          color: 'white',
          borderRadius: 18,
          padding: '12px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          boxShadow: '0 12px 40px rgba(15,23,42,0.4)',
          border: '1px solid rgba(255,255,255,0.15)',
          animation: 'slideUp 0.25s cubic-bezier(0.16,1,0.3,1) both',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              background: '#2563EB',
              padding: '2px 8px',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 800,
            }}>
              {selectedIds.size}
            </span>
            <span style={{ fontSize: 13, fontWeight: 700 }}>
              Incident{selectedIds.size > 1 ? 's' : ''} Selected
            </span>
          </div>

          <div style={{ height: 20, width: 1, background: 'rgba(255,255,255,0.2)' }} />

          {/* Quick Assign Unit Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: '#94A3B8', fontWeight: 600 }}>Assign to:</span>
            <select
              onChange={e => { if (e.target.value) handleBatchAssign(e.target.value); }}
              defaultValue=""
              disabled={batchLoading}
              style={{
                background: '#1E293B',
                color: 'white',
                border: '1px solid #334155',
                borderRadius: 8,
                padding: '6px 12px',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              <option value="" disabled>Choose Department…</option>
              <option value="BFP">🚒 BFP Fire Rescue</option>
              <option value="PNP">🚓 PNP Police</option>
              <option value="MEDICAL">🚑 Medical EMS</option>
              <option value="ENGINEERING">🚧 Engineering</option>
              <option value="RESCUE">⚓ MDRRMO Rescue</option>
            </select>
          </div>

          {/* Quick Status Advance */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <button
              onClick={() => handleBatchStatus('REVIEWING')}
              disabled={batchLoading}
              style={{
                background: '#334155',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                padding: '6px 12px',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              Mark Reviewing
            </button>

            <button
              onClick={() => handleBatchStatus('DISPATCHED')}
              disabled={batchLoading}
              style={{
                background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                padding: '6px 14px',
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              {batchLoading ? 'Dispatching…' : 'Dispatch All'}
            </button>

            <button
              onClick={() => setSelectedIds(new Set())}
              style={{
                background: 'transparent',
                color: '#94A3B8',
                border: 'none',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 600,
                padding: '4px 8px',
              }}
            >
              Deselect
            </button>
          </div>
        </div>
      )}

      {/* ── Photo Preview Lightbox Modal ── */}
      {previewUrl && (
        <div
          onClick={() => setPreviewUrl(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 'clamp(12px, 3vw, 24px)', cursor: 'zoom-out',
            overflowY: 'auto',
          }}
        >
          <div style={{ position: 'relative', width: 'min(840px, calc(100vw - 24px))', maxHeight: 'min(88vh, calc(100vh - 24px))', borderRadius: 16, overflow: 'hidden', boxShadow: '0 25px 60px rgba(0,0,0,0.5)' }}>
            <img src={previewUrl} alt="Evidence Full" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
            <button
              onClick={() => setPreviewUrl(null)}
              style={{
                position: 'absolute', top: 14, right: 14,
                background: 'rgba(0, 0, 0, 0.6)', border: 'none', borderRadius: '50%',
                width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', cursor: 'pointer',
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
