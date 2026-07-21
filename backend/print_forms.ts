import { prisma } from './src/config/db';

async function printFullForm() {
  const incs = await prisma.incident.findMany({
    where: {
      id: {
        in: [
          'ccdef077-c66e-420c-a49e-c2de5cfe2765',
          '3c250631-4f7e-48ee-8848-33a44beb61aa',
          'c22937f9-5b7d-4822-af84-5af5fb0db6a3'
        ]
      }
    },
    include: { resolutionForm: true }
  });

  console.log('=== FULL RESOLUTION FORM DETAILS ===');
  incs.forEach((i, idx) => {
    console.log(`\nIncident #${idx + 1} (${i.id.slice(0, 8)}):`);
    console.log(JSON.stringify(i.resolutionForm, null, 2));
  });
}

printFullForm().finally(() => prisma.$disconnect());
