import { Link, createFileRoute } from '@tanstack/react-router'

import { PageHeader } from '../../../os/components/Shell'
import { findCustomer, updateLeadStatus, useOS } from '../../../os/store'
import { LEAD_STATUSES, type LeadStatus } from '../../../os/types'

export const Route = createFileRoute('/os/leads/')({ component: Leads })

const COLUMN_LABELS: Record<LeadStatus, string> = {
  new: 'New',
  contacted: 'Contacted',
  qualified: 'Qualified',
  quote_sent: 'Quote sent',
  negotiating: 'Negotiating',
  booked: 'Booked',
  completed: 'Completed',
  lost: 'Lost',
}

// Booked/completed/lost leads move into Bookings/history — the working
// pipeline only needs the 5 active stages as columns.
const PIPELINE_COLUMNS: LeadStatus[] = ['new', 'contacted', 'qualified', 'quote_sent', 'negotiating']

function Leads() {
  const data = useOS()
  const activeLeads = data.leads.filter((l) => PIPELINE_COLUMNS.includes(l.status))
  const closedLeads = data.leads.filter((l) => !PIPELINE_COLUMNS.includes(l.status))

  return (
    <div>
      <PageHeader title="Leads" sub={`${activeLeads.length} active`} />

      {/* Desktop/tablet kanban board */}
      <div className="hidden gap-3 overflow-x-auto px-6 py-6 md:flex">
        {PIPELINE_COLUMNS.map((status) => {
          const leads = activeLeads.filter((l) => l.status === status)
          return (
            <div key={status} className="w-64 shrink-0">
              <div className="mb-2 flex items-center justify-between px-1">
                <span className="text-xs font-bold tracking-wide text-[#1c1712]/60 uppercase">{COLUMN_LABELS[status]}</span>
                <span className="text-xs font-bold text-[#1c1712]/40">{leads.length}</span>
              </div>
              <div className="flex flex-col gap-2">
                {leads.map((lead) => {
                  const customer = findCustomer(data, lead.customerId)
                  return (
                    <Link
                      key={lead.id}
                      to="/os/leads/$id"
                      params={{ id: lead.id }}
                      className="block rounded-xl border border-black/10 bg-white p-3 transition hover:border-black/25"
                    >
                      <div className="text-sm font-bold">{customer?.name ?? '—'}</div>
                      <div className="mt-0.5 text-xs text-[#1c1712]/55">{lead.eventType.replace('_', ' ')}</div>
                      {lead.eventDate && <div className="mt-1 text-xs font-semibold text-[#b5701c]">{lead.eventDate}</div>}
                      <select
                        value={lead.status}
                        onChange={(e) => { e.stopPropagation(); updateLeadStatus(lead.id, e.target.value as LeadStatus) }}
                        onClick={(e) => e.preventDefault()}
                        className="mt-2 w-full rounded-md border border-black/10 bg-[#f4f1ea] px-1.5 py-1 text-xs font-semibold"
                      >
                        {LEAD_STATUSES.map((s) => (
                          <option key={s} value={s}>{COLUMN_LABELS[s]}</option>
                        ))}
                      </select>
                    </Link>
                  )
                })}
                {leads.length === 0 && <div className="rounded-xl border border-dashed border-black/10 px-3 py-6 text-center text-xs text-[#1c1712]/35">Empty</div>}
              </div>
            </div>
          )
        })}
      </div>

      {/* Mobile stacked-by-stage list */}
      <div className="flex flex-col gap-6 px-6 py-6 md:hidden">
        {PIPELINE_COLUMNS.map((status) => {
          const leads = activeLeads.filter((l) => l.status === status)
          if (leads.length === 0) return null
          return (
            <div key={status}>
              <div className="mb-2 flex items-center justify-between px-1">
                <span className="text-xs font-bold tracking-wide text-[#1c1712]/60 uppercase">{COLUMN_LABELS[status]}</span>
                <span className="text-xs font-bold text-[#1c1712]/40">{leads.length}</span>
              </div>
              <div className="flex flex-col gap-2">
                {leads.map((lead) => {
                  const customer = findCustomer(data, lead.customerId)
                  return (
                    <Link
                      key={lead.id}
                      to="/os/leads/$id"
                      params={{ id: lead.id }}
                      className="block rounded-xl border border-black/10 bg-white p-4"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold">{customer?.name ?? '—'}</span>
                        {lead.eventDate && <span className="text-xs font-semibold text-[#b5701c]">{lead.eventDate}</span>}
                      </div>
                      <div className="mt-0.5 text-xs capitalize text-[#1c1712]/55">{lead.eventType.replace('_', ' ')}</div>
                      <select
                        value={lead.status}
                        onChange={(e) => { e.stopPropagation(); updateLeadStatus(lead.id, e.target.value as LeadStatus) }}
                        onClick={(e) => e.preventDefault()}
                        className="mt-2 w-full rounded-md border border-black/10 bg-[#f4f1ea] px-1.5 py-1.5 text-xs font-semibold"
                      >
                        {LEAD_STATUSES.map((s) => (
                          <option key={s} value={s}>{COLUMN_LABELS[s]}</option>
                        ))}
                      </select>
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}
        {activeLeads.length === 0 && <div className="py-10 text-center text-sm text-[#1c1712]/50">No active leads.</div>}
      </div>

      {closedLeads.length > 0 && (
        <div className="border-t border-black/10 px-6 py-6">
          <h2 className="mb-3 text-xs font-bold tracking-wide text-[#1c1712]/60 uppercase">Booked / completed / lost</h2>
          <div className="flex flex-col gap-1.5">
            {closedLeads.map((lead) => {
              const customer = findCustomer(data, lead.customerId)
              return (
                <Link
                  key={lead.id}
                  to="/os/leads/$id"
                  params={{ id: lead.id }}
                  className="flex items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-black/5"
                >
                  <span className="font-semibold">{customer?.name}</span>
                  <span className="text-xs text-[#1c1712]/50">{COLUMN_LABELS[lead.status]}</span>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
