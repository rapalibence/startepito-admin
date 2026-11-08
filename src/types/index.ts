export type Statusz =
  | 'uj'
  | 'kapcsolatfelvetel'
  | 'adatpotlasra_var'
  | 'felmeres_utemezve'
  | 'arazasra_var'
  | 'alv_arra_var'
  | 'ajanlat_keszul'
  | 'jovahagyasra_var'
  | 'ajanlat_kint'
  | 'egyeztetes'
  | 'megrendelve'
  | 'parkoltatva'
  | 'nem_relevans'
  | 'elvesztett'

export type Forras = 'web' | 'telefon' | 'email' | 'ajanlas' | 'fgsz' | 'keretszerzodes'

export type UserRole = 'owner' | 'estimator'

export interface Munka {
  id: string
  munkaszam: string | null
  munkaszam_prefix: 'S' | 'K' | null
  munkaszam_sorszam: number | null
  ugyfel_nev: string
  ugyfel_email: string | null
  ugyfel_telefon: string | null
  ugyfel_cegnev: string | null
  ugyfel_cim: string | null
  forras: Forras
  munka_tipusa: 'S' | 'K' | null
  leiras: string | null
  statusz: Statusz
  statusz_valtozas_at: string
  netto_ar_ft: number | null
  fedezet_pct: number | null
  felmeres_idopont: string | null
  hatarido: string | null
  fgsz_ugyfel: boolean
  parkoltatva_ig: string | null
  parkoltatva_ok: string | null
  elvesztes_ok: string | null
  nem_relevans_ok: string | null
  megjegyzes: string | null
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
}

export interface StatuszAtmenet {
  id: string
  munka_id: string
  regi_statusz: Statusz | null
  uj_statusz: Statusz
  valtoztatot_by: string | null
  megjegyzes: string | null
  created_at: string
}

export interface Beallitas {
  kulcs: string
  ertek: string
  leiras: string | null
  updated_at: string
}

export const STATUSZ_LABELS: Record<Statusz, string> = {
  uj: 'Új',
  kapcsolatfelvetel: 'Kapcsolatfelvétel',
  adatpotlasra_var: 'Adatpótlásra vár',
  felmeres_utemezve: 'Felmérés ütemezve',
  arazasra_var: 'Árazásra vár',
  alv_arra_var: 'Alv. árra vár',
  ajanlat_keszul: 'Ajánlat készül',
  jovahagyasra_var: 'Jóváhagyásra vár',
  ajanlat_kint: 'Ajánlat kint',
  egyeztetes: 'Egyeztetés',
  megrendelve: 'Megrendelve',
  parkoltatva: 'Parkoltatva',
  nem_relevans: 'Nem releváns',
  elvesztett: 'Elvesztett',
}

export const FORRAS_LABELS: Record<Forras, string> = {
  web: 'Web',
  telefon: 'Telefon',
  email: 'Email',
  ajanlas: 'Ajánlás',
  fgsz: 'FGSZ',
  keretszerzodes: 'Keretszerződés',
}

// Kanban columns (main pipeline)
export const KANBAN_STATUSZOK: Statusz[] = [
  'uj',
  'kapcsolatfelvetel',
  'adatpotlasra_var',
  'felmeres_utemezve',
  'arazasra_var',
  'alv_arra_var',
  'ajanlat_keszul',
  'jovahagyasra_var',
  'ajanlat_kint',
  'egyeztetes',
  'megrendelve',
]

// Side filter statuses
export const SIDE_STATUSZOK: Statusz[] = ['parkoltatva', 'nem_relevans', 'elvesztett']

// Allowed transitions per role
export const ALLOWED_TRANSITIONS: Record<Statusz, Statusz[]> = {
  uj: ['kapcsolatfelvetel', 'nem_relevans'],
  kapcsolatfelvetel: ['adatpotlasra_var', 'felmeres_utemezve', 'nem_relevans', 'elvesztett'],
  adatpotlasra_var: ['felmeres_utemezve', 'nem_relevans', 'elvesztett'],
  felmeres_utemezve: ['arazasra_var', 'adatpotlasra_var', 'nem_relevans', 'elvesztett'],
  arazasra_var: ['alv_arra_var', 'ajanlat_keszul', 'nem_relevans', 'elvesztett'],
  alv_arra_var: ['ajanlat_keszul', 'arazasra_var', 'nem_relevans', 'elvesztett'],
  ajanlat_keszul: ['jovahagyasra_var', 'ajanlat_kint', 'nem_relevans', 'elvesztett'],
  jovahagyasra_var: ['ajanlat_kint', 'nem_relevans', 'elvesztett'],
  ajanlat_kint: ['egyeztetes', 'megrendelve', 'elvesztett', 'parkoltatva'],
  egyeztetes: ['megrendelve', 'ajanlat_keszul', 'elvesztett', 'parkoltatva'],
  megrendelve: [],
  parkoltatva: ['kapcsolatfelvetel', 'felmeres_utemezve', 'nem_relevans', 'elvesztett'],
  nem_relevans: [],
  elvesztett: [],
}

// Transitions Anikó (estimator) is allowed to initiate
export const ESTIMATOR_ALLOWED_FROM: Statusz[] = [
  'arazasra_var',
  'alv_arra_var',
  'ajanlat_keszul',
  'egyeztetes',
]
