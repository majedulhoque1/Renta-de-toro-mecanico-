import { useLocation } from '@tanstack/react-router'

export type Lang = 'es' | 'en'

/**
 * Language comes from the URL path, never from localStorage or browser
 * detection — server and client always agree on it from the same request,
 * so there's no hydration mismatch here (unlike Chrome's own translation,
 * which we don't control — see filix-bugs.md #1).
 */
export function useLang(): Lang {
  const { pathname } = useLocation()
  return pathname.startsWith('/en') ? 'en' : 'es'
}

/** Builds the equivalent path in the other language, for the ES|EN switch. */
export function otherLangPath(pathname: string, lang: Lang): string {
  if (lang === 'es') {
    if (pathname === '/') return '/en'
    if (pathname === '/reservar') return '/en/book'
    return `/en${pathname}`
  }
  if (pathname === '/en/book') return '/reservar'
  const stripped = pathname.replace(/^\/en/, '')
  return stripped === '' ? '/' : stripped
}
