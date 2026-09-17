import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

import { EmptyState, PageHeader, StatusBadge } from '../../../os/components/Shell'
import { addLeadNote, convertLeadToBooking, findCustomer, leadActivitiesFor, setLeadFollowUp, setLeadQuote, useOS } from '../../../os/store'

export const Route = createFileRoute('/os/leads/$id')({ component: LeadDetail })

function LeadDetail() {
  const { id } = Route.useParams()
  const data = useOS()
  const navigate = useNavigate()
  const lead = data.leads.find((l) => l.id === id)

  const [note, setNote] = useState('')
  const [quote, setQuote] = useState('')
  const [showConvert, setShowConvert] = useState(false)
  const [startTime, setStartTime] = useState('18:00')
  const [hours, setHours] = useState('4')
  const [total, setTotal] = useState('')
  const [location, setLocation] = useState(lead?.city ?? '')

  if (!lead) return <EmptyState text="Lead not found." />
  const customer = findCustomer(data, lead.customerId)
  const activities = leadActivitiesFor(data, lead.id)

  function handleConvert() {
    // TypeScript can't carry the `if (!lead) return` narrowing above into
    // this closure, even though `lead` is const — repeat the guard here.
    if (!lead || !lead.eventDate || !total) return
    const start = new Date(`${lead.eventDate}T${startTime}:00`)
    const end = new Date(start.getTime() + Number(hours) * 60 * 60 * 1000)
    const totalNum = Number(total)
    const { bookingId } = convertLeadToBooking(lead.id, {
      startAt: start.toISOString(),
      endAt: end.toISOString(),
      location,
      total: totalNum,
      depositRequired: Math.round(totalNum * (data.settings.depositPercent / 100)),
      title: `${lead.eventType.replace('_', ' ')} — ${customer?.name ?? ''}`,
    })
    navigate({ to: '/os/bookings/$id', params: { id: bookingId } })
  }

  return (
    <div>
      <PageHeader
        title={customer?.name ?? 'Lead'}
        sub={`${lead.eventType.replace('_', ' ')} · ${lead.eventDate ?? 'no date'}`}
        action={<StatusBadge status={lead.status} />}
      />

      <div className="grid grid-cols-1 gap-6 px-6 py-6 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-6">
          {/* Activity timeline */}
          <div className="rounded-xl border border-black/10 bg-white p-4">
            <h2 className="mb-3 text-sm font-bold">Activity</h2>
            <div className="flex flex-col gap-3">
              {activities.map((a) => (
                <div key={a.id} className="border-l-2 border-black/10 pl-3 text-sm">
                  <div>{a.body}</div>
                  <div className="mt-0.5 text-xs text-[#1c1712]/45">{new Date(a.createdAt).toLocaleString()}</div>
                </div>
              ))}
              {activities.length === 0 && <p className="text-sm text-[#1c1712]/50">No activity yet.</p>}
            </div>
            <form
              onSubmit={(e) => { e.preventDefault(); if (note.trim()) { addLeadNote(lead.id, note.trim()); setNote('') } }}
              className="mt-4 flex gap-2"
            >
              <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note…" className="input flex-1" />
              <button type="submit" className="rounded-lg bg-[#1c1712] px-4 text-sm font-bold text-[#f4f1ea]">Add</button>
            </form>
          </div>

          {/* Convert to booking */}
          {lead.status !== 'booked' && lead.status !== 'completed' && (
            <div className="rounded-xl border border-black/10 bg-white p-4">
              {!showConvert ? (
                <button type="button" onClick={() => setShowConvert(true)} className="rounded-lg bg-[#b5701c] px-4 py-2.5 text-sm font-bold text-white">
                  Convert to booking →
                </button>
              ) : (
                <div className="flex flex-col gap-3">
                  <h2 className="text-sm font-bold">Convert to booking</h2>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="text-xs font-bold">Start time
                      <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="input mt-1" />
                    </label>
                    <label className="text-xs font-bold">Duration (hours)
                      <input type="number" value={hours} onChange={(e) => setHours(e.target.value)} className="input mt-1" />
                    </label>
                    <label className="col-span-2 text-xs font-bold">Location
                      <input value={location} onChange={(e) => setLocation(e.target.value)} className="input mt-1" />
                    </label>
                    <label className="col-span-2 text-xs font-bold">Total ($)
                      <input type="number" value={total} onChange={(e) => setTotal(e.target.value)} className="input mt-1" placeholder="750" />
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={handleConvert}
                    disabled={!lead.eventDate || !total}
                    className="rounded-lg bg-[#b5701c] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-40"
                  >
                    Create booking
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-black/10 bg-white p-4 text-sm">
            <h2 className="mb-2 text-sm font-bold">Contact</h2>
            <div className="flex flex-col gap-1 text-[#1c1712]/75">
              <span>{customer?.phone}</span>
              {customer?.email && <span>{customer.email}</span>}
              <span>{lead.city}</span>
              {lead.attendance && <span>{lead.attendance} guests</span>}
            </div>
          </div>

          <div className="rounded-xl border border-black/10 bg-white p-4 text-sm">
            <h2 className="mb-2 text-sm font-bold">Follow-up</h2>
            <input
              type="date"
              value={lead.nextFollowUpAt ?? ''}
              onChange={(e) => setLeadFollowUp(lead.id, e.target.value || null)}
              className="input"
            />
          </div>

          <div className="rounded-xl border border-black/10 bg-white p-4 text-sm">
            <h2 className="mb-2 text-sm font-bold">Quote</h2>
            {lead.quoteAmount ? (
              <p className="font-display text-xl font-black">${lead.quoteAmount}</p>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); if (quote) setLeadQuote(lead.id, Number(quote)) }} className="flex gap-2">
                <input type="number" value={quote} onChange={(e) => setQuote(e.target.value)} placeholder="750" className="input flex-1" />
                <button type="submit" className="rounded-lg bg-[#1c1712] px-3 text-sm font-bold text-[#f4f1ea]">Send</button>
              </form>
            )}
          </div>

          <Link to="/os/leads" className="text-center text-xs font-semibold text-[#1c1712]/50 hover:text-[#1c1712]/70">
            ← Back to leads
          </Link>
        </div>
      </div>
    </div>
  )
}
