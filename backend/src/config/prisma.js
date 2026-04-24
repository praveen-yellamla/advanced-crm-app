const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;

const pool = new Pool({ 
  connectionString,
  // Enable SSL for production (Render) to prevent Access Denied errors
  ssl: connectionString.includes('render.com') || process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false } 
    : false 
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

module.exports = prisma;
