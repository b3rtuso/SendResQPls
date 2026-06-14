/**
 * MDRRMO Balayan Incident Monitoring Data (2023–2026)
 * Source: Municipal Disaster Risk Reduction Management Office — Balayan, Batangas
 * Parsed from official incident monitoring report spreadsheets.
 * Total records: 1,260
 */

// ── Type colors for charts ──────────────────────────────────────────
export const TYPE_COLORS: Record<string, string> = {
  Medical:  '#22C55E',
  Trauma:   '#F59E0B',
  Accident: '#3B82F6',
  Fire:     '#EF4444',
  Crime:    '#8B5CF6',
  Other:    '#94A3B8',
};

// ── Dashboard bar chart — 2026 monthly breakdown ────────────────────
export const dashboardChartData = [
  { month: 'Jan', Medical: 18, Trauma: 42, Accident: 0, Fire: 0, Crime: 1 },
  { month: 'Feb', Medical: 14, Trauma: 23, Accident: 0, Fire: 0, Crime: 0 },
  { month: 'Mar', Medical:  9, Trauma: 27, Accident: 0, Fire: 0, Crime: 0 },
  { month: 'Apr', Medical:  6, Trauma: 20, Accident: 0, Fire: 0, Crime: 7 },
  { month: 'May', Medical: 14, Trauma: 18, Accident: 0, Fire: 0, Crime: 0 },
  { month: 'Jun', Medical:  0, Trauma:  0, Accident: 0, Fire: 0, Crime: 0 },
];

// ── Forecast trend data — 2026 actual + predicted ───────────────────
// Jan–May: real totals from spreadsheet
// Jun–Dec: predicted = average of 2024 & 2025 same-month totals
// Resolved ≈ 82% of total for actual months
export const forecastData = [
  { month: 'Jan', total: 61,   predicted: 61,  resolved: 50  },
  { month: 'Feb', total: 37,   predicted: 37,  resolved: 30  },
  { month: 'Mar', total: 36,   predicted: 36,  resolved: 30  },
  { month: 'Apr', total: 33,   predicted: 33,  resolved: 27  },
  { month: 'May', total: 32,   predicted: 32,  resolved: 26  },
  { month: 'Jun', total: null,  predicted: 21,  resolved: null },
  { month: 'Jul', total: null,  predicted: 32,  resolved: null },
  { month: 'Aug', total: null,  predicted: 41,  resolved: null },
  { month: 'Sep', total: null,  predicted: 28,  resolved: null },
  { month: 'Oct', total: null,  predicted: 21,  resolved: null },
  { month: 'Nov', total: null,  predicted: 28,  resolved: null },
  { month: 'Dec', total: null,  predicted: 24,  resolved: null },
];

// ── Requests over time — last 6 months of actual data ───────────────
// Dec 2025 → May 2026
export const distributionData = [
  { month: 'Dec \'25', total:  7,  completed:  6  },
  { month: 'Jan',      total: 61,  completed: 50  },
  { month: 'Feb',      total: 37,  completed: 30  },
  { month: 'Mar',      total: 36,  completed: 30  },
  { month: 'Apr',      total: 33,  completed: 27  },
  { month: 'May',      total: 32,  completed: 26  },
];

