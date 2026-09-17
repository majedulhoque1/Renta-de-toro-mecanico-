import { useEffect, useState } from 'react'

import { getDict } from '../i18n'
import { useLang } from '../lib/lang'

export default function StickyMobileBar() {
  const lang = useLang()
  const t = getDict(lang)
  const whatsappUrl = `https://wa.me/19162032106?text=${encodeURIComponent(t.wizard.whatsappIntro)}`

  // Hidden until the visitor scrolls past the hero — the hero already has
  // its own WhatsApp/call buttons, so showing this immediately on load
  // would stack two identical CTA pairs on one screen.
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > window.innerHeight * 0.8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 flex gap-2 border-t border-[var(--line)] bg-[var(--ink)] p-2.5 transition-transform duration-300 md:hidden ${
        visible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <a
        href="tel:+19162032106"
        className="flex-1 rounded-full border border-[var(--cream)]/35 py-3 text-center text-sm font-bold text-[var(--cream)]"
      >
        {t.sticky.call}
      </a>
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1 rounded-full bg-[var(--ember)] py-3 text-center text-sm font-bold text-[var(--ink)]"
      >
        {t.sticky.whatsapp}
      </a>
    </div>
  )
}
