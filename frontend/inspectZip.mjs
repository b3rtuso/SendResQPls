import { readFileSync, writeFileSync } from 'fs';
import JSZip from 'jszip';

const buf = readFileSync('scratch/test_generated_daily.docx');
const zip = await JSZip.loadAsync(buf);

console.log('Zip contents:');
for (const filename of Object.keys(zip.files)) {
  if (!zip.files[filename].dir) {
    console.log(' -', filename, zip.files[filename]._data ? zip.files[filename]._data.uncompressedSize : '');
  }
}

// Check document.xml.rels
const rels = await zip.file('word/_rels/document.xml.rels')?.async('string');
console.log('\n--- word/_rels/document.xml.rels ---');
console.log(rels);

// Check [Content_Types].xml
const contentTypes = await zip.file('[Content_Types].xml')?.async('string');
console.log('\n--- [Content_Types].xml ---');
console.log(contentTypes);

