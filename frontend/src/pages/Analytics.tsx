import { useState, useEffect, useMemo } from 'react';
import Header from '../components/Header';
import {
  Line, LineChart, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  Cell,
} from 'recharts';
import {
  TrendingUp, FileText, Download, MapPin, BarChart3, Calendar, Loader2, CheckCircle2,
  Flame, Waves, Stethoscope, Activity, ShieldAlert, Info, Car, Wind, Mountain, AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './analytics-map.css';
import {
  BALAYAN_CENTER, BALAYAN_BOUNDS, BARANGAYS,
  type Barangay,
} from '../data/balayan-data';
import {
  forecastData, distributionData, reportData, yearlySummary,
  incidentTrendsData, yearlyTotals, topLocations,
  TYPE_COLORS, downloadReport, generateFullReport,
} from '../data/mdrrmo-data';
import {
  downloadDailyReport, downloadWeeklyReport, downloadMonthlyReport,
} from '../utils/reportGenerator';
import { getIncidentsByRange } from '../api/client';
import type { Incident } from '../types';

// SVG Icon Incident Types (8 Official Types)
const INCIDENT_TYPES_SVG = [
  { id: 'fire',      label: 'Fire',       icon: Flame,       color: '#EF4444', desc: 'Structural and wildland fires across barangays' },
  { id: 'flood',     label: 'Flood',      icon: Waves,       color: '#3B82F6', desc: 'Monsoon flooding & riverbank spillover risk' },
  { id: 'medical',   label: 'Medical',    icon: Stethoscope, color: '#22C55E', desc: 'Medical emergencies & patient transport calls' },
  { id: 'trauma',    label: 'Trauma',     icon: Activity,    color: '#F59E0B', desc: 'Physical injuries & severe trauma dispatches' },
  { id: 'accident',  label: 'Accident',   icon: Car,         color: '#3B82F6', desc: 'Vehicular collisions & road traffic accidents' },
  { id: 'crime',     label: 'Crime',      icon: ShieldAlert, color: '#8B5CF6', desc: 'Security, disturbance & assault incidents' },
  { id: 'typhoon',   label: 'Typhoon',    icon: Wind,        color: '#8B5CF6', desc: 'Tropical storms & typhoon wind/rain damage' },
  { id: 'landslide', label: 'Landslide',  icon: Mountain,    color: '#78716C', desc: 'Ground movement, mudslides & slope erosion' },
];

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const CustomAnalyticsTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: 'rgba(15, 23, 42, 0.94)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: 12,
        padding: '10px 14px',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.35)',
        color: 'white',
        fontFamily: 'var(--font)',
        minWidth: 140,
      }}>
        {label && <p style={{ margin: '0 0 6px', fontWeight: 800, fontSize: 13, color: '#F1F5F9' }}>{label}</p>}
        {payload.map((p: any) => (
          <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'rgba(255,255,255,0.85)', padding: '2px 0' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.fill || p.color || '#2563EB', flexShrink: 0 }} />
            <span style={{ textTransform: 'capitalize' }}>{p.name}:</span>
            <strong style={{ marginLeft: 'auto', color: 'white', fontWeight: 800 }}>{p.value}</strong>
          </div>
        ))}
      </div>
    );
  }
  return null;
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
    },
    accident: {
      ALL: {
        title: 'Vehicular Accident Risk Profile in Balayan',
        explanation: 'Road traffic collisions primarily occur along major thoroughfares, steep curves, and busy intersections connecting Balayan to neighboring municipalities.',
        factors: ['Palico-Balayan Highway traffic density', 'Blind curves & unlit rural roads at night', 'High motorcycle and tricycle commuter volume']
      },
      HIGH: {
        title: 'Why High Risk Areas: High-Density Traffic Highways',
        explanation: 'Barangays tagged HIGH RISK for Accidents encompass major highway routes with heavy vehicular volume, high transit speeds, and frequent multi-vehicle crashes.',
        factors: ['High-speed national highway corridors', 'Frequent heavy truck transit', 'High collision history']
      },
      MEDIUM: {
        title: 'Why Medium Risk Areas: Secondary Connecting Roads',
        explanation: 'Barangays tagged MEDIUM RISK connect residential sectors with moderate vehicle speeds and occasional motorcycle slips.',
        factors: ['Moderate traffic speeds', 'Secondary feeder roads']
      },
      LOW: {
        title: 'Why Low Risk Areas: Quiet Residential Interior Streets',
        explanation: 'Barangays tagged LOW RISK feature minimal vehicle flow and strict local speed limits.',
        factors: ['Low speed residential streets', 'Minimal vehicular traffic']
      }
    },
    typhoon: {
      ALL: {
        title: 'Typhoon & Wind Damage Vulnerability Profile',
        explanation: 'Balayan lies in the path of seasonal typhoons from the Pacific. Coastal and open agricultural barangays face high wind damage and roof loss.',
        factors: ['Exposure to coastal storm winds along Balayan Bay', 'Light material housing vulnerability', 'Fallen tree & powerline hazards']
      },
      HIGH: {
        title: 'Why High Risk Areas: Exposed Coastal & Open Terrain',
        explanation: 'Barangays tagged HIGH RISK for Typhoon sit directly on the Balayan coastline or open agricultural fields without natural windbreaks.',
        factors: ['Unobstructed ocean storm winds', 'High concentration of light material structures', 'High storm surge exposure']
      },
      MEDIUM: {
        title: 'Why Medium Risk Areas: Inland Semi-Urban Barangays',
        explanation: 'Barangays tagged MEDIUM RISK have partial wind protection from urban buildings but face tree branch and powerline hazards.',
        factors: ['Partial building windbreaks', 'Fallen tree and powerline risks']
      },
      LOW: {
        title: 'Why Low Risk Areas: Sheltered Lowland Interiors',
        explanation: 'Barangays tagged LOW RISK are sheltered by inland terrain and possess robust concrete building construction.',
        factors: ['Reinforced concrete structures', 'Protected inland topography']
      }
    },
    landslide: {
      ALL: {
        title: 'Landslide & Soil Slope Erosion Profile',
        explanation: 'Landslide hazards in Balayan are concentrated in hilly northern barangays with steep slopes vulnerable to soil saturation during prolonged typhoons.',
        factors: ['Steep slope inclination in northern barangays', 'Soil saturation from monsoon rainfall', 'Unstable road cuts along mountain passes']
      },
      HIGH: {
        title: 'Why High Risk Areas: Steep Mountain Slopes & Loose Soil',
        explanation: 'Barangays tagged HIGH RISK for Landslide feature steep slope angles, loose topsoil, and proximity to active slope movement zones.',
        factors: ['Steep terrain elevation and loose topsoil', 'High rainfall saturation risk', 'History of slope movement']
      },
      MEDIUM: {
        title: 'Why Medium Risk Areas: Moderate Slopes & Rolling Hills',
        explanation: 'Barangays tagged MEDIUM RISK contain rolling hills with moderate vegetation cover.',
        factors: ['Moderate slope angles', 'Partial vegetation root anchorage']
      },
      LOW: {
        title: 'Why Low Risk Areas: Flat Lowland Terrain',
        explanation: 'Barangays tagged LOW RISK are situated on flat lowland plains with zero slope slope hazard.',
        factors: ['Flat ground topography', 'Zero slope collapse hazard']
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
  const [reportFilter, setReportFilter] = useState('All Types');
  const [trendYear, setTrendYear] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<'ALL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');

  type RangeKey = 'daily' | 'weekly' | 'monthly';
  const [downloading, setDownloading] = useState<RangeKey | null>(null);
  const [downloadDone, setDownloadDone] = useState<RangeKey | null>(null);
  const [emptyModal, setEmptyModal] = useState<{ open: boolean; periodName: string } | null>(null);

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

      if (incs.length === 0) {
        const periodName = key === 'daily'
          ? `date (${selectedDay})`
          : key === 'weekly'
          ? `week period (${fromStr} to ${toStr})`
          : `month (${selectedMonth})`;
        setEmptyModal({ open: true, periodName });
        return;
      }

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

  const filteredReports = reportFilter === 'All Types'
    ? reportData
    : reportData.filter(r => r.type === reportFilter);

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

            {/* Clickable Map Risk Stats Bar (Samsung One UI Squircle Icon Tiles) */}
            <div className="map-stats-bar" style={{ marginTop: 16 }}>
              <div
                className="map-stat-card"
                onClick={() => setRiskFilter(prev => prev === 'HIGH' ? 'ALL' : 'HIGH')}
                style={{
                  '--stat-color': '#EF4444',
                  cursor: 'pointer',
                  border: riskFilter === 'HIGH' ? '2px solid #EF4444' : '1px solid var(--border)',
                  boxShadow: riskFilter === 'HIGH' ? '0 0 16px rgba(239, 68, 68, 0.3)' : 'none',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '14px 16px',
                  textAlign: 'left',
                } as React.CSSProperties}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: '22%',
                  background: 'rgba(239, 68, 68, 0.16)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#EF5350', flexShrink: 0,
                }}>
                  <AlertTriangle size={22} />
                </div>
                <div>
                  <div className="stat-number" style={{ fontSize: 24, fontWeight: 800, color: '#EF4444', lineHeight: 1, marginBottom: 4 }}>
                    {riskStats.high}
                  </div>
                  <div className="stat-label" style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                    High Risk Areas
                  </div>
                </div>
              </div>

              <div
                className="map-stat-card"
                onClick={() => setRiskFilter(prev => prev === 'MEDIUM' ? 'ALL' : 'MEDIUM')}
                style={{
                  '--stat-color': '#F59E0B',
                  cursor: 'pointer',
                  border: riskFilter === 'MEDIUM' ? '2px solid #F59E0B' : '1px solid var(--border)',
                  boxShadow: riskFilter === 'MEDIUM' ? '0 0 16px rgba(245, 158, 11, 0.3)' : 'none',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '14px 16px',
                  textAlign: 'left',
                } as React.CSSProperties}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: '22%',
                  background: 'rgba(245, 124, 0, 0.16)',
                  border: '1px solid rgba(255, 167, 38, 0.3)',
                  boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#FFA726', flexShrink: 0,
                }}>
                  <Info size={22} />
                </div>
                <div>
                  <div className="stat-number" style={{ fontSize: 24, fontWeight: 800, color: '#F59E0B', lineHeight: 1, marginBottom: 4 }}>
                    {riskStats.medium}
                  </div>
                  <div className="stat-label" style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Medium Risk Areas
                  </div>
                </div>
              </div>

              <div
                className="map-stat-card"
                onClick={() => setRiskFilter(prev => prev === 'LOW' ? 'ALL' : 'LOW')}
                style={{
                  '--stat-color': '#22C55E',
                  cursor: 'pointer',
                  border: riskFilter === 'LOW' ? '2px solid #22C55E' : '1px solid var(--border)',
                  boxShadow: riskFilter === 'LOW' ? '0 0 16px rgba(34, 197, 94, 0.3)' : 'none',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '14px 16px',
                  textAlign: 'left',
                } as React.CSSProperties}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: '22%',
                  background: 'rgba(46, 125, 50, 0.16)',
                  border: '1px solid rgba(102, 187, 106, 0.3)',
                  boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#66BB6A', flexShrink: 0,
                }}>
                  <CheckCircle2 size={22} />
                </div>
                <div>
                  <div className="stat-number" style={{ fontSize: 24, fontWeight: 800, color: '#22C55E', lineHeight: 1, marginBottom: 4 }}>
                    {riskStats.low}
                  </div>
                  <div className="stat-label" style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Low Risk Areas
                  </div>
                </div>
              </div>

              <div
                className="map-stat-card"
                onClick={() => setRiskFilter('ALL')}
                style={{
                  '--stat-color': currentIncident?.color || '#3B82F6',
                  cursor: 'pointer',
                  border: riskFilter === 'ALL' ? `2px solid ${currentIncident?.color || '#3B82F6'}` : '1px solid var(--border)',
                  boxShadow: riskFilter === 'ALL' ? `0 0 16px ${currentIncident?.color || '#3B82F6'}33` : 'none',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '14px 16px',
                  textAlign: 'left',
                } as React.CSSProperties}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: '22%',
                  background: 'rgba(11, 101, 198, 0.16)',
                  border: '1px solid rgba(33, 150, 243, 0.3)',
                  boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#2196F3', flexShrink: 0,
                }}>
                  <MapPin size={22} />
                </div>
                <div>
                  <div className="stat-number" style={{ fontSize: 24, fontWeight: 800, color: currentIncident?.color || '#3B82F6', lineHeight: 1, marginBottom: 4 }}>
                    {riskStats.total}
                  </div>
                  <div className="stat-label" style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Total Barangays
                  </div>
                </div>
              </div>
            </div>

            {/* Dynamic & Meaningful Incident Type & Risk Tier Info Card */}
            <div className="card" style={{ marginTop: 16 }}>
              <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left' }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '22%',
                  background: `${currentIncident?.color}18`,
                  border: `1px solid ${currentIncident?.color}35`,
                  boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: currentIncident?.color,
                  flexShrink: 0,
                }}>
                  <IconComp size={24} />
                </div>
                <div style={{ textAlign: 'left', flex: 1 }}>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', textAlign: 'left' }}>
                    {riskExplanation.title}
                  </h3>
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-secondary)', textAlign: 'left' }}>
                    Showing {riskFilter === 'ALL' ? 'all risk levels' : `${riskFilter} RISK barangays`} for {currentIncident?.label} incidents in Balayan, Batangas
                  </p>
                </div>
              </div>
              <div className="card-body" style={{ textAlign: 'left' }}>
                <p style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--text-secondary)', marginBottom: 14, textAlign: 'left' }}>
                  {riskExplanation.explanation}
                </p>
                <div style={{ background: 'var(--bg-card-hover)', borderRadius: 10, padding: '14px 18px', border: '1px solid var(--border)', textAlign: 'left' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6, textAlign: 'left' }}>
                    <Info size={15} color="#3B82F6" /> Primary Contributing Factors:
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 20, fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.7, textAlign: 'left' }}>
                    {riskExplanation.factors.map((f, i) => (
                      <li key={i} style={{ textAlign: 'left' }}>{f}</li>
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
                  <div className="chart-container" style={{ height: 300, minWidth: 0 }}>
                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                      <AreaChart data={forecastData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
                        <YAxis tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
                        <Tooltip content={<CustomAnalyticsTooltip />} />
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
                  <div className="chart-container" style={{ height: 300, minWidth: 0 }}>
                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                      <BarChart data={distributionData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
                        <YAxis tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
                        <Tooltip content={<CustomAnalyticsTooltip />} />
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
                  <div className="chart-container" style={{ height: 300, minWidth: 0 }}>
                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                      <LineChart data={incidentTrendsData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
                        <YAxis tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
                        <Tooltip content={<CustomAnalyticsTooltip />} />
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
                        <div className="chart-container" style={{ height: 260, minWidth: 0 }}>
                          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                            <BarChart data={yearlyCategoryData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                              <XAxis dataKey="category" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
                              <YAxis tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
                              <Tooltip content={<CustomAnalyticsTooltip />} />
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
            {/* ── KPI Stat Cards — TOP ── */}
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 24 }}>
              <div className="stat-card">
                <div className="stat-info">
                  <h3>Total Reports</h3>
                  <div className="stat-value">{reportData.length}</div>
                  <div className="stat-change up">Available for download</div>
                </div>
                <div className="stat-icon blue"><FileText size={22} /></div>
              </div>
              <div className="stat-card">
                <div className="stat-info">
                  <h3>Data Coverage</h3>
                  <div className="stat-value">2023–2026</div>
                  <div className="stat-change up">4 years of data</div>
                </div>
                <div className="stat-icon purple"><Calendar size={22} /></div>
              </div>
              <div className="stat-card">
                <div className="stat-info">
                  <h3>Total Records</h3>
                  <div className="stat-value">1,260</div>
                  <div className="stat-change up">MDRRMO incident reports</div>
                </div>
                <div className="stat-icon green"><BarChart3 size={22} /></div>
              </div>
            </div>

            {/* ── Divider ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '0 0 24px' }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Generate Official Word Reports (.docx)
              </span>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            </div>

            {/* ── Live Downloadable Report Cards (July 19 Exact Design & Position) ── */}
            <div className="analytics-reports-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 28 }}>

              {/* ── DAILY REPORT CARD ── */}
              <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                <div className="card-header" style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--primary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Calendar size={18} color="var(--primary)" />
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font)', letterSpacing: '-0.2px' }}>Daily Report</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font)', marginTop: 1 }}>Single-day incident summary</div>
                    </div>
                  </div>
                </div>
                <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', fontFamily: 'var(--font)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Select Date</label>
                    <input
                      type="date"
                      className="filter-select"
                      style={{ width: '100%', boxSizing: 'border-box' }}
                      value={selectedDay}
                      onChange={e => setSelectedDay(e.target.value)}
                    />
                  </div>
                  <Button
                    className="btn btn-primary"
                    style={{ width: '100%', justifyContent: 'center', gap: 8, background: downloadDone === 'daily' ? 'var(--success)' : undefined, transition: 'background 0.3s' }}
                    onClick={() => handleDownload('daily')}
                    disabled={downloading === 'daily'}
                  >
                    {downloading === 'daily' ? <><Loader2 size={15} className="spin" /> Generating…</> : downloadDone === 'daily' ? <><CheckCircle2 size={15} /> Downloaded!</> : <><Download size={15} /> Download .docx</>}
                  </Button>
                  <div style={{ fontSize: 10.5, color: 'var(--text-muted)', fontFamily: 'var(--font)', textAlign: 'center' }}>Microsoft Word · MDRRMO soft copy format</div>
                </div>
              </div>

              {/* ── WEEKLY REPORT CARD ── */}
              <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                <div className="card-header" style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(245, 158, 11, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Calendar size={18} color="#F59E0B" />
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font)', letterSpacing: '-0.2px' }}>Weekly Report</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font)', marginTop: 1 }}>7-day operational breakdown</div>
                    </div>
                  </div>
                </div>
                <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', fontFamily: 'var(--font)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Select Week (Pick Any Day)</label>
                    <input
                      type="date"
                      className="filter-select"
                      style={{ width: '100%', boxSizing: 'border-box' }}
                      value={selectedWeek}
                      onChange={e => setSelectedWeek(e.target.value)}
                    />
                  </div>
                  <Button
                    className="btn btn-primary"
                    style={{ width: '100%', justifyContent: 'center', gap: 8, background: downloadDone === 'weekly' ? 'var(--success)' : '#F59E0B', borderColor: '#D97706', transition: 'background 0.3s' }}
                    onClick={() => handleDownload('weekly')}
                    disabled={downloading === 'weekly'}
                  >
                    {downloading === 'weekly' ? <><Loader2 size={15} className="spin" /> Generating…</> : downloadDone === 'weekly' ? <><CheckCircle2 size={15} /> Downloaded!</> : <><Download size={15} /> Download .docx</>}
                  </Button>
                  <div style={{ fontSize: 10.5, color: 'var(--text-muted)', fontFamily: 'var(--font)', textAlign: 'center' }}>Microsoft Word · MDRRMO soft copy format</div>
                </div>
              </div>

              {/* ── MONTHLY REPORT CARD ── */}
              <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                <div className="card-header" style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(34, 197, 94, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Calendar size={18} color="#22C55E" />
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font)', letterSpacing: '-0.2px' }}>Monthly Report</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font)', marginTop: 1 }}>Full-month statistical report</div>
                    </div>
                  </div>
                </div>
                <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', fontFamily: 'var(--font)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Select Month</label>
                    <input
                      type="month"
                      className="filter-select"
                      style={{ width: '100%', boxSizing: 'border-box' }}
                      value={selectedMonth}
                      onChange={e => setSelectedMonth(e.target.value)}
                    />
                  </div>
                  <Button
                    className="btn btn-primary"
                    style={{ width: '100%', justifyContent: 'center', gap: 8, background: downloadDone === 'monthly' ? 'var(--success)' : '#22C55E', borderColor: '#16A34A', transition: 'background 0.3s' }}
                    onClick={() => handleDownload('monthly')}
                    disabled={downloading === 'monthly'}
                  >
                    {downloading === 'monthly' ? <><Loader2 size={15} className="spin" /> Generating…</> : downloadDone === 'monthly' ? <><CheckCircle2 size={15} /> Downloaded!</> : <><Download size={15} /> Download .docx</>}
                  </Button>
                  <div style={{ fontSize: 10.5, color: 'var(--text-muted)', fontFamily: 'var(--font)', textAlign: 'center' }}>Microsoft Word · MDRRMO soft copy format</div>
                </div>
              </div>
            </div>

            {/* ── Generated Reports Data Table Section ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Available Generated Reports</h3>
                <select
                  className="filter-select"
                  value={reportFilter}
                  onChange={e => setReportFilter(e.target.value)}
                >
                  <option value="All Types">All Types</option>
                  <option value="Monthly">Monthly</option>
                  <option value="Quarterly">Quarterly</option>
                  <option value="Annual">Annual</option>
                </select>
              </div>
              <Button size="sm" className="btn btn-primary btn-sm" onClick={() => generateFullReport()}>
                <Download size={14} /> Export Full Report (CSV)
              </Button>
            </div>

            <div className="card" style={{ marginBottom: 24 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Report ID</th>
                    <th>Title</th>
                    <th>Type</th>
                    <th>Generated</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReports.map((r) => (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 600 }}>{r.id}</td>
                      <td>{r.title}</td>
                      <td>
                        <Badge className={`badge ${r.type === 'Annual' ? 'resolved' : r.type === 'Monthly' ? 'reviewing' : 'dispatched'}`}>
                          {r.type}
                        </Badge>
                      </td>
                      <td>{r.generated}</td>
                      <td>
                        <Button size="sm" variant="outline" className="btn btn-outline btn-sm" onClick={() => downloadReport(r.id)}>
                          <Download size={14} /> Download CSV
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── Top Incident Locations Table Card ── */}
            <div className="card">
              <div className="card-header">
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Top Incident Locations (All Years)</h3>
              </div>
              <div className="card-body">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                  {topLocations.map((loc, i) => (
                    <div key={loc.name} style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                      background: i < 3 ? 'rgba(239, 68, 68, 0.05)' : 'var(--bg-card-hover)',
                      borderRadius: 10, border: i < 3 ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid var(--border)',
                    }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 800, color: 'white',
                        background: i === 0 ? '#EF4444' : i === 1 ? '#F59E0B' : i === 2 ? '#3B82F6' : '#94A3B8',
                      }}>{i + 1}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{loc.name}</div>
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: i < 3 ? '#EF4444' : 'var(--text-primary)' }}>{loc.count}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── High-End Taste Skill Warning Pop-Up Modal (No Incident Data Found) ── */}
      {emptyModal?.open && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'clamp(12px, 3vw, 24px)',
          background: 'rgba(10, 14, 26, 0.75)',
          backdropFilter: 'blur(16px) saturate(1.8)',
          WebkitBackdropFilter: 'blur(16px) saturate(1.8)',
          animation: 'fadeIn 0.2s ease-out',
          overflowY: 'auto',
        }}>
          <div style={{
            width: 'min(460px, calc(100vw - 32px))',
            maxHeight: 'calc(100vh - 32px)',
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.98) 100%)',
            borderRadius: 24,
            padding: 8,
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.15)',
            display: 'flex',
            flexDirection: 'column',
          }}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.5) 0%, rgba(15, 23, 42, 0.8) 100%)',
              borderRadius: 'calc(24px - 8px)',
              padding: '28px 24px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}>
              {/* Red Warning Icon Badge */}
              <div style={{
                width: 52,
                height: 52,
                borderRadius: 16,
                background: 'rgba(239, 68, 68, 0.18)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                color: '#EF4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 24px rgba(239, 68, 68, 0.3)',
                marginBottom: 16,
              }}>
                <AlertTriangle size={26} color="#EF4444" />
              </div>

              {/* Red Micro Eyebrow */}
              <span style={{
                fontSize: 10,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.18em',
                color: '#EF4444',
                background: 'rgba(239, 68, 68, 0.12)',
                padding: '4px 12px',
                borderRadius: 20,
                border: '1px solid rgba(239, 68, 68, 0.3)',
                marginBottom: 10,
              }}>
                REPORT DATA WARNING
              </span>

              {/* Headline */}
              <h3 style={{
                fontSize: 18,
                fontWeight: 800,
                color: 'white',
                margin: '0 0 8px',
                letterSpacing: '-0.2px',
              }}>
                No Emergency Incidents Found
              </h3>

              {/* Description */}
              <p style={{
                fontSize: 13,
                lineHeight: 1.6,
                color: '#94A3B8',
                margin: '0 0 20px',
              }}>
                There are no logged emergency incidents for the selected <strong style={{ color: '#E2E8F0' }}>{emptyModal.periodName}</strong>. Official report generation has been safely cancelled.
              </p>

              {/* Red Action Button */}
              <button
                onClick={() => setEmptyModal(null)}
                style={{
                  width: '100%',
                  padding: '12px 20px',
                  borderRadius: 14,
                  background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: 13,
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  boxShadow: '0 4px 16px rgba(239, 68, 68, 0.35)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                Acknowledge & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
