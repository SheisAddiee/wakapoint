export interface Location {
  name: string; state: string; lga: string | null;
  latitude: number; longitude: number; aliases: string[];
}

// Approximate locality centres, never building coordinates or verified delivery pins.
export const LOCATIONS: Location[] = [
  { name: 'Lokogoma', state: 'Federal Capital Territory', lga: 'Abuja Municipal Area Council', latitude: 8.9806, longitude: 7.4208, aliases: ['lokogoma'] },
  { name: 'Ikeja', state: 'Lagos', lga: 'Ikeja', latitude: 6.6018, longitude: 3.3515, aliases: ['ikeja'] },
  { name: 'Benin City', state: 'Edo', lga: null, latitude: 6.335, longitude: 5.6037, aliases: ['benin city', 'benin'] },
  { name: 'Abuja', state: 'Federal Capital Territory', lga: null, latitude: 9.0765, longitude: 7.3986, aliases: ['abuja', 'fct'] },
  { name: 'Lagos', state: 'Lagos', lga: null, latitude: 6.5244, longitude: 3.3792, aliases: ['lagos'] },
  { name: 'Port Harcourt', state: 'Rivers', lga: null, latitude: 4.8156, longitude: 7.0498, aliases: ['port harcourt'] },
  { name: 'Ibadan', state: 'Oyo', lga: null, latitude: 7.3775, longitude: 3.947, aliases: ['ibadan'] },
  { name: 'Kano', state: 'Kano', lga: null, latitude: 12.0022, longitude: 8.592, aliases: ['kano'] },
  { name: 'Enugu', state: 'Enugu', lga: null, latitude: 6.4584, longitude: 7.5464, aliases: ['enugu'] },
  { name: 'Kaduna', state: 'Kaduna', lga: null, latitude: 10.5105, longitude: 7.4165, aliases: ['kaduna'] },
  { name: 'Abeokuta', state: 'Ogun', lga: null, latitude: 7.1475, longitude: 3.3619, aliases: ['abeokuta'] },
  { name: 'Jos', state: 'Plateau', lga: null, latitude: 9.8965, longitude: 8.8583, aliases: ['jos'] },
  { name: 'Onitsha', state: 'Anambra', lga: null, latitude: 6.1456, longitude: 6.785, aliases: ['onitsha'] },
  { name: 'Yaba', state: 'Lagos', lga: 'Lagos Mainland', latitude: 6.5158, longitude: 3.3711, aliases: ['yaba'] },
  { name: 'Lekki', state: 'Lagos', lga: null, latitude: 6.4698, longitude: 3.5852, aliases: ['lekki'] },
  { name: 'Surulere', state: 'Lagos', lga: 'Surulere', latitude: 6.5004, longitude: 3.3582, aliases: ['surulere'] },
  { name: 'Wuse', state: 'Federal Capital Territory', lga: 'Abuja Municipal Area Council', latitude: 9.0769, longitude: 7.4648, aliases: ['wuse'] },
  { name: 'Garki', state: 'Federal Capital Territory', lga: 'Abuja Municipal Area Council', latitude: 9.0294, longitude: 7.4902, aliases: ['garki'] },
  { name: 'Maitama', state: 'Federal Capital Territory', lga: 'Abuja Municipal Area Council', latitude: 9.1099, longitude: 7.4967, aliases: ['maitama'] },
  { name: 'Ilorin', state: 'Kwara', lga: null, latitude: 8.4799, longitude: 4.5418, aliases: ['ilorin'] },
  { name: 'Akure', state: 'Ondo', lga: null, latitude: 7.2571, longitude: 5.2058, aliases: ['akure'] },
  { name: 'Osogbo', state: 'Osun', lga: null, latitude: 7.7827, longitude: 4.5418, aliases: ['osogbo', 'oshogbo'] },
  { name: 'Ado Ekiti', state: 'Ekiti', lga: 'Ado Ekiti', latitude: 7.6233, longitude: 5.2209, aliases: ['ado ekiti', 'ado-ekiti'] },
  { name: 'Uyo', state: 'Akwa Ibom', lga: 'Uyo', latitude: 5.0377, longitude: 7.9128, aliases: ['uyo'] },
  { name: 'Owerri', state: 'Imo', lga: null, latitude: 5.4836, longitude: 7.0332, aliases: ['owerri'] },
  { name: 'Aba', state: 'Abia', lga: null, latitude: 5.1066, longitude: 7.3667, aliases: ['aba'] },
];
export const EXAMPLES = [
  { id: 'abuja', title: 'Lokogoma, Abuja', type: 'Residential', text: 'Opposite yellow water tank near Total filling station, entering through the green gate, Lokogoma, Abuja' },
  { id: 'benin', title: 'Benin City, Edo', type: 'Landmark-based', text: 'Behind primary school, second junction after Mama Ngozi shop, off Ring Road, Benin City' },
  { id: 'lagos', title: 'Ikeja, Lagos', type: 'Commercial', text: 'Shop 14, block B, modern market by the pedestrian bridge, Ikeja, Lagos' },
];
export interface AddressResult {
  id: string; createdAt: string; input: string; normalized: string;
  location: Location | null; landmarks: string[]; directions: string[];
  identifiers: string[]; units: string[]; coverage: number; elapsedMs: number;
  status: 'Ready for review' | 'Needs more detail'; warnings: string[];
  redactedCount: number; json: Record<string, unknown>;
}
export function redactPersonalData(input: string) {
  let count = 0;
  const replace = (_match: string) => { count++; return '[redacted]'; };
  const text = input
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, replace)
    .replace(/(?<!\w)(?:\+?234[\s()-]*(?:\d[\s()-]*){10}|0[789][01][\s()-]*(?:\d[\s()-]*){8})(?!\d)/g, replace)
    .replace(/\b(?:recipient|occupant|landlord|contact\s+name)\s*[:=]\s*[^,;\n]+/gi, replace);
  const protectedText = text.replace(/\bcall\s+(?!when\b|at\b|on\b|the\b)([\p{L}][\p{L}'-]*(?:\s+[\p{L}][\p{L}'-]*){0,2})(?=\s*(?:on\b|at\b|when\b|[,;:+\n\d]|$))/giu, () => { count++; return 'call [redacted]'; });
  return { text: protectedText, count };
}
const unique = (values: string[]) => [...new Set(values.map(v => v.trim()).filter(Boolean))];
const titleCase = (text: string) => text.replace(/\b\p{L}/gu, c => c.toUpperCase());
export function resolveAddress(rawInput: string): AddressResult {
  const start = performance.now();
  if (!rawInput.trim()) throw new Error('Enter an address to resolve.');
  if (rawInput.length > 2000) throw new Error('Keep the address under 2,000 characters.');
  const redacted = redactPersonalData(rawInput.trim());
  const input = redacted.text.replace(/[ \t]+/g, ' ');
  const matches = LOCATIONS.filter(l => l.aliases.some(a => new RegExp(`\\b${a}\\b`, 'i').test(input)));
  const location = matches.sort((a, b) => Number(['Abuja','Lagos'].includes(a.name)) - Number(['Abuja','Lagos'].includes(b.name)) || b.aliases[0].length - a.aliases[0].length)[0] ?? null;
  const conflicting = location && matches.some(l => l.state !== location.state);
  const clauses = input.split(/[,;\n]+/).map(c => c.trim()).filter(Boolean);
  const landmarks = unique((input.match(/(?:\b(?:[\p{L}\p{N}'-]+\s+){0,2})?(?:water tank|transformer|filling station|petrol station|primary school|school|pedestrian bridge|bridge|modern market|market|junction|mosque|church|hospital|shop|kiosk)\b/giu) ?? []).map(value => value.replace(/^(?:(?:opposite|behind|near|the|by|after|before|second|first|third|off|entering|through)\s+)+/i, '')));
  const directions = unique(clauses.filter(c => /\b(opposite|behind|near|after|before|beside|by|off|turn|junction|entering|through|next to|across)\b/i.test(c)));
  const identifiers = unique(input.match(/\b(?:yellow|green|blue|red|black|white|brown|orange|grey|gray)\s+(?:[\w-]+\s+)?(?:gate|tank|building|house|roof|door|wall)\b/gi) ?? []);
  const units = unique(input.match(/\b(?:shop|block|flat|unit|house|plot|room|floor)\s+(?:no\.?\s*)?[a-z0-9]+\b/gi) ?? []);
  const coverage = Math.round([!!location, !!landmarks.length, !!directions.length, !!(identifiers.length || units.length)].filter(Boolean).length / 4 * 100);
  const warnings: string[] = [];
  if (!location) warnings.push('Add a supported city or district so we can place this address on the map.');
  if (conflicting) warnings.push('This address mentions locations in different states. Confirm the intended city.');
  if (!landmarks.length) warnings.push('Add a nearby landmark to make the address easier to find.');
  if (!identifiers.length && !units.length) warnings.push('Add a gate colour, building description or unit number for the final handoff.');
  warnings.push('Building coordinates and NIPOST digital postcodes require upstream verification.');
  const normalized = clauses.map(titleCase).join(', ');
  const status = location && (identifiers.length || units.length) && !conflicting ? 'Ready for review' : 'Needs more detail';
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const json = {
    id, mode: 'local_rule_based', verified: false, normalized_address: normalized,
    entities: { country: 'Nigeria', state: location?.state ?? null, lga: location?.lga ?? null, locality: location?.name ?? null, landmarks, positional_cues: directions, structure_identifiers: identifiers, units },
    approximate_locality: location ? { latitude: location.latitude, longitude: location.longitude, precision: 'locality', source: 'bundled_locality_centres' } : null,
    nipost_digital_postcode: null, extraction_coverage: coverage / 100, review_status: status,
    privacy: { redacted_items: redacted.count, method: 'rule_based_contact_redaction', manual_review_required: true }, warnings,
  };
  return { id, createdAt, input, normalized, location, landmarks, directions, identifiers, units, coverage, elapsedMs: Math.round((performance.now() - start) * 100) / 100, status, warnings, redactedCount: redacted.count, json };
}
