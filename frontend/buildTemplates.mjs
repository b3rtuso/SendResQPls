/**
 * buildTemplates.mjs
 * Run once with: node buildTemplates.mjs
 *
 * Reads the 3 original MDRRMO .docx templates from Downloads,
 * replaces their body content with docxtemplater {tag} placeholders
 * (preserving the header, footer, images, sectPr exactly),
 * and writes the modified templates to public/templates/.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import JSZip from 'jszip';

const __dirname = dirname(fileURLToPath(import.meta.url));

const DOWNLOADS = 'C:/Users/angel/Downloads';
const OUT_DIR = join(__dirname, 'public/templates');
mkdirSync(OUT_DIR, { recursive: true });

// ── XML building helpers ──────────────────────────────────────────────────────

const rBody = `<w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/><w:color w:val="000000"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr>`;
const rBold = `<w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/><w:b/><w:bCs/><w:color w:val="000000"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr>`;

const pCenter = `<w:pPr><w:jc w:val="center"/><w:spacing w:after="200" w:line="276" w:lineRule="auto"/></w:pPr>`;
const pBoth   = `<w:pPr><w:jc w:val="both"/><w:spacing w:after="200" w:line="276" w:lineRule="auto"/></w:pPr>`;
const pEmpty  = `<w:pPr><w:spacing w:after="200" w:line="276" w:lineRule="auto"/></w:pPr>`;

const run  = (t) => `<w:r>${rBody}<w:t xml:space="preserve">${t}</w:t></w:r>`;
const runB = (t) => `<w:r>${rBold}<w:t xml:space="preserve">${t}</w:t></w:r>`;
const tab  = () => `<w:r>${rBody}<w:tab/></w:r>`;

const p = (pPr, ...runs) => `<w:p>${pPr}${runs.join('')}</w:p>`;
const blank = () => `<w:p>${pEmpty}</w:p>`;

const pageBreak = `<w:p><w:r><w:br w:type="page"/></w:r></w:p>`;

// Signature block — same for all 3 formats
const sigBlock = [
  blank(),
  p(pCenter,
    run('Prepared by:'), tab(), tab(), tab(), tab(),
    run('Checked by:'), tab(), tab(), tab(), tab(),
    run('Noted by:'),
  ),
  p(pCenter,
    runB('Rosalinda Espinar'), tab(), tab(),
    runB('Giovanni Marco'), tab(), tab(),
    runB('Christian Noel Villanueva'),
  ),
  p(pCenter,
    run('Incident Documentation Staff'), tab(),
    run('Operations-In-Charge'), tab(), tab(),
    run('MGDH I / L DRRMO'),
  ),
].join('\n');

// ── DAILY body ────────────────────────────────────────────────────────────────
// {#incidents} loop — one page per incident
const dailyBody = `
{#incidents}
${p(pCenter, runB('INCIDENT REPORT'))}
${blank()}
${p(pBoth, run('\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0 That on or about '), runB('{time}'), run(' of '), runB('{date}'), run(', a '), runB('{incident_type}'), run(' occurred at '), runB('{location}.'))}
${p(pBoth, run('\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0 That the incident was reported by '), runB('{reporter_name}'), run('{reporter_phone}. {narrative}'))}
${p(pBoth, run('\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0 That the Municipal Disaster Risk Reduction and Management Office ('), runB('MDRRMO'), run(') emergency responders immediately responded to the scene to assess the situation and provide proper care management in accordance with standard operating procedures.'))}
${sigBlock}
{/incidents}
`;

// ── WEEKLY body ───────────────────────────────────────────────────────────────
// {#weeks} loop — one page per week
const weeklyBody = `
{#weeks}
${p(pCenter, runB('WEEKLY INCIDENT REPORT'))}
${blank()}
${p(pBoth, run('\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0 For the '), runB('{week_ordinal} week of the Month'), run(' Dated: '), runB('{week_range}'), run('. The Municipal Disaster Risk Reduction and Management Office ('), runB('MDRRMO'), run(') emergency responders responded to '), runB('{total_word} ({total_num})'), run(' incident{total_plural}.'))}
{#has_trauma}
${p(pBoth, run('\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0 That '), runB('{trauma_word} ({trauma_num})'), run(' of the incidents were '), runB('Trauma / Vehicular Accident Emergencies'), run(', wherein patients obtained various injuries including abrasions, laceration wounds, contusions, and fractures. All conscious patients were given proper care management and immediately transported to the hospital for further evaluation and treatment.'))}
{/has_trauma}
{#has_medical}
${p(pBoth, run('\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0 That '), runB('{medical_word} ({medical_num})'), run(' of the incidents were '), runB('Medical Emergencies'), run(', involving conditions such as dizziness, hypertension, difficulty of breathing, body weakness, and other related medical conditions. Patients were assessed, given proper care, and transported to the hospital for further treatment.'))}
{/has_medical}
{#has_fire}
${p(pBoth, run('\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0 That '), runB('{fire_word} ({fire_num})'), run(' of the incidents were '), runB('Fire Incidents'), run(', to which MDRRMO emergency responders immediately responded in coordination with the Bureau of Fire Protection.'))}
{/has_fire}
{#has_crime}
${p(pBoth, run('\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0 That '), runB('{crime_word} ({crime_num})'), run(' of the incidents were '), runB('Crime-Related Incidents'), run(', in which MDRRMO provided emergency medical assistance to affected individuals in coordination with law enforcement.'))}
{/has_crime}
${p(pBoth, run('\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0 That the four (4) teams of the Municipal Disaster and Risk Reduction and Management Office ('), runB('MDRRMO'), run('), emergency responders, radio operators, and the operation sections diligently and effectively did their duties.'))}
${sigBlock}
{/weeks}
`;

// ── MONTHLY body ──────────────────────────────────────────────────────────────
const monthlyBody = `
${p(pCenter, runB('MONTHLY INCIDENT REPORT'))}
${blank()}
${p(pBoth, run('\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0 For the month of '), runB('{month_upper}'), run(' {year}, the Municipal Disaster Risk Reduction and Management Office ('), runB('MDRRMO'), run(') emergency responders handled a total of '), runB('{total_word} ({total_num})'), run(' incident{total_plural}.'))}
${p(pBoth, run('\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0 These included '), runB('{trauma_word} ({trauma_num}) Trauma Emergencies'), run(', '), runB('{medical_word} ({medical_num}) Medical Emergencies'), run('{extra_types}.'))}
${p(pBoth, run('\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0 Most trauma cases involved vehicular accidents and falls resulting in abrasions, lacerations, contusions, swelling, body pain, and possible fractures. Patients were given immediate care management and transported to hospitals for further evaluation and treatment.'))}
${p(pBoth, run('\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0 Medical emergencies commonly involved dizziness, hypertension, asthma attacks, difficulty of breathing, loss of consciousness, vomiting, body weakness, and other related conditions.'))}
${p(pBoth, run('\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0 Throughout the month, the four (4) teams of the '), runB('MDRRMO'), run(' emergency responders, radio operators, and operations personnel diligently and effectively performed their duties in responding to all reported incidents.'))}
${sigBlock}
`;

// ── Build a new document.xml from prefix + new body + sectPr ─────────────────

function buildDocXml(originalXml, newBodyInner) {
  const prefixEnd = originalXml.indexOf('<w:body>') + '<w:body>'.length;
  const prefix = originalXml.substring(0, prefixEnd);

  const sectPrMatch = originalXml.match(/<w:sectPr[\s\S]*?<\/w:sectPr>/);
  const sectPr = sectPrMatch ? sectPrMatch[0] : '';

  return `${prefix}${newBodyInner}${sectPr}</w:body></w:document>`;
}

// ── Repack: read original .docx, replace document.xml, save new .docx ─────────

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
  console.log(`✓ Created: ${outFile} (${(outBuf.length / 1024).toFixed(0)} KB)`);
}

// ── Main ──────────────────────────────────────────────────────────────────────

(async () => {
  await buildTemplate(
    `${DOWNLOADS}/DAILY-INCIDENT-REPORT_MARCH-2026.docx`,
    dailyBody,
    `${OUT_DIR}/daily-template.docx`,
  );

  await buildTemplate(
    `${DOWNLOADS}/WEEKLY-INCIDENT-REPORT_MARCH-2026.docx`,
    weeklyBody,
    `${OUT_DIR}/weekly-template.docx`,
  );

  await buildTemplate(
    `${DOWNLOADS}/MONTHLY-INCIDENT-REPORT_MARCH-2026.docx`,
    monthlyBody,
    `${OUT_DIR}/monthly-template.docx`,
  );

  console.log('\nAll templates ready in public/templates/');
})();
