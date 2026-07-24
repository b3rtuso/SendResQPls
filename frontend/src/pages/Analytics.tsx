import { useState, useEffect, useMemo } from 'react';
import Header from '../components/Header';
import {
  Line, LineChart, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  Cell,
} from 'recharts';
import {
  TrendingUp, FileText, Download, MapPin, BarChart3, Calendar, Loader2, CheckCircle2,
  Flame, Waves, Stethoscope, Activity, ShieldAlert, Info
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './analytics-map.css';
import {
  BALAYAN_CENTER, BALAYAN_BOUNDS, BARANGAYS,
  type Barangay,
} from '../data/balayan-data';
import {
  forecastData, distributionData, yearlySummary,
  incidentTrendsData, yearlyTotals,
  TYPE_COLORS,
} from '../data/mdrrmo-data';
import {
  downloadDailyReport, downloadWeeklyReport, downloadMonthlyReport,
} from '../utils/reportGenerator';
import { getIncidentsByRange } from '../api/client';
import type { Incident } from '../types';

// SVG Icon Incident Types
const INCIDENT_TYPES_SVG = [
  { id: 'fire',      label: 'Fire',       icon: Flame,       color: '#EF4444', desc: 'Structural and wildland fires across barangays' },
  { id: 'flood',     label: 'Flood',      icon: Waves,       color: '#3B82F6', desc: 'Monsoon flooding & riverbank spillover risk' },
  { id: 'medical',   label: 'Medical',    icon: Stethoscope, color: '#22C55E', desc: 'Medical emergencies & patient transport calls' },
  { id: 'trauma',    label: 'Trauma',     icon: Activity,    color: '#F59E0B', desc: 'Vehicular accidents & severe physical injuries' },
  { id: 'crime',     label: 'Crime',      icon: ShieldAlert, color: '#8B5CF6', desc: 'Security, disturbance & assault incidents' },
];

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const tooltipStyle = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-md)',
  fontSize: '13px',
};

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

