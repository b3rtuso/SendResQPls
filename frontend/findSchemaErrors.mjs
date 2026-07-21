import { readFileSync } from 'fs';

const xml = readFileSync('scratch/test_document.xml', 'utf8');

// 1. Check for nested <w:p>
let pDepth = 0;
let nestedPCount = 0;
const pTagRegex = /<\/?w:p\b[^>]*>/g;
let match;
while ((match = pTagRegex.exec(xml)) !== null) {
  if (match[0].startsWith('</')) {
    pDepth--;
  } else if (!match[0].endsWith('/>')) {
    pDepth++;
    if (pDepth > 1) {
      nestedPCount++;
      console.log(`🚨 Nested <w:p> found at pos ${match.index}! Depth: ${pDepth}`);
    }
  }
}

// 2. Check for nested <w:r>
let rDepth = 0;
let nestedRCount = 0;
const rTagRegex = /<\/?w:r\b[^>]*>/g;
while ((match = rTagRegex.exec(xml)) !== null) {
  if (match[0].startsWith('</')) {
    rDepth--;
  } else if (!match[0].endsWith('/>')) {
    rDepth++;
    if (rDepth > 1) {
      nestedRCount++;
      console.log(`🚨 Nested <w:r> found at pos ${match.index}! Depth: ${rDepth}`);
    }
  }
}

console.log(`Nested <w:p> count: ${nestedPCount}`);
console.log(`Nested <w:r> count: ${nestedRCount}`);
