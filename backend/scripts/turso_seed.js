/**
 * Standalone Turso seed script — uses @libsql/client directly.
 * No dotenv, no Prisma wrapper, no external dependencies except @libsql/client and bcryptjs.
 */

const { createClient } = require('@libsql/client');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// ── Read .env manually ────────────────────────────────────────────────────────
const envPath = path.join(__dirname, '../.env');
const env = {};
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split(/\r?\n/).forEach(line => {
    const t = line.trim();
    if (!t || t.startsWith('#')) return;
    const i = t.indexOf('=');
    if (i === -1) return;
    const key = t.slice(0, i).trim();
    let val = t.slice(i + 1).trim();
    // Strip inline comments
    const ci = val.indexOf(' #');
    if (ci !== -1) val = val.slice(0, ci).trim();
    env[key] = val;
  });
}

const DB_URL   = env.DATABASE_URL || process.env.DATABASE_URL;
const DB_TOKEN = env.TURSO_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN;

if (!DB_URL) {
  console.error('❌  DATABASE_URL missing');
  process.exit(1);
}

console.log('🔗  Connecting to:', DB_URL);

// ── Create client ─────────────────────────────────────────────────────────────
const db = createClient({ url: DB_URL, authToken: DB_TOKEN });

// ── Helper ────────────────────────────────────────────────────────────────────
async function run(sql, args = []) {
  return db.execute({ sql, args });
}

async function seed() {
  console.log('\n🌱  Seeding Turso database...\n');

  // ── Hash passwords ───────────────────────────────────────────────────────
  const hash = await bcrypt.hash('password123', 10);

  // ── 1. Clean up (safest order given FK constraints) ──────────────────────
  const tables = [
    'feedbacks', 'call_qa', 'qa_scores', 'calls', 'tasks',
    'lead_activities', 'leads', 'invoice_items', 'invoices',
    'emails', 'email_accounts', 'audit_logs', 'teams',
    'organization_settings', 'sessions', 'invites',
    'agent_invitations', 'users', 'organizations', 'plans'
  ];
  for (const t of tables) {
    try { await run(`DELETE FROM "${t}"`); } catch (_) { /* table may not exist yet */ }
  }
  console.log('🧹  Cleaned existing data');

  // ── 2. Platform super-admin (no org) ────────────────────────────────────
  const now = new Date().toISOString();
  await run(
    `INSERT INTO "users" ("name","email","password","role","is_active","created_at","updated_at")
     VALUES (?,?,?,?,?,?,?)`,
    ['Platform Operator', 'saas@platform.com', hash, 'SUPER_ADMIN', 1, now, now]
  );
  console.log('👤  Created: saas@platform.com  /  password123');

  // ── 3. Subscription plans ────────────────────────────────────────────────
  const plans = [
    { name: 'Starter',      tier: 'STARTER',      pm: 1999,  py: 19990,  ul: 5,    ll: 1000,    ai: 10000,  features: JSON.stringify({ aiAssistant: false, calling: false }) },
    { name: 'Professional', tier: 'PROFESSIONAL',  pm: 4999,  py: 49990,  ul: 20,   ll: 10000,   ai: 50000,  features: JSON.stringify({ aiAssistant: true, calling: true }) },
    { name: 'Enterprise',   tier: 'ENTERPRISE',    pm: 14999, py: 149990, ul: 9999, ll: 1000000, ai: 500000, features: JSON.stringify({ aiAssistant: true, calling: true, automation: true }) },
  ];
  const planIds = {};
  for (const p of plans) {
    const res = await run(
      `INSERT INTO "plans" ("name","tier","price_monthly","price_yearly","user_limit","lead_limit","ai_token_limit","features","created_at","updated_at")
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [p.name, p.tier, p.pm, p.py, p.ul, p.ll, p.ai, p.features, now, now]
    );
    planIds[p.tier] = Number(res.lastInsertRowid);
  }
  console.log('📦  Created 3 subscription plans');

  // ── 4. Sample organisations + admin/manager/agent + leads ───────────────
  const orgs = [
    { name: 'Skyline Logistics', slug: 'skyline', tier: 'ENTERPRISE',    al: 100 },
    { name: 'Vortex Energy',     slug: 'vortex',  tier: 'PROFESSIONAL',  al: 20  },
    { name: 'Basic Retail',      slug: 'basic',   tier: 'STARTER',       al: 5   },
  ];

  for (const o of orgs) {
    // Org
    const orgRes = await run(
      `INSERT INTO "organizations" ("name","slug","subscription_tier","plan_id","status","agent_limit","created_at","updated_at")
       VALUES (?,?,?,?,?,?,?,?)`,
      [o.name, o.slug, o.tier, planIds[o.tier], 'ACTIVE', o.al, now, now]
    );
    const orgId = Number(orgRes.lastInsertRowid);

    // Admin
    await run(
      `INSERT INTO "users" ("name","email","password","role","organization_id","is_active","created_at","updated_at")
       VALUES (?,?,?,?,?,?,?,?)`,
      [`${o.name} Admin`, `admin@${o.slug}.com`, hash, 'ADMIN', orgId, 1, now, now]
    );

    // Manager
    await run(
      `INSERT INTO "users" ("name","email","password","role","organization_id","is_active","created_at","updated_at")
       VALUES (?,?,?,?,?,?,?,?)`,
      [`${o.name} Manager`, `manager@${o.slug}.com`, hash, 'MANAGER', orgId, 1, now, now]
    );

    // Agent
    const agentRes = await run(
      `INSERT INTO "users" ("name","email","password","role","organization_id","is_active","created_at","updated_at")
       VALUES (?,?,?,?,?,?,?,?)`,
      [`${o.name} Agent`, `agent@${o.slug}.com`, hash, 'AGENT', orgId, 1, now, now]
    );
    const agentId = Number(agentRes.lastInsertRowid);

    // 3 leads per org
    for (let i = 1; i <= 3; i++) {
      await run(
        `INSERT INTO "leads" ("organization_id","customer_name","email","phone","source","status","assigned_to","created_at","updated_at")
         VALUES (?,?,?,?,?,?,?,?,?)`,
        [orgId, `Lead ${i} - ${o.name}`, `contact${i}@client-${o.slug}.com`,
         `+9190000${orgId}00${i}`, 'WEBHOOK', 'NEW', agentId, now, now]
      );
    }

    console.log(`✅  Org "${o.name}" → admin / manager / agent / 3 leads`);
  }

  console.log('\n🚀  Turso seeded successfully!\n');
  console.log('─────────────────────────────────────────');
  console.log('  SUPER_ADMIN : saas@platform.com');
  console.log('  Org Admin   : admin@skyline.com  /  admin@vortex.com  /  admin@basic.com');
  console.log('  Password    : password123');
  console.log('─────────────────────────────────────────\n');
}

seed().catch(err => {
  console.error('\n❌  Seed failed:', err.message || err);
  process.exit(1);
});
