import { readFileSync } from 'fs';
import JSZip from 'jszip';

const buf = readFileSync('C:/Users/angel/Downloads/DAILY-INCIDENT-REPORT_MARCH-2026.docx');
const zip = await JSZip.loadAsync(buf);
const xml = await zip.file('word/document.xml').async('string');

const docStart = xml.indexOf('<w:document');
const docEnd = xml.indexOf('>', docStart);
const docTag = xml.substring(docStart, docEnd + 1);

console.log('Original <w:document> tag:\n', docTag);
