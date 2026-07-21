import { readFileSync } from 'fs';
import JSZip from 'jszip';

const buf = readFileSync('C:/Users/angel/Downloads/DAILY-INCIDENT-REPORT_MARCH-2026.docx');
const zip = await JSZip.loadAsync(buf);
const xml = await zip.file('word/document.xml').async('string');

const docTag = xml.substring(0, xml.indexOf('>') + 1);
console.log('Original root tag attributes:\n');
docTag.split(' ').forEach(attr => console.log(' ', attr));
