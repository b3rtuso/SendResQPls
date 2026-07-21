import { readFileSync } from 'fs';

const xml = readFileSync('scratch/test_document.xml', 'utf8');

const headerMatches = xml.match(/<w:headerReference[^>]*>/g);
const footerMatches = xml.match(/<w:footerReference[^>]*>/g);

console.log('Header references in document.xml:', headerMatches);
console.log('Footer references in document.xml:', footerMatches);

const sectPrMatches = xml.match(/<w:sectPr[\s\S]*?<\/w:sectPr>/g);
console.log('\nSection properties count:', sectPrMatches?.length);
if (sectPrMatches) {
  sectPrMatches.forEach((s, i) => console.log(`--- sectPr #${i+1} ---\n`, s));
}
