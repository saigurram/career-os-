export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import JobsClient from '@/components/jobs/JobsClient'
import { getPhase } from '@/lib/phase'
import type { Phase } from '@/lib/phase'

export default async function JobsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()

  const [{ data: userRow }, { data: jobs }] = await Promise.all([
    admin.from('users').select('phase, phase_2_start_date').eq('id', user.id).single(),
    admin.from('jobs').select('*').eq('is_active', true).order('fetched_at', { ascending: false }).limit(30),
  ])

  const phase = getPhase(
    (userRow?.phase ?? 'phase1') as Phase,
    userRow?.phase_2_start_date ?? null,
  )

  return <JobsClient jobs={jobs ?? []} phase={phase} />
}
