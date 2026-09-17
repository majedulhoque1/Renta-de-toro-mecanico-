import { CHECKLIST_TEMPLATE } from './checklistTemplate'
import type { Booking, ChecklistItem, Customer, Lead, LeadActivity, OSData, Payment } from './types'

// Fixed, deterministic demo data (no Date.now()/Math.random()) anchored
// around "today" being mid-September 2026, so the mix of past/upcoming
// bookings and stale-quote/follow-up priorities reads sensibly in the demo
// without ever going stale relative to the actual current date being far off.

function customer(id: string, name: string, phone: string, email?: string): Customer {
  return {
    id,
    name,
    phone,
    email,
    kind: 'person',
    language: 'es',
    source: 'facebook',
    createdAt: '2026-08-01T12:00:00.000Z',
  }
}

const customers: Customer[] = [
  customer('c1', 'Maria Lopez', '6125552201', 'maria@example.com'),
  customer('c2', "Joe's Bar", '6125552202'),
  customer('c3', 'Sandra Ramirez', '6125552203'),
  customer('c4', 'Carlos Mendez', '6125552204'),
  customer('c5', 'Bloomington Church', '6125552205'),
  customer('c6', 'Ana Torres', '6125552206'),
  customer('c7', 'Roberto Diaz', '6125552207'),
  customer('c8', 'University of Minnesota — Greek Life', '6125552208'),
]

const leads: Lead[] = [
  {
    id: 'l1', customerId: 'c1', eventType: 'quinceanera', eventDate: '2026-10-04', city: 'Minneapolis',
    attendance: 80, indoorOutdoor: 'outdoor', duration: '4h', message: 'Necesito el toro para el 15 de mi hija',
    language: 'es', source: 'facebook', estimatedValue: 750, quoteAmount: null, quoteSentAt: null,
    nextFollowUpAt: '2026-09-18', status: 'new', lostReason: null,
    createdAt: '2026-09-14T18:00:00.000Z', updatedAt: '2026-09-14T18:00:00.000Z',
  },
  {
    id: 'l2', customerId: 'c2', eventType: 'bar_nightlife', eventDate: '2026-09-26', city: 'Minneapolis',
    attendance: 150, indoorOutdoor: 'indoor', duration: 'custom', message: 'Bull night Friday',
    language: 'en', source: 'instagram', estimatedValue: 950, quoteAmount: 950, quoteSentAt: '2026-09-10T15:00:00.000Z',
    nextFollowUpAt: null, status: 'quote_sent', lostReason: null,
    createdAt: '2026-09-08T20:00:00.000Z', updatedAt: '2026-09-10T15:00:00.000Z',
  },
  {
    id: 'l3', customerId: 'c3', eventType: 'cumpleanos', eventDate: '2026-09-20', city: 'St. Paul',
    attendance: 30, indoorOutdoor: 'outdoor', duration: '2h', message: '',
    language: 'es', source: 'website', estimatedValue: 400, quoteAmount: null, quoteSentAt: null,
    nextFollowUpAt: '2026-09-17', status: 'contacted', lostReason: null,
    createdAt: '2026-09-12T14:00:00.000Z', updatedAt: '2026-09-13T09:00:00.000Z',
  },
  {
    id: 'l4', customerId: 'c4', eventType: 'corporativo', eventDate: '2026-10-10', city: 'Minneapolis',
    attendance: 200, indoorOutdoor: 'outdoor', duration: 'custom', message: 'Company picnic',
    language: 'en', source: 'referral', estimatedValue: 1400, quoteAmount: 1400, quoteSentAt: '2026-09-05T12:00:00.000Z',
    nextFollowUpAt: null, status: 'negotiating', lostReason: null,
    createdAt: '2026-09-02T11:00:00.000Z', updatedAt: '2026-09-11T10:00:00.000Z',
  },
  {
    id: 'l5', customerId: 'c5', eventType: 'festival', eventDate: '2026-11-02', city: 'St. Paul',
    attendance: 500, indoorOutdoor: 'outdoor', duration: 'custom', message: 'Fall festival booth',
    language: 'en', source: 'website', estimatedValue: 2200, quoteAmount: null, quoteSentAt: null,
    nextFollowUpAt: null, status: 'qualified', lostReason: null,
    createdAt: '2026-09-09T13:00:00.000Z', updatedAt: '2026-09-09T13:00:00.000Z',
  },
  {
    id: 'l6', customerId: 'c6', eventType: 'bautizo', eventDate: '2026-08-30', city: 'Minneapolis',
    attendance: 45, indoorOutdoor: 'outdoor', duration: '2h', message: '',
    language: 'es', source: 'facebook', estimatedValue: 400, quoteAmount: null, quoteSentAt: null,
    nextFollowUpAt: null, status: 'lost', lostReason: 'Presupuesto',
    createdAt: '2026-08-20T10:00:00.000Z', updatedAt: '2026-08-25T10:00:00.000Z',
  },
  {
    id: 'l7', customerId: 'c7', eventType: 'cumpleanos', eventDate: '2026-08-16', city: 'Minneapolis',
    attendance: 25, indoorOutdoor: 'outdoor', duration: '2h', message: '',
    language: 'es', source: 'facebook', estimatedValue: 400, quoteAmount: 400, quoteSentAt: '2026-08-05T10:00:00.000Z',
    nextFollowUpAt: null, status: 'completed', lostReason: null,
    createdAt: '2026-08-01T10:00:00.000Z', updatedAt: '2026-08-16T20:00:00.000Z',
  },
  {
    id: 'l8', customerId: 'c8', eventType: 'universidad', eventDate: '2026-09-27', city: 'Minneapolis',
    attendance: 300, indoorOutdoor: 'outdoor', duration: 'custom', message: 'Homecoming week',
    language: 'en', source: 'instagram', estimatedValue: 1800, quoteAmount: null, quoteSentAt: null,
    nextFollowUpAt: '2026-09-19', status: 'new', lostReason: null,
    createdAt: '2026-09-15T16:00:00.000Z', updatedAt: '2026-09-15T16:00:00.000Z',
  },
]

