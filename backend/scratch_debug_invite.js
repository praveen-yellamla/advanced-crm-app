const { inviteUser } = require('./src/controllers/inviteController');
const prisma = require('./src/config/prisma');

async function test() {
  const req = {
    body: {
      name: 'Test User',
      email: 'test' + Date.now() + '@example.com',
      role: 'AGENT'
    },
    user: {
      id: 1,
      organizationId: 4 // Using the orgId from previous check
    }
  };

  const res = {
    status: function(s) { this.statusCode = s; return this; },
    json: function(j) { console.log('RESPONSE:', this.statusCode || 200, j); return this; }
  };

  try {
    await inviteUser(req, res);
  } catch (err) {
    console.error('CRASH:', err);
  } finally {
    await prisma.$disconnect();
  }
}

test();
