import test from 'node:test';
import assert from 'node:assert/strict';
import { Webhook } from 'standardwebhooks';
import { buildAuthEmails, createAuthEmailHandler } from '../supabase/functions/wakapoint-auth-email/core';

const secret = Buffer.alloc(32, 17).toString('base64');
const config = { siteUrl: 'https://wakapoint.vercel.app', allowedOrigins: ['https://wakapoint.vercel.app', 'http://localhost:3000'] };
const hash = 'a'.repeat(56), oldHash = 'b'.repeat(56);
const payload = { user: { email: 'member@example.com', is_anonymous: false }, email_data: { token: '123456', token_hash: hash, redirect_to: 'https://wakapoint.vercel.app/', email_action_type: 'magiclink' } };
function signed(body: unknown = payload, date = new Date(), id = 'hook_test_id') {
  const text = JSON.stringify(body);
  return new Request('https://project.supabase.co/functions/v1/wakapoint-auth-email', { method: 'POST', headers: { 'Content-Type': 'application/json', 'webhook-id': id, 'webhook-timestamp': String(Math.floor(date.getTime() / 1000)), 'webhook-signature': new Webhook(secret).sign(id, date, text) }, body: text });
}
function harness(failure = false, missing = false) {
  const calls: { url: string; init?: RequestInit }[] = [];
  const env: Record<string, string> = { SEND_EMAIL_HOOK_SECRET: `v1,whsec_${secret}`, RESEND_API_KEY: 'synthetic-resend-key', WAKAPOINT_EMAIL_FROM: 'WakaPoint <auth@example.com>' };
  if (missing) delete env.RESEND_API_KEY;
  const handler = createAuthEmailHandler({ env: name => env[name], fetch: (async (url, init) => { calls.push({ url: String(url), init }); return failure ? Response.json({ message: 'PRIVATE_PROVIDER_SECRET' }, { status: 422 }) : Response.json({ id: 'demo-email' }); }) as typeof fetch });
  return { handler, calls };
}
test('unsigned, stale, future and tampered webhooks cannot send email', async () => {
  const { handler, calls } = harness();
  assert.equal((await handler(new Request('https://project/functions/email', { method: 'POST', body: JSON.stringify(payload) }))).status, 401);
  assert.equal((await handler(signed(payload, new Date(Date.now() - 360000)))).status, 401);
  assert.equal((await handler(signed(payload, new Date(Date.now() + 360000)))).status, 401);
  const request = signed();
  assert.equal((await handler(new Request(request.url, { method: 'POST', headers: request.headers, body: JSON.stringify({ ...payload, user: { email: 'attacker@example.com' } }) }))).status, 401);
  assert.equal(calls.length, 0);
});
test('signed auth email sends a code and cross-device link with stable idempotency', async () => {
  const { handler, calls } = harness();
  assert.equal((await handler(signed())).status, 200);
  assert.equal((await handler(signed())).status, 200);
  assert.equal(calls[0].url, 'https://api.resend.com/emails');
  const body = JSON.parse(String(calls[0].init?.body));
  assert.deepEqual(body.to, ['member@example.com']);
  assert.ok(body.text.includes('123456'));
  assert.ok(body.text.includes(`/auth/callback?token_hash=${hash}&type=email`));
  assert.equal(new Headers(calls[0].init?.headers).get('Idempotency-Key'), new Headers(calls[1].init?.headers).get('Idempotency-Key'));
});
test('unsafe redirects, unsupported actions and anonymous accounts are rejected', () => {
  for (const redirect_to of ['https://attacker.example/', 'https://wakapoint.vercel.app.evil.test/', 'https://user:pass@wakapoint.vercel.app/', 'https://wakapoint.vercel.app/redirect']) assert.throws(() => buildAuthEmails({ ...payload, email_data: { ...payload.email_data, redirect_to } }, config));
  assert.throws(() => buildAuthEmails({ ...payload, user: { ...payload.user, is_anonymous: true } }, config));
  assert.throws(() => buildAuthEmails({ ...payload, email_data: { ...payload.email_data, email_action_type: '__proto__' } }, config));
  assert.ok(buildAuthEmails({ ...payload, email_data: { ...payload.email_data, redirect_to: 'http://localhost:3000/' } }, config)[0].text.includes('http://localhost:3000/auth/callback'));
});
test('secure email changes pair each recipient with the correct Supabase token hash', () => {
  const changing = { user: { ...payload.user, new_email: 'new@example.com' }, email_data: { ...payload.email_data, email_action_type: 'email_change', token_new: '654321', token_hash_new: oldHash } };
  const messages = buildAuthEmails(changing, config);
  assert.equal(messages[0].to, 'member@example.com'); assert.ok(messages[0].text.includes(oldHash)); assert.ok(messages[0].text.includes('123456'));
  assert.equal(messages[1].to, 'new@example.com'); assert.ok(messages[1].text.includes(hash)); assert.ok(messages[1].text.includes('654321'));
  assert.equal(buildAuthEmails({ ...changing, email_data: { ...changing.email_data, token_hash_new: '' } }, config).length, 1);
});
test('security notification emails contain no sign-in link or code', () => {
  const message = buildAuthEmails({ ...payload, email_data: { ...payload.email_data, email_action_type: 'identity_linked_notification', token: '', token_hash: '' } }, config)[0];
  assert.ok(message.text.includes('sign-in provider'));
  assert.ok(!message.html.includes('/auth/callback'));
});
test('missing secrets and provider failures fail closed and redact responses', async () => {
  const missing = harness(false, true); assert.equal((await missing.handler(signed())).status, 503); assert.equal(missing.calls.length, 0);
  const failed = harness(true); const response = await failed.handler(signed()); assert.equal(response.status, 503); assert.ok(!(await response.text()).includes('PRIVATE_PROVIDER_SECRET'));
});
test('the local placeholder worksheet cannot activate email delivery', async () => {
  let called = false;
  const values: Record<string, string> = { SEND_EMAIL_HOOK_SECRET: 'v1,whsec_REPLACE_ME', RESEND_API_KEY: 're_REPLACE_ME', WAKAPOINT_EMAIL_FROM: 'WakaPoint <auth@REPLACE_ME.example>' };
  const handler = createAuthEmailHandler({ env: name => values[name], fetch: (async () => { called = true; return Response.json({}); }) as typeof fetch });
  assert.equal((await handler(signed())).status, 503);
  assert.equal(called, false);
});
