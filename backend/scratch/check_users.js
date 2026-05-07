const prisma = require('../src/config/prisma');

async function main() {
  const users = await prisma.user.findMany({
    select: { email: true, role: true }
  });
  console.log('--- USERS IN DB ---');
  console.table(users);
  process.exit(0);
}

main();