const leadActivities: LeadActivity[] = [
  { id: 'a1', leadId: 'l1', kind: 'system', body: 'Lead created from public booking wizard.', createdAt: '2026-09-14T18:00:00.000Z' },
  { id: 'a2', leadId: 'l2', kind: 'note', body: 'Sent quote for $950, 6pm-11pm Friday.', createdAt: '2026-09-10T15:00:00.000Z' },
  { id: 'a3', leadId: 'l3', kind: 'call', body: 'Left voicemail, following up tomorrow.', createdAt: '2026-09-13T09:00:00.000Z' },
  { id: 'a4', leadId: 'l4', kind: 'note', body: 'Negotiating on hours — they want 5 instead of 4.', createdAt: '2026-09-11T10:00:00.000Z' },
]

// Booking l7 (completed, past) and l2's eventual confirmed booking, plus 3
// more standalone bookings for calendar/payments variety.
const bookings: Booking[] = [
  {
    id: 'b1', leadId: 'l7', customerId: 'c7', title: 'Cumpleaños — Roberto', eventType: 'cumpleanos',
    startAt: '2026-08-16T18:00:00.000Z', endAt: '2026-08-16T20:00:00.000Z', location: 'Minneapolis, MN',
    attendance: 25, indoorOutdoor: 'outdoor', total: 400, depositRequired: 200, status: 'completed',
    notes: '', staffName: 'Filix', createdAt: '2026-08-05T10:00:00.000Z',
  },
  {
    id: 'b2', leadId: null, customerId: 'c1', title: 'Quinceañera — Maria', eventType: 'quinceanera',
    startAt: '2026-09-21T19:00:00.000Z', endAt: '2026-09-21T23:00:00.000Z', location: 'Minneapolis, MN',
    attendance: 80, indoorOutdoor: 'outdoor', total: 750, depositRequired: 375, status: 'confirmed',
    notes: 'Backyard, need generator.', staffName: 'Filix', createdAt: '2026-08-28T10:00:00.000Z',
  },
  {
    id: 'b3', leadId: null, customerId: 'c3', title: 'Cumpleaños — Sandra', eventType: 'cumpleanos',
    startAt: '2026-09-20T16:00:00.000Z', endAt: '2026-09-20T18:00:00.000Z', location: 'St. Paul, MN',
    attendance: 30, indoorOutdoor: 'outdoor', total: 400, depositRequired: 200, status: 'tentative',
    notes: '', staffName: null, createdAt: '2026-09-10T10:00:00.000Z',
  },
  {
    id: 'b4', leadId: null, customerId: 'c2', title: "Bull Night — Joe's Bar", eventType: 'bar_nightlife',
    startAt: '2026-09-26T18:00:00.000Z', endAt: '2026-09-26T23:00:00.000Z', location: 'Minneapolis, MN',
    attendance: 150, indoorOutdoor: 'indoor', total: 950, depositRequired: 475, status: 'tentative',
    notes: '', staffName: null, createdAt: '2026-09-12T10:00:00.000Z',
  },
  {
    id: 'b5', leadId: null, customerId: 'c4', title: 'Company Picnic', eventType: 'corporativo',
    startAt: '2026-10-10T15:00:00.000Z', endAt: '2026-10-10T20:00:00.000Z', location: 'Minneapolis, MN',
    attendance: 200, indoorOutdoor: 'outdoor', total: 1400, depositRequired: 700, status: 'confirmed',
    notes: '', staffName: 'Filix', createdAt: '2026-09-11T10:00:00.000Z',
  },
]

const payments: Payment[] = [
  { id: 'p1', bookingId: 'b1', amount: 400, kind: 'balance', method: 'cash', note: 'Paid in full day-of', paidAt: '2026-08-16T20:15:00.000Z', createdAt: '2026-08-16T20:15:00.000Z' },
  { id: 'p2', bookingId: 'b2', amount: 375, kind: 'deposit', method: 'zelle', note: '', paidAt: '2026-08-28T12:00:00.000Z', createdAt: '2026-08-28T12:00:00.000Z' },
  { id: 'p3', bookingId: 'b5', amount: 700, kind: 'deposit', method: 'card', note: '', paidAt: '2026-09-11T14:00:00.000Z', createdAt: '2026-09-11T14:00:00.000Z' },
]

function checklistFor(bookingId: string, doneCount: number): ChecklistItem[] {
  return CHECKLIST_TEMPLATE.map((t, i) => ({
    id: `${bookingId}-ci${i}`,
    bookingId,
    phase: t.phase,
    label: t.label,
    sortOrder: t.sortOrder,
    done: i < doneCount,
    doneAt: i < doneCount ? '2026-09-10T10:00:00.000Z' : null,
  }))
}

const checklistItems: ChecklistItem[] = [
  ...checklistFor('b1', 20), // completed event — everything done
  ...checklistFor('b2', 6), // confirmed, some prep done
  ...checklistFor('b3', 2),
  ...checklistFor('b4', 1),
  ...checklistFor('b5', 8),
]

export function seedData(): OSData {
  return {
    customers,
    leads,
    leadActivities,
    bookings,
    payments,
    checklistItems,
    settings: {
      brandName: 'Filix',
      depositPercent: 50,
      notifyOwnerEmail: '',
      prices: {},
    },
  }
}
