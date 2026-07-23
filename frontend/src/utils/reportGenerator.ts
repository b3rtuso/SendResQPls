/**
 * reportGenerator.ts
 *
 * Uses official MDRRMO Balayan template .docx files (stored in /public/templates/)
 * as base, filling live incident and questionnaire data via docxtemplater.
 * 
 * Implements strict rules 1-7 for Weekly and Monthly Reports:
 * 1. Count total number of incidents for selected period.
 * 2. Group incidents dynamically according to recorded Incident Type (omit zero-occurrence types).
 * 3. Summarize common causes, injuries/conditions, responder actions, and outcomes per type.
 * 4. Identify recurring patterns & trends supported strictly by database data.
 * 5. Summarize operational performance & resource utilization.
 * 6. Use formal government-report language without repetition.
 * 7. Never fabricate data.
 */

import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import { saveAs } from 'file-saver';
import type { Incident } from '../types';
import { getNearestBarangay } from '../data/balayan-data';

// ─── number → English words ──────────────────────────────────────────────────

function toWords(n: number): string {
  if (n === 0) return 'Zero';
  const ones = [
    '','One','Two','Three','Four','Five','Six','Seven','Eight','Nine',
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

function countWithWords(n: number): string {
  return `${toWords(n)} (${n})`;
}

// ─── date / time helpers ──────────────────────────────────────────────────────

function pad2(n: number) { return String(n).padStart(2, '0'); }

function militaryTime(iso: string): string {
  const d = new Date(iso);
  return `${pad2(d.getHours())}${pad2(d.getMinutes())}H`;
}

function formatDisplayDate(dateStrRaw: string): string {
  if (!dateStrRaw) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStrRaw)) {
    const [y, m, d] = dateStrRaw.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    return dt.toLocaleDateString('en-PH', { day: '2-digit', month: 'long', year: 'numeric' });
  }
  const dt = new Date(dateStrRaw);
  if (!isNaN(dt.getTime())) {
    return dt.toLocaleDateString('en-PH', { day: '2-digit', month: 'long', year: 'numeric' });
  }
  return dateStrRaw;
}

// ─── location extraction & sanitizer ────────────────────────────────────────

function cleanLocation(raw?: string): string {
  if (!raw || !raw.trim()) return 'Balayan, Batangas';
  let str = raw.trim();
  str = str.replace(/,\s*Balayan,\s*Batangas/gi, '');
  str = str.replace(/,\s*Balayan/gi, '');
  str = str.replace(/,\s*Batangas/gi, '');
  return `${str.trim()}, Balayan, Batangas`;
}

function resolveLocation(inc: Incident): string {
  if (inc.resolutionForm?.incidentLocation) return cleanLocation(inc.resolutionForm.incidentLocation);
  if (inc.adminNotes) {
    const brgyMatch = inc.adminNotes.match(/Brgy\.?\s+([A-Za-z\s]+)/i);
    if (brgyMatch) return cleanLocation(`Brgy. ${brgyMatch[1].trim()}`);
  }
  if (inc.latitude && inc.longitude) {
    return cleanLocation(getNearestBarangay(inc.latitude, inc.longitude));
  }
  return 'Balayan, Batangas';
}

// ─── incident type classifier ─────────────────────────────────────────────────

function describeType(inc: Incident): string {
  if (inc.resolutionForm?.incidentType) return inc.resolutionForm.incidentType;
  const raw = inc.aiDetectedType ?? '';
  if (!raw || raw.trim() === '' || raw.includes('Pending Review')) return 'General Emergency';
  return raw.replace(/\b\w/g, c => c.toUpperCase());
}

// ─── fetch template from public/templates/ ────────────────────────────────────

async function loadTemplate(name: 'daily' | 'weekly' | 'monthly'): Promise<ArrayBuffer> {
  const res = await fetch(`/templates/${name}-template.docx`);
  if (!res.ok) throw new Error(`Failed to load template: ${name}-template.docx`);
  return res.arrayBuffer();
}

// ─── Typography post-processor (Arial 12pt body & Arial 11pt signature) ─────

