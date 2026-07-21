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
const rHeader = `<w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/><w:b/><w:bCs/><w:color w:val="1E293B"/><w:sz w:val="26"/><w:szCs w:val="26"/></w:rPr>`;

const pCenter = `<w:pPr><w:jc w:val="center"/><w:spacing w:before="120" w:after="120" w:line="240" w:lineRule="auto"/></w:pPr>`;
const pBoth   = `<w:pPr><w:jc w:val="both"/><w:spacing w:before="100" w:after="100" w:line="240" w:lineRule="auto"/></w:pPr>`;
const pEmpty  = `<w:pPr><w:spacing w:after="100" w:line="240" w:lineRule="auto"/></w:pPr>`;

const run  = (t) => `<w:r>${rBody}<w:t xml:space="preserve">${t}</w:t></w:r>`;
const runB = (t) => `<w:r>${rBold}<w:t xml:space="preserve">${t}</w:t></w:r>`;
const runH = (t) => `<w:r>${rHeader}<w:t xml:space="preserve">${t}</w:t></w:r>`;

const p = (pPr, ...runs) => `<w:p>${pPr}${runs.join('')}</w:p>`;
const blank = () => `<w:p>${pEmpty}</w:p>`;

let drawingIdCounter = 1000;
function makeSigDrawingXml() {
  const id = ++drawingIdCounter;
  return `
<w:p>
  <w:pPr><w:jc w:val="center"/><w:spacing w:before="240" w:after="240"/></w:pPr>
  <w:r>
    <w:drawing>
      <wp:inline distT="0" distB="0" distL="0" distR="0"
                 xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
                 xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
                 xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"
                 xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
        <wp:extent cx="5400000" cy="1800000"/>
        <wp:docPr id="${id}" name="Signature Block ${id}"/>
        <a:graphic>
          <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/main">
            <pic:pic>
              <pic:nvPicPr>
                <pic:cNvPr id="${id}" name="signature_block.png"/>
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
}

function makeSectionHeader(title) {
  return p(pBoth, runH(title));
}

// ── DAILY Body ────────────────────────────────────────────────────────────────
const dailyBody = `
${p(pEmpty, run('{#incidents}'))}
${p(pCenter, runB('INCIDENT REPORT'))}
${blank()}
${p(pBoth, run('\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0 That on or about '), runB('{time}'), run(' of '), runB('{date}'), run(', a '), runB('{incident_type}'), run(' occurred at '), runB('{location}.'))}
${p(pBoth, run('\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0 That the incident was reported by '), runB('{reporter_name}'), run('{reporter_phone}. {narrative}'))}
${p(pBoth, run('\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0 That the Municipal Disaster Risk Reduction and Management Office ('), runB('MDRRMO'), run(') emergency responders immediately responded to the scene to assess the situation and provide proper care management in accordance with standard operating procedures.'))}
${blank()}

${makeSectionHeader('INCIDENT RESOLUTION & QUESTIONNAIRE DETAILS')}
${blank()}

${p(pBoth, runB('1. Patient Information:'))}
${p(pBoth, run('• Name: '), runB('{patient_name}'), run('\u00A0\u00A0|\u00A0\u00A0Age: '), runB('{patient_age}'), run('\u00A0\u00A0|\u00A0\u00A0Sex: '), runB('{patient_sex}'))}
${p(pBoth, run('• Address: '), run('{patient_address}'))}
${blank()}

${p(pBoth, runB('2. Incident Cause & Mechanism:'))}
${p(pBoth, run('• Mechanism of Injury / Cause: '), runB('{mechanism_of_injury}'))}
${p(pBoth, run('• Intoxication Suspected (Alcohol/Drugs): '), runB('{intoxication_suspected}'))}
${p(pBoth, run('• Event Description: '), run('{how_happened}'))}
${blank()}

${p(pBoth, runB('3. Patient Assessment & Vital Signs:'))}
${p(pBoth, run('• Observed Injuries / Complaints: '), runB('{injuries_observed}'))}
${p(pBoth, run('• Consciousness (GCS): '), run('{gcs_level}'), run(' (Score: '), runB('{gcs_score}'), run(')'))}
${p(pBoth, run('• Airway: '), run('{airway_status}'), run('\u00A0\u00A0|\u00A0\u00A0Breathing: '), run('{breathing_status}'), run('\u00A0\u00A0|\u00A0\u00A0Circulation: '), run('{circulation_status}'))}
${p(pBoth, run('• Vital Signs: BP: '), runB('{bp}'), run(' mmHg | Pulse: '), runB('{pulse}'), run(' bpm | RR: '), runB('{rr}'), run(' cpm | SaO₂: '), runB('{sao2}'), run(' | Temp: '), runB('{temp}'), run('°C'))}
${blank()}

${p(pBoth, runB('4. Pre-Hospital Care & Interventions:'))}
${p(pBoth, run('• Interventions Provided: '), run('{treatment}'))}
${p(pBoth, run('• Bleeding Controlled: '), runB('{bleeding_controlled}'), run('\u00A0\u00A0|\u00A0\u00A0Immobilized: '), runB('{immobilized}'), run('\u00A0\u00A0|\u00A0\u00A0Wounds Cleaned: '), runB('{wounds_cleaned}'), run('\u00A0\u00A0|\u00A0\u00A0Oxygen Administered: '), runB('{oxygen_administered}'))}
${blank()}

${p(pBoth, runB('5. Response & Patient Disposition:'))}
${p(pBoth, run('• Responding Agency: '), runB('{responding_agency}'), run(' | Responders: '), run('{responder_names}'))}
${p(pBoth, run('• Arrival Time: '), run('{arrival_time}'), run(' | Departure Time: '), run('{departure_time}'))}
${p(pBoth, run('• Disposition Status: '), runB('{disposition_status}'))}
${p(pBoth, run('• Destination Facility: '), runB('{destination_facility}'), run(' | Transport Time: '), run('{transport_time}'))}
${p(pBoth, run('• Status Upon Turnover: '), run('{turnover_status}'))}
${blank()}

${p(pBoth, run('{procedure_photo_note}'))}
${blank()}
${makeSigDrawingXml()}
${p(pEmpty, run('{/incidents}'))}
`;

// ── WEEKLY Body ───────────────────────────────────────────────────────────────
const weeklyBody = `
${p(pEmpty, run('{#weeks}'))}
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
${makeSigDrawingXml()}
${p(pEmpty, run('{/weeks}'))}
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
${makeSigDrawingXml()}
`;

function buildDocXml(originalXml, newBodyInner) {
  const bodyStartTagMatch = originalXml.match(/<w:body[^>]*>/);
  if (!bodyStartTagMatch) throw new Error('Could not find <w:body> tag in original XML');

  let prefixEnd = originalXml.indexOf(bodyStartTagMatch[0]) + bodyStartTagMatch[0].length;
  let prefix = originalXml.substring(0, prefixEnd);

  // Ensure root <w:document> tag explicitly contains drawingml namespaces (xmlns:a, xmlns:pic)
  if (!prefix.includes('xmlns:a=')) {
    prefix = prefix.replace('<w:document ', '<w:document xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" ');
  }
  if (!prefix.includes('xmlns:pic=')) {
    prefix = prefix.replace('<w:document ', '<w:document xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture" ');
  }

  // Preserve original <w:sectPr> containing header/footer references
  const sectPrMatch = originalXml.match(/<w:sectPr[\s\S]*?<\/w:sectPr>/);
  const sectPr = sectPrMatch ? sectPrMatch[0] : '';

  return `${prefix}${newBodyInner}${sectPr}</w:body></w:document>`;
}

async function buildTemplate(srcDocx, newBodyInner, outFile) {
  const srcBuf = readFileSync(srcDocx);
  const zip = await JSZip.loadAsync(srcBuf);

  // 1. Find all active image targets referenced in header1.xml.rels and footer1.xml.rels
  const headerRels = await zip.file('word/_rels/header1.xml.rels')?.async('string') || '';
  const footerRels = await zip.file('word/_rels/footer1.xml.rels')?.async('string') || '';

  const activeMedia = new Set(['signature_block.png']);
  const headerImgMatch = headerRels.match(/Target="media\/([^"]+)"/);
  if (headerImgMatch) activeMedia.add(headerImgMatch[1]);
  const footerImgMatch = footerRels.match(/Target="media\/([^"]+)"/);
  if (footerImgMatch) activeMedia.add(footerImgMatch[1]);

  // 2. Remove unreferenced media files from word/media/
  for (const file of Object.keys(zip.files)) {
    if (file.startsWith('word/media/')) {
      const name = file.replace('word/media/', '');
      if (!activeMedia.has(name) && name !== '' && name !== 'signature_block.png') {
        zip.remove(file);
      }
    }
  }

  // 3. Clean document.xml.rels to remove orphan image relationships (rId7 .. rId81)
  let relsXml = await zip.file('word/_rels/document.xml.rels')?.async('string') || '';
  const relRegex = /<Relationship Id="([^"]+)" Type="[^"]*image" Target="media\/([^"]+)"\/>/g;
  relsXml = relsXml.replace(relRegex, (match, id, target) => {
    if (activeMedia.has(target)) return match;
    return ''; // Purge orphan image relationship!
  });

  // Inject signature_block.png relationship if not already added
  if (!relsXml.includes('rIdSig')) {
    relsXml = relsXml.replace(
      '</Relationships>',
      '<Relationship Id="rIdSig" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/signature_block.png"/></Relationships>'
    );
  }
  zip.file('word/_rels/document.xml.rels', relsXml);

  // 4. Inject signature_block.png into word/media/
  if (existsSync(SIG_IMG_PATH)) {
    const sigBuf = readFileSync(SIG_IMG_PATH);
    zip.file('word/media/signature_block.png', sigBuf);

    // Update [Content_Types].xml
    let contentTypes = await zip.file('[Content_Types].xml')?.async('string') || '';
    if (!contentTypes.includes('signature_block.png')) {
      contentTypes = contentTypes.replace(
        '</Types>',
        '<Override PartName="/word/media/signature_block.png" ContentType="image/png"/></Types>'
      );
      zip.file('[Content_Types].xml', contentTypes);
    }
  }

  // 5. Replace document.xml body while preserving header/footer sectPr and root namespaces
  const originalDocXml = await zip.file('word/document.xml').async('string');
  const newDocXml = buildDocXml(originalDocXml, newBodyInner);
  zip.file('word/document.xml', newDocXml);

  const outBuf = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  writeFileSync(outFile, outBuf);
  console.log(`✓ Created clean template: ${outFile} (${(outBuf.length / 1024).toFixed(1)} KB)`);
}

(async () => {
  const dailySrc   = `${DOWNLOADS}/DAILY-INCIDENT-REPORT_MARCH-2026.docx`;
  const weeklySrc  = `${DOWNLOADS}/WEEKLY-INCIDENT-REPORT_MARCH-2026.docx`;
  const monthlySrc = `${DOWNLOADS}/MONTHLY-INCIDENT-REPORT_MARCH-2026.docx`;

  await buildTemplate(dailySrc, dailyBody, `${OUT_DIR}/daily-template.docx`);
  await buildTemplate(weeklySrc, weeklyBody, `${OUT_DIR}/weekly-template.docx`);
  await buildTemplate(monthlySrc, monthlyBody, `${OUT_DIR}/monthly-template.docx`);

  console.log('✅ All templates cleaned and generated successfully with 0 orphan rels!');
})();
