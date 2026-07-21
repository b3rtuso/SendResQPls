import { prisma } from './src/config/db';
async function main() {
  const incs = await prisma.incident.findMany({
    include: { resolutionForm: true },
    orderBy: { createdAt: 'desc' },
    take: 15
  });
  console.log('Total incidents:', incs.length);
  incs.forEach(i => {
    console.log(
      'ID:', i.id.slice(0,8),
      '| Type:', i.aiDetectedType,
      '| Status:', i.status,
      '| createdAt UTC:', i.createdAt.toISOString(),
      '| PHT:', new Date(i.createdAt).toLocaleString('en-PH', { timeZone: 'Asia/Manila' }),
      '| resDate:', i.resolutionForm?.incidentDate || 'NONE',
      '| resTime:', i.resolutionForm?.incidentTime || 'NONE'
    );
  });
}
main().finally(() => prisma.$disconnect());
