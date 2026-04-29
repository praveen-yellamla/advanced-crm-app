require('dotenv').config();
const prisma = require('../src/config/prisma');

async function cleanDuplicates() {
  console.log('Searching for duplicate leads...');
  
  // Find duplicate emails
  const duplicateEmails = await prisma.$queryRaw`
    SELECT email, COUNT(*) 
    FROM leads 
    WHERE email IS NOT NULL 
    GROUP BY email 
    HAVING COUNT(*) > 1
  `;
  
  console.log(`Found ${duplicateEmails.length} duplicate email groups.`);
  
  for (const group of duplicateEmails) {
    const leads = await prisma.lead.findMany({
      where: { email: group.email },
      orderBy: { createdAt: 'asc' },
    });
    
    // Keep the first one, delete the rest
    const idsToDelete = leads.slice(1).map(l => l.id);
    await prisma.lead.deleteMany({
      where: { id: { in: idsToDelete } }
    });
    console.log(`Deleted ${idsToDelete.length} duplicates for email ${group.email}`);
  }

  // Find duplicate phones
  const duplicatePhones = await prisma.$queryRaw`
    SELECT phone, COUNT(*) 
    FROM leads 
    GROUP BY phone 
    HAVING COUNT(*) > 1
  `;
  
  console.log(`Found ${duplicatePhones.length} duplicate phone groups.`);
  
  for (const group of duplicatePhones) {
    const leads = await prisma.lead.findMany({
      where: { phone: group.phone },
      orderBy: { createdAt: 'asc' },
    });
    
    const idsToDelete = leads.slice(1).map(l => l.id);
    await prisma.lead.deleteMany({
      where: { id: { in: idsToDelete } }
    });
    console.log(`Deleted ${idsToDelete.length} duplicates for phone ${group.phone}`);
  }
  
  console.log('Cleanup complete.');
  process.exit(0);
}

cleanDuplicates().catch(err => {
  console.error(err);
  process.exit(1);
});
