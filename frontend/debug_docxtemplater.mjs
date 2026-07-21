import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { readFileSync } from 'fs';

const buf = readFileSync('public/templates/daily-template.docx');
const zip = new PizZip(buf);

const doc = new Docxtemplater(zip, {
  paragraphLoop: true,
  linebreaks: true,
});

const data = {
  report_date: '22 July 2026',
  total_incidents: 1,
  incidents: [
    {
      time: '06:10',
      date: '22 July 2026',
      incident_type: 'Emergency',
      location: 'Caybunga, Balayan, Batangas',
      patient_name: 'Ninyo Bancoro',
      patient_sex: 'male',
      patient_age: '20',
      patient_address: 'Caybunga, Balayan, Batangas',
      intoxication_detail: 'was alcohol intoxicated, ',
      mechanism_detail: 'napunit ang puso, ',
      injuries_observed: 'abrasions, contusions',
      responders: 'Giovanni Marco',
      interventions_detail: 'wound cleaning, ',
      vitals_detail: 'an SaO2 of 98%',
      disposition_detail: 'transported to hospital',
      procedure_photo_xml: '',
    }
  ]
};

try {
  doc.render(data);
  console.log('Success! Rendered text sample:');
  const text = doc.getFullText();
  console.log(text);
} catch (err) {
  console.error('Docxtemplater error:', JSON.stringify(err, null, 2));
}
