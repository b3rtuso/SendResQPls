import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { readFileSync, writeFileSync } from 'fs';

try {
  const buf = readFileSync('public/templates/daily-template.docx');
  const zip = new PizZip(buf);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    nullGetter: () => '',
  });

  const testData = {
    report_date: 'March 01, 2026',
    total_incidents: 1,
    incidents: [
      {
        incident_no: 1,
        time: '1313H',
        date: '01 March 2026',
        incident_type: 'Vehicular Accident',
        location: 'Brgy. Sambat, Balayan, Batangas',
        patient_name: 'John Rick Dela Cuesta',
        patient_sex: 'male',
        patient_age: '17',
        patient_address: 'Brgy. Putol, Balayan, Batangas',
        intoxication_detail: 'was alcohol intoxicated, ',
        mechanism_detail: 'crashed into a concrete post, ',
        injuries_observed: 'an open fracture on the right arm, a lacerated wound on the left eyebrow, an avulsed wound on the forehead, a fractured mandible, and abrasions on the chin and left cheek',
        responders: 'Rigor Natividad, Bryan Lopez, and Jamvel Ramos',
        interventions_detail: 'proper positioning, wound cleaning/disinfecting, ',
        vitals_detail: 'an SaO₂ of 63%, pulse rate of 144 bpm, no blood pressure recorded, and a GCS of 3',
        disposition_detail: 'immediately transported to Metro Balayan Medical Center for further hospital treatment',
        procedure_photo_xml: '',
      }
    ]
  };

  doc.render(testData);

  const outBuf = doc.getZip().generate({
    type: 'nodebuffer',
    compression: 'DEFLATE',
  });

  writeFileSync('scratch/test_verify_reference_daily.docx', outBuf);
  console.log('✅ Daily report test rendering SUCCEEDED! File size:', outBuf.length, 'bytes');
} catch (err) {
  console.error('❌ Template rendering error:', err);
}
