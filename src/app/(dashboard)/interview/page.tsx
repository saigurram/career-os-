export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { InterviewSetupClient } from '@/components/interview/InterviewSetupClient'
import { PLAYBOOK_COMPANIES } from '@/lib/company-playbooks'

export default async function InterviewPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [sessionsResult, playbooksResult, unitResult] = await Promise.all([
    supabase
      .from('interview_sessions')
      .select('id, company, round_type, pressure_mode, started_at, completed_at, overall_score')
      .eq('user_id', user.id)
      .order('started_at', { ascending: false })
      .limit(20),
    supabase
      .from('company_playbooks')
      .select('company, generated_at')
      .order('generated_at', { ascending: false }),
    supabase
      .from('user_unit_progress')
      .select('unit_id')
      .eq('user_id', user.id)
      .not('completed_at', 'is', null),
  ])

  const sessions = sessionsResult.data ?? []
  const playbookFreshness = Object.fromEntries(
    (playbooksResult.data ?? []).map(p => [p.company, p.generated_at])
  )
  const completedUnitCount = unitResult.data?.length ?? 0
  const pressureModeUnlocked = completedUnitCount >= 20

  // Per-company session counts for difficulty display
  const sessionCountByCompany: Record<string, number> = {}
  for (const s of sessions) {
    sessionCountByCompany[s.company] = (sessionCountByCompany[s.company] ?? 0) + 1
  }

  return (
    <div className="p-8">
      <InterviewSetupClient
        companies={PLAYBOOK_COMPANIES}
        sessions={sessions}
        playbookFreshness={playbookFreshness}
        sessionCountByCompany={sessionCountByCompany}
        pressureModeUnlocked={pressureModeUnlocked}
        completedUnitCount={completedUnitCount}
      />
    </div>
  )
}
