#!/usr/bin/env node
/*
  Simple schema + seed runner.
  Prerequisites:
    - psql installed locally
    - Environment: SUPABASE_DB_URL (full Postgres connection string) OR individual PG* vars.
  WARNING: This will re-run the schema; adjust if you only want inserts.
*/

import { readFileSync, writeFileSync, unlinkSync } from 'fs';
import { execSync } from 'child_process';
import path from 'path';
import dotenv from 'dotenv';
import { tmpdir } from 'os';

// Load environment variables from .env and .env.local (local overrides base)
['.env', '.env.local'].forEach(file => {
  dotenv.config({ path: file, override: file === '.env.local' });
});

const schemaPath = path.resolve(process.cwd(), 'supabase-schema.sql');

console.log('[seed-schema] Current environment check:');
console.log('SUPABASE_DB_URL exists:', !!process.env.SUPABASE_DB_URL);
console.log('SUPABASE_DB_URL length:', process.env.SUPABASE_DB_URL?.length || 0);

if (!process.env.SUPABASE_DB_URL) {
  console.error('[seed-schema] SUPABASE_DB_URL not set. Provide a direct Postgres connection string.');
  process.exit(1);
}

try {
  const sql = readFileSync(schemaPath, 'utf-8');
  console.log('[seed-schema] Applying schema + seed data...');
  
  // Use a more reliable method: write to a temp file and use psql -f
  const tempFile = path.join(tmpdir(), 'supabase-schema-temp.sql');
  writeFileSync(tempFile, sql);
  
  try {
    execSync(`psql "${process.env.SUPABASE_DB_URL}" -v ON_ERROR_STOP=1 -f "${tempFile}"`, { 
      stdio: 'inherit' 
    });
    console.log('\n[seed-schema] Done.');
  } finally {
    // Clean up temp file
    try {
      unlinkSync(tempFile);
    } catch (e) {
      // Ignore cleanup errors
    }
  }
} catch (e) {
  console.error('\n[seed-schema] Failed:', e.message);
  process.exit(1);
}
