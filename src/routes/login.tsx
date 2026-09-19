import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

import { setOSLang, useT } from '../os/i18n'
import { checkCredentials, hasSession, setSession } from '../os/auth'

export const Route = createFileRoute('/login')({
  head: () => ({ meta: [{ title: 'Log in — Felix OS' }] }),
  component: Login,
})

function Login() {
  const navigate = useNavigate()
  const { t, lang } = useT()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (checkCredentials(email, password)) {
      setSession()
      navigate({ to: '/os' })
    } else {
      setError(true)
    }
  }

  // Already logged in? Skip straight to the dashboard. Client-only check
  // (localStorage) inside an effect — navigating during render would update
  // the router while this component is still rendering.
  useEffect(() => {
    if (hasSession()) navigate({ to: '/os' })
  }, [navigate])

  return (
    <main className="flex min-h-[100svh] items-center justify-center bg-[var(--ink)] px-5">
      <div className="w-full max-w-sm rounded-2xl bg-[var(--paper)] p-8 text-[var(--ink)]">
        <div className="mb-3 flex justify-end">
          <button
            type="button"
            onClick={() => setOSLang(lang === 'en' ? 'es' : 'en')}
            aria-label={lang === 'en' ? 'Cambiar a español' : 'Switch to English'}
            className="rounded-full border border-[var(--ink)]/20 px-3 py-1 text-xs font-bold text-[var(--ink)]/70 hover:border-[var(--ink)]/50"
          >
            {lang === 'en' ? 'Español' : 'English'}
          </button>
        </div>
        <div className="mb-6 text-center">
          <div className="font-display text-2xl font-black text-[var(--ember-deep)]">Felix OS</div>
          <p className="mt-1 text-sm text-[var(--ink)]/60">{t('Sign in to manage your business')}</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-bold">{t('Email')}</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(false) }}
              className="input"
              autoComplete="username"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-bold">{t('Password')}</span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(false) }}
              className="input"
              autoComplete="current-password"
            />
          </label>
          {error && <p className="text-sm font-semibold text-red-600">{t('Incorrect email or password.')}</p>}
          <button type="submit" className="mt-2 rounded-full bg-[var(--ember)] py-3 text-sm font-bold text-[var(--ink)] transition hover:brightness-110">
            {t('Log in')}
          </button>
        </form>

        <a href="/" className="mt-6 block text-center text-xs text-[var(--ink)]/50 hover:text-[var(--ink)]/70">
          {t('← Back to the site')}
        </a>
      </div>
    </main>
  )
}
