import type { Page } from '@playwright/test';
import { createGateway } from '../../supabase/functions/wakapoint-gateway/core';

export const origin = 'http://127.0.0.1:4174';
export const email = 'test@example.com';
export const postcode = 'FC-01-A01-KP-27';
export const preferences = { version: 1, role: 'dispatch', city: 'Abuja', firstTask: 'resolve' };
export const token = 'synthetic-user-access-token-123456789';
const session = { access_token: token, refresh_token: 'synthetic-refresh', expires_at: Math.floor(Date.now() / 1000) + 3600, expires_in: 3600, token_type: 'bearer', user: { id: 'synthetic-user', email, aud: 'authenticated', role: 'authenticated', user_metadata: {} as Record<string, unknown> } };

export async function mockServices(page: Page, options: { signedIn?: boolean; metadata?: Record<string, unknown>; invalidCode?: boolean; failOnboarding?: boolean; failLoad?: boolean; failSave?: boolean; failLookup?: boolean; googleDisabled?: boolean; expiredSession?: boolean; notificationError?: boolean; notifications?: Record<string, unknown>[] } = {}) {
  let user = { ...session.user, user_metadata: options.metadata ?? { wakapoint: { ...preferences, tutorial: 'skipped' } } };
  const calls: { url: string; method: string; body: Record<string, unknown>; authorization: string }[] = [];
  let saved: Record<string, unknown>[] = [];
  let notifications = options.notifications || [];
  let failLoad = options.failLoad;
  let failSave = options.failSave;
  if (options.signedIn) await page.addInitScript(seed => { if (!localStorage.getItem('sb-wakapoint-test-auth-token')) localStorage.setItem('sb-wakapoint-test-auth-token', JSON.stringify(seed)); }, { ...session, user });
  const env: Record<string, string> = { WAKAPOINT_ALLOWED_ORIGINS: origin, SUPABASE_URL: 'https://wakapoint-test.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'synthetic_server_key', NIPOST_API_KEY: 'nipost_test_synthetic_key' };
  const gateway = createGateway({ env: name => env[name], fetch: (async (url: RequestInfo | URL) => {
    if (String(url).endsWith('/auth/v1/user')) return Response.json({ id: user.id });
    if (String(url).includes('wakapoint_consume_limit')) return Response.json(true);
    if (String(url).includes('wakapoint_cache_get')) return Response.json(null);
    if (String(url).includes('wakapoint_cache_put')) return new Response(null, { status: 204 });
    return options.failLookup ? Response.json({ error: 'private upstream details' }, { status: 402 }) : Response.json({ data: { postcode, valid: true, owner: 'Private Owner', administrative_address: { state_name: 'FCT' } } });
  }) as typeof fetch });
  await page.route('https://wakapoint-test.supabase.co/**', async route => {
    const request = route.request();
    const headers = await request.allHeaders();
    const cors = { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Headers': '*', 'Access-Control-Expose-Headers': 'Content-Range' };
    if (request.method() === 'OPTIONS') { await route.fulfill({ status: 204, headers: cors }); return; }
    const body = request.postData() ? request.postDataJSON() as Record<string, unknown> : {};
    calls.push({ url: request.url(), method: request.method(), body, authorization: headers.authorization || '' });
    if (request.url().includes('/auth/v1/settings')) { await route.fulfill({ json: { external: { email: true, google: !options.googleDisabled } }, headers: cors }); return; }
    if (request.url().includes('/rest/v1/notifications')) {
      if (options.notificationError) { await route.fulfill({ status: 503, json: {}, headers: cors }); return; }
      const url = new URL(request.url());
      if (request.method() === 'PATCH') {
        const id = url.searchParams.get('id')?.replace(/^eq\./, '');
        notifications = notifications.map(item => !id || item.id === id ? { ...item, read_at: body.read_at } : item);
        await route.fulfill({ status: 204, headers: cors }); return;
      }
      const rows = url.searchParams.get('read_at') ? notifications.filter(item => !item.read_at) : notifications;
      await route.fulfill({ json: rows, headers: { ...cors, 'Content-Range': `0-${Math.max(0, rows.length - 1)}/${rows.length}` } }); return;
    }
    if (request.url().includes('/auth/v1/otp')) { await route.fulfill({ json: {}, headers: cors }); return; }
    if (request.url().includes('/auth/v1/verify')) {
      await route.fulfill(options.invalidCode ? { status: 403, json: { error_code: 'otp_expired', msg: 'Token has expired or is invalid' }, headers: cors } : { json: { ...session, user }, headers: cors }); return;
    }
    if (request.url().includes('/auth/v1/user')) {
      if (options.expiredSession) { await route.fulfill({ status: 401, json: { code: 'bad_jwt', message: 'Session expired' }, headers: cors }); return; }
      if (request.method() === 'PUT') {
        if (options.failOnboarding) { await route.fulfill({ status: 503, json: { message: 'Unavailable' }, headers: cors }); return; }
        user = { ...user, user_metadata: { ...user.user_metadata, ...body.data as Record<string, unknown> } };
      }
      await route.fulfill({ json: user, headers: cors }); return;
    }
    if (request.url().includes('/auth/v1/logout')) { await route.fulfill({ status: 204, headers: cors }); return; }
    if (request.url().includes('/rest/v1/saved_addresses')) { await route.fulfill(failLoad ? { status: 503, json: {}, headers: cors } : { json: saved, headers: cors }); return; }
    if (request.url().includes('/rpc/save_wakapoint_library')) {
      if (failSave) { await route.fulfill({ status: 503, json: {}, headers: cors }); return; }
      saved = (body.p_records as Record<string, unknown>[]).map(item => ({ ...item, saved_at: item.savedAt }));
      await route.fulfill({ status: 204, headers: cors }); return;
    }
    if (request.url().includes('/functions/v1/wakapoint-gateway')) {
      const response = await gateway(new Request(request.url(), { method: 'POST', headers, body: request.postData() }));
      await route.fulfill({ status: response.status, headers: Object.fromEntries(response.headers), body: await response.text() }); return;
    }
    await route.fulfill({ status: 400, json: { error: 'Unexpected test request' }, headers: cors });
  });
  await page.route('https://tile.openstreetmap.org/**', route => route.abort());
  return { calls, restoreLoad: () => { failLoad = false; }, restoreSave: () => { failSave = false; } };
}
