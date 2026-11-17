import test from 'node:test';
import assert from 'node:assert/strict';
import { canonicalPostcode, createGateway, filterLookup, filterSuggestions } from '../supabase/functions/wakapoint-gateway/core';

const origin = 'https://wakapoint.example';
const token = 'Bearer synthetic-test-token-123456789';
function harness(options: { limited?:boolean; upstreamStatus?:number; cache?:unknown; missingKey?:boolean } = {}) {
  const calls: {url:string;body:unknown}[] = [];
  const env: Record<string,string> = { WAKAPOINT_ALLOWED_ORIGINS:origin,SUPABASE_URL:'https://project.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'synthetic-service-key',NIPOST_API_KEY:'nipost_test_synthetic-test-key' };
  if (options.missingKey) delete env.NIPOST_API_KEY;
  const fetcher = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input), body = typeof init?.body === 'string' ? JSON.parse(init.body) : null;
    calls.push({url,body});
    if (url.endsWith('/auth/v1/user')) return Response.json({id:'user-one'});
    if (url.endsWith('wakapoint_consume_limit')) return Response.json(!options.limited);
    if (url.endsWith('wakapoint_cache_get')) return Response.json(options.cache ?? null);
    if (url.endsWith('wakapoint_cache_put')) return new Response(null,{status:204});
    if (options.upstreamStatus) return Response.json({error:{message:'NIPOST_KEY_SECRET_SHOULD_NEVER_LEAK'}},{status:options.upstreamStatus});
    return Response.json({data:{postcode:'FC-01-A01-KP-27',valid:true,owner:{name:'Private Owner'},phone:'08012345678',administrative_address:{state_name:'FCT',owner_name:'Private Owner'},recent_house_address:{recent:'Public place, phone 08012345678'}}});
  }) as typeof fetch;
  return { calls,handler:createGateway({env:name => env[name],fetch:fetcher}) };
}
function request(body: unknown, auth = true, requestOrigin = origin) { return new Request('https://project.supabase.co/functions/v1/wakapoint-gateway',{method:'POST',headers:{Origin:requestOrigin,'Content-Type':'application/json',...(auth ? {Authorization:token} : {})},body:JSON.stringify(body)}); }

test('gateway refuses disallowed origins and unauthenticated requests before upstream access', async () => {
  const {handler,calls} = harness();
  assert.equal((await handler(request({action:'lookup'},true,'https://attacker.example'))).status,403);
  assert.equal((await handler(request({action:'lookup'},false))).status,401);
  assert.equal(calls.length,0);
});
test('preflight is allowed for configured origins without a token', async () => {
  const {handler,calls} = harness();
  const response = await handler(new Request('https://project.supabase.co/functions/v1/wakapoint-gateway',{method:'OPTIONS',headers:{Origin:origin}}));
  assert.equal(response.status,204);
  assert.equal(response.headers.get('Access-Control-Allow-Origin'),origin);
  assert.equal(calls.length,0);
});
test('gateway enforces database-backed limits and valid postcode inputs', async () => {
  const limited = harness({limited:true});
  assert.equal((await limited.handler(request({action:'lookup',code:'FC-01-A01-KP-27'}))).status,429);
  assert.ok(!limited.calls.some(call => call.url.startsWith('https://api.postcode.gov.ng')));
  const normal = harness();
  assert.equal((await normal.handler(request({action:'lookup',code:'FC-00-A01-KP-27'}))).status,400);
});
test('upstream payloads are allowlisted and only filtered data enters the cache', async () => {
  const {handler,calls} = harness();
  const response = await handler(request({action:'lookup',code:'fc01a01kp27',level:3}));
  assert.equal(response.status,200);
  const output = JSON.stringify(await response.json());
  assert.ok(!output.includes('Private Owner'));
  assert.ok(!output.includes('08012345678'));
  assert.ok(output.includes('[redacted]'));
  const cached = calls.find(call => call.url.endsWith('wakapoint_cache_put'));
  assert.ok(cached);
  assert.ok(!JSON.stringify(cached.body).includes('Private Owner'));
});
test('a valid cached lookup avoids a redundant upstream call', async () => {
  const cached = {postcode:'FC-01-A01-KP-27',valid:true};
  const {handler,calls} = harness({cache:cached});
  const response = await handler(request({action:'lookup',code:cached.postcode}));
  assert.equal((await response.json()).meta.cache,'hit');
  assert.ok(!calls.some(call => call.url.startsWith('https://api.postcode.gov.ng')));
});
test('upstream errors and missing secrets return fixed messages without secret payloads', async () => {
  const upstream = harness({upstreamStatus:403});
  const response = await upstream.handler(request({action:'lookup',code:'FC-01-A01-KP-27'}));
  assert.equal(response.status,403);
  assert.ok(!(await response.text()).includes('NIPOST_KEY_SECRET'));
  const missing = harness({missingKey:true});
  assert.equal((await missing.handler(request({action:'lookup',code:'FC-01-A01-KP-27'}))).status,503);
});
test('official segment suggestions extend only the given prefix', () => {
  assert.deepEqual(filterSuggestions({segment:'unit',suggestions:[{code:'27',label:'Public building',owner:'private'}]},'FC 01 A01 KP'),[{postcode:'FC-01-A01-KP-27',label:'Public building'}]);
  assert.equal(canonicalPostcode('fc 01 a01 kp 27'),'FC-01-A01-KP-27');
  assert.throws(() => filterLookup({valid:'true'},'FC-01-A01-KP-27'));
});
