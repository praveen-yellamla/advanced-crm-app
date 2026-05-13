const prisma = require('../src/config/prisma');
console.log(Object.keys(prisma).filter(k => k.toLowerCase().includes('usage')));
process.exit(0);
