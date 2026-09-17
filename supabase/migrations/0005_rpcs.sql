-- filix · 0005 · RPC API surface (the privacy boundary)
-- The browser calls ONLY these. Each is SECURITY DEFINER with search_path = public.
-- Idempotent (create or replace).

-- ============================================================
-- PUBLIC (anon) — the booking wizard on the public site
-- ============================================================

-- Anon-callable. Upserts the customer by phone, inserts the lead + a system
-- activity row, enqueues an owner notification. Never exposes existing data
-- back to the caller beyond the tagged status.
create or replace function public.submit_booking_request(
  p_name           text,
  p_phone          text,
  p_email          text,
  p_event_type     public.event_type,
  p_event_date     date,
  p_city           text,
  p_attendance     integer,
  p_indoor_outdoor text,
  p_duration_hours numeric,
  p_message        text,
  p_language       text default 'es',
  p_source         text default 'website',
  p_honeypot       text default ''
)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_customer_id uuid;
  v_lead_id     uuid;
  v_owner_email text;
begin
  -- Honeypot: a real visitor never fills this hidden field.
  if p_honeypot is not null and p_honeypot <> '' then
    return jsonb_build_object('status', 'ok'); -- pretend success, drop silently
  end if;

  if coalesce(trim(p_name), '') = '' or coalesce(trim(p_phone), '') = '' then
    return jsonb_build_object('status', 'invalid_input');
  end if;

  if p_indoor_outdoor is not null and p_indoor_outdoor not in ('indoor', 'outdoor', 'both') then
    return jsonb_build_object('status', 'invalid_input');
  end if;

  -- Rate limit: same phone can't submit more than 3 requests in 10 minutes.
  if (
    select count(*) from public.leads l
    join public.customers c on c.id = l.customer_id
    where c.phone = p_phone and l.created_at > now() - interval '10 minutes'
  ) >= 3 then
    return jsonb_build_object('status', 'rate_limited');
  end if;

  insert into public.customers (name, phone, email, language, source)
  values (p_name, p_phone, nullif(p_email, ''), coalesce(p_language, 'es'), p_source)
  on conflict (phone) where phone is not null and phone <> ''
  do update set name = excluded.name, email = coalesce(excluded.email, public.customers.email)
  returning id into v_customer_id;

  insert into public.leads (
    customer_id, event_type, event_date, city, attendance,
    indoor_outdoor, duration_hours, message, language, source, status
  ) values (
    v_customer_id, p_event_type, p_event_date, nullif(p_city, ''), p_attendance,
    nullif(p_indoor_outdoor, ''), p_duration_hours, nullif(p_message, ''),
    coalesce(p_language, 'es'), p_source, 'new'
  )
  returning id into v_lead_id;

  insert into public.lead_activities (lead_id, kind, body)
  values (v_lead_id, 'system', 'Lead created from public booking wizard.');

  select value into v_owner_email from public.site_settings where key = 'notify_owner_email';
  if coalesce(v_owner_email, '') <> '' then
    insert into public.notification_outbox (event, recipient, channel, to_address, payload)
    values (
      'lead_created', 'owner', 'email', v_owner_email,
      jsonb_build_object(
        'lead_id', v_lead_id, 'name', p_name, 'phone', p_phone,
        'event_type', p_event_type, 'event_date', p_event_date, 'city', p_city
      )
    );
  end if;

  return jsonb_build_object('status', 'ok', 'lead_id', v_lead_id);
end;
$$;

revoke all on function public.submit_booking_request(
  text, text, text, public.event_type, date, text, integer, text, numeric, text, text, text, text
) from public;
grant execute on function public.submit_booking_request(
  text, text, text, public.event_type, date, text, integer, text, numeric, text, text, text, text
) to anon, authenticated;

-- ============================================================
-- OWNER (authenticated, gated by has_role)
-- ============================================================

create or replace function public.convert_lead_to_booking(
  p_lead_id          uuid,
  p_start_at         timestamptz,
  p_end_at           timestamptz,
  p_setup_at         timestamptz,
  p_breakdown_at     timestamptz,
  p_location         text,
  p_total            numeric,
  p_deposit_required numeric,
  p_title            text default null
)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_lead      public.leads;
  v_booking_id uuid;
