// Types mirror the Phase 1 DB contract (filix/supabase/migrations/0001, 0004)
// field-for-field where practical, so swapping this localStorage demo store
// for real Supabase calls later is a data-layer change, not a type rewrite.

export const EVENT_TYPE_KEYS = [
  'cumpleanos',
  'quinceanera',
  'bautizo',
  'boda',
  'corporativo',
  'bar_nightlife',
  'festival',
  'universidad',
  'otro',
] as const
export type EventTypeKey = (typeof EVENT_TYPE_KEYS)[number]

export type IndoorOutdoor = 'indoor' | 'outdoor' | 'both'
export type DurationKey = '2h' | '4h' | 'custom'

export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'quote_sent'
  | 'negotiating'
  | 'booked'
  | 'completed'
  | 'lost'

export const LEAD_STATUSES: LeadStatus[] = [
  'new',
  'contacted',
  'qualified',
  'quote_sent',
  'negotiating',
  'booked',
  'completed',
  'lost',
]

export type BookingStatus = 'tentative' | 'confirmed' | 'completed' | 'cancelled'
export type PaymentKind = 'deposit' | 'balance' | 'other'
export type PaymentMethod = 'cash' | 'zelle' | 'venmo' | 'card' | 'other'
export type ChecklistPhase = 'before' | 'event_day' | 'after'
export type ActivityKind = 'note' | 'call' | 'status_change' | 'system'

export interface Customer {
  id: string
  name: string
  phone: string
  email?: string
  kind: 'person' | 'venue' | 'company'
  language: 'es' | 'en'
  source: string
  notes?: string
  createdAt: string
}

export interface Lead {
  id: string
  customerId: string
  eventType: EventTypeKey
  eventDate: string | null
  city: string
  attendance: number | null
  indoorOutdoor: IndoorOutdoor | null
  duration: DurationKey | null
  message: string
  language: 'es' | 'en'
  source: string
  estimatedValue: number | null
  quoteAmount: number | null
  quoteSentAt: string | null
  nextFollowUpAt: string | null
  status: LeadStatus
  lostReason: string | null
  createdAt: string
  updatedAt: string
}

export interface LeadActivity {
  id: string
  leadId: string
  kind: ActivityKind
  body: string
  createdAt: string
}

export interface Booking {
  id: string
  leadId: string | null
  customerId: string
  title: string
  eventType: EventTypeKey
  startAt: string
  endAt: string
  location: string
  attendance: number | null
  indoorOutdoor: IndoorOutdoor | null
  total: number
  depositRequired: number
  status: BookingStatus
  notes: string
  staffName: string | null
  createdAt: string
}

export interface Payment {
  id: string
  bookingId: string
  amount: number
  kind: PaymentKind
  method: PaymentMethod
  note: string
  paidAt: string
  createdAt: string
}

export interface ChecklistItem {
  id: string
  bookingId: string
  phase: ChecklistPhase
  label: string
  sortOrder: number
  done: boolean
  doneAt: string | null
}

export interface Settings {
  brandName: string
  depositPercent: number
  notifyOwnerEmail: string
  prices: Partial<Record<EventTypeKey, string>>
}

export interface OSData {
  customers: Customer[]
  leads: Lead[]
  leadActivities: LeadActivity[]
  bookings: Booking[]
  payments: Payment[]
  checklistItems: ChecklistItem[]
  settings: Settings
}
