import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { Filter, Download, RefreshCw } from 'lucide-react';
import type { Incident, Status } from '../types';
import { getIncidents } from '../api/client';

const statusClass: Record<Status, string> = {
  PENDING: 'pending', REVIEWING: 'reviewing', DISPATCHED: 'dispatched', RESOLVED: 'resolved', REJECTED: 'rejected',
};

export default function Requests() {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [search, setSearch] = useState('');

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

  useEffect(() => {
    fetchIncidents();
    // Auto-refresh every 10 seconds to pick up new reports from mobile users
    const interval = setInterval(fetchIncidents, 10000);
    return () => clearInterval(interval);
  }, []);

  const filtered = incidents.filter((inc) => {
    const matchesStatus = filterStatus === 'ALL' || inc.status === filterStatus;
    const matchesSearch = search === '' || inc.aiDetectedType?.toLowerCase().includes(search.toLowerCase()) || inc.id.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <>
      <Header title="Incident Requests" subtitle="Manage and respond to incoming disaster reports" />
      <div className="page-content">
        {/* Filters */}
        <div className="filters-bar fade-in">
          <div className="search-bar" style={{ minWidth: 220 }}>
            <Filter size={16} color="var(--text-muted)" />
            <input type="text" placeholder="Search by ID or type..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="filter-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="ALL">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="REVIEWING">Reviewing</option>
            <option value="DISPATCHED">Dispatched</option>
            <option value="RESOLVED">Resolved</option>
            <option value="REJECTED">Rejected</option>
          </select>
          <div style={{ flex: 1 }} />
          <button className="btn btn-outline btn-sm" onClick={fetchIncidents}>
            <RefreshCw size={14} /> Refresh
          </button>
          <button className="btn btn-outline btn-sm"><Download size={14} /> Export CSV</button>
        </div>

        {/* Table */}
        <div className="card fade-in" style={{ animationDelay: '0.1s' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
              <div className="spin" style={{ display: 'inline-block' }}><RefreshCw size={28} /></div>
              <p style={{ marginTop: 12, fontSize: 14 }}>Loading incidents from database...</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Request ID</th>
                  <th>Incident Type</th>
                  <th>AI Recommended</th>
                  <th>Assigned Dept</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((inc) => (
                  <tr key={inc.id}>
                    <td><span className="table-link" onClick={() => navigate(`/requests/${inc.id}`)}>{inc.id.slice(0, 8)}...</span></td>
                    <td>{inc.aiDetectedType || 'Unidentified'}</td>
                    <td>{inc.aiRecommendedDept || '—'}</td>
                    <td>{inc.assignedDepartment || '—'}</td>
                    <td><span className={`badge ${statusClass[inc.status]}`}>{inc.status}</span></td>
                    <td>{new Date(inc.createdAt).toLocaleDateString()}</td>
                    <td><button className="btn btn-primary btn-sm" onClick={() => navigate(`/requests/${inc.id}`)}>View</button></td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7}>
                      <div className="empty-state">
                        <div className="empty-icon">📋</div>
                        <h3>No incidents found</h3>
                        <p style={{ color: 'var(--text-muted)', marginTop: 4, fontSize: 13 }}>
                          {incidents.length === 0
                            ? 'No reports have been submitted yet. Reports from mobile users will appear here automatically.'
                            : 'No incidents match your search/filter criteria.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
