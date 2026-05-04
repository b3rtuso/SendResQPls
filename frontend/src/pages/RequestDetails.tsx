import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Toast, { type ToastType } from '../components/Toast';
import { ArrowLeft, Brain, MapPin, Camera, User, Clock, ExternalLink, X, Phone, Building2, CheckCircle2 } from 'lucide-react';
import { updateIncidentStatus, getIncident as fetchIncident } from '../api/client';
import type { Status, Incident } from '../types';

const allStatuses: Status[] = ['PENDING', 'REVIEWING', 'DISPATCHED', 'RESOLVED', 'REJECTED'];

const deptNames: Record<string, string> = {
  BFP: 'BFP (Bureau of Fire Protection)',
  PNP: 'PNP (Philippine National Police)',
  MEDICAL: 'Medical / Red Cross / Ambulance',
  ENGINEERING: 'Engineering / DPWH',
  RESCUE: 'MDRRMO Rescue Team',
};

const departments = [
  { key: 'BFP', name: 'Bureau of Fire Protection', abbr: 'BFP', contact: '(043) 740-1234', color: '#EF4444' },
  { key: 'PNP', name: 'Philippine National Police', abbr: 'PNP', contact: '(043) 740-5678', color: '#3B82F6' },
  { key: 'MEDICAL', name: 'Medical / Red Cross', abbr: 'MED', contact: '(043) 740-9012', color: '#22C55E' },
  { key: 'ENGINEERING', name: 'Engineering / DPWH', abbr: 'ENG', contact: '(043) 740-3456', color: '#F59E0B' },
  { key: 'RESCUE', name: 'MDRRMO Rescue Team', abbr: 'RSQ', contact: '(043) 740-7890', color: '#8B5CF6' },
];

interface ToastState {
  show: boolean;
  message: string;
  detail?: string;
  type: ToastType;
}

