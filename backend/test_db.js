const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({ select: { id: true, name: true, role: true, teamId: true } });
  const teams = await prisma.team.findMany();
  console.log('Users:', users);
  console.log('Teams:', teams);
}

main().finally(() => prisma.$disconnect());
