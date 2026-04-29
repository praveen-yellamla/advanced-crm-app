require('dotenv').config();
const prisma = require('./src/config/prisma');
console.log('Prisma keys:', Object.keys(prisma).filter(k => !k.startsWith('_')));
process.exit(0);
