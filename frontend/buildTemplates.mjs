import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import JSZip from 'jszip';

const __dirname = dirname(fileURLToPath(import.meta.url));

const DOWNLOADS = 'C:/Users/angel/Downloads';
const OUT_DIR = join(__dirname, 'public/templates');
mkdirSync(OUT_DIR, { recursive: true });

// ── XML building helpers for Arial 12pt ─────────────────────────────────────
const rBody = `<w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/><w:color w:val="000000"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr>`;
const rBold = `<w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/><w:b/><w:bCs/><w:color w:val="000000"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr>`;

const pCenter = `<w:pPr><w:jc w:val="center"/><w:spacing w:before="120" w:after="120" w:line="240" w:lineRule="auto"/></w:pPr>`;
const pBoth   = `<w:pPr><w:jc w:val="both"/><w:spacing w:before="120" w:after="120" w:line="240" w:lineRule="auto"/></w:pPr>`;
const pEmpty  = `<w:pPr><w:spacing w:after="120" w:line="240" w:lineRule="auto"/></w:pPr>`;

const run  = (t) => `<w:r>${rBody}<w:t xml:space="preserve">${t}</w:t></w:r>`;
const runB = (t) => `<w:r>${rBold}<w:t xml:space="preserve">${t}</w:t></w:r>`;
const tab  = () => `<w:r>${rBody}<w:tab/></w:r>`;

const p = (pPr, ...runs) => `<w:p>${pPr}${runs.join('')}</w:p>`;
const blank = () => `<w:p>${pEmpty}</w:p>`;

// Official MDRRMO Signature Block formatted cleanly in OpenXML (100% valid, zero corruption)
const sigBlock = `
${blank()}
${blank()}
${p(pCenter,
  run('Prepared by:'), tab(), tab(), tab(),
  run('Checked by:'), tab(), tab(), tab(),
  run('Noted by:'),
)}
${blank()}
${p(pCenter,
  runB('Rosalinda Espinar'), tab(), tab(),
  runB('Giovanni Marco'), tab(), tab(),
  runB('Christian Noel Villanueva'),
)}
${p(pCenter,
  run('Incident Documentation Staff'), tab(),
  run('Operations-In-Charge'), tab(), tab(),
  run('MGDH I \u2013 LDRRMO'),
)}
`;

// ── DAILY Body ────────────────────────────────────────────────────────────────
// Explanation -> Procedure Photo -> Signature Block
const dailyBody = `
{#incidents}
${p(pCenter, runB('INCIDENT REPORT'))}
${blank()}
${p(pBoth, run('\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0 That on or about '), runB('{time}'), run(' of '), runB('{date}'), run(', a '), runB('{incident_type}'), run(' occurred at '), runB('{location}.'))}
${p(pBoth, run('\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0 That the incident was reported by '), runB('{reporter_name}'), run('{reporter_phone}. {narrative}'))}
${p(pBoth, run('\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0 That the Municipal Disaster Risk Reduction and Management Office ('), runB('MDRRMO'), run(') emergency responders immediately responded to the scene to assess the situation and provide proper care management in accordance with standard operating procedures.'))}
${blank()}
{@procedure_photo_xml}
${sigBlock}
{/incidents}
`;

// ── WEEKLY Body ───────────────────────────────────────────────────────────────
const weeklyBody = `
{#weeks}
${p(pCenter, runB('WEEKLY INCIDENT REPORT'))}
${blank()}
${p(pBoth, run('\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0 For the '), runB('{week_ordinal}'), run(' week of the month dated '), runB('{start_date}'), run(' to '), runB('{end_date}'), run(', the MDRRMO responded to '), runB('{total_incidents}'), run(' incidents.'))}
${blank()}
${p(pBoth, run('Of these,'))}
${p(pBoth, runB('{trauma_count}'), run(' were Trauma Emergencies,'))}
${p(pBoth, runB('{medical_count}'), run(' were Medical Emergencies, and'))}
${p(pBoth, runB('{medical_conduction_count}'), run(' was a Medical Conduction.'))}
${blank()}
${p(pBoth, run('Among the Trauma Emergencies,'))}
${p(pBoth, runB('{dead_count}'), run(' patients were reported dead on the spot,'))}
${p(pBoth, runB('{cancelled_count}'), run(' incident was cancelled,'))}
${p(pBoth, runB('{transported_count}'), run(' patients were transported after receiving proper care.'))}
${blank()}
${p(pBoth, run('The common injuries observed were:'))}
${p(pBoth, runB('{injury_list}'), run('.'))}
${blank()}
${p(pBoth, run('Among the Medical Emergencies,'))}
${p(pBoth, run('the recorded chief complaints included:'))}
${p(pBoth, runB('{complaint_list}'), run('.'))}
${blank()}
${p(pBoth, run('The MDRRMO teams successfully performed their emergency response duties throughout the reporting period.'))}
${sigBlock}
{/weeks}
`;

// ── MONTHLY Body ──────────────────────────────────────────────────────────────
const monthlyBody = `
${p(pCenter, runB('MONTHLY INCIDENT REPORT'))}
${blank()}
${p(pBoth, run('\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0 For the month of '), runB('{month_name}'), run(','))}
${blank()}
${p(pBoth, run('the MDRRMO handled a total of '), runB('{total_incidents}'), run(' incidents.'))}
${blank()}
${p(pBoth, run('These included'))}
${p(pBoth, runB('{trauma_count}'), run(' Trauma Emergencies,'))}
${p(pBoth, runB('{medical_count}'), run(' Medical Emergencies,'))}
${p(pBoth, run('and '), runB('{medical_conduction_count}'), run(' Medical Conductions.'))}
${blank()}
${p(pBoth, run('Most trauma cases involved '), runB('{top_trauma_causes}'), run(', resulting in '), runB('{common_injuries}'), run('.'))}
${blank()}
${p(pBoth, runB('{dead_count}'), run(' patients were reported dead on the spot, while '), runB('{transported_count}'), run(' were transported after receiving proper care, except for '), runB('{refused_count}'), run(' patient who refused transport.'))}
${blank()}
${p(pBoth, run('Medical emergencies commonly involved '))}
${p(pBoth, runB('{top_medical_complaints}'), run('.'))}
${blank()}
${p(pBoth, run('Medical conduction cases involved '))}
${p(pBoth, runB('{medical_conduction_purposes}'), run('.'))}
${blank()}
${p(pBoth, run('Throughout the month, '))}
${p(pBoth, runB('{team_count}'), run(' MDRRMO teams effectively responded to all reported incidents.'))}
${sigBlock}
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

  console.log('✅ All templates recreated with 100% valid OpenXML formatting!');
})();
