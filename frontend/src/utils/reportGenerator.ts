/**
 * reportGenerator.ts
 *
 * Uses official MDRRMO Balayan template .docx files (stored in /public/templates/)
 * as base, filling live incident and questionnaire data via docxtemplater.
 * 
 * Includes comprehensive resolution questionnaire data across Daily, Weekly, and Monthly reports.
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

  return {
    from: monIso,
    to: sunIso,
    mon,
    monLabel,
    sunLabel,
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
// WEEKLY REPORT
// ─────────────────────────────────────────────────────────────────────────────

const WEEK_ORDINALS = ['First week','Second week','Third week','Fourth week','Fifth week'];

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

  // Aggregate rich trauma details from questionnaire entries
  const injuriesSet = new Set<string>();
  traumaIncs.forEach(i => {
    const rf = i.resolutionForm;
    if (rf?.injuriesObserved) {
      rf.injuriesObserved.split(/[,;]/).forEach(item => item.trim() && injuriesSet.add(item.trim().toLowerCase()));
    }
    if (rf?.mechanismOfInjury) {
      injuriesSet.add(`mechanism: ${rf.mechanismOfInjury.toLowerCase()}`);
    }
  });
  const injuryList = injuriesSet.size > 0 ? Array.from(injuriesSet).join(', ') : 'none recorded';

  // Aggregate rich medical complaints & vitals from questionnaire entries
  const complaintsSet = new Set<string>();
  medicalIncs.forEach(i => {
    const rf = i.resolutionForm;
    if (rf?.howIncidentHappened) complaintsSet.add(rf.howIncidentHappened.toLowerCase());
    if (rf?.injuriesObserved) complaintsSet.add(rf.injuriesObserved.toLowerCase());
    if (rf?.bloodPressure || rf?.pulseRate || rf?.oxygenSaturation) {
      const vitalsSummary = `vitals: BP ${rf.bloodPressure || 'N/A'}, pulse ${rf.pulseRate || 'N/A'} bpm, SaO₂ ${rf.oxygenSaturation || 'N/A'}%`;
      complaintsSet.add(vitalsSummary);
    }
  });
  const complaintList = complaintsSet.size > 0 ? Array.from(complaintsSet).join(', ') : 'none recorded';

  const weeksData = [{
    week_ordinal:             weekOrdinal,
    start_date:               monLabel,
    end_date:                 sunLabel,
    total_incidents:          countWithWords(total),
    trauma_count:             countWithWords(traumaCount),
    medical_count:            countWithWords(medicalCount),
    medical_conduction_count: countWithWords(conductionCount),
    dead_count:               countWithWords(deadCount),
    cancelled_count:          countWithWords(cancelledCount),
    transported_count:        countWithWords(transportedCount),
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

  // Aggregate trauma causes & injuries from questionnaire entries
  const causesSet = new Set<string>();
  const injuriesSet = new Set<string>();
  traumaIncs.forEach(i => {
    const rf = i.resolutionForm;
    if (rf?.mechanismOfInjury) causesSet.add(rf.mechanismOfInjury.toLowerCase());
    if (rf?.howIncidentHappened) causesSet.add(rf.howIncidentHappened.toLowerCase());
    if (rf?.injuriesObserved) injuriesSet.add(rf.injuriesObserved.toLowerCase());
  });

  const topTraumaCauses = causesSet.size > 0 ? Array.from(causesSet).join(', ') : 'reported trauma incidents';
  const commonInjuries  = injuriesSet.size > 0 ? Array.from(injuriesSet).join(', ') : 'recorded injuries';

  const deadCount        = sorted.filter(i => i.resolutionForm?.dispositionStatus === 'DEAD_ON_SPOT').length;
  const transportedCount = sorted.filter(i => i.status === 'RESOLVED' || i.resolutionForm?.dispositionStatus === 'TRANSPORTED').length;
  const refusedCount     = sorted.filter(i => i.resolutionForm?.dispositionStatus === 'REFUSED_TRANSPORT').length;

  // Aggregate medical complaints & vitals from questionnaire entries
  const medComplaintsSet = new Set<string>();
  medicalIncs.forEach(i => {
    const rf = i.resolutionForm;
    if (rf?.howIncidentHappened) medComplaintsSet.add(rf.howIncidentHappened.toLowerCase());
    if (rf?.injuriesObserved) medComplaintsSet.add(rf.injuriesObserved.toLowerCase());
    if (rf?.bloodPressure || rf?.pulseRate || rf?.oxygenSaturation) {
      medComplaintsSet.add(`vital signs: BP ${rf.bloodPressure || 'N/A'}, pulse ${rf.pulseRate || 'N/A'} bpm, SaO₂ ${rf.oxygenSaturation || 'N/A'}%`);
    }
  });

  const topMedicalComplaints = medicalCount === 0
    ? 'No Medical Emergencies reported for this month'
    : (medComplaintsSet.size > 0 ? Array.from(medComplaintsSet).join(', ') : 'various medical conditions');

  // Aggregate conduction purposes & destination facilities from questionnaire entries
  const conductionSet = new Set<string>();
  conductionIncs.forEach(i => {
    const rf = i.resolutionForm;
    if (rf?.destinationFacility) conductionSet.add(`transportation to ${rf.destinationFacility}`);
    if (rf?.howIncidentHappened) conductionSet.add(rf.howIncidentHappened.toLowerCase());
  });

  const medicalConductionPurposes = conductionCount === 0
    ? 'No Medical Conduction reported.'
    : (conductionSet.size > 0 ? Array.from(conductionSet).join(', ') : 'providing transportation assistance for hospital check-ups and transfers');

  await fillAndDownload('monthly', {
    month_name:                 monthName,
    total_incidents:            countWithWords(total),
    trauma_count:               countWithWords(traumaCount),
    medical_count:              countWithWords(medicalCount),
    medical_conduction_count:   countWithWords(conductionCount),
    top_trauma_causes:          topTraumaCauses,
    common_injuries:            commonInjuries,
    dead_count:                 countWithWords(deadCount),
    transported_count:          countWithWords(transportedCount),
    refused_count:              countWithWords(refusedCount),
    top_medical_complaints:     topMedicalComplaints,
    medical_conduction_purposes: medicalConductionPurposes,
    team_count:                 'four (4)',
  }, label);
}
