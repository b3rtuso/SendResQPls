import { useState, useEffect, useMemo } from 'react';
import Header from '../components/Header';
import {
  Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { TrendingUp, FileText, Download, MapPin } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './analytics-map.css';
import {
  BALAYAN_CENTER, BALAYAN_BOUNDS, BARANGAYS, INCIDENT_TYPES,
  type Barangay,
} from '../data/balayan-data';

// Fix Leaflet default icon issue with bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ---- Existing hardcoded data (kept) ----
const forecastData = [
  { month: 'Jan', total: 18, predicted: 16, resolved: 12 },
  { month: 'Feb', total: 15, predicted: 17, resolved: 10 },
  { month: 'Mar', total: 20, predicted: 19, resolved: 14 },
  { month: 'Apr', total: 17, predicted: 20, resolved: 13 },
  { month: 'May', total: 22, predicted: 21, resolved: 16 },
  { month: 'Jun', total: 19, predicted: 23, resolved: 15 },
  { month: 'Jul', total: null, predicted: 25, resolved: null },
  { month: 'Aug', total: null, predicted: 28, resolved: null },
  { month: 'Sep', total: null, predicted: 26, resolved: null },
  { month: 'Oct', total: null, predicted: 24, resolved: null },
  { month: 'Nov', total: null, predicted: 27, resolved: null },
  { month: 'Dec', total: null, predicted: 22, resolved: null },
];

const distributionData = [
  { month: 'Jul', total: 18, completed: 12 },
  { month: 'Aug', total: 17, completed: 14 },
  { month: 'Sep', total: 15, completed: 11 },
  { month: 'Oct', total: 16, completed: 13 },
  { month: 'Nov', total: 19, completed: 15 },
  { month: 'Dec', total: 14, completed: 10 },
];

const monthlyDetails = [
  { month: 'Jan', type: 'Fire', typeClass: 'fire', desc: 'Increased fire hazards due to dry weather and holiday fireworks remnants.' },
  { month: 'Feb', type: 'Medical', typeClass: 'medical', desc: 'Spike in respiratory issues during colder nights.' },
  { month: 'Mar', type: 'Fire', typeClass: 'fire', desc: 'Peak of dry season; highest risk of residential fires.' },
  { month: 'Apr', type: 'Fire', typeClass: 'fire', desc: 'Continued dry season and intense heatwaves.' },
  { month: 'May', type: 'Accident', typeClass: 'accident', desc: 'Increased travel during summer vacations leading to vehicular accidents.' },
  { month: 'Jun', type: 'Flood', typeClass: 'flood', desc: 'Onset of the rainy season and early monsoons.' },
  { month: 'Jul', type: 'Typhoon', typeClass: 'typhoon', desc: 'Peak typhoon season bringing heavy rains and winds.' },
  { month: 'Aug', type: 'Flood', typeClass: 'flood', desc: 'Continuous heavy monsoon rains resulting in widespread flooding.' },
  { month: 'Sep', type: 'Typhoon', typeClass: 'typhoon', desc: 'Late-season typhoons combined with saturated ground leading to severe storms.' },
  { month: 'Oct', type: 'Landslide', typeClass: 'landslide', desc: 'Soil saturation from prolonged rainy season causes ground instability.' },
  { month: 'Nov', type: 'Typhoon', typeClass: 'typhoon', desc: 'Unexpected late-year strong typhoons often hit during this period.' },
  { month: 'Dec', type: 'Fire', typeClass: 'fire', desc: 'Holiday season activities, electrical overloads, and fireworks.' },
];

const reportData = [
  { id: 'RPT-001', title: 'Monthly Incident Summary — April 2026', generated: '2026-05-01', type: 'Monthly' },
  { id: 'RPT-002', title: 'Fire Incident Deep Dive — Q1 2026', generated: '2026-04-15', type: 'Quarterly' },
  { id: 'RPT-003', title: 'Flood Response Metrics', generated: '2026-04-10', type: 'Custom' },
  { id: 'RPT-004', title: 'Annual Performance Report 2025', generated: '2026-01-05', type: 'Annual' },
];

const tooltipStyle = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-md)',
  fontSize: '13px',
};

// ---- Map Utilities ----

