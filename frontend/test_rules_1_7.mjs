import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { readFileSync, writeFileSync } from 'fs';

function testDynamicWeekly() {
  const buf = readFileSync('public/templates/weekly-template.docx');
  const zip = new PizZip(buf);
  const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });

  const data = {
    weeks: [{
      date_range: 'July 20, 2026 to July 26, 2026',
      total_incidents: 'Three (3)',
      type_counts: [
        { type_name: 'Trauma Emergency', count: 'Two (2)' },
        { type_name: 'Medical Emergency', count: 'One (1)' }
      ],
      type_summaries: [
        {
          type_name: 'Trauma Emergency',
          common_causes: 'vehicular accident, napunit ang puso',
          patient_count: 'Two (2)',
          common_injuries_conditions: 'abrasions, contusions',
          responder_actions: 'wound cleaning, dressing, vitals monitoring',
          outcomes: '2 transported after receiving care (transported to Balayan Medicare Hospital)'
        },
        {
          type_name: 'Medical Emergency',
          common_causes: 'relapse due to rejection',
          patient_count: 'One (1)',
          common_injuries_conditions: 'abrasions, contusions',
          responder_actions: 'wound cleaning, dressing, vitals monitoring',
          outcomes: '1 transported after receiving care (transported to Balayan Medicare Hospital)'
        }
      ]
    }]
  };

  doc.render(data);
  const outBuf = doc.getZip().generate({ type: 'nodebuffer', compression: 'DEFLATE' });
  writeFileSync('scratch/test_weekly_rules.docx', outBuf);
  console.log('=== WEEKLY REPORT OUTPUT ===');
  console.log(doc.getFullText());
}

function testDynamicMonthly() {
  const buf = readFileSync('public/templates/monthly-template.docx');
  const zip = new PizZip(buf);
  const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });

  const data = {
    month_name: 'July 2026',
    total_incidents: 'Three (3)',
    type_counts: [
      { type_name: 'Trauma Emergency', count: 'Two (2)' },
      { type_name: 'Medical Emergency', count: 'One (1)' }
    ],
    type_summaries: [
      {
        type_name: 'Trauma Emergency',
        common_causes: 'vehicular accident, napunit ang puso',
        common_injuries_conditions: 'abrasions, contusions',
        responder_actions: 'wound cleaning, dressing, vitals monitoring',
        patient_outcomes: '2 transported after receiving care (transported to Balayan Medicare Hospital)'
      },
      {
        type_name: 'Medical Emergency',
        common_causes: 'relapse due to rejection',
        common_injuries_conditions: 'abrasions, contusions',
        responder_actions: 'wound cleaning, dressing, vitals monitoring',
        patient_outcomes: '1 transported after receiving care (transported to Balayan Medicare Hospital)'
      }
    ],
    monthly_trends: 'Primary emergency mechanisms included vehicular accident, napunit ang puso, relapse due to rejection. Most frequent observed conditions were abrasions, contusions.'
  };

  doc.render(data);
  const outBuf = doc.getZip().generate({ type: 'nodebuffer', compression: 'DEFLATE' });
  writeFileSync('scratch/test_monthly_rules.docx', outBuf);
  console.log('\n=== MONTHLY REPORT OUTPUT ===');
  console.log(doc.getFullText());
}

testDynamicWeekly();
testDynamicMonthly();
