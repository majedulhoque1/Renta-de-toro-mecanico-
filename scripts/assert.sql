-- Contract assertions. Run after migrations + seed are applied. Any failure raises
-- and (with psql -v ON_ERROR_STOP=1) aborts the verify run with a non-zero exit.

-- 1. object existence -------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_proc where proname = 'has_role') then raise exception 'missing has_role()'; end if;
  if not exists (select 1 from pg_proc where proname = 'is_staff_or_owner') then raise exception 'missing is_staff_or_owner()'; end if;
  if not exists (select 1 from pg_proc where proname = 'filix_timezone') then raise exception 'missing filix_timezone()'; end if;
  if (select count(distinct proname) from pg_proc
      where proname in ('submit_booking_request','convert_lead_to_booking','record_payment',
                         'dashboard_summary','today_priorities','tick_checklist_item',
                         'public_site_settings')) <> 7
    then raise exception 'missing an RPC'; end if;
  if not exists (select 1 from pg_trigger where tgname = 'on_booking_created_checklist')
    then raise exception 'missing checklist-generation trigger'; end if;
  if not exists (select 1 from pg_class where relname = 'booking_financials' and relkind = 'v')
    then raise exception 'missing booking_financials view'; end if;
end $$;

-- 2. contract version ---------------------------------------------------------------
do $$
begin
  if (select contract_version from public.kit_meta) <> 1
    then raise exception 'unexpected contract_version'; end if;
end $$;

-- 3. RLS posture ----------------------------------------------------------------------
do $$
declare n int;
begin
  if not (select relrowsecurity from pg_class where oid = 'public.analytics_events'::regclass)
    then raise exception 'analytics_events RLS not enabled'; end if;
  select count(*) into n from pg_policies where schemaname='public' and tablename='analytics_events';
  if n <> 0 then raise exception 'analytics_events must have no policy (deny-all), found %', n; end if;

  if not (select relrowsecurity from pg_class where oid = 'public.leads'::regclass)
    then raise exception 'leads RLS not enabled'; end if;
  if not (select relrowsecurity from pg_class where oid = 'public.payments'::regclass)
    then raise exception 'payments RLS not enabled'; end if;
  if not (select relrowsecurity from pg_class where oid = 'public.customers'::regclass)
    then raise exception 'customers RLS not enabled'; end if;

  select count(*) into n from pg_policies where schemaname='public' and tablename='leads';
  if n <> 1 then raise exception 'leads should have exactly 1 policy (owner-only), found %', n; end if;
end $$;

-- 4. seed produced the checklist template rows -----------------------------------------
do $$
declare n int;
begin
  select count(*) into n from public.checklist_templates where active;
  if n <> 20 then raise exception 'expected 20 active checklist templates from seed, found %', n; end if;
end $$;

-- 5. anon cannot read any operational table directly -----------------------------------
do $$
begin
  execute 'set role anon';
  begin
    perform count(*) from public.customers;
    raise exception 'anon should not be able to select customers';
  exception when insufficient_privilege then
    raise notice 'ok: anon blocked from customers';
  end;
  begin
    perform count(*) from public.leads;
    raise exception 'anon should not be able to select leads';
  exception when insufficient_privilege then
    raise notice 'ok: anon blocked from leads';
  end;
  begin
    perform count(*) from public.payments;
    raise exception 'anon should not be able to select payments';
  exception when insufficient_privilege then
    raise notice 'ok: anon blocked from payments';
  end;
  execute 'reset role';
end $$;

-- 6. public_site_settings() never leaks owner contact info -----------------------------
do $$
declare v jsonb;
begin
  update public.site_settings set value = 'owner@example.com' where key = 'notify_owner_email';
  update public.site_settings set value = '+19995551234' where key = 'notify_owner_phone';
  v := public.public_site_settings();
  if v ? 'notify_owner_email' or v ? 'notify_owner_phone' then
    raise exception 'public_site_settings leaked a private key: %', v;
  end if;
  if not (v ? 'brand_name') then raise exception 'public_site_settings missing brand_name'; end if;
