import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { readFileSync } from 'fs';

const buf = readFileSync('public/templates/daily-template.docx');
const zip = new PizZip(buf);

const doc = new Docxtemplater(zip, {
  paragraphLoop: true,
  linebreaks: true,
  parser: (tag) => {
    return {
      get: (scope, context) => {
        console.log(`[Tag Parser] tag: "${tag}" | scope keys:`, Object.keys(scope || {}));
        return scope[tag];
      }
    };
  }
});

const data = {
  incidents: [
    {
      time: '06:10',
      date: '22 July 2026',
      incident_type: 'Emergency',
    }
  ]
};

try {
  doc.render(data);
} catch (err) {
  console.error(err);
}
