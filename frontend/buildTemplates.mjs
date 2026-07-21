import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import JSZip from 'jszip';

const __dirname = dirname(fileURLToPath(import.meta.url));

const DOWNLOADS = 'C:/Users/angel/Downloads';
const OUT_DIR = join(__dirname, 'public/templates');
const SIG_IMG_PATH = join(OUT_DIR, 'signature_block.png');
mkdirSync(OUT_DIR, { recursive: true });

// ── XML building helpers for Arial 12pt ─────────────────────────────────────
const rBody = `<w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/><w:color w:val="000000"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr>`;
const rBold = `<w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/><w:b/><w:bCs/><w:color w:val="000000"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr>`;

const pCenter = `<w:pPr><w:jc w:val="center"/><w:spacing w:before="120" w:after="120" w:line="240" w:lineRule="auto"/></w:pPr>`;
const pBoth   = `<w:pPr><w:jc w:val="both"/><w:spacing w:before="120" w:after="120" w:line="240" w:lineRule="auto"/></w:pPr>`;
const pEmpty  = `<w:pPr><w:spacing w:after="120" w:line="240" w:lineRule="auto"/></w:pPr>`;

const run  = (t) => `<w:r>${rBody}<w:t xml:space="preserve">${t}</w:t></w:r>`;
const runB = (t) => `<w:r>${rBold}<w:t xml:space="preserve">${t}</w:t></w:r>`;

const p = (pPr, ...runs) => `<w:p>${pPr}${runs.join('')}</w:p>`;
const blank = () => `<w:p>${pEmpty}</w:p>`;

// Inline Drawing XML for signature block image
const sigDrawingXml = `
<w:p>
  <w:pPr><w:jc w:val="center"/><w:spacing w:before="240" w:after="240"/></w:pPr>
  <w:r>
    <w:drawing>
      <wp:inline distT="0" distB="0" distL="0" distR="0">
        <wp:extent cx="5400000" cy="1800000"/>
        <wp:docPr id="500" name="Signature Block"/>
        <a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
          <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/main">
            <pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
              <pic:nvPicPr>
                <pic:cNvPr id="500" name="signature_block.png"/>
                <pic:cNvPicPr/>
              </pic:nvPicPr>
              <pic:blipFill>
                <a:blip r:embed="rIdSig"/>
                <a:stretch><a:fillRect/></a:stretch>
              </pic:blipFill>
              <pic:spPr>
                <a:xfrm><a:off x="0" y="0"/><a:ext cx="5400000" cy="1800000"/></a:xfrm>
                <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
              </pic:spPr>
            </pic:pic>
          </a:graphicData>
        </a:graphic>
      </wp:inline>
    </w:drawing>
  </w:r>
</w:p>
`;

// ── DAILY Body ────────────────────────────────────────────────────────────────
// Format: Explanation -> Procedure Picture (if rawXml provided) -> Signature Image
const dailyBody = `
{#incidents}
${p(pCenter, runB('INCIDENT REPORT'))}
${blank()}
${p(pBoth, run('\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0 That on or about '), runB('{time}'), run(' of '), runB('{date}'), run(', a '), runB('{incident_type}'), run(' occurred at '), runB('{location}.'))}
${p(pBoth, run('\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0 That the incident was reported by '), runB('{reporter_name}'), run('{reporter_phone}. {narrative}'))}
${p(pBoth, run('\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0 That the Municipal Disaster Risk Reduction and Management Office ('), runB('MDRRMO'), run(') emergency responders immediately responded to the scene to assess the situation and provide proper care management in accordance with standard operating procedures.'))}
${blank()}
{@procedure_photo_xml}
${blank()}
${sigDrawingXml}
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
${blank()}
${sigDrawingXml}
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
${blank()}
${sigDrawingXml}
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

  // 1. Inject document.xml
  const originalDocXml = await zip.file('word/document.xml').async('string');
  const newDocXml = buildDocXml(originalDocXml, newBodyInner);
  zip.file('word/document.xml', newDocXml);

  // 2. Inject signature_block.png asset if available
  if (existsSync(SIG_IMG_PATH)) {
    const sigBuf = readFileSync(SIG_IMG_PATH);
    zip.file('word/media/signature_block.png', sigBuf);

    // Update document.xml.rels
    let relsXml = await zip.file('word/_rels/document.xml.rels')?.async('string') || '';
    if (!relsXml.includes('rIdSig')) {
      relsXml = relsXml.replace(
        '</Relationships>',
        '<Relationship Id="rIdSig" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/signature_block.png"/></Relationships>'
      );
      zip.file('word/_rels/document.xml.rels', relsXml);
    }

    // Update [Content_Types].xml
    let contentTypes = await zip.file('[Content_Types].xml')?.async('string') || '';
    if (!contentTypes.includes('signature_block.png') && !contentTypes.includes('Extension="png"')) {
      contentTypes = contentTypes.replace(
        '</Types>',
        '<Default Extension="png" ContentType="image/png"/></Types>'
      );
      zip.file('[Content_Types].xml', contentTypes);
    }
  }

  const outBuf = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  writeFileSync(outFile, outBuf);
  console.log(`✓ Created template: ${outFile} (${(outBuf.length / 1024).toFixed(0)} KB)`);
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

  console.log('✅ All templates successfully updated with Arial 12pt & signature image!');
})();
