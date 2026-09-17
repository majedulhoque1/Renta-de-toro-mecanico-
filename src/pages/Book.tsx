import { useSearch } from '@tanstack/react-router'
import { useState } from 'react'

import { Calendar } from '../components/Calendar'
import { getDict } from '../i18n'
import { useLang } from '../lib/lang'
import { createLeadFromWizard } from '../os/store'
import { EVENT_TYPE_KEYS, type DurationKey, type EventTypeKey, type IndoorOutdoor } from '../os/types'

const DURATIONS: DurationKey[] = ['2h', '4h', 'custom']
const INDOOR_OUTDOOR: IndoorOutdoor[] = ['indoor', 'outdoor', 'both']

type FormState = {
  eventType: EventTypeKey | ''
  eventDate: Date | undefined
  city: string
  attendance: string
  indoorOutdoor: IndoorOutdoor | ''
  duration: DurationKey | ''
  name: string
  phone: string
}

const TOTAL_STEPS = 6

function isStepValid(step: number, f: FormState) {
  switch (step) {
    case 0: return f.eventType !== ''
    case 1: return f.eventDate !== undefined
    case 2: return f.city.trim() !== ''
    case 3: return f.attendance.trim() !== '' && f.indoorOutdoor !== ''
    case 4: return f.duration !== ''
    case 5: return f.name.trim() !== '' && f.phone.trim().length >= 7
    default: return false
  }
}

