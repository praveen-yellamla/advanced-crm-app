const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- DB RECOVERY START ---');
  try {
    // 1. Manually update existing organizations to a placeholder tier if they exist
    // Since the enum is changing, we might need to use raw SQL if the client is already broken
    await prisma.$executeRawUnsafe(`UPDATE organizations SET subscription_tier = 'STANDARD' WHERE subscription_tier IS NOT NULL`);
    console.log('Successfully normalized existing tiers.');
  } catch (e) {
    console.error('Raw SQL failed:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
