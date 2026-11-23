import type { EmailOtpType } from '@supabase/supabase-js';

export const authRedirectUrl = () => new URL('/', location.origin).href;

export function accountRoute(url: URL): string {
  const aliases: Record<string, string> = { '/signup': 'signup', '/signin': 'signin', '/login': 'signin', '/dashboard': 'resolve', '/auth/callback': 'signin' };
  return url.hash.slice(1) || aliases[url.pathname.replace(/\/$/, '')] || '';
}

export function emailCallback(url: URL): { token_hash: string; type: EmailOtpType } | null {
  const token_hash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type');
  if (!token_hash) return null;
  if (!/^[a-zA-Z0-9_-]{20,256}$/.test(token_hash) || !['email', 'signup', 'magiclink', 'invite', 'recovery', 'email_change'].includes(type || '')) {
    throw new Error('This sign-in link is invalid. Request a new email.');
  }
  return { token_hash, type: type as EmailOtpType };
}

export function callbackFailed(url: URL) {
  return url.searchParams.has('error') || new URLSearchParams(url.hash.slice(1)).has('error');
}

export function cleanCallbackUrl(url: URL) {
  const clean = new URL(url);
  ['code', 'token_hash', 'type', 'error', 'error_code', 'error_description'].forEach(key => clean.searchParams.delete(key));
  if (new URLSearchParams(clean.hash.slice(1)).has('access_token') || new URLSearchParams(clean.hash.slice(1)).has('error')) clean.hash = '';
  if (['/signup', '/signin', '/login', '/dashboard', '/auth/callback'].includes(clean.pathname.replace(/\/$/, ''))) {
    const route = accountRoute(clean);
    clean.pathname = '/';
    clean.hash = route;
  }
  return clean.pathname + clean.search + clean.hash;
}
