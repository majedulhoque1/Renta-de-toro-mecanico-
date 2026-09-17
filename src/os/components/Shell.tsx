import { Link, useLocation } from '@tanstack/react-router'

import { clearSession } from '../auth'

const NAV = [
  { to: '/os', label: 'Dashboard', shortLabel: 'Home', exact: true },
  { to: '/os/leads', label: 'Leads', shortLabel: 'Leads' },
  { to: '/os/bookings', label: 'Bookings', shortLabel: 'Bookings' },
  { to: '/os/calendar', label: 'Calendar', shortLabel: 'Cal' },
  { to: '/os/customers', label: 'Customers', shortLabel: 'Clients' },
  { to: '/os/payments', label: 'Payments', shortLabel: 'Pay' },
  { to: '/os/settings', label: 'Settings', shortLabel: 'Settings' },
]

export function Shell({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation()

  return (
    <div className="min-h-screen bg-[#f4f1ea] text-[#1c1712]">
      <div className="mx-auto flex max-w-[1400px]">
        {/* Sidebar — desktop only */}
        <aside className="hidden w-56 shrink-0 flex-col border-r border-black/10 px-4 py-6 md:flex">
          <div className="mb-1 px-2 font-display text-lg font-black text-[#b5701c]">Filix OS</div>
          <span className="mb-6 inline-block w-fit rounded-full bg-[#b5701c]/10 px-2 py-0.5 text-[10px] font-bold tracking-wide text-[#b5701c] uppercase">
            Demo data
          </span>
          <nav className="flex flex-col gap-0.5">
            {NAV.map((item) => {
              const active = item.exact ? pathname === item.to : pathname.startsWith(item.to)
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                    active ? 'bg-[#1c1712] text-[#f4f1ea]' : 'text-[#1c1712]/70 hover:bg-black/5'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
          <button
            type="button"
            onClick={() => { clearSession(); window.location.href = '/login' }}
            className="mt-auto rounded-lg px-3 py-2 text-left text-sm font-semibold text-[#1c1712]/50 hover:bg-black/5"
          >
            Log out
          </button>
        </aside>

        {/* Main content */}
        <div className="min-w-0 flex-1 pb-20 md:pb-0">
          {children}
        </div>
      </div>

      {/* Mobile bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-black/10 bg-[#f4f1ea] md:hidden">
        {NAV.map((item) => {
          const active = item.exact ? pathname === item.to : pathname.startsWith(item.to)
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`min-w-0 flex-1 truncate px-0.5 py-3 text-center text-[10px] font-bold ${
                active ? 'text-[#b5701c]' : 'text-[#1c1712]/50'
              }`}
            >
              {item.shortLabel}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

export function PageHeader({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/10 px-6 py-5">
      <div>
        <h1 className="font-display text-xl font-black">{title}</h1>
        {sub && <p className="mt-0.5 text-sm text-[#1c1712]/55">{sub}</p>}
      </div>
      {action}
    </div>
  )
}

export function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-black/10 bg-white px-4 py-3.5">
      <div className="font-display text-2xl font-black tabular-nums">{value}</div>
      <div className="mt-0.5 text-xs font-semibold text-[#1c1712]/55">{label}</div>
    </div>
  )
}

const STATUS_STYLES: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800',
  contacted: 'bg-slate-100 text-slate-700',
  qualified: 'bg-violet-100 text-violet-800',
  quote_sent: 'bg-amber-100 text-amber-800',
  negotiating: 'bg-orange-100 text-orange-800',
  booked: 'bg-emerald-100 text-emerald-800',
  completed: 'bg-emerald-100 text-emerald-800',
  lost: 'bg-red-100 text-red-700',
  tentative: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-red-100 text-red-700',
  paid: 'bg-emerald-100 text-emerald-800',
  deposit_paid: 'bg-amber-100 text-amber-800',
  outstanding: 'bg-red-100 text-red-700',
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-bold whitespace-nowrap ${STATUS_STYLES[status] ?? 'bg-slate-100 text-slate-700'}`}>
      {status.replace('_', ' ')}
    </span>
  )
}

export function EmptyState({ text }: { text: string }) {
  return <div className="px-6 py-16 text-center text-sm text-[#1c1712]/50">{text}</div>
}
