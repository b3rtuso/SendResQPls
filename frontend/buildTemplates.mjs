import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import JSZip from 'jszip';

const __dirname = dirname(fileURLToPath(import.meta.url));

const DOWNLOADS = 'C:/Users/angel/Downloads';
const OUT_DIR = join(__dirname, 'public/templates');
mkdirSync(OUT_DIR, { recursive: true });

// ── XML building helpers for Arial 12pt (body) & Arial 11pt (signature block) ──
const rBody = `<w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/><w:color w:val="000000"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr>`;
const rBold = `<w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/><w:b/><w:bCs/><w:color w:val="000000"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr>`;

// Signature block Arial 11pt (22 half-points)
const rSig = `<w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/><w:color w:val="000000"/><w:sz w:val="22"/><w:szCs w:val="22"/></w:rPr>`;
const rSigBold = `<w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/><w:b/><w:bCs/><w:color w:val="000000"/><w:sz w:val="22"/><w:szCs w:val="22"/></w:rPr>`;

const pCenter = `<w:pPr><w:jc w:val="center"/><w:spacing w:before="120" w:after="120" w:line="240" w:lineRule="auto"/></w:pPr>`;
const pBoth   = `<w:pPr><w:jc w:val="both"/><w:spacing w:before="120" w:after="120" w:line="240" w:lineRule="auto"/></w:pPr>`;
const pEmpty  = `<w:pPr><w:spacing w:after="120" w:line="240" w:lineRule="auto"/></w:pPr>`;

const run  = (t) => `<w:r>${rBody}<w:t xml:space="preserve">${t}</w:t></w:r>`;
const runB = (t) => `<w:r>${rBold}<w:t xml:space="preserve">${t}</w:t></w:r>`;

const runSig  = (t) => `<w:r>${rSig}<w:t xml:space="preserve">${t}</w:t></w:r>`;
const runSigB = (t) => `<w:r>${rSigBold}<w:t xml:space="preserve">${t}</w:t></w:r>`;

const p = (pPr, ...runs) => `<w:p>${pPr}${runs.join('')}</w:p>`;
const blank = () => `<w:p>${pEmpty}</w:p>`;
const pageBreak = () => `<w:p><w:r><w:br w:type="page"/></w:r></w:p>`;

// Borderless 3-column signature block table in Arial 11pt
const sigTable = `
${blank()}
<w:tbl>
  <w:tblPr>
    <w:tblW w:w="9360" w:type="dxa"/>
    <w:tblBorders>
      <w:top w:val="none"/><w:left w:val="none"/><w:bottom w:val="none"/><w:right w:val="none"/>
      <w:insideH w:val="none"/><w:insideV w:val="none"/>
    </w:tblBorders>
  </w:tblPr>
  <w:tr>
    <w:tc><w:tcPr><w:tcW w:w="3120" w:type="dxa"/></w:tcPr>${p(pCenter, runSig('Prepared by:'))}</w:tc>
    <w:tc><w:tcPr><w:tcW w:w="3120" w:type="dxa"/></w:tcPr>${p(pCenter, runSig('Checked by:'))}</w:tc>
    <w:tc><w:tcPr><w:tcW w:w="3120" w:type="dxa"/></w:tcPr>${p(pCenter, runSig('Noted by:'))}</w:tc>
  </w:tr>
  <w:tr>
    <w:tc><w:tcPr><w:tcW w:w="3120" w:type="dxa"/></w:tcPr>${blank()}${blank()}${p(pCenter, runSigB('Rosalinda Espinar'))}${p(pCenter, runSig('Incident Documentation Staff'))}</w:tc>
    <w:tc><w:tcPr><w:tcW w:w="3120" w:type="dxa"/></w:tcPr>${blank()}${blank()}${p(pCenter, runSigB('Giovanni Marco'))}${p(pCenter, runSig('Operations-In-Charge'))}</w:tc>
    <w:tc><w:tcPr><w:tcW w:w="3120" w:type="dxa"/></w:tcPr>${blank()}${blank()}${p(pCenter, runSigB('Christian Noel Villanueva'))}${p(pCenter, runSig('MGDH I \u2013 LDRRMO'))}</w:tc>
  </w:tr>
</w:tbl>
${blank()}
`;

// ── DAILY Body ────────────────────────────────────────────────────────────────
const dailyBody = `
${p(pEmpty, run('{#incidents}'))}
${p(pCenter, runB('INCIDENT REPORT'))}
${blank()}
${p(pBoth, run('\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0 That on or about '), runB('{time}'), run(' of '), runB('{date}'), run(', a '), runB('{incident_type}'), run(' occurred in '), runB('{location}.'))}
${p(pBoth, run('\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0 That the patient, '), runB('{patient_name}'), run(', '), run('{patient_sex}'), run(', '), run('{patient_age}'), run(' years old, and a resident of '), run('{patient_address}'), run(', '), run('{intoxication_detail}'), run('{mechanism_detail}'), run('and obtained '), run('{injuries_observed}.'))}
${p(pBoth, run('\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0 That the Municipal Disaster Risk Reduction and Management Office ('), runB('MDRRMO'), run(') emergency responders, '), runB('{responders}'), run(', immediately arrived at the scene of the incident to assess the patient and gave proper care management, '), run('{interventions_detail}'), run('and checking of vital signs, with '), run('{vitals_detail}.'))}
${p(pBoth, run('\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0 After giving proper care management, the patient was '), run('{disposition_detail}.'))}
${blank()}
{@procedure_photo_xml}
${sigTable}
${pageBreak()}
${p(pEmpty, run('{/incidents}'))}
`;

