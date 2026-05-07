require('dotenv').config();
const prisma = require('../src/config/prisma');

async function main() {
  console.log('--- SEEDING SaaS PLANS ---');
  
  // 1. Create STARTER plan
  const starter = await prisma.plan.upsert({
    where: { tier: 'STARTER' },
    update: {
      name: 'Starter',
      priceMonthly: 999,
      priceYearly: 9999,
      userLimit: 5,
      leadLimit: 1000,
      aiTokenLimit: 10000,
      storageLimitMb: 512,
      aiAssistant: false,
      aiLeadScoring: false,
      callingEnabled: false,
      callRecording: false,
      monitoringEnabled: false,
      automationEnabled: false,
      analyticsEnabled: false,
      features: { 
        tagline: "Best for small teams",
        included: ["Leads", "Contacts", "Tasks", "Email Integration", "Basic Reports"],
        excluded: ["AI Assistant", "Call Recording", "Advanced Analytics", "Automations"]
      }
    },
    create: {
      name: 'Starter',
      tier: 'STARTER',
      priceMonthly: 999,
      priceYearly: 9999,
      userLimit: 5,
      leadLimit: 1000,
      aiTokenLimit: 10000,
      storageLimitMb: 512,
      aiAssistant: false,
      features: { 
        tagline: "Best for small teams",
        included: ["Leads", "Contacts", "Tasks", "Email Integration", "Basic Reports"],
        excluded: ["AI Assistant", "Call Recording", "Advanced Analytics", "Automations"]
      }
    }
  });

  // 2. Create PROFESSIONAL plan
  const professional = await prisma.plan.upsert({
    where: { tier: 'PROFESSIONAL' },
    update: {
      name: 'Professional',
      priceMonthly: 4999,
      priceYearly: 49999,
      userLimit: 25,
      leadLimit: 25000,
      aiTokenLimit: 100000,
      storageLimitMb: 10240,
      aiAssistant: true,
      aiLeadScoring: true,
      callingEnabled: true,
      callRecording: true,
      monitoringEnabled: false,
      automationEnabled: true,
      analyticsEnabled: true,
      features: { 
        tagline: "Most Popular",
        included: ["Everything in Starter", "AI Assistant", "AI Lead Scoring", "Twilio Calling", "Call Recording", "Workflow Automation", "Advanced Analytics", "SMTP + IMAP"],
        excluded: ["Manager Monitoring", "Custom Branding"]
      }
    },
    create: {
      name: 'Professional',
      tier: 'PROFESSIONAL',
      priceMonthly: 4999,
      priceYearly: 49999,
      userLimit: 25,
      leadLimit: 25000,
      aiTokenLimit: 100000,
      storageLimitMb: 10240,
      aiAssistant: true,
      aiLeadScoring: true,
      callingEnabled: true,
      callRecording: true,
      automationEnabled: true,
      analyticsEnabled: true,
      features: { 
        tagline: "Most Popular",
        included: ["Everything in Starter", "AI Assistant", "AI Lead Scoring", "Twilio Calling", "Call Recording", "Workflow Automation", "Advanced Analytics", "SMTP + IMAP"],
        excluded: ["Manager Monitoring", "Custom Branding"]
      }
    }
  });

  // 3. Create ENTERPRISE plan
  const enterprise = await prisma.plan.upsert({
    where: { tier: 'ENTERPRISE' },
    update: {
      name: 'Enterprise',
      priceMonthly: 14999,
      priceYearly: 149999,
      userLimit: 9999,
      leadLimit: 9999999,
      aiTokenLimit: 1000000,
      storageLimitMb: 102400,
      aiAssistant: true,
      aiLeadScoring: true,
      callingEnabled: true,
      callRecording: true,
      monitoringEnabled: true,
      automationEnabled: true,
      analyticsEnabled: true,
      customBranding: true,
      prioritySupport: true,
      features: { 
        tagline: "For large organizations",
        included: ["Everything in Professional", "Live Monitoring", "QA Center", "Sentiment Analysis", "AI Transcription", "Predictive Analytics", "Custom Branding", "Audit Logs", "Enterprise Security", "Priority Support"],
        excluded: []
      }
    },
    create: {
      name: 'Enterprise',
      tier: 'ENTERPRISE',
      priceMonthly: 14999,
      priceYearly: 149999,
      userLimit: 9999,
      leadLimit: 9999999,
      aiTokenLimit: 1000000,
      storageLimitMb: 102400,
      aiAssistant: true,
      aiLeadScoring: true,
      callingEnabled: true,
      callRecording: true,
      monitoringEnabled: true,
      automationEnabled: true,
      analyticsEnabled: true,
      customBranding: true,
      prioritySupport: true,
      features: { 
        tagline: "For large organizations",
        included: ["Everything in Professional", "Live Monitoring", "QA Center", "Sentiment Analysis", "AI Transcription", "Predictive Analytics", "Custom Branding", "Audit Logs", "Enterprise Security", "Priority Support"],
        excluded: []
      }
    }
  });

  console.log('Plans created/updated.');

  // 4. Update limits for all organizations based on their current plan
  const orgs = await prisma.organization.findMany({ include: { plan: true } });
  for (const org of orgs) {
    if (org.plan) {
      await prisma.organization.update({
        where: { id: org.id },
        data: {
          agentLimit: org.plan.userLimit,
          leadLimit: org.plan.leadLimit,
          aiTokenLimit: org.plan.aiTokenLimit,
          storageLimitMb: org.plan.storageLimitMb
        }
      });
    }
  }

  console.log(`Updated ${orgs.length} organizations with new plan limits.`);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
