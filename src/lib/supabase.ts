import type { GatewayConfig } from './gateway';
import type { SavedAddress } from './workspace';

interface Session { access_token: string; refresh_token: string; expires_at: number; user: { id: string }; }
let pendingSession: Promise<Session> | null = null;
function sessionKey(config: GatewayConfig) { return `wakapoint.session.${new URL(config.url).hostname}`; }
function readSession(config: GatewayConfig): Session | null {
  try { const item = JSON.parse(localStorage.getItem(sessionKey(config)) || 'null'); return item?.access_token && item?.refresh_token && item?.user?.id ? item : null; } catch { return null; }
}
async function acquireSession(config: GatewayConfig): Promise<Session> {
  const previous = readSession(config);
  if (previous && previous.expires_at > Date.now() / 1000 + 60) return previous;
  const path = previous ? '/auth/v1/token?grant_type=refresh_token' : '/auth/v1/signup';
  const response = await fetch(config.url + path, { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: config.publicKey }, body: JSON.stringify(previous ? { refresh_token: previous.refresh_token } : {}), signal: AbortSignal.timeout(12000) });
  if (!response.ok) {
    if (previous && [400,401,403].includes(response.status)) { localStorage.removeItem(sessionKey(config)); return acquireSession(config); }
    throw new Error('The cloud workspace could not start a session. The administrator must enable Supabase anonymous sign-ins.');
  }
  const data = await response.json();
  if (typeof data.access_token !== 'string' || typeof data.refresh_token !== 'string' || typeof data.user?.id !== 'string') throw new Error('The cloud workspace returned an invalid session.');
  const session: Session = { access_token: data.access_token, refresh_token: data.refresh_token, user: { id: data.user.id }, expires_at: data.expires_at || Date.now() / 1000 + (data.expires_in || 3600) };
  try { localStorage.setItem(sessionKey(config), JSON.stringify(session)); } catch { /* The current request can still use the session if browser storage is blocked. */ }
  return session;
}
export async function authHeaders(config: GatewayConfig): Promise<Record<string, string>> {
  if (!pendingSession) pendingSession = acquireSession(config);
  try { const session = await pendingSession; return { apikey: config.publicKey, Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' }; }
  finally { pendingSession = null; }
}
export async function loadCloudRecords(config: GatewayConfig): Promise<SavedAddress[]> {
  const response = await fetch(`${config.url}/rest/v1/saved_addresses?select=id,saved_at,result,point,postcode&order=saved_at.desc&limit=100`, { headers: await authHeaders(config), signal: AbortSignal.timeout(12000) });
  if (!response.ok) throw new Error('The cloud address library is unavailable. Check the Supabase SQL setup.');
  const data = await response.json();
  if (!Array.isArray(data)) throw new Error('The cloud library returned an invalid response.');
  return data.map(row => ({ id: row.id, savedAt: row.saved_at, result: row.result, point: row.point, postcode: row.postcode }));
}
export async function saveCloudRecords(config: GatewayConfig, records: SavedAddress[]) {
  const response = await fetch(`${config.url}/rest/v1/rpc/save_wakapoint_library`, { method: 'POST', headers: await authHeaders(config), body: JSON.stringify({ p_records: records }), signal: AbortSignal.timeout(12000) });
  if (!response.ok) throw new Error('The cloud library could not save your changes. Please retry.');
}
