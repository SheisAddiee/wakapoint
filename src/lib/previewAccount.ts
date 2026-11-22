import type { User } from '@supabase/supabase-js';
import { readPreferences } from './onboarding';

export type PreviewSession = { user: User };
const activeKey = 'wakapoint.preview.active';
const accountKey = (email: string) => `wakapoint.preview.account.${email}`;
const validEmail = (value: unknown): value is string => typeof value === 'string' && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const metadata = (value: unknown) => {
  const source = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  const preferences = readPreferences(source.wakapoint);
  return { ...(preferences ? { wakapoint: preferences } : {}), ...(source.wakapoint_theme === 'light' || source.wakapoint_theme === 'dark' ? { wakapoint_theme: source.wakapoint_theme } : {}) };
};
function account(email: string): PreviewSession {
  let saved: unknown;
  try { saved = JSON.parse(localStorage.getItem(accountKey(email)) || '{}'); } catch { saved = {}; }
  return { user: { id: `preview:${email}`, email, app_metadata: { provider: 'preview' }, user_metadata: metadata(saved), aud: 'preview', role: 'preview', created_at: new Date().toISOString() } };
}
export function readPreviewSession(): PreviewSession | null {
  try { const email = localStorage.getItem(activeKey); return validEmail(email) ? account(email) : null; } catch { return null; }
}
export function signInPreview(value: string): PreviewSession {
  const email = value.trim().toLowerCase();
  if (!validEmail(email)) throw new Error('Enter an email address to open your preview.');
  const session = account(email);
  localStorage.setItem(activeKey, email);
  localStorage.setItem(accountKey(email), JSON.stringify(session.user.user_metadata));
  return session;
}
export function updatePreviewSession(session: PreviewSession, changes: Record<string, unknown>): PreviewSession {
  const email = session.user.email;
  if (!validEmail(email)) throw new Error('Preview account is unavailable.');
  const next = account(email);
  next.user.user_metadata = metadata({ ...next.user.user_metadata, ...changes });
  localStorage.setItem(accountKey(email), JSON.stringify(next.user.user_metadata));
  return next;
}
export function signOutPreview() { localStorage.removeItem(activeKey); }
export const previewLibraryKey = (id: string) => `wakapoint.preview.library.${id}`;
