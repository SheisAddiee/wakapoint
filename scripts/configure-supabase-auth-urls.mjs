import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
if (existsSync('.env.local')) loadEnvFile('.env.local');
const token = process.env.SUPABASE_ACCESS_TOKEN;
if (!token || token.includes('REPLACE_ME')) { console.error('Set SUPABASE_ACCESS_TOKEN in ignored .env.local first.'); process.exit(1); }
const endpoint = 'https://api.supabase.com/v1/projects/twsgnqkxruoqkqwgzjal/config/auth';
const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
try {
  const currentResponse = await fetch(endpoint, { headers, signal: AbortSignal.timeout(15000) });
  if (!currentResponse.ok) throw new Error(`Auth configuration read failed (${currentResponse.status}).`);
  const current = await currentResponse.json();
  const allowed = new Set(String(current.uri_allow_list || '').split(',').map(value => value.trim()).filter(Boolean));
  for (const origin of ['https://wakapoint.vercel.app', 'http://localhost:3000', 'http://127.0.0.1:3000']) for (const path of ['/', '/auth/callback']) allowed.add(origin + path);
  const updates = { site_url: 'https://wakapoint.vercel.app', uri_allow_list: [...allowed].join(',') };
  const response = await fetch(endpoint, { method: 'PATCH', headers, body: JSON.stringify(updates), signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`Auth URL update failed (${response.status}).`);
  console.log('WakaPoint Auth Site URL and production/local redirect allowlist configured. OAuth credentials were preserved.');
} catch (error) { console.error(error instanceof Error ? error.message : 'Auth URL setup failed.'); process.exitCode = 1; }
