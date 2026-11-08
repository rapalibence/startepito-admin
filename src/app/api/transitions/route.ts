import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Statusz, UserRole } from '@/types'
import { ALLOWED_TRANSITIONS, ESTIMATOR_ALLOWED_FROM } from '@/types'

async function sendEmail(opts: {
  to: string[]
  subject: string
  html: string
}) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey || apiKey.startsWith('[[')) return

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM ?? 'admin@startepito.hu',
      to: opts.to.filter(Boolean),
      subject: opts.subject,
      html: opts.html,
    }),
  }).catch(() => {})
}

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

  const { munka_id, uj_statusz, megjegyzes, netto_ar_ft, fedezet_pct, parkoltatva_ok, parkoltatva_ig, elvesztes_ok, nem_relevans_ok } = body

  if (!munka_id || !uj_statusz) {
    return NextResponse.json({ error: 'munka_id és uj_statusz kötelező' }, { status: 400 })
  }

  const { data: munka, error: fetchError } = await supabase
    .from('munka')
    .select('*')
    .eq('id', munka_id)
    .single()

  if (fetchError || !munka) {
    return NextResponse.json({ error: 'Lead nem található' }, { status: 404 })
  }

  const userRole: UserRole = (user.user_metadata?.role as UserRole) ?? 'owner'
  const currentStatusz = munka.statusz as Statusz
  const targetStatusz = uj_statusz as Statusz

  const allowed = ALLOWED_TRANSITIONS[currentStatusz] ?? []
  if (!allowed.includes(targetStatusz)) {
    return NextResponse.json({ error: 'Ez az állapotváltozás nem megengedett' }, { status: 422 })
  }

  if (userRole === 'estimator' && !ESTIMATOR_ALLOWED_FROM.includes(currentStatusz)) {
    return NextResponse.json({ error: 'Nincs jogosultsága ehhez az állapotváltozáshoz' }, { status: 403 })
  }

  const updatePayload: Record<string, unknown> = {
    statusz: targetStatusz,
    statusz_valtozas_at: new Date().toISOString(),
    updated_by: user.id,
  }

  if (netto_ar_ft !== undefined) updatePayload.netto_ar_ft = Number(netto_ar_ft)
  if (fedezet_pct !== undefined) updatePayload.fedezet_pct = Number(fedezet_pct)
  if (parkoltatva_ok !== undefined) updatePayload.parkoltatva_ok = parkoltatva_ok
  if (parkoltatva_ig !== undefined) updatePayload.parkoltatva_ig = parkoltatva_ig
  if (elvesztes_ok !== undefined) updatePayload.elvesztes_ok = elvesztes_ok
  if (nem_relevans_ok !== undefined) updatePayload.nem_relevans_ok = nem_relevans_ok

  const { data: updated, error: updateError } = await supabase
    .from('munka')
    .update(updatePayload)
    .eq('id', munka_id)
    .select()
    .single()

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  const recipients = [
    process.env.EMAIL_NOTIFY_FERI,
    process.env.EMAIL_NOTIFY_ANIKO,
  ].filter((e): e is string => !!e && !e.startsWith('[['))

  if (recipients.length > 0) {
    const subject = `[SE Admin] ${munka.ugyfel_nev} → ${targetStatusz}`
    const html = `
      <p><strong>${munka.ugyfel_nev}</strong> (${munka.munkaszam ?? 'munkaszám nélkül'}) állapota megváltozott.</p>
      <p><strong>${currentStatusz}</strong> → <strong>${targetStatusz}</strong></p>
      ${megjegyzes ? `<p>Megjegyzés: ${megjegyzes}</p>` : ''}
      <hr/>
      <p style="font-size:12px;color:#888">SE Admin értesítő</p>
    `
    await sendEmail({ to: recipients, subject, html })
  }

  return NextResponse.json({ data: updated })
}
