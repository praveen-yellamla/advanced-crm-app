const { PrismaClient } = require('@prisma/client');
const { PrismaLibSql } = require('@prisma/adapter-libsql');
const { createClient } = require('@libsql/client');
const fs = require('fs');
const path = require('path');

// Manually parse .env to bypass dotenvx interception
(function loadEnv() {
  const envPath = path.join(__dirname, '../../.env');
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.substring(0, idx).trim();
    let val = trimmed.substring(idx + 1).trim();
    const commentIdx = val.indexOf(' #');
    if (commentIdx !== -1) val = val.substring(0, commentIdx).trim();
    if (!process.env[key]) process.env[key] = val;
  }
})();

const connectionString = process.env.DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!connectionString) {
  console.error("DATABASE_URL is missing!");
}

const adapter = new PrismaLibSql({
  url: connectionString,
  authToken: authToken
});
const basePrisma = new PrismaClient({ adapter });

// Helper to safely serialize tags array to a string
const serializeTags = (tags) => {
  if (Array.isArray(tags)) {
    return tags.join(',');
  }
  return tags;
};

// Helper to safely deserialize tags string back to an array
const deserializeTags = (task) => {
  if (task && typeof task.tags === 'string') {
    task.tags = task.tags ? task.tags.split(',').filter(Boolean) : [];
  }
  return task;
};

const prisma = basePrisma.$extends({
  query: {
    task: {
      async create({ args, query }) {
        if (args.data && args.data.tags !== undefined) {
          args.data.tags = serializeTags(args.data.tags);
        }
        const task = await query(args);
        return deserializeTags(task);
      },
      async createMany({ args, query }) {
        if (args.data) {
          const items = Array.isArray(args.data) ? args.data : [args.data];
          for (const item of items) {
            if (item.tags !== undefined) {
              item.tags = serializeTags(item.tags);
            }
          }
        }
        return query(args);
      },
      async update({ args, query }) {
        if (args.data && args.data.tags !== undefined) {
          args.data.tags = serializeTags(args.data.tags);
        }
        const task = await query(args);
        return deserializeTags(task);
      },
      async updateMany({ args, query }) {
        if (args.data && args.data.tags !== undefined) {
          args.data.tags = serializeTags(args.data.tags);
        }
        return query(args);
      },
      async upsert({ args, query }) {
        if (args.create && args.create.tags !== undefined) {
          args.create.tags = serializeTags(args.create.tags);
        }
        if (args.update && args.update.tags !== undefined) {
          args.update.tags = serializeTags(args.update.tags);
        }
        const task = await query(args);
        return deserializeTags(task);
      },
      async findMany({ args, query }) {
        const tasks = await query(args);
        if (Array.isArray(tasks)) {
          tasks.forEach(deserializeTags);
        }
        return tasks;
      },
      async findUnique({ args, query }) {
        const task = await query(args);
        return deserializeTags(task);
      },
      async findFirst({ args, query }) {
        const task = await query(args);
        return deserializeTags(task);
      }
    }
  }
});

module.exports = prisma;
