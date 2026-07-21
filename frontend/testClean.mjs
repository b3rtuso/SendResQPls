import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import JSZip from 'jszip';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DOWNLOADS = 'C:/Users/angel/Downloads';
const OUT_DIR = join(__dirname, 'public/templates');
const SIG_IMG_PATH = join(OUT_DIR, 'signature_block.png');
mkdirSync(OUT_DIR, { recursive: true });

// Helper to clean orphan image relationships from zip
async function cleanTemplateZip(srcDocxPath) {
  const buf = readFileSync(srcDocxPath);
  const zip = await JSZip.loadAsync(buf);

  // Read header1.xml.rels and footer1.xml.rels to find required header/footer images
  const headerRels = await zip.file('word/_rels/header1.xml.rels')?.async('string') || '';
  const footerRels = await zip.file('word/_rels/footer1.xml.rels')?.async('string') || '';

  const requiredImages = new Set(['signature_block.png']);
  
  // Extract image targets from header & footer rels
  const headerImgMatch = headerRels.match(/Target="media\/([^"]+)"/);
  if (headerImgMatch) requiredImages.add(headerImgMatch[1]);

  const footerImgMatch = footerRels.match(/Target="media\/([^"]+)"/);
  if (footerImgMatch) requiredImages.add(footerImgMatch[1]);

  // Remove unused image files from word/media/
  for (const file of Object.keys(zip.files)) {
    if (file.startsWith('word/media/')) {
      const imgName = file.replace('word/media/', '');
      if (!requiredImages.has(imgName) && imgName !== 'signature_block.png') {
        zip.remove(file);
      }
    }
  }

  // Clean document.xml.rels: remove image relationships pointing to deleted media
  let relsXml = await zip.file('word/_rels/document.xml.rels')?.async('string') || '';
  const relRegex = /<Relationship Id="([^"]+)" Type="[^"]*image" Target="media\/([^"]+)"\/>/g;
  
  relsXml = relsXml.replace(relRegex, (match, id, target) => {
    if (requiredImages.has(target)) return match;
    return ''; // Remove orphan image relationship!
  });

  zip.file('word/_rels/document.xml.rels', relsXml);
  return zip;
}

const cleanedZip = await cleanTemplateZip(`${DOWNLOADS}/DAILY-INCIDENT-REPORT_MARCH-2026.docx`);
console.log('✅ Template cleaned successfully!');

