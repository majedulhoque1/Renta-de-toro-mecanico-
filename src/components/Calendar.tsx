import { es } from 'date-fns/locale'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/style.css'

import type { Lang } from '../lib/lang'

// Same calendar pattern as the booking-crm-kit's proven BookingCalendar (used
// across Xen and other client sites) — single-panel here since Felix books a
// whole event, not an appointment slot, so there's no "pick a time" side
// panel to justify a two-column layout.

export function Calendar({
  selected,
  onSelect,
  lang = 'es',
}: {
  selected: Date | undefined
  onSelect: (date: Date | undefined) => void
  lang?: Lang
}) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return (
    <DayPicker
      mode="single"
      locale={lang === 'es' ? es : undefined}
      selected={selected}
      onSelect={onSelect}
      startMonth={today}
      disabled={{ before: today }}
      showOutsideDays
      className="filix-calendar"
    />
  )
}
