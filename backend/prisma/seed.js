require('dotenv').config();
const prisma = require('../src/config/prisma');
const bcrypt = require('bcryptjs');

async function main() {
  console.log('🌱 Seeding Enterprise Intelligence Grid...');

  const hashedPassword = await bcrypt.hash('password123', 10);

  // 1. CLEAR EXISTING DATA (CASCADE FRIENDLY)
  // Disable foreign key checks for thorough reset if needed, but here we just delete in order
  await prisma.client.deleteMany();
  await prisma.supportTicket.deleteMany();
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.callQA.deleteMany();
  await prisma.call.deleteMany();
  await prisma.task.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.company.deleteMany();
  await prisma.team.deleteMany();
  await prisma.user.deleteMany();

  // 2. INTERNAL STAFF PROTOCOLS
  const admin = await prisma.user.create({
    data: { name: 'Institutional Admin', email: 'admin@crm.com', password: hashedPassword, role: 'ADMIN' }
  });

  const manager = await prisma.user.create({
    data: { name: 'Operations Manager', email: 'manager@crm.com', password: hashedPassword, role: 'MANAGER' }
  });

  const agent1 = await prisma.user.create({
    data: { name: 'Field Agent Alpha', email: 'agent1@crm.com', password: hashedPassword, role: 'AGENT' }
  });

  // 3. CLIENT REPOSITORY (ACME & NOVA)
  const clients = [
    { name: 'ACME Corp Admin', email: 'client@acme.com', corp: 'ACME Corp Solutions' },
    { name: 'Nova Director', email: 'client@nova.com', corp: 'Nova Enterprises' }
  ];

  for (const c of clients) {
    const client = await prisma.client.create({
      data: {
        name: c.name,
        email: c.email.toLowerCase().trim(),
        password: hashedPassword,
        companyName: c.corp,
        status: 'ACTIVE'
      }
    });

    // Create 2 Companies per Client
    const comp1 = await prisma.company.create({
      data: { clientId: client.id, name: `${c.corp} North America`, location: 'New York, USA', industry: 'Logistics' }
    });
    const comp2 = await prisma.company.create({
      data: { clientId: client.id, name: `${c.corp} EMEA Hub`, location: 'Berlin, DE', industry: 'Energy' }
    });

    // Create 5 Leads for each company
    for (const comp of [comp1, comp2]) {
      for (let i = 1; i <= 5; i++) {
        await prisma.lead.create({
          data: {
            customerName: `Lead Node ${i} - ${comp.name}`,
            email: `lead${i}@${comp.name.toLowerCase().replace(/\s/g, '')}.com`,
            phone: `+12345678${i}`,
            source: 'GOOGLE_ADS',
            status: i % 2 === 0 ? 'WON' : 'NEW',
            companyId: comp.id,
            assignedToId: agent1.id
          }
        });
      }
    }

    // Create a Support Ticket
    await prisma.supportTicket.create({
      data: {
        clientId: client.id,
        subject: `Institutional Inquiry - ${c.corp}`,
        type: 'TECHNICAL',
        priority: 'HIGH',
        description: `Routine performance inquiry for ${c.corp} operational grid.`
      }
    });

    // Create a Sample Invoice
    await prisma.invoice.create({
      data: {
        invoiceNo: `INV-${client.id}-${Date.now().toString().slice(-4)}`,
        clientId: client.id,
        raisedById: manager.id,
        amount: 2500.00,
        status: 'PAID',
        dueDate: new Date(Date.now() + 864000000), // +10 days
        items: {
          create: [{ description: 'Managed CRM Services Q2', quantity: 1, unitPrice: 2500.00, total: 2500.00 }]
        }
      }
    });
  }

  console.log('🚀 Enterprise Seeding Complete. Neural Grid Initialized.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
