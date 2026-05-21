const prisma = require('./src/config/prisma');

async function main() {
  try {
    const fields = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'email_accounts';
    `;
    console.log('--- EMAIL_ACCOUNTS FIELDS ---');
    console.log(fields);
  } catch (error) {
    console.error('Error fetching columns:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
