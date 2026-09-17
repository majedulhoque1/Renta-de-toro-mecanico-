import { getDict } from '../i18n'
import { useLang } from '../lib/lang'
import { useOS } from '../os/store'

const EVENT_GRADIENT_FALLBACK =
  'linear-gradient(160deg, #4a3216, #1c1410)'

export function Home() {
  const lang = useLang()
  const t = getDict(lang)
  const os = useOS()
  const bookHref = lang === 'en' ? '/en/book' : '/reservar'

  return (
    <main>
      {/* HERO */}
      <section className="relative flex min-h-[100svh] items-end overflow-hidden">
        <img
          src="/img/hero/hero-main.webp"
          alt="Mechanical bull set up in a Minneapolis backyard at sunset"
          className="absolute inset-0 h-full w-full object-cover"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--ink)] via-[var(--ink)]/10 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--ink)]/80 via-[var(--ink)]/10 to-transparent" />

        <div className="relative z-10 w-full px-5 pb-14 sm:px-10 sm:pb-20">
          <span className="mb-4 inline-flex items-center gap-2 text-xs font-bold tracking-[0.14em] text-[var(--ember)] uppercase sm:text-sm">
            <span className="h-px w-6 bg-[var(--ember)]" />
            {t.hero.eyebrow}
          </span>
          <h1 className="max-w-2xl font-display text-4xl leading-[0.98] font-black text-[var(--cream)] sm:text-6xl lg:text-7xl">
            {t.hero.headline}
          </h1>
          <p className="mt-5 max-w-md text-base text-[var(--cream-dim)] sm:text-lg">{t.hero.sub}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a
              href={bookHref}
              className="rounded-full bg-[var(--ember)] px-6 py-3.5 text-sm font-bold text-[var(--ink)] transition hover:-translate-y-0.5 hover:brightness-110 sm:text-base"
            >
              {t.hero.cta}
            </a>
            <a
              href="tel:+19162032106"
              className="rounded-full border border-[var(--cream)]/35 px-6 py-3.5 text-sm font-bold text-[var(--cream)] transition hover:border-[var(--cream)] sm:text-base"
            >
              {t.hero.call}
            </a>
          </div>
        </div>
      </section>

      {/* WHERE WILL YOU SEE US */}
      <section id="eventos" className="scroll-mt-20 bg-[var(--paper)] px-5 py-20 text-[var(--ink)] sm:px-10">
        <div className="mx-auto max-w-6xl">
          <span className="text-xs font-bold tracking-[0.14em] text-[var(--ember-deep)] uppercase">{t.events.kicker}</span>
          <h2 className="mt-2 max-w-xl font-display text-3xl font-black sm:text-4xl">{t.events.title}</h2>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {t.events.items.map((ev) => (
              <article key={ev.title} className="group relative aspect-[4/5] overflow-hidden rounded-2xl">
                <img
                  src={ev.img}
                  alt=""
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--ink)]/90 via-[var(--ink)]/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <h3 className="font-display text-xl font-bold text-[var(--cream)]">{ev.title}</h3>
                  <p className="mt-1 text-sm text-[var(--cream-dim)]">{ev.desc}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="como-funciona" className="scroll-mt-20 bg-[var(--ink)] px-5 py-20 sm:px-10">
        <div className="mx-auto max-w-5xl text-center">
          <span className="text-xs font-bold tracking-[0.14em] text-[var(--ember)] uppercase">{t.steps.kicker}</span>
          <h2 className="mt-2 font-display text-3xl font-black text-[var(--cream)] sm:text-4xl">{t.steps.title}</h2>

          <div className="mt-12 grid grid-cols-1 gap-10 text-left sm:grid-cols-3 sm:gap-6">
            {t.steps.items.map((s) => (
              <div key={s.n}>
                <span className="font-display text-5xl font-black text-[var(--ember)]/40">{s.n}</span>
                <h3 className="mt-2 font-display text-xl font-bold text-[var(--cream)]">{s.title}</h3>
                <p className="mt-2 text-sm text-[var(--cream-dim)]">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PACKAGES */}
      <section id="paquetes" className="scroll-mt-20 bg-[var(--paper)] px-5 py-20 text-[var(--ink)] sm:px-10">
        <div className="mx-auto max-w-6xl">
          <span className="text-xs font-bold tracking-[0.14em] text-[var(--ember-deep)] uppercase">{t.packages.kicker}</span>
          <h2 className="mt-2 max-w-xl font-display text-3xl font-black sm:text-4xl">{t.packages.title}</h2>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {t.packages.items.map((pkg) => {
              const price = os.settings.prices[pkg.eventType]
              return (
                <div key={pkg.key} className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-[0_20px_50px_-30px_rgba(22,17,12,0.4)]">
                  <div>
                    <h3 className="font-display text-lg font-black">{pkg.name}</h3>
                    <p className="mt-1 text-sm text-[var(--ink)]/60">{pkg.desc}</p>
                  </div>
                  <div className="font-display text-2xl font-black text-[var(--ember-deep)]">
                    {price ? t.packages.from(price) : t.packages.quote}
                  </div>
                  <ul className="flex flex-col gap-1.5 text-sm text-[var(--ink)]/75">
                    {pkg.features.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <span className="mt-0.5 text-[var(--ember-deep)]">✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <a
                    href={`${bookHref}?tipo=${pkg.eventType}`}
                    className="mt-auto rounded-full bg-[var(--ink)] px-5 py-2.5 text-center text-sm font-bold text-[var(--cream)] transition hover:brightness-125"
                  >
                    {t.packages.cta}
                  </a>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* REAL PHOTOS */}
      <section className="bg-[var(--paper)] px-5 py-20 text-[var(--ink)] sm:px-10">
        <div className="mx-auto max-w-6xl">
          <span className="text-xs font-bold tracking-[0.14em] text-[var(--ember-deep)] uppercase">{t.gallery.kicker}</span>
          <h2 className="mt-2 font-display text-3xl font-black sm:text-4xl">{t.gallery.title}</h2>
          <p className="mt-2 max-w-lg text-sm text-[var(--ink)]/60">{t.gallery.note}</p>

          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
            {GALLERY.map((src) => (
              <div key={src} className="aspect-square overflow-hidden rounded-xl">
                <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" style={{ background: EVENT_GRADIENT_FALLBACK }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="preguntas" className="scroll-mt-20 bg-[var(--ink)] px-5 py-20 sm:px-10">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <span className="text-xs font-bold tracking-[0.14em] text-[var(--ember)] uppercase">{t.faq.kicker}</span>
            <h2 className="mt-2 font-display text-3xl font-black text-[var(--cream)] sm:text-4xl">{t.faq.title}</h2>
          </div>
          <div className="mt-10 flex flex-col gap-2.5">
            {t.faq.items.map((item) => (
              <details key={item.q} className="group rounded-xl border border-[var(--line)] bg-white/[0.03] px-5 py-1 open:bg-white/[0.05]">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-3.5 font-semibold text-[var(--cream)]">
                  {item.q}
                  <span className="shrink-0 text-lg text-[var(--ember)] transition group-open:rotate-45">+</span>
                </summary>
                <p className="pb-4 text-sm text-[var(--cream-dim)]">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="px-5 py-24 text-center sm:px-10" style={{ background: 'var(--ink)' }}>
        <span className="text-xs font-bold tracking-[0.14em] text-[var(--ember)] uppercase">{t.finalCta.kicker}</span>
        <h2 className="mt-2 font-display text-3xl font-black text-[var(--cream)] sm:text-5xl">{t.finalCta.title}</h2>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <a href="tel:+19162032106" className="rounded-2xl bg-[var(--ember)] px-6 py-4 font-display text-2xl font-black text-[var(--ink)] sm:text-3xl">
            (916) 203-2106
          </a>
          <a href="tel:+19168685335" className="rounded-2xl bg-[var(--ember)] px-6 py-4 font-display text-2xl font-black text-[var(--ink)] sm:text-3xl">
            (916) 868-5335
          </a>
        </div>
      </section>
    </main>
  )
}

const GALLERY = [
  '/img/fb-real/dusk-kids-numbers.jpg',
  '/img/fb-real/dusk-two-women-cheering.jpg',
  '/img/fb-real/daytime-toddler-girl.jpg',
  '/img/fb-real/daytime-teen-girl-slide-bg.jpg',
  '/img/fb-real/dusk-teen-boy-flowers-bg.jpg',
  '/img/fb-real/daytime-girl-cowboy-hat-2.jpg',
]