begin
  if not public.has_role(auth.uid(), 'owner') then
    return jsonb_build_object('status', 'forbidden');
  end if;

  select * into v_lead from public.leads where id = p_lead_id;
  if v_lead.id is null then
    return jsonb_build_object('status', 'not_found');
  end if;

  if p_end_at <= p_start_at then
    return jsonb_build_object('status', 'invalid_input');
  end if;

  insert into public.bookings (
    lead_id, customer_id, title, event_type, start_at, end_at,
    setup_at, breakdown_at, location, attendance, indoor_outdoor,
    total, deposit_required, status
  ) values (
    v_lead.id, v_lead.customer_id, p_title, v_lead.event_type, p_start_at, p_end_at,
    p_setup_at, p_breakdown_at, p_location, v_lead.attendance, v_lead.indoor_outdoor,
    p_total, p_deposit_required, 'tentative'
  )
  returning id into v_booking_id;

  update public.leads set status = 'booked', updated_at = now() where id = v_lead.id;

  insert into public.lead_activities (lead_id, author_id, kind, body)
  values (v_lead.id, auth.uid(), 'status_change', 'Converted to booking.');

  return jsonb_build_object('status', 'ok', 'booking_id', v_booking_id);
end;
$$;

revoke all on function public.convert_lead_to_booking(
  uuid, timestamptz, timestamptz, timestamptz, timestamptz, text, numeric, numeric, text
) from public;
grant execute on function public.convert_lead_to_booking(
  uuid, timestamptz, timestamptz, timestamptz, timestamptz, text, numeric, numeric, text
) to authenticated;

create or replace function public.record_payment(
  p_booking_id uuid,
  p_amount     numeric,
  p_kind       public.payment_kind,
  p_method     public.payment_method,
  p_note       text default null
)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_payment_id uuid;
begin
  if not public.is_staff_or_owner(auth.uid()) then
    return jsonb_build_object('status', 'forbidden');
  end if;

  if not exists (select 1 from public.bookings where id = p_booking_id) then
    return jsonb_build_object('status', 'not_found');
  end if;

  if p_amount <= 0 then
    return jsonb_build_object('status', 'invalid_input');
  end if;

  insert into public.payments (booking_id, amount, kind, method, note, created_by)
  values (p_booking_id, p_amount, p_kind, p_method, nullif(p_note, ''), auth.uid())
  returning id into v_payment_id;

  return jsonb_build_object('status', 'ok', 'payment_id', v_payment_id);
end;
$$;

revoke all on function public.record_payment(uuid, numeric, public.payment_kind, public.payment_method, text) from public;
grant execute on function public.record_payment(uuid, numeric, public.payment_kind, public.payment_method, text) to authenticated;

-- Home screen stat cards: upcoming events, expected revenue, open leads,
-- quotes awaiting response, follow-ups due — all within [p_from, p_to].
create or replace function public.dashboard_summary(p_from date, p_to date)
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  v_upcoming_events   integer;
  v_expected_revenue  numeric;
  v_open_leads        integer;
  v_quotes_awaiting    integer;
  v_followups_due     integer;
begin
  if not public.is_staff_or_owner(auth.uid()) then
    raise exception 'forbidden';
  end if;

  select count(*) into v_upcoming_events
  from public.bookings
  where start_at::date between p_from and p_to and status in ('tentative', 'confirmed');

  select coalesce(sum(total), 0) into v_expected_revenue
  from public.bookings
  where start_at::date between p_from and p_to and status in ('tentative', 'confirmed');

  select count(*) into v_open_leads
  from public.leads
  where status not in ('booked', 'completed', 'lost');

  select count(*) into v_quotes_awaiting
  from public.leads
  where status = 'quote_sent';

  select count(*) into v_followups_due
  from public.leads
  where next_follow_up_at is not null and next_follow_up_at::date <= p_to
    and status not in ('booked', 'completed', 'lost');

  return jsonb_build_object(
    'upcoming_events', v_upcoming_events,
    'expected_revenue', v_expected_revenue,
    'open_leads', v_open_leads,
    'quotes_awaiting', v_quotes_awaiting,
    'followups_due', v_followups_due
  );
end;
$$;

revoke all on function public.dashboard_summary(date, date) from public;
grant execute on function public.dashboard_summary(date, date) to authenticated;

