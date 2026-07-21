import { readFileSync } from 'fs';
import JSZip from 'jszip';

const buf = readFileSync('C:/Users/angel/Downloads/DAILY-INCIDENT-REPORT_MARCH-2026.docx');
const zip = await JSZip.loadAsync(buf);

const docXml = await zip.file('word/document.xml').async('string');
const headerXml = await zip.file('word/header1.xml')?.async('string') || '';
const footerXml = await zip.file('word/footer1.xml')?.async('string') || '';

const docRels = await zip.file('word/_rels/document.xml.rels')?.async('string') || '';
const headerRels = await zip.file('word/_rels/header1.xml.rels')?.async('string') || '';
const footerRels = await zip.file('word/_rels/footer1.xml.rels')?.async('string') || '';

console.log('--- Images referenced in header1.xml.rels ---');
console.log(headerRels);

console.log('--- Images referenced in footer1.xml.rels ---');
console.log(footerRels);

// Find all r:embed in document.xml
const embedsInDoc = docXml.match(/r:embed="([^"]+)"/g);
console.log('\nr:embed in document.xml:', embedsInDoc);

// Find all r:embed in header1.xml
const embedsInHeader = headerXml.match(/r:embed="([^"]+)"/g);
console.log('r:embed in header1.xml:', embedsInHeader);

// Find all r:embed in footer1.xml
const embedsInFooter = footerXml.match(/r:embed="([^"]+)"/g);
console.log('r:embed in footer1.xml:', embedsInFooter);

