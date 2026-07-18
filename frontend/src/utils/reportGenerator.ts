/**
 * reportGenerator.ts
 *
 * Uses the ORIGINAL MDRRMO Balayan template .docx files (stored in /public/templates/)
 * as the base — preserving the government header (seals/logos), footer (hotline),
 * margins, and all formatting exactly.
 *
 * At runtime: fetches the template → injects live incident data via docxtemplater
 * → triggers browser download.
 */

import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import { saveAs } from 'file-saver';
import type { Incident } from '../types';

// ─── number → English words (for narrative) ──────────────────────────────────

function toWords(n: number): string {
  const ones = [
    'Zero','One','Two','Three','Four','Five','Six','Seven','Eight','Nine',
    'Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen',
    'Seventeen','Eighteen','Nineteen',
  ];
  const tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
  if (n < 20)  return ones[n];
  if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? `-${ones[n % 10]}` : '');
  if (n < 1000) {
    const h = Math.floor(n / 100);
    const r = n % 100;
    return `${ones[h]} Hundred${r ? ' ' + toWords(r) : ''}`;
  }
  return String(n);
}

// ─── date / time helpers ──────────────────────────────────────────────────────

function pad2(n: number) { return String(n).padStart(2, '0'); }

function militaryTime(iso: string): string {
  const d = new Date(iso);
  return `${pad2(d.getHours())}${pad2(d.getMinutes())}H`;
}

function longDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-PH', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
}

function isoDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

function dateStr(d: Date): string {
  return d.toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' });
}

// ─── incident type classifier ─────────────────────────────────────────────────

function classifyType(inc: Incident): { trauma: boolean; medical: boolean; fire: boolean; crime: boolean } {
  const t = (inc.aiDetectedType ?? '').toLowerCase();
  return {
    trauma:  t.includes('trauma') || t.includes('accident') || t.includes('vehicular'),
    medical: t.includes('medical') || t.includes('conduction') || t.includes('emergency'),
    fire:    t.includes('fire'),
    crime:   t.includes('crime') || t.includes('assault'),
  };
}

// ─── action narrative based on status ─────────────────────────────────────────

function actionNarrative(inc: Incident): string {
  const dept = inc.assignedDepartment ?? inc.aiRecommendedDept ?? 'MDRRMO';
  switch (inc.status) {
    case 'RESOLVED':
      return `${dept} emergency responders responded to the scene and the patient was transported to the hospital for further evaluation and treatment.`;
    case 'REJECTED':
      return 'The response was considered stood down / cancelled. No patient was catered to.';
    case 'DISPATCHED':
      return `${dept} emergency responders have been dispatched and are currently responding to the scene.`;
    case 'REVIEWING':
      return 'The incident is currently under review by MDRRMO personnel for appropriate dispatch.';
    default:
      return 'The incident has been logged and is awaiting response.';
  }
}

// ─── fetch template from public/templates/ ────────────────────────────────────

async function loadTemplate(name: 'daily' | 'weekly' | 'monthly'): Promise<ArrayBuffer> {
  const res = await fetch(`/templates/${name}-template.docx`);
  if (!res.ok) throw new Error(`Failed to load template: ${name}-template.docx`);
  return res.arrayBuffer();
}

// ─── fill template and trigger download ───────────────────────────────────────

async function fillAndDownload(
  templateName: 'daily' | 'weekly' | 'monthly',
  data: Record<string, unknown>,
  filename: string,
) {
  const buf = await loadTemplate(templateName);
  const zip = new PizZip(buf);

  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    // Treat missing tags as empty string (no errors on optional fields)
    nullGetter: () => '',
  });

  doc.render(data);

  const blob = doc.getZip().generate({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    compression: 'DEFLATE',
  });

  saveAs(blob, filename);
}

// ─────────────────────────────────────────────────────────────────────────────
// DATE RANGE HELPERS  (used by Analytics.tsx for card labels)
// ─────────────────────────────────────────────────────────────────────────────

export function getDailyRange() {
  const now  = new Date();
  const from = isoDate(now);
  return {
    from,
    to:     from,
    label:  `DAILY-INCIDENT-REPORT_${from}.docx`,
    period: `Date: ${dateStr(now)}`,
  };
}

export function getWeeklyRange() {
  const now = new Date();
  const day = now.getDay();
  const mon = new Date(now);
  mon.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
  const from = isoDate(mon);
  const to   = isoDate(now);
  return {
    from,
    to,
    label:  `WEEKLY-INCIDENT-REPORT_${now.toLocaleDateString('en-PH', { month: 'long', year: 'numeric' }).replace(/ /g, '-').toUpperCase()}.docx`,
    period: `Week of ${dateStr(mon)} – ${dateStr(now)}`,
  };
}

