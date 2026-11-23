-- WakaPoint website storage. Run in your project's SQL editor.
-- Application sessions are email/Google Supabase Auth users, not the unauthenticated anon role.
begin;

create table if not exists public.saved_addresses (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  saved_at timestamptz not null default now(),
  result jsonb not null,
  point jsonb,
  postcode text,
  constraint saved_address_input check (jsonb_typeof(result) = 'object' and result ? 'input' and jsonb_typeof(result -> 'input') = 'string' and char_length(result ->> 'input') between 1 and 2000),
  constraint saved_address_postcode check (postcode is null or postcode ~ '^[A-Z]{2}-(0[1-9]|[1-9][0-9])-[A-Z][A-Z0-9]{2}-[A-Z]{2}-(0[1-9]|[1-9][0-9])$')
);
create index if not exists saved_addresses_user_time_idx on public.saved_addresses(user_id, saved_at desc);
alter table public.saved_addresses enable row level security;
revoke all on public.saved_addresses from anon;
grant select, insert, update, delete on public.saved_addresses to authenticated;
drop policy if exists saved_addresses_select on public.saved_addresses;
drop policy if exists saved_addresses_insert on public.saved_addresses;
drop policy if exists saved_addresses_update on public.saved_addresses;
drop policy if exists saved_addresses_delete on public.saved_addresses;
create policy saved_addresses_select on public.saved_addresses for select to authenticated using ((select auth.uid()) = user_id and coalesce((select auth.jwt()) ->> 'is_anonymous','false') = 'false');
create policy saved_addresses_insert on public.saved_addresses for insert to authenticated with check ((select auth.uid()) = user_id and coalesce((select auth.jwt()) ->> 'is_anonymous','false') = 'false');
create policy saved_addresses_update on public.saved_addresses for update to authenticated using ((select auth.uid()) = user_id and coalesce((select auth.jwt()) ->> 'is_anonymous','false') = 'false') with check ((select auth.uid()) = user_id and coalesce((select auth.jwt()) ->> 'is_anonymous','false') = 'false');
create policy saved_addresses_delete on public.saved_addresses for delete to authenticated using ((select auth.uid()) = user_id and coalesce((select auth.jwt()) ->> 'is_anonymous','false') = 'false');

-- Atomically persist this authenticated account's library. RLS applies to every operation.
create or replace function public.save_wakapoint_library(p_records jsonb)
returns void language plpgsql security invoker set search_path = '' as $$
declare owner_id uuid := auth.uid(); saved_count integer;
begin
  if owner_id is null or coalesce(auth.jwt() ->> 'is_anonymous','false') <> 'false' then raise exception 'Authentication required'; end if;
  if p_records is null or jsonb_typeof(p_records) is distinct from 'array' then raise exception 'Send an address array'; end if;
  if jsonb_array_length(p_records) > 100 then raise exception 'Library limit is 100 addresses'; end if;
  delete from public.saved_addresses where user_id = owner_id and id not in (select (item ->> 'id')::uuid from jsonb_array_elements(p_records) as item);
  insert into public.saved_addresses(id, user_id, saved_at, result, point, postcode)
  select (item ->> 'id')::uuid, owner_id, (item ->> 'savedAt')::timestamptz, item -> 'result', nullif(item -> 'point', 'null'::jsonb), item ->> 'postcode'
  from jsonb_array_elements(p_records) as item
  on conflict(id) do update set saved_at = excluded.saved_at, result = excluded.result, point = excluded.point, postcode = excluded.postcode
  where public.saved_addresses.user_id = owner_id;
  get diagnostics saved_count = row_count;
  if saved_count <> jsonb_array_length(p_records) then raise exception 'An address could not be saved'; end if;
end;
$$;
revoke all on function public.save_wakapoint_library(jsonb) from public, anon;
grant execute on function public.save_wakapoint_library(jsonb) to authenticated;

-- Gateway-only storage: no direct browser access, no raw addresses or upstream owner data.
create schema if not exists wakapoint_private;
revoke all on schema wakapoint_private from public, anon, authenticated;
grant usage on schema wakapoint_private to service_role;
create table if not exists wakapoint_private.rate_limits (
  bucket text not null,
  window_start timestamptz not null,
  hits integer not null default 1,
  primary key(bucket, window_start)
);
alter table wakapoint_private.rate_limits enable row level security;
create index if not exists rate_limits_window_idx on wakapoint_private.rate_limits(window_start);
grant select, insert, update, delete on wakapoint_private.rate_limits to service_role;
create table if not exists wakapoint_private.postcode_cache (
  cache_key text primary key,
  payload jsonb not null,
  expires_at timestamptz not null
);
alter table wakapoint_private.postcode_cache enable row level security;
create index if not exists postcode_cache_expiry_idx on wakapoint_private.postcode_cache(expires_at);
grant select, insert, update, delete on wakapoint_private.postcode_cache to service_role;

create or replace function public.wakapoint_consume_limit(p_bucket text, p_limit integer default 30)
returns boolean language plpgsql security invoker set search_path = '' as $$
declare current_hits integer;
begin
  if p_limit < 1 or p_limit > 120 or char_length(p_bucket) > 160 then raise exception 'Invalid rate limit'; end if;
  delete from wakapoint_private.rate_limits where window_start < now() - interval '2 minutes';
  insert into wakapoint_private.rate_limits(bucket, window_start, hits) values(p_bucket, date_trunc('minute', now()), 1)
  on conflict(bucket, window_start) do update set hits = wakapoint_private.rate_limits.hits + 1 returning hits into current_hits;
  return current_hits <= p_limit;
end;
$$;
revoke all on function public.wakapoint_consume_limit(text, integer) from public, anon, authenticated;
grant execute on function public.wakapoint_consume_limit(text, integer) to service_role;

create or replace function public.wakapoint_cache_get(p_key text)
returns jsonb language sql security invoker set search_path = '' as $$
  select payload from wakapoint_private.postcode_cache where cache_key = p_key and expires_at > now();
$$;
create or replace function public.wakapoint_cache_put(p_key text, p_payload jsonb)
returns void language plpgsql security invoker set search_path = '' as $$
begin
  delete from wakapoint_private.postcode_cache where expires_at < now();
  insert into wakapoint_private.postcode_cache(cache_key, payload, expires_at) values(p_key, p_payload, now() + interval '1 hour')
  on conflict(cache_key) do update set payload = excluded.payload, expires_at = excluded.expires_at;
end;
$$;
revoke all on function public.wakapoint_cache_get(text) from public, anon, authenticated;
revoke all on function public.wakapoint_cache_put(text,jsonb) from public, anon, authenticated;
grant execute on function public.wakapoint_cache_get(text) to service_role;
grant execute on function public.wakapoint_cache_put(text,jsonb) to service_role;
commit;
