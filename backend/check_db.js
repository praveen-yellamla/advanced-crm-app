require('dotenv').config();
const prisma = require('./src/config/prisma');

async function check() {
  const users = await prisma.user.findMany({ select: { id: true, name: true, role: true, teamId: true } });
  const teams = await prisma.team.findMany({ select: { id: true, teamName: true, managerId: true } });
  console.log('--- USERS ---');
  console.log(users);
  console.log('--- TEAMS ---');
  console.log(teams);
  process.exit(0);
}

check();
