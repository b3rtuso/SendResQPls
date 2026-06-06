const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      pushToken: true
    }
  });
  console.log('--- USER PUSH TOKENS IN DATABASE ---');
  console.log(JSON.stringify(users, null, 2));
}

main()
  .catch(err => console.error(err))
  .finally(() => prisma.$disconnect());
