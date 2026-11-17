export interface GatewayConfig { url: string; publicKey: string; }
export interface PostcodeLookup { postcode: string; valid: boolean; administrative_address?: { state_name?: string; lga_name?: string; locality_name?: string; zone?: string }; recent_house_address?: { recent?: string }; building_use_status?: string; }
export interface PostcodeSuggestion { postcode: string; label: string; }
const defaultConfig: GatewayConfig = { url: import.meta.env?.VITE_SUPABASE_URL || '', publicKey: import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY || '' };
export function loadGateway(): GatewayConfig { return defaultConfig; }
export function validateGateway(config: GatewayConfig) {
  let url: URL;
  try { url = new URL(config.url); } catch { throw new Error('The address service is not configured. Please contact the application administrator.'); }
  if (url.protocol !== 'https:' || !url.hostname.endsWith('.supabase.co') || url.pathname !== '/' || url.username || url.password || url.search || url.hash) throw new Error('The address service configuration is invalid. Please contact the application administrator.');
  if (!config.publicKey.trim().startsWith('sb_publishable_')) throw new Error('The address service is not configured. Please contact the application administrator.');
  return { url: url.origin, publicKey: config.publicKey.trim() };
}
export async function gatewayRequest(config: GatewayConfig, action: 'health' | 'lookup' | 'search', values: Record<string, unknown> = {}, signal?: AbortSignal) {
  const safe = validateGateway(config);
  const response = await fetch(`${safe.url}/functions/v1/wakapoint-gateway`, { method: 'POST', headers: await authHeaders(safe), body: JSON.stringify({ action, ...values }), signal: signal ?? AbortSignal.timeout(12000) });
  let body: { data?: unknown; error?: { message?: string } };
  try { body = await response.json(); } catch { throw new Error('The gateway returned an unreadable response. Check its deployment.'); }
  if (!response.ok) throw new Error(body.error?.message || `Gateway request failed (${response.status}).`);
  return body.data;
}
import { authHeaders } from './supabase';
