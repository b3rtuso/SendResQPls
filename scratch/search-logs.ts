import fs from 'fs';
import path from 'path';

const logPath = 'C:\\Users\\angel\\.gemini\\antigravity\\brain\\5038c295-8590-4f92-a70b-81195c3ea6c3\\.system_generated\\logs\\transcript.jsonl';

if (!fs.existsSync(logPath)) {
  console.error('Log file does not exist');
  process.exit(1);
}

const content = fs.readFileSync(logPath, 'utf8');
const lines = content.split('\n');

console.log('Searching logs...');
let matches = 0;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('ENETUNREACH') || line.includes('family') || line.includes('SMTP') || line.includes('nodemailer')) {
    matches++;
    console.log(`\n--- Line ${i + 1} ---`);
    console.log(line.slice(0, 1000) + (line.length > 1000 ? '...' : ''));
    if (matches >= 20) {
      console.log('Too many matches, stopping.');
      break;
    }
  }
}