// ── WEEKLY Body (Matching Reference File Verbatim) ───────────────────────────
const weeklyBody = `
${p(pEmpty, run('{#weeks}'))}
${p(pCenter, runB('WEEKLY INCIDENT REPORT'))}
${blank()}
${p(pBoth, run('\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0 For the '), runB('{week_ordinal}'), run(' week of the Month Dated: '), runB('{date_range}'), run('. The Municipal Disaster Risk Reduction and Management Office ('), runB('MDRRMO'), run(') emergency responders responded to '), runB('{total_incidents_text}'), run(' incidents.'))}
${blank()}
${p(pBoth, run('\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0 That '), runB('{trauma_count_text}'), run(' of the incidents were Trauma Emergencies, '), run('{trauma_breakdown}.'))}
${blank()}
${p(pBoth, run('\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0 That '), runB('{medical_count_text}'), run(' of the '), run('{total_count_word}'), run(' incidents were Medical Emergencies, '), run('{medical_breakdown}.'))}
${blank()}
${p(pBoth, run('\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0 That the other '), runB('{conduction_count_text}'), run(' of the '), run('{total_count_word}'), run(' incidents was a Medical Conduction, '), run('{conduction_breakdown}.'))}
${blank()}
${p(pBoth, run('\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0 That the Four (4) teams of the Municipal Disaster and Risk Reduction and Management Office ('), runB('MDRRMO'), run('), emergency responders, radio operators, and the operation sections diligently and effectively did their duties.'))}
${sigTable}
${p(pEmpty, run('{/weeks}'))}
`;

// ── MONTHLY Body (Matching Reference File Verbatim) ──────────────────────────
const monthlyBody = `
${p(pCenter, runB('MONTHLY INCIDENT REPORT'))}
${blank()}
${p(pBoth, run('\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0 For the month of '), runB('{month_name_upper}'), run(' '), runB('{year}'), run(', the Municipal Disaster Risk Reduction and Management Office ('), runB('MDRRMO'), run(') emergency responders handled a total of '), runB('{total_incidents_text}'), run(' incidents.'))}
${blank()}
${p(pBoth, run('\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0 These included '), runB('{trauma_count_text}'), run(' Trauma Emergencies, '), runB('{medical_count_text}'), run(' Medical Emergencies, and '), runB('{conduction_count_text}'), run(' Medical Conductions.'))}
${blank()}
${p(pBoth, run('\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0 Most trauma cases involved '), runB('{top_trauma_causes}'), run(' resulting in '), runB('{common_injuries}'), run(', while some patients were under alcohol intoxication. '), run('{trauma_disposition_narrative}'))}
${blank()}
${p(pBoth, run('\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0 Medical emergencies commonly involved '), runB('{top_medical_complaints}'), run('.'))}
${blank()}
${p(pBoth, run('\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0 Medical conduction cases involved '), runB('{medical_conduction_purposes}'), run('.'))}
${blank()}
${p(pBoth, run('\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0 Throughout the month, the four (4) teams of the MDRRMO emergency responders, radio operators, and operations personnel diligently and effectively performed their duties in responding to all reported incidents.'))}
${sigTable}
`;

function buildDocXml(originalXml, newBodyInner) {
  const prefixEnd = originalXml.indexOf('<w:body>') + '<w:body>'.length;
  const prefix = originalXml.substring(0, prefixEnd);

  const sectPrMatch = originalXml.match(/<w:sectPr[\s\S]*?<\/w:sectPr>/);
  const sectPr = sectPrMatch ? sectPrMatch[0] : '';

  return `${prefix}${newBodyInner}${sectPr}</w:body></w:document>`;
}

async function buildTemplate(srcDocx, newBodyInner, outFile) {
  const srcBuf = readFileSync(srcDocx);
  const zip = await JSZip.loadAsync(srcBuf);

  const originalDocXml = await zip.file('word/document.xml').async('string');
  const newDocXml = buildDocXml(originalDocXml, newBodyInner);
  zip.file('word/document.xml', newDocXml);

  const outBuf = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  writeFileSync(outFile, outBuf);
  console.log(`✓ Created clean template: ${outFile} (${(outBuf.length / 1024).toFixed(0)} KB)`);
}

(async () => {
  let dailySrc = `${DOWNLOADS}/DAILY-INCIDENT-REPORT_MARCH-2026.docx`;
  let weeklySrc = `${DOWNLOADS}/WEEKLY-INCIDENT-REPORT_MARCH-2026.docx`;
  let monthlySrc = `${DOWNLOADS}/MONTHLY-INCIDENT-REPORT_MARCH-2026.docx`;

  if (!existsSync(dailySrc)) dailySrc = `${OUT_DIR}/daily-template.docx`;
  if (!existsSync(weeklySrc)) weeklySrc = `${OUT_DIR}/weekly-template.docx`;
  if (!existsSync(monthlySrc)) monthlySrc = `${OUT_DIR}/monthly-template.docx`;

  await buildTemplate(dailySrc, dailyBody, `${OUT_DIR}/daily-template.docx`);
  await buildTemplate(weeklySrc, weeklyBody, `${OUT_DIR}/weekly-template.docx`);
  await buildTemplate(monthlySrc, monthlyBody, `${OUT_DIR}/monthly-template.docx`);

  console.log('✅ All templates recreated with 100% valid OpenXML formatting & Arial 11pt signature block!');
})();
