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
}
export function readPreferences(value: unknown): WorkspacePreferences | null {
  if (!value || typeof value !== 'object') return null;
  const item = value as Record<string, unknown>;
  return item.version === 1 && ROLES.some(r => r.id === item.role) && HOME_CITIES.some(c => c === item.city) && ['resolve', 'batch'].includes(String(item.firstTask)) ? item as unknown as WorkspacePreferences : null;
}
export function initialExample(city?: string) {
  return city === 'Lagos' ? 2 : city === 'Benin City' ? 1 : 0;
}
