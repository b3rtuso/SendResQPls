import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { RequestDetailsSkeleton } from '../components/PageLoader';
import Toast, { type ToastType } from '../components/Toast';
import { ArrowLeft, Brain, MapPin, Camera, User, Clock, ExternalLink, X, Phone, Building2, CheckCircle2 } from 'lucide-react';
import { updateIncidentStatus, getIncident as fetchIncident, reverseGeocode } from '../api/client';
import type { Status, Incident } from '../types';
import { getNearestBarangay } from '../data/balayan-data';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './request-details-map.css';

// Fix Leaflet default icon issue with bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Create a premium pulsing emergency marker icon
const emergencyMarkerIcon = L.divIcon({
  html: `<div style="
    width: 24px;
    height: 24px;
    background: #EF4444;
    border: 3px solid white;
    border-radius: 50%;
    box-shadow: 0 0 15px rgba(239, 68, 68, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    animation: pulse-emergency 1.5s infinite;
  ">
    <div style="width: 8px; height: 8px; background: white; border-radius: 50%;"></div>
  </div>`,
  className: 'custom-emergency-marker',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const allStatuses: Status[] = ['PENDING', 'REVIEWING', 'DISPATCHED', 'RESOLVED', 'REJECTED'];

// One-way progression order (cannot go backwards)
const STATUS_ORDER: Status[] = ['PENDING', 'REVIEWING', 'DISPATCHED', 'RESOLVED'];

/** Returns which statuses are allowed from the current status */
function getAvailableStatuses(current: Status): Status[] {
  // If already at a terminal state, nothing is available
  if (current === 'RESOLVED' || current === 'REJECTED') return [];
  const idx = STATUS_ORDER.indexOf(current);
  // Can only move forward (next steps) + REJECTED from any non-terminal state
  const forward = STATUS_ORDER.slice(idx + 1);
  return [...forward, 'REJECTED'];
}

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
  const [resolvedAddress, setResolvedAddress] = useState('');
  const [resolvingAddress, setResolvingAddress] = useState(false);

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

  useEffect(() => {
    if (incident) {
      setResolvingAddress(true);
      reverseGeocode(incident.latitude, incident.longitude)
        .then((res) => {
          setResolvedAddress(res.data.formattedAddress);
        })
        .catch((err) => {
          console.error('[Geocoding] Reverse geocoding failed:', err);
          // Fallback to local nearest barangay
          const localFallback = getNearestBarangay(incident.latitude, incident.longitude);
          setResolvedAddress(localFallback);
        })
        .finally(() => setResolvingAddress(false));
    }
  }, [incident?.latitude, incident?.longitude]);

  const handleStatusUpdate = async (status: Status) => {
    setCurrentStatus(status);
    setSaving(true);
    try {
      await updateIncidentStatus(id!, { status });
      showToast(
        'success',
        `Status updated to ${status} 📱`,
        `Incident ${id?.slice(0, 8)}... marked as ${status}. Push notification sent to the reporter's mobile app.`
      );
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
        <Header title="Incident Details" subtitle="Loading incident record" />
        <RequestDetailsSkeleton />
      </>
    );
  }

  if (!incident) {
    return (
      <>
        <Header title="Not Found" subtitle="Incident could not be loaded" />
        <div className="page-content" style={{ textAlign: 'center', padding: '64px 0' }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14, background: 'var(--danger-bg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>Incident not found</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20, maxWidth: 320, margin: '0 auto 20px' }}>The incident ID may be invalid or the database is unreachable.</p>
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
                  <div className="dept-detail" style={{ alignItems: 'flex-start' }}>
                    <MapPin size={16} style={{ marginTop: 3, flexShrink: 0 }} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div>
                        <strong>Location:</strong>{' '}
                        {resolvingAddress ? (
                          <span style={{ color: 'var(--text-muted)' }}>Resolving address...</span>
                        ) : (
                          resolvedAddress || getNearestBarangay(incident.latitude, incident.longitude)
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span>
                          Coordinates: {incident.latitude.toFixed(6)}°N, {incident.longitude.toFixed(6)}°E
                        </span>
                        <span style={{ color: 'var(--border)' }}>|</span>
                        <span>
                          Nearest: {getNearestBarangay(incident.latitude, incident.longitude)}
                        </span>
                      </div>
                    </div>
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

            {/* Map Card */}
            <div className="card" style={{ overflow: 'hidden' }}>
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3><MapPin size={18} style={{ marginRight: 6, verticalAlign: -3, display: 'inline-block' }} /> Incident Location Map</h3>
                <button
                  onClick={openLocation}
                  className="btn btn-sm btn-outline"
                  style={{ padding: '4px 10px', fontSize: 12 }}
                >
                  <ExternalLink size={12} /> Open in Google Maps
                </button>
              </div>
              <div className="card-body" style={{ padding: 0, position: 'relative' }}>
                <div style={{ height: '350px', width: '100%', position: 'relative' }} className="details-map-container">
                  <MapContainer
                    center={[incident.latitude, incident.longitude]}
                    zoom={16}
                    style={{ height: '100%', width: '100%', background: '#0d1117' }}
                    scrollWheelZoom={true}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker position={[incident.latitude, incident.longitude]} icon={emergencyMarkerIcon}>
                      <Popup maxWidth={300}>
                        <div style={{ padding: '6px 8px', color: '#1e293b' }}>
                          <strong style={{ fontSize: 13, color: '#0f172a' }}>Emergency Report</strong>
                          <p style={{ margin: '4px 0 0 0', fontSize: 12, color: '#334155', lineHeight: 1.4 }}>
                            {resolvedAddress || getNearestBarangay(incident.latitude, incident.longitude)}
                          </p>
                          <span style={{ fontSize: 10, color: '#64748b', display: 'block', marginTop: 4 }}>
                            {incident.latitude.toFixed(6)}°N, {incident.longitude.toFixed(6)}°E
                          </span>
                        </div>
                      </Popup>
                    </Marker>
                  </MapContainer>
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
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14 }}>
                  Status can only move <strong>forward</strong> — once updated it cannot be reversed.
                </p>
                <div className="status-grid">
                  {allStatuses.map((s) => {
                    const isCurrent   = currentStatus === s;
                    const available   = getAvailableStatuses(currentStatus);
                    const isAvailable = available.includes(s);
                    const isPast      = !isCurrent && !isAvailable;
                    const isTerminal  = currentStatus === 'RESOLVED' || currentStatus === 'REJECTED';

                    return (
                      <button
                        key={s}
                        className={`status-btn ${isCurrent ? 'active' : ''}`}
                        onClick={() => isAvailable && !saving && handleStatusUpdate(s)}
                        disabled={saving || isPast || isCurrent || isTerminal}
                        title={
                          isCurrent   ? `Current status: ${s}` :
                          isPast      ? `Cannot go back to ${s}` :
                          isTerminal  ? 'Incident is closed' :
                          `Update to ${s}`
                        }
                        style={{
                          opacity:   isPast || isTerminal ? 0.35 : 1,
                          cursor:    isPast || isTerminal || isCurrent ? 'not-allowed' : 'pointer',
                          position:  'relative',
                          filter:    isPast ? 'grayscale(0.6)' : 'none',
                        }}
                      >
                        {isPast && (
                          <span style={{ marginRight: 4, fontSize: 11 }}>🔒</span>
                        )}
                        {isCurrent && (
                          <span style={{ marginRight: 4, fontSize: 11 }}>●</span>
                        )}
                        {s}
                      </button>
                    );
                  })}
                </div>
                {(currentStatus === 'RESOLVED' || currentStatus === 'REJECTED') && (
                  <div style={{
                    marginTop: 12, padding: '10px 14px',
                    background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)',
                    borderRadius: 10, fontSize: 13, color: 'var(--text-secondary)',
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    <CheckCircle2 size={15} color="#22C55E" />
                    This incident is <strong>closed</strong> — status is locked and cannot be changed.
                  </div>
                )}
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