end $$;

-- 7. submit_booking_request: happy path, invalid input, honeypot, rate limit -----------
do $$
declare
  v_res        jsonb;
  v_lead_id    uuid;
  v_lead_count int;
begin
  select count(*) into v_lead_count from public.leads;

  -- invalid: missing name
  v_res := public.submit_booking_request('', '9165551111', null, 'cumpleanos', current_date + 10,
    'Sacramento', 30, 'outdoor', 3, null, 'es', 'website', '');
  if v_res->>'status' <> 'invalid_input' then raise exception 'expected invalid_input, got %', v_res; end if;

  -- honeypot: silently dropped, no lead created
  v_res := public.submit_booking_request('Bot', '9165550000', null, 'cumpleanos', current_date + 10,
    'Sacramento', 30, 'outdoor', 3, null, 'es', 'website', 'filled');
  if v_res->>'status' <> 'ok' then raise exception 'honeypot call should still report ok, got %', v_res; end if;
  if exists (select 1 from public.customers where phone = '9165550000') then
    raise exception 'honeypot submission should not have created a customer';
  end if;

  -- happy path
  v_res := public.submit_booking_request('Maria Lopez', '9165552222', 'maria@example.com',
    'quinceanera', current_date + 20, 'Sacramento', 80, 'outdoor', 4,
    'Necesito el toro para el 15 de mi hija', 'es', 'website', '');
  if v_res->>'status' <> 'ok' then raise exception 'expected ok, got %', v_res; end if;
  v_lead_id := (v_res->>'lead_id')::uuid;

  select count(*) into v_lead_count from public.leads;
  if not exists (select 1 from public.leads where id = v_lead_id and status = 'new') then
    raise exception 'lead row not created with status new';
  end if;
  if not exists (select 1 from public.lead_activities where lead_id = v_lead_id and kind = 'system') then
    raise exception 'system activity row not created';
  end if;

  -- rate limit: 2 more from the same phone are fine (total 3), the 4th is blocked
  perform public.submit_booking_request('Maria Lopez', '9165552222', null, 'cumpleanos', current_date + 21,
    'Sacramento', 10, 'indoor', 2, null, 'es', 'website', '');
  perform public.submit_booking_request('Maria Lopez', '9165552222', null, 'cumpleanos', current_date + 22,
    'Sacramento', 10, 'indoor', 2, null, 'es', 'website', '');
  v_res := public.submit_booking_request('Maria Lopez', '9165552222', null, 'cumpleanos', current_date + 23,
    'Sacramento', 10, 'indoor', 2, null, 'es', 'website', '');
  if v_res->>'status' <> 'rate_limited' then raise exception 'expected rate_limited on 4th submission, got %', v_res; end if;
end $$;

-- 8. owner + staff RPC flow: convert to booking, checklist generation, payments, staff scoping
do $$
declare
  v_owner_id   uuid := gen_random_uuid();
  v_staff_id   uuid := gen_random_uuid();
  v_lead_id    uuid;
  v_res        jsonb;
  v_booking_id uuid;
  v_item_id    uuid;
  v_other_booking uuid;
  v_other_item uuid;
  n            int;