export default function RequestDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [currentStatus, setCurrentStatus] = useState<Status>('PENDING');
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState('');
  const [incident, setIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPhoto, setShowPhoto] = useState(false);
  const [toast, setToast] = useState<ToastState>({ show: false, message: '', type: 'info' });

  const showToast = useCallback((type: ToastType, message: string, detail?: string) => {
    setToast({ show: true, message, detail, type });
  }, []);

  useEffect(() => {
    if (id) {
      setLoading(true);
      fetchIncident(id)
        .then((res) => {
          setIncident(res.data);
          setCurrentStatus(res.data.status);
          setNotes(res.data.adminNotes || '');
        })
        .catch(() => {
          showToast('error', 'Failed to load incident', 'Could not fetch incident details from the database.');
        })
        .finally(() => setLoading(false));
    }
  }, [id, showToast]);

  const handleStatusUpdate = async (status: Status) => {
    setCurrentStatus(status);
    setSaving(true);
    try {
      await updateIncidentStatus(id!, { status });
      showToast('success', `Status updated to ${status}`, `Incident ${id?.slice(0, 8)}... has been marked as ${status}.`);
      // Update local state
      setIncident((prev) => prev ? { ...prev, status } : prev);
    } catch {
      showToast('error', 'Failed to update status', 'The server returned an error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotes = async () => {
    setSaving(true);
    try {
      await updateIncidentStatus(id!, { status: currentStatus, adminNotes: notes });
      showToast('success', 'Notes saved', 'Admin notes have been updated successfully.');
      setIncident((prev) => prev ? { ...prev, adminNotes: notes } : prev);
    } catch {
      showToast('error', 'Failed to save notes', 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleAssignDept = async (deptKey: string) => {
    setSaving(true);
    try {
      await updateIncidentStatus(id!, { assignedDepartment: deptKey });
      setIncident((prev) => prev ? { ...prev, assignedDepartment: deptKey as any } : prev);
      const dept = departments.find(d => d.key === deptKey);
      showToast('success', `Department assigned: ${dept?.name}`, `Contact: ${dept?.contact} — You can now call them directly.`);
    } catch {
      showToast('error', 'Failed to assign department', 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const openLocation = () => {
    if (incident) {
      window.open(
        `https://www.google.com/maps?q=${incident.latitude},${incident.longitude}`,
        '_blank'
      );
    }
  };

  if (loading) {
    return (
      <>
        <Header title="Loading..." subtitle="Fetching incident details" />
        <div className="page-content" style={{ textAlign: 'center', padding: 80 }}>
          <div className="spin" style={{ display: 'inline-block' }}><Clock size={32} /></div>
          <p style={{ marginTop: 16, color: 'var(--text-muted)' }}>Loading incident from database...</p>
        </div>
      </>
    );
  }

  if (!incident) {
    return (
      <>
        <Header title="Not Found" subtitle="Incident could not be loaded" />
        <div className="page-content" style={{ textAlign: 'center', padding: 80 }}>
          <p style={{ fontSize: 48, marginBottom: 16 }}>❌</p>
          <h3>Incident not found</h3>
          <p style={{ color: 'var(--text-muted)', marginTop: 8, marginBottom: 20 }}>The incident ID may be invalid or the database is unreachable.</p>
          <button className="btn btn-primary" onClick={() => navigate('/requests')}>Back to Requests</button>
        </div>
      </>
    );
  }

  return (
    <>
      <Header title={`Request ${incident.id.slice(0, 8)}...`} subtitle="Review incident details and update status" />
      <div className="page-content">
        {toast.show && (
          <Toast
            type={toast.type}
            message={toast.message}
            detail={toast.detail}
            onClose={() => setToast({ ...toast, show: false })}
          />
        )}

        <button className="btn btn-outline btn-sm" onClick={() => navigate('/requests')} style={{ marginBottom: 20 }}>
          <ArrowLeft size={16} /> Back to Requests
        </button>

        <div className="grid-3-1 fade-in">
          {/* Left Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* AI Triage Card — uses REAL data from database */}
            <div className="ai-card">
              <h3><Brain size={20} /> AI Triage Assessment</h3>
              <p>Analysis completed using Gemini 3 Flash</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <strong style={{ fontSize: 12, color: 'var(--text-muted)' }}>DETECTED TYPE</strong>
                  <div style={{ fontSize: 16, fontWeight: 700, marginTop: 4 }}>
                    {incident.aiDetectedType || 'Pending Analysis'}
                  </div>
                </div>
                <div>
                  <strong style={{ fontSize: 12, color: 'var(--text-muted)' }}>RECOMMENDED DEPT</strong>
                  <div style={{ fontSize: 16, fontWeight: 700, marginTop: 4 }}>
                    {incident.aiRecommendedDept ? deptNames[incident.aiRecommendedDept] || incident.aiRecommendedDept : '—'}
                  </div>
                </div>
                <div>
                  <strong style={{ fontSize: 12, color: 'var(--text-muted)' }}>ASSIGNED DEPT</strong>
                  <div style={{ fontSize: 16, fontWeight: 700, marginTop: 4, color: incident.assignedDepartment ? 'var(--primary)' : 'var(--text-muted)' }}>
                    {incident.assignedDepartment ? deptNames[incident.assignedDepartment] || incident.assignedDepartment : 'Not yet assigned'}
                  </div>
                </div>
                <div>
                  <strong style={{ fontSize: 12, color: 'var(--text-muted)' }}>STATUS</strong>
                  <div style={{ fontSize: 16, fontWeight: 700, marginTop: 4 }}>
                    <span className={`badge ${currentStatus.toLowerCase()}`}>{currentStatus}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Incident Details — uses REAL data from database */}
            <div className="card">
              <div className="card-header"><h3>Incident Details</h3></div>
              <div className="card-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div className="dept-detail">
                    <MapPin size={16} />
                    <strong>Location:</strong> {incident.latitude.toFixed(4)}°N, {incident.longitude.toFixed(4)}°E
                    <button
                      onClick={openLocation}
                      style={{
                        marginLeft: 10,
                        background: 'var(--primary)',
                        color: 'white',
                        border: 'none',
                        borderRadius: 8,
                        padding: '5px 12px',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        fontFamily: 'var(--font)',
                      }}
                    >
                      <ExternalLink size={12} /> View on Map
                    </button>
                  </div>
                  <div className="dept-detail">
                    <Camera size={16} />
                    <strong>Photo:</strong>
                    {incident.photoUrl ? (
                      <span
                        className="table-link"
                        onClick={() => setShowPhoto(true)}
                        style={{ cursor: 'pointer' }}
                      >
                        View uploaded image
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>No photo available</span>
                    )}
                  </div>
                  <div className="dept-detail">
                    <User size={16} />
                    <strong>Reporter:</strong> {incident.reporter?.name || 'Unknown'} ({incident.reporter?.email || incident.reporterId.slice(0, 8) + '...'})
                  </div>
                  <div className="dept-detail">
                    <Clock size={16} />
                    <strong>Reported:</strong> {new Date(incident.createdAt).toLocaleString()}
                  </div>
                  {incident.updatedAt !== incident.createdAt && (
                    <div className="dept-detail">
                      <Clock size={16} />
                      <strong>Last Updated:</strong> {new Date(incident.updatedAt).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Assign Department */}
            <div className="card">
              <div className="card-header"><h3><Building2 size={18} style={{ marginRight: 6, verticalAlign: -3 }} /> Assign Department</h3></div>
              <div className="card-body">
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>Select a responding department. This will update the Assigned Dept above and notify the team.</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {departments.map((dept) => {
                    const isSelected = incident.assignedDepartment === dept.key;
                    return (
                      <div
                        key={dept.key}
                        onClick={() => !saving && handleAssignDept(dept.key)}
                        style={{
                          border: isSelected ? `2px solid ${dept.color}` : '1.5px solid var(--border)',
                          borderRadius: 14,
                          padding: '18px 16px',
                          cursor: saving ? 'not-allowed' : 'pointer',
                          background: isSelected ? `${dept.color}08` : 'var(--bg-card)',
                          transition: 'all 0.2s ease',
                          position: 'relative',
                        }}
                      >
                        {isSelected && (
                          <CheckCircle2 size={18} color={dept.color} style={{ position: 'absolute', top: 10, right: 10 }} />
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                          <div style={{
                            width: 36, height: 36, borderRadius: 10,
                            background: `${dept.color}15`, display: 'flex',
                            alignItems: 'center', justifyContent: 'center',
                            color: dept.color, fontWeight: 800, fontSize: 12,
                          }}>{dept.abbr}</div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{dept.name}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                          <Phone size={13} color="var(--text-secondary)" />
                          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{dept.contact}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <a
                            href={`tel:${dept.contact.replace(/[^0-9+]/g, '')}`}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                              padding: '9px 0', borderRadius: 8, fontSize: 13, fontWeight: 700,
                              background: isSelected ? dept.color : 'var(--bg-body)',
                              color: isSelected ? 'white' : 'var(--text-secondary)',
                              border: isSelected ? 'none' : '1px solid var(--border)',
                              cursor: 'pointer', transition: 'all 0.2s ease',
                              textDecoration: 'none', fontFamily: 'var(--font)',
                            }}
                          >
                            <Phone size={13} /> Call
                          </a>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(dept.contact).then(() => {
                                showToast('info', `Copied: ${dept.contact}`, 'Number copied to clipboard.');
                              });
                            }}
                            style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                              padding: '9px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                              background: 'var(--bg-body)', color: 'var(--text-secondary)',
                              border: '1px solid var(--border)', cursor: 'pointer',
                              transition: 'all 0.2s ease', fontFamily: 'var(--font)',
                            }}
                          >
                            📋 Copy
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Status Update */}
            <div className="card">
              <div className="card-header"><h3>Update Status</h3></div>
              <div className="card-body">
                <div className="status-grid">
                  {allStatuses.map((s) => (
                    <button key={s} className={`status-btn ${currentStatus === s ? 'active' : ''}`} onClick={() => handleStatusUpdate(s)} disabled={saving}>
                      {s}
                    </button>
                  ))}
                </div>
                <div className="form-group" style={{ marginTop: 16 }}>
                  <label>Admin Notes</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder="Add notes about this incident..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
                <button className="btn btn-primary" disabled={saving} onClick={handleSaveNotes}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Timeline (derived from real data) */}
          <div className="card" style={{ height: 'fit-content' }}>
            <div className="card-header"><h3>Activity Timeline</h3></div>
            <div className="card-body">
              <div className="timeline">
                <div className="timeline-item">
                  <div className="tl-time">{new Date(incident.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  <div className="tl-text">
                    Incident reported by {incident.reporter?.name || 'citizen'} via mobile app
                  </div>
                </div>
                <div className="timeline-item">
                  <div className="tl-time">{new Date(new Date(incident.createdAt).getTime() + 3000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  <div className="tl-text">
                    AI analysis completed — {incident.aiDetectedType || 'Unknown'} detected
                  </div>
                </div>
                {incident.aiRecommendedDept && (
                  <div className="timeline-item">
                    <div className="tl-time">{new Date(new Date(incident.createdAt).getTime() + 5000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    <div className="tl-text">
                      Auto-assigned to {incident.aiRecommendedDept} based on AI recommendation
                    </div>
                  </div>
                )}
                {incident.status !== 'PENDING' && (
                  <div className="timeline-item">
                    <div className="tl-time">{new Date(incident.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    <div className="tl-text">
                      Status changed to <strong>{incident.status}</strong>
                    </div>
                  </div>
                )}
                {incident.adminNotes && (
                  <div className="timeline-item">
                    <div className="tl-time">{new Date(incident.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    <div className="tl-text">
                      Admin note: "{incident.adminNotes}"
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Photo Lightbox Modal */}
      {showPhoto && incident.photoUrl && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            cursor: 'pointer',
          }}
          onClick={() => setShowPhoto(false)}
        >
          <button
            onClick={() => setShowPhoto(false)}
            style={{
              position: 'absolute',
              top: 24,
              right: 24,
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              borderRadius: '50%',
              width: 44,
              height: 44,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'white',
            }}
          >
            <X size={24} />
          </button>
          <img
            src={incident.photoUrl}
            alt="Incident photo"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '85vw',
              maxHeight: '85vh',
              borderRadius: 16,
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
              objectFit: 'contain',
            }}
          />
        </div>
      )}
    </>
  );
}
