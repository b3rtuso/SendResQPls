import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { readFileSync } from 'fs';

function testWeekly() {
  const buf = readFileSync('public/templates/weekly-template.docx');
  const zip = new PizZip(buf);
  const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
  doc.render({
    weeks: [{
      week_ordinal: 'First week',
      start_date: 'March 01, 2026',
      end_date: 'March 07, 2026',
      total_incidents: 'Three (3)',
      trauma_count: 'Two (2)',
      medical_count: 'One (1)',
      medical_conduction_count: 'Zero (0)',
      dead_count: 'Zero (0)',
      cancelled_count: 'Zero (0)',
      transported_count: 'Three (3)',
      injury_list: 'abrasions, contusions',
      complaint_list: 'heartbreak, relapse',
    }]
  });
  console.log('=== WEEKLY REPORT OUTPUT ===');
  console.log(doc.getFullText());
}

function testMonthly() {
  const buf = readFileSync('public/templates/monthly-template.docx');
  const zip = new PizZip(buf);
  const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
  doc.render({
    month_name: 'March 2026',
    total_incidents: 'Three (3)',
    trauma_count: 'Two (2)',
    medical_count: 'One (1)',
    medical_conduction_count: 'Zero (0)',
    top_trauma_causes: 'vehicular accident, napunit ang puso',
    common_injuries: 'abrasions, contusions',
    dead_count: 'Zero (0)',
    transported_count: 'Three (3)',
    refused_count: 'Zero (0)',
    top_medical_complaints: 'relapse due to rejection',
    medical_conduction_purposes: 'No Medical Conduction reported.',
    team_count: 'four (4)',
  });
  console.log('\n=== MONTHLY REPORT OUTPUT ===');
  console.log(doc.getFullText());
}

testWeekly();
testMonthly();
