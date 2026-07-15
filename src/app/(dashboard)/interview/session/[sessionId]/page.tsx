export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { InterviewSessionClient } from '@/components/interview/InterviewSessionClient'

interface Props {
  params: { sessionId: string }
}

export default async function InterviewSessionPage({ params }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: session } = await supabase
    .from('interview_sessions')
    .select('id, company, round_type, pressure_mode, started_at, completed_at, overall_score, debrief')
    .eq('id', params.sessionId)
    .eq('user_id', user.id)
    .single()

  if (!session) redirect('/interview')

  const { data: questionsData } = await supabase
    .from('interview_questions')
    .select('question_text, category, difficulty')
    .eq('session_id', params.sessionId)
    .order('created_at')

  const { data: answersData } = await supabase
    .from('interview_answers')
    .select('id, question_text, answer_text, score, feedback, created_at')
    .eq('session_id', params.sessionId)
    .order('created_at')

  const { data: playbook } = await supabase
    .from('company_playbooks')
    .select('interview_format, what_they_test, insider_tips, user_specific_angle, india_context, comp_context_inr')
    .eq('company', session.company)
    .single()

  return (
    <InterviewSessionClient
      session={session}
      questions={questionsData ?? []}
      answers={answersData ?? []}
      playbook={playbook}
    />
  )
}
