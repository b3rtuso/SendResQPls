import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { readFileSync, writeFileSync } from 'fs';

const incs = [
  {
    id: "ccdef077-c66e-420c-a49e-c2de5cfe2765",
    createdAt: "2026-07-21T22:10:46.382Z",
    resolutionForm: {
      incidentType: "Emergency (Pending Review)",
      incidentDate: "2026-07-22",
      incidentTime: "06:10",
      incidentLocation: "Caybunga, Balayan, Batangas",
      patientName: "Ninyo Bancoro",
      patientAge: "20",
      patientSex: "Male",
      patientAddress: "Caybunga, Balayan, Batangas",
      howIncidentHappened: "Nagmahal ng avoidant",
      intoxicationSuspected: "Yes",
      mechanismOfInjury: "napunit ang puso",
      injuriesObserved: "Abrasions, Contusions",
      responderNames: "Giovanni Marco, Team Alpha",
      treatmentInterventions: "Wound cleaning, dressing, vitals monitoring",
      oxygenSaturation: "98",
      pulseRate: "80",
      bloodPressure: "120/80",
      gcsScore: "15",
      destinationFacility: "Balayan Medicare Hospital"
    }
  },
  {
    id: "3c250631-4f7e-48ee-8848-33a44beb61aa",
    createdAt: "2026-07-21T22:05:13.339Z",
    resolutionForm: {
      incidentType: "Emergency (Pending Review)",
      incidentDate: "2026-07-22",
      incidentTime: "06:05",
      incidentLocation: "Caybunga, Balayan, Batangas",
      patientName: "Ken Arizobal",
      patientAge: "21",
      patientSex: "Male",
      patientAddress: "Caybunga, Balayan, Batangas",
      howIncidentHappened: "relapse",
      intoxicationSuspected: "No",
      mechanismOfInjury: "Relapse",
      injuriesObserved: "Abrasions, Contusions",
      responderNames: "Giovanni Marco, Team Alpha",
      treatmentInterventions: "Wound cleaning, dressing, vitals monitoring",
      oxygenSaturation: "98",
      pulseRate: "80",
      bloodPressure: "120/80",
      gcsScore: "15",
      destinationFacility: "Balayan Medicare Hospital"
    }
  }
];

function formatDisplayDate(dateStrRaw) {
  if (!dateStrRaw) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStrRaw)) {
    const [y, m, d] = dateStrRaw.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    return dt.toLocaleDateString('en-PH', { day: '2-digit', month: 'long', year: 'numeric' });
  }
  return dateStrRaw;
}

const incidentData = incs.map((inc, idx) => {
  const rf = inc.resolutionForm;
  return {
    incident_no: idx + 1,
    time: rf.incidentTime,
    date: formatDisplayDate(rf.incidentDate),
    incident_type: rf.incidentType,
    location: rf.incidentLocation,

    patient_name: rf.patientName,
    patient_sex: rf.patientSex.toLowerCase(),
    patient_age: rf.patientAge,
    patient_address: rf.patientAddress,

    intoxication_detail: rf.intoxicationSuspected?.toLowerCase() === 'yes' ? 'was alcohol intoxicated, ' : '',
    mechanism_detail: rf.mechanismOfInjury ? `crashed / suffered ${rf.mechanismOfInjury.toLowerCase()}, ` : '',
    injuries_observed: rf.injuriesObserved ? rf.injuriesObserved.toLowerCase() : 'minor injuries',

    responders: rf.responderNames,
    interventions_detail: rf.treatmentInterventions ? `${rf.treatmentInterventions.toLowerCase()}, ` : '',
    vitals_detail: `an SaO₂ of ${rf.oxygenSaturation || '98%'}, pulse rate of ${rf.pulseRate || '80 bpm'}, blood pressure of ${rf.bloodPressure || '120/80 mmHg'}, and a GCS of ${rf.gcsScore || '15'}`,
    disposition_detail: `immediately transported to ${rf.destinationFacility} for further hospital treatment`,

    procedure_photo_xml: '',
  };
});

try {
  const buf = readFileSync('public/templates/daily-template.docx');
  const zip = new PizZip(buf);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    nullGetter: () => '',
  });

  doc.render({
    report_date: '22 July 2026',
    total_incidents: incs.length,
    incidents: incidentData,
  });

  const outBuf = doc.getZip().generate({ type: 'nodebuffer', compression: 'DEFLATE' });
  writeFileSync('scratch/test_live_3_output.docx', outBuf);

  console.log('✅ Rendered live 3 incidents successfully! File size:', outBuf.length, 'bytes');

  // Extract text from generated XML to verify text content
  const outZip = new PizZip(outBuf);
  const outXml = outZip.file('word/document.xml').asText();
  const textMatches = outXml.match(/<w:t[^>]*>(.*?)<\/w:t>/g).map(t => t.replace(/<[^>]+>/g, ''));
  console.log('\n--- EXTRACTED DOCUMENT TEXT PREVIEW ---');
  console.log(textMatches.join(' ').substring(0, 1000));

} catch (err) {
  console.error('❌ Render error:', err);
}
