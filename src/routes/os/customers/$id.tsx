import { Link, createFileRoute } from '@tanstack/react-router'

import { EmptyState, PageHeader, StatusBadge } from '../../../os/components/Shell'
import { customerHistory, leadsForCustomer } from '../../../os/logic'
import { findCustomer, useOS } from '../../../os/store'

export const Route = createFileRoute('/os/customers/$id')({ component: CustomerProfile })

function CustomerProfile() {
  const { id } = Route.useParams()
  const data = useOS()
  const customer = findCustomer(data, id)
  if (!customer) return <EmptyState text="Customer not found." />

  const { bookings, totalRevenue, lastContact } = customerHistory(data, id)
  const leads = leadsForCustomer(data, id)

  return (
    <div>
      <PageHeader title={customer.name} sub={customer.phone} />

      <div className="grid grid-cols-1 gap-6 px-6 py-6 lg:grid-cols-[1fr_280px]">
        <div className="rounded-xl border border-black/10 bg-white p-4">
          <h2 className="mb-3 text-sm font-bold">Event history</h2>
          {bookings.length === 0 ? (
            <p className="text-sm text-[#1c1712]/50">No bookings yet.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {bookings.map((b) => (
                <Link key={b.id} to="/os/bookings/$id" params={{ id: b.id }} className="flex items-center justify-between rounded-lg border border-black/10 px-3 py-2.5 text-sm hover:border-black/25">
                  <span className="capitalize">{b.eventType.replace('_', ' ')} — {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(b.startAt))}</span>
                  <span className="flex items-center gap-2">
                    <span className="font-semibold tabular-nums">${b.total}</span>
                    <StatusBadge status={b.status} />
                  </span>
                </Link>
              ))}
            </div>
          )}

          {leads.length > 0 && (
            <>
              <h2 className="mt-6 mb-3 text-sm font-bold">Leads</h2>
              <div className="flex flex-col gap-2">
                {leads.map((l) => (
                  <Link key={l.id} to="/os/leads/$id" params={{ id: l.id }} className="flex items-center justify-between rounded-lg border border-black/10 px-3 py-2.5 text-sm hover:border-black/25">
                    <span className="capitalize">{l.eventType.replace('_', ' ')}</span>
                    <StatusBadge status={l.status} />
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-black/10 bg-white p-4 text-sm">
            <div className="flex justify-between"><span className="text-[#1c1712]/60">Total revenue</span><span className="font-bold">${totalRevenue.toLocaleString()}</span></div>
            <div className="mt-1.5 flex justify-between"><span className="text-[#1c1712]/60">Events</span><span className="font-semibold">{bookings.length}</span></div>
            <div className="mt-1.5 flex justify-between"><span className="text-[#1c1712]/60">Last contact</span><span className="font-semibold">{lastContact ? new Date(lastContact).toLocaleDateString() : '—'}</span></div>
            {customer.email && <div className="mt-1.5 flex justify-between"><span className="text-[#1c1712]/60">Email</span><span className="font-semibold">{customer.email}</span></div>}
          </div>
          <Link to="/os/customers" className="text-center text-xs font-semibold text-[#1c1712]/50 hover:text-[#1c1712]/70">← Back to customers</Link>
        </div>
      </div>
    </div>
  )
}
