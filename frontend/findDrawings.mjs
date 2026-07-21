import { readFileSync } from 'fs';

const xml = readFileSync('scratch/test_document.xml', 'utf8');

const docPrMatches = xml.match(/<wp:docPr[^>]*>/g);
console.log('docPr tags:', docPrMatches);

const cNvPrMatches = xml.match(/<pic:cNvPr[^>]*>/g);
console.log('cNvPr tags:', cNvPrMatches);

const drawingMatches = xml.match(/<w:drawing[^>]*>/g);
console.log('drawing tags:', drawingMatches);