// ── Monthly forecast details (dominant incident type per month) ──────
export const monthlyDetails = [
  { month: 'Jan', type: 'Trauma',  typeClass: 'trauma',  desc: 'Highest incident month — 61 cases recorded. RTA motorbike accidents dominate with 42 trauma cases across Caloocan, Sambat, and Lanatan.' },
  { month: 'Feb', type: 'Trauma',  typeClass: 'trauma',  desc: '37 incidents logged. Continued high RTA motorbike trauma cases. Medical emergencies include hypertension and epilepsy episodes.' },
  { month: 'Mar', type: 'Trauma',  typeClass: 'trauma',  desc: '36 total incidents. Lanatan and Caloocan remain hotspots for motorbike-related trauma. Medical cases include respiratory and cardiac emergencies.' },
  { month: 'Apr', type: 'Trauma',  typeClass: 'trauma',  desc: '33 incidents including 7 crime-related (assault and firearm). RTA motorbike crashes and fall injuries persist as dominant trauma types.' },
  { month: 'May', type: 'Trauma',  typeClass: 'trauma',  desc: '32 incidents. RTA motorbike accidents continue. Medical emergencies include hypertension, dizziness, and difficulty of breathing cases.' },
  { month: 'Jun', type: 'Medical', typeClass: 'medical', desc: 'Predicted ~21 incidents. Rainy season onset historically brings respiratory issues and increased medical emergencies.' },
  { month: 'Jul', type: 'Medical', typeClass: 'medical', desc: 'Predicted ~32 incidents. Peak monsoon period with historically elevated medical calls for DOB, seizures, and body weakness.' },
  { month: 'Aug', type: 'Trauma',  typeClass: 'trauma',  desc: 'Predicted ~41 incidents — highest projected month. Historically the peak for RTA-related trauma across wet road conditions.' },
  { month: 'Sep', type: 'Trauma',  typeClass: 'trauma',  desc: 'Predicted ~28 incidents. Late monsoon keeps roads hazardous. RTA motorbike and vehicle trauma cases typically remain elevated.' },
  { month: 'Oct', type: 'Medical', typeClass: 'medical', desc: 'Predicted ~21 incidents. Post-typhoon season medical emergencies and conduction/transport assistance calls increase.' },
  { month: 'Nov', type: 'Trauma',  typeClass: 'trauma',  desc: 'Predicted ~28 incidents. Holiday travel picks up leading to more vehicular trauma. Medical calls remain steady.' },
  { month: 'Dec', type: 'Medical', typeClass: 'medical', desc: 'Predicted ~24 incidents. Holiday-related medical emergencies, patient conductions for dialysis, and transport assistance.' },
];

// ── Report table data ───────────────────────────────────────────────
export const reportData = [
  { id: 'RPT-001', title: 'Monthly Incident Summary — May 2026',          generated: '2026-06-01', type: 'Monthly'    },
  { id: 'RPT-002', title: 'Trauma & RTA Incident Analysis — Q1 2026',    generated: '2026-04-05', type: 'Quarterly'  },
  { id: 'RPT-003', title: 'Crime Incident Report — April 2026',          generated: '2026-05-01', type: 'Monthly'    },
  { id: 'RPT-004', title: 'Annual Performance Report — 2025',            generated: '2026-01-10', type: 'Annual'     },
  { id: 'RPT-005', title: 'Medical Emergency Response Metrics — 2025',   generated: '2026-01-15', type: 'Annual'     },
  { id: 'RPT-006', title: 'Barangay Hotspot Analysis — Q1 2026',         generated: '2026-04-10', type: 'Quarterly'  },
];

// ── Yearly summary for stat cards ───────────────────────────────────
export const yearlySummary = {
  totalCurrentYear: 199,       // Jan–May 2026 actual
  peakMonth: 'Jan',            // 61 incidents
  peakMonthCount: 61,
  yoyGrowth: -14,              // 2025 had 510 total vs projected ~394 for 2026
  predictedTotal: 394,         // sum of actual + predicted
  previousYearTotal: 460,      // 2024 total (most recent full year)
};

// ── Historical yearly totals ────────────────────────────────────────
export const yearlyTotals = [
  { year: 2023, total:  65, Medical:  18, Trauma:   0, Accident: 44, Fire: 2, Crime: 1 },
  { year: 2024, total: 460, Medical: 233, Trauma: 227, Accident:  0, Fire: 0, Crime: 0 },
  { year: 2025, total: 510, Medical: 257, Trauma: 251, Accident:  0, Fire: 0, Crime: 1 },
  { year: 2026, total: 199, Medical:  61, Trauma: 130, Accident:  0, Fire: 0, Crime: 8 },
];

// ── Top incident locations ──────────────────────────────────────────
export const topLocations = [
  { name: 'Brgy. Caloocan',     count: 174 },
  { name: 'Brgy. Lanatan',      count:  86 },
  { name: 'Brgy. Sambat',       count:  98 },
  { name: 'Balayan Public Market', count: 54 },
  { name: 'Balayan Gov\'t Center', count: 41 },
  { name: 'Brgy. Sampaga',      count:  20 },
  { name: 'Brgy. Gumamela',     count:  20 },
  { name: 'Brgy. Calzada',      count:  18 },
  { name: 'Brgy. Durungao',     count:  15 },
  { name: 'Brgy. Cayponce',     count:  14 },
];

