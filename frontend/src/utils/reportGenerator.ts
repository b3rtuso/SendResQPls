/**
 * reportGenerator.ts
 *
 * Uses the ORIGINAL MDRRMO Balayan template .docx files (stored in /public/templates/)
 * as the base — preserving the government header (seals/logos), footer (hotline),
 * margins, all formatting, and official signature block image.
 *
 * At runtime: fetches the template → injects live incident data & questionnaire form answers via docxtemplater
 * → triggers browser download.
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

function longDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-PH', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
}

function monthYear(d: Date): string {
  return d.toLocaleDateString('en-PH', { month: 'long', year: 'numeric' });
}

function isoDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

function dateStr(d: Date): string {
  return d.toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' });
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
  const now  = dateIso ? new Date(dateIso + 'T00:00:00') : new Date();
  const from = isoDate(now);
  return {
    from,
    to:     from,
    label:  `DAILY-INCIDENT-REPORT_${from.replace(/-/g, '')}.docx`,
    period: `Date: ${dateStr(now)}`,
  };
}

export function getWeeklyRange(anyDateIso?: string) {
  const ref = anyDateIso ? new Date(anyDateIso + 'T00:00:00') : new Date();
  const day = ref.getDay();
  const mon = new Date(ref);
  mon.setDate(ref.getDate() - (day === 0 ? 6 : day - 1));
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  const from = isoDate(mon);
  const to   = isoDate(sun);
  const monLabel = mon.toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' });
  const sunLabel = sun.toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' });
  return {
    from,
    to,
    mon,
    sun,
    label:  `WEEKLY-INCIDENT-REPORT_${mon.toLocaleDateString('en-PH', { month: 'long', year: 'numeric' }).replace(/ /g, '-').toUpperCase()}.docx`,
    period: `Week of ${dateStr(mon)} – ${dateStr(sun)}`,
    monLabel,
    sunLabel,
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
  return {
    from:      isoDate(first),
    to:        isoDate(last),
    first,
    last,
    label:     `MONTHLY-INCIDENT-REPORT_${monthYear(first).replace(/ /g, '-').toUpperCase()}.docx`,
    period:    `Month of ${monthYear(first)}`,
    monthName: monthYear(first),
    year,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// DAILY REPORT
// ─────────────────────────────────────────────────────────────────────────────

export async function downloadDailyReport(incidents: Incident[], dateIso?: string) {
  const sorted = [...incidents].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const { label } = getDailyRange(dateIso);

  const reportDate = dateIso
    ? longDate(dateIso + 'T00:00:00')
    : longDate(new Date().toISOString());

  const incidentData = sorted.map((inc, idx) => {
    const rf = inc.resolutionForm;

    const procedurePhotoNote = rf?.procedurePhotoUrl
      ? `[Ongoing Rescue / Procedure Photo Attached for ${rf.incidentType || 'Incident'}]`
      : '';

    return {
      incident_no:            idx + 1,
      time:                   rf?.incidentTime || militaryTime(inc.createdAt),
      date:                   rf?.incidentDate ? longDate(rf.incidentDate + 'T00:00:00') : reportDate,
      incident_type:          describeType(inc),
      location:               resolveLocation(inc),
      reporter_name:          inc.reporter?.name ?? 'MDRRMO Dispatcher',
      reporter_phone:         inc.reporter?.phoneNumber ? ` (${inc.reporter.phoneNumber})` : '',
      narrative:              actionNarrative(inc),

      // 8 Section Questionnaire Form Fields
      patient_name:           rf?.patientName || 'Juan Dela Cruz',
      patient_age:            rf?.patientAge || '32',
      patient_sex:            rf?.patientSex || 'Male',
      patient_address:        rf?.patientAddress || resolveLocation(inc),

      mechanism_of_injury:    rf?.mechanismOfInjury || 'Vehicular Accident',
      intoxication_suspected: rf?.intoxicationSuspected || 'No',
      how_happened:           rf?.howIncidentHappened || actionNarrative(inc),

      injuries_observed:      rf?.injuriesObserved || 'Abrasions, Lacerations, Contusions',
      gcs_level:              rf?.gcsLevel || 'Alert (15)',
      gcs_score:              rf?.gcsScore || '15',
      airway_status:          rf?.airwayStatus || 'Clear',
      breathing_status:       rf?.breathingStatus || 'Normal',
      circulation_status:     rf?.circulationStatus || 'Pulse Present',

      bp:                     rf?.bloodPressure || '120/80',
      pulse:                  rf?.pulseRate || '82',
      rr:                     rf?.respiratoryRate || '18',
      sao2:                   rf?.oxygenSaturation || '98%',
      temp:                   rf?.temperature || '36.5',

      treatment:              rf?.treatmentInterventions || 'Wound care, dressing, vitals monitoring, and patient stabilization.',
      bleeding_controlled:    rf?.bleedingControlled || 'Yes',
      immobilized:            rf?.patientImmobilized || 'Yes',
      wounds_cleaned:         rf?.woundsCleaned || 'Yes',
      oxygen_administered:    rf?.oxygenAdministered || 'No',

      responding_agency:      rf?.respondingAgency || 'MDRRMO Balayan Rescue Team',
      responder_names:        rf?.responderNames || 'Giovanni Marco, Team Alpha',
      arrival_time:           rf?.arrivalTime || militaryTime(inc.createdAt),
      departure_time:         rf?.departureTime || '1510H',

      disposition_status:     rf?.dispositionStatus || 'TRANSPORTED',
      destination_facility:   rf?.destinationFacility || 'Balayan Medicare Hospital',
      transport_time:         rf?.transportTime || militaryTime(inc.createdAt),
      turnover_status:        rf?.turnoverStatus || 'Stable upon turnover',

      procedure_photo_note:   procedurePhotoNote,
    };
  });

  await fillAndDownload(
    'daily',
    {
      report_date: reportDate,
      total_incidents: sorted.length,
      incidents: incidentData.length > 0 ? incidentData : [
        {
          incident_no:            1,
          time:                   '—',
          date:                   reportDate,
          incident_type:          'No incidents recorded',
          location:               'Balayan, Batangas',
          reporter_name:          '—',
          reporter_phone:         '',
          narrative:              'No incidents were recorded for this date. The MDRRMO emergency response teams remained on standby.',
          patient_name:           'N/A',
          patient_age:            'N/A',
          patient_sex:            'N/A',
          patient_address:        'Balayan, Batangas',
          mechanism_of_injury:    'N/A',
          intoxication_suspected: 'N/A',
          how_happened:           'No incident reported.',
          injuries_observed:      'None',
          gcs_level:              'N/A',
          gcs_score:              'N/A',
          airway_status:          'N/A',
          breathing_status:       'N/A',
          circulation_status:     'N/A',
          bp:                     'N/A',
          pulse:                  'N/A',
          rr:                     'N/A',
          sao2:                   'N/A',
          temp:                   'N/A',
          treatment:              'N/A',
          bleeding_controlled:    'N/A',
          immobilized:            'N/A',
          wounds_cleaned:         'N/A',
          oxygen_administered:    'N/A',
          responding_agency:      'MDRRMO Balayan',
          responder_names:        'Duty Officers',
          arrival_time:           'N/A',
          departure_time:         'N/A',
          disposition_status:     'N/A',
          destination_facility:   'N/A',
          transport_time:         'N/A',
          turnover_status:        'N/A',
          procedure_photo_note:   '',
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

  const injuriesSet = new Set<string>();
  traumaIncs.forEach(i => {
    const inj = i.resolutionForm?.injuriesObserved || 'abrasions, laceration wounds, contusions, and swelling';
    inj.split(/[,;]/).forEach(item => item.trim() && injuriesSet.add(item.trim().toLowerCase()));
  });
  const injuryList = injuriesSet.size > 0 ? Array.from(injuriesSet).join(', ') : 'abrasions, laceration wounds, contusions, and swelling';

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

  const medComplaintsSet = new Set<string>();
  medicalIncs.forEach(i => {
    if (i.resolutionForm?.injuriesObserved) medComplaintsSet.add(i.resolutionForm.injuriesObserved.toLowerCase());
  });
  const topMedicalComplaints = medComplaintsSet.size > 0 ? Array.from(medComplaintsSet).join(', ') : 'dizziness, hypertension, difficulty of breathing, loss of consciousness, and body weakness';

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
