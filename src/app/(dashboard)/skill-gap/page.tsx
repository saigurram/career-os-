import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SkillGapClient from '@/components/skill-gap/SkillGapClient'
import type { Tables } from '@/types/database'

export const dynamic = 'force-dynamic'

export default async function SkillGapPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [r0, r1, r2, r3] = await Promise.all([
    supabase.from('user_profile').select('*').eq('user_id', user.id).single(),
    supabase.from('jobs').select('id, company, fit_score, fit_analysis').eq('is_active', true).order('fit_score', { ascending: false }).limit(10),
    supabase.from('user_ai_concept_coverage').select('concept_id').eq('user_id', user.id),
    supabase.from('ai_concepts').select('id, concept_number, name, tier').order('concept_number'),
  ])

  const profile = r0.data as Tables<'user_profile'> | null
  const jobs = (r1.data ?? []) as Pick<Tables<'jobs'>, 'id' | 'company' | 'fit_score' | 'fit_analysis'>[]
  const coveredConceptIds = new Set((r2.data ?? []).map(c => c.concept_id))
  const allConcepts = (r3.data ?? []) as Pick<Tables<'ai_concepts'>, 'id' | 'concept_number' | 'name' | 'tier'>[]

  const coveredCount = coveredConceptIds.size
  const uncoveredCount = allConcepts.length - coveredCount

  const skillScores = (profile?.skill_scores ?? {}) as Record<string, number>

  return (
    <SkillGapClient
      skillScores={skillScores}
      jobs={jobs}
      coveredCount={coveredCount}
      uncoveredCount={uncoveredCount}
    />
  )
}