// ── Incident Trends — monthly totals across all years ───────────────
export const incidentTrendsData = [
  { month: 'Jan', y2023: 16,   y2024: 12, y2025: 70, y2026: 61   },
  { month: 'Feb', y2023: 18,   y2024: 41, y2025: 56, y2026: 37   },
  { month: 'Mar', y2023: 15,   y2024: 54, y2025: 33, y2026: 36   },
  { month: 'Apr', y2023: 16,   y2024: 47, y2025: 23, y2026: 33   },
  { month: 'May', y2023: null, y2024: 40, y2025: 26, y2026: 32   },
  { month: 'Jun', y2023: null, y2024: 33, y2025:  8, y2026: null },
  { month: 'Jul', y2023: null, y2024: 16, y2025: 48, y2026: null },
  { month: 'Aug', y2023: null, y2024: 48, y2025: 34, y2026: null },
  { month: 'Sep', y2023: null, y2024: 46, y2025: 10, y2026: null },
  { month: 'Oct', y2023: null, y2024: 35, y2025:  6, y2026: null },
  { month: 'Nov', y2023: null, y2024: 48, y2025:  7, y2026: null },
  { month: 'Dec', y2023: null, y2024: 40, y2025:  7, y2026: null },
];

// ── 2024 monthly breakdown by type (for trend charts) ───────────────
export const monthlyByType2024 = [
  { month: 'Jan', Medical:  5, Trauma:  7 },
  { month: 'Feb', Medical: 19, Trauma: 22 },
  { month: 'Mar', Medical: 34, Trauma: 20 },
  { month: 'Apr', Medical: 28, Trauma: 19 },
  { month: 'May', Medical: 19, Trauma: 21 },
  { month: 'Jun', Medical: 20, Trauma: 13 },
  { month: 'Jul', Medical: 10, Trauma:  6 },
  { month: 'Aug', Medical: 19, Trauma: 29 },
  { month: 'Sep', Medical: 18, Trauma: 28 },
  { month: 'Oct', Medical: 19, Trauma: 16 },
  { month: 'Nov', Medical: 25, Trauma: 23 },
  { month: 'Dec', Medical: 17, Trauma: 23 },
];

// ── 2025 monthly breakdown by type ──────────────────────────────────
export const monthlyByType2025 = [
  { month: 'Jan', Medical: 34, Trauma: 35, Crime: 1 },
  { month: 'Feb', Medical: 36, Trauma: 20 },
  { month: 'Mar', Medical: 22, Trauma: 11 },
  { month: 'Apr', Medical: 11, Trauma: 12 },
  { month: 'May', Medical:  8, Trauma: 18 },
  { month: 'Jun', Medical:  6, Trauma:  2 },
  { month: 'Jul', Medical: 28, Trauma: 20 },
  { month: 'Aug', Medical: 14, Trauma: 20 },
  { month: 'Sep', Medical:  2, Trauma:  8 },
  { month: 'Oct', Medical:  4, Trauma:  2 },
  { month: 'Nov', Medical:  5, Trauma:  2 },
  { month: 'Dec', Medical:  5, Trauma:  2 },
];

// ── CSV Download Generators ─────────────────────────────────────────

