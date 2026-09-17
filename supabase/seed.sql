-- filix · seed data
-- Idempotent (relies on the (phase, label) unique constraint on checklist_templates).
-- Client-tunable afterward from the Ajustes screen / SQL — this is the
-- starting checklist from Samir's plan (#18).

insert into public.checklist_templates (phase, label, sort_order) values
  ('before', 'Confirm location', 10),
  ('before', 'Confirm access', 20),
  ('before', 'Confirm power', 30),
  ('before', 'Confirm space', 40),
  ('before', 'Confirm insurance requirements', 50),
  ('before', 'Confirm payment', 60),
  ('before', 'Assign staff', 70),
  ('before', 'Equipment check', 80),
  ('event_day', 'Load equipment', 10),
  ('event_day', 'Transport', 20),
  ('event_day', 'Setup', 30),
  ('event_day', 'Safety check', 40),
  ('event_day', 'Event operation', 50),
  ('event_day', 'Breakdown', 60),
  ('event_day', 'Return equipment', 70),
  ('after', 'Payment complete', 10),
  ('after', 'Photos uploaded', 20),
  ('after', 'Review requested', 30),
  ('after', 'Social content created', 40),
  ('after', 'Customer follow-up', 50)
on conflict (phase, label) do nothing;
