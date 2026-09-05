import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { Phone, PhoneOff, PhoneIncoming, Clock, Search, RefreshCw, ExternalLink, Trash2 } from 'lucide-react';
import type { CallLog } from '../types';
import { getCallLogs, deleteCallLog } from '../api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const statusIcon = { Accepted: PhoneIncoming, 'No Response': PhoneOff, Declined: PhoneOff };
const statusBadge = { Accepted: 'resolved', 'No Response': 'pending', Declined: 'rejected' };

export default function CallLogs() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [metrics, setMetrics] = useState({
    total: 0,
    accepted: 0,
    noResponse: 0,
    declined: 0,
  });

  const loadLogs = async () => {
    try {
      const res = await getCallLogs(filter, search);
      const data = res.data;
      if (data && data.logs) {
        setLogs(data.logs);
        setMetrics(data.metrics || {
          total: data.logs.length,
          accepted: data.logs.filter((l: any) => l.status === 'Accepted').length,
          noResponse: data.logs.filter((l: any) => l.status === 'No Response').length,
          declined: data.logs.filter((l: any) => l.status === 'Declined').length,
        });
      } else if (Array.isArray(data)) {
        setLogs(data);
        setMetrics({
          total: data.length,
          accepted: data.filter((l: any) => l.status === 'Accepted').length,
          noResponse: data.filter((l: any) => l.status === 'No Response').length,
          declined: data.filter((l: any) => l.status === 'Declined').length,
        });
      }
    } catch (err) {
      console.warn('[CallLogs] Failed to fetch call logs:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadLogs();
    const interval = setInterval(loadLogs, 8000);
    return () => clearInterval(interval);
  }, [filter, search]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadLogs();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this call log record?')) return;
    try {
      await deleteCallLog(id);
      loadLogs();
    } catch (err) {
      console.error('Failed to delete call log:', err);
    }
  };

  const filteredLogs = logs.filter(log => {
    if (filter !== 'ALL' && log.status !== filter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (log.id && log.id.toLowerCase().includes(q)) ||
      (log.callerName && log.callerName.toLowerCase().includes(q)) ||
      (log.department && log.department.toLowerCase().includes(q)) ||
      (log.contact && log.contact.toLowerCase().includes(q)) ||
      (log.requestId && log.requestId.toLowerCase().includes(q))
    );
  });

  return (
    <>
      <style>{`
        .cl-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 20px;
        }

        .cl-stat-card {
          background: #FFFFFF;
          border-radius: 14px;
          padding: 18px 20px;
          border: 1px solid #E2E8F0;
          box-shadow: 0 1px 3px rgba(15,23,42,0.03);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .cl-stat-label {
          font-size: 11px;
          font-weight: 700;
          color: #64748B;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 4px;
        }

        .cl-stat-value {
          font-size: 24px;
          font-weight: 800;
          color: #0F172A;
          font-variant-numeric: tabular-nums;
        }

        .cl-stat-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        @media (max-width: 900px) {
          .cl-stats-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
          }
        }

        @media (max-width: 640px) {
          .cl-stats-grid {
            grid-template-columns: 1fr;
            gap: 10px;
          }
        }
      `}</style>

      <Header title="Call & Radio Logs" subtitle="Communication records between dispatchers, citizens, and field units" />

      <div className="page-content" style={{ paddingTop: 12 }}>

        {/* ── Metric Summary Cards ── */}
        <div className="cl-stats-grid fade-in">
          <div className="cl-stat-card">
            <div>
              <div className="cl-stat-label">Total Logs</div>
              <div className="cl-stat-value">{metrics.total}</div>
            </div>
            <div className="cl-stat-icon" style={{ background: 'rgba(37, 99, 235, 0.08)', color: '#2563EB' }}>
              <Phone size={20} />
            </div>
          </div>

          <div className="cl-stat-card">
            <div>
              <div className="cl-stat-label">Accepted</div>
              <div className="cl-stat-value">{metrics.accepted}</div>
            </div>
            <div className="cl-stat-icon" style={{ background: 'rgba(34, 197, 94, 0.08)', color: '#16A34A' }}>
              <PhoneIncoming size={20} />
            </div>
          </div>

          <div className="cl-stat-card">
            <div>
              <div className="cl-stat-label">No Response</div>
              <div className="cl-stat-value">{metrics.noResponse}</div>
            </div>
            <div className="cl-stat-icon" style={{ background: 'rgba(245, 158, 11, 0.08)', color: '#D97706' }}>
              <Clock size={20} />
            </div>
          </div>

          <div className="cl-stat-card">
            <div>
              <div className="cl-stat-label">Declined</div>
              <div className="cl-stat-value">{metrics.declined}</div>
            </div>
            <div className="cl-stat-icon" style={{ background: 'rgba(239, 68, 68, 0.08)', color: '#DC2626' }}>
              <PhoneOff size={20} />
            </div>
          </div>
        </div>

        {/* ── Filter / Search Bar ── */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 260, position: 'relative' }}>
            <Search size={15} color="#94A3B8" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', zIndex: 1 }} />
            <Input
              type="text"
              placeholder="Search call logs, caller identity, department, phone number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-[#F8FAFC] text-sm h-10 border-[#E2E8F0]"
            />
          </div>

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{
              padding: '9px 14px',
              border: '1px solid #E2E8F0',
              borderRadius: 9,
              fontSize: 13,
              color: '#334155',
              background: '#F8FAFC',
              fontFamily: 'inherit',
              cursor: 'pointer',
              outline: 'none',
              fontWeight: 600,
              height: 40,
            }}
          >
            <option value="ALL">All Call Statuses</option>
            <option value="Accepted">Accepted</option>
            <option value="No Response">No Response</option>
            <option value="Declined">Declined</option>
          </select>

          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '9px 14px',
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: 9,
              fontSize: 13,
              fontWeight: 600,
              color: '#475569',
              height: 40,
            }}
          >
            <RefreshCw size={14} className={refreshing ? 'spin' : ''} /> Refresh
          </Button>
        </div>

        {/* ── Data Table ── */}
        <div className="fade-in" style={{
          background: '#FFFFFF',
          borderRadius: 16,
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          overflow: 'hidden',
        }}>
          <div className="table-responsive">
            <table style={{ width: '100%', minWidth: 720, borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  {['Log ID', 'Linked Request', 'Caller Identity', 'Target Department', 'Contact', 'Duration', 'Call Status', 'Timestamp', ''].map(h => (
                    <th key={h} style={{ padding: '14px 16px', fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '48px 24px', color: '#94A3B8' }}>
                      <RefreshCw size={20} className="spin" style={{ margin: '0 auto 8px', display: 'block' }} />
                      Loading communication records...
                    </td>
                  </tr>
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '64px 24px', color: '#94A3B8' }}>
                      <div style={{
                        width: 48, height: 48, borderRadius: 12,
                        background: '#F8FAFC', border: '1px solid #E2E8F0',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 12px', color: '#64748B',
                      }}>
                        <Phone size={22} />
                      </div>
                      <div style={{ fontWeight: 700, color: '#0F172A', fontSize: 15 }}>No Call Logs Available</div>
                      <div style={{ fontSize: 13, marginTop: 4 }}>Calls made to assigned units or citizens are automatically indexed here in real time.</div>
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => {
                    const Icon = (statusIcon as any)[log.status] || Phone;
                    const isIncidentLinked = log.requestId && log.requestId !== 'DIRECT_DISPATCH' && log.requestId !== 'DIRECT';
                    return (
                      <tr key={log.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '14px 16px', fontWeight: 700, fontFamily: 'monospace', color: '#2563EB' }}>
                          #{log.id.slice(0, 8)}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          {isIncidentLinked ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigate(`/admin/requests/${log.requestId}`)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                background: '#EFF6FF',
                                color: '#2563EB',
                                border: '1px solid #BFDBFE',
                                padding: '3px 8px',
                                borderRadius: 6,
                                fontSize: 12,
                                fontWeight: 700,
                                fontFamily: 'monospace',
                                height: 'auto',
                              }}
                            >
                              #{log.requestId?.slice(0, 8)} <ExternalLink size={11} />
                            </Button>
                          ) : (
                            <span style={{ fontSize: 12, color: '#94A3B8', fontWeight: 600 }}>Direct Dispatch</span>
                          )}
                        </td>
                        <td style={{ padding: '14px 16px', fontWeight: 600, color: '#0F172A' }}>{log.callerName}</td>
                        <td style={{ padding: '14px 16px', color: '#334155', fontWeight: 600 }}>{log.department}</td>
                        <td style={{ padding: '14px 16px', color: '#64748B', fontFamily: 'monospace' }}>
                          <a href={`tel:${log.contact?.replace(/[^0-9+]/g, '')}`} style={{ color: '#2563EB', textDecoration: 'none', fontWeight: 600 }}>
                            {log.contact}
                          </a>
                        </td>
                        <td style={{ padding: '14px 16px', fontVariantNumeric: 'tabular-nums', color: '#475569' }}>{log.duration}</td>
                        <td style={{ padding: '14px 16px' }}>
                          <Badge className={`badge ${(statusBadge as any)[log.status] || 'resolved'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <Icon size={12} /> {log.status}
                          </Badge>
                        </td>
                        <td style={{ padding: '14px 16px', color: '#64748B', fontSize: 12 }}>
                          {new Date(log.timestamp || log.createdAt || Date.now()).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })} • {new Date(log.timestamp || log.createdAt || Date.now()).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true,
                          })}
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(log.id)}
                            style={{
                              color: '#94A3B8',
                              padding: 4,
                              height: 30,
                              width: 30,
                            }}
                            title="Delete log"
                          >
                            <Trash2 size={15} />
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