function buildPopupContent(brgy: Barangay, incidentType: string): string {
  const risk = brgy.riskProfile[incidentType];
  if (!risk) return '';
  const incType = INCIDENT_TYPES_SVG.find(t => t.id === incidentType);
  const riskClass = risk.riskLevel.toLowerCase();

  return `
    <div class="map-popup">
      <div class="popup-header">
        <div class="popup-icon" style="background: ${incType?.color || '#3B82F6'}22; color: ${incType?.color || '#3B82F6'}; font-weight: bold;">
          🛡️
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

function getRiskExplanation(type: string, riskTier: 'ALL' | 'HIGH' | 'MEDIUM' | 'LOW') {
  const t = type.toLowerCase();
  const expMap: Record<string, Record<string, { title: string; explanation: string; factors: string[] }>> = {
    fire: {
      ALL: {
        title: 'Fire Incident Vulnerability & Risk Profile in Balayan',
        explanation: 'Fire risk across Balayan is heavily driven by urban structural density in Poblacion, commercial electrical loads, and narrow inner residential streets.',
        factors: ['Commercial structural density in Poblacion', 'Dry season vegetation burn-off risk', 'Narrow barangay streets limiting fire truck turnaround']
      },
      HIGH: {
        title: 'Why High Risk Areas: Commercial & Dense Housing Hubs',
        explanation: 'Barangays tagged HIGH RISK for Fire (such as Poblacion 1-12 & Caloocan) feature high commercial building concentration, older wiring infrastructure, and narrow residential alleys that impede rapid fire engine access.',
        factors: ['Dense wooden & concrete commercial structures', 'High electrical power load demand', 'Narrow interior alleys restricting fire hose deployment']
      },
      MEDIUM: {
        title: 'Why Medium Risk Areas: Mixed Residential-Agricultural Zones',
        explanation: 'Barangays tagged MEDIUM RISK feature moderate structural spacing and main road access, but carry seasonal dry-vegetation fire risks.',
        factors: ['Moderate structural spacing', 'Accessible secondary roadways', 'Dry season agricultural burning']
      },
      LOW: {
        title: 'Why Low Risk Areas: Open Rural & Coastal Zones',
        explanation: 'Barangays tagged LOW RISK consist of sparse agricultural acreage, wide structural separation, and low electrical power loads.',
        factors: ['Sparse population density', 'Wide structural separation', 'Immediate natural coastal water access']
      }
    },
    flood: {
      ALL: {
        title: 'Flood Vulnerability & Hydrological Risk in Balayan',
        explanation: 'Balayan sits along Balayan Bay with major river channels like Palico River. Flood hazards stem from tidal surges and severe monsoon river spillover.',
        factors: ['Coastal proximity to Balayan Bay', 'Palico river spillover in low-lying barangays', 'Monsoon drainage overflow']
      },
      HIGH: {
        title: 'Why High Risk Areas: Low-Lying Coastal & Riverbank Basins',
        explanation: 'Barangays tagged HIGH RISK for Flood (such as Sambat & Carenahan) sit at low sea-level elevation directly adjacent to river outlets and Balayan Bay, experiencing immediate surge inundation.',
        factors: ['Low elevation near river mouths', 'Storm surge & high tide vulnerability', 'Slow natural rainwater discharge']
      },
      MEDIUM: {
        title: 'Why Medium Risk Areas: Interior Lowland Plains',
        explanation: 'Barangays tagged MEDIUM RISK experience temporary localized flash flooding during heavy downpours due to culvert capacity limits.',
        factors: ['Flat terrain causing temporary pooling', 'Drainage culvert capacity limits during typhoons']
      },
      LOW: {
        title: 'Why Low Risk Areas: Elevated Inland Barangays',
        explanation: 'Barangays tagged LOW RISK sit at higher natural inland elevations ensuring rapid natural water runoff towards river channels.',
        factors: ['Elevated natural topography', 'Effective natural slope runoff']
      }
    },
    trauma: {
      ALL: {
        title: 'Trauma & Road Collision Risk Profile in Balayan',
        explanation: 'Trauma emergencies are predominantly driven by motorcycle and vehicular collisions along high-speed highway corridors in Balayan.',
        factors: ['Heavy motorcycle commuter volume', 'High-speed intersections at Sambat & Lanatan', 'Heavy cargo truck traffic']
      },
      HIGH: {
        title: 'Why High Risk Areas: Highway Junctions & Critical Intersections',
        explanation: 'Barangays tagged HIGH RISK for Trauma (such as Sambat & Lanatan) encompass major provincial highway junctions with the highest recorded motorcycle crashes and multi-vehicle collisions.',
        factors: ['Intersecting high-speed national highway corridors', 'Night motorcycle traffic with low visibility', 'High historical collision frequency']
      },
      MEDIUM: {
        title: 'Why Medium Risk Areas: Secondary Arterial Roads',
        explanation: 'Barangays tagged MEDIUM RISK connect residential sectors to main highways with moderate vehicle speeds and occasional motorcycle slips.',
        factors: ['Moderate traffic speeds', 'Connecting barangay arterial roads']
      },
      LOW: {
        title: 'Why Low Risk Areas: Quiet Residential Interior Streets',
        explanation: 'Barangays tagged LOW RISK feature low speed limits and minimal vehicular flow.',
        factors: ['Quiet residential streets', 'Minimal vehicular traffic']
      }
    },
    medical: {
      ALL: {
        title: 'Medical Emergency Response Profile',
        explanation: 'Medical calls account for over 45% of MDRRMO dispatches in Balayan, driven by senior citizen population density and distance from primary hospitals.',
        factors: ['High senior population density', 'Distance to Balayan Medicare & hospitals', 'Prevalence of acute cardiac & respiratory calls']
      },
      HIGH: {
        title: 'Why High Risk Areas: High Call Volume & Senior Demographics',
        explanation: 'Barangays tagged HIGH RISK for Medical Emergencies log the highest call frequency for stroke, cardiac events, severe hypertension, and acute respiratory distress.',
        factors: ['High elderly demographic concentration', 'Elevated history of acute medical dispatches', 'Frequent medical conduction requests']
      },
      MEDIUM: {
        title: 'Why Medium Risk Areas: Moderate Emergency Demand',
        explanation: 'Barangays tagged MEDIUM RISK maintain steady call rates for seasonal illnesses and scheduled transport assistance.',
        factors: ['Moderate emergency call frequency', 'Proximity to local barangay health stations']
      },
      LOW: {
        title: 'Why Low Risk Areas: Low Emergency Call History',
        explanation: 'Barangays tagged LOW RISK have lower population density and quick access to municipal health centers.',
        factors: ['Lower population density', 'Direct access to main health facilities']
      }
    },
    crime: {
      ALL: {
        title: 'Public Safety & Security Assessment',
        explanation: 'Security incidents center on commercial districts, transport terminals, and late-night venue areas.',
        factors: ['High foot traffic around public markets', 'Night establishment concentration', 'PNP & Tanod patrol sectors']
      },
      HIGH: {
        title: 'Why High Risk Areas: Commercial & Transport Hubs',
        explanation: 'Barangays tagged HIGH RISK for Security encompass commercial strips and bus/jeepney terminals with higher night-time foot traffic and disturbance reports.',
        factors: ['High night-time commercial activity', 'Transport terminal crowds', 'Frequent order management calls']
      },
      MEDIUM: {
        title: 'Why Medium Risk Areas: Suburban Corridors',
        explanation: 'Barangays tagged MEDIUM RISK experience occasional minor disputes managed by barangay tanod patrols.',
        factors: ['Moderate residential density', 'Active barangay tanod patrols']
      },
      LOW: {
        title: 'Why Low Risk Areas: Peaceful Rural Neighborhoods',
        explanation: 'Barangays tagged LOW RISK maintain near-zero security incident reports.',
        factors: ['Quiet rural environment', 'Strong neighborhood watch']
      }
    }
  };

  const defaultExp = {
    title: `${type.toUpperCase()} Risk Profile — Balayan, Batangas`,
    explanation: `Detailed risk assessment for ${type} incidents across all 48 barangays of Balayan.`,
    factors: ['Geographic hazard indicators', 'Historical emergency logs', 'Emergency service response times']
  };

  return (expMap[t] && expMap[t][riskTier]) || defaultExp;
}

export default function Analytics() {
  const [tab, setTab] = useState<'map' | 'forecast' | 'reports'>('map');
  const [selectedType, setSelectedType] = useState('fire');
  const [trendYear, setTrendYear] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<'ALL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');

  type RangeKey = 'daily' | 'weekly' | 'monthly';
  const [downloading, setDownloading] = useState<RangeKey | null>(null);
  const [downloadDone, setDownloadDone] = useState<RangeKey | null>(null);

  function getLocalIsoDate(d = new Date()): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  const todayIso = getLocalIsoDate(new Date());
  const [selectedDay, setSelectedDay]   = useState(todayIso);
  const [selectedWeek, setSelectedWeek] = useState(todayIso);
  const [selectedMonth, setSelectedMonth] = useState(todayIso.slice(0, 7));

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

  const currentIncident = INCIDENT_TYPES_SVG.find(t => t.id === selectedType);
  const IconComp = currentIncident?.icon || Flame;

  const riskExplanation = useMemo(() => {
    return getRiskExplanation(selectedType, riskFilter);
  }, [selectedType, riskFilter]);

  const handleDownload = async (key: RangeKey) => {
    setDownloading(key);
    try {
      let fromStr = selectedDay, toStr = selectedDay;
      if (key === 'weekly') {
        const wd = new Date(selectedWeek + 'T00:00:00');
        const day = wd.getDay();
        const mon = new Date(wd); mon.setDate(wd.getDate() - (day === 0 ? 6 : day - 1));
        const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
        fromStr = getLocalIsoDate(mon);
        toStr   = getLocalIsoDate(sun);
      } else if (key === 'monthly') {
        const [y, m] = selectedMonth.split('-').map(Number);
        fromStr = getLocalIsoDate(new Date(y, m - 1, 1));
        toStr   = getLocalIsoDate(new Date(y, m, 0));
      }

      const res = await getIncidentsByRange(fromStr, toStr);
      const incs: Incident[] = res.data || [];

      if (key === 'daily')   await downloadDailyReport(incs, selectedDay);
      if (key === 'weekly')  await downloadWeeklyReport(incs, selectedWeek);
      if (key === 'monthly') await downloadMonthlyReport(incs, selectedMonth);
      setDownloadDone(key);
      setTimeout(() => setDownloadDone(null), 3000);
    } catch (err) {
      console.error('Error downloading report:', err);
    } finally {
      setDownloading(null);
    }
  };

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
              <div className="map-filter-bar">
                <span className="filter-label">Filter by</span>
                {INCIDENT_TYPES_SVG.map(t => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.id}
                      className={`incident-pill ${selectedType === t.id ? 'active' : ''}`}
                      style={{ '--pill-color': t.color } as React.CSSProperties}
                      onClick={() => { setSelectedType(t.id); setRiskFilter('ALL'); }}
                    >
                      <Icon size={14} style={{ marginRight: 4 }} />
                      {t.label}
                    </button>
                  );
                })}
              </div>

              <MapContainer
                center={[BALAYAN_CENTER.lat, BALAYAN_CENTER.lng]}
                zoom={13}
                className="analytics-map-container"
                scrollWheelZoom={true}
                zoomControl={true}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  maxZoom={19}
                />
                <MapBoundsController />

                {BARANGAYS.map(brgy => {
                  const risk = brgy.riskProfile[selectedType];
                  if (!risk) return null;
                  if (riskFilter !== 'ALL' && risk.riskLevel !== riskFilter) return null;
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

            {/* Clickable Map Risk Stats Bar */}
            <div className="map-stats-bar" style={{ marginTop: 16 }}>
              <div
                className="map-stat-card"
                onClick={() => setRiskFilter(prev => prev === 'HIGH' ? 'ALL' : 'HIGH')}
                style={{
                  '--stat-color': '#EF4444',
                  cursor: 'pointer',
                  border: riskFilter === 'HIGH' ? '2.5px solid #EF4444' : '1px solid var(--border)',
                  boxShadow: riskFilter === 'HIGH' ? '0 0 12px rgba(239, 68, 68, 0.3)' : 'none',
                  transition: 'all 0.2s ease',
                } as React.CSSProperties}
              >
                <div className="stat-number">{riskStats.high}</div>
                <div className="stat-label">High Risk Areas {riskFilter === 'HIGH' && '✓'}</div>
              </div>

              <div
                className="map-stat-card"
                onClick={() => setRiskFilter(prev => prev === 'MEDIUM' ? 'ALL' : 'MEDIUM')}
                style={{
                  '--stat-color': '#F59E0B',
                  cursor: 'pointer',
                  border: riskFilter === 'MEDIUM' ? '2.5px solid #F59E0B' : '1px solid var(--border)',
                  boxShadow: riskFilter === 'MEDIUM' ? '0 0 12px rgba(245, 158, 11, 0.3)' : 'none',
                  transition: 'all 0.2s ease',
                } as React.CSSProperties}
              >
                <div className="stat-number">{riskStats.medium}</div>
                <div className="stat-label">Medium Risk Areas {riskFilter === 'MEDIUM' && '✓'}</div>
              </div>

              <div
                className="map-stat-card"
                onClick={() => setRiskFilter(prev => prev === 'LOW' ? 'ALL' : 'LOW')}
                style={{
                  '--stat-color': '#22C55E',
                  cursor: 'pointer',
                  border: riskFilter === 'LOW' ? '2.5px solid #22C55E' : '1px solid var(--border)',
                  boxShadow: riskFilter === 'LOW' ? '0 0 12px rgba(34, 197, 94, 0.3)' : 'none',
                  transition: 'all 0.2s ease',
                } as React.CSSProperties}
              >
                <div className="stat-number">{riskStats.low}</div>
                <div className="stat-label">Low Risk Areas {riskFilter === 'LOW' && '✓'}</div>
              </div>

              <div
                className="map-stat-card"
                onClick={() => setRiskFilter('ALL')}
                style={{
                  '--stat-color': currentIncident?.color || '#3B82F6',
                  cursor: 'pointer',
                  border: riskFilter === 'ALL' ? `2.5px solid ${currentIncident?.color || '#3B82F6'}` : '1px solid var(--border)',
                  boxShadow: riskFilter === 'ALL' ? `0 0 12px ${currentIncident?.color || '#3B82F6'}33` : 'none',
                  transition: 'all 0.2s ease',
                } as React.CSSProperties}
              >
                <div className="stat-number">{riskStats.total}</div>
                <div className="stat-label">Total Barangays {riskFilter === 'ALL' && '(All Shown)'}</div>
              </div>
            </div>

            {/* Dynamic & Meaningful Incident Type & Risk Tier Info Card */}
            <div className="card" style={{ marginTop: 16 }}>
              <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: `${currentIncident?.color}18`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: currentIncident?.color,
                }}>
                  <IconComp size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{riskExplanation.title}</h3>
                  <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>
                    Showing {riskFilter === 'ALL' ? 'all risk levels' : `${riskFilter} RISK barangays`} for {currentIncident?.label} incidents in Balayan, Batangas
                  </p>
                </div>
              </div>
              <div className="card-body">
                <p style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--text-secondary)', marginBottom: 14 }}>
                  {riskExplanation.explanation}
                </p>
                <div style={{ background: 'var(--bg-card-hover)', borderRadius: 10, padding: '12px 16px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Info size={14} color="#3B82F6" /> Primary Contributing Factors:
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 20, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    {riskExplanation.factors.map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============ FORECAST TAB ============ */}
        {tab === 'forecast' && (
          <div className="fade-in">
            {/* Stat Cards */}
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
              <div className="stat-card"><div className="stat-info"><h3>YTD Total (2026)</h3><div className="stat-value">{yearlySummary.totalCurrentYear}</div><div className="stat-change up">Jan – May actual data</div></div><div className="stat-icon blue"><BarChart3 size={22} /></div></div>
              <div className="stat-card"><div className="stat-info"><h3>Peak Month</h3><div className="stat-value">{yearlySummary.peakMonth}</div><div className="stat-change up">{yearlySummary.peakMonthCount} incidents recorded</div></div><div className="stat-icon red"><TrendingUp size={22} /></div></div>
              <div className="stat-card"><div className="stat-info"><h3>Full Year Projected</h3><div className="stat-value">{yearlySummary.predictedTotal}</div><div className="stat-change down">↓ {Math.abs(yearlySummary.yoyGrowth)}% vs 2024</div></div><div className="stat-icon purple"><TrendingUp size={22} /></div></div>
              <div className="stat-card"><div className="stat-info"><h3>Total Records</h3><div className="stat-value">1,260</div><div className="stat-change up">2023–2026 data</div></div><div className="stat-icon green"><Calendar size={22} /></div></div>
            </div>

            {/* Forecast + Requests Over Time */}
            <div className="grid-2" style={{ marginTop: 20 }}>
              <div className="card">
                <div className="card-header"><h3>2026 Incident Forecast</h3></div>
                <div className="card-body">
                  <div className="chart-container" style={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={forecastData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
                        <YAxis tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Legend />
                        <Area type="monotone" dataKey="total" stroke="#3B82F6" fill="rgba(59, 130, 246, 0.1)" strokeWidth={2} name="Actual Total" connectNulls={false} />
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

            {/* Year-Over-Year Trends + Coupled Yearly Incident Totals by Category */}
            <div className="grid-2" style={{ marginTop: 20 }}>
              <div className="card">
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3>Year-Over-Year Incident Trends</h3>
                  <select className="filter-select" value={trendYear} onChange={e => setTrendYear(e.target.value)} style={{ minWidth: 130 }}>
                    <option value="all">All Years (2023–2026)</option>
                    <option value="2023">2023</option>
                    <option value="2024">2024</option>
                    <option value="2025">2025</option>
                    <option value="2026">2026</option>
                  </select>
                </div>
                <div className="card-body">
                  <div className="chart-container" style={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={incidentTrendsData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
                        <YAxis tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Legend />
                        {(() => {
                          const YEAR_COLORS: Record<string, string> = {
                            '2023': '#94A3B8',
                            '2024': '#3B82F6',
                            '2025': '#F59E0B',
                            '2026': '#22C55E',
                          };
                          const yearKeys = Object.keys(incidentTrendsData[0] || {}).filter(k => k.startsWith('y'));
                          const yearsWithData = yearKeys
                            .filter(k => incidentTrendsData.some(row => (row as any)[k] != null))
                            .map(k => k.replace('y', ''))
                            .sort();
                          return yearsWithData
                            .filter(yr => trendYear === 'all' || trendYear === yr)
                            .map(yr => {
                              const isSelected = trendYear === yr;
                              const isLatest   = yr === yearsWithData[yearsWithData.length - 1];
                              const color      = YEAR_COLORS[yr] ?? '#94A3B8';
                              return (
                                <Line
                                  key={yr}
                                  type="monotone"
                                  dataKey={`y${yr}`}
                                  stroke={color}
                                  strokeWidth={isSelected ? 3 : isLatest ? 2.5 : 2}
                                  name={yr}
                                  dot={isSelected ? { r: 4 } : isLatest ? { r: 4, strokeWidth: 2 } : trendYear === 'all' ? false : { r: 3 }}
                                  strokeDasharray={trendYear === 'all' && !isLatest ? '4 4' : undefined}
                                  connectNulls={false}
                                />
                              );
                            });
                        })()}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Coupled Yearly Incident Totals by Category (Bar Chart) */}
              <div className="card">
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3>Yearly Incident Totals by Category</h3>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', background: 'var(--bg-card-hover)', padding: '4px 10px', borderRadius: 6 }}>
                    {trendYear === 'all' ? 'All Years (2023–2026)' : `Year ${trendYear}`}
                  </span>
                </div>
                <div className="card-body">
                  {(() => {
                    const row = trendYear === 'all'
                      ? { Medical: 569, Trauma: 608, Accident: 44, Fire: 2, Crime: 10, Other: 27 }
                      : yearlyTotals.find(y => String(y.year) === trendYear) ?? { Medical: 0, Trauma: 0, Accident: 0, Fire: 0, Crime: 0, Other: 0 };
                    
                    const yearlyCategoryData = [
                      { category: 'Medical',  count: row.Medical  || 0, fill: TYPE_COLORS.Medical  },
                      { category: 'Trauma',   count: row.Trauma   || 0, fill: TYPE_COLORS.Trauma   },
                      { category: 'Accident', count: row.Accident || 0, fill: TYPE_COLORS.Accident },
                      { category: 'Fire',     count: row.Fire     || 0, fill: TYPE_COLORS.Fire     },
                      { category: 'Crime',    count: row.Crime    || 0, fill: TYPE_COLORS.Crime    },
                    ].filter(d => d.count > 0);

                    const totalCount = yearlyCategoryData.reduce((acc, c) => acc + c.count, 0);

                    return (
                      <>
                        <div className="chart-container" style={{ height: 260 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={yearlyCategoryData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                              <XAxis dataKey="category" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
                              <YAxis tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
                              <Tooltip contentStyle={tooltipStyle} />
                              <Bar dataKey="count" name="Incidents" radius={[6, 6, 0, 0]}>
                                {yearlyCategoryData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                        <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                          <span>Total Incidents ({trendYear === 'all' ? 'All Years' : trendYear}):</span>
                          <span style={{ fontSize: 15, color: '#2563EB' }}>{totalCount.toLocaleString()} Incidents</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============ REPORTS TAB ============ */}
        {tab === 'reports' && (
          <div className="fade-in">
            {/* Direct Official MDRRMO Report Download Cards */}
            <div className="grid-3" style={{ marginBottom: 24 }}>
              {/* DAILY REPORT CARD */}
              <div className="card" style={{ borderTop: '4px solid #2563EB' }}>
                <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <FileText size={20} color="#2563EB" />
                  <div>
                    <h3 style={{ margin: 0, fontSize: 15 }}>Daily Incident Report</h3>
                    <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)' }}>MDRRMO Official Document</p>
                  </div>
                </div>
                <div className="card-body">
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
                    Generate the official MDRRMO Daily Report for all incidents logged on the selected date.
                  </p>

                  <div style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                      Select Date:
                    </label>
                    <input
                      type="date"
                      value={selectedDay}
                      onChange={e => setSelectedDay(e.target.value)}
                      style={{
                        padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)',
                        background: 'var(--bg-card-hover)', color: 'var(--text-primary)',
                        fontSize: 13, width: '100%', boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <button
                    className="btn btn-primary"
                    style={{ width: '100%', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 8 }}
                    onClick={() => handleDownload('daily')}
                    disabled={downloading === 'daily'}
                  >
                    {downloading === 'daily' ? (
                      <><Loader2 size={16} className="spin" /> Generating .docx...</>
                    ) : downloadDone === 'daily' ? (
                      <><CheckCircle2 size={16} /> Downloaded!</>
                    ) : (
                      <><Download size={16} /> Download Daily Report (.docx)</>
                    )}
                  </button>
                </div>
              </div>

              {/* WEEKLY REPORT CARD */}
              <div className="card" style={{ borderTop: '4px solid #F59E0B' }}>
                <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <FileText size={20} color="#F59E0B" />
                  <div>
                    <h3 style={{ margin: 0, fontSize: 15 }}>Weekly Incident Report</h3>
                    <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)' }}>MDRRMO Official Document</p>
                  </div>
                </div>
                <div className="card-body">
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
                    Generate the official MDRRMO Weekly Report with classified incident breakdown.
                  </p>

                  <div style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                      Select Week (Pick Any Day):
                    </label>
                    <input
                      type="date"
                      value={selectedWeek}
                      onChange={e => setSelectedWeek(e.target.value)}
                      style={{
                        padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)',
                        background: 'var(--bg-card-hover)', color: 'var(--text-primary)',
                        fontSize: 13, width: '100%', boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <button
                    className="btn btn-primary"
                    style={{ width: '100%', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 8, background: '#F59E0B', borderColor: '#D97706' }}
                    onClick={() => handleDownload('weekly')}
                    disabled={downloading === 'weekly'}
                  >
                    {downloading === 'weekly' ? (
                      <><Loader2 size={16} className="spin" /> Generating .docx...</>
                    ) : downloadDone === 'weekly' ? (
                      <><CheckCircle2 size={16} /> Downloaded!</>
                    ) : (
                      <><Download size={16} /> Download Weekly Report (.docx)</>
                    )}
                  </button>
                </div>
              </div>

              {/* MONTHLY REPORT CARD */}
              <div className="card" style={{ borderTop: '4px solid #22C55E' }}>
                <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <FileText size={20} color="#22C55E" />
                  <div>
                    <h3 style={{ margin: 0, fontSize: 15 }}>Monthly Incident Report</h3>
                    <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)' }}>MDRRMO Official Document</p>
                  </div>
                </div>
                <div className="card-body">
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
                    Generate the official MDRRMO Monthly Report in complete narrative sentence format.
                  </p>

                  <div style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                      Select Month:
                    </label>
                    <input
                      type="month"
                      value={selectedMonth}
                      onChange={e => setSelectedMonth(e.target.value)}
                      style={{
                        padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)',
                        background: 'var(--bg-card-hover)', color: 'var(--text-primary)',
                        fontSize: 13, width: '100%', boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <button
                    className="btn btn-primary"
                    style={{ width: '100%', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 8, background: '#22C55E', borderColor: '#16A34A' }}
                    onClick={() => handleDownload('monthly')}
                    disabled={downloading === 'monthly'}
                  >
                    {downloading === 'monthly' ? (
                      <><Loader2 size={16} className="spin" /> Generating .docx...</>
                    ) : downloadDone === 'monthly' ? (
                      <><CheckCircle2 size={16} /> Downloaded!</>
                    ) : (
                      <><Download size={16} /> Download Monthly Report (.docx)</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
