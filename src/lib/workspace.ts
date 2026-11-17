import { resolveAddress, type AddressResult } from './addressResolver';

export interface ConfirmedPoint { latitude: number; longitude: number; source: 'dispatcher_confirmed'; }
export interface SavedAddress { id: string; savedAt: string; result: AddressResult; point: ConfirmedPoint | null; postcode: string | null; }
export type View = 'resolve' | 'batch' | 'saved' | 'postcode' | 'developers' | 'privacy';
export function parsePostcode(value: string) {
  const compact = value.toUpperCase().replace(/[\s-]/g, '');
  const match = /^([A-Z]{2})(0[1-9]|[1-9]\d)([A-Z][A-Z0-9]{2})([A-Z]{2})(0[1-9]|[1-9]\d)$/.exec(compact);
  return match ? { canonical: match.slice(1).join('-'), segments: match.slice(1) } : null;
}
export function dispatchPayload(result: AddressResult, point: ConfirmedPoint | null = null, postcode: string | null = null) {
  return { ...result.json, dispatcher_point: point, nipost_digital_postcode: postcode, directions: result.directions, units: result.units };
}
export function downloadFile(filename: string, data: string, type = 'application/json') {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const link = document.createElement('a');
  link.href = url; link.download = filename; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function loadSaved(): SavedAddress[] {
  try {
    const data: unknown = JSON.parse(localStorage.getItem('wakapoint.saved.v1') || '[]');
    return normalizeSavedRecords(data);
  } catch { return []; }
}
export function normalizeSavedRecords(data: unknown): SavedAddress[] {
  if (!Array.isArray(data)) return [];
  return data.slice(0,100).flatMap(item => {
    if (!item || typeof item.id !== 'string' || typeof item.result?.input !== 'string' || typeof item.savedAt !== 'string' || !Number.isFinite(Date.parse(item.savedAt))) return [];
    try {
      const result = resolveAddress(item.result.input);
      const priorCount = item.result.redactedCount;
      if (Number.isInteger(priorCount) && priorCount >= 0 && priorCount <= 2000) {
        result.redactedCount = Math.max(result.redactedCount, priorCount);
        result.json.privacy = { ...(result.json.privacy as Record<string, unknown>), redacted_items: result.redactedCount };
      }
      const candidate = item.point;
      const point: ConfirmedPoint | null = candidate?.source === 'dispatcher_confirmed' && typeof candidate.latitude === 'number' && Number.isFinite(candidate.latitude) && Math.abs(candidate.latitude) <= 90 && typeof candidate.longitude === 'number' && Number.isFinite(candidate.longitude) && Math.abs(candidate.longitude) <= 180 ? { latitude: candidate.latitude, longitude: candidate.longitude, source: 'dispatcher_confirmed' } : null;
      return [{ id:item.id,savedAt:item.savedAt,result,point,postcode:typeof item.postcode === 'string' ? parsePostcode(item.postcode)?.canonical ?? null : null }];
    } catch { return []; }
  });
}
export function saveRecords(records: SavedAddress[]) { localStorage.setItem('wakapoint.saved.v1', JSON.stringify(records.slice(0, 100))); }
export function processBatch(text: string): AddressResult[] {
  const rows = text.split(/\r?\n/).map(row => row.trim()).filter(Boolean);
  if (!rows.length) throw new Error('Add at least one address, one per line.');
  if (rows.length > 100) throw new Error('Process up to 100 addresses at a time.');
  if (rows.some(row => row.length > 2000)) throw new Error('Each address must be under 2,000 characters.');
  return rows.map(resolveAddress);
}
export function csvExport(results: AddressResult[]) {
  const cell = (value: unknown) => { const text = String(value ?? ''); return '"' + (/^[=+@\-\t\r]/.test(text) ? "'" + text : text).replace(/"/g, '""') + '"'; };
  return [['address', 'locality', 'state', 'coverage', 'review_status'], ...results.map(r => [r.normalized, r.location?.name ?? '', r.location?.state ?? '', r.coverage, r.status])].map(row => row.map(cell).join(',')).join('\r\n');
}
