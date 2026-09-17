import { Outlet, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

import { Shell } from '../../os/components/Shell'
import { hasSession } from '../../os/auth'

export const Route = createFileRoute('/os')({
  head: () => ({ meta: [{ title: 'Filix OS' }] }),
  component: OSLayout,
})

function OSLayout() {
  const navigate = useNavigate()
  // hasSession() reads localStorage, so it can only be checked client-side,
  // after mount — SSR always renders the "checking" state below, which
  // avoids ever flashing real OS content before the auth check runs.
  const [status, setStatus] = useState<'checking' | 'authed'>('checking')

  useEffect(() => {
    if (hasSession()) {
      setStatus('authed')
    } else {
      navigate({ to: '/login' })
    }
  }, [navigate])

  if (status === 'checking') {
    return <div className="flex min-h-screen items-center justify-center bg-[#f4f1ea] text-sm text-[#1c1712]/50">Loading…</div>
  }

  return (
    <Shell>
      <Outlet />
    </Shell>
  )
}
