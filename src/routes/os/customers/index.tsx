import { Link, createFileRoute } from '@tanstack/react-router'

import { EmptyState, PageHeader } from '../../../os/components/Shell'
import { customerHistory } from '../../../os/logic'
import { useOS } from '../../../os/store'

export const Route = createFileRoute('/os/customers/')({ component: Customers })

function Customers() {
  const data = useOS()
  const sorted = [...data.customers].sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div>
      <PageHeader title="Customers" sub={`${data.customers.length} total`} />
      {sorted.length === 0 ? (
        <EmptyState text="No customers yet." />
      ) : (
        <div className="px-6 py-6">
          <div className="overflow-hidden rounded-xl border border-black/10 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/10 text-left text-xs font-bold tracking-wide text-[#1c1712]/50 uppercase">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Events</th>
                  <th className="px-4 py-3">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((c) => {
                  const { bookings, totalRevenue } = customerHistory(data, c.id)
                  return (
                    <tr key={c.id} className="border-b border-black/5 last:border-0 hover:bg-black/[0.02]">
                      <td className="px-4 py-3">
                        <Link to="/os/customers/$id" params={{ id: c.id }} className="font-semibold hover:underline">
                          {c.name}
                        </Link>
                        {bookings.length > 1 && (
                          <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">repeat</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[#1c1712]/70">{c.phone}</td>
                      <td className="px-4 py-3 tabular-nums text-[#1c1712]/70">{bookings.length}</td>
                      <td className="px-4 py-3 font-semibold tabular-nums">${totalRevenue.toLocaleString()}</td>
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
