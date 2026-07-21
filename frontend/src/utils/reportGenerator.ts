/**
 * reportGenerator.ts
 *
 * Uses the ORIGINAL MDRRMO Balayan template .docx files (stored in /public/templates/)
 * as the base — preserving the government header (seals/logos), footer (hotline),
 * margins, and all formatting exactly.
 *
 * At runtime: fetches the template → injects live incident data via docxtemplater
 * → applies Arial 12pt typography → triggers browser download.
 */

import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import { saveAs } from 'file-saver';
import type { Incident } from '../types';
import { getNearestBarangay } from '../data/balayan-data';

// ─── number → English words (for narrative) ──────────────────────────────────

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

// ─── date / time helpers ──────────────────────────────────────────────────────

function pad2(n: number) { return String(n).padStart(2, '0'); }

function militaryTime(iso: string): string {
  const d = new Date(iso);
  return `${pad2(d.getHours())}${pad2(d.getMinutes())}H`;
}

function formatDisplayDate(dateStrRaw: string): string {
  if (!dateStrRaw) return '';
  // If YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStrRaw)) {
    const [y, m, d] = dateStrRaw.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    return dt.toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' });
  }
  const dt = new Date(dateStrRaw);
  if (!isNaN(dt.getTime())) {
    return dt.toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' });
  }
  return dateStrRaw;
}

// ─── location extraction ──────────────────────────────────────────────────────

function resolveLocation(inc: Incident): string {
  if (inc.resolutionForm?.incidentLocation) return inc.resolutionForm.incidentLocation;
  if (inc.adminNotes) {
    const brgyMatch = inc.adminNotes.match(/Brgy\.?\s+([A-Za-z\s]+)/i);
    if (brgyMatch) return `Brgy. ${brgyMatch[1].trim()}, Balayan, Batangas`;
  }
  if (inc.latitude && inc.longitude) {
    return `${getNearestBarangay(inc.latitude, inc.longitude)}, Balayan, Batangas`;
  }
  return 'Balayan, Batangas';
}

// ─── incident type classifier ─────────────────────────────────────────────────

function classifyType(inc: Incident): { trauma: boolean; medical: boolean; conduction: boolean; fire: boolean; crime: boolean } {
  const t = (inc.resolutionForm?.incidentType ?? inc.aiDetectedType ?? '').toLowerCase();
  return {
    trauma:      t.includes('trauma') || t.includes('accident') || t.includes('vehicular') || t.includes('fall'),
    medical:     t.includes('medical') && !t.includes('conduction'),
    conduction:  t.includes('conduction') || t.includes('transfer'),
    fire:        t.includes('fire'),
    crime:       t.includes('crime') || t.includes('assault'),
  };
}

// ─── action narrative based on incident & resolution form ─────────────────────

function actionNarrative(inc: Incident): string {
  const rf = inc.resolutionForm;
  if (rf?.howIncidentHappened) {
    let text = rf.howIncidentHappened.trim();
    if (rf.treatmentInterventions) text += `. Care provided: ${rf.treatmentInterventions.trim()}`;
    if (rf.destinationFacility) text += `. Patient transported to ${rf.destinationFacility.trim()}`;
    return text + '.';
  }

  const dept = inc.assignedDepartment ?? inc.aiRecommendedDept ?? 'MDRRMO';
  switch (inc.status) {
    case 'RESOLVED':
      return `${dept} emergency responders responded to the scene, rendered necessary pre-hospital care, and transported the patient to the medical facility for further evaluation.`;
    case 'REJECTED':
      return 'The response was considered stood down / cancelled. No patient was catered to.';
    case 'DISPATCHED':
      return `${dept} emergency responders were dispatched and provided immediate care on scene.`;
    case 'REVIEWING':
      return 'The incident was logged and reviewed by MDRRMO personnel for appropriate response.';
    default:
      return 'The incident was logged and catered to by MDRRMO emergency teams.';
  }
}

function describeType(inc: Incident): string {
  if (inc.resolutionForm?.incidentType) return inc.resolutionForm.incidentType;
  const raw = inc.aiDetectedType ?? '';
  if (!raw || raw.trim() === '') return 'Emergency Incident';
  return raw.replace(/\b\w/g, c => c.toUpperCase());
}

// ─── fetch template from public/templates/ ────────────────────────────────────

async function loadTemplate(name: 'daily' | 'weekly' | 'monthly'): Promise<ArrayBuffer> {
  const res = await fetch(`/templates/${name}-template.docx`);
  if (!res.ok) throw new Error(`Failed to load template: ${name}-template.docx`);
  return res.arrayBuffer();
}

