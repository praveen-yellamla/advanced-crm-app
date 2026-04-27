const prisma = require('../src/config/prisma');

async function check() {
  try {
    const clients = await prisma.client.findMany();
    console.log('CLIENTS:', JSON.stringify(clients, null, 2));
    const users = await prisma.user.findMany();
    console.log('USERS:', JSON.stringify(users.map(u => ({ email: u.email, role: u.role })), null, 2));
  } catch (err) {
    console.error('ERROR:', err);
  } finally {
    await prisma.$disconnect();
  }
}

check();
 Deborah 
 Deborah 
 Deborah 
 Deborah 
 Deborah 
 Deborah 
 Deborah 
 Deborah 
 Deborah 
