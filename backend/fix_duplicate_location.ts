import { prisma } from './src/config/db';

function cleanLoc(raw) {
  if (!raw || !raw.trim()) return 'Balayan, Batangas';
  let str = raw.trim();
  str = str.replace(/,\s*Balayan,\s*Batangas/gi, '');
  str = str.replace(/,\s*Balayan/gi, '');
  str = str.replace(/,\s*Batangas/gi, '');
  return `${str.trim()}, Balayan, Batangas`;
}

async function fixLocations() {
  const forms = await prisma.resolutionForm.findMany();
  console.log('Cleaning', forms.length, 'resolution forms in DB...');

  for (const f of forms) {
    const cleanedLoc = cleanLoc(f.incidentLocation);
    const cleanedAddr = cleanLoc(f.patientAddress);

    await prisma.resolutionForm.update({
      where: { id: f.id },
      data: {
        incidentLocation: cleanedLoc,
        patientAddress: cleanedAddr,
      }
    });
    console.log(`Updated form ${f.id.slice(0, 8)}: loc = "${cleanedLoc}" | addr = "${cleanedAddr}"`);
  }
}

fixLocations().finally(() => prisma.$disconnect());
