const prisma = require('./src/config/prisma');

async function check() {
  try {
    const invite = await prisma.invite.findUnique({
      where: { token: 'e43487cf-3cd3-44ec-acfa-957842dfeda5' }
    });
    console.log('INVITE:', invite);
  } catch (err) {
    console.error('ERROR:', err);
  } finally {
    await prisma.$disconnect();
  }
}

check();
