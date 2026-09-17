import type { DurationKey, EventTypeKey, IndoorOutdoor } from '../os/types'

export interface EventCard {
  title: string
  desc: string
  img: string
}

export interface PackageDef {
  key: string
  eventType: EventTypeKey
  name: string
  desc: string
  features: string[]
}

export interface FaqItem {
  q: string
  a: string
}

export interface Dict {
  meta: { title: string; description: string }
  brand: { name: string; sub: string }
  nav: { events: string; how: string; packages: string; faq: string; book: string; langSwitch: string }
  hero: { eyebrow: string; headline: string; sub: string; cta: string; call: string }
  events: { kicker: string; title: string; items: EventCard[] }
  steps: { kicker: string; title: string; items: { n: string; title: string; desc: string }[] }
  packages: {
    kicker: string
    title: string
    from: (price: string) => string
    quote: string
    cta: string
    items: PackageDef[]
  }
  gallery: { kicker: string; title: string; note: string }
  faq: { kicker: string; title: string; items: FaqItem[] }
  finalCta: { kicker: string; title: string }
  footer: { tagline: string; rights: string; nameNote: string; admin: string }
  sticky: { call: string; whatsapp: string }
  wizard: {
    kicker: string
    title: string
    eventTypeQ: string
    eventTypeLabels: Record<EventTypeKey, string>
    dateQ: string
    cityQ: string
    cityPlaceholder: string
    attendanceQ: string
    attendancePlaceholder: string
    indoorOutdoorQ: string
    indoorOutdoorLabels: Record<IndoorOutdoor, string>
    durationQ: string
    durationLabels: Record<DurationKey, string>
    nameLabel: string
    phoneLabel: string
    phonePlaceholder: string
    back: string
    next: string
    submit: string
    doneTitle: string
    doneBody: string
    backHome: string
    whatsappIntro: string
    whatsappFields: {
      eventType: string
      date: string
      city: string
      attendance: string
      indoorOutdoor: string
      duration: string
      name: string
      phone: string
    }
  }
}
