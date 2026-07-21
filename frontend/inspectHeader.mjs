import { readFileSync } from 'fs';
import JSZip from 'jszip';

const buf = readFileSync('scratch/test_generated_daily.docx');
const zip = await JSZip.loadAsync(buf);

const header1 = await zip.file('word/header1.xml')?.async('string');
const footer1 = await zip.file('word/footer1.xml')?.async('string');
const header1Rels = await zip.file('word/_rels/header1.xml.rels')?.async('string');
const footer1Rels = await zip.file('word/_rels/footer1.xml.rels')?.async('string');

console.log('--- word/header1.xml ---');
console.log(header1?.substring(0, 500));
console.log('\n--- word/_rels/header1.xml.rels ---');
console.log(header1Rels);

console.log('\n--- word/footer1.xml ---');
console.log(footer1?.substring(0, 500));
console.log('\n--- word/_rels/footer1.xml.rels ---');
console.log(footer1Rels);
