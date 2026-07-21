import { readFileSync } from 'fs';
import JSZip from 'jszip';

async function checkDocx(filename) {
  console.log(`\n=== Checking ${filename} ===`);
  const buf = readFileSync(filename);
  const zip = await JSZip.loadAsync(buf);
  for (const name of Object.keys(zip.files)) {
    if (name.includes('undefined')) {
      console.log('🚨 Found undefined in zip file entry name:', name);
    }
    const content = await zip.files[name].async('string').catch(() => '');
    if (content.includes('undefined')) {
      console.log(`🚨 Found "undefined" inside text of ${name}`);
      const matches = content.match(/.{0,30}undefined.{0,30}/g);
      console.log('   Matches:', matches?.slice(0, 3));
    }
  }
}

await checkDocx('C:/Users/angel/Downloads/DAILY-INCIDENT-REPORT_MARCH-2026.docx');
await checkDocx('public/templates/daily-template.docx');
