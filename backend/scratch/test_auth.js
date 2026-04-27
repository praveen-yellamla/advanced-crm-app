require('dotenv').config();
const prisma = require('../src/config/prisma');
const bcrypt = require('bcryptjs');

async function testAuth() {
  const email = 'client@nova.com';
  const password = 'password123';

  try {
    const client = await prisma.client.findUnique({ where: { email } });
    if (!client) {
      console.log('CLIENT NOT FOUND');
      return;
    }

    console.log('CLIENT FOUND:', client.email);
    console.log('HASH IN DB:', client.password);

    const isMatch = await bcrypt.compare(password, client.password);
    console.log('PASSWORD MATCH:', isMatch);

  } catch (err) {
    console.error('ERROR:', err);
  } finally {
    await prisma.$disconnect();
  }
}

testAuth();
