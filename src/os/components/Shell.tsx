import { useEffect, useState } from 'react'
import { Link, useLocation } from '@tanstack/react-router'

import { clearSession } from '../auth'
import { setOSLang, useT } from '../i18n'

const NAV = [
  { to: '/os', label: 'Dashboard', shortLabel: 'Home', icon: 'home', exact: true, primary: true },
  { to: '/os/leads', label: 'Leads', shortLabel: 'Leads', icon: 'funnel', exact: false, primary: true },
  { to: '/os/bookings', label: 'Bookings', shortLabel: 'Bookings', icon: 'ticket', exact: false, primary: true },
  { to: '/os/calendar', label: 'Calendar', shortLabel: 'Calendar', icon: 'calendar', exact: false, primary: true },
  { to: '/os/customers', label: 'Customers', shortLabel: 'Clients', icon: 'users', exact: false, primary: false },
  { to: '/os/payments', label: 'Payments', shortLabel: 'Pay', icon: 'dollar', exact: false, primary: false },
  { to: '/os/settings', label: 'Settings', shortLabel: 'Settings', icon: 'gear', exact: false, primary: false },
] as const

const PRIMARY_NAV = NAV.filter((item) => item.primary)
const MENU_NAV = NAV.filter((item) => !item.primary)

type IconName = (typeof NAV)[number]['icon'] | 'horns' | 'logout' | 'menu' | 'close'

function LangToggle({ className = '' }: { className?: string }) {
  const { lang } = useT()
  return (
    <button
      type="button"
      onClick={() => setOSLang(lang === 'en' ? 'es' : 'en')}
      aria-label={lang === 'en' ? 'Cambiar a español' : 'Switch to English'}
      className={`inline-flex items-center rounded-full border border-black/15 bg-white/60 p-0.5 text-[11px] font-bold ${className}`}
    >
      <span className={`rounded-full px-2 py-1 ${lang === 'en' ? 'bg-[#b5701c] text-white' : 'text-[#1c1712]/55'}`}>EN</span>
      <span className={`rounded-full px-2 py-1 ${lang === 'es' ? 'bg-[#b5701c] text-white' : 'text-[#1c1712]/55'}`}>ES</span>
    </button>
  )
}

function NavIcon({ name, className }: { name: IconName; className?: string }) {
  const props = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.75,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className,
  }
  switch (name) {
    case 'home':
      return (
        <svg {...props}>
          <path d="M3 10.5 12 3l9 7.5" />
          <path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5" />
        </svg>
      )
    case 'funnel':
      return (
        <svg {...props}>
          <path d="M3 4h18l-7 8v6l-4 2v-8L3 4Z" />
        </svg>
      )
    case 'ticket':
      return (
        <svg {...props}>
          <path d="M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v1.5a1.5 1.5 0 0 0 0 3V15a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1.5a1.5 1.5 0 0 0 0-3V9Z" />
          <path d="M12 8v1M12 11.5v1M12 15v1" />
        </svg>
      )
    case 'calendar':
      return (
        <svg {...props}>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M3 10h18M8 3v4M16 3v4" />
        </svg>
      )
    case 'users':
      return (
        <svg {...props}>
          <circle cx="9" cy="8" r="3" />
          <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
          <circle cx="17" cy="9" r="2.3" />
          <path d="M15.5 14.2c2.6.4 4.5 2.7 4.5 5.8" />
        </svg>
      )
    case 'dollar':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v10M9.5 9.5c0-1.2 1.1-2 2.5-2s2.5.7 2.5 1.8c0 2.4-5 1.4-5 3.9 0 1.1 1.1 1.8 2.5 1.8s2.5-.8 2.5-2" />
        </svg>
      )
    case 'gear':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 13a8 8 0 0 0 0-2l2-1.5-2-3.5-2.4.7a8 8 0 0 0-1.7-1L14.8 3H9.2l-.5 2.7a8 8 0 0 0-1.7 1l-2.4-.7-2 3.5L4.6 11a8 8 0 0 0 0 2l-2 1.5 2 3.5 2.4-.7a8 8 0 0 0 1.7 1l.5 2.7h5.6l.5-2.7a8 8 0 0 0 1.7-1l2.4.7 2-3.5-2-1.5Z" />
        </svg>
      )
    case 'horns':
      return (
        <svg {...props}>
          <path d="M12 15c-1-3.5-3-6-6.5-6-1.8 0-2.8 1.6-2 3.3C4.7 15.5 8 17 12 17" />
          <path d="M12 15c1-3.5 3-6 6.5-6 1.8 0 2.8 1.6 2 3.3-.7 3.2-4 4.7-8 4.7" />
          <circle cx="12" cy="16.5" r="1.4" fill="currentColor" stroke="none" />
        </svg>
      )
    case 'menu':
      return (
        <svg {...props}>
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      )
    case 'close':
      return (
        <svg {...props}>
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
      )
    case 'logout':
      return (
        <svg {...props}>
          <path d="M15 4H6a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h9" />
          <path d="M11 12h9m0 0-3-3m3 3-3 3" />
        </svg>
      )
  }
}

