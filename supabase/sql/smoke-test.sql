-- Run with execute_sql. All fixtures and writes are rolled back; no emails are sent.
begin;
select set_config('wakapoint.test.user_a', gen_random_uuid()::text, true),
       set_config('wakapoint.test.user_b', gen_random_uuid()::text, true),
       set_config('wakapoint.test.address_a', gen_random_uuid()::text, true),
       set_config('wakapoint.test.address_b', gen_random_uuid()::text, true);
insert into auth.users(id, email, email_confirmed_at, raw_app_meta_data, raw_user_meta_data)
select id::uuid, id || '@example.invalid', now(), '{"provider":"email"}'::jsonb, '{}'::jsonb
from (values (current_setting('wakapoint.test.user_a')), (current_setting('wakapoint.test.user_b'))) users(id);
set local role authenticated;
select set_config('request.jwt.claims', jsonb_build_object('sub', current_setting('wakapoint.test.user_a'), 'role', 'authenticated', 'is_anonymous', false)::text, true);
do $$
declare payload jsonb := jsonb_build_array(jsonb_build_object('id', current_setting('wakapoint.test.address_a'), 'savedAt', now(), 'result', jsonb_build_object('input', 'Fixture destination'), 'point', null, 'postcode', null));
begin
  if (select count(*) from public.notifications) <> 1 then raise exception 'Welcome notification missing'; end if;
  perform public.save_wakapoint_library(payload);
  perform public.save_wakapoint_library(payload);
  if (select count(*) from public.saved_addresses) <> 1 then raise exception 'Save failed'; end if;
  if (select count(*) from public.notifications) <> 2 then raise exception 'Duplicate save notification'; end if;
  begin perform public.save_wakapoint_library(null); raise exception 'NULL accepted';
  exception when raise_exception then if sqlerrm <> 'Send an address array' then raise; end if; end;
  begin perform public.save_wakapoint_library('null'::jsonb); raise exception 'JSON null accepted';
  exception when raise_exception then if sqlerrm <> 'Send an address array' then raise; end if; end;
  if (select count(*) from public.saved_addresses) <> 1 then raise exception 'Invalid payload deleted library'; end if;
  begin update public.notifications set title = 'Spoofed update'; raise exception 'Content tampering allowed';
  exception when insufficient_privilege then null; end;
  update public.notifications set read_at = now();
  if exists(select 1 from public.notifications where read_at is null) then raise exception 'Read status failed'; end if;
  begin perform public.wakapoint_consume_limit('fixture', 30); raise exception 'Private RPC accessible';
  exception when insufficient_privilege then null; end;
end;
$$;
select set_config('request.jwt.claims', jsonb_build_object('sub', current_setting('wakapoint.test.user_b'), 'role', 'authenticated', 'is_anonymous', false)::text, true);
do $$
begin
  if exists(select 1 from public.saved_addresses) then raise exception 'Cross-account address leak'; end if;
  if (select count(*) from public.notifications) <> 1 then raise exception 'Cross-account notification leak'; end if;
  perform public.save_wakapoint_library(jsonb_build_array(jsonb_build_object('id', current_setting('wakapoint.test.address_b'), 'savedAt', now(), 'result', jsonb_build_object('input', 'Second fixture destination'))));
  begin
    perform public.save_wakapoint_library(jsonb_build_array(jsonb_build_object('id', current_setting('wakapoint.test.address_a'), 'savedAt', now(), 'result', jsonb_build_object('input', 'Foreign fixture'))));
    raise exception 'Foreign ID accepted';
  exception when insufficient_privilege then null;
    when raise_exception then if sqlerrm <> 'An address could not be saved' then raise; end if;
  end;
  if (select count(*) from public.saved_addresses) <> 1 then raise exception 'Foreign ID failure lost records'; end if;
end;
$$;
select set_config('request.jwt.claims', jsonb_build_object('sub', current_setting('wakapoint.test.user_b'), 'role', 'authenticated', 'is_anonymous', true)::text, true);
do $$
begin
  if exists(select 1 from public.saved_addresses) or exists(select 1 from public.notifications) then raise exception 'Anonymous account sees data'; end if;
  begin perform public.save_wakapoint_library('[]'::jsonb); raise exception 'Anonymous save accepted';
  exception when raise_exception then if sqlerrm <> 'Authentication required' then raise; end if; end;
end;
$$;
set local role anon;
do $$
begin
  begin perform public.save_wakapoint_library('[]'::jsonb); raise exception 'Anon RPC allowed';
  exception when insufficient_privilege then null; end;
  begin perform public.wakapoint_consume_limit('fixture', 30); raise exception 'Anon private RPC allowed';
  exception when insufficient_privilege then null; end;
end;
$$;
reset role;
select 'PASS: private libraries, atomic invalid-payload rollback, account isolation, notification deduplication/read permissions, anonymous denial and private RPC denial' as result;
rollback;
