import { useSyncExternalStore } from 'react'

import { CHECKLIST_TEMPLATE } from './checklistTemplate'
import { seedData } from './seed'
import type {
  Booking,
  ChecklistItem,
  Customer,
  EventTypeKey,
  IndoorOutdoor,
  Lead,
  LeadActivity,
  LeadStatus,
  OSData,
  Payment,
  PaymentKind,
  PaymentMethod,
} from './types'

// Demo persistence: everything lives in localStorage under one key. This is
// a stand-in for the real Supabase contract in filix/supabase/migrations —
// every function here (createLeadFromWizard, convertLeadToBooking,
// recordPayment, tickChecklistItem) has a direct RPC counterpart in 0005_rpcs.sql.
// Swapping the backend later means replacing the bodies of these functions
// with `await supabase.rpc(...)` calls; nothing that calls them needs to change.

const STORAGE_KEY = 'filix_os_v1'

function uid() {
  return crypto.randomUUID()
}

function emptyData(): OSData {
  return {
    customers: [],
    leads: [],
    leadActivities: [],
    bookings: [],
    payments: [],
    checklistItems: [],
    settings: { brandName: 'Filix', depositPercent: 50, notifyOwnerEmail: '', prices: {} },
  }
}

// The SSR/pre-hydration snapshot must never touch localStorage and must be
// referentially stable, or React logs a hydration/loop warning. Real data
// (seeded or previously saved) only appears client-side, after mount —
// see the useSyncExternalStore contract in useOS() below.
const SERVER_SNAPSHOT = emptyData()

let cached: OSData | null = null
const listeners = new Set<() => void>()

function readRaw(): OSData {
  if (typeof window === 'undefined') return SERVER_SNAPSHOT
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    const seeded = seedData()
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded))
    return seeded
  }
  try {
    return JSON.parse(raw) as OSData
  } catch {
    return emptyData()
  }
}

function getClientSnapshot(): OSData {
  if (typeof window === 'undefined') return SERVER_SNAPSHOT
  if (!cached) cached = readRaw()
  return cached
}

function getServerSnapshot(): OSData {
  return SERVER_SNAPSHOT
}

function commit(next: OSData) {
  cached = next
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function mutate(fn: (data: OSData) => OSData) {
  commit(fn(getClientSnapshot()))
}

/** The read hook every OS screen and the public packages section use. */
export function useOS(): OSData {
  return useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot)
}

// ---------------------------------------------------------------------------
// Mutations — each mirrors one RPC from supabase/migrations/0005_rpcs.sql
// ---------------------------------------------------------------------------

/** Mirrors submit_booking_request(). Called from the public wizard. */
export function createLeadFromWizard(input: {
  name: string
  phone: string
  eventType: EventTypeKey
  eventDate: string | null
  city: string
  attendance: number | null
  indoorOutdoor: IndoorOutdoor | null
  duration: Lead['duration']
  message: string
  language: 'es' | 'en'
}): { leadId: string } {
  const now = new Date().toISOString()
  let leadId = ''
  mutate((data) => {
    let customer = data.customers.find((c) => c.phone === input.phone)
    if (!customer) {
      customer = {
        id: uid(),
        name: input.name,
        phone: input.phone,
        kind: 'person',
        language: input.language,
        source: 'website',
        createdAt: now,
      }
    } else {
      customer = { ...customer, name: input.name }
    }

    const lead: Lead = {
      id: uid(),
      customerId: customer.id,
      eventType: input.eventType,
      eventDate: input.eventDate,
      city: input.city,
      attendance: input.attendance,
      indoorOutdoor: input.indoorOutdoor,
      duration: input.duration,
      message: input.message,
      language: input.language,
      source: 'website',
      estimatedValue: null,
      quoteAmount: null,
      quoteSentAt: null,
      nextFollowUpAt: null,
      status: 'new',
      lostReason: null,
      createdAt: now,
      updatedAt: now,
    }
    leadId = lead.id

    const activity: LeadActivity = {
      id: uid(),
      leadId: lead.id,
      kind: 'system',
      body: 'Lead created from public booking wizard.',
      createdAt: now,
    }

    return {
      ...data,
      customers: [...data.customers.filter((c) => c.id !== customer!.id), customer!],
      leads: [...data.leads, lead],
      leadActivities: [...data.leadActivities, activity],
    }
  })
  return { leadId }
}

export function updateLeadStatus(leadId: string, status: LeadStatus, note?: string) {
  const now = new Date().toISOString()
  mutate((data) => ({
    ...data,
    leads: data.leads.map((l) => (l.id === leadId ? { ...l, status, updatedAt: now } : l)),
    leadActivities: [
      ...data.leadActivities,
      { id: uid(), leadId, kind: 'status_change', body: `Status changed to ${status}.${note ? ' ' + note : ''}`, createdAt: now },
    ],
  }))
}

export function setLeadFollowUp(leadId: string, date: string | null) {
  mutate((data) => ({
    ...data,
    leads: data.leads.map((l) => (l.id === leadId ? { ...l, nextFollowUpAt: date, updatedAt: new Date().toISOString() } : l)),
  }))
}

