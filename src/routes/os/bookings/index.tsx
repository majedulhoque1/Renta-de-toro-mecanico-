import { Link, createFileRoute } from '@tanstack/react-router'

import { EmptyState, PageHeader, StatusBadge } from '../../../os/components/Shell'
import { paymentStatus } from '../../../os/logic'
import { findCustomer, useOS } from '../../../os/store'

export const Route = createFileRoute('/os/bookings/')({ component: Bookings })

function Bookings() {
  const data = useOS()
  const sorted = [...data.bookings].sort((a, b) => a.startAt.localeCompare(b.startAt))

  return (
    <div>
      <PageHeader title="Bookings" sub={`${data.bookings.length} total`} />
      {sorted.length === 0 ? (
        <EmptyState text="No bookings yet." />
      ) : (
        <div className="px-6 py-6">
          <div className="overflow-hidden rounded-xl border border-black/10 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/10 text-left text-xs font-bold tracking-wide text-[#1c1712]/50 uppercase">
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Event</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Payment</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((b) => {
                  const customer = findCustomer(data, b.customerId)
                  const { status: payStatus } = paymentStatus(data, b)
                  return (
                    <tr key={b.id} className="border-b border-black/5 last:border-0 hover:bg-black/[0.02]">
                      <td className="px-4 py-3">
                        <Link to="/os/bookings/$id" params={{ id: b.id }} className="font-semibold hover:underline">
                          {customer?.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 capitalize text-[#1c1712]/70">{b.eventType.replace('_', ' ')}</td>
                      <td className="px-4 py-3 tabular-nums text-[#1c1712]/70">
                        {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(b.startAt))}
                      </td>
                      <td className="px-4 py-3 tabular-nums">${b.total.toLocaleString()}</td>
                      <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                      <td className="px-4 py-3"><StatusBadge status={payStatus} /></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