export function getMonthlyRange() {
  const now   = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  return {
    from:   isoDate(first),
    to:     isoDate(now),
    label:  `MONTHLY-INCIDENT-REPORT_${now.toLocaleDateString('en-PH', { month: 'long', year: 'numeric' }).replace(/ /g, '-').toUpperCase()}.docx`,
    period: `Month of ${now.toLocaleDateString('en-PH', { month: 'long', year: 'numeric' })}`,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// DAILY REPORT
// ─────────────────────────────────────────────────────────────────────────────

export async function downloadDailyReport(incidents: Incident[]) {
  const { label } = getDailyRange();

  const incidentData = incidents.map(inc => ({
    time:           militaryTime(inc.createdAt),
    date:           longDate(inc.createdAt),
    incident_type:  inc.aiDetectedType ?? 'Unknown Incident',
    location:       inc.latitude && inc.longitude
                      ? `Balayan, Batangas (Lat: ${inc.latitude.toFixed(4)}, Lng: ${inc.longitude.toFixed(4)})`
                      : 'Balayan, Batangas',
    reporter_name:  inc.reporter?.name ?? 'Unknown Reporter',
    reporter_phone: inc.reporter?.phoneNumber ? ` (${inc.reporter.phoneNumber})` : '',
    narrative:      actionNarrative(inc),
  }));

  await fillAndDownload(
    'daily',
    { incidents: incidentData.length > 0 ? incidentData : [
      // If no incidents, show a blank-slate page
      {
        time:           '—',
        date:           longDate(new Date().toISOString()),
        incident_type:  'No incidents recorded',
        location:       'Balayan, Batangas',
        reporter_name:  '—',
        reporter_phone: '',
        narrative:      'No incidents were recorded for this date.',
      },
    ]},
    label,
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// WEEKLY REPORT
// ─────────────────────────────────────────────────────────────────────────────

const WEEK_ORDINALS = ['First','Second','Third','Fourth','Fifth','Sixth'];

function groupByWeek(incidents: Incident[]): Map<string, Incident[]> {
  const map = new Map<string, Incident[]>();
  for (const inc of incidents) {
    const d   = new Date(inc.createdAt);
    const day = d.getDay();
    const mon = new Date(d);
    mon.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
    const key = isoDate(mon);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(inc);
  }
  return map;
}

export async function downloadWeeklyReport(incidents: Incident[]) {
  const { label } = getWeeklyRange();

  const weekMap     = groupByWeek(incidents);
  const sortedKeys  = Array.from(weekMap.keys()).sort();

  const weeks = sortedKeys.map((weekStart, idx) => {
    const weekIncs = weekMap.get(weekStart)!;
    const total    = weekIncs.length;

    const trauma  = weekIncs.filter(i => classifyType(i).trauma).length;
    const medical = weekIncs.filter(i => classifyType(i).medical).length;
    const fire    = weekIncs.filter(i => classifyType(i).fire).length;
    const crime   = weekIncs.filter(i => classifyType(i).crime).length;

    const fromDate = new Date(weekStart + 'T00:00:00');
    const lastDate = new Date(weekIncs[weekIncs.length - 1].createdAt);

    const fromLabel = fromDate.toLocaleDateString('en-PH', { month: 'long', day: 'numeric' }).toUpperCase();
    const toLabel   = lastDate.toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase();

    return {
      week_ordinal:  WEEK_ORDINALS[idx] ?? `Week ${idx + 1}`,
      week_range:    `${fromLabel}-${toLabel}`,
      total_word:    toWords(total),
      total_num:     total,
      total_plural:  total !== 1 ? 's' : '',
      has_trauma:    trauma > 0,
      trauma_word:   toWords(trauma),
      trauma_num:    trauma,
      has_medical:   medical > 0,
      medical_word:  toWords(medical),
      medical_num:   medical,
      has_fire:      fire > 0,
      fire_word:     toWords(fire),
      fire_num:      fire,
      has_crime:     crime > 0,
      crime_word:    toWords(crime),
      crime_num:     crime,
    };
  });

  // If no incidents, show blank week
  const weeksData = weeks.length > 0 ? weeks : [{
    week_ordinal: 'First',
    week_range:   `${getWeeklyRange().period.toUpperCase()}`,
    total_word:   'Zero',   total_num: 0,   total_plural: 's',
    has_trauma:   false,    trauma_word: 'Zero',  trauma_num: 0,
    has_medical:  false,    medical_word: 'Zero', medical_num: 0,
    has_fire:     false,    fire_word: 'Zero',    fire_num: 0,
    has_crime:    false,    crime_word: 'Zero',   crime_num: 0,
  }];

  await fillAndDownload('weekly', { weeks: weeksData }, label);
}

// ─────────────────────────────────────────────────────────────────────────────
// MONTHLY REPORT
// ─────────────────────────────────────────────────────────────────────────────

export async function downloadMonthlyReport(incidents: Incident[]) {
  const now   = new Date();
  const { label } = getMonthlyRange();

  const total   = incidents.length;
  const trauma  = incidents.filter(i => classifyType(i).trauma).length;
  const medical = incidents.filter(i => classifyType(i).medical).length;
  const fire    = incidents.filter(i => classifyType(i).fire).length;
  const crime   = incidents.filter(i => classifyType(i).crime).length;

  // Build extra_types string for fire/crime if present
  const extras: string[] = [];
  if (fire > 0)  extras.push(`${toWords(fire)} (${fire}) Fire Incidents`);
  if (crime > 0) extras.push(`${toWords(crime)} (${crime}) Crime-Related Incidents`);
  const extra_types = extras.length > 0 ? `, and ${extras.join(', ')}` : '';

  await fillAndDownload('monthly', {
    month_upper:  now.toLocaleDateString('en-PH', { month: 'long' }).toUpperCase(),
    year:         now.getFullYear(),
    total_word:   toWords(total),
    total_num:    total,
    total_plural: total !== 1 ? 's' : '',
    trauma_word:  toWords(trauma),
    trauma_num:   trauma,
    medical_word: toWords(medical),
    medical_num:  medical,
    extra_types,
  }, label);
}
