import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { buildFollowUpNudgeHtml, buildApplicationReminderHtml } from '@/lib/email'

const RESEND_API_KEY = process.env.RESEND_API_KEY!
const FROM_EMAIL = 'CareerOS <reminders@careeros.vercel.app>'

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
    })
    return res.ok
  } catch {
    return false
  }
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const today = new Date()
  const sent: string[] = []
  const errors: string[] = []

  // 1. Follow-up nudges: applied 7+ days ago, no response (still in 'applied' status)
  const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const { data: staleApps } = await admin
    .from('applications')
    .select('id, user_id, company, role, applied_at')
    .eq('status', 'applied')
    .lt('applied_at', sevenDaysAgo)

  for (const app of staleApps ?? []) {
    const { data: userRow } = await admin.from('users').select('email, name').eq('id', app.user_id).single()
    if (!userRow?.email) continue

    const daysAgo = Math.floor((today.getTime() - new Date(app.applied_at).getTime()) / 86400000)
    const appUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://careeros.vercel.app'}/tracker`

    const html = buildFollowUpNudgeHtml({
      userName: userRow.name ?? 'there',
      company: app.company ?? 'the company',
      role: app.role ?? 'Product Manager',
      daysAgo,
      applicationId: app.id,
      appUrl,
    })

    const ok = await sendEmail(userRow.email, `Follow up with ${app.company ?? 'the company'} — ${daysAgo} days since you applied`, html)
    if (ok) sent.push(`follow-up:${app.id}`)
    else errors.push(`follow-up:${app.id}`)
  }

  // 2. Interview reminders: loop or hm_round with next_action_due in 1-3 days
  const in3Days = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString()
  const { data: upcomingInterviews } = await admin
    .from('applications')
    .select('id, user_id, company, role, status, next_action_due')
    .in('status', ['loop', 'hm_round', 'recruiter_screen'])
    .gte('next_action_due', today.toISOString())
    .lte('next_action_due', in3Days)

  for (const app of upcomingInterviews ?? []) {
    const { data: userRow } = await admin.from('users').select('email, name').eq('id', app.user_id).single()
    if (!userRow?.email) continue

    const daysUntil = Math.ceil(
      (new Date(app.next_action_due).getTime() - today.getTime()) / 86400000
    )
    const appUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://careeros.vercel.app'}/tracker`
    const eventType = app.status as 'loop' | 'hm_round' | 'recruiter_screen'

    const html = buildApplicationReminderHtml({
      userName: userRow.name ?? 'there',
      company: app.company ?? 'the company',
      role: app.role ?? 'Product Manager',
      eventType,
      daysUntil,
      appUrl,
    })

    const eventLabels = { loop: 'Interview Loop', hm_round: 'HM Round', recruiter_screen: 'Recruiter Screen' }
    const label = eventLabels[eventType] ?? 'Interview'
    const ok = await sendEmail(userRow.email, `${label} in ${daysUntil} day${daysUntil === 1 ? '' : 's'} — ${app.company}`, html)
    if (ok) sent.push(`reminder:${app.id}`)
    else errors.push(`reminder:${app.id}`)
  }

  return NextResponse.json({
    sent: sent.length,
    emails: sent,
    errors,
    timestamp: today.toISOString(),
  })
}
