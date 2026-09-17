import { checklistFor, findCustomer, paymentsFor } from './store'
import type { Booking, Lead, OSData } from './types'

export type PaymentStatus = 'paid' | 'deposit_paid' | 'outstanding'

/** Mirrors the booking_financials SQL view exactly (0004_core_tables.sql). */
export function paymentStatus(data: OSData, booking: Booking): { paidTotal: number; balance: number; status: PaymentStatus } {
  const paidTotal = paymentsFor(data, booking.id).reduce((sum, p) => sum + p.amount, 0)
  const balance = booking.total - paidTotal
  let status: PaymentStatus = 'outstanding'
  if (paidTotal >= booking.total && booking.total > 0) status = 'paid'
  else if (paidTotal >= booking.depositRequired && booking.depositRequired > 0) status = 'deposit_paid'
  return { paidTotal, balance, status }
}

export interface Priority {
  type: 'follow_up_due' | 'stale_quote' | 'unconfirmed_booking' | 'unpaid_balance' | 'unassigned_staff'
  severity: 'red' | 'yellow' | 'green'
  label: string
  refId: string
  refTable: 'leads' | 'bookings'
}

const DAY = 24 * 60 * 60 * 1000

/** Mirrors today_priorities() (0005_rpcs.sql) — same five rules, same order. */
export function todayPriorities(data: OSData, now = new Date()): Priority[] {
  const out: Priority[] = []
  const openLeads = data.leads.filter((l) => l.status !== 'booked' && l.status !== 'completed' && l.status !== 'lost')

  for (const lead of openLeads) {
    if (lead.nextFollowUpAt && new Date(lead.nextFollowUpAt) <= now) {
      const c = findCustomer(data, lead.customerId)
      out.push({ type: 'follow_up_due', severity: 'yellow', label: `Follow up: ${c?.name ?? '—'} (${lead.eventType})`, refId: lead.id, refTable: 'leads' })
    }
  }

  for (const lead of data.leads) {
    if (lead.status === 'quote_sent' && lead.quoteSentAt && now.getTime() - new Date(lead.quoteSentAt).getTime() > 2 * DAY) {
      const c = findCustomer(data, lead.customerId)
      out.push({ type: 'stale_quote', severity: 'red', label: `No reply on quote: ${c?.name ?? '—'}`, refId: lead.id, refTable: 'leads' })
    }
  }

  for (const b of data.bookings) {
    if (b.status === 'tentative' && new Date(b.startAt).getTime() <= now.getTime() + 7 * DAY) {
      const c = findCustomer(data, b.customerId)
      out.push({ type: 'unconfirmed_booking', severity: 'yellow', label: `Confirm: ${c?.name ?? '—'} on ${fmtShort(b.startAt)}`, refId: b.id, refTable: 'bookings' })
    }
  }

  for (const b of data.bookings) {
    if ((b.status === 'tentative' || b.status === 'confirmed') && new Date(b.startAt).getTime() <= now.getTime() + 3 * DAY) {
      const { status } = paymentStatus(data, b)
      if (status !== 'paid') {
        const c = findCustomer(data, b.customerId)
        out.push({ type: 'unpaid_balance', severity: 'red', label: `Balance due before event: ${c?.name ?? '—'}`, refId: b.id, refTable: 'bookings' })
      }
    }
  }

  for (const b of data.bookings) {
    if ((b.status === 'tentative' || b.status === 'confirmed') && new Date(b.startAt).getTime() <= now.getTime() + 7 * DAY && !b.staffName) {
      const c = findCustomer(data, b.customerId)
      out.push({ type: 'unassigned_staff', severity: 'green', label: `No staff assigned: ${c?.name ?? '—'} on ${fmtShort(b.startAt)}`, refId: b.id, refTable: 'bookings' })
    }
  }

  return out
}

export interface DashboardSummary {
  upcomingEvents: number
  expectedRevenue: number
  openLeads: number
  quotesAwaiting: number
  followupsDue: number
}

/** Mirrors dashboard_summary(p_from, p_to). */
export function dashboardSummary(data: OSData, from: Date, to: Date): DashboardSummary {
  const inRange = (iso: string) => {
    const t = new Date(iso).getTime()
    return t >= from.getTime() && t <= to.getTime()
  }
  const upcoming = data.bookings.filter((b) => inRange(b.startAt) && (b.status === 'tentative' || b.status === 'confirmed'))
  return {
    upcomingEvents: upcoming.length,
    expectedRevenue: upcoming.reduce((sum, b) => sum + b.total, 0),
    openLeads: data.leads.filter((l) => l.status !== 'booked' && l.status !== 'completed' && l.status !== 'lost').length,
    quotesAwaiting: data.leads.filter((l) => l.status === 'quote_sent').length,
    followupsDue: data.leads.filter(
      (l) => l.nextFollowUpAt && new Date(l.nextFollowUpAt) <= to && l.status !== 'booked' && l.status !== 'completed' && l.status !== 'lost',
    ).length,
  }
}

export function customerHistory(data: OSData, customerId: string): { bookings: Booking[]; totalRevenue: number; lastContact: string | null } {
  const bookings = data.bookings.filter((b) => b.customerId === customerId)
  const totalRevenue = bookings.reduce((sum, b) => {
    const { paidTotal } = paymentStatus(data, b)
    return sum + paidTotal
  }, 0)
  const activities = data.leadActivities.filter((a) => data.leads.find((l) => l.id === a.leadId)?.customerId === customerId)
  const lastContact = activities.length ? activities.map((a) => a.createdAt).sort().at(-1)! : null
  return { bookings, totalRevenue, lastContact }
}

export function checklistProgress(data: OSData, bookingId: string): { done: number; total: number } {
  const items = checklistFor(data, bookingId)
  return { done: items.filter((i) => i.done).length, total: items.length }
}

function fmtShort(iso: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(iso))
}

export function leadsForCustomer(data: OSData, customerId: string): Lead[] {
  return data.leads.filter((l) => l.customerId === customerId)
}

export function customerName(data: OSData, customerId: string): string {
  return findCustomer(data, customerId)?.name ?? 'Unknown'
}
