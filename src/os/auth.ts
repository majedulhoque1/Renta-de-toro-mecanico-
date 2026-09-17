// Demo gate, NOT security. Vite inlines VITE_* env vars into the client
// bundle at build time, so these values ship in the deployed JS regardless
// of the .env file being gitignored — anyone who opens devtools can read
// them. What this buys is narrower and real: the credential is out of the
// source repo and its git history, and Filix OS isn't sitting open on a URL
// a client wanders into mid-walkthrough. Never describe this as protection,
// and never put anything genuinely sensitive behind it until there's a real
// server. See muze-merch-admin-console.md for the same pattern on another project.

const SESSION_KEY = 'filix_os_session'

export function checkCredentials(email: string, password: string): boolean {
  const expectedEmail = import.meta.env.VITE_OS_EMAIL ?? ''
  const expectedPassword = import.meta.env.VITE_OS_PASSWORD ?? ''
  return email.trim().toLowerCase() === expectedEmail.toLowerCase() && password === expectedPassword
}

export function setSession() {
  if (typeof window !== 'undefined') window.localStorage.setItem(SESSION_KEY, '1')
}

export function clearSession() {
  if (typeof window !== 'undefined') window.localStorage.removeItem(SESSION_KEY)
}

export function hasSession(): boolean {
  if (typeof window === 'undefined') return false
  return window.localStorage.getItem(SESSION_KEY) === '1'
}
