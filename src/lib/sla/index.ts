import { differenceInDays } from 'date-fns'
import type { Statusz } from '@/types'

export const SLA_LIMITS: Partial<Record<Statusz, number>> = {
  uj: 1,
  kapcsolatfelvetel: 2,
  adatpotlasra_var: 7,
  felmeres_utemezve: 5,
  arazasra_var: 3,
  alv_arra_var: 5,
  ajanlat_keszul: 2,
  jovahagyasra_var: 1,
  ajanlat_kint: 7,
  egyeztetes: 5,
}

export type SlaColor = 'green' | 'yellow' | 'red'

export function getSlaColor(statusz: Statusz, statuszValtozasAt: string): SlaColor {
  const limit = SLA_LIMITS[statusz]
  if (!limit) return 'green'
  const days = differenceInDays(new Date(), new Date(statuszValtozasAt))
  if (days >= limit) return 'red'
  if (days >= limit * 0.7) return 'yellow'
  return 'green'
}

export function getDaysInStatus(statuszValtozasAt: string): number {
  return differenceInDays(new Date(), new Date(statuszValtozasAt))
}