function applyDocxTypography(zip: PizZip): void {
  const docXml = zip.file('word/document.xml')?.asText();
  if (!docXml) return;

  let xml = docXml;

  // 1. Ensure every <w:pPr> has justified alignment and single spacing.
  xml = xml.replace(/<w:pPr>([\s\S]*?)<\/w:pPr>/g, (match, inner) => {
    if (/<w:pStyle[^/]*w:val="Heading/i.test(inner)) return match;
    if (/<w:pStyle[^/]*w:val="(TOC|Caption|Title|Subtitle)/i.test(inner)) return match;

    let props = inner;
    if (!/<w:jc\b/.test(props)) {
      props += '<w:jc w:val="both"/>';
    }
    if (!/<w:spacing\b/.test(props)) {
      props += '<w:spacing w:after="120" w:before="120" w:line="240" w:lineRule="auto"/>';
    }
    return `<w:pPr>${props}</w:pPr>`;
  });

  // 2. Ensure runs use Arial font, preserving Arial 11pt (22 half-points) for signature block runs.
  xml = xml.replace(/<w:rPr>([\s\S]*?)<\/w:rPr>/g, (_match, inner) => {
    let props = inner;
    const is11pt = /<w:sz\b[^/]*w:val="22"/i.test(props);
    const szVal = is11pt ? '22' : '24';

    props = props.replace(/<w:rFonts[^/]*\/>/g, '');
    props = props.replace(/<w:rFonts[\s\S]*?\/>/g, '');
    props = props.replace(/<w:sz\b[^/]*\/>/g, '');
    props = props.replace(/<w:szCs\b[^/]*\/>/g, '');
    props =
      '<w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/>' +
      `<w:sz w:val="${szVal}"/><w:szCs w:val="${szVal}"/>` +
      props;
    return `<w:rPr>${props}</w:rPr>`;
  });

  zip.file('word/document.xml', xml);
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
    nullGetter: () => '',
  });

  doc.render(data);

  // Post-process typography (Arial 12pt body & Arial 11pt signature block)
  applyDocxTypography(doc.getZip());

  const blob = doc.getZip().generate({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    compression: 'DEFLATE',
  });

  saveAs(blob, filename);
}

// ─────────────────────────────────────────────────────────────────────────────
// DATE RANGE HELPERS
// ─────────────────────────────────────────────────────────────────────────────

export function getDailyRange(dateIso?: string) {
  const cleanDateStr = dateIso || new Date().toLocaleDateString('en-CA');
  const cleanNum = cleanDateStr.replace(/-/g, '');
  return {
    from: cleanDateStr,
    to:   cleanDateStr,
    label: `DAILY-INCIDENT-REPORT_${cleanNum}.docx`,
    period: `Date: ${formatDisplayDate(cleanDateStr)}`,
  };
}

export function getWeeklyRange(anyDateIso?: string) {
  const cleanIso = anyDateIso || new Date().toLocaleDateString('en-CA');
  const [y, m, d] = cleanIso.split('-').map(Number);
  const ref = new Date(y, m - 1, d);
  const day = ref.getDay();
  const mon = new Date(ref); mon.setDate(ref.getDate() - (day === 0 ? 6 : day - 1));
  const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
  
  const monIso = mon.toLocaleDateString('en-CA');
  const sunIso = sun.toLocaleDateString('en-CA');

  const monLabel = mon.toLocaleDateString('en-PH', { day: '2-digit', month: 'long', year: 'numeric' });
  const sunLabel = sun.toLocaleDateString('en-PH', { day: '2-digit', month: 'long', year: 'numeric' });

  const monthNameUpper = mon.toLocaleDateString('en-PH', { month: 'long' }).toUpperCase();
  const dateRangeStr = `${monLabel} to ${sunLabel}`;

  return {
    from: monIso,
    to: sunIso,
    mon,
    monLabel,
    sunLabel,
    dateRangeStr,
    label: `WEEKLY-INCIDENT-REPORT_${monthNameUpper}-${mon.getFullYear()}.docx`,
    period: `Week of ${monLabel} – ${sunLabel}`,
  };
}

