-- filix · 0006 · Row-Level Security
-- Idempotent (drop-then-create every policy).
--
-- Model:
--   anon          — no table reads anywhere. Writes only through the
--                   SECURITY DEFINER RPCs in 0005 (submit_booking_request,
--                   public_site_settings).
--   staff         — read only the bookings/customers/checklist rows tied to
--                   their own booking_staff assignment. No leads, no
--                   payments, no other customers. Checklist writes go
--                   through tick_checklist_item(), never a raw UPDATE grant.
--   owner         — full read/write on every operational table.
--   analytics_events — deny-all (no policy at all); the collector route
--                   writes with the service_role key, which bypasses RLS.
--   kit_meta      — world-readable so any tool can check contract_version.

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.customers enable row level security;
alter table public.leads enable row level security;
alter table public.lead_activities enable row level security;
alter table public.bookings enable row level security;
alter table public.payments enable row level security;
alter table public.checklist_templates enable row level security;
alter table public.booking_checklist_items enable row level security;
alter table public.booking_staff enable row level security;
alter table public.notification_outbox enable row level security;
alter table public.analytics_events enable row level security;
alter table public.site_settings enable row level security;
alter table public.kit_meta enable row level security;

-- profiles: a user reads their own row; owner reads all.
drop policy if exists profiles_self_select on public.profiles;
create policy profiles_self_select on public.profiles for select
  using (id = auth.uid() or public.has_role(auth.uid(), 'owner'));

-- user_roles: a user reads their own role rows (so the client can gate the
-- UI); only owner manages role assignment.
drop policy if exists user_roles_self_select on public.user_roles;
create policy user_roles_self_select on public.user_roles for select
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'owner'));
drop policy if exists user_roles_owner_write on public.user_roles;
create policy user_roles_owner_write on public.user_roles for all
  using (public.has_role(auth.uid(), 'owner'))
  with check (public.has_role(auth.uid(), 'owner'));

-- customers: owner full access; staff read-only, scoped to customers on a
-- booking they're assigned to.
drop policy if exists customers_owner_all on public.customers;
create policy customers_owner_all on public.customers for all
  using (public.has_role(auth.uid(), 'owner'))
  with check (public.has_role(auth.uid(), 'owner'));

drop policy if exists customers_staff_select on public.customers;
create policy customers_staff_select on public.customers for select
  using (
    exists (
      select 1 from public.bookings b
      join public.booking_staff bs on bs.booking_id = b.id
      where b.customer_id = customers.id and bs.user_id = auth.uid()
    )
  );

-- leads + lead_activities: owner only. Staff have no access at all.
drop policy if exists leads_owner_all on public.leads;
create policy leads_owner_all on public.leads for all
  using (public.has_role(auth.uid(), 'owner'))
  with check (public.has_role(auth.uid(), 'owner'));

drop policy if exists lead_activities_owner_all on public.lead_activities;
create policy lead_activities_owner_all on public.lead_activities for all
  using (public.has_role(auth.uid(), 'owner'))
  with check (public.has_role(auth.uid(), 'owner'));

-- bookings: owner full access; staff read-only, their own assignments.
drop policy if exists bookings_owner_all on public.bookings;
create policy bookings_owner_all on public.bookings for all
  using (public.has_role(auth.uid(), 'owner'))
  with check (public.has_role(auth.uid(), 'owner'));

drop policy if exists bookings_staff_select on public.bookings;
create policy bookings_staff_select on public.bookings for select
  using (
    exists (
      select 1 from public.booking_staff bs
      where bs.booking_id = bookings.id and bs.user_id = auth.uid()
    )
  );

-- payments: owner only. Staff never see payment records (writes also go
-- through record_payment(), which independently checks is_staff_or_owner —
-- kept owner-only here at the table level per the plan: staff don't handle
-- money in P0).
drop policy if exists payments_owner_all on public.payments;
create policy payments_owner_all on public.payments for all
  using (public.has_role(auth.uid(), 'owner'))
  with check (public.has_role(auth.uid(), 'owner'));

-- checklist_templates: owner manages the template; staff don't need direct
-- access (booking_checklist_items already carries a copy of each label).
drop policy if exists checklist_templates_owner_all on public.checklist_templates;
create policy checklist_templates_owner_all on public.checklist_templates for all
  using (public.has_role(auth.uid(), 'owner'))
  with check (public.has_role(auth.uid(), 'owner'));

