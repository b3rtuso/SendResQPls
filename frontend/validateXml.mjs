import { readFileSync } from 'fs';
import { parseString } from 'xml2js'; // or native DOMParser/xmldom

const xml = readFileSync('scratch/test_document.xml', 'utf8');

// Simple XML syntax validator using Node native or basic check
let stack = [];
let pos = 0;
let errors = [];

// Quick tag matching
const tagRegex = /<\/?([a-zA-Z0-9:]+)([^>]*)\/?>/g;
let match;
while ((match = tagRegex.exec(xml)) !== null) {
  const fullTag = match[0];
  const tagName = match[1];
  const isClosing = fullTag.startsWith('</');
  const isSelfClosing = fullTag.endsWith('/>');

  if (isSelfClosing) continue;
  if (!isClosing) {
    stack.push({ tagName, index: match.index });
  } else {
    if (stack.length === 0) {
      errors.push(`Unmatched closing tag </${tagName}> at pos ${match.index}`);
    } else {
      const top = stack.pop();
      if (top.tagName !== tagName) {
        errors.push(`Mismatch: expected </${top.tagName}> but found </${tagName}> at pos ${match.index}`);
      }
    }
  }
}

if (stack.length > 0) {
  errors.push(`Unclosed tags remaining: ${stack.map(s => s.tagName).join(', ')}`);
}

if (errors.length === 0) {
  console.log('✅ XML syntax validation PASSED with 0 syntax errors!');
} else {
  console.log('❌ XML syntax errors found:', errors.slice(0, 10));
}
