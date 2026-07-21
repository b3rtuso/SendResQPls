import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const incs = await prisma.incident.findMany({
    include: { resolutionForm: true },
    orderBy: { createdAt: 'desc' },
    take: 15
  });
  console.log('Total incidents:', incs.length);
  incs.forEach(i => {
    console.log(
      i.id.slice(0,8),
      i.aiDetectedType,
      i.status,
      'createdAt UTC:', i.createdAt.toISOString(),
      'PHT:', new Date(i.createdAt).toLocaleString('en-PH', { timeZone: 'Asia/Manila' }),
      'resolutionDate:', i.resolutionForm?.incidentDate || 'NONE'
    );
  });
}
main().finally(() => prisma.$disconnect());
