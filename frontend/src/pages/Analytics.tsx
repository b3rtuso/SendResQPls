import { useState, useEffect, useMemo, useCallback } from 'react';
import Header from '../components/Header';
import {
  Line, LineChart, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
} from 'recharts';
import { TrendingUp, FileText, Download, MapPin, BarChart3, Calendar, Loader2, CheckCircle2 } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './analytics-map.css';
import {
  BALAYAN_CENTER, BALAYAN_BOUNDS, BARANGAYS, INCIDENT_TYPES,
  type Barangay,
} from '../data/balayan-data';
import {
  forecastData, distributionData, monthlyDetails, reportData, yearlySummary,
  incidentTrendsData, yearlyTotals, topLocations,
  TYPE_COLORS, downloadReport, generateFullReport,
} from '../data/mdrrmo-data';
import {
  downloadDailyReport, downloadWeeklyReport, downloadMonthlyReport,
  getDailyRange,
} from '../utils/reportGenerator';
import { getIncidentsByRange } from '../api/client';
import type { Incident } from '../types';

// Fix Leaflet default icon issue with bundlers
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
  const [reportFilter, setReportFilter] = useState('All Types');
  const [trendYear, setTrendYear] = useState<'all' | '2023' | '2024' | '2025' | '2026'>('all');

  // ── Live report counts & download state ──────────────────────────────
  type RangeKey = 'daily' | 'weekly' | 'monthly';
  const [reportCounts, setReportCounts] = useState<Record<RangeKey, number | null>>({
    daily: null, weekly: null, monthly: null,
  });
  const [reportIncidents, setReportIncidents] = useState<Record<RangeKey, Incident[]>>({
    daily: [], weekly: [], monthly: [],
  });
  const [downloading, setDownloading] = useState<RangeKey | null>(null);
  const [downloadDone, setDownloadDone] = useState<RangeKey | null>(null);

  // ── Distribution chart year filter ────────────────────────────────
  const [distYear, setDistYear] = useState<'all' | '2023' | '2024' | '2025' | '2026'>('all');

  // Per-card date pickers
  const todayIso = new Date().toISOString().split('T')[0];
  const [selectedDay, setSelectedDay]   = useState(todayIso);
  const [selectedWeek, setSelectedWeek] = useState(getDailyRange().from);   // Monday of current week
  const [selectedMonth, setSelectedMonth] = useState(todayIso.slice(0, 7)); // YYYY-MM

  // Compute ranges from picker values
  const pickerRanges = useMemo(() => {
    // Daily: just the chosen day
    const dailyFrom = selectedDay;
    const dailyTo   = selectedDay;

    // Weekly: Mon of chosen week → Sun
    const wd  = new Date(selectedWeek + 'T00:00:00');
    const day = wd.getDay();
    const mon = new Date(wd); mon.setDate(wd.getDate() - (day === 0 ? 6 : day - 1));
    const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
    const weekFrom = mon.toISOString().split('T')[0];
    const weekTo   = sun.toISOString().split('T')[0];

    // Monthly: first day of chosen month → last day
    const [y, m]  = selectedMonth.split('-').map(Number);
    const first   = new Date(y, m - 1, 1);
    const last    = new Date(y, m, 0);
    const monthFrom = first.toISOString().split('T')[0];
    const monthTo   = last.toISOString().split('T')[0];

    return { dailyFrom, dailyTo, weekFrom, weekTo, monthFrom, monthTo };
  }, [selectedDay, selectedWeek, selectedMonth]);

  const fetchReportCounts = useCallback(async (ranges?: { dailyFrom: string; dailyTo: string; weekFrom: string; weekTo: string; monthFrom: string; monthTo: string }) => {
    const r = ranges ?? { dailyFrom: todayIso, dailyTo: todayIso, weekFrom: getDailyRange().from, weekTo: todayIso, monthFrom: todayIso.slice(0, 8) + '01', monthTo: todayIso };
    const fetches: { key: RangeKey; from: string; to: string }[] = [
      { key: 'daily',   from: r.dailyFrom, to: r.dailyTo   },
      { key: 'weekly',  from: r.weekFrom,  to: r.weekTo    },
      { key: 'monthly', from: r.monthFrom, to: r.monthTo   },
    ];
    const results = await Promise.allSettled(
      fetches.map(({ key, from, to }) =>
        getIncidentsByRange(from, to).then(res => ({ key, data: res.data as Incident[] }))
      )
    );
    const counts: Record<RangeKey, number | null>   = { daily: null, weekly: null, monthly: null };
    const incidents: Record<RangeKey, Incident[]>   = { daily: [], weekly: [], monthly: [] };
    results.forEach(res => {
      if (res.status === 'fulfilled') {
        counts[res.value.key]    = res.value.data.length;
        incidents[res.value.key] = res.value.data;
      }
    });
    setReportCounts(counts);
    setReportIncidents(incidents);
  }, [todayIso]);

  useEffect(() => {
    if (tab === 'reports') fetchReportCounts(pickerRanges);
  }, [tab, fetchReportCounts, pickerRanges]);

  const handleDownload = async (key: RangeKey) => {
    setDownloading(key);
    try {
      const incs = reportIncidents[key];
      if (key === 'daily')   await downloadDailyReport(incs);
      if (key === 'weekly')  await downloadWeeklyReport(incs);
      if (key === 'monthly') await downloadMonthlyReport(incs);
      setDownloadDone(key);
      setTimeout(() => setDownloadDone(null), 3000);
    } finally {
      setDownloading(null);
    }
  };

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

              {/* Leaflet Map — OSM tiles show correct PH barangay names */}
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

            {/* Year-Over-Year Trends + Type Distribution Pie */}
            <div className="grid-2" style={{ marginTop: 20 }}>
              <div className="card">
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3>Year-Over-Year Incident Trends</h3>
                  <select className="filter-select" value={trendYear} onChange={e => setTrendYear(e.target.value as any)} style={{ minWidth: 120 }}>
                    <option value="all">All Years</option>
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
                        {(trendYear === 'all' || trendYear === '2023') && (
                          <Line type="monotone" dataKey="y2023" stroke="#94A3B8" strokeWidth={trendYear === '2023' ? 3 : 2} name="2023" dot={{ r: trendYear === '2023' ? 4 : 3 }} strokeDasharray={trendYear === 'all' ? '4 4' : undefined} connectNulls={false} />
                        )}
                        {(trendYear === 'all' || trendYear === '2024') && (
                          <Line type="monotone" dataKey="y2024" stroke="#3B82F6" strokeWidth={trendYear === '2024' ? 3 : 2} name="2024" dot={trendYear === '2024' ? { r: 4 } : false} />
                        )}
                        {(trendYear === 'all' || trendYear === '2025') && (
                          <Line type="monotone" dataKey="y2025" stroke="#F59E0B" strokeWidth={trendYear === '2025' ? 3 : 2} name="2025" dot={trendYear === '2025' ? { r: 4 } : false} />
                        )}
                        {(trendYear === 'all' || trendYear === '2026') && (
                          <Line type="monotone" dataKey="y2026" stroke="#22C55E" strokeWidth={trendYear === '2026' ? 3 : 2.5} name="2026" dot={{ r: trendYear === '2026' ? 5 : 4, strokeWidth: 2 }} connectNulls={false} />
                        )}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h3>Incident Type Distribution</h3>
                  <select
                    className="filter-select"
                    value={distYear}
                    onChange={e => setDistYear(e.target.value as typeof distYear)}
                    style={{ marginLeft: 'auto' }}
                  >
                    {(() => {
                      const yearsWithData = yearlyTotals.filter(y => y.total > 0);
                      const minYear = yearsWithData[0]?.year;
                      const maxYear = yearsWithData[yearsWithData.length - 1]?.year;
                      return (
                        <>
                          <option value="all">
                            All Years{minYear && maxYear ? ` (${minYear}–${maxYear})` : ''}
                          </option>
                          {yearsWithData.map(y => (
                            <option key={y.year} value={String(y.year)}>
                              {y.year}{y.year === new Date().getFullYear() ? ` (Jan–${new Date().toLocaleDateString('en-PH', { month: 'short' })})` : ''}
                            </option>
                          ))}
                        </>
                      );
                    })()}
                  </select>
                </div>
                <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16, alignItems: 'center' }}>
                  {(() => {
                    // Per-year type totals from yearlyTotals
                    const row = distYear === 'all'
                      ? { Medical: 569, Trauma: 608, Accident: 44, Fire: 2, Crime: 10, Other: 27 }
                      : yearlyTotals.find(y => String(y.year) === distYear) ?? { Medical: 0, Trauma: 0, Accident: 0, Fire: 0, Crime: 0, Other: 0 };
                    const total = (row.Medical||0)+(row.Trauma||0)+(row.Accident||0)+(row.Fire||0)+(row.Crime||0);
                    const dist = [
                      { name: 'Medical',  value: row.Medical  || 0, color: TYPE_COLORS.Medical  },
                      { name: 'Trauma',   value: row.Trauma   || 0, color: TYPE_COLORS.Trauma   },
                      { name: 'Accident', value: row.Accident || 0, color: TYPE_COLORS.Accident },
                      { name: 'Fire',     value: row.Fire     || 0, color: TYPE_COLORS.Fire     },
                      { name: 'Crime',    value: row.Crime    || 0, color: TYPE_COLORS.Crime    },
                    ].filter(d => d.value > 0);
                    return (
                      <>
                        <div className="chart-container" style={{ height: 260 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie data={dist} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={3}>
                                {dist.map((entry, i) => <Cell key={i} fill={entry.color} stroke="none" />)}
                              </Pie>
                              <Tooltip contentStyle={tooltipStyle} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div>
                          {dist.map(t => (
                            <div key={t.name} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                              <div style={{ width: 12, height: 12, borderRadius: 3, background: t.color, flexShrink: 0 }} />
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--font)', color: 'var(--text-primary)' }}>{t.name}</div>
                                <div style={{ fontSize: 11, fontFamily: 'var(--font)', color: 'var(--text-secondary)' }}>{t.value} incidents ({total > 0 ? ((t.value / total) * 100).toFixed(1) : 0}%)</div>
                              </div>
                            </div>
                          ))}
                          <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border)', fontSize: 12, fontFamily: 'var(--font)', color: 'var(--text-muted)', fontWeight: 600 }}>
                            Total: {total.toLocaleString()} incidents
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Yearly Totals Bar Chart */}
            <div className="card" style={{ marginTop: 20 }}>
              <div className="card-header"><h3>Yearly Incident Totals by Category</h3></div>
              <div className="card-body">
                <div className="chart-container" style={{ height: 280 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={yearlyTotals} barCategoryGap="30%">
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="year" tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} />
                      <YAxis tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Legend />
                      <Bar dataKey="Medical" fill={TYPE_COLORS.Medical} radius={[3, 3, 0, 0]} stackId="a" />
                      <Bar dataKey="Trauma" fill={TYPE_COLORS.Trauma} radius={[0, 0, 0, 0]} stackId="a" />
                      <Bar dataKey="Accident" fill={TYPE_COLORS.Accident} radius={[0, 0, 0, 0]} stackId="a" />
                      <Bar dataKey="Fire" fill={TYPE_COLORS.Fire} radius={[0, 0, 0, 0]} stackId="a" />
                      <Bar dataKey="Crime" fill={TYPE_COLORS.Crime} radius={[3, 3, 0, 0]} stackId="a" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Monthly Forecast Details */}
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

        {/* ============ REPORTS TAB ============ */}
        {tab === 'reports' && (
          <div className="fade-in">

            {/* ── Live Report Cards ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20, marginBottom: 28 }}>

              {/* ── DAILY ─────────────────────────────────────────────────────── */}
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
                      max={todayIso}
                      onChange={e => setSelectedDay(e.target.value)}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: 10, border: '1px solid var(--border)' }}>
                    {reportCounts.daily === null ? (
                      <Loader2 size={15} color="var(--primary)" style={{ animation: 'spin 1s linear infinite' }} />
                    ) : (
                      <>
                        <span style={{ fontSize: 26, fontWeight: 800, color: 'var(--primary)', fontFamily: 'var(--font)', lineHeight: 1 }}>{reportCounts.daily}</span>
                        <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'var(--font)', fontWeight: 600 }}>{reportCounts.daily === 1 ? 'incident' : 'incidents'} recorded</span>
                      </>
                    )}
                  </div>
                  <button
                    className="btn btn-primary"
                    style={{ width: '100%', justifyContent: 'center', gap: 8, background: downloadDone === 'daily' ? 'var(--success)' : undefined, transition: 'background 0.3s' }}
                    onClick={() => handleDownload('daily')}
                    disabled={downloading === 'daily' || reportCounts.daily === null}
                  >
                    {downloading === 'daily' ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Generating…</> : downloadDone === 'daily' ? <><CheckCircle2 size={15} /> Downloaded!</> : <><Download size={15} /> Download .docx</>}
                  </button>
                  <div style={{ fontSize: 10.5, color: 'var(--text-muted)', fontFamily: 'var(--font)', textAlign: 'center' }}>Microsoft Word · MDRRMO soft copy format</div>
                </div>
              </div>

              {/* ── WEEKLY ────────────────────────────────────────────────────── */}
              <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                <div className="card-header" style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(124,58,237,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <BarChart3 size={18} color="#7C3AED" />
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font)', letterSpacing: '-0.2px' }}>Weekly Report</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font)', marginTop: 1 }}>Mon – Sun week block</div>
                    </div>
                  </div>
                </div>
                <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', fontFamily: 'var(--font)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Any Date in That Week</label>
                    <input
                      type="date"
                      className="filter-select"
                      style={{ width: '100%', boxSizing: 'border-box' }}
                      value={selectedWeek}
                      max={todayIso}
                      onChange={e => setSelectedWeek(e.target.value)}
                    />
                    {selectedWeek && (() => {
                      const d = new Date(selectedWeek + 'T00:00:00');
                      const day = d.getDay();
                      const mon = new Date(d); mon.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
                      const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
                      const fmt = (dt: Date) => dt.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
                      return <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font)', marginTop: 5 }}>Week: {fmt(mon)} – {fmt(sun)}</div>;
                    })()}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: 10, border: '1px solid var(--border)' }}>
                    {reportCounts.weekly === null ? (
                      <Loader2 size={15} color="#7C3AED" style={{ animation: 'spin 1s linear infinite' }} />
                    ) : (
                      <>
                        <span style={{ fontSize: 26, fontWeight: 800, color: '#7C3AED', fontFamily: 'var(--font)', lineHeight: 1 }}>{reportCounts.weekly}</span>
                        <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'var(--font)', fontWeight: 600 }}>{reportCounts.weekly === 1 ? 'incident' : 'incidents'} recorded</span>
                      </>
                    )}
                  </div>
                  <button
                    className="btn btn-primary"
                    style={{ width: '100%', justifyContent: 'center', gap: 8, background: downloadDone === 'weekly' ? 'var(--success)' : '#7C3AED', transition: 'background 0.3s' }}
                    onClick={() => handleDownload('weekly')}
                    disabled={downloading === 'weekly' || reportCounts.weekly === null}
                  >
                    {downloading === 'weekly' ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Generating…</> : downloadDone === 'weekly' ? <><CheckCircle2 size={15} /> Downloaded!</> : <><Download size={15} /> Download .docx</>}
                  </button>
                  <div style={{ fontSize: 10.5, color: 'var(--text-muted)', fontFamily: 'var(--font)', textAlign: 'center' }}>Microsoft Word · MDRRMO soft copy format</div>
                </div>
              </div>

              {/* ── MONTHLY ───────────────────────────────────────────────────── */}
              <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                <div className="card-header" style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(5,150,105,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FileText size={18} color="#059669" />
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font)', letterSpacing: '-0.2px' }}>Monthly Report</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font)', marginTop: 1 }}>Full month summary</div>
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
                      max={todayIso.slice(0, 7)}
                      onChange={e => setSelectedMonth(e.target.value)}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: 10, border: '1px solid var(--border)' }}>
                    {reportCounts.monthly === null ? (
                      <Loader2 size={15} color="#059669" style={{ animation: 'spin 1s linear infinite' }} />
                    ) : (
                      <>
                        <span style={{ fontSize: 26, fontWeight: 800, color: '#059669', fontFamily: 'var(--font)', lineHeight: 1 }}>{reportCounts.monthly}</span>
                        <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'var(--font)', fontWeight: 600 }}>{reportCounts.monthly === 1 ? 'incident' : 'incidents'} recorded</span>
                      </>
                    )}
                  </div>
                  <button
                    className="btn btn-primary"
                    style={{ width: '100%', justifyContent: 'center', gap: 8, background: downloadDone === 'monthly' ? 'var(--success)' : '#059669', transition: 'background 0.3s' }}
                    onClick={() => handleDownload('monthly')}
                    disabled={downloading === 'monthly' || reportCounts.monthly === null}
                  >
                    {downloading === 'monthly' ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Generating…</> : downloadDone === 'monthly' ? <><CheckCircle2 size={15} /> Downloaded!</> : <><Download size={15} /> Download .docx</>}
                  </button>
                  <div style={{ fontSize: 10.5, color: 'var(--text-muted)', fontFamily: 'var(--font)', textAlign: 'center' }}>Microsoft Word · MDRRMO soft copy format</div>
                </div>
              </div>

            </div>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0 20px' }}>
              <div style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
              <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Historical Reports Archive
              </span>
              <div style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
            </div>

            {/* Stat cards for reports */}
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 20 }}>
              <div className="stat-card"><div className="stat-info"><h3>Total Reports</h3><div className="stat-value">{reportData.length}</div><div className="stat-change up">Available for download</div></div><div className="stat-icon blue"><FileText size={22} /></div></div>
              <div className="stat-card"><div className="stat-info"><h3>Data Coverage</h3><div className="stat-value">2023–2026</div><div className="stat-change up">4 years of data</div></div><div className="stat-icon purple"><Calendar size={22} /></div></div>
              <div className="stat-card"><div className="stat-info"><h3>Total Records</h3><div className="stat-value">1,260</div><div className="stat-change up">MDRRMO incident reports</div></div><div className="stat-icon green"><BarChart3 size={22} /></div></div>
            </div>

            <div className="filters-bar">
              <select
                className="filter-select"
                value={reportFilter}
                onChange={e => setReportFilter(e.target.value)}
              >
                <option>All Types</option>
                <option>Monthly</option>
                <option>Quarterly</option>
                <option>Annual</option>
              </select>
              <div style={{ flex: 1 }} />
              <button className="btn btn-primary btn-sm" onClick={() => generateFullReport()}>
                <Download size={14} /> Export Full Report (CSV)
              </button>
            </div>
            <div className="card">
              <table className="data-table">
                <thead><tr><th>Report ID</th><th>Title</th><th>Type</th><th>Generated</th><th>Action</th></tr></thead>
                <tbody>
                  {filteredReports.map((r) => (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 600 }}>{r.id}</td>
                      <td>{r.title}</td>
                      <td><span className={`badge ${r.type === 'Annual' ? 'resolved' : r.type === 'Monthly' ? 'reviewing' : 'dispatched'}`}>{r.type}</span></td>
                      <td>{r.generated}</td>
                      <td><button className="btn btn-outline btn-sm" onClick={() => downloadReport(r.id)}><Download size={14} /> Download CSV</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Top Locations Table */}
            <div className="card" style={{ marginTop: 20 }}>
              <div className="card-header">
                <h3>Top Incident Locations (All Years)</h3>
              </div>
              <div className="card-body">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                  {topLocations.map((loc, i) => (
                    <div key={loc.name} style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                      background: i < 3 ? 'rgba(239, 68, 68, 0.04)' : 'var(--bg-secondary)',
                      borderRadius: 10, border: i < 3 ? '1px solid rgba(239, 68, 68, 0.12)' : '1px solid var(--border)',
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
    </>
  );
}

