import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';

const p = (t) => `<w:p><w:r><w:t>${t}</w:t></w:r></w:p>`;

const xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:body>
${p('{#incidents}')}
${p('Time: {time}')}
${p('Patient: {patient_name}')}
${p('{/incidents}')}
</w:body>
</w:document>`;

const zip = new PizZip();
zip.file('word/document.xml', xml);

const doc = new Docxtemplater(zip, {
  paragraphLoop: true,
  linebreaks: true,
});

doc.render({
  incidents: [
    { time: '06:10', patient_name: 'Ninyo Bancoro' },
    { time: '06:05', patient_name: 'Ken Arizobal' },
  ]
});

console.log('SUCCESS! Text result:');
console.log(doc.getFullText());
