type RecordValue = Record<string, unknown>;
export interface GatewayDependencies {
  env: (name: string) => string | undefined;
  fetch: typeof fetch;
}
const isObject = (value: unknown): value is RecordValue => !!value && typeof value === 'object' && !Array.isArray(value);
const redact = (value: string) => value.replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[redacted]').replace(/(?<!\w)(?:\+?234[\s()-]*(?:\d[\s()-]*){10}|0[789][01][\s()-]*(?:\d[\s()-]*){8})(?!\d)/g, '[redacted]').replace(/\b(?:recipient|occupant|landlord|owner|contact\s+name)\s*[:=]\s*[^,;\n]+/gi, '[redacted]');
const safeText = (value: unknown, limit = 500) => typeof value === 'string' ? redact(value.slice(0, limit)) : undefined;
export function canonicalPostcode(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const match = /^([A-Z]{2})(0[1-9]|[1-9]\d)([A-Z][A-Z0-9]{2})([A-Z]{2})(0[1-9]|[1-9]\d)$/.exec(value.toUpperCase().replace(/[\s-]/g, ''));
  return match ? match.slice(1).join('-') : null;
}
export function filterLookup(raw: unknown, code: string) {
  if (!isObject(raw) || typeof raw.valid !== 'boolean') throw new Error('Unexpected upstream lookup format');
  const address = isObject(raw.administrative_address) ? raw.administrative_address : {};
  const house = isObject(raw.recent_house_address) ? raw.recent_house_address : {};
  return { postcode: canonicalPostcode(raw.postcode) || code, valid: raw.valid,
    administrative_address: Object.fromEntries(['state_name','lga_name','locality_name','zone'].map(key => [key,safeText(address[key])]).filter(([,v]) => v !== undefined)),
    recent_house_address: safeText(house.recent) ? { recent: safeText(house.recent) } : undefined,
    building_use_status: safeText(raw.building_use_status,80) };
}
export function filterSuggestions(raw: unknown, query: string) {
  if (!isObject(raw) || !Array.isArray(raw.suggestions)) throw new Error('Unexpected upstream search format');
  const segments = ['state','lga','district','area','unit'];
  const index = segments.indexOf(String(raw.segment));
  const offsets = [0,2,4,7,9], lengths = [2,2,3,2,2];
  const prefix = query.toUpperCase().replace(/[\s-]/g,'');
  return raw.suggestions.slice(0,20).filter(isObject).flatMap(item => {
    if (typeof item.code !== 'string' || !/^[A-Z0-9 -]{1,20}$/i.test(item.code)) return [];
    const code = item.code.toUpperCase().replace(/[\s-]/g,'');
    const full = index >= 0 && code.length === lengths[index] ? prefix.slice(0,offsets[index]) + code : code;
    const parts = [full.slice(0,2),full.slice(2,4),full.slice(4,7),full.slice(7,9),full.slice(9,11)].filter(Boolean);
    return [{ postcode: parts.join('-'), label: safeText(item.label,200) || parts.join(' ') }];
  });
}
export function createGateway(deps: GatewayDependencies) {
  return async (request: Request): Promise<Response> => {
    const origin = request.headers.get('Origin') || '';
    const origins = (deps.env('WAKAPOINT_ALLOWED_ORIGINS') || '').split(',').map(v => v.trim()).filter(Boolean);
    const cors: Record<string,string> = { 'Vary': 'Origin', 'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
    if (origins.includes(origin)) cors['Access-Control-Allow-Origin'] = origin;
    const reply = (data: unknown, status = 200, headers: Record<string,string> = {}) => new Response(JSON.stringify(data), { status, headers: { ...cors, ...headers, 'Content-Type':'application/json', 'Cache-Control':'no-store' } });
    if (!origin || !origins.includes(origin)) return reply({ error: { code:'origin_not_allowed', message:'This application origin is not allowed.' } },403);
    if (request.method === 'OPTIONS') return new Response(null,{ status:204,headers:cors });
    if (request.method !== 'POST') return reply({ error:{ code:'method_not_allowed',message:'Use POST.' } },405);
    const token = request.headers.get('Authorization') || '';
    if (!/^Bearer [A-Za-z0-9._-]{20,}$/.test(token)) return reply({ error:{ code:'unauthorized',message:'An authenticated workspace session is required.' } },401);
    const supabaseUrl = deps.env('SUPABASE_URL'), serviceKey = deps.env('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !serviceKey) return reply({ error:{ code:'configuration_missing',message:'The address service is unavailable.' } },503);
    const dbHeaders = { apikey:serviceKey, Authorization:`Bearer ${serviceKey}`, 'Content-Type':'application/json' };
    const rpc = async (name: string, body: unknown) => {
      const response = await deps.fetch(`${supabaseUrl}/rest/v1/rpc/${name}`,{ method:'POST',headers:dbHeaders,body:JSON.stringify(body),signal:AbortSignal.timeout(6000) });
      if (!response.ok) throw new Error('Gateway database unavailable');
      return response.status === 204 ? null : response.json();
    };
    try {
      const auth = await deps.fetch(`${supabaseUrl}/auth/v1/user`,{ headers:{ apikey:serviceKey,Authorization:token },signal:AbortSignal.timeout(6000) });
      if (!auth.ok) return reply({ error:{ code:'unauthorized',message:'Your workspace session expired. Reload and retry.' } },401);
      const user = await auth.json();
      if (typeof user.id !== 'string') return reply({ error:{ code:'unauthorized',message:'An authenticated session is required.' } },401);
      const ip = (request.headers.get('x-forwarded-for') || 'unknown').split(',')[0].trim();
      const digest = await crypto.subtle.digest('SHA-256',new TextEncoder().encode(`${serviceKey}:${ip}`));
      const ipHash = Array.from(new Uint8Array(digest)).map(byte => byte.toString(16).padStart(2,'0')).join('');
      if (!await rpc('wakapoint_consume_limit',{ p_bucket:`ip:${ipHash}`,p_limit:60 }) || !await rpc('wakapoint_consume_limit',{ p_bucket:`user:${user.id}`,p_limit:30 })) return reply({ error:{ code:'rate_limited',message:'Too many requests. Wait a minute and retry.' } },429,{ 'Retry-After':'60' });
      const contentLength = Number(request.headers.get('content-length') || 0);
      if (contentLength > 4096) return reply({ error:{ code:'input_too_large',message:'Request is too large.' } },413);
      const text = await request.text();
      if (new TextEncoder().encode(text).length > 4096) return reply({ error:{ code:'input_too_large',message:'Request is too large.' } },413);
      let body: unknown; try { body = JSON.parse(text); } catch { return reply({ error:{ code:'invalid_json',message:'Send valid JSON.' } },400); }
      if (!isObject(body)) return reply({ error:{ code:'invalid_input',message:'Send a request object.' } },400);
      const nipostKey = deps.env('NIPOST_API_KEY');
      if (body.action === 'health') return reply({ data:{ configured:!!nipostKey,service:'wakapoint-gateway' } });
      if (!nipostKey || !/^nipost_(?:test|live)_/.test(nipostKey)) return reply({ error:{ code:'upstream_not_configured',message:'Official postcode verification is awaiting service activation.' } },503);
      let path: string, cacheKey: string | null = null, code = '';
      if (body.action === 'lookup') {
        code = canonicalPostcode(body.code) || '';
        if (!code || ![1,3].includes(Number(body.level ?? 1))) return reply({ error:{ code:'invalid_postcode',message:'Enter a valid postcode and use lookup level 1 or 3.' } },400);
        const level = Number(body.level ?? 1);
        path = `/v1/lookup?code=${encodeURIComponent(code)}&level=${level}`;
        const keyHash = await crypto.subtle.digest('SHA-256',new TextEncoder().encode(nipostKey));
        const environment = Array.from(new Uint8Array(keyHash)).slice(0,8).map(v => v.toString(16).padStart(2,'0')).join('');
        cacheKey = `${environment}:${code}:${level}`;
        const cached = await rpc('wakapoint_cache_get',{p_key:cacheKey});
        if (cached) return reply({ data:cached, meta:{source:'official_nipost',cache:'hit'} });
      } else if (body.action === 'search') {
        if (typeof body.q !== 'string' || !/^[a-z0-9 -]{2,40}$/i.test(body.q)) return reply({ error:{ code:'invalid_query',message:'Enter a postcode prefix of 2–40 letters, numbers, spaces or hyphens.' } },400);
        path = `/v1/search/autocomplete?q=${encodeURIComponent(body.q.trim())}`;
      } else return reply({ error:{ code:'invalid_action',message:'Use lookup, search or health.' } },400);
      const response = await deps.fetch(`https://api.postcode.gov.ng${path}`,{ headers:{'X-API-Key':nipostKey},signal:AbortSignal.timeout(9000) });
      if (!response.ok) {
        const messages: Record<number,string> = {401:'The upstream key is invalid. Contact the administrator.',402:'Upstream credits are insufficient for this lookup.',403:'The upstream key does not permit this lookup level.',404:'This postcode was not found in the active NIPOST dataset.',429:'NIPOST is rate-limiting requests. Please retry later.'};
        return reply({ error:{code:'upstream_error',message:messages[response.status] || 'NIPOST is unavailable. Please retry later.'} },[401,402,403,404,429].includes(response.status) ? response.status : 502);
      }
      const envelope = await response.json();
      const data = body.action === 'lookup' ? filterLookup(envelope.data,code) : filterSuggestions(envelope.data,body.q as string);
      if (cacheKey && 'valid' in data && data.valid === true) await rpc('wakapoint_cache_put',{p_key:cacheKey,p_payload:data});
      return reply({ data,meta:{source:'official_nipost',cache:'miss'} });
    } catch { return reply({ error:{code:'service_unavailable',message:'The address service could not complete the request. Please retry.'} },503); }
  };
}
