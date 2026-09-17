import { Link, createFileRoute } from '@tanstack/react-router'

import { EmptyState, PageHeader, StatusBadge } from '../../os/components/Shell'
import { paymentStatus, type PaymentStatus } from '../../os/logic'
import { findCustomer, useOS } from '../../os/store'

export const Route = createFileRoute('/os/payments')({ component: Payments })

const GROUPS: { status: PaymentStatus; label: string }[] = [
  { status: 'outstanding', label: 'Outstanding' },
  { status: 'deposit_paid', label: 'Deposit paid' },
  { status: 'paid', label: 'Paid in full' },
]

function Payments() {
  const data = useOS()

  return (
    <div>
      <PageHeader title="Payments" sub={`${data.bookings.length} bookings`} />
      {data.bookings.length === 0 ? (
        <EmptyState text="No bookings yet." />
      ) : (
        <div className="flex flex-col gap-6 px-6 py-6">
          {GROUPS.map((group) => {
            const bookings = data.bookings
              .map((b) => ({ b, fin: paymentStatus(data, b) }))
              .filter((x) => x.fin.status === group.status)
              .sort((a, b) => a.b.startAt.localeCompare(b.b.startAt))
            if (bookings.length === 0) return null
            return (
              <div key={group.status}>
                <h2 className="mb-2 text-xs font-bold tracking-wide text-[#1c1712]/60 uppercase">{group.label} ({bookings.length})</h2>
                <div className="overflow-hidden rounded-xl border border-black/10 bg-white">
                  <table className="w-full text-sm">
                    <tbody>
                      {bookings.map(({ b, fin }) => {
                        const customer = findCustomer(data, b.customerId)
                        return (
                          <tr key={b.id} className="border-b border-black/5 last:border-0 hover:bg-black/[0.02]">
                            <td className="px-4 py-3">
                              <Link to="/os/bookings/$id" params={{ id: b.id }} className="font-semibold hover:underline">{customer?.name}</Link>
                            </td>
                            <td className="px-4 py-3 tabular-nums text-[#1c1712]/60">
                              {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(b.startAt))}
                            </td>
                            <td className="px-4 py-3 tabular-nums">${b.total}</td>
                            <td className="px-4 py-3 tabular-nums text-[#1c1712]/60">paid ${fin.paidTotal}</td>
                            <td className="px-4 py-3 font-bold tabular-nums">bal ${fin.balance}</td>
                            <td className="px-4 py-3"><StatusBadge status={fin.status} /></td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
