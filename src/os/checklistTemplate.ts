import type { ChecklistPhase } from './types'

// Same 20 labels as filix/supabase/seed.sql's checklist_templates, so the
// demo checklist matches what a real booking would generate.
export const CHECKLIST_TEMPLATE: { phase: ChecklistPhase; label: string; sortOrder: number }[] = [
  { phase: 'before', label: 'Confirm location', sortOrder: 10 },
  { phase: 'before', label: 'Confirm access', sortOrder: 20 },
  { phase: 'before', label: 'Confirm power', sortOrder: 30 },
  { phase: 'before', label: 'Confirm space', sortOrder: 40 },
  { phase: 'before', label: 'Confirm insurance requirements', sortOrder: 50 },
  { phase: 'before', label: 'Confirm payment', sortOrder: 60 },
  { phase: 'before', label: 'Assign staff', sortOrder: 70 },
  { phase: 'before', label: 'Equipment check', sortOrder: 80 },
  { phase: 'event_day', label: 'Load equipment', sortOrder: 10 },
  { phase: 'event_day', label: 'Transport', sortOrder: 20 },
  { phase: 'event_day', label: 'Setup', sortOrder: 30 },
  { phase: 'event_day', label: 'Safety check', sortOrder: 40 },
  { phase: 'event_day', label: 'Event operation', sortOrder: 50 },
  { phase: 'event_day', label: 'Breakdown', sortOrder: 60 },
  { phase: 'event_day', label: 'Return equipment', sortOrder: 70 },
  { phase: 'after', label: 'Payment complete', sortOrder: 10 },
  { phase: 'after', label: 'Photos uploaded', sortOrder: 20 },
  { phase: 'after', label: 'Review requested', sortOrder: 30 },
  { phase: 'after', label: 'Social content created', sortOrder: 40 },
  { phase: 'after', label: 'Customer follow-up', sortOrder: 50 },
]
