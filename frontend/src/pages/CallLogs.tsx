import { useState } from 'react';
import Header from '../components/Header';
import { Phone, PhoneOff, PhoneIncoming, Clock } from 'lucide-react';
import type { CallLog } from '../types';

const mockCallLogs: CallLog[] = [];

const statusIcon = { Accepted: PhoneIncoming, 'No Response': PhoneOff, Declined: PhoneOff };
const statusBadge = { Accepted: 'resolved', 'No Response': 'pending', Declined: 'rejected' };

export default function CallLogs() {
  const [filter, setFilter] = useState('ALL');
  const filtered = filter === 'ALL' ? mockCallLogs : mockCallLogs.filter((c) => c.status === filter);

  const metrics = {
    total: mockCallLogs.length,
    accepted: mockCallLogs.filter((c) => c.status === 'Accepted').length,
    noResponse: mockCallLogs.filter((c) => c.status === 'No Response').length,
    declined: mockCallLogs.filter((c) => c.status === 'Declined').length,
  };

  return (
    <>
      <Header title="Call Logs" subtitle="Track all incoming and outgoing emergency calls" />
      <div className="page-content">
        {/* Metrics */}
        <div className="stats-grid fade-in">
          <div className="stat-card">
            <div className="stat-info"><h3>Total Calls</h3><div className="stat-value">{metrics.total}</div></div>
            <div className="stat-icon blue"><Phone size={22} /></div>
          </div>
          <div className="stat-card">
            <div className="stat-info"><h3>Accepted</h3><div className="stat-value">{metrics.accepted}</div></div>
            <div className="stat-icon green"><PhoneIncoming size={22} /></div>
          </div>
          <div className="stat-card">
            <div className="stat-info"><h3>No Response</h3><div className="stat-value">{metrics.noResponse}</div></div>
            <div className="stat-icon yellow"><Clock size={22} /></div>
          </div>
          <div className="stat-card">
            <div className="stat-info"><h3>Declined</h3><div className="stat-value">{metrics.declined}</div></div>
            <div className="stat-icon red"><PhoneOff size={22} /></div>
          </div>
        </div>

        <div className="filters-bar">
          <select className="filter-select" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="ALL">All Calls</option>
            <option value="Accepted">Accepted</option>
            <option value="No Response">No Response</option>
            <option value="Declined">Declined</option>
          </select>
        </div>

        <div className="card fade-in" style={{ animationDelay: '0.1s' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Call ID</th>
                <th>Request ID</th>
                <th>Caller</th>
                <th>Department</th>
                <th>Duration</th>
                <th>Status</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 48,
                        height: 48,
                        borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.03)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid var(--border-color)',
                        marginBottom: 4
                      }}>
                        <Phone size={20} style={{ color: 'var(--text-secondary)' }} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 14 }}>No Call Logs</div>
                        <div style={{ fontSize: 12, marginTop: 4, opacity: 0.7 }}>Emergency call history will appear here once calls are initiated.</div>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((log) => {
                  const Icon = statusIcon[log.status] || Phone;
                  return (
                    <tr key={log.id}>
                      <td style={{ fontWeight: 600 }}>{log.id}</td>
                      <td><span className="table-link">{log.requestId}</span></td>
                      <td>{log.callerName}</td>
                      <td>{log.department}</td>
                      <td>{log.duration}</td>
                      <td><span className={`badge ${statusBadge[log.status]}`}><Icon size={12} /> {log.status}</span></td>
                      <td>{new Date(log.timestamp).toLocaleTimeString()}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
