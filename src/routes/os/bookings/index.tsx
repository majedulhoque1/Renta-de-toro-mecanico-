import { Link, createFileRoute } from '@tanstack/react-router'

import { EmptyState, PageHeader, StatusBadge } from '../../../os/components/Shell'
import { useT } from '../../../os/i18n'
import { paymentStatus } from '../../../os/logic'
import { findCustomer, useOS } from '../../../os/store'

export const Route = createFileRoute('/os/bookings/')({ component: Bookings })

function Bookings() {
  const data = useOS()
  const { t, locale, eventType } = useT()
  const sorted = [...data.bookings].sort((a, b) => a.startAt.localeCompare(b.startAt))

  return (
    <div>
      <PageHeader title={t('Bookings')} sub={`${data.bookings.length} ${t('total')}`} />
      {sorted.length === 0 ? (
        <EmptyState text={t('No bookings yet.')} />
      ) : (
        <div className="px-6 py-6">
          <div className="hidden overflow-x-auto rounded-xl border border-black/10 bg-white md:block">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-black/10 text-left text-xs font-bold tracking-wide text-[#1c1712]/50 uppercase">
                  <th className="px-4 py-3">{t('Customer')}</th>
                  <th className="px-4 py-3">{t('Event')}</th>
                  <th className="px-4 py-3">{t('Date')}</th>
                  <th className="px-4 py-3">{t('Total')}</th>
                  <th className="px-4 py-3">{t('Status')}</th>
                  <th className="px-4 py-3">{t('Payment')}</th>
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
                      <td className="px-4 py-3 capitalize text-[#1c1712]/70">{eventType(b.eventType)}</td>
                      <td className="px-4 py-3 tabular-nums text-[#1c1712]/70">
                        {new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(b.startAt))}
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

          <div className="flex flex-col gap-3 md:hidden">
            {sorted.map((b) => {
              const customer = findCustomer(data, b.customerId)
              const { status: payStatus } = paymentStatus(data, b)
              return (
                <Link
                  key={b.id}
                  to="/os/bookings/$id"
                  params={{ id: b.id }}
                  className="block rounded-xl border border-black/10 bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold">{customer?.name}</span>
                    <span className="tabular-nums font-semibold">${b.total.toLocaleString()}</span>
                  </div>
                  <div className="mt-1 text-xs capitalize text-[#1c1712]/60">
                    {eventType(b.eventType)} ·{' '}
                    {new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(b.startAt))}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <StatusBadge status={b.status} />
                    <StatusBadge status={payStatus} />
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
