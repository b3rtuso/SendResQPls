import { prisma } from './src/config/db';

async function testQuery() {
  const from = '2026-07-22';
  const to = '2026-07-22';

  const where: any = {};
  const dateConditions: any[] = [];
  
  const createdAtCond: any = {};
  if (from) createdAtCond.gte = new Date(`${from}T00:00:00+08:00`);
  if (to)   createdAtCond.lte = new Date(`${to}T23:59:59.999+08:00`);
  if (Object.keys(createdAtCond).length > 0) {
    dateConditions.push({ createdAt: createdAtCond });
  }

  const resDateCond: any = {};
  if (from) resDateCond.gte = from;
  if (to)   resDateCond.lte = to;
  if (Object.keys(resDateCond).length > 0) {
    dateConditions.push({
      resolutionForm: {
        incidentDate: resDateCond,
      },
    });
  }

  if (dateConditions.length > 0) {
    where.OR = dateConditions;
  }

  console.log('Constructed where object:', JSON.stringify(where, null, 2));

  const results = await prisma.incident.findMany({
    where,
    include: { resolutionForm: true, reporter: true },
    orderBy: { createdAt: 'desc' },
  });

  console.log('Query result count:', results.length);
  results.forEach(r => {
    console.log('Found:', r.id, '| Patient:', r.resolutionForm?.patientName, '| Date:', r.resolutionForm?.incidentDate);
  });
}

testQuery().finally(() => prisma.$disconnect());
