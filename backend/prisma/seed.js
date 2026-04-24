require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ 
  connectionString,
  // Enable SSL for production (Render)
  ssl: process.env.DATABASE_URL.includes('render.com') || process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false } 
    : false 
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Clear existing data
  await prisma.call.deleteMany();
  await prisma.task.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.team.deleteMany();
  await prisma.user.deleteMany();

  // 2. Create Users
  const hashedPassword = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.create({
    data: {
      name: 'Super Admin',
      email: 'admin@crm.com',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  const manager = await prisma.user.create({
    data: {
      name: 'Sales Manager',
      email: 'manager@crm.com',
      password: hashedPassword,
      role: 'MANAGER',
    },
  });

  const agent1 = await prisma.user.create({
    data: {
      name: 'Agent One',
      email: 'agent1@crm.com',
      password: hashedPassword,
      role: 'AGENT',
    },
  });

  const agent2 = await prisma.user.create({
    data: {
      name: 'Agent Two',
      email: 'agent2@crm.com',
      password: hashedPassword,
      role: 'AGENT',
    },
  });

  console.log('✅ Users created');

  // 3. Create Team
  const salesTeam = await prisma.team.create({
    data: {
      teamName: 'Core Sales Team',
      managerId: manager.id,
    },
  });

  console.log('✅ Teams created');

  // 4. Create Leads
  const lead1 = await prisma.lead.create({
    data: {
      customerName: 'John Doe',
      phone: '+1234567890',
      email: 'john@example.com',
      source: 'GOOGLE_ADS',
      status: 'NEW',
      region: 'North America',
      language: 'English',
      assignedToId: agent1.id,
    },
  });

  const lead2 = await prisma.lead.create({
    data: {
      customerName: 'Jane Smith',
      phone: '+9876543210',
      email: 'jane@example.com',
      source: 'WEBSITE',
      status: 'INTERESTED',
      region: 'Europe',
      language: 'German',
      assignedToId: agent2.id,
    },
  });

  const lead3 = await prisma.lead.create({
    data: {
      customerName: 'Michael Brown',
      phone: '+1122334455',
      email: 'michael@example.com',
      source: 'META',
      status: 'CONTACTED',
      region: 'Asia',
      language: 'Mandarin',
      assignedToId: agent1.id,
    },
  });

  console.log('✅ Leads created');

  // 5. Create Sample Tasks
  await prisma.task.create({
    data: {
      title: 'Follow up with John Doe',
      description: 'Check if he is ready for a demo.',
      dueDate: new Date(Date.now() + 86400000), // 1 day from now
      priority: 'High',
      status: 'Pending',
      userId: agent1.id,
    },
  });

  console.log('✅ Tasks created');

  console.log('🚀 Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
