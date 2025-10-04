import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Ensure local env files are loaded for Node context (Vite handles this automatically in browser build)
const envFiles = ['.env', '.env.local'];
for (const file of envFiles) {
  const envPath = path.resolve(process.cwd(), file);
  if (!fs.existsSync(envPath)) continue;

  dotenv.config({ path: envPath });

  // Additional manual parse (overrides) in case of commented exports or unusual formatting
  const raw = fs.readFileSync(envPath, 'utf8');
  raw.split(/\r?\n/).forEach(line => {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m) return;
    const [, k, v] = m;
    if (!process.env[k] || file === '.env.local') {
      process.env[k] = v.trim();
    }
  });
}

const url = process.env.VITE_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
const anon = process.env.VITE_SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY;
if (!url || !anon) {
  console.error('[SMOKE] Missing Supabase env vars');
  process.exit(1);
}
const supabase = createClient(url, anon);

async function run() {
  const out = { ok: true, steps: [] };
  try {
  const { data: groups, error } = await supabase.from('groups').select('id,name').limit(3);
    out.steps.push({ step: 'groups.select', count: groups?.length || 0, error: error?.message });
    if (error) throw error;

    const { data: people, error: pErr } = await supabase.from('people').select('id,name').limit(3);
    out.steps.push({ step: 'people.select', count: people?.length || 0, error: pErr?.message });
    if (pErr) throw pErr;

    console.log('[SMOKE PASS]', JSON.stringify(out, null, 2));
    process.exit(0);
  } catch (e) {
    out.ok = false;
    out.error = e.message;
    console.error('[SMOKE FAIL]', JSON.stringify(out, null, 2));
    process.exit(1);
  }
}
run();
