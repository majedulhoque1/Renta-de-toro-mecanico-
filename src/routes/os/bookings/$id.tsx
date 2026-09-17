import { Link, createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

import { EmptyState, PageHeader, StatusBadge } from '../../../os/components/Shell'
import { paymentStatus } from '../../../os/logic'
import { assignStaff, checklistFor, findCustomer, paymentsFor, recordPayment, tickChecklistItem, updateBookingStatus, useOS } from '../../../os/store'
import type { PaymentKind, PaymentMethod } from '../../../os/types'

export const Route = createFileRoute('/os/bookings/$id')({ component: BookingDetail })

const PHASE_LABELS = { before: 'Before', event_day: 'Event day', after: 'After' } as const

function BookingDetail() {
  const { id } = Route.useParams()
  const data = useOS()
  const booking = data.bookings.find((b) => b.id === id)

  const [amount, setAmount] = useState('')
  const [kind, setKind] = useState<PaymentKind>('deposit')
  const [method, setMethod] = useState<PaymentMethod>('zelle')
  const [staff, setStaff] = useState('')

  if (!booking) return <EmptyState text="Booking not found." />
  const customer = findCustomer(data, booking.customerId)
  const { paidTotal, balance, status: payStatus } = paymentStatus(data, booking)
  const payments = paymentsFor(data, booking.id)
  const checklist = checklistFor(data, booking.id)
  const doneCount = checklist.filter((i) => i.done).length

  return (
    <div>
      <PageHeader
        title={booking.title || customer?.name || 'Booking'}
        sub={new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date(booking.startAt))}
        action={<StatusBadge status={booking.status} />}
      />

      <div className="grid grid-cols-1 gap-6 px-6 py-6 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-6">
          {/* Checklist */}
          <div className="rounded-xl border border-black/10 bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold">Checklist</h2>
              <span className="text-xs font-semibold text-[#1c1712]/50">{doneCount}/{checklist.length}</span>
            </div>
            <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-black/10">
              <div className="h-full bg-[#b5701c]" style={{ width: `${(doneCount / checklist.length) * 100}%` }} />
            </div>
            {(['before', 'event_day', 'after'] as const).map((phase) => (
              <div key={phase} className="mb-4 last:mb-0">
                <h3 className="mb-1.5 text-xs font-bold tracking-wide text-[#1c1712]/50 uppercase">{PHASE_LABELS[phase]}</h3>
                <div className="flex flex-col gap-1">
                  {checklist.filter((i) => i.phase === phase).map((item) => (
                    <label key={item.id} className="flex items-center gap-2 rounded-lg px-1.5 py-1 text-sm hover:bg-black/[0.02]">
                      <input type="checkbox" checked={item.done} onChange={(e) => tickChecklistItem(item.id, e.target.checked)} className="h-4 w-4" />
                      <span className={item.done ? 'text-[#1c1712]/40 line-through' : ''}>{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Payments */}
          <div className="rounded-xl border border-black/10 bg-white p-4">
            <h2 className="mb-3 text-sm font-bold">Payments</h2>
            <div className="mb-3 flex flex-col gap-1">
              {payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between text-sm">
                  <span className="capitalize text-[#1c1712]/70">{p.kind} · {p.method}</span>
                  <span className="font-semibold tabular-nums">${p.amount}</span>
                </div>
              ))}
              {payments.length === 0 && <p className="text-sm text-[#1c1712]/50">No payments recorded.</p>}
            </div>
            <form
              onSubmit={(e) => { e.preventDefault(); if (amount) { recordPayment(booking.id, Number(amount), kind, method); setAmount('') } }}
              className="grid grid-cols-2 gap-2 border-t border-black/10 pt-3 sm:grid-cols-4"
            >
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" className="input" />
              <select value={kind} onChange={(e) => setKind(e.target.value as PaymentKind)} className="input">
                <option value="deposit">Deposit</option>
                <option value="balance">Balance</option>
                <option value="other">Other</option>
              </select>
              <select value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)} className="input">
                <option value="cash">Cash</option>
                <option value="zelle">Zelle</option>
                <option value="venmo">Venmo</option>
                <option value="card">Card</option>
                <option value="other">Other</option>
              </select>
              <button type="submit" className="rounded-lg bg-[#1c1712] px-3 text-sm font-bold text-[#f4f1ea]">Record</button>
            </form>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-black/10 bg-white p-4 text-sm">
            <h2 className="mb-2 text-sm font-bold">Event</h2>
            <div className="flex flex-col gap-1 text-[#1c1712]/75">
              <span>{customer?.name} · {customer?.phone}</span>
              <span>{booking.location}</span>
              {booking.attendance && <span>{booking.attendance} guests</span>}
              <span className="capitalize">{booking.eventType.replace('_', ' ')}</span>
            </div>
            <select value={booking.status} onChange={(e) => updateBookingStatus(booking.id, e.target.value as typeof booking.status)} className="input mt-3">
              <option value="tentative">Tentative</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="rounded-xl border border-black/10 bg-white p-4 text-sm">
            <h2 className="mb-2 text-sm font-bold">Financials</h2>
            <div className="flex justify-between"><span className="text-[#1c1712]/60">Total</span><span className="font-semibold">${booking.total}</span></div>
            <div className="flex justify-between"><span className="text-[#1c1712]/60">Deposit required</span><span className="font-semibold">${booking.depositRequired}</span></div>
            <div className="flex justify-between"><span className="text-[#1c1712]/60">Paid</span><span className="font-semibold">${paidTotal}</span></div>
            <div className="flex justify-between border-t border-black/10 pt-1.5 mt-1.5"><span className="text-[#1c1712]/60">Balance</span><span className="font-bold">${balance}</span></div>
            <div className="mt-2"><StatusBadge status={payStatus} /></div>
          </div>

          <div className="rounded-xl border border-black/10 bg-white p-4 text-sm">
            <h2 className="mb-2 text-sm font-bold">Staff</h2>
            {booking.staffName ? (
              <p>{booking.staffName}</p>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); if (staff.trim()) assignStaff(booking.id, staff.trim()) }} className="flex gap-2">
                <input value={staff} onChange={(e) => setStaff(e.target.value)} placeholder="Name" className="input flex-1" />
                <button type="submit" className="rounded-lg bg-[#1c1712] px-3 text-sm font-bold text-[#f4f1ea]">Assign</button>
              </form>
            )}
          </div>

          <Link to="/os/bookings" className="text-center text-xs font-semibold text-[#1c1712]/50 hover:text-[#1c1712]/70">
            ← Back to bookings
          </Link>
        </div>
      </div>
    </div>
  )
}
