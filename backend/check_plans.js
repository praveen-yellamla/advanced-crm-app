const prisma = require('./src/config/prisma');

async function main() {
  const plans = await prisma.plan.findMany();
  console.log(JSON.stringify(plans, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
