import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

import { PageHeader } from '../../os/components/Shell'
import { resetDemoData, setPrice, updateSettings, useOS } from '../../os/store'
import { EVENT_TYPE_KEYS } from '../../os/types'
import { es } from '../../i18n/es'

export const Route = createFileRoute('/os/settings')({ component: Settings })

function Settings() {
  const data = useOS()
  const [confirmReset, setConfirmReset] = useState(false)

  return (
    <div>
      <PageHeader title="Settings" />

      <div className="flex max-w-xl flex-col gap-6 px-6 py-6">
        <div className="rounded-xl border border-black/10 bg-white p-4">
          <h2 className="mb-3 text-sm font-bold">Brand</h2>
          <label className="block text-xs font-bold">
            Public brand name
            <input
              value={data.settings.brandName}
              onChange={(e) => updateSettings({ brandName: e.target.value })}
              className="input mt-1"
            />
          </label>
          <p className="mt-2 text-xs text-[#1c1712]/50">Shown on the public site header/footer. Currently a working name, pending confirmation.</p>
        </div>

        <div className="rounded-xl border border-black/10 bg-white p-4">
          <h2 className="mb-3 text-sm font-bold">Starting prices</h2>
          <p className="mb-3 text-xs text-[#1c1712]/50">
            Leave blank to show "Cotización gratis / Free quote" on the public packages section instead of a price.
          </p>
          <div className="flex flex-col gap-2">
            {EVENT_TYPE_KEYS.map((key) => (
              <div key={key} className="flex items-center justify-between gap-3">
                <span className="text-sm">{es.wizard.eventTypeLabels[key]}</span>
                <div className="flex items-center gap-1">
                  <span className="text-sm text-[#1c1712]/50">$</span>
                  <input
                    type="number"
                    value={data.settings.prices[key] ?? ''}
                    onChange={(e) => setPrice(key, e.target.value)}
                    placeholder="—"
                    className="input w-24 text-right"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-black/10 bg-white p-4">
          <h2 className="mb-3 text-sm font-bold">Deposit</h2>
          <label className="block text-xs font-bold">
            Deposit required at booking (%)
            <input
              type="number"
              min={0}
              max={100}
              value={data.settings.depositPercent}
              onChange={(e) => updateSettings({ depositPercent: Number(e.target.value) })}
              className="input mt-1 w-24"
            />
          </label>
        </div>

        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <h2 className="mb-2 text-sm font-bold text-red-900">Reset demo data</h2>
          <p className="mb-3 text-xs text-red-800/70">Restores the original seeded leads, bookings and payments. Cannot be undone.</p>
          {!confirmReset ? (
            <button type="button" onClick={() => setConfirmReset(true)} className="rounded-lg border border-red-300 px-3 py-2 text-sm font-bold text-red-800">
              Reset demo data
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { resetDemoData(); setConfirmReset(false) }}
                className="rounded-lg bg-red-700 px-3 py-2 text-sm font-bold text-white"
              >
                Confirm reset
              </button>
              <button type="button" onClick={() => setConfirmReset(false)} className="rounded-lg px-3 py-2 text-sm font-bold text-red-800/60">
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
