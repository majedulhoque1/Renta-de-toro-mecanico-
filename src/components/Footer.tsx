import { getDict } from '../i18n'
import { useLang } from '../lib/lang'
import { useOS } from '../os/store'

export default function Footer() {
  const lang = useLang()
  const t = getDict(lang)
  const { settings } = useOS()
  const brandName = settings.brandName || t.brand.name

  return (
    <footer className="border-t border-[var(--line)] bg-[var(--ink)] px-5 py-12 text-center sm:px-10">
      <div className="font-display text-2xl font-black tracking-tight text-[var(--ember)]">
        {brandName}
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-4">
        <a href="tel:+19162032106" className="text-lg font-bold text-[var(--cream)]">
          (916) 203-2106
        </a>
        <a href="tel:+19168685335" className="text-lg font-bold text-[var(--cream)]">
          (916) 868-5335
        </a>
      </div>
      <p className="mt-3 text-sm text-[var(--cream-dim)]">{t.footer.tagline}</p>

      <p className="mx-auto mt-6 max-w-md text-xs text-[var(--cream-dim)]/70">
        © {new Date().getFullYear()} {brandName}. {t.footer.rights} {t.footer.nameNote}
      </p>

      <div className="mt-3 flex items-center justify-center text-xs text-[var(--cream-dim)]/70">
        {/* Deliberately unhighlighted — same dim weight as the copyright
            text, no accent, no border. Not meant to be discovered by a
            client mid-walkthrough; it's a demo gate, not a feature to
            advertise. See muze-merch-admin-console.md for the same pattern. */}
        <a href="/login" className="text-[var(--cream-dim)]/70 hover:text-[var(--cream-dim)]">
          {t.footer.admin}
        </a>
      </div>
    </footer>
  )
}
