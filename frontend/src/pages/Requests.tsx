import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { RequestsTableSkeleton } from '../components/PageLoader';
import { Search, RefreshCw, ChevronLeft, ChevronRight, ChevronDown, Image as ImageIcon, X, CheckCircle2, Filter, ArrowUpDown, ArrowUp, ArrowDown, Car, HelpCircle, Lock } from 'lucide-react';
import { FaFire, FaHouseFloodWater, FaLocationDot } from 'react-icons/fa6';
import { FaBriefcaseMedical } from 'react-icons/fa';
import { RiCriminalFill, RiTyphoonFill } from 'react-icons/ri';
import { MdLandslide } from 'react-icons/md';
import { IoBandage } from 'react-icons/io5';
import type { Incident, Status, Department, DepartmentInfo } from '../types';
import { getIncidents, updateIncidentStatus, batchUpdateIncidents, invalidateCache, getDepartments } from '../api/client';
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

type TypeIconEntry = { icon: React.ElementType | null; color: string };
const TYPE_ICON: Record<string, TypeIconEntry> = {
  Fire:         { icon: FaFire,            color: '#EF4444' },
  Flood:        { icon: FaHouseFloodWater, color: '#3B82F6' },
  Medical:      { icon: FaBriefcaseMedical,color: '#22C55E' },
  Crime:        { icon: RiCriminalFill,    color: '#0F172A' },
  Typhoon:      { icon: RiTyphoonFill,     color: '#8B5CF6' },
  Landslide:    { icon: MdLandslide,       color: '#78716C' },
  Trauma:       { icon: IoBandage,         color: '#F59E0B' },
  Accident:     { icon: Car,               color: '#3B82F6' },
  Unrecognized: { icon: HelpCircle,        color: '#64748B' },
  Unknown:      { icon: HelpCircle,        color: '#64748B' },
};

const HAZARD_OPTIONS = [
  { id: 'ALL',        label: 'All Hazard Types', icon: Filter,            color: '#64748B' },
  { id: 'Fire',       label: 'Fire',             icon: FaFire,            color: '#EF4444' },
  { id: 'Flood',      label: 'Flood',            icon: FaHouseFloodWater, color: '#3B82F6' },
  { id: 'Medical',    label: 'Medical',          icon: FaBriefcaseMedical,color: '#22C55E' },
  { id: 'Trauma',     label: 'Trauma',           icon: IoBandage,         color: '#F59E0B' },
  { id: 'Accident',   label: 'Accident',         icon: Car,               color: '#3B82F6' },
  { id: 'Crime',      label: 'Crime',            icon: RiCriminalFill,    color: '#0F172A' },
  { id: 'Typhoon',    label: 'Typhoon',          icon: RiTyphoonFill,     color: '#8B5CF6' },
  { id: 'Landslide',  label: 'Landslide',        icon: MdLandslide,       color: '#78716C' },
];

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

