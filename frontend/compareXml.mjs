import { readFileSync } from 'fs';
import JSZip from 'jszip';

const origBuf = readFileSync('C:/Users/angel/Downloads/DAILY-INCIDENT-REPORT_MARCH-2026.docx');
const origZip = await JSZip.loadAsync(origBuf);
const origXml = await origZip.file('word/document.xml').async('string');

const tmplBuf = readFileSync('public/templates/daily-template.docx');
const tmplZip = await JSZip.loadAsync(tmplBuf);
const tmplXml = await tmplZip.file('word/document.xml').async('string');

console.log('Original document.xml length:', origXml.length);
console.log('Template document.xml length:', tmplXml.length);

console.log('\nOriginal document.xml root tag:');
console.log(origXml.substring(0, 500));

console.log('\nTemplate document.xml root tag:');
console.log(tmplXml.substring(0, 500));
