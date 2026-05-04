import { useState } from 'react';
import Header from '../components/Header';
import { Phone, PhoneOff, PhoneIncoming, Clock } from 'lucide-react';
import type { CallLog } from '../types';

const mockCallLogs: CallLog[] = [
  { id: 'CL-001', requestId: 'INC-2026-001', callerName: 'Juan Dela Cruz', department: 'BFP', duration: '3:24', status: 'Accepted', timestamp: '2026-05-04T08:15:00Z' },
  { id: 'CL-002', requestId: 'INC-2026-002', callerName: 'Maria Santos', department: 'RESCUE', duration: '0:00', status: 'No Response', timestamp: '2026-05-04T07:30:00Z' },
  { id: 'CL-003', requestId: 'INC-2026-003', callerName: 'Pedro Reyes', department: 'ENGINEERING', duration: '1:45', status: 'Accepted', timestamp: '2026-05-04T07:50:00Z' },
  { id: 'CL-004', requestId: 'INC-2026-004', callerName: 'Ana Gonzales', department: 'MEDICAL', duration: '0:12', status: 'Declined', timestamp: '2026-05-03T15:10:00Z' },
  { id: 'CL-005', requestId: 'INC-2026-005', callerName: 'Carlos Mendoza', department: 'PNP', duration: '2:10', status: 'Accepted', timestamp: '2026-05-04T08:05:00Z' },
];

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
              {filtered.map((log) => {
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
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
