import { useState } from 'react';
import Header from '../components/Header';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { TrendingUp, FileText, Download } from 'lucide-react';

// Forecast chart data — matches Figma: Total (blue), Predicted Forecast (purple dashed), Resolved (green)
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

// Request distribution bar chart — matches Figma: blue bars
const distributionData = [
  { month: 'Jul', total: 18, completed: 12 },
  { month: 'Aug', total: 17, completed: 14 },
  { month: 'Sep', total: 15, completed: 11 },
  { month: 'Oct', total: 16, completed: 13 },
  { month: 'Nov', total: 19, completed: 15 },
  { month: 'Dec', total: 14, completed: 10 },
];

// Monthly forecast detail cards — matches Figma
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

export default function Analytics() {
  const [tab, setTab] = useState<'forecast' | 'reports'>('forecast');

  return (
    <>
      <Header title="Analytics & Reports" subtitle="Forecasting and incident analysis" />
      <div className="page-content">
        <div className="tabs fade-in">
          <button className={`tab ${tab === 'forecast' ? 'active' : ''}`} onClick={() => setTab('forecast')}>
            <TrendingUp size={16} style={{ marginRight: 6, verticalAlign: -3 }} /> Incident Forecast
          </button>
          <button className={`tab ${tab === 'reports' ? 'active' : ''}`} onClick={() => setTab('reports')}>
            <FileText size={16} style={{ marginRight: 6, verticalAlign: -3 }} /> Incident Reports
          </button>
        </div>

        {tab === 'forecast' && (
          <div className="fade-in">
            {/* Stats Row */}
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              <div className="stat-card"><div className="stat-info"><h3>This Month Predicted</h3><div className="stat-value">21</div><div className="stat-change up">↑ Based on trend analysis</div></div><div className="stat-icon purple"><TrendingUp size={22} /></div></div>
              <div className="stat-card"><div className="stat-info"><h3>Peak Month (Predicted)</h3><div className="stat-value">Aug</div><div className="stat-change up">28 incidents forecasted</div></div><div className="stat-icon red"><TrendingUp size={22} /></div></div>
              <div className="stat-card"><div className="stat-info"><h3>YoY Growth</h3><div className="stat-value">+18%</div><div className="stat-change up">↑ Compared to 2025</div></div><div className="stat-icon blue"><TrendingUp size={22} /></div></div>
            </div>

            {/* Two Charts Side by Side */}
            <div className="grid-2" style={{ marginTop: 20 }}>
              {/* Incident Forecast — Multi-line chart */}
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

              {/* Requests Over Time — Grouped bar chart */}
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

            {/* Monthly Incident Forecast Details — Grid of 12 months */}
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
