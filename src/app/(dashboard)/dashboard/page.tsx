export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardClient from '@/components/dashboard/DashboardClient'
import { getPhase } from '@/lib/phase'
import type { Tables } from '@/types/database'
import type { Phase } from '@/lib/phase'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const admin = createAdminClient()

  const [r0, r1, r2, r3, r4, r5, r6, r7, r8, r9] = await Promise.all([
    admin.from('users').select('*').eq('id', user.id).single(),
    admin.from('user_profile').select('*').eq('user_id', user.id).single(),
    admin.from('curriculum_units').select('*').order('unit_number'),
    admin.from('user_unit_progress').select('*').eq('user_id', user.id),
    admin.from('ai_concepts').select('*').order('concept_number'),
    admin.from('user_ai_concept_coverage').select('*').eq('user_id', user.id),
    admin.from('pow_artifacts').select('*').eq('user_id', user.id),
    admin.from('jobs').select('*').eq('is_active', true).order('fetched_at', { ascending: false }).limit(8),
    // Phase 2: applications pipeline summary
    admin.from('applications').select('id, status, company, role, fit_score').eq('user_id', user.id),
    // Phase 2: story bank count
    admin.from('story_bank').select('id').eq('user_id', user.id),
  ])

  const profile = r0.data as Tables<'users'> | null
  const userProfile = r1.data as Tables<'user_profile'> | null
  const units = (r2.data ?? []) as Tables<'curriculum_units'>[]
  const progress = (r3.data ?? []) as Tables<'user_unit_progress'>[]
  const concepts = (r4.data ?? []) as Tables<'ai_concepts'>[]
  const coverage = (r5.data ?? []) as Tables<'user_ai_concept_coverage'>[]
  const artifacts = (r6.data ?? []) as Tables<'pow_artifacts'>[]
  const jobs = (r7.data ?? []) as Tables<'jobs'>[]
  const applications = (r8.data ?? []) as { id: string; status: string; company: string | null; role: string | null; fit_score: number | null }[]
  const storiesCount = (r9.data ?? []).length

  // Resolve current phase
  const currentPhase = getPhase(
    (profile?.phase ?? 'phase1') as Phase,
    profile?.phase_2_start_date ?? null,
  )

  // Write phase2 back to DB if it just triggered
  if (currentPhase === 'phase2' && profile?.phase !== 'phase2') {
    await admin.from('users').update({ phase: 'phase2' }).eq('id', user.id)
  }

  // Streak — distinct calendar days with at least 1 completed task
  const taskDates = (progress ?? []).flatMap(p => {
    const tasks = ['learn_done', 'create_done', 'outreach_done', 'reflect_done'] as const
    return tasks.filter(t => p[t]).map(() => p.completed_at ?? new Date().toISOString())
  })
  const uniqueDays = new Set(taskDates.map(d => d.slice(0, 10)))
  const streak = uniqueDays.size

  const PHASE1_END = new Date('2027-01-15')
  const today = new Date()
  const daysToEnd = Math.ceil((PHASE1_END.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  const totalTasks = 136
  const doneTasks = (progress ?? []).reduce((acc, p) => {
    return acc + [p.learn_done, p.create_done, p.outreach_done, p.reflect_done].filter(Boolean).length
  }, 0)
  const remainingTasks = totalTasks - doneTasks

  const doneUnits = (progress ?? []).filter(p =>
    p.learn_done && p.create_done && p.outreach_done && p.reflect_done
  ).length

  const coveredConcepts = (coverage ?? []).length

  // Phase 1 stats for transition banner
  const phase1Stats = {
    unitsCompleted: doneUnits,
    artifactsPublished: artifacts.filter(a => a.published_at).length,
    storiesBanked: storiesCount,
    outreachContacts: 0, // will be fetched if needed
    aiConceptsCovered: coveredConcepts,
  }

  return (
    <DashboardClient
      phase={currentPhase}
      profile={profile}
      userProfile={userProfile}
      units={units}
      progress={progress}
      concepts={concepts}
      coveredCount={coveredConcepts}
      artifacts={artifacts}
      jobs={jobs}
      applications={applications}
      streak={streak}
      daysToEnd={daysToEnd}
      doneTasks={doneTasks}
      remainingTasks={remainingTasks}
      doneUnits={doneUnits}
      phase1Stats={phase1Stats}
    />
  )
}
