const prisma = require('./src/config/prisma');

async function check() {
  const orgs = await prisma.organization.findMany({
    select: { id: true, name: true, subscriptionTier: true }
  });
  console.log('Orgs:', JSON.stringify(orgs, null, 2));
  
  const plans = await prisma.plan.findMany();
  console.log('Plans:', JSON.stringify(plans, null, 2));
}

check().catch(console.error).finally(() => prisma.$disconnect());
