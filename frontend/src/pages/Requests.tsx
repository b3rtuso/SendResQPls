import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { RequestsTableSkeleton } from '../components/PageLoader';
import { Search, RefreshCw, Download, ChevronLeft, ChevronRight, Image, X, CheckCircle2, XCircle } from 'lucide-react';
import type { Incident, Status } from '../types';
import { getIncidents, updateIncidentStatus } from '../api/client';
import { getNearestBarangay } from '../data/balayan-data';
import { normalizeIncidentType } from '../utils/normalizeIncidentType';

const STATUS_STYLE: Record<Status, { bg: string; color: string }> = {
  PENDING:    { bg: '#FEF3C7', color: '#92400E' },
  REVIEWING:  { bg: '#DBEAFE', color: '#1E40AF' },
  DISPATCHED: { bg: '#EDE9FE', color: '#5B21B6' },
  RESOLVED:   { bg: '#DCFCE7', color: '#14532D' },
  REJECTED:   { bg: '#FEE2E2', color: '#7F1D1D' },
};

const TYPE_ICON: Record<string, string> = {
  Fire: '🔥', Flood: '🌊', Medical: '🏥',
  Accident: '🚗', Typhoon: '🌀', Landslide: '⛰️',
  Trauma: '🩹', Crime: '🚨',
};

