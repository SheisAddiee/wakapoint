export const ROLES = [
  { id: 'dispatch', label: 'Dispatch & operations', description: 'Resolve addresses and keep deliveries moving.' },
  { id: 'merchant', label: 'Merchant & business', description: 'Capture better addresses from your customers.' },
  { id: 'developer', label: 'Developer', description: 'Bring address intelligence into your product.' },
] as const;
export const HOME_CITIES = ['Abuja', 'Lagos', 'Benin City', 'Port Harcourt', 'Ibadan', 'Elsewhere in Nigeria'] as const;
export interface WorkspacePreferences {
  version: 1;
  role: typeof ROLES[number]['id'];
  city: typeof HOME_CITIES[number];
  firstTask: 'resolve' | 'batch';
  tutorial?: 'complete' | 'skipped';
}
export function readPreferences(value: unknown): WorkspacePreferences | null {
  if (!value || typeof value !== 'object') return null;
  const item = value as Record<string, unknown>;
  const role = ROLES.find(r => r.id === item.role)?.id;
  const city = HOME_CITIES.find(c => c === item.city);
  if (item.version !== 1 || !role || !city || (item.firstTask !== 'resolve' && item.firstTask !== 'batch')) return null;
  return { version: 1, role, city, firstTask: item.firstTask, ...(item.tutorial === 'complete' || item.tutorial === 'skipped' ? { tutorial: item.tutorial } : {}) };
}