-- booking_checklist_items: owner full access; staff SELECT only on their
-- assigned bookings. All writes (including staff ticking a box) go through
-- tick_checklist_item() — no UPDATE policy for staff at all.
drop policy if exists booking_checklist_items_owner_all on public.booking_checklist_items;
create policy booking_checklist_items_owner_all on public.booking_checklist_items for all
  using (public.has_role(auth.uid(), 'owner'))
  with check (public.has_role(auth.uid(), 'owner'));

drop policy if exists booking_checklist_items_staff_select on public.booking_checklist_items;
create policy booking_checklist_items_staff_select on public.booking_checklist_items for select
  using (
    exists (
      select 1 from public.booking_staff bs
      where bs.booking_id = booking_checklist_items.booking_id and bs.user_id = auth.uid()
    )
  );

-- booking_staff: owner manages assignments; staff see their own assignment rows.
drop policy if exists booking_staff_owner_all on public.booking_staff;
create policy booking_staff_owner_all on public.booking_staff for all
  using (public.has_role(auth.uid(), 'owner'))
  with check (public.has_role(auth.uid(), 'owner'));

drop policy if exists booking_staff_self_select on public.booking_staff;
create policy booking_staff_self_select on public.booking_staff for select
  using (user_id = auth.uid());

-- notification_outbox: owner can view the queue (debugging); all inserts
-- come from SECURITY DEFINER RPCs, all drains from the service_role key.
drop policy if exists notification_outbox_owner_select on public.notification_outbox;
create policy notification_outbox_owner_select on public.notification_outbox for select
  using (public.has_role(auth.uid(), 'owner'));

-- analytics_events: intentionally NO policy for anon/authenticated — RLS
-- default-denies every read and write. The collector route uses the
-- service_role key (bypasses RLS); owner reads through a future RPC, not
-- direct table access.

-- site_settings: owner full access via the Settings screen. anon reads only
-- through public_site_settings(); never a direct table grant to anon.
drop policy if exists site_settings_owner_all on public.site_settings;
create policy site_settings_owner_all on public.site_settings for all
  using (public.has_role(auth.uid(), 'owner'))
  with check (public.has_role(auth.uid(), 'owner'));

-- kit_meta: world-readable version stamp.
drop policy if exists kit_meta_read_all on public.kit_meta;
create policy kit_meta_read_all on public.kit_meta for select using (true);

-- booking_financials is a view, not a table — by default (PG15+) a view
-- runs with its OWNER's privileges, which would bypass the payments table's
-- owner-only RLS and leak real payment amounts to staff. security_invoker
-- makes it run as the QUERYING user instead, so staff querying it see zero
-- rows from the payments join (they have no payments policy at all) rather
-- than the owner's real figures. Only the owner grant actually surfaces
-- correct numbers; that's intentional — staff have no Payments screen.
alter view public.booking_financials set (security_invoker = true);
grant select on public.booking_financials to authenticated;

-- Table grants: RLS policies above are the real gate — the owner-vs-staff
-- distinction happens per-row through has_role()/booking_staff, not here.
-- The base GRANT only says "authenticated may attempt this command at all";
-- without it, even a query RLS would otherwise allow fails with
-- insufficient_privilege before RLS is ever evaluated. Full CRUD on every
-- owner-managed table because Filix OS screens read/write these directly
-- via the client (Supabase table access), not only through RPCs — the RPCs
-- in 0005 exist for the few operations that need atomicity, validation, or
-- to run as anon (SECURITY DEFINER, so they bypass these grants entirely).
grant select, insert, update, delete on public.customers, public.bookings,
  public.booking_checklist_items, public.booking_staff, public.leads,
  public.lead_activities, public.payments, public.checklist_templates,
  public.site_settings, public.user_roles
  to authenticated;
grant select on public.profiles, public.kit_meta, public.notification_outbox to authenticated;
grant update on public.profiles to authenticated;
-- anon gets no table grants at all — every anon interaction goes through
-- the RPCs, which are SECURITY DEFINER and run with elevated privilege
-- regardless of the caller's own grants.
revoke all on public.customers, public.leads, public.lead_activities,
  public.bookings, public.payments, public.checklist_templates,
  public.booking_checklist_items, public.booking_staff,
  public.notification_outbox, public.analytics_events, public.site_settings,
  public.profiles, public.user_roles
  from anon;
