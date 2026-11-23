import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { validateGateway, type GatewayConfig } from './gateway';
import type { SavedAddress } from './workspace';

const clients = new Map<string, SupabaseClient>();

/** Auth, gateway and database calls share one session and its refresh lifecycle. */
export function getSupabase(config: GatewayConfig): SupabaseClient {
  const safe = validateGateway(config);
  const key = `${safe.url}:${safe.publicKey}`;
  let client = clients.get(key);
  if (!client) {
    client = createClient(safe.url, safe.publicKey, {
      auth: { flowType: 'pkce', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
      global: { fetch: (input, init) => fetch(input, { ...init, signal: init?.signal ? AbortSignal.any([init.signal, AbortSignal.timeout(15000)]) : AbortSignal.timeout(15000) }) },
    });
    clients.set(key, client);
  }
  return client;
}

export async function authHeaders(config: GatewayConfig): Promise<Record<string, string>> {
  const { data, error } = await getSupabase(config).auth.getSession();
  if (error || !data.session || data.session.user.is_anonymous) throw new Error('Sign in to use the cloud workspace and official postcode service.');
  return { apikey: config.publicKey, Authorization: `Bearer ${data.session.access_token}`, 'Content-Type': 'application/json' };
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
