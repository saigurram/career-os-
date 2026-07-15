export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CurriculumClient from '@/components/curriculum/CurriculumClient'
import type { Tables } from '@/types/database'

export default async function CurriculumPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [r0, r1, r2] = await Promise.all([
    supabase.from('curriculum_units').select('*').order('unit_number'),
    supabase.from('user_unit_progress').select('*').eq('user_id', user.id),
    supabase.from('curriculum_unit_content').select('*'),
  ])

  const units = (r0.data ?? []) as Tables<'curriculum_units'>[]
  const progress = (r1.data ?? []) as Tables<'user_unit_progress'>[]
  const contents = (r2.data ?? []) as Tables<'curriculum_unit_content'>[]

  const PHASE1_END = new Date('2027-01-15')
  const today = new Date()
  const daysToEnd = Math.ceil((PHASE1_END.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  const doneTasks = progress.reduce((acc, p) => {
    return acc + [p.learn_done, p.create_done, p.outreach_done, p.reflect_done].filter(Boolean).length
  }, 0)
  const remainingTasks = 136 - doneTasks

  return (
    <CurriculumClient
      units={units}
      progress={progress}
      contents={contents}
      userId={user.id}
      daysToEnd={daysToEnd}
      doneTasks={doneTasks}
      remainingTasks={remainingTasks}
    />
  )
}
