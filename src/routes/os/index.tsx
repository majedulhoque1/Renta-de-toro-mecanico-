import { Link, createFileRoute } from '@tanstack/react-router'

import { PageHeader, StatCard } from '../../os/components/Shell'
import { dashboardSummary, todayPriorities } from '../../os/logic'
import { useOS } from '../../os/store'

export const Route = createFileRoute('/os/')({ component: Dashboard })

const SEVERITY_DOT: Record<string, string> = {
  red: 'bg-red-500',
  yellow: 'bg-amber-500',
  green: 'bg-emerald-500',
}

function Dashboard() {
  const data = useOS()
  const now = new Date()
  const in30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  const summary = dashboardSummary(data, now, in30)
  const priorities = todayPriorities(data, now)

  return (
    <div>
      <PageHeader title="Good morning, Filix 👋" sub={new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(now)} />

      <div className="grid grid-cols-2 gap-3 px-6 py-6 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Upcoming events (30d)" value={summary.upcomingEvents} />
        <StatCard label="Expected revenue" value={`$${summary.expectedRevenue.toLocaleString()}`} />
        <StatCard label="Open leads" value={summary.openLeads} />
        <StatCard label="Quotes awaiting" value={summary.quotesAwaiting} />
        <StatCard label="Follow-ups due" value={summary.followupsDue} />
      </div>

      <div className="px-6 pb-10">
        <h2 className="mb-3 text-sm font-bold text-[#1c1712]/70">Today's priorities</h2>
        {priorities.length === 0 ? (
          <div className="rounded-xl border border-black/10 bg-white px-4 py-6 text-center text-sm text-[#1c1712]/50">
            Nothing urgent right now.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {priorities.map((p, i) => (
              <Link
                key={i}
                to={p.refTable === 'leads' ? '/os/leads/$id' : '/os/bookings/$id'}
                params={{ id: p.refId }}
                className="flex items-center gap-3 rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold transition hover:border-black/25"
              >
                <span className={`h-2 w-2 shrink-0 rounded-full ${SEVERITY_DOT[p.severity]}`} />
                {p.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
