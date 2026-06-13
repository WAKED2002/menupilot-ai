// Vercel build script — injects Supabase env vars into index.html
// and copies all static assets to dist/ for serving.
// API functions in api/ are picked up directly by Vercel from the project root.

import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const OUT  = path.join(ROOT, 'dist');

const SKIP = new Set(['dist', 'node_modules', '.git', 'api', 'supabase', 'build.mjs', 'package.json', 'vercel.json', '.env.example', '.env']);

function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue;
    const s = path.join(src, entry.name);
    const d = path.join(dst, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

// 1. Copy static files
copyDir(ROOT, OUT);

// 2. Inject Supabase credentials into dist/index.html
const supabaseUrl  = process.env.SUPABASE_URL  || '';
const supabaseAnon = process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnon) {
  console.warn('WARNING: SUPABASE_URL or SUPABASE_ANON_KEY is not set — the app will not connect to the database.');
}

let html = fs.readFileSync(path.join(OUT, 'index.html'), 'utf8');
html = html
  .replace("'__SUPABASE_URL__'",  `'${supabaseUrl}'`)
  .replace("'__SUPABASE_ANON_KEY__'", `'${supabaseAnon}'`);
fs.writeFileSync(path.join(OUT, 'index.html'), html);

console.log('Build complete.');
console.log('  SUPABASE_URL:      ', supabaseUrl  ? '✓ set' : '✗ MISSING');
console.log('  SUPABASE_ANON_KEY: ', supabaseAnon ? '✓ set' : '✗ MISSING');
console.log('  ANTHROPIC_API_KEY: ', process.env.ANTHROPIC_API_KEY ? '✓ set' : '✗ MISSING (Claude API calls will fail)');
