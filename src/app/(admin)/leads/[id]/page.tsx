import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import TransitionForm from '@/components/lead/TransitionForm'
import { STATUSZ_LABELS, FORRAS_LABELS } from '@/types'
import type { Munka, StatuszAtmenet, UserRole } from '@/types'
import { format } from 'date-fns'
import { hu } from 'date-fns/locale'

export const instant = false

function formatArFt(netto: number | null): string {
  if (netto === null) return '—'
  return netto.toLocaleString('hu-HU') + ' Ft'
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-3 py-2 border-b border-gray-100 last:border-0">
      <span className="text-xs text-gray-500 w-36 shrink-0">{label}</span>
      <span className="text-sm text-gray-800">{value ?? '—'}</span>
    </div>
  )
}

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const userRole: UserRole = (user?.user_metadata?.role as UserRole) ?? 'owner'

  const [{ data: munkaData }, { data: timeline }] = await Promise.all([
    supabase.from('munka').select('*').eq('id', id).single(),
    supabase
      .from('statusz_atmenet')
      .select('*')
      .eq('munka_id', id)
      .order('created_at', { ascending: false }),
  ])

  if (!munkaData) notFound()

  const munka = munkaData as Munka
  const atmenetLista = (timeline ?? []) as StatuszAtmenet[]

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-xl font-bold text-gray-900">{munka.ugyfel_nev}</h1>
            {munka.ugyfel_cegnev && (
              <span className="text-sm text-gray-500">({munka.ugyfel_cegnev})</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {munka.munkaszam && (
              <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                {munka.munkaszam}
              </span>
            )}
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-medium">
              {STATUSZ_LABELS[munka.statusz]}
            </span>
            <span className="text-xs text-gray-400">
              Forrás: {FORRAS_LABELS[munka.forras]}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left: Details */}
        <div className="col-span-2 space-y-4">
          {/* Contact */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Kapcsolattartó</h2>
            <DetailRow label="Email" value={munka.ugyfel_email} />
            <DetailRow label="Telefon" value={munka.ugyfel_telefon} />
            <DetailRow label="Cím" value={munka.ugyfel_cim} />
            <DetailRow label="FGSZ ügyfél" value={munka.fgsz_ugyfel ? 'Igen' : 'Nem'} />
          </div>

          {/* Financial */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Pénzügyi adatok</h2>
            <DetailRow label="Nettó ár" value={formatArFt(munka.netto_ar_ft)} />
            <DetailRow
              label="Fedezet"
              value={munka.fedezet_pct !== null ? `${munka.fedezet_pct}%` : null}
            />
            <DetailRow label="Határidő" value={munka.hatarido} />
            <DetailRow
              label="Felmérés időpontja"
              value={
                munka.felmeres_idopont
                  ? format(new Date(munka.felmeres_idopont), 'yyyy. MM. dd. HH:mm', { locale: hu })
                  : null
              }
            />
          </div>

          {/* Description */}
          {munka.leiras && (
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <h2 className="text-sm font-semibold text-gray-700 mb-2">Leírás</h2>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{munka.leiras}</p>
            </div>
          )}

          {/* Notes */}
          {munka.megjegyzes && (
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <h2 className="text-sm font-semibold text-gray-700 mb-2">Megjegyzés</h2>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{munka.megjegyzes}</p>
            </div>
          )}

          {/* Timeline */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Előzmények</h2>
            {atmenetLista.length === 0 ? (
              <p className="text-sm text-gray-400">Nincsenek előzmények.</p>
            ) : (
              <div className="space-y-2">
                {atmenetLista.map((a) => (
                  <div key={a.id} className="flex gap-3 items-start text-sm">
                    <span className="text-xs text-gray-400 w-32 shrink-0 mt-0.5">
                      {format(new Date(a.created_at), 'MM. dd. HH:mm')}
                    </span>
                    <span className="text-gray-600">
                      {a.regi_statusz ? (
                        <>
                          <span className="text-gray-400">{STATUSZ_LABELS[a.regi_statusz]}</span>
                          <span className="mx-1 text-gray-300">→</span>
                        </>
                      ) : null}
                      <span className="font-medium text-gray-800">
                        {STATUSZ_LABELS[a.uj_statusz]}
                      </span>
                      {a.megjegyzes && (
                        <span className="ml-2 text-gray-400 italic">{a.megjegyzes}</span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Transition form */}
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Állapot módosítása</h2>
            <TransitionForm munka={munka} userRole={userRole} />
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-2">Metaadatok</h2>
            <DetailRow
              label="Létrehozva"
              value={format(new Date(munka.created_at), 'yyyy. MM. dd.', { locale: hu })}
            />
            <DetailRow
              label="Módosítva"
              value={format(new Date(munka.updated_at), 'yyyy. MM. dd.', { locale: hu })}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