-- "Today's Priorities" list: follow-ups due, stale quotes (sent >2 days ago,
-- no reply), unconfirmed bookings within 7 days, unpaid balances before the
-- event date, bookings with no staff assigned within 7 days.
create or replace function public.today_priorities()
returns table (
  priority_type text,
  severity      text,
  label         text,
  ref_id        uuid,
  ref_table     text
)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_staff_or_owner(auth.uid()) then
    raise exception 'forbidden';
  end if;

  return query
  select 'follow_up_due', 'yellow',
    'Follow up: ' || c.name || ' (' || l.event_type::text || ')',
    l.id, 'leads'
  from public.leads l
  join public.customers c on c.id = l.customer_id
  where l.next_follow_up_at is not null
    and l.next_follow_up_at::date <= (now() at time zone public.filix_timezone())::date
    and l.status not in ('booked', 'completed', 'lost')

  union all

  select 'stale_quote', 'red',
    'No reply on quote: ' || c.name,
    l.id, 'leads'
  from public.leads l
  join public.customers c on c.id = l.customer_id
  where l.status = 'quote_sent'
    and l.quote_sent_at is not null
    and l.quote_sent_at < now() - interval '2 days'

  union all

  select 'unconfirmed_booking', 'yellow',
    'Confirm: ' || c.name || ' on ' || to_char(b.start_at, 'Mon DD'),
    b.id, 'bookings'
  from public.bookings b
  join public.customers c on c.id = b.customer_id
  where b.status = 'tentative'
    and b.start_at <= now() + interval '7 days'

  union all

  select 'unpaid_balance', 'red',
    'Balance due before event: ' || c.name,
    b.id, 'bookings'
  from public.bookings b
  join public.customers c on c.id = b.customer_id
  join public.booking_financials f on f.booking_id = b.id
  where b.status in ('tentative', 'confirmed')
    and b.start_at <= now() + interval '3 days'
    and f.payment_status <> 'paid'

  union all

  select 'unassigned_staff', 'green',
    'No staff assigned: ' || c.name || ' on ' || to_char(b.start_at, 'Mon DD'),
    b.id, 'bookings'
  from public.bookings b
  join public.customers c on c.id = b.customer_id
  where b.status in ('tentative', 'confirmed')
    and b.start_at <= now() + interval '7 days'
    and not exists (select 1 from public.booking_staff bs where bs.booking_id = b.id);
end;
$$;

revoke all on function public.today_priorities() from public;
grant execute on function public.today_priorities() to authenticated;

-- Staff need to tick checklist items on bookings they're assigned to, but
-- must never get a raw UPDATE grant on booking_checklist_items (that would
-- let them rewrite labels/phase, not just tick a box). A narrow RPC is the
-- only write path — see postgres-service-role-only-table-needs-rpc pattern.
create or replace function public.tick_checklist_item(p_item_id uuid, p_done boolean)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_booking_id uuid;
  v_assigned   boolean;
begin
  select booking_id into v_booking_id from public.booking_checklist_items where id = p_item_id;
  if v_booking_id is null then
    return jsonb_build_object('status', 'not_found');
  end if;

  select public.has_role(auth.uid(), 'owner') or exists (
    select 1 from public.booking_staff
    where booking_id = v_booking_id and user_id = auth.uid()
  ) into v_assigned;

  if not v_assigned then
    return jsonb_build_object('status', 'forbidden');
  end if;

  update public.booking_checklist_items
  set done = p_done,
      done_at = case when p_done then now() else null end,
      done_by = case when p_done then auth.uid() else null end
  where id = p_item_id;

  return jsonb_build_object('status', 'ok');
end;
$$;

revoke all on function public.tick_checklist_item(uuid, boolean) from public;
grant execute on function public.tick_checklist_item(uuid, boolean) to authenticated;

-- The ONLY site_settings read available to anon: brand name + starting
-- prices. Never expose notify_owner_email/phone or any other key to the
-- public site — that's why this isn't a direct table grant.
create or replace function public.public_site_settings()
returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_object_agg(key, value)
  from public.site_settings
  where key = 'brand_name' or key like 'price_%';
$$;

revoke all on function public.public_site_settings() from public;
grant execute on function public.public_site_settings() to anon, authenticated;