export function setLeadQuote(leadId: string, amount: number) {
  const now = new Date().toISOString()
  mutate((data) => ({
    ...data,
    leads: data.leads.map((l) =>
      l.id === leadId ? { ...l, quoteAmount: amount, quoteSentAt: now, status: 'quote_sent', updatedAt: now } : l,
    ),
    leadActivities: [...data.leadActivities, { id: uid(), leadId, kind: 'note', body: `Quote sent: $${amount}.`, createdAt: now }],
  }))
}

export function addLeadNote(leadId: string, body: string) {
  mutate((data) => ({
    ...data,
    leadActivities: [...data.leadActivities, { id: uid(), leadId, kind: 'note', body, createdAt: new Date().toISOString() }],
  }))
}

/** Mirrors convert_lead_to_booking(). Also generates the checklist, like the DB trigger does. */
export function convertLeadToBooking(
  leadId: string,
  input: { startAt: string; endAt: string; location: string; total: number; depositRequired: number; title: string },
): { bookingId: string } {
  const now = new Date().toISOString()
  let bookingId = ''
  mutate((data) => {
    const lead = data.leads.find((l) => l.id === leadId)
    if (!lead) return data
    const booking: Booking = {
      id: uid(),
      leadId: lead.id,
      customerId: lead.customerId,
      title: input.title,
      eventType: lead.eventType,
      startAt: input.startAt,
      endAt: input.endAt,
      location: input.location,
      attendance: lead.attendance,
      indoorOutdoor: lead.indoorOutdoor,
      total: input.total,
      depositRequired: input.depositRequired,
      status: 'tentative',
      notes: '',
      staffName: null,
      createdAt: now,
    }
    bookingId = booking.id
    const checklist: ChecklistItem[] = CHECKLIST_TEMPLATE.map((t) => ({
      id: uid(),
      bookingId: booking.id,
      phase: t.phase,
      label: t.label,
      sortOrder: t.sortOrder,
      done: false,
      doneAt: null,
    }))
    return {
      ...data,
      bookings: [...data.bookings, booking],
      checklistItems: [...data.checklistItems, ...checklist],
      leads: data.leads.map((l) => (l.id === leadId ? { ...l, status: 'booked' as LeadStatus, updatedAt: now } : l)),
      leadActivities: [...data.leadActivities, { id: uid(), leadId, kind: 'status_change', body: 'Converted to booking.', createdAt: now }],
    }
  })
  return { bookingId }
}

export function updateBookingStatus(bookingId: string, status: Booking['status']) {
  mutate((data) => ({
    ...data,
    bookings: data.bookings.map((b) => (b.id === bookingId ? { ...b, status } : b)),
  }))
}

export function assignStaff(bookingId: string, staffName: string) {
  mutate((data) => ({
    ...data,
    bookings: data.bookings.map((b) => (b.id === bookingId ? { ...b, staffName } : b)),
  }))
}

/** Mirrors record_payment(). */
export function recordPayment(bookingId: string, amount: number, kind: PaymentKind, method: PaymentMethod, note = '') {
  const now = new Date().toISOString()
  mutate((data) => ({
    ...data,
    payments: [...data.payments, { id: uid(), bookingId, amount, kind, method, note, paidAt: now, createdAt: now }],
  }))
}

/** Mirrors tick_checklist_item(). */
export function tickChecklistItem(itemId: string, done: boolean) {
  mutate((data) => ({
    ...data,
    checklistItems: data.checklistItems.map((i) =>
      i.id === itemId ? { ...i, done, doneAt: done ? new Date().toISOString() : null } : i,
    ),
  }))
}

export function updateSettings(patch: Partial<OSData['settings']>) {
  mutate((data) => ({ ...data, settings: { ...data.settings, ...patch } }))
}

export function setPrice(eventType: EventTypeKey, price: string) {
  mutate((data) => ({ ...data, settings: { ...data.settings, prices: { ...data.settings.prices, [eventType]: price } } }))
}

export function resetDemoData() {
  commit(seedData())
}

// ---------------------------------------------------------------------------
// Read helpers (no React dependency — usable from anywhere, incl. server)
// ---------------------------------------------------------------------------

export function getSettingsSnapshot(): OSData['settings'] {
  return getClientSnapshot().settings
}

export function findCustomer(data: OSData, id: string): Customer | undefined {
  return data.customers.find((c) => c.id === id)
}

export function findBooking(data: OSData, id: string): Booking | undefined {
  return data.bookings.find((b) => b.id === id)
}

export function leadActivitiesFor(data: OSData, leadId: string): LeadActivity[] {
  return data.leadActivities.filter((a) => a.leadId === leadId).sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

const PHASE_ORDER = { before: 0, event_day: 1, after: 2 } as const

export function checklistFor(data: OSData, bookingId: string): ChecklistItem[] {
  return data.checklistItems
    .filter((i) => i.bookingId === bookingId)
    .sort((a, b) => PHASE_ORDER[a.phase] - PHASE_ORDER[b.phase] || a.sortOrder - b.sortOrder)
}

export function paymentsFor(data: OSData, bookingId: string): Payment[] {
  return data.payments.filter((p) => p.bookingId === bookingId)
}
