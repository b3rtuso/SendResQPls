import { prisma } from './src/config/db';

async function main() {
  const incs = await prisma.incident.findMany({
    include: { resolutionForm: true, reporter: true },
    orderBy: { createdAt: 'desc' },
    take: 20
  });

  console.log('=== DATABASE INCIDENTS LIST ===');
  console.log('Total incidents found:', incs.length);
  
  incs.forEach((i, idx) => {
    console.log(`\n--- [${idx + 1}] Incident ID: ${i.id} ---`);
    console.log('  Status:', i.status);
    console.log('  AI Type:', i.aiDetectedType);
    console.log('  createdAt (UTC):', i.createdAt.toISOString());
    console.log('  createdAt (PHT):', new Date(i.createdAt).toLocaleString('en-PH', { timeZone: 'Asia/Manila' }));
    console.log('  Reporter:', i.reporter?.name || 'Unknown');
    if (i.resolutionForm) {
      console.log('  [ResolutionForm Present]:');
      console.log('    incidentType:', i.resolutionForm.incidentType);
      console.log('    incidentDate:', i.resolutionForm.incidentDate);
      console.log('    incidentTime:', i.resolutionForm.incidentTime);
      console.log('    patientName:', i.resolutionForm.patientName);
      console.log('    dispositionStatus:', i.resolutionForm.dispositionStatus);
      console.log('    destinationFacility:', i.resolutionForm.destinationFacility);
    } else {
      console.log('  [ResolutionForm]: NONE (null)');
    }
  });
}

main().finally(() => prisma.$disconnect());
