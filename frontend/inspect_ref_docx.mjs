import PizZip from 'pizzip';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const downloads = 'C:/Users/angel/Downloads';
const files = readdirSync(downloads);

console.log('Files in Downloads matching WEEKLY or MONTHLY:');
const matches = files.filter(f => f.toUpperCase().includes('WEEKLY') || f.toUpperCase().includes('MONTHLY'));
console.log(matches);

matches.forEach(file => {
  const fullPath = join(downloads, file);
  if (!file.endsWith('.docx')) return;
  try {
    const buf = readFileSync(fullPath);
    const zip = new PizZip(buf);
    const xml = zip.file('word/document.xml')?.asText();
    if (xml) {
      const textMatches = xml.match(/<w:t[^>]*>(.*?)<\/w:t>/g)?.map(t => t.replace(/<[^>]+>/g, '')) || [];
      console.log(`\n========================================`);
      console.log(`FILE: ${file}`);
      console.log(`========================================`);
      console.log(textMatches.join(' '));
    }
  } catch (err) {
    console.error(`Error reading ${file}:`, err.message);
  }
});