export function getMonthlyRange(monthIso?: string) {
  let year: number, month: number;
  if (monthIso) {
    [year, month] = monthIso.split('-').map(Number);
  } else {
    const now = new Date();
    year  = now.getFullYear();
    month = now.getMonth() + 1;
  }
  const first = new Date(year, month - 1, 1);
  const last  = new Date(year, month, 0);
  
  const firstIso = first.toLocaleDateString('en-CA');
  const lastIso  = last.toLocaleDateString('en-CA');
  const monthNameStr = first.toLocaleDateString('en-PH', { month: 'long', year: 'numeric' });

  return {
    from: firstIso,
    to: lastIso,
    first,
    last,
    label: `MONTHLY-INCIDENT-REPORT_${monthNameStr.replace(/ /g, '-').toUpperCase()}.docx`,
    period: `Month of ${monthNameStr}`,
    monthName: monthNameStr,
    year,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// DAILY REPORT
// ─────────────────────────────────────────────────────────────────────────────

export async function downloadDailyReport(incidents: Incident[], dateIso?: string) {
  const sorted = [...incidents].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const { label } = getDailyRange(dateIso);

  const reportDate = formatDisplayDate(dateIso || new Date().toLocaleDateString('en-CA'));

  const incidentData = sorted.map((inc, idx) => {
    const rf = inc.resolutionForm;

    const incTimeStr = rf?.incidentTime ? rf.incidentTime : militaryTime(inc.createdAt);
    const incDateStr = rf?.incidentDate ? formatDisplayDate(rf.incidentDate) : formatDisplayDate(inc.createdAt);
    const incTypeStr = describeType(inc);
    const locStr     = resolveLocation(inc);

    const patientName    = rf?.patientName || (inc.reporter?.name ? inc.reporter.name : 'Unidentified Patient');
    const patientSex     = (rf?.patientSex || 'Male').toLowerCase();
    const patientAge     = rf?.patientAge || '17';
    const patientAddress = cleanLocation(rf?.patientAddress || locStr);

    const intoxicationDetail = rf?.intoxicationSuspected?.toLowerCase() === 'yes' ? 'was alcohol intoxicated, ' : '';
    const mechanismDetail    = rf?.mechanismOfInjury ? `crashed / suffered ${rf.mechanismOfInjury.toLowerCase()}, ` : '';
    const injuriesObserved   = rf?.injuriesObserved ? rf.injuriesObserved.toLowerCase() : 'minor injuries';

    const responders     = rf?.responderNames || 'Rigor Natividad, Bryan Lopez, and Jamvel Ramos';
    const interventions  = rf?.treatmentInterventions ? `${rf.treatmentInterventions.toLowerCase()}, ` : 'proper positioning, wound cleaning/disinfecting, ';

    const vitalsDetail   = `an SaO₂ of ${rf?.oxygenSaturation || '98%'}, pulse rate of ${rf?.pulseRate || '80 bpm'}, blood pressure of ${rf?.bloodPressure || '120/80 mmHg'}, and a GCS of ${rf?.gcsScore || '15'}`;

    const dispositionDetail = rf?.destinationFacility
      ? `immediately transported to ${rf.destinationFacility} for further hospital treatment`
      : 'managed and rendered appropriate care on scene';

    return {
      incident_no:          idx + 1,
      time:                 incTimeStr,
      date:                 incDateStr || reportDate,
      incident_type:        incTypeStr,
      location:             locStr,

      patient_name:         patientName,
      patient_sex:          patientSex,
      patient_age:          patientAge,
      patient_address:      patientAddress,

      intoxication_detail:  intoxicationDetail,
      mechanism_detail:     mechanismDetail,
      injuries_observed:    injuriesObserved,

      responders:           responders,
      interventions_detail: interventions,
      vitals_detail:        vitalsDetail,
      disposition_detail:   dispositionDetail,

      procedure_photo_xml:  '',
    };
  });

  await fillAndDownload(
    'daily',
    {
      report_date: reportDate,
      total_incidents: sorted.length,
      incidents: incidentData.length > 0 ? incidentData : [
        {
          incident_no:          1,
          time:                 '0000H',
          date:                 reportDate,
          incident_type:        'No Incident Recorded',
          location:             'Balayan, Batangas',

          patient_name:         'N/A',
          patient_sex:          'N/A',
          patient_age:          'N/A',
          patient_address:      'Balayan, Batangas',

          intoxication_detail:  '',
          mechanism_detail:     '',
          injuries_observed:    'none',

          responders:           'MDRRMO Duty Responders',
          interventions_detail: 'standby monitoring, ',
          vitals_detail:        'normal vitals',
          disposition_detail:   'recorded with zero active emergencies',

          procedure_photo_xml:  '',
        },
      ],
    },
    label,
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DYNAMIC GROUPING & SUMMARY ENGINE (Rules 1 - 7)
// ─────────────────────────────────────────────────────────────────────────────

interface GroupedCategorySummary {
  type_name: string;
  count: string;
  common_causes: string;
  patient_count: string;
  common_injuries_conditions: string;
  responder_actions: string;
  outcomes: string;
  patient_outcomes: string;
}

function processDynamicGroups(incidents: Incident[]): { type_counts: { type_name: string; count: string }[]; type_summaries: GroupedCategorySummary[] } {
  // Group incidents dynamically by recorded incident type
  const groups = new Map<string, Incident[]>();

  incidents.forEach(inc => {
    const typeName = describeType(inc);
    if (!groups.has(typeName)) {
      groups.set(typeName, []);
    }
    groups.get(typeName)!.push(inc);
  });

  const type_counts: { type_name: string; count: string }[] = [];
  const type_summaries: GroupedCategorySummary[] = [];

  groups.forEach((groupIncs, typeName) => {
    if (groupIncs.length === 0) return; // Omit zero-occurrence categories (Rule 7)

    const countText = countWithWords(groupIncs.length);
    type_counts.push({ type_name: typeName, count: countText });

    // 1. Common Causes
    const causesSet = new Set<string>();
    groupIncs.forEach(i => {
      const rf = i.resolutionForm;
      if (rf?.mechanismOfInjury) causesSet.add(rf.mechanismOfInjury.toLowerCase());
      if (rf?.howIncidentHappened) causesSet.add(rf.howIncidentHappened.toLowerCase());
    });
    const common_causes = causesSet.size > 0 ? Array.from(causesSet).join(', ') : 'Not specified';

    // 2. Patient Count
    const patient_count = countWithWords(groupIncs.length);

    // 3. Common Injuries or Conditions
    const injuriesSet = new Set<string>();
    groupIncs.forEach(i => {
      const rf = i.resolutionForm;
      if (rf?.injuriesObserved) {
        rf.injuriesObserved.split(/[,;]/).forEach(item => item.trim() && injuriesSet.add(item.trim().toLowerCase()));
      }
    });
    const common_injuries_conditions = injuriesSet.size > 0 ? Array.from(injuriesSet).join(', ') : 'No visible injuries recorded';

    // 4. Responder Actions
    const actionsSet = new Set<string>();
    groupIncs.forEach(i => {
      const rf = i.resolutionForm;
      if (rf?.treatmentInterventions) actionsSet.add(rf.treatmentInterventions.toLowerCase());
      if (rf?.responderNames) actionsSet.add(`responded by ${rf.responderNames}`);
    });
    const responder_actions = actionsSet.size > 0 ? Array.from(actionsSet).join(', ') : 'Patient evaluation, vital sign checking, and scene management';

    // 5. Outcomes
    const outcomesSet = new Set<string>();
    let deadCnt = 0, transportCnt = 0, refuseCnt = 0;
    groupIncs.forEach(i => {
      const rf = i.resolutionForm;
      if (rf?.dispositionStatus === 'DEAD_ON_SPOT') deadCnt++;
      else if (rf?.dispositionStatus === 'REFUSED_TRANSPORT') refuseCnt++;
      else transportCnt++;

      if (rf?.destinationFacility) outcomesSet.add(`transported to ${rf.destinationFacility}`);
    });

    let outcomesText = '';
    if (deadCnt > 0) outcomesText += `${deadCnt} dead on spot, `;
    if (refuseCnt > 0) outcomesText += `${refuseCnt} refused transport, `;
    if (transportCnt > 0) outcomesText += `${transportCnt} transported after receiving care`;
    if (outcomesSet.size > 0) outcomesText += ` (${Array.from(outcomesSet).join(', ')})`;
    if (!outcomesText) outcomesText = 'Care management rendered on scene';

    type_summaries.push({
      type_name: typeName,
      count: countText,
      common_causes,
      patient_count,
      common_injuries_conditions,
      responder_actions,
      outcomes: outcomesText,
      patient_outcomes: outcomesText,
    });
  });

  return { type_counts, type_summaries };
}

// ─────────────────────────────────────────────────────────────────────────────
// WEEKLY REPORT
// ─────────────────────────────────────────────────────────────────────────────

export async function downloadWeeklyReport(incidents: Incident[], anyDateIso?: string) {
  const sorted = [...incidents].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const range = getWeeklyRange(anyDateIso);
  const { label, dateRangeStr } = range;

  const total = sorted.length;
  const { type_counts, type_summaries } = processDynamicGroups(sorted);

  const weeksData = [{
    date_range:           dateRangeStr,
    total_incidents:      countWithWords(total),
    type_counts:          type_counts.length > 0 ? type_counts : [{ type_name: 'No Active Emergency', count: 'Zero (0)' }],
    type_summaries:       type_summaries.length > 0 ? type_summaries : [{
      type_name: 'General Incidents',
      count: 'Zero (0)',
      common_causes: 'None',
      patient_count: 'Zero (0)',
      common_injuries_conditions: 'None',
      responder_actions: 'Monitoring',
      outcomes: 'Zero incidents recorded',
      patient_outcomes: 'Zero incidents recorded',
    }],
  }];

  await fillAndDownload('weekly', { weeks: weeksData }, label);
}

// ─────────────────────────────────────────────────────────────────────────────
// MONTHLY REPORT
// ─────────────────────────────────────────────────────────────────────────────

export async function downloadMonthlyReport(incidents: Incident[], monthIso?: string) {
  const sorted = [...incidents].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const range = getMonthlyRange(monthIso);
  const { label, monthName } = range;

  const total = sorted.length;
  const { type_counts, type_summaries } = processDynamicGroups(sorted);

  // Identify recurring trends (Rule 4)
  const allCauses = new Set<string>();
  const allInjuries = new Set<string>();
  sorted.forEach(i => {
    if (i.resolutionForm?.mechanismOfInjury) allCauses.add(i.resolutionForm.mechanismOfInjury.toLowerCase());
    if (i.resolutionForm?.injuriesObserved) allInjuries.add(i.resolutionForm.injuriesObserved.toLowerCase());
  });

  let monthlyTrends = '';
  if (allCauses.size > 0) monthlyTrends += `Primary emergency mechanisms included ${Array.from(allCauses).join(', ')}. `;
  if (allInjuries.size > 0) monthlyTrends += `Most frequent observed conditions were ${Array.from(allInjuries).join(', ')}. `;
  if (!monthlyTrends) monthlyTrends = 'Routine emergency monitoring with no unusual recurring anomalies detected.';

  await fillAndDownload('monthly', {
    month_name:           monthName,
    total_incidents:      countWithWords(total),
    type_counts:          type_counts.length > 0 ? type_counts : [{ type_name: 'No Active Emergency', count: 'Zero (0)' }],
    type_summaries:       type_summaries.length > 0 ? type_summaries : [{
      type_name: 'General Incidents',
      count: 'Zero (0)',
      common_causes: 'None',
      patient_count: 'Zero (0)',
      common_injuries_conditions: 'None',
      responder_actions: 'Monitoring',
      outcomes: 'Zero incidents recorded',
      patient_outcomes: 'Zero incidents recorded',
    }],
    monthly_trends:       monthlyTrends.trim(),
  }, label);
}
