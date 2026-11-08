import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { ugyfel_nev, ugyfel_email, ugyfel_telefon, ugyfel_cim, ugyfel_cegnev, forras, munka_tipusa, leiras } = body

  if (!ugyfel_nev || typeof ugyfel_nev !== 'string') {
    return NextResponse.json({ error: 'ugyfel_nev kötelező' }, { status: 400 })
  }

  if (!forras) {
    return NextResponse.json({ error: 'forras kötelező' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('munka')
    .insert({
      ugyfel_nev,
      ugyfel_email: ugyfel_email ?? null,
      ugyfel_telefon: ugyfel_telefon ?? null,
      ugyfel_cim: ugyfel_cim ?? null,
      ugyfel_cegnev: ugyfel_cegnev ?? null,
      forras,
      munka_tipusa: munka_tipusa ?? null,
      leiras: leiras ?? null,
      statusz: 'uj',
      created_by: user.id,
      updated_by: user.id,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data }, { status: 201 })
}
