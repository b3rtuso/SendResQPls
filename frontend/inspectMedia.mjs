import { readFileSync } from 'fs';
import JSZip from 'jszip';

const buf = readFileSync('scratch/test_generated_daily.docx');
const zip = await JSZip.loadAsync(buf);

const img76 = zip.file('word/media/image76.png');
const img77 = zip.file('word/media/image77.png');

console.log('image76.png exists in zip?', !!img76);
console.log('image77.png exists in zip?', !!img77);

// List all files in word/media/
console.log('\nFiles in word/media/:');
for (const file of Object.keys(zip.files)) {
  if (file.startsWith('word/media/')) {
    console.log(' -', file, zip.files[file]._data ? zip.files[file]._data.uncompressedSize : 0);
  }
}
