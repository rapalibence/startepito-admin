'use client'

import Link from 'next/link'
import type { Munka } from '@/types'
import { FORRAS_LABELS } from '@/types'
import { getSlaColor, getDaysInStatus } from '@/lib/sla'

function formatArFt(netto: number | null): string {
  if (netto === null) return '—'
  if (netto >= 1_000_000) {
    return (netto / 1_000_000).toLocaleString('hu-HU', { maximumFractionDigits: 1 }) + ' M Ft'
  }
  if (netto >= 1_000) {
    return Math.round(netto / 1_000).toLocaleString('hu-HU') + ' e Ft'
  }
  return netto.toLocaleString('hu-HU') + ' Ft'
}

const FORRAS_COLORS: Record<string, string> = {
  web: 'bg-blue-100 text-blue-700',
  telefon: 'bg-purple-100 text-purple-700',
  email: 'bg-yellow-100 text-yellow-700',
  ajanlas: 'bg-green-100 text-green-700',
  fgsz: 'bg-orange-100 text-orange-700',
  keretszerzodes: 'bg-pink-100 text-pink-700',
}

const SLA_DOT: Record<string, string> = {
  green: 'bg-green-500',
  yellow: 'bg-yellow-400',
  red: 'bg-red-500',
}

export default function KanbanCard({ munka }: { munka: Munka }) {
  const slaColor = getSlaColor(munka.statusz, munka.statusz_valtozas_at)
  const daysInStatus = getDaysInStatus(munka.statusz_valtozas_at)

  return (
    <Link href={`/leads/${munka.id}`}>
      <div className="bg-white border border-gray-200 rounded-lg p-3 mb-2 hover:border-blue-400 hover:shadow-sm transition-all cursor-pointer">
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className="text-xs font-mono text-gray-400">
            {munka.munkaszam ?? 'Új'}
          </span>
          <span
            className={`w-2 h-2 rounded-full shrink-0 mt-0.5 ${SLA_DOT[slaColor]}`}
            title={`${daysInStatus} nap ebben az állapotban`}
          />
        </div>

        <p className="text-sm font-medium text-gray-800 leading-tight mb-2 truncate">
          {munka.ugyfel_nev}
        </p>

        <div className="flex items-center justify-between gap-1">
          <span
            className={`text-xs px-1.5 py-0.5 rounded font-medium ${
              FORRAS_COLORS[munka.forras] ?? 'bg-gray-100 text-gray-600'
            }`}
          >
            {FORRAS_LABELS[munka.forras]}
          </span>
          <span className="text-xs text-gray-500 font-medium">
            {formatArFt(munka.netto_ar_ft)}
          </span>
        </div>

        <div className="mt-1.5 text-xs text-gray-400">
          {daysInStatus === 0 ? 'Ma' : `${daysInStatus} napja`}
        </div>
      </div>
    </Link>
  )
}
