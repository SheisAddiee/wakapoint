import { Webhook } from 'standardwebhooks';

type Data = Record<string, unknown>;
const object = (value: unknown): value is Data => !!value && typeof value === 'object' && !Array.isArray(value);
const email = (value: unknown): value is string => typeof value === 'string' && value.length <= 254 && /^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(value);
const escape = (value: string) => value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]!));
const subjects: Record<string, string> = {
  signup: 'Welcome to WakaPoint — verify your email', magiclink: 'Your WakaPoint sign-in code', email: 'Your WakaPoint sign-in code',
  invite: 'Your WakaPoint invitation', recovery: 'Recover your WakaPoint account', email_change: 'Confirm your WakaPoint email change',
  reauthentication: 'Verify your WakaPoint account', password_changed_notification: 'Your WakaPoint password changed',
  email_changed_notification: 'Your WakaPoint email changed', phone_changed_notification: 'Your WakaPoint phone number changed',
  identity_linked_notification: 'A sign-in provider was linked to WakaPoint', identity_unlinked_notification: 'A sign-in provider was unlinked from WakaPoint',
  mfa_factor_enrolled_notification: 'Two-factor authentication added to WakaPoint', mfa_factor_unenrolled_notification: 'Two-factor authentication removed from WakaPoint',
};
export interface EmailConfiguration { siteUrl: string; allowedOrigins: string[]; }
export interface AuthEmail { to: string; subject: string; html: string; text: string; }

function destination(redirect: unknown, config: EmailConfiguration) {
  const site = new URL(config.siteUrl);
  if (site.protocol !== 'https:' || site.username || site.password) throw new Error('Invalid site URL');
  let origin = site.origin;
  if (typeof redirect === 'string' && redirect) {
    const requested = new URL(redirect);
    if (requested.username || requested.password || !config.allowedOrigins.includes(requested.origin) || !['/', '/auth/callback'].includes(requested.pathname)) throw new Error('Invalid redirect');
    if (requested.protocol !== 'https:' && !(requested.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(requested.hostname))) throw new Error('Invalid redirect');
    origin = requested.origin;
  }
  return origin;
}

export function buildAuthEmails(payload: unknown, config: EmailConfiguration): AuthEmail[] {
  if (!object(payload) || !object(payload.user) || !object(payload.email_data) || !email(payload.user.email) || payload.user.is_anonymous === true) throw new Error('Invalid user');
  const user = payload.user, data = payload.email_data;
  const action = typeof data.email_action_type === 'string' ? data.email_action_type : '';
  if (!Object.hasOwn(subjects, action)) throw new Error('Unsupported email action');
  const origin = destination(data.redirect_to, config);
  const securityNotice = action.endsWith('_notification');
  const make = (to: string, code: unknown, hash: unknown): AuthEmail => {
    if (!email(to)) throw new Error('Invalid recipient');
    if (!securityNotice && (typeof code !== 'string' || !/^\d{6,8}$/.test(code))) throw new Error('Invalid code');
    let link = '';
    if (!securityNotice && action !== 'reauthentication') {
      if (typeof hash !== 'string' || !/^[a-zA-Z0-9_-]{20,256}$/.test(hash)) throw new Error('Invalid token hash');
      const callback = new URL('/auth/callback', origin);
      callback.searchParams.set('token_hash', hash);
      callback.searchParams.set('type', ['signup', 'magiclink', 'email'].includes(action) ? 'email' : action);
      link = callback.href;
    }
    const heading = securityNotice ? 'An update to your account.' : action === 'signup' ? 'A clearer path starts here.' : 'Your way back to WakaPoint.';
    const intro = securityNotice ? subjects[action] + '. If you did not make this change, contact your workspace administrator immediately.' : 'Enter this one-time code in WakaPoint to verify your email. Use the most recent code.';
    const text = `${subjects[action]}\n\n${heading}\n${intro}${securityNotice ? '' : `\n\n${code}`}${link ? `\n\nOr continue securely: ${link}` : ''}\n\n${securityNotice ? 'Review your account security.' : 'If you did not request this email, you can ignore it.'}\nWakaPoint — a way forward for every address.`;
    const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;background:#f5f5f2;color:#252522;font-family:Arial,sans-serif"><main style="max-width:520px;margin:40px auto;padding:36px 28px;background:#fff;border:1px solid #deded8"><p style="font-size:22px;font-weight:bold;margin:0 0 36px">WakaPoint.</p><h1 style="font-family:Georgia,serif;font-size:32px;font-weight:normal">${escape(heading)}</h1><p style="font-size:15px;line-height:1.7">${escape(intro)}</p>${securityNotice ? '' : `<p style="padding:20px;background:#f5f5f2;font-size:30px;letter-spacing:6px;text-align:center;font-weight:bold">${escape(String(code))}</p>`}${link ? `<p><a href="${escape(link)}" style="display:inline-block;background:#252522;color:#fff;padding:14px 20px;text-decoration:none">Continue to WakaPoint</a></p>` : ''}<p style="font-size:13px;line-height:1.7;color:#666">${securityNotice ? 'Review your account security.' : 'This code is temporary and can only be used once. If you did not request this email, you can ignore it.'}</p><hr style="border:0;border-top:1px solid #deded8;margin:30px 0"><p style="font-size:12px;color:#777">A way forward for every address.</p></main></body></html>`;
    return { to, subject: subjects[action], html, text };
  };
  if (action === 'email_change') {
    if (!email(user.new_email)) throw new Error('Invalid new email');
    // Supabase intentionally reverses hash field names for secure email changes.
    const messages = [make(user.new_email, data.token_new || data.token, data.token_hash)];
    if (data.token_hash_new) messages.unshift(make(user.email as string, data.token, data.token_hash_new));
    return messages;
  }
  const messages = [make(user.email as string, data.token, data.token_hash)];
  if (action === 'email_changed_notification' && email(data.old_email) && data.old_email !== user.email) messages.push(make(data.old_email, '', ''));
  return messages;
}