const DEPT_NAMES: Record<string, string> = {
  BFP: 'BFP (Fire)',
  PNP: 'PNP (Police)',
  MEDICAL: 'Medical / EMS',
  ENGINEERING: 'Engineering',
  RESCUE: 'MDRRMO Rescue Team',
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
  const [filterStatus, setFilterStatus] = useState<Status | 'ALL'>('ALL');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const typeDropdownRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(e.target as Node)) {
        setShowTypeDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const selectedHazardOption = HAZARD_OPTIONS.find(o => o.id === filterType) || HAZARD_OPTIONS[0];

  // Multi-select batch operations state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchLoading, setBatchLoading] = useState(false);
  const [departmentsList, setDepartmentsList] = useState<DepartmentInfo[]>([]);

  useEffect(() => {
    getDepartments()
      .then((res) => {
        if (Array.isArray(res.data)) setDepartmentsList(res.data);
      })
      .catch((err) => console.warn('[Requests] Failed to load departments:', err));
  }, []);

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

    const handleSseUpdate = () => {
      invalidateCache('incidents');
      fetchIncidents();
    };

    window.addEventListener('incident-sse-update', handleSseUpdate);
    const iv = setInterval(fetchIncidents, 60000); // 60s fallback heartbeat

    return () => {
      window.removeEventListener('incident-sse-update', handleSseUpdate);
      clearInterval(iv);
    };
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
    const ids = Array.from(selectedIds);
    try {
      await batchUpdateIncidents({ ids, assignedDepartment: dept });
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
    const ids = Array.from(selectedIds);
    try {
      await batchUpdateIncidents({ ids, status });
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
        (inc.barangay ? inc.barangay.toLowerCase().includes(search.toLowerCase()) : (inc.latitude && inc.longitude && getNearestBarangay(inc.latitude, inc.longitude).toLowerCase().includes(search.toLowerCase())));
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
          valA = a.barangay || (a.latitude && a.longitude ? getNearestBarangay(a.latitude, a.longitude) : '');
          valB = b.barangay || (b.latitude && b.longitude ? getNearestBarangay(b.latitude, b.longitude) : '');
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
          box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04), 0 6px 18px rgba(15, 23, 42, 0.02);
          overflow: hidden;
        }

        .rq-desktop-table {
          display: block !important;
          width: 100%;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }

        .rq-mobile-cards {
          display: none !important;
          flex-direction: column;
          gap: 12px;
          padding: 14px;
        }

        .rq-mobile-card {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 14px;
          padding: 14px 16px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
          display: flex;
          flex-direction: column;
          gap: 12px;
          transition: all 0.15s ease;
          cursor: pointer;
        }

        .rq-mobile-card:hover {
          border-color: #93C5FD;
          box-shadow: 0 4px 14px rgba(37, 99, 235, 0.08);
        }

        .rq-mobile-card.selected {
          border-color: #2563EB;
          background: rgba(37, 99, 235, 0.02);
        }

        @media (max-width: 640px) {
          .rq-desktop-table {
            display: none !important;
          }
          .rq-mobile-cards {
            display: flex !important;
          }
          .rq-card-container {
            border: none;
            background: transparent;
            box-shadow: none;
          }
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
          position: 'relative',
          zIndex: 40,
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
          <div ref={typeDropdownRef} style={{ position: 'relative', zIndex: 50 }}>
            <button
              type="button"
              onClick={() => setShowTypeDropdown(prev => !prev)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 12px',
                border: showTypeDropdown ? '1px solid #2563EB' : '1px solid #CBD5E1',
                borderRadius: 9,
                fontSize: 13,
                fontWeight: 500,
                color: filterType !== 'ALL' ? '#0F172A' : '#475569',
                background: showTypeDropdown ? '#F8FAFC' : '#FFFFFF',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: showTypeDropdown ? '0 0 0 3px rgba(37,99,235,0.1)' : 'none',
              }}
            >
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: filterType !== 'ALL' ? `${selectedHazardOption.color}15` : '#F1F5F9',
                  color: selectedHazardOption.color,
                  flexShrink: 0,
                }}
              >
                {selectedHazardOption.icon && <selectedHazardOption.icon size={13} style={{ display: 'block' }} />}
              </div>
              <span>{selectedHazardOption.label}</span>
              <ChevronDown
                size={14}
                style={{
                  color: '#94A3B8',
                  transform: showTypeDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease',
                  marginLeft: 2,
                }}
              />
            </button>

            {showTypeDropdown && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  left: 0,
                  zIndex: 100,
                  minWidth: 200,
                  background: '#FFFFFF',
                  borderRadius: 10,
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.05)',
                  padding: '6px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                }}
              >
                {HAZARD_OPTIONS.map(opt => {
                  const Icon = opt.icon;
                  const isSelected = filterType === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setFilterType(opt.id);
                        setShowTypeDropdown(false);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        width: '100%',
                        padding: '8px 10px',
                        border: 'none',
                        borderRadius: 7,
                        fontSize: 13,
                        fontWeight: isSelected ? 600 : 500,
                        color: isSelected ? '#0F172A' : '#475569',
                        background: isSelected ? '#EFF6FF' : 'transparent',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={e => {
                        if (!isSelected) (e.currentTarget as HTMLElement).style.background = '#F8FAFC';
                      }}
                      onMouseLeave={e => {
                        if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'transparent';
                      }}
                    >
                      <div
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 6,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: `${opt.color}15`,
                          color: opt.color,
                          flexShrink: 0,
                        }}
                      >
                        {Icon && <Icon size={14} />}
                      </div>
                      <span style={{ flex: 1 }}>{opt.label}</span>
                      {isSelected && <CheckCircle2 size={15} color="#2563EB" />}
                    </button>
                  );
                })}
              </div>
            )}
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
        <div className="rq-card-container fade-in" style={{ position: 'relative', zIndex: 1 }}>
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
              {/* Desktop Table View */}
              <div className="rq-desktop-table">
                <style>{`
                  .rq-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 13px;
                    text-align: left;
                  }
                  .rq-th {
                    padding: 13px 12px;
                    font-size: 11px;
                    font-weight: 800;
                    color: #64748B;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    background: #F8FAFC;
                    border-bottom: 1px solid #E2E8F0;
                    white-space: nowrap;
                    user-select: none;
                  }
                  .rq-td {
                    padding: 13px 12px;
                    border-bottom: 1px solid #F1F5F9;
                    vertical-align: middle;
                  }
                  .rq-tr {
                    transition: background 0.12s ease;
                  }
                  .rq-tr:hover {
                    background: #F8FAFC;
                  }
                  .rq-evidence-box {
                    width: 38px;
                    height: 30px;
                    border-radius: 7px;
                    overflow: hidden;
                    border: 1px solid #E2E8F0;
                    cursor: zoom-in;
                    background: #F1F5F9;
                    flex-shrink: 0;
                    transition: transform 0.15s ease;
                  }
                  .rq-badge-brgy {
                    background: #F1F5F9;
                    color: #334155;
                    padding: 3px 8px;
                    border-radius: 6px;
                    font-size: 12px;
                    font-weight: 600;
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    white-space: nowrap;
                  }
                  .rq-btn-view {
                    padding: 5px 14px !important;
                    border-radius: 7px !important;
                    background: rgba(37, 99, 235, 0.06) !important;
                    color: #2563EB !important;
                    border: 1px solid rgba(37, 99, 235, 0.25) !important;
                    font-size: 12px !important;
                    font-weight: 700 !important;
                    height: auto !important;
                    letter-spacing: 0.02em !important;
                    transition: all 0.15s ease !important;
                  }
                  .rq-btn-view:hover {
                    background: #2563EB !important;
                    color: #FFFFFF !important;
                  }
                  .rq-btn-accept {
                    padding: 4px 8px !important;
                    font-size: 11px !important;
                  }

                  @media (max-width: 1440px) {
                    .rq-th {
                      padding: 11px 9px !important;
                      font-size: 10.5px !important;
                    }
                    .rq-td {
                      padding: 11px 9px !important;
                      font-size: 12.5px !important;
                    }
                    .rq-evidence-box {
                      width: 35px;
                      height: 28px;
                    }
                  }

                  @media (max-width: 1280px) {
                    .rq-th {
                      padding: 10px 7px !important;
                      font-size: 10px !important;
                      letter-spacing: 0.03em !important;
                    }
                    .rq-td {
                      padding: 10px 7px !important;
                      font-size: 12px !important;
                    }
                    .rq-evidence-box {
                      width: 32px;
                      height: 26px;
                    }
                    .rq-badge-brgy {
                      padding: 2.5px 6px;
                      font-size: 11px;
                    }
                    .rq-btn-view {
                      padding: 4px 10px !important;
                      font-size: 11px !important;
                    }
                  }

                  @media (max-width: 1024px) {
                    .rq-th {
                      padding: 9px 6px !important;
                      font-size: 9.5px !important;
                      letter-spacing: 0.02em !important;
                    }
                    .rq-td {
                      padding: 9px 6px !important;
                      font-size: 11.5px !important;
                    }
                    .rq-evidence-box {
                      width: 30px;
                      height: 24px;
                    }
                    .rq-badge-brgy {
                      padding: 2px 5px;
                      font-size: 10.5px;
                    }
                    .rq-btn-view {
                      padding: 3.5px 8px !important;
                      font-size: 10.5px !important;
                    }
                  }
                `}</style>
                <table className="rq-table" style={{ width: '100%', minWidth: 840, borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr>
                      <th className="rq-th" style={{ width: 36, minWidth: 36, textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={paged.length > 0 && paged.every(inc => selectedIds.has(inc.id))}
                          onChange={() => toggleSelectAll(paged)}
                          aria-label="Select all incidents on page"
                          style={{ cursor: 'pointer', width: 15, height: 15, accentColor: '#2563EB' }}
                        />
                      </th>
                      <th className="rq-th sortable" onClick={() => handleSort('id')} style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <span>Incident ID</span>
                          {sortKey === 'id' ? (
                            sortDir === 'asc' ? <ArrowUp size={12} color="#2563EB" /> : <ArrowDown size={12} color="#2563EB" />
                          ) : <ArrowUpDown size={11} style={{ opacity: 0.35 }} />}
                        </div>
                      </th>
                      <th className="rq-th" style={{ width: 50, minWidth: 46 }}>Evidence</th>
                      <th className="rq-th sortable" onClick={() => handleSort('type')} style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <span>Hazard Type</span>
                          {sortKey === 'type' ? (
                            sortDir === 'asc' ? <ArrowUp size={12} color="#2563EB" /> : <ArrowDown size={12} color="#2563EB" />
                          ) : <ArrowUpDown size={11} style={{ opacity: 0.35 }} />}
                        </div>
                      </th>
                      <th className="rq-th sortable" onClick={() => handleSort('location')} style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <span>Barangay Location</span>
                          {sortKey === 'location' ? (
                            sortDir === 'asc' ? <ArrowUp size={12} color="#2563EB" /> : <ArrowDown size={12} color="#2563EB" />
                          ) : <ArrowUpDown size={11} style={{ opacity: 0.35 }} />}
                        </div>
                      </th>
                      <th className="rq-th sortable" onClick={() => handleSort('unit')} style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <span>Assigned Unit</span>
                          {sortKey === 'unit' ? (
                            sortDir === 'asc' ? <ArrowUp size={12} color="#2563EB" /> : <ArrowDown size={12} color="#2563EB" />
                          ) : <ArrowUpDown size={11} style={{ opacity: 0.35 }} />}
                        </div>
                      </th>
                      <th className="rq-th sortable" onClick={() => handleSort('status')} style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <span>Triage Status</span>
                          {sortKey === 'status' ? (
                            sortDir === 'asc' ? <ArrowUp size={12} color="#2563EB" /> : <ArrowDown size={12} color="#2563EB" />
                          ) : <ArrowUpDown size={11} style={{ opacity: 0.35 }} />}
                        </div>
                      </th>
                      <th className="rq-th sortable" onClick={() => handleSort('createdAt')} style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <span>Reported</span>
                          {sortKey === 'createdAt' ? (
                            sortDir === 'asc' ? <ArrowUp size={12} color="#2563EB" /> : <ArrowDown size={12} color="#2563EB" />
                          ) : <ArrowUpDown size={11} style={{ opacity: 0.35 }} />}
                        </div>
                      </th>
                      <th className="rq-th sortable" onClick={() => handleSort('urgency')} style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <span>Severity</span>
                          {sortKey === 'urgency' ? (
                            sortDir === 'asc' ? <ArrowUp size={12} color="#DC2626" /> : <ArrowDown size={12} color="#DC2626" />
                          ) : <ArrowUpDown size={11} style={{ opacity: 0.35 }} />}
                        </div>
                      </th>
                      <th className="rq-th" style={{ textAlign: 'right', whiteSpace: 'nowrap', width: 68 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paged.map((inc) => {
                      const ss = STATUS_STYLE[inc.status] || STATUS_STYLE.PENDING;
                      const normalized = normalizeIncidentType(inc.aiDetectedType);
                      const ti = TYPE_ICON[normalized] || { icon: HelpCircle, color: '#64748B' };
                      const brgyName = inc.barangay
                        ? inc.barangay.split(',')[0]
                        : inc.latitude && inc.longitude
                        ? getNearestBarangay(inc.latitude, inc.longitude).split(',')[0]
                        : 'Balayan';

                      return (
                        <tr
                          key={inc.id}
                          className={`rq-tr ${selectedIds.has(inc.id) ? 'selected-row' : ''}`}
                          onClick={() => navigate(`/requests/${inc.id}`)}
                          style={{
                            borderBottom: '1px solid #F1F5F9',
                            cursor: 'pointer',
                            background: selectedIds.has(inc.id) ? 'rgba(37, 99, 235, 0.04)' : undefined,
                          }}
                        >
                          {/* Selection Checkbox */}
                          <td className="rq-td" style={{ textAlign: 'center', width: 34 }} onClick={e => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={selectedIds.has(inc.id)}
                              onChange={e => toggleSelectOne(inc.id, e as any)}
                              aria-label={`Select incident ${inc.id}`}
                              style={{ cursor: 'pointer', width: 15, height: 15, accentColor: '#2563EB' }}
                            />
                          </td>

                          {/* Incident ID */}
                          <td className="rq-td" style={{ fontFamily: 'monospace', fontWeight: 700, color: '#2563EB', whiteSpace: 'nowrap' }}>
                            #{inc.id.slice(0, 8).toUpperCase()}
                          </td>

                          {/* Evidence Photo */}
                          <td className="rq-td" onClick={e => e.stopPropagation()}>
                            {inc.photoUrl ? (
                              <div
                                onClick={e => { e.stopPropagation(); setPreviewUrl(inc.photoUrl); }}
                                title="Click to view photo evidence"
                                className="rq-evidence-box"
                                onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.08)')}
                                onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                              >
                                <img src={inc.photoUrl} alt="Evidence" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              </div>
                            ) : (
                              <div className="rq-evidence-box" style={{ background: '#F8FAFC', border: '1px dashed #CBD5E1', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'default' }}>
                                <ImageIcon size={14} color="#94A3B8" />
                              </div>
                            )}
                          </td>

                          {/* Type */}
                          <td className="rq-td" style={{ whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                              {ti.icon ? (
                                <ti.icon size={15} style={{ color: ti.color, flexShrink: 0 }} />
                              ) : (
                                <HelpCircle size={15} style={{ color: '#64748B', flexShrink: 0 }} />
                              )}
                              <strong style={{ color: '#0F172A', fontWeight: 700 }}>
                                {inc.aiDetectedType || 'Emergency'}
                              </strong>
                            </div>
                          </td>

                          {/* Location */}
                          <td className="rq-td" style={{ whiteSpace: 'nowrap' }}>
                            <span className="rq-badge-brgy">
                              <FaLocationDot size={10} color="#EF4444" style={{ flexShrink: 0 }} />
                              <span>{brgyName}</span>
                            </span>
                          </td>

                          {/* Unit */}
                          <td className="rq-td" style={{ fontWeight: 600, color: '#1E293B', whiteSpace: 'nowrap' }}>
                            {inc.assignedDepartment ? (
                              <span>{DEPT_NAMES[inc.assignedDepartment] || inc.assignedDepartment}</span>
                            ) : inc.aiRecommendedDept ? (
                              <span style={{ color: '#64748B', fontSize: 11.5 }}>
                                Rec: {DEPT_NAMES[inc.aiRecommendedDept] || inc.aiRecommendedDept}
                              </span>
                            ) : (
                              <span style={{ color: '#94A3B8', fontSize: 11.5 }}>MDRRMO</span>
                            )}
                          </td>

                          {/* Status */}
                          <td className="rq-td">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'flex-start' }}>
                              <Badge style={{
                                padding: '3px 8px',
                                borderRadius: 999,
                                background: ss.bg,
                                color: ss.color,
                                border: `1px solid ${ss.border}`,
                                fontSize: 10.5,
                                fontWeight: 800,
                                letterSpacing: '0.04em',
                                whiteSpace: 'nowrap',
                              }}>
                                <span>{inc.status}</span>
                              </Badge>
                              {inc.lockedByAdminName && inc.status !== 'RESOLVED' && inc.status !== 'REJECTED' && (
                                <span style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 3,
                                  fontSize: 9.5,
                                  fontWeight: 700,
                                  color: '#B91C1C',
                                  background: '#FEF2F2',
                                  border: '1px solid #FECDD3',
                                  borderRadius: 4,
                                  padding: '1px 4px',
                                  whiteSpace: 'nowrap',
                                }} title={`Locked by ${inc.lockedByAdminName}`}>
                                  <Lock size={9} /> {inc.lockedByAdminName}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Reported time */}
                          <td className="rq-td" style={{ color: '#94A3B8', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                            {timeAgo(inc.createdAt)}
                          </td>

                          {/* Urgency/Severity Badge (Standardized: Low=Green, Med=Amber, High/Critical=Red) */}
                          <td className="rq-td" style={{ whiteSpace: 'nowrap' }}>
                            {(() => {
                              const sev = (inc.severity || '').toUpperCase() || 'MEDIUM';
                              const isTerminal = inc.status === 'RESOLVED' || inc.status === 'REJECTED';
                              const sevColors: Record<string, { bg: string; color: string; border: string; dot: string; pulse?: boolean }> = {
                                CRITICAL: { bg: '#FEF2F2', color: '#B91C1C', border: '#FCA5A5', dot: '#EF4444', pulse: true },
                                HIGH:     { bg: '#FFF1F2', color: '#BE123C', border: '#FECDD3', dot: '#F43F5E' },
                                MEDIUM:   { bg: '#FFFBEB', color: '#B45309', border: '#FDE68A', dot: '#F59E0B' },
                                LOW:      { bg: '#ECFDF5', color: '#047857', border: '#A7F3D0', dot: '#10B981' },
                              };
                              const s = sevColors[sev] || sevColors.MEDIUM;
                              if (isTerminal) return <span style={{ fontSize: 11, color: '#94A3B8' }}>—</span>;
                              return (
                                <Badge style={{
                                  display: 'inline-flex', alignItems: 'center', gap: 4,
                                  padding: '3px 7px', borderRadius: 6, fontSize: 10.5, fontWeight: 800,
                                  background: s.bg, color: s.color, border: `1.5px solid ${s.border}`,
                                  whiteSpace: 'nowrap',
                                }}>
                                  <span style={{
                                    width: 5, height: 5, borderRadius: '50%',
                                    background: s.dot, display: 'inline-block',
                                  }} />
                                  <span>{sev}</span>
                                </Badge>
                              );
                            })()}
                          </td>

                          {/* Actions */}
                          <td className="rq-td" style={{ textAlign: 'right', whiteSpace: 'nowrap' }} onClick={e => e.stopPropagation()}>
                            <div style={{ display: 'flex', gap: 5, justifyContent: 'flex-end', alignItems: 'center' }}>
                              {inc.status === 'PENDING' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="rq-btn-accept"
                                  onClick={e => quickAction(e, inc.id, 'REVIEWING')}
                                  disabled={actionLoading === inc.id + 'REVIEWING'}
                                  title="Accept report for review"
                                  style={{
                                    padding: '4px 8px', borderRadius: 6, border: '1px solid #BBF7D0',
                                    background: '#F0FDF4', color: '#16A34A', fontSize: 11.5, fontWeight: 700,
                                    height: 'auto', display: 'flex', alignItems: 'center', gap: 3,
                                  }}
                                >
                                  <CheckCircle2 size={12} /> Accept
                                </Button>
                              )}

                              <Button
                                size="sm"
                                variant="outline"
                                className="rq-btn-view"
                                onClick={() => navigate(`/requests/${inc.id}`)}
                                style={{
                                  padding: '4px 10px',
                                  borderRadius: 6,
                                  height: 'auto',
                                  background: 'var(--primary-bg)',
                                  color: 'var(--primary)',
                                  border: '1px solid rgba(37,99,235,0.2)',
                                  fontSize: 11,
                                  fontWeight: 700,
                                  transition: 'all 0.15s',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'var(--primary)'; e.currentTarget.style.color = 'white'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'var(--primary-bg)'; e.currentTarget.style.color = 'var(--primary)'; }}
                              >
                                View
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List View (Mobile devices <= 640px) */}
              <div className="rq-mobile-cards">
                {paged.map((inc) => {
                  const ss = STATUS_STYLE[inc.status] || STATUS_STYLE.PENDING;
                  const normalized = normalizeIncidentType(inc.aiDetectedType);
                  const ti = TYPE_ICON[normalized] || { icon: HelpCircle, color: '#64748B' };
                  const brgyName = inc.barangay
                    ? inc.barangay.split(',')[0]
                    : inc.latitude && inc.longitude
                    ? getNearestBarangay(inc.latitude, inc.longitude).split(',')[0]
                    : 'Balayan';
                  const sev = (inc.severity || '').toUpperCase() || 'MEDIUM';
                  const sevColors: Record<string, { bg: string; color: string; border: string; dot: string; pulse?: boolean }> = {
                    CRITICAL: { bg: '#FEF2F2', color: '#B91C1C', border: '#FCA5A5', dot: '#EF4444', pulse: true },
                    HIGH:     { bg: '#FFF1F2', color: '#BE123C', border: '#FECDD3', dot: '#F43F5E' },
                    MEDIUM:   { bg: '#FFFBEB', color: '#B45309', border: '#FDE68A', dot: '#F59E0B' },
                    LOW:      { bg: '#ECFDF5', color: '#047857', border: '#A7F3D0', dot: '#10B981' },
                  };
                  const s = sevColors[sev] || sevColors.MEDIUM;
                  const isTerminal = inc.status === 'RESOLVED' || inc.status === 'REJECTED';

                  return (
                    <div
                      key={inc.id}
                      className={`rq-mobile-card ${selectedIds.has(inc.id) ? 'selected' : ''}`}
                      onClick={() => navigate(`/requests/${inc.id}`)}
                    >
                      {/* Top Row: ID, Status, Timestamp */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <input
                            type="checkbox"
                            checked={selectedIds.has(inc.id)}
                            onChange={e => toggleSelectOne(inc.id, e as any)}
                            onClick={e => e.stopPropagation()}
                            aria-label={`Select incident ${inc.id}`}
                            style={{ cursor: 'pointer', width: 18, height: 18, accentColor: '#2563EB' }}
                          />
                          <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 13, color: '#2563EB' }}>
                            #{inc.id.slice(0, 8).toUpperCase()}
                          </span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Badge style={{
                              padding: '3px 9px', borderRadius: 999,
                              background: ss.bg, color: ss.color, border: `1px solid ${ss.border}`,
                              fontSize: 10.5, fontWeight: 800,
                            }}>
                              <span>{inc.status}</span>
                            </Badge>
                            <span style={{ fontSize: 11, color: '#94A3B8' }}>{timeAgo(inc.createdAt)}</span>
                          </div>
                          {inc.lockedByAdminName && inc.status !== 'RESOLVED' && inc.status !== 'REJECTED' && (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 3,
                              fontSize: 10,
                              fontWeight: 700,
                              color: '#B91C1C',
                              background: '#FEF2F2',
                              border: '1px solid #FECDD3',
                              borderRadius: 4,
                              padding: '1px 5px',
                              whiteSpace: 'nowrap',
                            }} title={`Locked by ${inc.lockedByAdminName}`}>
                              <Lock size={9} /> {inc.lockedByAdminName}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Middle: Incident Type, Evidence & Location */}
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        {inc.photoUrl ? (
                          <div
                            onClick={e => { e.stopPropagation(); setPreviewUrl(inc.photoUrl); }}
                            style={{
                              width: 52, height: 44, borderRadius: 8, overflow: 'hidden',
                              border: '1px solid #E2E8F0', flexShrink: 0,
                            }}
                          >
                            <img src={inc.photoUrl} alt="Evidence" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                        ) : (
                          <div style={{ width: 52, height: 44, borderRadius: 8, background: '#F8FAFC', border: '1px dashed #CBD5E1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <ImageIcon size={18} color="#94A3B8" />
                          </div>
                        )}

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                            {ti.icon ? (
                              <ti.icon size={16} style={{ color: ti.color, flexShrink: 0 }} />
                            ) : (
                              <HelpCircle size={16} style={{ color: '#64748B', flexShrink: 0 }} />
                            )}
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inc.aiDetectedType || 'Emergency'}</span>
                          </div>
                          <div style={{ fontSize: 12, color: '#475569', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <FaLocationDot size={11} color="#EF4444" style={{ flexShrink: 0 }} />
                              <span>{brgyName}</span>
                            </span>
                            <span style={{ color: '#CBD5E1' }}>•</span>
                            <span style={{ fontWeight: 600 }}>
                              {inc.assignedDepartment
                                ? (DEPT_NAMES[inc.assignedDepartment] || inc.assignedDepartment)
                                : inc.aiRecommendedDept
                                ? `Rec: ${DEPT_NAMES[inc.aiRecommendedDept] || inc.aiRecommendedDept}`
                                : 'MDRRMO'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Severity & Action Buttons */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid #F1F5F9' }}>
                        {isTerminal ? (
                          <span style={{ fontSize: 11, color: '#94A3B8' }}>—</span>
                        ) : (
                          <Badge style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 800,
                            background: s.bg, color: s.color, border: `1.5px solid ${s.border}`,
                          }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot }} />
                            <span>{sev}</span>
                          </Badge>
                        )}

                        <div style={{ display: 'flex', gap: 8 }} onClick={e => e.stopPropagation()}>
                          {inc.status === 'PENDING' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={e => quickAction(e, inc.id, 'REVIEWING')}
                              disabled={actionLoading === inc.id + 'REVIEWING'}
                              style={{
                                padding: '6px 12px', borderRadius: 8, border: '1px solid #BBF7D0',
                                background: '#F0FDF4', color: '#16A34A', fontSize: 12, fontWeight: 700,
                              }}
                            >
                              <CheckCircle2 size={13} /> Accept
                            </Button>
                          )}

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/requests/${inc.id}`)}
                            style={{
                              padding: '5px 14px',
                              borderRadius: 7,
                              background: 'var(--primary-bg)',
                              color: 'var(--primary)',
                              border: '1px solid rgba(37,99,235,0.2)',
                              fontSize: 12,
                              fontWeight: 700,
                              height: 'auto',
                              transition: 'all 0.15s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'var(--primary)'; e.currentTarget.style.color = 'white'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'var(--primary-bg)'; e.currentTarget.style.color = 'var(--primary)'; }}
                          >
                            View
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
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
                flexWrap: 'wrap',
                gap: 12,
              }}>
                <div style={{ whiteSpace: 'nowrap' }}>
                  Showing <strong>{Math.min(sortedAndFiltered.length, (page - 1) * PAGE_SIZE + 1)}</strong> to <strong>{Math.min(sortedAndFiltered.length, page * PAGE_SIZE)}</strong> of <strong>{sortedAndFiltered.length}</strong> reports
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'nowrap' }}>
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    style={{
                      padding: '6px 14px',
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
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}
                  >
                    <ChevronLeft size={14} /> Previous
                  </button>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '5px 12px',
                    borderRadius: 8,
                    background: '#F1F5F9',
                    border: '1px solid #E2E8F0',
                    fontWeight: 800,
                    color: '#0F172A',
                    fontSize: 12,
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    minWidth: '60px',
                  }}>
                    {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    style={{
                      padding: '6px 14px',
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
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
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
          background: '#FFFFFF',
          color: '#0F172A',
          borderRadius: 18,
          padding: '12px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          boxShadow: '0 12px 40px rgba(15,23,42,0.12)',
          border: '1px solid #E2E8F0',
          animation: 'slideUp 0.25s cubic-bezier(0.16,1,0.3,1) both',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              background: '#2563EB',
              color: 'white',
              padding: '2px 8px',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 800,
            }}>
              {selectedIds.size}
            </span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>
              Incident{selectedIds.size > 1 ? 's' : ''} Selected
            </span>
          </div>

          <div style={{ height: 20, width: 1, background: '#E2E8F0' }} />

          {/* Quick Assign Unit Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>Assign to:</span>
            <select
              onChange={e => { if (e.target.value) handleBatchAssign(e.target.value); }}
              defaultValue=""
              disabled={batchLoading}
              style={{
                background: '#F8FAFC',
                color: '#0F172A',
                border: '1px solid #CBD5E1',
                borderRadius: 8,
                padding: '6px 12px',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              <option value="" disabled>Choose Department…</option>
              {departmentsList.length > 0 ? (
                departmentsList.map(dept => (
                  <option key={dept.name} value={dept.name}>
                    {dept.name} — {dept.fullName || dept.name}
                  </option>
                ))
              ) : (
                <>
                  <option value="BFP">BFP Fire Rescue</option>
                  <option value="PNP">PNP Police</option>
                  <option value="MEDICAL">Medical EMS</option>
                  <option value="ENGINEERING">Engineering</option>
                  <option value="RESCUE">MDRRMO Rescue</option>
                </>
              )}
            </select>
          </div>

          {/* Quick Status Advance */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <button
              onClick={() => handleBatchStatus('REVIEWING')}
              disabled={batchLoading}
              style={{
                background: '#F1F5F9',
                color: '#0F172A',
                border: '1px solid #CBD5E1',
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
                boxShadow: '0 2px 8px rgba(37,99,235,0.25)',
              }}
            >
              <span>{batchLoading ? 'Dispatching…' : 'Dispatch All'}</span>
            </button>

            <button
              onClick={() => setSelectedIds(new Set())}
              style={{
                background: 'transparent',
                color: '#64748B',
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