begin
  insert into auth.users (id, email) values (v_owner_id, 'owner@filix.test');
  insert into auth.users (id, email) values (v_staff_id, 'staff@filix.test');
  insert into public.user_roles (user_id, role) values (v_owner_id, 'owner');
  insert into public.user_roles (user_id, role) values (v_staff_id, 'staff');

  select l.id into v_lead_id from public.leads l join public.customers c on c.id = l.customer_id
    where c.phone = '9165552222' and l.status = 'new' order by l.created_at asc limit 1;
  if v_lead_id is null then raise exception 'setup: no test lead found to convert'; end if;

  perform set_config('app.current_uid', v_owner_id::text, true);
  execute 'set role authenticated';

  v_res := public.convert_lead_to_booking(v_lead_id, now() + interval '20 days',
    now() + interval '20 days 4 hours', now() + interval '20 days -1 hour', null,
    'Backyard, Sacramento', 750, 375, 'Quinceañera de Maria');
  if v_res->>'status' <> 'ok' then raise exception 'convert_lead_to_booking expected ok, got %', v_res; end if;
  v_booking_id := (v_res->>'booking_id')::uuid;

  if not exists (select 1 from public.leads where id = v_lead_id and status = 'booked') then
    raise exception 'lead status not updated to booked';
  end if;

  select count(*) into n from public.booking_checklist_items where booking_id = v_booking_id;
  if n <> 20 then raise exception 'expected 20 generated checklist items, found %', n; end if;

  v_res := public.record_payment(v_booking_id, 375, 'deposit', 'zelle', 'Deposit via Zelle');
  if v_res->>'status' <> 'ok' then raise exception 'record_payment expected ok, got %', v_res; end if;

  if (select payment_status from public.booking_financials where booking_id = v_booking_id) <> 'deposit_paid' then
    raise exception 'expected payment_status deposit_paid after depositing the required amount';
  end if;

  insert into public.booking_staff (booking_id, user_id) values (v_booking_id, v_staff_id);

  select id into v_item_id from public.booking_checklist_items
    where booking_id = v_booking_id and phase = 'event_day' order by sort_order limit 1;

  -- a second booking the staff member is NOT assigned to, for the forbidden check
  insert into public.customers (name, phone) values ('Other Customer', '9165553333')
    on conflict (phone) where phone is not null and phone <> '' do nothing;
  insert into public.bookings (customer_id, event_type, start_at, end_at, total, deposit_required)
  select id, 'cumpleanos', now() + interval '25 days', now() + interval '25 days 2 hours', 300, 150
  from public.customers where phone = '9165553333'
  returning id into v_other_booking;
  select id into v_other_item from public.booking_checklist_items where booking_id = v_other_booking limit 1;

  execute 'reset role';

  -- switch to the staff session
  perform set_config('app.current_uid', v_staff_id::text, true);
  execute 'set role authenticated';

  select count(*) into n from public.bookings; -- RLS-scoped: only their assignment
  if n <> 1 then raise exception 'staff should see exactly 1 booking (their assignment), saw %', n; end if;

  select count(*) into n from public.payments; -- staff must never see payments
  if n <> 0 then raise exception 'staff should see 0 payments, saw %', n; end if;

  v_res := public.tick_checklist_item(v_item_id, true);
  if v_res->>'status' <> 'ok' then raise exception 'staff tick on own booking expected ok, got %', v_res; end if;
  if not (select done from public.booking_checklist_items where id = v_item_id) then
    raise exception 'checklist item not marked done';
  end if;

  v_res := public.tick_checklist_item(v_other_item, true);
  if v_res->>'status' <> 'forbidden' then
    raise exception 'staff ticking an unassigned booking item should be forbidden, got %', v_res;
  end if;

  execute 'reset role';
  perform set_config('app.current_uid', '', true);
end $$;

-- 9. dashboard_summary / today_priorities callable by owner ----------------------------
do $$
declare
  v_owner_id uuid;
  v          jsonb;
  n          int;
begin
  select user_id into v_owner_id from public.user_roles where role = 'owner' limit 1;
  perform set_config('app.current_uid', v_owner_id::text, true);
  execute 'set role authenticated';

  v := public.dashboard_summary(current_date, current_date + 30);
  if not (v ? 'upcoming_events') then raise exception 'dashboard_summary missing upcoming_events'; end if;

  select count(*) into n from public.today_priorities();
  if n < 0 then raise exception 'today_priorities query failed'; end if; -- structural smoke test

  execute 'reset role';
end $$;