export function Shell({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation()
  const { t } = useT()
  const [menuOpen, setMenuOpen] = useState(false)
  const isActive = (item: (typeof NAV)[number]) =>
    item.exact ? pathname === item.to : pathname.startsWith(item.to)
  const inMenuPage = MENU_NAV.some(isActive)

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuOpen])

  return (
    <div className="min-h-screen bg-[#f4f1ea] text-[#1c1712]">
      {/* Mobile top bar — sidebar (brand + menu) is hidden below md */}
      <div className="relative z-40 md:hidden">
        <div
          className="flex items-center justify-between border-b border-black/10 bg-[#f4f1ea] px-4 py-3"
          style={{ paddingTop: 'calc(0.75rem + env(safe-area-inset-top))' }}
        >
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#b5701c] text-white">
              <NavIcon name="horns" className="h-[15px] w-[15px]" />
            </span>
            <span className="font-display text-base leading-none font-black text-[#1c1712]">Felix OS</span>
          </div>
          <div className="flex items-center gap-2">
          <LangToggle />
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? t('Close menu') : t('Open menu')}
            aria-expanded={menuOpen}
            className={`flex h-9 w-9 items-center justify-center rounded-full transition ${
              inMenuPage || menuOpen
                ? 'bg-[#b5701c]/12 text-[#b5701c]'
                : 'text-[#1c1712]/60 hover:bg-black/5 hover:text-[#1c1712]'
            }`}
          >
            <NavIcon name={menuOpen ? 'close' : 'menu'} className="h-[20px] w-[20px]" />
          </button>
          </div>
        </div>

        {menuOpen && (
          <>
            <button
              type="button"
              aria-label={t('Close menu')}
              tabIndex={-1}
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 -z-10 cursor-default bg-black/20"
            />
            <div className="absolute inset-x-0 top-full border-b border-black/10 bg-[#f4f1ea] px-3 py-2 shadow-lg">
              {MENU_NAV.map((item) => {
                const active = isActive(item)
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMenuOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold ${
                      active ? 'bg-[#b5701c] text-white' : 'text-[#1c1712]/75 active:bg-black/5'
                    }`}
                  >
                    <NavIcon name={item.icon} className="h-[18px] w-[18px] shrink-0" />
                    {t(item.label)}
                  </Link>
                )
              })}
              <div className="my-1.5 border-t border-black/10" />
              <button
                type="button"
                onClick={() => { clearSession(); window.location.href = '/login' }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-semibold text-[#1c1712]/55 active:bg-black/5"
              >
                <NavIcon name="logout" className="h-[18px] w-[18px] shrink-0" />
                {t('Log out')}
              </button>
            </div>
          </>
        )}
      </div>

      <div className="mx-auto flex max-w-[1400px]">
        {/* Sidebar — desktop only */}
        <aside className="hidden w-60 shrink-0 flex-col border-r border-black/10 px-4 py-6 md:flex">
          <div className="mb-6 flex items-center gap-2.5 px-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#b5701c] text-white">
              <NavIcon name="horns" className="h-[18px] w-[18px]" />
            </span>
            <div>
              <div className="font-display text-lg leading-none font-black text-[#1c1712]">Felix OS</div>
              <span className="mt-1 inline-block w-fit rounded-full bg-[#b5701c]/10 px-2 py-0.5 text-[10px] font-bold tracking-wide text-[#b5701c] uppercase">
                {t('Demo data')}
              </span>
            </div>
          </div>
          <nav className="flex flex-col gap-0.5">
            {NAV.map((item) => {
              const active = item.exact ? pathname === item.to : pathname.startsWith(item.to)
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold transition-all duration-150 ${
                    active
                      ? 'bg-[#b5701c] text-white shadow-sm shadow-[#b5701c]/30'
                      : 'text-[#1c1712]/65 hover:translate-x-0.5 hover:bg-black/5 hover:text-[#1c1712]'
                  }`}
                >
                  <NavIcon
                    name={item.icon}
                    className={`h-[18px] w-[18px] shrink-0 transition-colors ${
                      active ? 'text-white' : 'text-[#1c1712]/35 group-hover:text-[#b5701c]'
                    }`}
                  />
                  {t(item.label)}
                </Link>
              )
            })}
          </nav>
          <div className="mt-auto px-3 pb-2"><LangToggle /></div>
          <button
            type="button"
            onClick={() => { clearSession(); window.location.href = '/login' }}
            className="rounded-lg px-3 py-2 text-left text-sm font-semibold text-[#1c1712]/40 transition hover:bg-black/5 hover:text-[#1c1712]/70"
          >
            {t('Log out')}
          </button>
        </aside>

        {/* Main content */}
        <div className="min-w-0 flex-1 pb-24 md:pb-0">
          {children}
        </div>
      </div>

      {/* Mobile bottom tab bar */}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 flex border-t border-black/10 bg-[#f4f1ea]/95 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] backdrop-blur-sm md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {PRIMARY_NAV.map((item) => {
          const active = isActive(item)
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex min-w-0 flex-1 flex-col items-center gap-0.5 px-0.5 py-2 text-center transition-colors ${
                active ? 'text-[#b5701c]' : 'text-[#1c1712]/45'
              }`}
            >
              <span className={`flex h-7 w-9 items-center justify-center rounded-full transition-colors ${active ? 'bg-[#b5701c]/12' : ''}`}>
                <NavIcon name={item.icon} className="h-[18px] w-[18px]" />
              </span>
              <span className="truncate text-[10px] font-bold leading-none">{t(item.shortLabel)}</span>
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
  const { t } = useT()
  return (
    <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-bold whitespace-nowrap ${STATUS_STYLES[status] ?? 'bg-slate-100 text-slate-700'}`}>
      {t(status) === status ? status.replace('_', ' ') : t(status)}
    </span>
  )
}

export function EmptyState({ text }: { text: string }) {
  return <div className="px-6 py-16 text-center text-sm text-[#1c1712]/50">{text}</div>
}
