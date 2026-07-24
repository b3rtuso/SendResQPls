import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { readFileSync, writeFileSync } from 'fs';

function testMonthlySentences() {
  const buf = readFileSync('public/templates/monthly-template.docx');
  const zip = new PizZip(buf);
  const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });

  const data = {
    month_name: 'March 2026',
    total_incidents: 'Forty-Two (42)',
    included_types_sentence: 'Twenty-Five (25) Trauma Emergencies, Thirteen (13) Medical Emergencies, and Four (4) Medical Conductions',
    monthly_narrative_paragraphs:
      'Most trauma cases involved vehicular accidents and falls resulting in abrasions, lacerations, contusions, swelling, body pain, and possible fractures, while three (3) patients were under alcohol intoxication. Emergency responders performed wound cleaning, dressing, and splinting. Three (3) patients were reported dead on the spot, while Thirty-Eight (38) patients were given care management and transported to hospitals such as Balayan Medicare Hospital for further evaluation and treatment, except for One (1) patient who refused transport.\n\n' +
      '       Medical emergencies commonly involved dizziness, hypertension, asthma attacks, difficulty of breathing, loss of consciousness, vomiting, body weakness, and other related conditions. Emergency responders performed patient evaluation, oxygen administration, and vital sign monitoring. All Thirteen (13) patients were given care management and transported to medical facilities for further treatment.\n\n' +
      '       Medical conduction cases involved providing transportation assistance to elderly and other patients for hospital check-ups and transfers. Emergency responders performed patient transport assistance and vital sign monitoring. All Four (4) patients were safely transported to destination hospitals.'
  };

  doc.render(data);
  const outBuf = doc.getZip().generate({ type: 'nodebuffer', compression: 'DEFLATE' });
  writeFileSync('scratch/test_monthly_sentences.docx', outBuf);
  console.log('=== MONTHLY REPORT FULL SENTENCE NARRATIVE OUTPUT ===');
  console.log(doc.getFullText());
}

testMonthlySentences();