function createMarkerIcon(riskLevel: string): L.DivIcon {
  const riskClass = `risk-${riskLevel.toLowerCase()}`;
  const initial = riskLevel[0];
  return L.divIcon({
    className: '',
    html: `<div class="brgy-marker ${riskClass}" style="background: ${
      riskLevel === 'HIGH' ? 'linear-gradient(135deg, #EF4444, #DC2626)' :
      riskLevel === 'MEDIUM' ? 'linear-gradient(135deg, #F59E0B, #D97706)' :
      'linear-gradient(135deg, #22C55E, #16A34A)'
    }">${initial}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -20],
  });
}

// Component to restrict map bounds
function MapBoundsController() {
  const map = useMap();
  useEffect(() => {
    const bounds = L.latLngBounds(
      [BALAYAN_BOUNDS.south - 0.01, BALAYAN_BOUNDS.west - 0.01],
      [BALAYAN_BOUNDS.north + 0.01, BALAYAN_BOUNDS.east + 0.01]
    );
    map.setMaxBounds(bounds);
    map.setMinZoom(12);
  }, [map]);
  return null;
}

// ---- Popup Content Builder ----
function buildPopupContent(brgy: Barangay, incidentType: string): string {
  const risk = brgy.riskProfile[incidentType];
  if (!risk) return '';
  const incType = INCIDENT_TYPES.find(t => t.id === incidentType);
  const riskClass = risk.riskLevel.toLowerCase();

  return `
    <div class="map-popup">
      <div class="popup-header">
        <div class="popup-icon" style="background: ${incType?.color || '#3B82F6'}22; color: ${incType?.color || '#3B82F6'};">
          ${incType?.icon || '📍'}
        </div>
        <div>
          <div class="popup-title">${brgy.name}</div>
          <div class="popup-subtitle">${incType?.label || incidentType} Risk Assessment</div>
        </div>
      </div>
      <div class="risk-badge ${riskClass}">
        ${riskClass === 'high' ? '🔴' : riskClass === 'medium' ? '🟡' : '🟢'}
        ${risk.riskLevel} RISK
      </div>
      <div class="prescription-box">
        <div class="prescription-label">📋 Recommended Action</div>
        <div class="prescription-text">${risk.prescription}</div>
      </div>
    </div>
  `;
}

// ---- Main Component ----
export default function Analytics() {
  const [tab, setTab] = useState<'map' | 'forecast' | 'reports'>('map');
  const [selectedType, setSelectedType] = useState('fire');

  // Compute stats for current incident type
  const riskStats = useMemo(() => {
    let high = 0, medium = 0, low = 0;
    BARANGAYS.forEach(b => {
      const r = b.riskProfile[selectedType];
      if (r) {
        if (r.riskLevel === 'HIGH') high++;
        else if (r.riskLevel === 'MEDIUM') medium++;
        else low++;
      }
    });
    return { high, medium, low, total: BARANGAYS.length };
  }, [selectedType]);

  const currentIncident = INCIDENT_TYPES.find(t => t.id === selectedType);

  return (
    <>
      <Header title="Analytics & Reports" subtitle="Forecasting, incident mapping, and analysis" />
      <div className="page-content">
        <div className="tabs fade-in">
          <button className={`tab ${tab === 'map' ? 'active' : ''}`} onClick={() => setTab('map')}>
            <MapPin size={16} style={{ marginRight: 6, verticalAlign: -3 }} /> Incident Map
          </button>
          <button className={`tab ${tab === 'forecast' ? 'active' : ''}`} onClick={() => setTab('forecast')}>
            <TrendingUp size={16} style={{ marginRight: 6, verticalAlign: -3 }} /> Incident Forecast
          </button>
          <button className={`tab ${tab === 'reports' ? 'active' : ''}`} onClick={() => setTab('reports')}>
            <FileText size={16} style={{ marginRight: 6, verticalAlign: -3 }} /> Incident Reports
          </button>
        </div>

        {/* ============ MAP TAB ============ */}
        {tab === 'map' && (
          <div className="fade-in">
            <div className="analytics-map-wrapper">
              {/* Floating Filter Bar */}
              <div className="map-filter-bar">
                <span className="filter-label">Filter by</span>
                {INCIDENT_TYPES.map(t => (
                  <button
                    key={t.id}
                    className={`incident-pill ${selectedType === t.id ? 'active' : ''}`}
                    style={{ '--pill-color': t.color } as React.CSSProperties}
                    onClick={() => setSelectedType(t.id)}
                  >
                    <span className="pill-emoji">{t.icon}</span>
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Leaflet Map */}
              <MapContainer
                center={[BALAYAN_CENTER.lat, BALAYAN_CENTER.lng]}
                zoom={13}
                className="analytics-map-container"
                scrollWheelZoom={true}
                zoomControl={true}
              >
                <TileLayer
                  attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />
                <MapBoundsController />

                {BARANGAYS.map(brgy => {
                  const risk = brgy.riskProfile[selectedType];
                  if (!risk) return null;
                  return (
                    <Marker
                      key={brgy.name}
                      position={[brgy.lat, brgy.lng]}
                      icon={createMarkerIcon(risk.riskLevel)}
                    >
                      <Popup maxWidth={300} minWidth={280}>
                        <div dangerouslySetInnerHTML={{ __html: buildPopupContent(brgy, selectedType) }} />
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>

              {/* Legend */}
              <div className="map-legend">
                <div className="legend-item">
                  <div className="legend-dot" style={{ background: '#EF4444' }}></div>
                  High Risk
                </div>
                <div className="legend-item">
                  <div className="legend-dot" style={{ background: '#F59E0B' }}></div>
                  Medium Risk
                </div>
                <div className="legend-item">
                  <div className="legend-dot" style={{ background: '#22C55E' }}></div>
                  Low Risk
                </div>
              </div>
            </div>

            {/* Stats Bar */}
            <div className="map-stats-bar">
              <div className="map-stat-card" style={{ '--stat-color': '#EF4444' } as React.CSSProperties}>
                <div className="stat-number">{riskStats.high}</div>
                <div className="stat-label">High Risk Areas</div>
              </div>
              <div className="map-stat-card" style={{ '--stat-color': '#F59E0B' } as React.CSSProperties}>
                <div className="stat-number">{riskStats.medium}</div>
                <div className="stat-label">Medium Risk Areas</div>
              </div>
              <div className="map-stat-card" style={{ '--stat-color': '#22C55E' } as React.CSSProperties}>
                <div className="stat-number">{riskStats.low}</div>
                <div className="stat-label">Low Risk Areas</div>
              </div>
              <div className="map-stat-card" style={{ '--stat-color': currentIncident?.color || '#3B82F6' } as React.CSSProperties}>
                <div className="stat-number">{riskStats.total}</div>
                <div className="stat-label">Total Barangays</div>
              </div>
            </div>

            {/* Incident Type Info Card */}
            <div className="card" style={{ marginTop: 16 }}>
              <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 24 }}>{currentIncident?.icon}</span>
                <div>
                  <h3 style={{ margin: 0 }}>{currentIncident?.label} Risk Assessment — Balayan, Batangas</h3>
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>{currentIncident?.description}</p>
                </div>
              </div>
              <div className="card-body">
                <p style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--text-secondary)' }}>
                  This map displays the risk assessment for <strong style={{ color: currentIncident?.color }}>{currentIncident?.label}</strong> incidents
                  across all 48 barangays of Balayan, Batangas. Click on any marker to view the detailed prescription
                  and recommended actions for that specific area. Risk levels are determined by geographic factors,
                  historical incident data, and proximity to hazard zones.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ============ FORECAST TAB (existing) ============ */}
        {tab === 'forecast' && (
          <div className="fade-in">
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              <div className="stat-card"><div className="stat-info"><h3>This Month Predicted</h3><div className="stat-value">21</div><div className="stat-change up">↑ Based on trend analysis</div></div><div className="stat-icon purple"><TrendingUp size={22} /></div></div>
              <div className="stat-card"><div className="stat-info"><h3>Peak Month (Predicted)</h3><div className="stat-value">Aug</div><div className="stat-change up">28 incidents forecasted</div></div><div className="stat-icon red"><TrendingUp size={22} /></div></div>
              <div className="stat-card"><div className="stat-info"><h3>YoY Growth</h3><div className="stat-value">+18%</div><div className="stat-change up">↑ Compared to 2025</div></div><div className="stat-icon blue"><TrendingUp size={22} /></div></div>
            </div>

            <div className="grid-2" style={{ marginTop: 20 }}>
              <div className="card">
                <div className="card-header"><h3>Incident Forecast</h3></div>
                <div className="card-body">
                  <div className="chart-container" style={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={forecastData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
                        <YAxis tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Legend />
                        <Area type="monotone" dataKey="total" stroke="#3B82F6" fill="rgba(59, 130, 246, 0.1)" strokeWidth={2} name="Total" connectNulls={false} />
                        <Line type="monotone" dataKey="predicted" stroke="#8B5CF6" strokeWidth={2} strokeDasharray="6 4" name="Predicted Forecast" dot={false} />
                        <Area type="monotone" dataKey="resolved" stroke="#22C55E" fill="rgba(34, 197, 94, 0.08)" strokeWidth={2} name="Resolved" connectNulls={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-header"><h3>Requests Over Time</h3></div>
                <div className="card-body">
                  <div className="chart-container" style={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={distributionData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
                        <YAxis tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Legend />
                        <Bar dataKey="total" fill="#1E3A5F" radius={[4, 4, 0, 0]} name="Total Requests" />
                        <Bar dataKey="completed" fill="#14B8A6" radius={[4, 4, 0, 0]} name="Completed" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>

            <div className="card" style={{ marginTop: 20 }}>
              <div className="card-header"><h3>Monthly Incident Forecast Details</h3></div>
              <div className="card-body">
                <div className="forecast-details-grid">
                  {monthlyDetails.map((m) => (
                    <div className="forecast-month-card" key={m.month}>
                      <div className="fm-header">
                        <span className="fm-month">{m.month}</span>
                        <span className={`fm-type ${m.typeClass}`}>{m.type}</span>
                      </div>
                      <p className="fm-desc">{m.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============ REPORTS TAB (existing) ============ */}
        {tab === 'reports' && (
          <div className="fade-in">
            <div className="filters-bar">
              <select className="filter-select"><option>All Types</option><option>Monthly</option><option>Quarterly</option><option>Annual</option><option>Custom</option></select>
              <div style={{ flex: 1 }} />
              <button className="btn btn-primary btn-sm"><FileText size={14} /> Generate New Report</button>
            </div>
            <div className="card">
              <table className="data-table">
                <thead><tr><th>Report ID</th><th>Title</th><th>Type</th><th>Generated</th><th>Action</th></tr></thead>
                <tbody>
                  {reportData.map((r) => (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 600 }}>{r.id}</td>
                      <td>{r.title}</td>
                      <td><span className="badge reviewing">{r.type}</span></td>
                      <td>{r.generated}</td>
                      <td><button className="btn btn-outline btn-sm"><Download size={14} /> Download</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
