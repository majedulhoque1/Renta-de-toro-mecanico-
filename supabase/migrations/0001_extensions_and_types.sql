-- filix · 0001 · extensions + enum types
-- Idempotent: safe to re-run on a fresh or partially-built database.
-- Adapted from booking-crm-kit 0001 (adds 'staff' to app_role for Filix OS).

create extension if not exists pgcrypto;   -- gen_random_uuid()

do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum ('owner', 'staff');
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'lead_status') then
    create type public.lead_status as enum (
      'new', 'contacted', 'qualified', 'quote_sent', 'negotiating',
      'booked', 'completed', 'lost'
    );
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'booking_status') then
    create type public.booking_status as enum ('tentative', 'confirmed', 'completed', 'cancelled');
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'payment_kind') then
    create type public.payment_kind as enum ('deposit', 'balance', 'other');
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'payment_method') then
    create type public.payment_method as enum ('cash', 'zelle', 'venmo', 'card', 'other');
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'event_type') then
    create type public.event_type as enum (
      'cumpleanos', 'quinceanera', 'bautizo', 'boda',
      'corporativo', 'bar_nightlife', 'festival', 'universidad', 'otro'
    );
  end if;
end $$;
