import { readFileSync, writeFileSync } from 'fs';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';

const buf = readFileSync('public/templates/daily-template.docx');
const zip = new PizZip(buf);

const doc = new Docxtemplater(zip, {
  paragraphLoop: true,
  linebreaks: true,
  nullGetter: () => '',
});

doc.render({
  report_date: 'July 22, 2026',
  total_incidents: 1,
  incidents: [{
    incident_no: 1,
    time: '1430H',
    date: 'July 22, 2026',
    incident_type: 'Trauma Emergency',
    location: 'Brgy. 1, Balayan, Batangas',
    reporter_name: 'Juan Dela Cruz',
    reporter_phone: ' (09123456789)',
    narrative: 'MDRRMO emergency responders responded to vehicular collision.',
    patient_name: 'Pedro Penduko',
    patient_age: '28',
    patient_sex: 'Male',
    patient_address: 'Brgy. 1, Balayan, Batangas',
    mechanism_of_injury: 'Motorcycle Collision',
    intoxication_suspected: 'No',
    how_happened: 'Motorcycle lost control on slippery road.',
    injuries_observed: 'Abrasions on left arm, laceration on forehead',
    gcs_level: 'Alert (15)',
    gcs_score: '15',
    airway_status: 'Clear',
    breathing_status: 'Normal',
    circulation_status: 'Pulse Present',
    bp: '120/80',
    pulse: '80',
    rr: '18',
    sao2: '98%',
    temp: '36.5',
    treatment: 'Wound cleaning, dressing, vitals monitoring',
    bleeding_controlled: 'Yes',
    immobilized: 'Yes',
    wounds_cleaned: 'Yes',
    oxygen_administered: 'No',
    responding_agency: 'MDRRMO Rescue Team',
    responder_names: 'Giovanni Marco',
    arrival_time: '1435H',
    departure_time: '1500H',
    disposition_status: 'TRANSPORTED',
    destination_facility: 'Balayan Medicare Hospital',
    transport_time: '1445H',
    turnover_status: 'Stable upon turnover',
    procedure_photo_note: '',
  }]
});

const generatedBuf = doc.getZip().generate({ type: 'nodebuffer' });
writeFileSync('scratch/test_final_daily.docx', generatedBuf);
console.log('✅ Generated scratch/test_final_daily.docx successfully! Size:', (generatedBuf.length / 1024).toFixed(1), 'KB');
