'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Munka, Statusz, UserRole } from '@/types'
import { ALLOWED_TRANSITIONS, ESTIMATOR_ALLOWED_FROM, STATUSZ_LABELS } from '@/types'

const REQUIRES_FIELDS: Partial<Record<Statusz, string[]>> = {
  ajanlat_keszul: ['netto_ar_ft', 'fedezet_pct'],
  jovahagyasra_var: ['netto_ar_ft', 'fedezet_pct'],
  ajanlat_kint: ['netto_ar_ft'],
  parkoltatva: ['parkoltatva_ok', 'parkoltatva_ig'],
  elvesztett: ['elvesztes_ok'],
  nem_relevans: ['nem_relevans_ok'],
}

export default function TransitionForm({
  munka,
  userRole,
}: {
  munka: Munka
  userRole: UserRole
}) {
  const router = useRouter()
  const [ujStatusz, setUjStatusz] = useState<Statusz | ''>('')
  const [megjegyzes, setMegjegyzes] = useState('')
  const [extraFields, setExtraFields] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const allowedNext = ALLOWED_TRANSITIONS[munka.statusz] ?? []
  const filteredNext =
    userRole === 'estimator'
      ? ESTIMATOR_ALLOWED_FROM.includes(munka.statusz)
        ? allowedNext
        : []
      : allowedNext

  if (filteredNext.length === 0) {
    return (
      <p className="text-sm text-gray-400 italic">
        Nincs elérhető állapotváltozás ehhez a szerepkörhöz.
      </p>
    )
  }

  const requiredFields = ujStatusz ? (REQUIRES_FIELDS[ujStatusz] ?? []) : []

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!ujStatusz) return
    setError(null)
    setLoading(true)

    const body: Record<string, unknown> = {
      munka_id: munka.id,
      uj_statusz: ujStatusz,
      megjegyzes: megjegyzes || undefined,
      ...extraFields,
    }

    const res = await fetch('/api/transitions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Hiba az állapotváltozás során.')
      setLoading(false)
      return
    }

    router.refresh()
    setLoading(false)
    setUjStatusz('')
    setMegjegyzes('')
    setExtraFields({})
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Új állapot</label>
        <select
          value={ujStatusz}
          onChange={(e) => {
            setUjStatusz(e.target.value as Statusz)
            setExtraFields({})
          }}
          className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="">Válasszon állapotot...</option>
          {filteredNext.map((s) => (
            <option key={s} value={s}>
              {STATUSZ_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      {requiredFields.includes('netto_ar_ft') && (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Nettó ár (Ft) *
          </label>
          <input
            type="number"
            value={extraFields.netto_ar_ft ?? ''}
            onChange={(e) => setExtraFields((p) => ({ ...p, netto_ar_ft: e.target.value }))}
            required
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="pl. 3500000"
          />
        </div>
      )}

      {requiredFields.includes('fedezet_pct') && (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Fedezet (%) *
          </label>
          <input
            type="number"
            step="0.1"
            value={extraFields.fedezet_pct ?? ''}
            onChange={(e) => setExtraFields((p) => ({ ...p, fedezet_pct: e.target.value }))}
            required
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="pl. 25"
          />
        </div>
      )}

      {requiredFields.includes('parkoltatva_ok') && (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Parkoltatás oka *
          </label>
          <input
            type="text"
            value={extraFields.parkoltatva_ok ?? ''}
            onChange={(e) => setExtraFields((p) => ({ ...p, parkoltatva_ok: e.target.value }))}
            required
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {requiredFields.includes('parkoltatva_ig') && (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Parkoltatva eddig *
          </label>
          <input
            type="date"
            value={extraFields.parkoltatva_ig ?? ''}
            onChange={(e) => setExtraFields((p) => ({ ...p, parkoltatva_ig: e.target.value }))}
            required
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {requiredFields.includes('elvesztes_ok') && (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Elvesztés oka *
          </label>
          <input
            type="text"
            value={extraFields.elvesztes_ok ?? ''}
            onChange={(e) => setExtraFields((p) => ({ ...p, elvesztes_ok: e.target.value }))}
            required
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {requiredFields.includes('nem_relevans_ok') && (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Nem releváns oka *
          </label>
          <input
            type="text"
            value={extraFields.nem_relevans_ok ?? ''}
            onChange={(e) => setExtraFields((p) => ({ ...p, nem_relevans_ok: e.target.value }))}
            required
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Megjegyzés (opcionális)
        </label>
        <textarea
          value={megjegyzes}
          onChange={(e) => setMegjegyzes(e.target.value)}
          rows={2}
          className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !ujStatusz}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
      >
        {loading ? 'Mentés...' : 'Állapot módosítása'}
      </button>
    </form>
  )
}
