import { createClient } from '@/lib/supabase/server'
import KanbanCard from '@/components/kanban/KanbanCard'
import { KANBAN_STATUSZOK, SIDE_STATUSZOK, STATUSZ_LABELS } from '@/types'
import type { Munka } from '@/types'

export const instant = false

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: munkak, error } = await supabase
    .from('munka')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <div className="p-6 text-red-600">
        Hiba az adatok betöltésekor: {error.message}
      </div>
    )
  }

  const byStatusz = (munkak ?? []).reduce<Record<string, Munka[]>>((acc, m) => {
    if (!acc[m.statusz]) acc[m.statusz] = []
    acc[m.statusz].push(m as Munka)
    return acc
  }, {})

  const sideItems = SIDE_STATUSZOK.map((s) => ({
    statusz: s,
    count: byStatusz[s]?.length ?? 0,
  }))

  return (
    <div className="flex h-full">
      {/* Kanban board */}
      <div className="flex-1 overflow-x-auto p-4">
        <div className="flex gap-3 min-w-max h-full items-start">
          {KANBAN_STATUSZOK.map((statusz) => {
            const cards = byStatusz[statusz] ?? []
            return (
              <div
                key={statusz}
                className="w-52 shrink-0 bg-gray-50 rounded-xl border border-gray-200 flex flex-col max-h-[calc(100vh-7rem)]"
              >
                <div className="px-3 py-2.5 border-b border-gray-200 flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-700 leading-tight">
                    {STATUSZ_LABELS[statusz]}
                  </span>
                  <span className="text-xs bg-gray-200 text-gray-600 rounded-full px-1.5 py-0.5 font-medium">
                    {cards.length}
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto p-2">
                  {cards.map((munka) => (
                    <KanbanCard key={munka.id} munka={munka} />
                  ))}
                  {cards.length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-4">Üres</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Side panel */}
      <aside className="w-44 shrink-0 border-l border-gray-200 bg-white p-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Egyéb
        </p>
        <div className="space-y-2">
          {sideItems.map(({ statusz, count }) => (
            <div key={statusz} className="flex items-center justify-between">
              <span className="text-xs text-gray-600">{STATUSZ_LABELS[statusz]}</span>
              <span className="text-xs font-medium text-gray-800 bg-gray-100 rounded-full px-2 py-0.5">
                {count}
              </span>
            </div>
          ))}
        </div>
      </aside>
    </div>
  )
}
