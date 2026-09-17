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
    return pathname === '/' ? '/en' : `/en${pathname}`
  }
  const stripped = pathname.replace(/^\/en/, '')
  return stripped === '' ? '/' : stripped
}
