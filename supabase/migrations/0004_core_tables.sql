-- filix · 0004 · core tables: customers, leads, bookings, payments, checklists
-- Idempotent.

create table if not exists public.customers (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  phone      text,
  email      text,
  company    text,
  kind       text not null default 'person' check (kind in ('person', 'venue', 'company')),
  language   text not null default 'es' check (language in ('es', 'en')),
  source     text,
  notes      text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Dedupe by phone when one is given; multiple customers with no phone (email-only) are fine.
create unique index if not exists customers_phone_key
  on public.customers (phone) where phone is not null and phone <> '';

create table if not exists public.leads (
  id                 uuid primary key default gen_random_uuid(),
  customer_id        uuid not null references public.customers(id) on delete cascade,
  event_type         public.event_type not null,
  event_date         date,
  city               text,
  address            text,
  attendance         integer,
  indoor_outdoor     text check (indoor_outdoor in ('indoor', 'outdoor', 'both')),
  duration_hours     numeric(4,1),
  message            text,
  language           text not null default 'es' check (language in ('es', 'en')),
  source             text,
  utm                jsonb not null default '{}'::jsonb,
  estimated_value    numeric(10,2),
  quote_amount       numeric(10,2),
  quote_sent_at      timestamptz,
  next_follow_up_at  timestamptz,
  status             public.lead_status not null default 'new',
  lost_reason        text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists leads_status_idx on public.leads (status);
create index if not exists leads_next_follow_up_idx on public.leads (next_follow_up_at);

create table if not exists public.lead_activities (
  id         uuid primary key default gen_random_uuid(),
  lead_id    uuid not null references public.leads(id) on delete cascade,
  author_id  uuid references auth.users(id) on delete set null,
  kind       text not null check (kind in ('note', 'call', 'status_change', 'email', 'sms', 'system')),
  body       text not null,
  created_at timestamptz not null default now()
);

create index if not exists lead_activities_lead_idx on public.lead_activities (lead_id, created_at);

create table if not exists public.bookings (
  id               uuid primary key default gen_random_uuid(),
  lead_id          uuid references public.leads(id) on delete set null,
  customer_id      uuid not null references public.customers(id) on delete restrict,
  title            text,
  event_type       public.event_type not null,
  start_at         timestamptz not null,
  end_at           timestamptz not null,
  setup_at         timestamptz,
  breakdown_at     timestamptz,
  location         text,
  attendance       integer,
  indoor_outdoor   text check (indoor_outdoor in ('indoor', 'outdoor', 'both')),
  total            numeric(10,2) not null default 0,
  deposit_required numeric(10,2) not null default 0,
  status           public.booking_status not null default 'tentative',
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  check (end_at > start_at)
);

create index if not exists bookings_start_idx on public.bookings (start_at);
create index if not exists bookings_status_idx on public.bookings (status);

create table if not exists public.payments (
  id         uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  amount     numeric(10,2) not null check (amount > 0),
  kind       public.payment_kind not null,
  method     public.payment_method not null,
  paid_at    timestamptz not null default now(),
  note       text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists payments_booking_idx on public.payments (booking_id);

-- Computed payment status — never stored, always derived from payments.
create or replace view public.booking_financials as
select
  b.id as booking_id,
  b.total,
  b.deposit_required,
  coalesce(p.paid_total, 0) as paid_total,
  b.total - coalesce(p.paid_total, 0) as balance,
  case
    when coalesce(p.paid_total, 0) >= b.total and b.total > 0 then 'paid'
    when coalesce(p.paid_total, 0) >= b.deposit_required and b.deposit_required > 0 then 'deposit_paid'
    else 'outstanding'
  end as payment_status
from public.bookings b
left join (
  select booking_id, sum(amount) as paid_total
  from public.payments
  group by booking_id
) p on p.booking_id = b.id;

create table if not exists public.checklist_templates (
  id         uuid primary key default gen_random_uuid(),
  phase      text not null check (phase in ('before', 'event_day', 'after')),
  label      text not null,
  sort_order integer not null default 0,
  active     boolean not null default true,
  unique (phase, label)
);

create table if not exists public.booking_checklist_items (
  id         uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  phase      text not null check (phase in ('before', 'event_day', 'after')),
  label      text not null,
  sort_order integer not null default 0,
  done       boolean not null default false,
  done_at    timestamptz,
  done_by    uuid references auth.users(id) on delete set null
);

create index if not exists booking_checklist_items_booking_idx on public.booking_checklist_items (booking_id, phase, sort_order);

-- Generate the checklist the moment a booking exists, from whatever templates
-- are currently active — covers both convert_lead_to_booking and any future
-- direct-booking path uniformly.
create or replace function public.generate_booking_checklist()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.booking_checklist_items (booking_id, phase, label, sort_order)
  select new.id, phase, label, sort_order
  from public.checklist_templates
  where active
  order by phase, sort_order;
  return new;
end;
$$;

drop trigger if exists on_booking_created_checklist on public.bookings;
create trigger on_booking_created_checklist
  after insert on public.bookings
  for each row execute function public.generate_booking_checklist();

create table if not exists public.booking_staff (
  id         uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  role       text not null default 'operator',
  created_at timestamptz not null default now(),
  unique (booking_id, user_id)
);

create table if not exists public.notification_outbox (
  id         uuid primary key default gen_random_uuid(),
  event      text not null,
  recipient  text not null check (recipient in ('owner', 'lead')),
  channel    text not null check (channel in ('email', 'sms')),
  to_address text not null,
  payload    jsonb not null default '{}'::jsonb,
  status     text not null default 'pending' check (status in ('pending', 'sent', 'failed')),
  created_at timestamptz not null default now(),
  sent_at    timestamptz
);

create index if not exists notification_outbox_pending_idx on public.notification_outbox (status) where status = 'pending';

create table if not exists public.analytics_events (
  id             bigint generated always as identity primary key,
  occurred_at    timestamptz not null default now(),
  event_type     text not null,
  path           text,
  referrer_host  text,
  visitor_hash   text,
  country        text,
  device         text
);

create index if not exists analytics_events_occurred_idx on public.analytics_events (occurred_at);