const STATUSES: (Status | 'ALL')[] = ['ALL', 'PENDING', 'REVIEWING', 'DISPATCHED', 'RESOLVED', 'REJECTED'];
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
  const [incidents,     setIncidents]     = useState<Incident[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [filterStatus,  setFilterStatus]  = useState<string>('ALL');
  const [filterType,    setFilterType]    = useState<string>('ALL');
  const [search,        setSearch]        = useState('');
  const [page,          setPage]          = useState(1);
  const [previewUrl,    setPreviewUrl]    = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null); // incidentId being acted on

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const res = await getIncidents();
      setIncidents(res.data);
    } catch { setIncidents([]); }
    finally  { setLoading(false); }
  };

  const quickAction = async (e: React.MouseEvent, incId: string, status: Status) => {
    e.stopPropagation();
    setActionLoading(incId + status);
    try {
      await updateIncidentStatus(incId, { status });
      setIncidents(prev => prev.map(inc => inc.id === incId ? { ...inc, status } : inc));
    } catch { /* silent — full details available on detail page */ }
    finally { setActionLoading(null); }
  };

  useEffect(() => {
    fetchIncidents();
    const iv = setInterval(fetchIncidents, 10000);
    return () => clearInterval(iv);
  }, []);

  // Reset to page 1 on filter change
  useEffect(() => setPage(1), [filterStatus, filterType, search]);

  const filtered = incidents.filter(inc => {
    const mStatus = filterStatus === 'ALL' || inc.status === filterStatus;
    const mType   = filterType   === 'ALL' || normalizeIncidentType(inc.aiDetectedType) === filterType;
    const mSearch = search === '' ||
      inc.id.toLowerCase().includes(search.toLowerCase()) ||
      (inc.aiDetectedType || '').toLowerCase().includes(search.toLowerCase()) ||
      (inc.aiRecommendedDept || '').toLowerCase().includes(search.toLowerCase());
    return mStatus && mType && mSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <>
      <Header title="Emergency Requests" subtitle="Manage and respond to incoming incident reports" />
      <div className="page-content" style={{ paddingTop: 8 }}>

        {/* ── Filter Bar ──────────────────────────────────── */}
        <div className="fade-in" style={{
          background: 'white', borderRadius: 14, padding: '16px 20px',
          marginBottom: 18, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #F1F5F9',
        }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 220, maxWidth: 340 }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              type="text"
              placeholder="Search by ID or type…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', boxSizing: 'border-box',
                padding: '10px 12px 10px 36px',
                border: '1.5px solid #E2E8F0', borderRadius: 10,
                fontSize: 13, outline: 'none', fontFamily: 'inherit', color: '#1E293B',
                background: '#F8FAFC',
              }}
              onFocus={e  => e.target.style.borderColor = '#2563EB'}
              onBlur={e   => e.target.style.borderColor = '#E2E8F0'}
            />
          </div>

          {/* Status filter */}
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            style={{ padding: '10px 14px', border: '1.5px solid #E2E8F0', borderRadius: 10, fontSize: 13, color: '#374151', background: '#F8FAFC', fontFamily: 'inherit', cursor: 'pointer', outline: 'none' }}
          >
            {STATUSES.map(s => <option key={s} value={s}>{s === 'ALL' ? 'All Status' : s}</option>)}
          </select>

          {/* Type filter */}
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            style={{ padding: '10px 14px', border: '1.5px solid #E2E8F0', borderRadius: 10, fontSize: 13, color: '#374151', background: '#F8FAFC', fontFamily: 'inherit', cursor: 'pointer', outline: 'none' }}
          >
            {['ALL', 'Fire', 'Flood', 'Medical', 'Trauma', 'Accident', 'Crime', 'Typhoon', 'Landslide'].map(t => (
              <option key={t} value={t}>{t === 'ALL' ? 'All Types' : `${TYPE_ICON[t] || ''} ${t}`}</option>
            ))}
          </select>

          <div style={{ flex: 1 }} />

          <button onClick={fetchIncidents} style={{ padding: '10px 16px', borderRadius: 10, border: '1.5px solid #E2E8F0', background: 'white', color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, fontFamily: 'inherit', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#2563EB'; e.currentTarget.style.color = '#2563EB'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.color = '#475569'; }}
          >
            <RefreshCw size={14} /> Refresh
          </button>
          <button style={{ padding: '10px 16px', borderRadius: 10, border: '1.5px solid #E2E8F0', background: 'white', color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, fontFamily: 'inherit' }}>
            <Download size={14} /> Export
          </button>
        </div>

        {/* ── Table ───────────────────────────────────────── */}
        <div className="fade-in" style={{ background: 'white', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #F1F5F9', animationDelay: '0.1s' }}>
          {loading ? (
            <RequestsTableSkeleton />
          ) : (
            <>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC' }}>
                      {['Request ID', 'Photo', 'Type', 'Location', 'AI Suggested', 'Status', 'Time', 'Action'].map(h => (
                        <th key={h} style={{ padding: '13px 18px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap', borderBottom: '1px solid #F1F5F9' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paged.map((inc, idx) => {
                      const ss = STATUS_STYLE[inc.status] || STATUS_STYLE.PENDING;
                      const normalized = normalizeIncidentType(inc.aiDetectedType);
                      const emoji = TYPE_ICON[normalized] || '⚠️';
                      return (
                        <tr
                          key={inc.id}
                          style={{ borderBottom: '1px solid #F8FAFC', background: idx % 2 === 0 ? 'white' : '#FAFBFC', cursor: 'pointer', transition: 'background 0.1s' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#EFF6FF'}
                          onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? 'white' : '#FAFBFC'}
                          onClick={() => navigate(`/requests/${inc.id}`)}
                        >
                          <td style={{ padding: '14px 18px', fontFamily: 'monospace', fontSize: 11, color: '#94A3B8', whiteSpace: 'nowrap' }}>
                            #{inc.id.slice(0, 8).toUpperCase()}
                          </td>
                          {/* Photo thumbnail */}
                          <td style={{ padding: '10px 18px' }} onClick={e => e.stopPropagation()}>
                            {inc.photoUrl ? (
                              <div
                                onClick={e => { e.stopPropagation(); setPreviewUrl(inc.photoUrl); }}
                                title="Click to preview"
                                style={{
                                  width: 44, height: 36, borderRadius: 8, overflow: 'hidden',
                                  border: '1.5px solid #E2E8F0', cursor: 'zoom-in',
                                  background: '#F8FAFC', flexShrink: 0,
                                  transition: 'border-color 0.15s, transform 0.15s',
                                }}
                                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#2563EB'; (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.08)'; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#E2E8F0'; (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)'; }}
                              >
                                <img src={inc.photoUrl} alt="Incident" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              </div>
                            ) : (
                              <div style={{ width: 44, height: 36, borderRadius: 8, background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Image size={16} color="#CBD5E1" />
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>
                            <span style={{ marginRight: 6 }}>{emoji}</span>
                            <span style={{ fontWeight: 600, color: '#1E293B' }}>{inc.aiDetectedType || 'Unknown'}</span>
                          </td>
                          <td style={{ padding: '14px 18px', color: '#475569', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {inc.latitude && inc.longitude
                              ? getNearestBarangay(inc.latitude, inc.longitude).split(',')[0]
                              : '—'}
                          </td>
                          <td style={{ padding: '14px 18px', color: '#475569' }}>
                            {inc.aiRecommendedDept || '—'}
                          </td>
                          <td style={{ padding: '14px 18px' }}>
                            <span style={{ padding: '4px 10px', borderRadius: 20, background: ss.bg, color: ss.color, fontSize: 10, fontWeight: 700, letterSpacing: '0.05em' }}>
                              {inc.status}
                            </span>
                          </td>
                          <td style={{ padding: '14px 18px', color: '#94A3B8', fontStyle: 'italic', whiteSpace: 'nowrap' }}>
                            {timeAgo(inc.createdAt)}
                          </td>
                          <td style={{ padding: '14px 18px' }} onClick={e => e.stopPropagation()}>
                            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'nowrap' }}>
                              {/* View details */}
                              <button
                                onClick={e => { e.stopPropagation(); navigate(`/requests/${inc.id}`); }}
                                style={{ padding: '6px 12px', borderRadius: 7, background: '#2563EB', color: 'white', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.15s', whiteSpace: 'nowrap' }}
                                onMouseEnter={e => e.currentTarget.style.background = '#1D4ED8'}
                                onMouseLeave={e => e.currentTarget.style.background = '#2563EB'}
                              >
                                View
                              </button>
                              {/* Quick Accept — only for PENDING */}
                              {inc.status === 'PENDING' && (
                                <button
                                  onClick={e => quickAction(e, inc.id, 'REVIEWING')}
                                  disabled={actionLoading === inc.id + 'REVIEWING'}
                                  title="Move to Reviewing"
                                  style={{
                                    padding: '6px 10px', borderRadius: 7, border: '1.5px solid #22C55E',
                                    background: 'transparent', color: '#16A34A', fontSize: 12, fontWeight: 700,
                                    cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4,
                                    transition: 'all 0.15s', whiteSpace: 'nowrap',
                                    opacity: actionLoading === inc.id + 'REVIEWING' ? 0.5 : 1,
                                  }}
                                  onMouseEnter={e => { e.currentTarget.style.background = '#F0FDF4'; }}
                                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                                >
                                  <CheckCircle2 size={13} /> Accept
                                </button>
                              )}
                              {/* Quick Reject — for PENDING and REVIEWING */}
                              {(inc.status === 'PENDING' || inc.status === 'REVIEWING') && (
                                <button
                                  onClick={e => quickAction(e, inc.id, 'REJECTED')}
                                  disabled={actionLoading === inc.id + 'REJECTED'}
                                  title="Reject this report"
                                  style={{
                                    padding: '6px 10px', borderRadius: 7, border: '1.5px solid #FCA5A5',
                                    background: 'transparent', color: '#EF4444', fontSize: 12, fontWeight: 700,
                                    cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4,
                                    transition: 'all 0.15s', whiteSpace: 'nowrap',
                                    opacity: actionLoading === inc.id + 'REJECTED' ? 0.5 : 1,
                                  }}
                                  onMouseEnter={e => { e.currentTarget.style.background = '#FEF2F2'; }}
                                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                                >
                                  <XCircle size={13} /> Reject
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {paged.length === 0 && (
                      <tr>
                        <td colSpan={7} style={{ padding: '64px 24px', textAlign: 'center', color: '#94A3B8' }}>
                          <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
                          <div style={{ fontSize: 15, fontWeight: 700, color: '#475569', marginBottom: 6 }}>No incidents found</div>
                          <div style={{ fontSize: 13 }}>
                            {incidents.length === 0
                              ? 'No reports submitted yet. Mobile reports will appear here automatically.'
                              : 'No incidents match your current search or filter.'}
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* ── Pagination ── */}
              {filtered.length > PAGE_SIZE && (
                <div style={{ padding: '14px 20px', borderTop: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: 13, color: '#64748B' }}>
                    Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} incidents
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                      style={{ padding: '6px 12px', borderRadius: 8, border: '1.5px solid #E2E8F0', background: 'white', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.4 : 1, display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600, color: '#374151', fontFamily: 'inherit' }}>
                      <ChevronLeft size={14} /> Prev
                    </button>
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(n => (
                      <button key={n} onClick={() => setPage(n)}
                        style={{ width: 34, height: 34, borderRadius: 8, border: '1.5px solid', borderColor: page === n ? '#2563EB' : '#E2E8F0', background: page === n ? '#2563EB' : 'white', color: page === n ? 'white' : '#374151', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' }}>
                        {n}
                      </button>
                    ))}
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                      style={{ padding: '6px 12px', borderRadius: 8, border: '1.5px solid #E2E8F0', background: 'white', cursor: page === totalPages ? 'not-allowed' : 'pointer', opacity: page === totalPages ? 0.4 : 1, display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600, color: '#374151', fontFamily: 'inherit' }}>
                      Next <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      {/* colSpan must match the new 8-column table */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── Photo Lightbox ─────────────────────────────────────── */}
      {previewUrl && (
        <div
          onClick={() => setPreviewUrl(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 10000,
            background: 'rgba(0,0,0,0.88)',
            backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'zoom-out',
          }}
        >
          <button
            onClick={() => setPreviewUrl(null)}
            style={{
              position: 'absolute', top: 24, right: 24,
              background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '50%', width: 44, height: 44,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'white',
            }}
          >
            <X size={22} />
          </button>
          <img
            src={previewUrl}
            alt="Incident photo"
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: '88vw', maxHeight: '88vh',
              borderRadius: 18,
              boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
              objectFit: 'contain',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          />
        </div>
      )}
    </>
  );
}
