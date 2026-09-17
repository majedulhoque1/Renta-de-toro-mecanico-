-- filix · 0002 · runtime config store + contract version stamp
-- Idempotent. Adapted from booking-crm-kit 0002.
--
-- The RPCs and the public site read these at runtime — never hardcode a
-- price, phone number, or brand string in application code.
--   timezone               IANA tz for date math ('America/Chicago')
--   brand_name             working public brand name (owner confirms; "Filix" default)
--   deposit_percent        integer 0-100, deposit required at booking time
--   notify_owner_email     destination for new-lead / priority emails
--   notify_owner_phone     destination for SMS alerts ('' = disabled)
--   price_cumpleanos ... price_otro   "desde $" starting price per event_type, in whole dollars, '' = not set
create table if not exists public.site_settings (
  key        text primary key,
  value      text not null default '',
  updated_at timestamptz not null default now()
);

insert into public.site_settings (key, value) values
  ('timezone', 'America/Chicago'),
  ('brand_name', 'Filix'),
  ('deposit_percent', '50'),
  ('notify_owner_email', ''),
  ('notify_owner_phone', ''),
  ('price_cumpleanos', ''),
  ('price_quinceanera', ''),
  ('price_bautizo', ''),
  ('price_boda', ''),
  ('price_corporativo', ''),
  ('price_bar_nightlife', ''),
  ('price_festival', ''),
  ('price_universidad', ''),
  ('price_otro', '')
on conflict (key) do nothing;

create table if not exists public.kit_meta (
  id               boolean primary key default true check (id),
  contract_version integer not null,
  updated_at       timestamptz not null default now()
);

insert into public.kit_meta (id, contract_version) values (true, 1)
on conflict (id) do update
  set contract_version = excluded.contract_version, updated_at = now();

-- Resolves site_settings.timezone -> 'America/Chicago' fallback. Used by
-- every date/day-bucketing calculation so a timezone change is one UPDATE,
-- never a code edit.
create or replace function public.filix_timezone()
returns text
language sql stable security definer set search_path = public as $$
  select coalesce(nullif((select value from public.site_settings where key = 'timezone'), ''), 'America/Chicago');
$$;
