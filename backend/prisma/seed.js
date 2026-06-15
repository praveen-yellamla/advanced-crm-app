// Manually parse .env to bypass dotenvx interception
const fs = require('fs');
const path = require('path');
(function loadEnv() {
  const envPath = path.join(__dirname, '../.env');
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.substring(0, idx).trim();
    let val = trimmed.substring(idx + 1).trim();
    const commentIdx = val.indexOf(' #');
    if (commentIdx !== -1) val = val.substring(0, commentIdx).trim();
    if (!process.env[key]) process.env[key] = val;
  }
})();
const prisma = require('../src/config/prisma');
const bcrypt = require('bcryptjs');

async function main() {
  console.log('🌱 Seeding Multi-Tenant SaaS Infrastructure...');

  const hashedPassword = await bcrypt.hash('password123', 10);

  // 1. CLEANUP (Reverse Order)
  await prisma.feedback.deleteMany();
  await prisma.callQA.deleteMany();
  await prisma.call.deleteMany();
  await prisma.task.deleteMany();
  await prisma.leadActivity.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.email.deleteMany();
  await prisma.emailAccount.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.team.deleteMany();
  await prisma.organizationSetting.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.plan.deleteMany(); // Clean plans too

  // 2. CREATE PLATFORM OWNER
  const platformOwner = await prisma.user.create({
    data: {
      name: 'Platform Operator',
      email: 'saas@platform.com',
      password: hashedPassword,
      role: 'SUPER_ADMIN',
      isActive: true
    }
  });

  // 3. CREATE SUBSCRIPTION PLANS
  console.log('📦 Seeding Subscription Plans...');
  const plans = [
    {
      name: 'Starter',
      tier: 'STARTER',
      priceMonthly: 1999,
      priceYearly: 19990,
      userLimit: 5,
      leadLimit: 1000,
      aiTokenLimit: 10000,
      features: { aiAssistant: false, calling: false }
    },
    {
      name: 'Professional',
      tier: 'PROFESSIONAL',
      priceMonthly: 4999,
      priceYearly: 49990,
      userLimit: 20,
      leadLimit: 10000,
      aiTokenLimit: 50000,
      aiAssistant: true,
      callingEnabled: true,
      features: { aiAssistant: true, calling: true }
    },
    {
      name: 'Enterprise',
      tier: 'ENTERPRISE',
      priceMonthly: 14999,
      priceYearly: 149990,
      userLimit: 9999,
      leadLimit: 1000000,
      aiTokenLimit: 500000,
      aiAssistant: true,
      aiLeadScoring: true,
      callingEnabled: true,
      callRecording: true,
      automationEnabled: true,
      analyticsEnabled: true,
      features: { aiAssistant: true, calling: true, automation: true }
    }
  ];

  const createdPlans = {};
  for (const p of plans) {
    const plan = await prisma.plan.create({ data: p });
    createdPlans[p.tier] = plan;
  }

  // 4. CREATE SAMPLE ORGANIZATIONS
  const orgs = [
    { name: 'Skyline Logistics', slug: 'skyline', tier: 'ENTERPRISE' },
    { name: 'Vortex Energy', slug: 'vortex', tier: 'PROFESSIONAL' },
    { name: 'Basic Retail', slug: 'basic', tier: 'STARTER' }
  ];

  for (const orgData of orgs) {
    const org = await prisma.organization.create({
      data: {
        name: orgData.name,
        slug: orgData.slug,
        subscriptionTier: orgData.tier,
        planId: createdPlans[orgData.tier].id, // Link to plan
        status: 'ACTIVE',
        agentLimit: orgData.tier === 'ENTERPRISE' ? 100 : orgData.tier === 'PROFESSIONAL' ? 20 : 5
      }
    });

    // 4. CREATE ORG USERS
    const admin = await prisma.user.create({
      data: {
        name: `${org.name} Admin`,
        email: `admin@${org.slug}.com`,
        password: hashedPassword,
        role: 'ADMIN',
        organizationId: org.id
      }
    });

    const manager = await prisma.user.create({
      data: {
        name: `${org.name} Manager`,
        email: `manager@${org.slug}.com`,
        password: hashedPassword,
        role: 'MANAGER',
        organizationId: org.id
      }
    });

    const agent = await prisma.user.create({
      data: {
        name: `${org.name} Agent`,
        email: `agent@${org.slug}.com`,
        password: hashedPassword,
        role: 'AGENT',
        organizationId: org.id
      }
    });

    // 5. SEED LEADS FOR EACH ORG (Isolation Test)
    for (let i = 1; i <= 3; i++) {
      await prisma.lead.create({
        data: {
          organizationId: org.id,
          customerName: `Lead ${i} - ${org.name}`,
          email: `contact${i}@client-${org.slug}.com`,
          phone: `+919000000${org.id}${i}`,
          source: 'WEBHOOK',
          status: 'NEW',
          assignedToId: agent.id
        }
      });
    }

    console.log(`✅ Organization ${org.name} [${org.slug}] initialized.`);
  }

  console.log('🚀 SaaS Platform Seeded Successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
