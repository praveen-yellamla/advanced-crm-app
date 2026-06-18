const { createClient } = require('@libsql/client');
const fs = require('fs');
const path = require('path');

// Read .env manually to bypass dotenvx if it exists
const envPath = path.join(__dirname, '../.env');
const envVars = {};
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.substring(0, idx).trim();
    let val = trimmed.substring(idx + 1).trim();
    // Remove inline comments
    const commentIdx = val.indexOf(' #');
    if (commentIdx !== -1) val = val.substring(0, commentIdx).trim();
    envVars[key] = val;
  }
}

// Print environment keys for debugging (hiding values)
console.log('Available environment variables:', 
  Object.keys(process.env).filter(k => /DB|DATABASE|URL|TURSO/i.test(k))
);

const connectionString = envVars['TURSO_DATABASE_URL'] || process.env.TURSO_DATABASE_URL || envVars['DATABASE_URL'] || process.env.DATABASE_URL;
const authToken = envVars['TURSO_AUTH_TOKEN'] || process.env.TURSO_AUTH_TOKEN;

if (!connectionString) {
  console.error('❌ Missing DATABASE_URL or TURSO_DATABASE_URL environment variable');
  process.exit(1);
}

if (connectionString.startsWith('postgres://') || connectionString.startsWith('postgresql://')) {
  console.error('\n❌ Error: The database URL points to a PostgreSQL database, but this app has been migrated to Turso/LibSQL (SQLite).');
  console.error('To resolve this, please either:');
  console.error('  1. Unlink the PostgreSQL database from this Web Service in your Render Dashboard settings.');
  console.error('  2. Or, configure a new Environment Variable in Render named "TURSO_DATABASE_URL" containing your Turso database URL.\n');
  process.exit(1);
}

console.log(`🔗 Connecting to database URL: ${connectionString.split('@').pop()}`);

async function run() {
  const client = createClient({
    url: connectionString,
    authToken: authToken
  });

  // Test connection
  try {
    await client.execute('SELECT 1');
    console.log('✅ Connected to Turso successfully!');
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
    process.exit(1);
  }

  const migrationPath = path.join(__dirname, '../migration.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');

  // Split by semicolons, keeping multi-line statements intact
  const rawStatements = sql.split(';');
  const statements = rawStatements
    .map(s => s.trim())
    .filter(s => {
      if (!s) return false;
      // Remove pure comment lines
      const lines = s.split('\n').filter(l => l.trim() && !l.trim().startsWith('--'));
      return lines.length > 0;
    });

  console.log(`📄 Found ${statements.length} SQL statements to execute...`);

  let successCount = 0;
  let skipCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i].trim();
    if (!statement) continue;

    try {
      await client.execute(statement);
      successCount++;
      if (i % 20 === 0) {
        console.log(`  [${i + 1}/${statements.length}] Progress...`);
      }
    } catch (err) {
      // Skip "table already exists" errors (idempotent)
      if (err.message && (
        err.message.includes('already exists') ||
        err.message.includes('duplicate')
      )) {
        skipCount++;
        continue;
      }
      console.error(`\n❌ Error at statement ${i + 1}:\n${statement}\n`);
      console.error(err.message);
      process.exit(1);
    }
  }

  console.log(`\n✅ Migration complete! ${successCount} executed, ${skipCount} skipped (already exist)`);
  process.exit(0);
}

run().catch(e => {
  console.error('Migration script failed:', e);
  process.exit(1);
});
