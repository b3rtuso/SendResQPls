import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { RequestsTableSkeleton } from '../components/PageLoader';
import { Search, RefreshCw, ChevronLeft, ChevronRight, Image as ImageIcon, X, CheckCircle2, Filter, ArrowRight } from 'lucide-react';
import type { Incident, Status } from '../types';
import { getIncidents, updateIncidentStatus, invalidateCache } from '../api/client';
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
  }, [filterStatus, filterType, search]);

  const countsByStatus = incidents.reduce((acc, inc) => {
    acc[inc.status] = (acc[inc.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const filtered = incidents.filter(inc => {
    const mStatus = filterStatus === 'ALL' || inc.status === filterStatus;
    const mType = filterType === 'ALL' || normalizeIncidentType(inc.aiDetectedType) === filterType;
    const mSearch = search === '' ||
      inc.id.toLowerCase().includes(search.toLowerCase()) ||
      (inc.aiDetectedType || '').toLowerCase().includes(search.toLowerCase()) ||
      (inc.aiRecommendedDept || '').toLowerCase().includes(search.toLowerCase()) ||
      (inc.latitude && inc.longitude && getNearestBarangay(inc.latitude, inc.longitude).toLowerCase().includes(search.toLowerCase()));
    return mStatus && mType && mSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
          overflow: hidden;
        }

        .rq-table {
          width: 100%;
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
          ) : filtered.length === 0 ? (
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
                      <th className="rq-th">Incident ID</th>
                      <th className="rq-th">Evidence</th>
                      <th className="rq-th">Hazard Type</th>
                      <th className="rq-th">Barangay Location</th>
                      <th className="rq-th">Assigned Unit</th>
                      <th className="rq-th">Triage Status</th>
                      <th className="rq-th">Reported</th>
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
                          className="rq-tr"
                          onClick={() => navigate(`/requests/${inc.id}`)}
                        >
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
                            <span style={{
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
                            </span>
                          </td>

                          {/* Reported time */}
                          <td className="rq-td" style={{ color: '#94A3B8', fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>
                            {timeAgo(inc.createdAt)}
                          </td>

                          {/* Actions */}
                          <td className="rq-td" style={{ textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
                              {inc.status === 'PENDING' && (
                                <button
                                  onClick={e => quickAction(e, inc.id, 'REVIEWING')}
                                  disabled={actionLoading === inc.id + 'REVIEWING'}
                                  title="Accept report for review"
                                  style={{
                                    padding: '5px 10px', borderRadius: 7, border: '1px solid #BBF7D0',
                                    background: '#F0FDF4', color: '#16A34A', fontSize: 12, fontWeight: 700,
                                    cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4,
                                  }}
                                >
                                  <CheckCircle2 size={13} /> Accept
                                </button>
                              )}

                              <button
                                onClick={() => navigate(`/requests/${inc.id}`)}
                                style={{
                                  padding: '5px 12px',
                                  borderRadius: 7,
                                  background: '#2563EB',
                                  color: '#FFFFFF',
                                  border: 'none',
                                  fontSize: 12,
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  fontFamily: 'inherit',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 4,
                                }}
                              >
                                View <ArrowRight size={12} />
                              </button>
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
                  Showing <strong>{Math.min(filtered.length, (page - 1) * PAGE_SIZE + 1)}</strong> to <strong>{Math.min(filtered.length, page * PAGE_SIZE)}</strong> of <strong>{filtered.length}</strong> reports
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

      {/* ── Photo Lightbox Modal ── */}
      {previewUrl && (
        <div
          onClick={() => setPreviewUrl(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 24, cursor: 'zoom-out',
          }}
        >
          <div style={{ position: 'relative', maxWidth: 840, maxHeight: '88vh', borderRadius: 16, overflow: 'hidden', boxShadow: '0 25px 60px rgba(0,0,0,0.5)' }}>
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
