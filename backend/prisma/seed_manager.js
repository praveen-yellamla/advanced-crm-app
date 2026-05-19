const prisma = require('../src/config/prisma');
const bcrypt = require('bcryptjs');

async function main() {
  console.log('🌱 Seeding Premium Manager Dashboard Sandbox...');

  // 1. Get Vortex Energy organization
  const org = await prisma.organization.findFirst({
    where: { slug: 'vortex' }
  });

  if (!org) {
    console.error('❌ Vortex Energy organization not found. Please run baseline seed first.');
    process.exit(1);
  }

  // Find or create the manager
  let manager = await prisma.user.findFirst({
    where: { email: 'manager@vortex.com' }
  });

  if (!manager) {
    const hashedPassword = await bcrypt.hash('password123', 10);
    manager = await prisma.user.create({
      data: {
        name: 'Vortex Manager',
        email: 'manager@vortex.com',
        password: hashedPassword,
        role: 'MANAGER',
        organizationId: org.id
      }
    });
  }

  console.log(`Found manager: ${manager.name} (${manager.id})`);

  // Clean old team and leads to prevent duplicate constraint issues
  console.log('🧹 Cleaning old Vortex data for a clean sandbox...');
  await prisma.feedback.deleteMany({ where: { organizationId: org.id } });
  await prisma.qAScore.deleteMany({ where: { organizationId: org.id } });
  await prisma.callAnnotation.deleteMany({ where: { organizationId: org.id } });
  await prisma.callQA.deleteMany({ where: { organizationId: org.id } });
  await prisma.call.deleteMany({ where: { organizationId: org.id } });
  await prisma.task.deleteMany({ where: { organizationId: org.id } });
  await prisma.leadActivity.deleteMany({ where: { organizationId: org.id } });
  await prisma.lead.deleteMany({ where: { organizationId: org.id } });
  await prisma.invoiceItem.deleteMany({ where: { invoice: { organizationId: org.id } } });
  await prisma.invoice.deleteMany({ where: { organizationId: org.id } });
  await prisma.email.deleteMany({ where: { organizationId: org.id } });
  await prisma.team.deleteMany({ where: { organizationId: org.id } });

  // 2. Create the managed team
  const team = await prisma.team.create({
    data: {
      organizationId: org.id,
      teamName: 'Vortex Outbound Sales',
      managerId: manager.id,
      isActive: true
    }
  });

  console.log(`Created team: ${team.teamName} (${team.id})`);

  // Update manager's teamId
  await prisma.user.update({
    where: { id: manager.id },
    data: { teamId: team.id }
  });

  // 3. Create 4 Agents
  const agentNames = [
    { name: 'Sarah Connor', email: 'sarah@vortex.com' },
    { name: 'John Doe', email: 'john@vortex.com' },
    { name: 'Jane Smith', email: 'jane@vortex.com' },
    { name: 'Alex Mercer', email: 'alex@vortex.com' }
  ];

  const hashedPassword = await bcrypt.hash('password123', 10);
  const agents = [];

  for (const ag of agentNames) {
    const agent = await prisma.user.create({
      data: {
        name: ag.name,
        email: ag.email,
        password: hashedPassword,
        role: 'AGENT',
        organizationId: org.id,
        teamId: team.id,
        managerId: manager.id,
        isActive: true,
        profileImage: `https://api.dicebear.com/7.x/avataaars/svg?seed=${ag.name.replace(' ', '')}`
      }
    });
    agents.push(agent);
  }

  console.log(`Created 4 Agents: ${agents.map(a => a.name).join(', ')}`);

  // 4. Create 50 Leads
  console.log('⚡ Generating 50 Leads...');
  const leadStatuses = ['NEW', 'CONTACTED', 'INTERESTED', 'FOLLOW_UP', 'WON', 'LOST'];
  const leadSources = ['GOOGLE_ADS', 'META', 'WEBSITE', 'CSV'];
  const firstNames = ['James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Elizabeth', 'William', 'Linda', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas'];

  const leads = [];
  for (let i = 1; i <= 50; i++) {
    const fName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const customerName = `${fName} ${lName}`;
    const email = `${fName.toLowerCase()}.${lName.toLowerCase()}${i}@sandbox.com`;
    const phone = `+1815949${1000 + i}`;
    const source = leadSources[Math.floor(Math.random() * leadSources.length)];
    const status = leadStatuses[Math.floor(Math.random() * leadStatuses.length)];
    const score = Math.floor(Math.random() * 60) + 40; // 40-100 AI Score
    const assignedAgent = agents[Math.floor(Math.random() * agents.length)];

    const lead = await prisma.lead.create({
      data: {
        organizationId: org.id,
        customerName,
        email,
        phone,
        source,
        status,
        score,
        assignedToId: assignedAgent.id,
        aiSummary: `AI Summary for ${customerName}: High purchase intent on Vortex Renewable Energy packages. Preferred contact via phone.`
      }
    });
    leads.push(lead);
  }

  // 5. Create 200 Calls (over last 14 days)
  console.log('📞 Seeding 200 Calls...');
  const callDispositions = ['Connected', 'Voicemail', 'Busy', 'Failed', 'No Answer'];
  const sentiments = ['POSITIVE', 'NEUTRAL', 'NEGATIVE'];
  const callTags = ['Coaching Flag', 'QC Passed', 'Needs Review', 'Interested', 'Objection Met', 'Callback Scheduled'];

  const calls = [];
  for (let i = 0; i < 200; i++) {
    const agent = agents[Math.floor(Math.random() * agents.length)];
    const lead = leads[Math.floor(Math.random() * leads.length)];
    const duration = Math.floor(Math.random() * 400) + 15; // 15-415 seconds
    const disposition = callDispositions[Math.floor(Math.random() * callDispositions.length)];
    const sentiment = sentiments[Math.floor(Math.random() * sentiments.length)];
    const isFlagged = Math.random() > 0.85;
    const tag = isFlagged ? 'Coaching Flag' : callTags[Math.floor(Math.random() * callTags.length)];

    // Spread over last 14 days
    const callDate = new Date();
    callDate.setDate(callDate.getDate() - Math.floor(Math.random() * 14));
    callDate.setHours(Math.floor(Math.random() * 12) + 8, Math.floor(Math.random() * 60), 0, 0);

    const call = await prisma.call.create({
      data: {
        organizationId: org.id,
        leadId: lead.id,
        agentId: agent.id,
        phone: lead.phone,
        status: duration > 40 ? 'Completed' : 'Failed',
        duration,
        recordingUrl: duration > 40 ? 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' : null,
        transcript: `[Agent ${agent.name}] Hello, is this ${lead.customerName}? [Customer] Yes, speaking. [Agent] I am calling from Vortex Energy regarding solar packages...`,
        summary: `Productive discussion with ${lead.customerName}. Interested in pricing plans.`,
        notes: `Customer requested follow-up next Tuesday.`,
        tags: tag,
        disposition,
        sentiment,
        createdAt: callDate
      }
    });
    calls.push(call);

    // Seed annotations for some calls
    if (duration > 120 && Math.random() > 0.7) {
      await prisma.callAnnotation.create({
        data: {
          organizationId: org.id,
          callId: call.id,
          managerId: manager.id,
          timestamp: 30.5,
          note: 'Excellent intro here, established warm rapport.'
        }
      });
      await prisma.callAnnotation.create({
        data: {
          organizationId: org.id,
          callId: call.id,
          managerId: manager.id,
          timestamp: 92.2,
          note: 'Great pitch on clean energy ROI, handle objections confidently.'
        }
      });
    }

    // Seed QA Scores for some calls
    if (duration > 60 && Math.random() > 0.8) {
      const greeting = Math.floor(Math.random() * 5) + 15; // 15-20
      const discovery = Math.floor(Math.random() * 5) + 15;
      const pitch = Math.floor(Math.random() * 5) + 15;
      const objection = Math.floor(Math.random() * 5) + 15;
      const closing = Math.floor(Math.random() * 5) + 15;
      const total = greeting + discovery + pitch + objection + closing;

      await prisma.qAScore.create({
        data: {
          organizationId: org.id,
          callId: call.id,
          managerId: manager.id,
          greeting,
          discovery,
          pitch,
          objection,
          closing,
          total,
          notes: 'Agent followed script perfectly and handled competitor objection masterfully.'
        }
      });
    }
  }

  // 6. Create 20 Tasks
  console.log('📝 Seeding 20 Tasks...');
  const taskPriorities = ['High', 'Normal', 'Low'];
  const taskTypes = ['Call Back', 'Email', 'Meeting', 'Follow-Up'];

  for (let i = 1; i <= 20; i++) {
    const agent = agents[Math.floor(Math.random() * agents.length)];
    const lead = leads[Math.floor(Math.random() * leads.length)];
    const priority = taskPriorities[Math.floor(Math.random() * taskPriorities.length)];
    const type = taskTypes[Math.floor(Math.random() * taskTypes.length)];
    const isCompleted = Math.random() > 0.5;
    const isOverdue = !isCompleted && Math.random() > 0.5;

    const dueDate = new Date();
    if (isOverdue) {
      dueDate.setDate(dueDate.getDate() - Math.floor(Math.random() * 5) - 1); // past
    } else {
      dueDate.setDate(dueDate.getDate() + Math.floor(Math.random() * 5) + 1); // future
    }

    await prisma.task.create({
      data: {
        organizationId: org.id,
        title: `${type} with ${lead.customerName}`,
        description: `Follow up task assigned to ${agent.name} regarding Vortex Solar quote.`,
        dueDate,
        priority,
        status: isCompleted ? 'COMPLETED' : 'PENDING',
        type: type.toUpperCase().replace('-', ''),
        assignedToId: agent.id,
        leadId: lead.id
      }
    });
  }

  // 7. Create 10 Invoices
  console.log('💳 Seeding 10 Invoices...');
  const invoiceStatuses = ['PAID', 'SENT', 'OVERDUE'];

  for (let i = 1; i <= 10; i++) {
    const agent = agents[Math.floor(Math.random() * agents.length)];
    const lead = leads[Math.floor(Math.random() * leads.length)];
    const status = invoiceStatuses[Math.floor(Math.random() * invoiceStatuses.length)];
    const amount = [12000, 24000, 48000, 75000, 95000][Math.floor(Math.random() * 5)];

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 15);

    const invoice = await prisma.invoice.create({
      data: {
        organizationId: org.id,
        invoiceNo: `VTX-INV-2026-${1000 + i}`,
        raisedById: agent.id,
        amount,
        status,
        dueDate
      }
    });

    await prisma.invoiceItem.create({
      data: {
        invoiceId: invoice.id,
        description: 'Vortex Residential Solar Panel Installation Package',
        quantity: 1,
        unitPrice: amount,
        total: amount
      }
    });
  }

  // 8. Seed Feedbacks
  console.log('📣 Seeding Agent Feedbacks...');
  for (const agent of agents) {
    await prisma.feedback.create({
      data: {
        organizationId: org.id,
        agentId: agent.id,
        managerId: manager.id,
        content: 'Sarah has shown stellar performance this week in close rates. Recommended to document objection strategies for team sharing.',
        type: 'PRAISE'
      }
    });
    await prisma.feedback.create({
      data: {
        organizationId: org.id,
        agentId: agent.id,
        managerId: manager.id,
        content: 'Please review lead follow-up times. Several task cards are currently overdue.',
        type: 'COACHING'
      }
    });
  }

  // 9. Seed Emails
  console.log('📧 Seeding Emails...');
  for (let i = 0; i < 15; i++) {
    const agent = agents[Math.floor(Math.random() * agents.length)];
    const lead = leads[Math.floor(Math.random() * leads.length)];
    await prisma.email.create({
      data: {
        organizationId: org.id,
        leadId: lead.id,
        agentId: agent.id,
        subject: 'Vortex Energy Systems - Your Solar Estimate Proposal',
        content: 'Hello, Attached is the custom renewable energy proposal we prepared for you.',
        status: 'DELIVERED'
      }
    });
  }

  // 10. Seed Lead Activities
  console.log('📈 Seeding Lead Activities...');
  for (let i = 0; i < 20; i++) {
    const lead = leads[Math.floor(Math.random() * leads.length)];
    await prisma.leadActivity.create({
      data: {
        organizationId: org.id,
        leadId: lead.id,
        action: `Call Logged: duration ${Math.floor(Math.random() * 200) + 30} seconds`
      }
    });
  }

  console.log('🌟 Seeding Completed Successfully! Your Sandbox Team is Ready!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
