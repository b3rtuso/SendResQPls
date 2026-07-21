import { readFileSync } from 'fs';
import JSZip from 'jszip';

const buf = readFileSync('scratch/test_generated_daily.docx');
const zip = await JSZip.loadAsync(buf);
const rels = await zip.file('word/_rels/document.xml.rels')?.async('string');
console.log(rels);
