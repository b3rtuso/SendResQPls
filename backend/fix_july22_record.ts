import { prisma } from './src/config/db';

async function main() {
  const incident = await prisma.incident.findFirst({
    where: { id: { startsWith: 'c22937f9' } },
    include: { resolutionForm: true }
  });

  if (!incident || !incident.resolutionForm) {
    console.log('Incident or ResolutionForm not found!');
    return;
  }

  await prisma.resolutionForm.update({
    where: { id: incident.resolutionForm.id },
    data: { incidentDate: '2026-07-22' }
  });

  console.log(`Successfully updated incident ${incident.id} resolutionForm.incidentDate to 2026-07-22`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
