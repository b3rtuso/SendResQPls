import { readFileSync } from 'fs';
import JSZip from 'jszip';

const origBuf = readFileSync('C:/Users/angel/Downloads/DAILY-INCIDENT-REPORT_MARCH-2026.docx');
const origZip = await JSZip.loadAsync(origBuf);
const origXml = await origZip.file('word/document.xml').async('string');

console.log('Original body start:');
const bodyStart = origXml.indexOf('<w:body>');
console.log(origXml.substring(bodyStart, bodyStart + 1000));

console.log('\nOriginal body end:');
const bodyEnd = origXml.lastIndexOf('</w:body>');
console.log(origXml.substring(bodyEnd - 1000, bodyEnd + 8));
