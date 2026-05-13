const prisma = require('../src/config/prisma');
console.log(Object.keys(prisma).filter(k => k.toLowerCase().includes('invoice')));
process.exit(0);