async function boundedBody(request: Request) {
  if (Number(request.headers.get('content-length')) > 65536) throw new Error('Body too large');
  const reader = request.body?.getReader();
  if (!reader) throw new Error('Missing body');
  const decoder = new TextDecoder();
  let text = '', size = 0;
  try {
    while (true) { const { done, value } = await reader.read(); if (done) break; size += value.byteLength; if (size > 65536) { await reader.cancel(); throw new Error('Body too large'); } text += decoder.decode(value, { stream: true }); }
    return text + decoder.decode();
  } finally { reader.releaseLock(); }
}

export function createAuthEmailHandler(deps: { env: (name: string) => string | undefined; fetch: typeof fetch }) {
  const reply = (status: number, message?: string) => Response.json(message ? { error: { http_code: status, message } } : {}, { status, headers: { 'Cache-Control': 'no-store' } });
  return async (request: Request): Promise<Response> => {
    if (request.method !== 'POST') return reply(405, 'Use POST.');
    const secret = deps.env('SEND_EMAIL_HOOK_SECRET');
    if (!secret || /REPLACE_ME/i.test(secret)) return reply(503, 'Email delivery is awaiting activation.');
    let payload: unknown;
    try { payload = new Webhook(secret.replace(/^v1,/, '')).verify(await boundedBody(request), Object.fromEntries(request.headers)); }
    catch { return reply(401, 'Webhook verification failed.'); }
    const apiKey = deps.env('RESEND_API_KEY'), from = deps.env('WAKAPOINT_EMAIL_FROM');
    if (!apiKey || !from || /[\r\n]/.test(from) || /REPLACE_ME/i.test(apiKey + from)) return reply(503, 'Email delivery is awaiting activation.');
    let messages: AuthEmail[];
    try {
      messages = buildAuthEmails(payload, { siteUrl: deps.env('WAKAPOINT_SITE_URL') || 'https://wakapoint.vercel.app', allowedOrigins: (deps.env('WAKAPOINT_ALLOWED_ORIGINS') || 'https://wakapoint.vercel.app,http://localhost:3000,http://127.0.0.1:3000').split(',').map(value => value.trim()) });
    } catch { return reply(400, 'The email request is invalid.'); }
    try {
      const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(request.headers.get('webhook-id') || ''));
      const id = Array.from(new Uint8Array(digest)).map(byte => byte.toString(16).padStart(2, '0')).join('');
      await Promise.all(messages.map(async (message, index) => {
        const response = await deps.fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', 'Idempotency-Key': `wakapoint-auth/${id}/${index}` }, body: JSON.stringify({ from, ...message, to: [message.to] }), signal: AbortSignal.timeout(3500) });
        if (!response.ok) throw new Error('Delivery failed');
      }));
      return reply(200);
    } catch { return reply(503, 'The verification email could not be delivered. Please retry.'); }
  };
}
