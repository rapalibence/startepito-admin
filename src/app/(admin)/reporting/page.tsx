import { createClient } from '@/lib/supabase/server'
import { STATUSZ_LABELS, KANBAN_STATUSZOK } from '@/types'
import type { Munka, Statusz } from '@/types'
import { differenceInDays } from 'date-fns'

export const instant = false

function avg(nums: number[]): number {
  if (nums.length === 0) return 0
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length)
}

export default async function ReportingPage() {
  const supabase = await createClient()

  const { data: munkak } = await supabase
    .from('munka')
    .select('*')
    .order('created_at', { ascending: false })

  const all = (munkak ?? []) as Munka[]

  const total = all.length
  const megrendelve = all.filter((m) => m.statusz === 'megrendelve').length
  const elvesztett = all.filter((m) => m.statusz === 'elvesztett').length
  const aktiv = all.filter(
    (m) => !['megrendelve', 'elvesztett', 'nem_relevans', 'parkoltatva'].includes(m.statusz)
  ).length

  const winRate =
    megrendelve + elvesztett > 0
      ? Math.round((megrendelve / (megrendelve + elvesztett)) * 100)
      : null

  const avgDaysByStatus: Record<string, number> = {}
  for (const s of KANBAN_STATUSZOK) {
    const items = all.filter((m) => m.statusz === s && m.statusz_valtozas_at)
    const days = items.map((m) =>
      differenceInDays(new Date(), new Date(m.statusz_valtozas_at!))
    )
    if (days.length > 0) avgDaysByStatus[s] = avg(days)
  }

  const elvesztesOkok: Record<string, number> = {}
  for (const m of all.filter((m) => m.statusz === 'elvesztett' && m.elvesztes_ok)) {
    const ok = m.elvesztes_ok!
    elvesztesOkok[ok] = (elvesztesOkok[ok] ?? 0) + 1
  }
  const elvesztesOkLista = Object.entries(elvesztesOkok)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)

  const funnelCounts = KANBAN_STATUSZOK.map((s) => ({
    statusz: s,
    count: all.filter((m) => m.statusz === s).length,
  }))
  const maxFunnel = Math.max(...funnelCounts.map((f) => f.count), 1)

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <h1 className="text-xl font-bold text-gray-900">Riportok</h1>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-gray-900">{total}</p>
          <p className="text-xs text-gray-500 mt-1">Összes lead</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-gray-900">{aktiv}</p>
          <p className="text-xs text-gray-500 mt-1">Aktív pipeline</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-gray-900">{megrendelve}</p>
          <p className="text-xs text-gray-500 mt-1">Megrendelve</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
          <p
            className={`text-3xl font-bold ${
              winRate === null
                ? 'text-gray-400'
                : winRate >= 50
                ? 'text-green-600'
                : winRate >= 25
                ? 'text-yellow-600'
                : 'text-red-600'
            }`}
          >
            {winRate === null ? '—' : `${winRate}%`}
          </p>
          <p className="text-xs text-gray-500 mt-1">Win rate</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Funnel */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Pipeline tölcsér</h2>
          <div className="space-y-2">
            {funnelCounts.map(({ statusz, count }) => (
              <div key={statusz} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-32 shrink-0 text-right">
                  {STATUSZ_LABELS[statusz as Statusz]}
                </span>
                <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                  <div
                    className="bg-blue-500 h-4 rounded-full transition-all"
                    style={{ width: `${(count / maxFunnel) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-gray-700 w-6 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Átlagos napok állapotban */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            Átlagos napok állapotban (aktív leadek)
          </h2>
          {Object.keys(avgDaysByStatus).length === 0 ? (
            <p className="text-sm text-gray-400">Nincs adat.</p>
          ) : (
            <div className="space-y-2">
              {KANBAN_STATUSZOK.filter((s) => avgDaysByStatus[s] !== undefined).map((s) => {
                const days = avgDaysByStatus[s]
                const color =
                  days <= 7 ? 'text-green-600' : days <= 14 ? 'text-yellow-600' : 'text-red-600'
                return (
                  <div key={s} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{STATUSZ_LABELS[s as Statusz]}</span>
                    <span className={`font-semibold ${color}`}>{days} nap</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Elvesztés okai */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Elvesztés okai</h2>
          {elvesztesOkLista.length === 0 ? (
            <p className="text-sm text-gray-400">Nincs elvesztett lead.</p>
          ) : (
            <div className="space-y-2">
              {elvesztesOkLista.map(([ok, count]) => (
                <div key={ok} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 truncate max-w-[70%]">{ok}</span>
                  <span className="font-semibold text-gray-800 shrink-0 ml-2">{count}×</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Forrás szerinti megoszlás */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Leadek forrás szerint</h2>
          {(() => {
            const forrasCounts: Record<string, number> = {}
            for (const m of all) {
              forrasCounts[m.forras] = (forrasCounts[m.forras] ?? 0) + 1
            }
            const lista = Object.entries(forrasCounts).sort((a, b) => b[1] - a[1])
            const maxCount = Math.max(...lista.map(([, c]) => c), 1)
            return lista.map(([forras, count]) => (
              <div key={forras} className="flex items-center gap-3 mb-2">
                <span className="text-xs text-gray-500 w-28 shrink-0 text-right capitalize">
                  {forras}
                </span>
                <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-purple-400 h-3 rounded-full"
                    style={{ width: `${(count / maxCount) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-gray-700 w-6 text-right">{count}</span>
              </div>
            ))
          })()}
        </div>
      </div>
    </div>
  )
}
