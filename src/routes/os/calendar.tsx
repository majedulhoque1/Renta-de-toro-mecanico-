import { Link, createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

import { PageHeader } from '../../os/components/Shell'
import { useT } from '../../os/i18n'
import { findCustomer, useOS } from '../../os/store'

export const Route = createFileRoute('/os/calendar')({ component: CalendarPage })

// The business's calendar day must be Minneapolis's, not whichever
// timezone the owner happens to be viewing from. Booking timestamps are
// UTC instants (ISO strings) — grouping them with getFullYear/getMonth/
// getDate (which read the VIEWER's local timezone) shifted events onto
// the wrong day whenever viewed from a timezone far from Central (e.g. a
// 7pm Central booking, stored as UTC, landed on the next day when viewed
// from Bangladesh, ~11-12 hours ahead). en-CA formats as YYYY-MM-DD.
const BUSINESS_TZ = 'America/Chicago'
function businessDateKey(iso: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: BUSINESS_TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(iso))
}

// The grid itself (which month is being browsed, which day each cell
// represents) is pure local UI navigation state, not tied to a real UTC
// instant — a plain local Y-M-D key is correct here.
function cellKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function CalendarPage() {
  const data = useOS()
  const { t, locale } = useT()
  const [cursor, setCursor] = useState(() => {
    const d = new Date()
    d.setDate(1)
    return d
  })

  const byDay = new Map<string, typeof data.bookings>()
  for (const b of data.bookings) {
    const key = businessDateKey(b.startAt)
    if (!byDay.has(key)) byDay.set(key, [])
    byDay.get(key)!.push(b)
  }

  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const firstDay = new Date(year, month, 1)
  const startOffset = firstDay.getDay() // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = businessDateKey(new Date().toISOString())

  const cells: (number | null)[] = [...Array(startOffset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div>
      <PageHeader
        title={t('Calendar')}
        action={
          <div className="flex items-center gap-3">
            <button onClick={() => setCursor(new Date(year, month - 1, 1))} className="rounded-lg border border-black/10 px-2.5 py-1 text-sm font-bold">‹</button>
            <span className="min-w-[130px] text-center text-sm font-bold">
              {new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(cursor)}
            </span>
            <button onClick={() => setCursor(new Date(year, month + 1, 1))} className="rounded-lg border border-black/10 px-2.5 py-1 text-sm font-bold">›</button>
          </div>
        }
      />

      <div className="px-6 py-6">
        <div className="hidden grid-cols-7 gap-px overflow-hidden rounded-xl border border-black/10 bg-black/10 text-xs md:grid">
          {(locale === 'es-US' ? ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'] : ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']).map((d) => (
            <div key={d} className="bg-[#f4f1ea] px-2 py-1.5 text-center font-bold text-[#1c1712]/50">{d}</div>
          ))}
          {cells.map((day, i) => {
            if (day === null) return <div key={i} className="min-h-24 bg-white/40" />
            const key = cellKey(year, month, day)
            const bookings = byDay.get(key) ?? []
            const isToday = key === today
            return (
              <div key={i} className="min-h-24 bg-white p-1.5">
                <div className={`mb-1 text-xs font-bold ${isToday ? 'inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#b5701c] text-white' : 'text-[#1c1712]/60'}`}>
                  {day}
                </div>
                <div className="flex flex-col gap-0.5">
                  {bookings.map((b) => {
                    const customer = findCustomer(data, b.customerId)
                    return (
                      <Link
                        key={b.id}
                        to="/os/bookings/$id"
                        params={{ id: b.id }}
                        className="block truncate rounded bg-[#b5701c]/10 px-1 py-0.5 text-[10px] font-semibold text-[#b5701c] hover:bg-[#b5701c]/20"
                      >
                        {customer?.name}
                      </Link>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex flex-col gap-2 md:hidden">
          {cells
            .filter((day): day is number => day !== null && (byDay.get(cellKey(year, month, day))?.length ?? 0) > 0)
            .map((day) => {
              const key = cellKey(year, month, day)
              const bookings = byDay.get(key)!
              const isToday = key === today
              return (
                <div key={day} className="rounded-xl border border-black/10 bg-white p-3">
                  <div className="mb-1.5 flex items-center gap-2 text-sm font-bold">
                    {isToday ? (
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#b5701c] text-xs text-white">{day}</span>
                    ) : (
                      <span>{day}</span>
                    )}
                    <span className="text-[#1c1712]/50">
                      {new Intl.DateTimeFormat(locale, { weekday: 'short', month: 'short' }).format(new Date(year, month, day))}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    {bookings.map((b) => {
                      const customer = findCustomer(data, b.customerId)
                      return (
                        <Link
                          key={b.id}
                          to="/os/bookings/$id"
                          params={{ id: b.id }}
                          className="rounded-lg bg-[#b5701c]/10 px-2 py-1.5 text-sm font-semibold text-[#b5701c]"
                        >
                          {customer?.name}
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          {cells.every((day) => day === null || (byDay.get(cellKey(year, month, day))?.length ?? 0) === 0) && (
            <div className="py-10 text-center text-sm text-[#1c1712]/50">{t('No bookings this month.')}</div>
          )}
        </div>
      </div>
    </div>
  )
}