// ─── Typography post-processor (Arial 12pt) ──────────────────────────────────

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

  // 2. Ensure every <w:rPr> uses Arial font, 12pt (24 half-points).
  xml = xml.replace(/<w:rPr>([\s\S]*?)<\/w:rPr>/g, (_match, inner) => {
    let props = inner;
    props = props.replace(/<w:rFonts[^/]*\/>/g, '');
    props = props.replace(/<w:rFonts[\s\S]*?\/>/g, '');
    props = props.replace(/<w:sz\b[^/]*\/>/g, '');
    props = props.replace(/<w:szCs\b[^/]*\/>/g, '');
    props =
      '<w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/>' +
      '<w:sz w:val="24"/><w:szCs w:val="24"/>' +
      props;
    return `<w:rPr>${props}</w:rPr>`;
  });

  // 3. Runs with no <w:rPr> get Arial 12pt.
  xml = xml.replace(/<w:r>(\s*<w:t)/g,
    '<w:r><w:rPr>' +
    '<w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/>' +
    '<w:sz w:val="24"/><w:szCs w:val="24"/>' +
    '</w:rPr>$1'
  );

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

  // Post-process: enforce Arial 12pt typography
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

  const monLabel = mon.toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' });
  const sunLabel = sun.toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' });

  return {
    from: monIso,
    to: sunIso,
    mon,
    monLabel,
    sunLabel,
    label: `WEEKLY-INCIDENT-REPORT_${mon.toLocaleDateString('en-PH', { month: 'long', year: 'numeric' }).replace(/ /g, '-').toUpperCase()}.docx`,
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
    // Prefer resolutionForm.incidentDate and incidentTime filled by admin
    const incDateStr = inc.resolutionForm?.incidentDate
      ? formatDisplayDate(inc.resolutionForm.incidentDate)
      : formatDisplayDate(inc.createdAt);

    const incTimeStr = inc.resolutionForm?.incidentTime
      ? inc.resolutionForm.incidentTime
      : militaryTime(inc.createdAt);

    return {
      incident_no:          idx + 1,
      time:                 incTimeStr,
      date:                 incDateStr || reportDate,
      incident_type:        describeType(inc),
      location:             resolveLocation(inc),
      reporter_name:        inc.reporter?.name ?? 'MDRRMO Dispatcher',
      reporter_phone:       inc.reporter?.phoneNumber ? ` (${inc.reporter.phoneNumber})` : '',
      narrative:            actionNarrative(inc),
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
          time:                 '—',
          date:                 reportDate,
          incident_type:        'No incidents recorded',
          location:             'Balayan, Batangas',
          reporter_name:        '—',
          reporter_phone:       '',
          narrative:            'No incidents were recorded for this date. The MDRRMO emergency response teams remained on standby.',
          procedure_photo_xml:  '',
        },
      ],
    },
    label,
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// WEEKLY REPORT
// ─────────────────────────────────────────────────────────────────────────────

const WEEK_ORDINALS = ['First','Second','Third','Fourth','Fifth'];

function weekOrdinalInMonth(monDate: Date): string {
  const firstDayOfMonth = new Date(monDate.getFullYear(), monDate.getMonth(), 1);
  const firstMonday = new Date(firstDayOfMonth);
  const firstDay = firstDayOfMonth.getDay();
  firstMonday.setDate(firstDayOfMonth.getDate() + (firstDay === 0 ? 1 : firstDay === 1 ? 0 : 8 - firstDay));
  const weekNum = Math.round((monDate.getTime() - firstMonday.getTime()) / (7 * 86400000));
  return WEEK_ORDINALS[Math.max(0, weekNum)] ?? `Week ${weekNum + 1}`;
}

