import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('applications')
    .select('*, jobs(title, company, source_url, fit_score, fit_analysis)')
    .eq('user_id', user.id)
    .order('applied_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ applications: data ?? [] })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { job_id, status = 'spotted', company, role, fit_score, notes } = body

  if (!job_id) return NextResponse.json({ error: 'job_id is required' }, { status: 400 })

  const admin = createAdminClient()

  // Prevent duplicate applications for the same job
  const { data: existing } = await admin
    .from('applications')
    .select('id, status')
    .eq('user_id', user.id)
    .eq('job_id', job_id)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ application: existing, already_exists: true })
  }

  const { data, error } = await admin
    .from('applications')
    .insert({
      user_id: user.id,
      job_id,
      status,
      company,
      role,
      fit_score,
      notes,
      applied_at: new Date().toISOString(),
    })
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ application: data })
}
