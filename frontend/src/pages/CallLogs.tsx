import { useState } from 'react';
import Header from '../components/Header';
import { Phone, PhoneOff, PhoneIncoming, Clock, Search } from 'lucide-react';
import type { CallLog } from '../types';

const mockCallLogs: CallLog[] = [];

const statusIcon = { Accepted: PhoneIncoming, 'No Response': PhoneOff, Declined: PhoneOff };
const statusBadge = { Accepted: 'resolved', 'No Response': 'pending', Declined: 'rejected' };

export default function CallLogs() {
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const filtered = (filter === 'ALL' ? mockCallLogs : mockCallLogs.filter((c) => c.status === filter))
    .filter(log => search === '' ||
      log.id.toLowerCase().includes(search.toLowerCase()) ||
      log.callerName.toLowerCase().includes(search.toLowerCase()) ||
      log.department.toLowerCase().includes(search.toLowerCase())
    );

  const metrics = {
    total: mockCallLogs.length,
    accepted: mockCallLogs.filter((c) => c.status === 'Accepted').length,
    noResponse: mockCallLogs.filter((c) => c.status === 'No Response').length,
    declined: mockCallLogs.filter((c) => c.status === 'Declined').length,
  };

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
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={15} color="#94A3B8" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search call logs, caller identity, department..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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
                boxSizing: 'border-box',
              }}
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
            }}
          >
            <option value="ALL">All Call Statuses</option>
            <option value="Accepted">Accepted</option>
            <option value="No Response">No Response</option>
            <option value="Declined">Declined</option>
          </select>
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
            <table style={{ width: '100%', minWidth: 680, borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                  {['Log ID', 'Linked Request', 'Caller Identity', 'Target Department', 'Duration', 'Call Status', 'Timestamp'].map(h => (
                    <th key={h} style={{ padding: '14px 18px', fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '64px 24px', color: '#94A3B8' }}>
                      <div style={{
                        width: 48, height: 48, borderRadius: 12,
                        background: '#F8FAFC', border: '1px solid #E2E8F0',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 12px', color: '#64748B',
                      }}>
                        <Phone size={22} />
                      </div>
                      <div style={{ fontWeight: 700, color: '#0F172A', fontSize: 15 }}>No Call Logs Available</div>
                      <div style={{ fontSize: 13, marginTop: 4 }}>Field communications and 911 dispatch records will be indexed here in real time.</div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((log) => {
                    const Icon = statusIcon[log.status] || Phone;
                    return (
                      <tr key={log.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '14px 18px', fontWeight: 700, fontFamily: 'monospace', color: '#2563EB' }}>{log.id}</td>
                        <td style={{ padding: '14px 18px' }}><span style={{ color: '#2563EB', fontWeight: 600 }}>{log.requestId}</span></td>
                        <td style={{ padding: '14px 18px', fontWeight: 600, color: '#0F172A' }}>{log.callerName}</td>
                        <td style={{ padding: '14px 18px', color: '#475569' }}>{log.department}</td>
                        <td style={{ padding: '14px 18px', fontVariantNumeric: 'tabular-nums' }}>{log.duration}</td>
                        <td style={{ padding: '14px 18px' }}>
                          <span className={`badge ${statusBadge[log.status]}`}>
                            <Icon size={12} /> {log.status}
                          </span>
                        </td>
                        <td style={{ padding: '14px 18px', color: '#94A3B8', fontVariantNumeric: 'tabular-nums' }}>
                          {new Date(log.timestamp).toLocaleTimeString()}
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
