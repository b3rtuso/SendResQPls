import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { readFileSync } from 'fs';

function testWeekly() {
  const buf = readFileSync('public/templates/weekly-template.docx');
  const zip = new PizZip(buf);
  const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
  doc.render({
    weeks: [{
      week_ordinal: 'First',
      date_range: 'MARCH 01-07, 2026',
      total_incidents_text: 'Seventeen (17)',
      total_count_word: 'seventeen',
      trauma_count_text: 'Eleven (11)',
      medical_count_text: 'Five (5)',
      conduction_count_text: 'One (1)',
      trauma_breakdown: 'wherein Three (3) of whom were reported dead on the spot',
      medical_breakdown: 'wherein recorded chief complaints included dizziness and hypertension',
      conduction_breakdown: 'wherein elderly patients were given transportation assistance',
    }]
  });
  console.log('✅ Weekly Report Test Text Output:');
  console.log(doc.getFullText().substring(0, 300));
}

function testMonthly() {
  const buf = readFileSync('public/templates/monthly-template.docx');
  const zip = new PizZip(buf);
  const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
  doc.render({
    month_name_upper: 'MARCH',
    year: 2026,
    total_incidents_text: 'Forty-Two (42)',
    trauma_count_text: 'Twenty-Five (25)',
    medical_count_text: 'Thirteen (13)',
    conduction_count_text: 'Four (4)',
    top_trauma_causes: 'vehicular accidents and falls',
    common_injuries: 'abrasions, lacerations, contusions, and swelling',
    trauma_disposition_narrative: 'Three patients were reported dead on the spot during separate incidents, while the remaining patients were transported.',
    top_medical_complaints: 'dizziness, hypertension, and asthma attacks',
    medical_conduction_purposes: 'providing transportation assistance to elderly patients for hospital check-ups and transfers',
  });
  console.log('\n✅ Monthly Report Test Text Output:');
  console.log(doc.getFullText().substring(0, 300));
}

testWeekly();
testMonthly();