export async function downloadWeeklyReport(incidents: Incident[], anyDateIso?: string) {
  const sorted = [...incidents].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const range = getWeeklyRange(anyDateIso);
  const { label, mon, monLabel, sunLabel } = range;

  const weekOrdinal = weekOrdinalInMonth(mon);

  const total               = sorted.length;
  const traumaIncs          = sorted.filter(i => classifyType(i).trauma);
  const medicalIncs         = sorted.filter(i => classifyType(i).medical);
  const conductionIncs      = sorted.filter(i => classifyType(i).conduction);

  const traumaCount         = traumaIncs.length;
  const medicalCount        = medicalIncs.length;
  const conductionCount     = conductionIncs.length;

  const deadCount           = sorted.filter(i => i.resolutionForm?.dispositionStatus === 'DEAD_ON_SPOT').length;
  const cancelledCount      = sorted.filter(i => i.status === 'REJECTED' || i.resolutionForm?.dispositionStatus === 'CANCELLED').length;
  const transportedCount    = sorted.filter(i => i.status === 'RESOLVED' || i.resolutionForm?.dispositionStatus === 'TRANSPORTED').length;

  // Compile injury list
  const injuriesSet = new Set<string>();
  traumaIncs.forEach(i => {
    const inj = i.resolutionForm?.injuriesObserved || 'abrasions, laceration wounds, contusions, and swelling';
    inj.split(/[,;]/).forEach(item => item.trim() && injuriesSet.add(item.trim().toLowerCase()));
  });
  const injuryList = injuriesSet.size > 0 ? Array.from(injuriesSet).join(', ') : 'abrasions, laceration wounds, contusions, and swelling';

  // Compile complaint list
  const complaintsSet = new Set<string>();
  medicalIncs.forEach(i => {
    const comp = i.resolutionForm?.injuriesObserved || 'dizziness, hypertension, difficulty of breathing, and body weakness';
    comp.split(/[,;]/).forEach(item => item.trim() && complaintsSet.add(item.trim().toLowerCase()));
  });
  const complaintList = complaintsSet.size > 0 ? Array.from(complaintsSet).join(', ') : 'dizziness, hypertension, difficulty of breathing, and body weakness';

  const weeksData = [{
    week_ordinal:             weekOrdinal,
    start_date:               monLabel,
    end_date:                 sunLabel,
    total_incidents:          `${total} (${toWords(total)})`,
    trauma_count:             `${traumaCount} (${toWords(traumaCount)})`,
    medical_count:            `${medicalCount} (${toWords(medicalCount)})`,
    medical_conduction_count: `${conductionCount} (${toWords(conductionCount)})`,
    dead_count:               `${deadCount} (${toWords(deadCount)})`,
    cancelled_count:          `${cancelledCount} (${toWords(cancelledCount)})`,
    transported_count:        `${transportedCount} (${toWords(transportedCount)})`,
    injury_list:              injuryList,
    complaint_list:           complaintList,
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

  const total               = sorted.length;
  const traumaIncs          = sorted.filter(i => classifyType(i).trauma);
  const medicalIncs         = sorted.filter(i => classifyType(i).medical);
  const conductionIncs      = sorted.filter(i => classifyType(i).conduction);

  const traumaCount         = traumaIncs.length;
  const medicalCount        = medicalIncs.length;
  const conductionCount     = conductionIncs.length;

  // Trauma causes & injuries
  const causesSet = new Set<string>();
  const injuriesSet = new Set<string>();
  traumaIncs.forEach(i => {
    if (i.resolutionForm?.mechanismOfInjury) causesSet.add(i.resolutionForm.mechanismOfInjury.toLowerCase());
    if (i.resolutionForm?.injuriesObserved) injuriesSet.add(i.resolutionForm.injuriesObserved.toLowerCase());
  });

  const topTraumaCauses = causesSet.size > 0 ? Array.from(causesSet).join(', ') : 'vehicular accidents and falls';
  const commonInjuries  = injuriesSet.size > 0 ? Array.from(injuriesSet).join(', ') : 'abrasions, lacerations, contusions, swelling, and possible fractures';

  const deadCount        = sorted.filter(i => i.resolutionForm?.dispositionStatus === 'DEAD_ON_SPOT').length;
  const transportedCount = sorted.filter(i => i.status === 'RESOLVED' || i.resolutionForm?.dispositionStatus === 'TRANSPORTED').length;
  const refusedCount     = sorted.filter(i => i.resolutionForm?.dispositionStatus === 'REFUSED_TRANSPORT').length;

  // Medical complaints
  const medComplaintsSet = new Set<string>();
  medicalIncs.forEach(i => {
    if (i.resolutionForm?.injuriesObserved) medComplaintsSet.add(i.resolutionForm.injuriesObserved.toLowerCase());
  });
  const topMedicalComplaints = medComplaintsSet.size > 0 ? Array.from(medComplaintsSet).join(', ') : 'dizziness, hypertension, difficulty of breathing, loss of consciousness, and body weakness';

  // Conduction purposes
  const conductionSet = new Set<string>();
  conductionIncs.forEach(i => {
    if (i.resolutionForm?.howIncidentHappened) conductionSet.add(i.resolutionForm.howIncidentHappened.toLowerCase());
  });
  const medicalConductionPurposes = conductionSet.size > 0 ? Array.from(conductionSet).join(', ') : 'scheduled medical check-ups, hospital transfers, and post-treatment patient conduction';

  await fillAndDownload('monthly', {
    month_name:                 monthName,
    total_incidents:            `${total} (${toWords(total)})`,
    trauma_count:               `${traumaCount} (${toWords(traumaCount)})`,
    medical_count:              `${medicalCount} (${toWords(medicalCount)})`,
    medical_conduction_count:   `${conductionCount} (${toWords(conductionCount)})`,
    top_trauma_causes:          topTraumaCauses,
    common_injuries:            commonInjuries,
    dead_count:                 `${deadCount} (${toWords(deadCount)})`,
    transported_count:          `${transportedCount} (${toWords(transportedCount)})`,
    refused_count:              `${refusedCount} (${toWords(refusedCount)})`,
    top_medical_complaints:     topMedicalComplaints,
    medical_conduction_purposes: medicalConductionPurposes,
    team_count:                 'four (4)',
  }, label);
}
