import { HeadContent, Scripts, createRootRoute, useLocation } from '@tanstack/react-router'

import Footer from '../components/Footer'
import Header from '../components/Header'
import StickyMobileBar from '../components/StickyMobileBar'
import appCss from '../styles.css?url'

function RootError({ error }: { error: unknown }) {
  return (
    <div className="flex min-h-[100svh] flex-col items-center justify-center gap-3 bg-[var(--ink)] px-6 text-center text-[var(--cream)]">
      <p className="font-display text-2xl font-black">Algo salió mal.</p>
      <p className="text-sm text-[var(--cream-dim)]">
        {error instanceof Error ? error.message : 'Error desconocido.'}
      </p>
      <a href="/" className="mt-2 rounded-full bg-[var(--ember)] px-5 py-2.5 text-sm font-bold text-[var(--ink)]">
        Volver al inicio
      </a>
    </div>
  )
}

export const Route = createRootRoute({
  // Defense-in-depth alongside the vite.config.ts fix: if a client-side
  // render error still slips through (translation-mutated DOM or anything
  // else), this catches it in the browser instead of it propagating into a
  // console dump that a fragile dev-server write path could crash on.
  errorComponent: RootError,
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      {
        title: 'Felix — Renta de Toro Mecánico en Minneapolis',
      },
      {
        name: 'description',
        content:
          'Renta de toro mecánico en Minneapolis para cumpleaños, quinceañeras, bautizos y eventos de empresa. Operador incluido.',
      },
      { name: 'theme-color', content: '#16110c' },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation()
  const lang = pathname.startsWith('/en') ? 'en' : 'es'
  // Felix OS and the login gate replace the public chrome entirely — they
  // have their own shell (dense ops-console layout, not the marketing site).
  const isAppChrome = pathname.startsWith('/os') || pathname === '/login'

  return (
    <html lang={lang} suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body
        className={`bg-[var(--ink)] font-sans text-[var(--cream)] antialiased ${
          isAppChrome ? '' : 'pb-16 md:pb-0'
        }`}
      >
        {!isAppChrome && <Header />}
        {children}
        {!isAppChrome && <Footer />}
        {!isAppChrome && <StickyMobileBar />}
        <Scripts />
      </body>
    </html>
  )
}
