import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';

if (existsSync('.env.local')) loadEnvFile('.env.local');
const token = process.env.SUPABASE_ACCESS_TOKEN;
if (!token || /REPLACE_ME/.test(token)) {
  console.error('Add SUPABASE_ACCESS_TOKEN to the ignored root .env.local, then run npm run backend:placeholders. Never paste the token into chat or Git.');
  process.exitCode = 1;
} else {
  const endpoint = 'https://api.supabase.com/v1/projects/twsgnqkxruoqkqwgzjal/secrets';
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  // Add only missing entries. Existing real provider credentials are preserved.
  const placeholders = {
    RESEND_API_KEY: 're_REPLACE_ME',
    WAKAPOINT_EMAIL_FROM: 'WakaPoint <auth@REPLACE_ME.example>',
    SEND_EMAIL_HOOK_SECRET: 'v1,whsec_REPLACE_ME',
    NIPOST_API_KEY: 'nipost_test_REPLACE_ME',
    WAKAPOINT_SITE_URL: 'https://wakapoint.vercel.app',
    WAKAPOINT_ALLOWED_ORIGINS: 'https://wakapoint.vercel.app,http://localhost:3000,http://127.0.0.1:3000',
  };
  try {
    const response = await fetch(endpoint, { headers, signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error(`Could not inspect hosted secrets (${response.status}). No placeholders were written.`);
    const existing = await response.json();
    if (!Array.isArray(existing) || existing.some(entry => typeof entry.name !== 'string')) throw new Error('Unexpected secret-list response. No placeholders were written.');
    const names = new Set(existing.map(entry => entry.name));
    const missing = Object.entries(placeholders).filter(([name]) => !names.has(name)).map(([name, value]) => ({ name, value }));
    if (!missing.length) console.log('All required hosted secret names already exist. No values were changed.');
    else {
      const result = await fetch(endpoint, { method: 'POST', headers, body: JSON.stringify(missing), signal: AbortSignal.timeout(15000) });
      if (!result.ok) throw new Error(`Hosted placeholder write failed (${result.status}). Provider responses are omitted.`);
      console.log(`Added hosted placeholders: ${missing.map(entry => entry.name).join(', ')}. Replace REPLACE_ME values in Supabase Edge Function Secrets before activation.`);
    }
  } catch (error) { console.error(error instanceof Error ? error.message : 'Hosted placeholder setup failed.'); process.exitCode = 1; }
}
