-- Durable, account-owned activity. Notification text never contains addresses.
begin;
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_key text not null,
  kind text not null check (kind in ('welcome', 'address_saved')),
  title text not null check (char_length(title) between 1 and 120),
  body text not null check (char_length(body) between 1 and 500),
  action text not null check (action in ('resolve', 'saved')),
  created_at timestamptz not null default now(),
  read_at timestamptz,
  unique (user_id, event_key)
);
create index if not exists notifications_user_time_idx on public.notifications(user_id, created_at desc, id desc);
alter table public.notifications enable row level security;
revoke all on public.notifications from public, anon, authenticated;
grant select on public.notifications to authenticated;
grant update(read_at) on public.notifications to authenticated;
create policy notifications_select on public.notifications for select to authenticated
  using ((select auth.uid()) = user_id and coalesce((select auth.jwt()) ->> 'is_anonymous', 'false') = 'false');
create policy notifications_read on public.notifications for update to authenticated
  using ((select auth.uid()) = user_id and coalesce((select auth.jwt()) ->> 'is_anonymous', 'false') = 'false')
  with check ((select auth.uid()) = user_id and coalesce((select auth.jwt()) ->> 'is_anonymous', 'false') = 'false');

-- Trigger functions are private, callable only by their triggers, with a fixed search path.
create or replace function wakapoint_private.notify_address_saved()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.notifications(user_id, event_key, kind, title, body, action)
  values (new.user_id, 'address:' || new.id::text, 'address_saved', 'Address saved',
    'A new address is ready in your private library. Review it before dispatch.', 'saved')
  on conflict (user_id, event_key) do nothing;
  return new;
end;
$$;
revoke all on function wakapoint_private.notify_address_saved() from public, anon, authenticated;
create trigger saved_address_notification after insert on public.saved_addresses
  for each row execute function wakapoint_private.notify_address_saved();

create or replace function wakapoint_private.notify_verified_account()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.email_confirmed_at is not null and not coalesce(new.is_anonymous, false) then
    insert into public.notifications(user_id, event_key, kind, title, body, action)
    values (new.id, 'welcome', 'welcome', 'Welcome to WakaPoint',
      'Your private workspace is ready. Start with an address, then review the delivery details.', 'resolve')
    on conflict (user_id, event_key) do nothing;
  end if;
  return new;
end;
$$;
revoke all on function wakapoint_private.notify_verified_account() from public, anon, authenticated;
create trigger verified_account_notification after insert or update of email_confirmed_at on auth.users
  for each row execute function wakapoint_private.notify_verified_account();
commit;