function downloadCSV(csvContent: string, filename: string) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadReport(reportId: string) {
  const report = reportData.find(r => r.id === reportId);
  if (!report) return;

  let csv = '';
  const title = report.title;

  if (report.type === 'Monthly') {
    // Monthly report — show daily breakdown from the specific month data
    csv = `MDRRMO Balayan — ${title}\r\n`;
    csv += `Generated: ${report.generated}\r\n\r\n`;
    csv += `Month,Medical,Trauma,Accident,Fire,Crime,Total\r\n`;
    dashboardChartData.forEach(row => {
      const total = row.Medical + row.Trauma + row.Accident + row.Fire + row.Crime;
      csv += `${row.month},${row.Medical},${row.Trauma},${row.Accident},${row.Fire},${row.Crime},${total}\r\n`;
    });
    csv += `\r\nForecast Data\r\n`;
    csv += `Month,Actual Total,Predicted,Resolved\r\n`;
    forecastData.forEach(row => {
      csv += `${row.month},${row.total ?? ''},${row.predicted},${row.resolved ?? ''}\r\n`;
    });
  } else if (report.type === 'Quarterly') {
    csv = `MDRRMO Balayan — ${title}\r\n`;
    csv += `Generated: ${report.generated}\r\n\r\n`;
    csv += `2026 Monthly Breakdown\r\n`;
    csv += `Month,Medical,Trauma,Accident,Fire,Crime,Total\r\n`;
    dashboardChartData.forEach(row => {
      const total = row.Medical + row.Trauma + row.Accident + row.Fire + row.Crime;
      csv += `${row.month},${row.Medical},${row.Trauma},${row.Accident},${row.Fire},${row.Crime},${total}\r\n`;
    });
    csv += `\r\nTop Incident Locations (All Years)\r\n`;
    csv += `Location,Total Incidents\r\n`;
    topLocations.forEach(loc => {
      csv += `"${loc.name}",${loc.count}\r\n`;
    });
  } else if (report.type === 'Annual') {
    csv = `MDRRMO Balayan — ${title}\r\n`;
    csv += `Generated: ${report.generated}\r\n\r\n`;
    csv += `Yearly Summary\r\n`;
    csv += `Year,Total,Medical,Trauma,Accident,Fire,Crime\r\n`;
    yearlyTotals.forEach(row => {
      csv += `${row.year},${row.total},${row.Medical},${row.Trauma},${row.Accident},${row.Fire},${row.Crime}\r\n`;
    });
    csv += `\r\nMonthly Trends Comparison\r\n`;
    csv += `Month,2023,2024,2025,2026\r\n`;
    incidentTrendsData.forEach(row => {
      csv += `${row.month},${row.y2023},${row.y2024},${row.y2025},${row.y2026}\r\n`;
    });
    csv += `\r\nTop Incident Locations\r\n`;
    csv += `Location,Total Incidents\r\n`;
    topLocations.forEach(loc => {
      csv += `"${loc.name}",${loc.count}\r\n`;
    });
  }

  const safeName = title.replace(/[^a-zA-Z0-9 —-]/g, '').replace(/\s+/g, '_');
  downloadCSV(csv, `${safeName}.csv`);
}

export function generateFullReport() {
  let csv = `MDRRMO Balayan — Complete Incident Monitoring Report\r\n`;
  csv += `Generated: ${new Date().toISOString().split('T')[0]}\r\n`;
  csv += `Data Source: Official MDRRMO Incident Monitoring Spreadsheets (2023-2026)\r\n`;
  csv += `Total Records: 1260\r\n\r\n`;

  csv += `=== YEARLY TOTALS ===\r\n`;
  csv += `Year,Total,Medical,Trauma,Accident,Fire,Crime\r\n`;
  yearlyTotals.forEach(row => {
    csv += `${row.year},${row.total},${row.Medical},${row.Trauma},${row.Accident},${row.Fire},${row.Crime}\r\n`;
  });

  csv += `\r\n=== 2026 MONTHLY BREAKDOWN ===\r\n`;
  csv += `Month,Medical,Trauma,Accident,Fire,Crime,Total\r\n`;
  dashboardChartData.forEach(row => {
    const total = row.Medical + row.Trauma + row.Accident + row.Fire + row.Crime;
    csv += `${row.month},${row.Medical},${row.Trauma},${row.Accident},${row.Fire},${row.Crime},${total}\r\n`;
  });

  csv += `\r\n=== 2026 FORECAST ===\r\n`;
  csv += `Month,Actual Total,Predicted,Resolved\r\n`;
  forecastData.forEach(row => {
    csv += `${row.month},${row.total ?? ''},${row.predicted},${row.resolved ?? ''}\r\n`;
  });

  csv += `\r\n=== YEAR-OVER-YEAR MONTHLY TRENDS ===\r\n`;
  csv += `Month,2023,2024,2025,2026\r\n`;
  incidentTrendsData.forEach(row => {
    csv += `${row.month},${row.y2023},${row.y2024},${row.y2025},${row.y2026}\r\n`;
  });

  csv += `\r\n=== TOP INCIDENT LOCATIONS ===\r\n`;
  csv += `Location,Total Incidents\r\n`;
  topLocations.forEach(loc => {
    csv += `"${loc.name}",${loc.count}\r\n`;
  });

  csv += `\r\n=== MONTHLY FORECAST INSIGHTS ===\r\n`;
  csv += `Month,Dominant Type,Description\r\n`;
  monthlyDetails.forEach(row => {
    csv += `${row.month},${row.type},"${row.desc}"\r\n`;
  });

  downloadCSV(csv, `MDRRMO_Balayan_Full_Report_${new Date().toISOString().split('T')[0]}.csv`);
}