export function Book() {
  const lang = useLang()
  const t = getDict(lang)
  const search = useSearch({ strict: false }) as { tipo?: string }
  const prefillType = EVENT_TYPE_KEYS.includes(search.tipo as EventTypeKey) ? (search.tipo as EventTypeKey) : ''

  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormState>({
    eventType: prefillType,
    eventDate: undefined,
    city: '',
    attendance: '',
    indoorOutdoor: '',
    duration: '',
    name: '',
    phone: '',
  })
  const [done, setDone] = useState(false)

  const update = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }))
  const next = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1))
  const back = () => setStep((s) => Math.max(s - 1, 0))

  const dateLocale = lang === 'en' ? 'en-US' : 'es-US'
  function formatEventDate(d: Date) {
    return new Intl.DateTimeFormat(dateLocale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(d)
  }

  function submit() {
    if (!form.eventType) return
    const eventDateIso = form.eventDate ? form.eventDate.toISOString().slice(0, 10) : null

    // Writes a real lead into the shared demo store — this is the same
    // shape submit_booking_request() will persist once Supabase exists
    // (see filix/supabase/migrations/0005_rpcs.sql). The lead shows up
    // immediately in Filix OS's Leads list and Dashboard priorities.
    createLeadFromWizard({
      name: form.name,
      phone: form.phone,
      eventType: form.eventType,
      eventDate: eventDateIso,
      city: form.city,
      attendance: form.attendance ? Number(form.attendance) : null,
      indoorOutdoor: form.indoorOutdoor || null,
      duration: form.duration || null,
      message: '',
      language: lang,
    })

    const lines = [
      t.wizard.whatsappIntro,
      `${t.wizard.whatsappFields.eventType}: ${t.wizard.eventTypeLabels[form.eventType]}`,
      form.eventDate && `${t.wizard.whatsappFields.date}: ${formatEventDate(form.eventDate)}`,
      `${t.wizard.whatsappFields.city}: ${form.city}`,
      `${t.wizard.whatsappFields.attendance}: ${form.attendance}`,
      form.indoorOutdoor && `${t.wizard.whatsappFields.indoorOutdoor}: ${t.wizard.indoorOutdoorLabels[form.indoorOutdoor]}`,
      form.duration && `${t.wizard.whatsappFields.duration}: ${t.wizard.durationLabels[form.duration]}`,
      `${t.wizard.whatsappFields.name}: ${form.name}`,
      `${t.wizard.whatsappFields.phone}: ${form.phone}`,
    ].filter(Boolean)

    const url = `https://wa.me/19162032106?text=${encodeURIComponent(lines.join('\n'))}`
    window.open(url, '_blank', 'noopener')
    setDone(true)
  }

  const homeHref = lang === 'en' ? '/en' : '/'

  if (done) {
    return (
      <main className="flex min-h-[100svh] flex-col items-center justify-center bg-[var(--paper)] px-5 pt-20 text-center text-[var(--ink)] sm:px-10">
        <span className="text-xs font-bold tracking-[0.14em] text-[var(--ember-deep)] uppercase">
          {lang === 'en' ? 'Done' : 'Listo'}
        </span>
        <h1 className="mt-2 max-w-md font-display text-3xl font-black sm:text-4xl">{t.wizard.doneTitle}</h1>
        <p className="mt-3 max-w-sm text-[var(--ink)]/70">{t.wizard.doneBody}</p>
        <a href={homeHref} className="mt-8 rounded-full border border-[var(--ink)]/25 px-6 py-3 text-sm font-bold">
          {t.wizard.backHome}
        </a>
      </main>
    )
  }

  return (
    <main className="min-h-[100svh] bg-[var(--paper)] px-5 pt-24 pb-16 text-[var(--ink)] sm:px-10">
      <div className="mx-auto max-w-lg">
        <span className="text-xs font-bold tracking-[0.14em] text-[var(--ember-deep)] uppercase">{t.wizard.kicker}</span>
        <h1 className="mt-2 font-display text-2xl font-black sm:text-3xl">{t.wizard.title}</h1>

        <div className="mt-6 flex gap-1.5">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-[var(--ember)]' : 'bg-[var(--ink)]/10'}`} />
          ))}
        </div>

        <div className="mt-8 rounded-3xl bg-white p-6 shadow-[0_20px_50px_-30px_rgba(22,17,12,0.5)] sm:p-8">
          {step === 0 && (
            <Field label={t.wizard.eventTypeQ}>
              <div className="grid grid-cols-2 gap-2">
                {EVENT_TYPE_KEYS.map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => update({ eventType: key })}
                    className={optionCls(form.eventType === key)}
                  >
                    {t.wizard.eventTypeLabels[key]}
                  </button>
                ))}
              </div>
            </Field>
          )}

          {step === 1 && (
            <Field label={t.wizard.dateQ}>
              <div className="flex justify-center">
                <Calendar lang={lang} selected={form.eventDate} onSelect={(d) => update({ eventDate: d })} />
              </div>
              {form.eventDate && (
                <p className="mt-3 text-center text-sm font-semibold text-[var(--ember-deep)]">{formatEventDate(form.eventDate)}</p>
              )}
            </Field>
          )}

          {step === 2 && (
            <Field label={t.wizard.cityQ}>
              <input
                type="text"
                placeholder={t.wizard.cityPlaceholder}
                value={form.city}
                onChange={(e) => update({ city: e.target.value })}
                className="input"
              />
            </Field>
          )}

          {step === 3 && (
            <>
              <Field label={t.wizard.attendanceQ}>
                <input
                  type="number"
                  min={1}
                  placeholder={t.wizard.attendancePlaceholder}
                  value={form.attendance}
                  onChange={(e) => update({ attendance: e.target.value })}
                  className="input"
                />
              </Field>
              <Field label={t.wizard.indoorOutdoorQ}>
                <div className="flex gap-2">
                  {INDOOR_OUTDOOR.map((opt) => (
                    <button key={opt} type="button" onClick={() => update({ indoorOutdoor: opt })} className={`flex-1 ${optionCls(form.indoorOutdoor === opt)}`}>
                      {t.wizard.indoorOutdoorLabels[opt]}
                    </button>
                  ))}
                </div>
              </Field>
            </>
          )}

          {step === 4 && (
            <Field label={t.wizard.durationQ}>
              <div className="flex flex-col gap-2">
                {DURATIONS.map((d) => (
                  <button key={d} type="button" onClick={() => update({ duration: d })} className={`text-left ${optionCls(form.duration === d)}`}>
                    {t.wizard.durationLabels[d]}
                  </button>
                ))}
              </div>
            </Field>
          )}

          {step === 5 && (
            <>
              <Field label={t.wizard.nameLabel}>
                <input type="text" value={form.name} onChange={(e) => update({ name: e.target.value })} className="input" />
              </Field>
              <Field label={t.wizard.phoneLabel}>
                <input
                  type="tel"
                  placeholder={t.wizard.phonePlaceholder}
                  value={form.phone}
                  onChange={(e) => update({ phone: e.target.value })}
                  className="input"
                />
              </Field>
            </>
          )}

          <div className="mt-8 flex items-center justify-between">
            <button type="button" onClick={back} disabled={step === 0} className="text-sm font-semibold text-[var(--ink)]/60 disabled:opacity-0">
              {t.wizard.back}
            </button>

            {step < TOTAL_STEPS - 1 ? (
              <button
                type="button"
                onClick={next}
                disabled={!isStepValid(step, form)}
                className="rounded-full bg-[var(--ember)] px-6 py-3 text-sm font-bold text-[var(--ink)] transition disabled:cursor-not-allowed disabled:opacity-30"
              >
                {t.wizard.next}
              </button>
            ) : (
              <button
                type="button"
                onClick={submit}
                disabled={!isStepValid(step, form)}
                className="rounded-full bg-[var(--ember)] px-6 py-3 text-sm font-bold text-[var(--ink)] transition disabled:cursor-not-allowed disabled:opacity-30"
              >
                {t.wizard.submit}
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

function optionCls(active: boolean) {
  return `rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
    active ? 'border-[var(--ember)] bg-[var(--ember)]/10 text-[var(--ember-deep)]' : 'border-[var(--ink)]/15 hover:border-[var(--ink)]/35'
  }`
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="mb-5 block last:mb-0">
      <span className="mb-2 block text-sm font-bold text-[var(--ink)]">{label}</span>
      {children}
    </label>
  )
}
