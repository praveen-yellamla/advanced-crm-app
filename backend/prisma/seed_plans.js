const prisma = require('../src/config/prisma');

async function main() {
  console.log('Seeding plans...');

  const plans = [
    {
      name: 'Starter',
      tier: 'STARTER',
      description: 'Ideal for small teams and startups.',
      priceMonthly: 0,
      priceYearly: 0,
      userLimit: 5,
      managerLimit: 1,
      leadLimit: 1000,
      aiTokenLimit: 10000,
      storageLimitMb: 512,
      features: {
        aiAssistant: true,
        analyticsEnabled: true,
        prioritySupport: false
      }
    },
    {
      name: 'Professional',
      tier: 'PROFESSIONAL',
      description: 'Advanced features for scaling organizations.',
      priceMonthly: 1999,
      priceYearly: 19990,
      userLimit: 25,
      managerLimit: 5,
      leadLimit: 50000,
      aiTokenLimit: 250000,
      storageLimitMb: 5120,
      features: {
        aiAssistant: true,
        analyticsEnabled: true,
        prioritySupport: true,
        apiAccess: true,
        callRecording: true
      }
    },
    {
      name: 'Enterprise',
      tier: 'ENTERPRISE',
      description: 'The ultimate power for large corporations.',
      priceMonthly: 4999,
      priceYearly: 49990,
      userLimit: 1000,
      managerLimit: 100,
      leadLimit: 1000000,
      aiTokenLimit: 10000000,
      storageLimitMb: 51200,
      features: {
        aiAssistant: true,
        analyticsEnabled: true,
        prioritySupport: true,
        apiAccess: true,
        callRecording: true,
        customBranding: true,
        auditLogsEnabled: true
      }
    }
  ];

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { tier: plan.tier },
      update: plan,
      create: plan
    });
  }

  console.log('Plans seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
