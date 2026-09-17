import { useLocation } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

import { getDict } from '../i18n'
import { otherLangPath, useLang } from '../lib/lang'
import { useOS } from '../os/store'

export default function Header() {
  const { pathname } = useLocation()
  const lang = useLang()
  const t = getDict(lang)
  const { settings } = useOS()
  const brandName = settings.brandName || t.brand.name
  const isHome = pathname === '/' || pathname === '/en'
  const bookHref = lang === 'en' ? '/en/book' : '/reservar'
  const homeHref = lang === 'en' ? '/en' : '/'
  const eventsHref = `${homeHref}#eventos`
  const howHref = `${homeHref}#como-funciona`
  const packagesHref = `${homeHref}#paquetes`
  const faqHref = `${homeHref}#preguntas`

  // Transparent-over-photo only makes sense on the home page, which has a
  // full-bleed dark hero photo directly under the header. Every other page
  // (e.g. the booking wizard's light background) always gets the solid header.
  const [scrolledPastHero, setScrolledPastHero] = useState(false)

  useEffect(() => {
    if (!isHome) return
    const onScroll = () => setScrolledPastHero(window.scrollY > 60)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [isHome])

  const scrolled = !isHome || scrolledPastHero

  return (
    <header
      className={`fixed inset-x-0 top-0 z-30 transition-colors duration-300 ${
        scrolled
          ? 'border-b border-[var(--line)] bg-[var(--ink)]/95 backdrop-blur'
          : 'border-b border-transparent bg-transparent'
      }`}
    >
      {!scrolled && (
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-36 bg-gradient-to-b from-black/65 via-black/25 to-transparent" />
      )}

      <div className="flex items-center justify-between px-5 py-4 sm:px-10">
        <a href={homeHref} className="flex flex-col leading-none">
          <span className="font-display text-xl font-black tracking-tight text-[var(--cream)] [text-shadow:0_1px_4px_rgba(0,0,0,0.5)] sm:text-2xl">
            {brandName}
          </span>
          <span className="text-[0.6rem] font-bold tracking-[0.3em] text-[var(--ember)] [text-shadow:0_1px_4px_rgba(0,0,0,0.5)]">
            {t.brand.sub}
          </span>
        </a>

        <nav className="hidden items-center gap-6 text-sm font-semibold text-[var(--cream)] [text-shadow:0_1px_4px_rgba(0,0,0,0.5)] md:flex">
          <a href={eventsHref} className="transition hover:text-[var(--ember)]">{t.nav.events}</a>
          <a href={howHref} className="transition hover:text-[var(--ember)]">{t.nav.how}</a>
          <a href={packagesHref} className="transition hover:text-[var(--ember)]">{t.nav.packages}</a>
          <a href={faqHref} className="transition hover:text-[var(--ember)]">{t.nav.faq}</a>
        </nav>

        <div className="flex items-center gap-3">
          <a
            href={otherLangPath(pathname, lang)}
            className="hidden rounded-full border border-[var(--cream)]/30 px-3 py-1.5 text-xs font-bold text-[var(--cream)] [text-shadow:0_1px_4px_rgba(0,0,0,0.5)] transition hover:border-[var(--cream)] sm:inline-block"
          >
            {t.nav.langSwitch}
          </a>
          <a
            href={bookHref}
            className="rounded-full bg-[var(--ember)] px-4 py-2 text-sm font-bold text-[var(--ink)] transition hover:-translate-y-0.5 hover:brightness-110 sm:px-5"
          >
            {t.nav.book}
          </a>
        </div>
      </div>
    </header>
  )
}
