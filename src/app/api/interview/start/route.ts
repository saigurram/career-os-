import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import { CAREEROS_RULES } from '@/lib/claude'
import {
  getDifficultyRangeForSession,
  buildQuestionPrompt,
  parseGeneratedQuestion,
  type CompanyTier,
} from '@/lib/interview-questions'
import {
  shouldRegeneratePlaybook,
  buildPlaybookPrompt,
  parseGeneratedPlaybook,
  getCompanyEntry,
} from '@/lib/company-playbooks'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { company, round_type, persona, pressure_mode = false, jd_id } = body

  if (!company || !round_type || !persona) {
    return NextResponse.json({ error: 'company, round_type, and persona are required' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Fetch user profile for skill gaps
  const { data: profile } = await admin
    .from('user_profile')
    .select('skill_scores')
    .eq('user_id', user.id)
    .single()

  const skillScores = (profile?.skill_scores as Record<string, number>) ?? {}

  // Compute skill gaps (target - current, 0 if already at target)
  const TARGETS: Record<string, number> = {
    genai_fluency: 8, platform_thinking: 9, executive_communication: 8,
    stakeholder_influence: 8, data_analytics: 8, domain_depth: 9, external_visibility: 7,
  }
  const skillGaps: Record<string, number> = {}
  for (const [dim, target] of Object.entries(TARGETS)) {
    const current = skillScores[dim] ?? 5
    skillGaps[dim] = Math.max(0, target - current)
  }

  // Count prior sessions with this company (for difficulty progression)
  const { count: priorSessionCount } = await admin
    .from('interview_sessions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('company', company)

  const sessionCount = (priorSessionCount ?? 0) + 1
  const isGauntlet = sessionCount > 30 // Unit 34 trigger handled by caller
  const difficultyRange = getDifficultyRangeForSession(sessionCount, isGauntlet)

  // Get previously asked questions for this company (dedup across all sessions)
  const { data: prevSessions } = await admin
    .from('interview_sessions')
    .select('id')
    .eq('user_id', user.id)
    .eq('company', company)

  const prevSessionIds = (prevSessions ?? []).map(s => s.id)
  let askedQuestions: string[] = []
  if (prevSessionIds.length > 0) {
    const { data: prevQuestions } = await admin
      .from('interview_questions')
      .select('question_text')
      .in('session_id', prevSessionIds)
    askedQuestions = (prevQuestions ?? []).map(q => q.question_text)
  }

  // Fetch optional JD text
  let jdText: string | null = null
  if (jd_id) {
    const { data: job } = await admin.from('jobs').select('jd_text').eq('id', jd_id).single()
    jdText = job?.jd_text ?? null
  }

  // Fetch or generate playbook
  const companyEntry = getCompanyEntry(company)
  const tier = (companyEntry?.tier ?? 1) as CompanyTier

  const { data: existingPlaybook } = await admin
    .from('company_playbooks')
    .select('*')
    .eq('company', company)
    .single()

  if (!existingPlaybook || shouldRegeneratePlaybook(existingPlaybook.generated_at)) {
    // Generate playbook via Claude
    const userBackground = `Senior PM at Amazon (L6, Hyderabad, Transportation Services). Targeting Principal PM roles in Hyderabad by June 2027.`
    const playbookPrompt = buildPlaybookPrompt(company, tier, userBackground)

    try {
      const playbookResponse = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1200,
        system: [{ type: 'text' as const, text: CAREEROS_RULES, cache_control: { type: 'ephemeral' as const } }],
        messages: [{ role: 'user', content: playbookPrompt }],
      })
      const playbookText = playbookResponse.content[0].type === 'text' ? playbookResponse.content[0].text : '{}'
      const parsedPlaybook = parseGeneratedPlaybook(JSON.parse(playbookText))
      if (parsedPlaybook) {
        await admin.from('company_playbooks').upsert({
          company,
          tier,
          interview_format: parsedPlaybook.interview_format,
          what_they_test: parsedPlaybook.what_they_test,
          common_mistakes: parsedPlaybook.common_mistakes,
          insider_tips: parsedPlaybook.insider_tips,
          user_specific_angle: parsedPlaybook.user_specific_angle,
          india_context: parsedPlaybook.india_context ? JSON.stringify(parsedPlaybook.india_context) : null,
          comp_context_inr: parsedPlaybook.comp_context_inr,
          generated_at: new Date().toISOString(),
        }, { onConflict: 'company' })
      }
    } catch {
      // Non-fatal — proceed without playbook regeneration
    }
  }

  // Create the session
  const { data: session, error: sessionError } = await admin
    .from('interview_sessions')
    .insert({
      user_id: user.id,
      company,
      round_type,
      pressure_mode,
      completed_at: null,
      overall_score: null,
      debrief: null,
      pattern_analysis: null,
    })
    .select('id')
    .single()

  if (sessionError || !session) {
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
  }

  // Generate first batch of questions (5 questions)
  const questionPrompt = buildQuestionPrompt({
    company,
    tier,
    roundType: round_type,
    difficultyRange,
    userAnswerHistory: [],
    jdText,
    skillGaps,
    askedQuestions,
    persona,
    count: 5,
  })

  const qResponse = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 800,
    system: [{ type: 'text' as const, text: CAREEROS_RULES, cache_control: { type: 'ephemeral' as const } }],
    messages: [{ role: 'user', content: questionPrompt }],
  })

  const qText = qResponse.content[0].type === 'text' ? qResponse.content[0].text : '[]'
  const rawQuestions = JSON.parse(qText)
  const questions = Array.isArray(rawQuestions)
    ? rawQuestions.map(parseGeneratedQuestion).filter(Boolean)
    : []

  // Save generated questions for future dedup
  if (questions.length > 0) {
    await admin.from('interview_questions').insert(
      questions.map(q => ({
        session_id: session.id,
        company,
        tier,
        category: q!.category,
        question_text: q!.question_text,
        difficulty: q!.difficulty,
        lp_map: q!.lp_map,
        tags: q!.tags,
      }))
    )
  }

  return NextResponse.json({
    session_id: session.id,
    company,
    round_type,
    persona,
    pressure_mode,
    difficulty_range: difficultyRange,
    session_number: sessionCount,
    questions: questions.map(q => ({
      question_text: q!.question_text,
      category: q!.category,
      difficulty: q!.difficulty,
    })),
    first_question: questions[0]?.question_text ?? null,
  })
}
