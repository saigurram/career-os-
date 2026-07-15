'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, ChevronDown, ChevronUp, AlertTriangle, CheckCircle, Clock, Zap, BookOpen, Timer } from 'lucide-react'
import {
  hasContributorLanguage, hasOwnerLanguage, hasImpactNumber, isAnswerTooLong,
  getPersonaTimeLimitSeconds, isPersonaHiddenScorer,
  hasPersonaSilenceIndicator, hasPersonaLpProbe, hasPersonaWarmup,
  type InterviewPersona,
} from '@/lib/interview'
import { DebriefClient } from '@/components/interview/DebriefClient'

interface Question {
  question_text: string
  category: string
  difficulty: number
}

interface Answer {
  id: string
  question_text: string
  answer_text: string
  score: number | null
  feedback: {
    score: number
    what_landed: string
    what_missed: string
    better_version: string
  } | null
  created_at: string
}

interface Playbook {
  interview_format: string
  what_they_test: string
  insider_tips: string
  user_specific_angle: string
  india_context: string | null
  comp_context_inr: string | null
}

interface Session {
  id: string
  company: string
  round_type: string
  pressure_mode: boolean
  started_at: string
  completed_at: string | null
  overall_score: number | null
  debrief: unknown
  persona?: string
}

interface Props {
  session: Session
  questions: Question[]
  answers: Answer[]
  playbook: Playbook | null
}

function RealtimeHints({ text }: { text: string }) {
  const contributor = hasContributorLanguage(text)
  const hasOwner = hasOwnerLanguage(text)
  const hasImpact = hasImpactNumber(text)
  const tooLong = isAnswerTooLong(text)

  if (!text.trim()) return null

  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {contributor.found && (
        <span className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-red-500/15 border border-red-500/25 text-red-300">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
          Contributor language: {contributor.phrases.join(', ')}
        </span>
      )}
      {!contributor.found && hasOwner && (
        <span className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-300">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          Owner framing
        </span>
      )}
      {hasImpact && (
        <span className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-300">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          Impact number present
        </span>
      )}
      {text.length > 80 && !hasImpact && (
        <span className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-amber-500/15 border border-amber-500/25 text-amber-300">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          Add a specific impact number
        </span>
      )}
      {tooLong && (
        <span className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-amber-500/15 border border-amber-500/25 text-amber-300">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          Getting long. Aim for under 250 words.
        </span>
      )}
    </div>
  )
}

function FeedbackPanel({ feedback, inCharacterFlag, collapsed, onToggle }: {
  feedback: Answer['feedback']
  inCharacterFlag: string | null
  collapsed: boolean
  onToggle: () => void
}) {
  if (!feedback && !inCharacterFlag) return null

  const scoreColor = (score: number) =>
    score >= 4 ? 'text-emerald-400' : score >= 3 ? 'text-amber-400' : 'text-red-400'

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="rounded-2xl border border-white/8 bg-white/3 overflow-hidden"
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/3 transition-colors"
      >
        <div className="flex items-center gap-2">
          {feedback && <span className={`text-sm font-bold ${scoreColor(feedback.score)}`}>{feedback.score}/5</span>}
          <span className="text-xs font-semibold text-muted-foreground">Feedback</span>
        </div>
        {collapsed ? <ChevronDown size={14} className="text-muted-foreground" /> : <ChevronUp size={14} className="text-muted-foreground" />}
      </button>

      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              {inCharacterFlag && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-sm text-amber-200 italic">
                  &quot;{inCharacterFlag}&quot;
                </div>
              )}
              {feedback && (
                <>
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 mb-1">
                      <CheckCircle size={11} />
                      What landed
                    </div>
                    <p className="text-sm text-foreground/80">{feedback.what_landed}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-red-400 mb-1">
                      <AlertTriangle size={11} />
                      What missed
                    </div>
                    <p className="text-sm text-foreground/80">{feedback.what_missed}</p>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-violet-400 mb-1">Better version</div>
                    <p className="text-sm text-foreground/80 italic border-l-2 border-violet-500/30 pl-3">{feedback.better_version}</p>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function SilenceIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex gap-3"
    >
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex-shrink-0 flex items-center justify-center text-xs font-bold text-white">
        I
      </div>
      <div className="p-4 rounded-2xl rounded-tl-sm bg-white/5 border border-white/8 flex items-center gap-1.5">
        {[0, 0.15, 0.3].map((delay, i) => (
          <motion.span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60"
            animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
            transition={{ duration: 0.8, repeat: Infinity, delay }}
          />
        ))}
      </div>
    </motion.div>
  )
}

export function InterviewSessionClient({ session, questions, answers: initialAnswers, playbook }: Props) {
  const router = useRouter()

  // Persona-derived constants (computed once)
  const persona = (session.persona ?? 'The Skeptic') as InterviewPersona
  const timeLimit = getPersonaTimeLimitSeconds(persona)
  const hasSilence = hasPersonaSilenceIndicator(persona)
  const hasLpProbe = hasPersonaLpProbe(persona)
  const hasWarmup = hasPersonaWarmup(persona)
  const isHiddenScorer = isPersonaHiddenScorer(persona)
  const isSpeedRound = persona === 'The Speed Round'

  const [answers, setAnswers] = useState<Answer[]>(initialAnswers)
  const [currentQuestion, setCurrentQuestion] = useState<string | null>(
    initialAnswers.length < questions.length ? questions[initialAnswers.length]?.question_text ?? null : null
  )
  const [questionIndex, setQuestionIndex] = useState(initialAnswers.length)
  const [answerText, setAnswerText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [collapsedFeedback, setCollapsedFeedback] = useState<Record<number, boolean>>({})
  const [lastInCharacterFlag, setLastInCharacterFlag] = useState<string | null>(null)
  const [completing, setCompleting] = useState(false)
  const [debrief, setDebrief] = useState<unknown>(session.debrief ?? null)
  const [sessionComplete, setSessionComplete] = useState(!!session.completed_at)
  const [elapsed, setElapsed] = useState(0)
  const [answerElapsed, setAnswerElapsed] = useState(0)
  const [playbookOpen, setPlaybookOpen] = useState(false)
  const [silenceActive, setSilenceActive] = useState(false)
  const [lpProbes, setLpProbes] = useState<Record<number, string>>({})
  const [warmedUp, setWarmedUp] = useState(false)
  const [warmedUpShown, setWarmedUpShown] = useState(false)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const questionStartRef = useRef<number>(Date.now())
  const autoSubmittedRef = useRef(false)
  const answerTextRef = useRef(answerText)

  useEffect(() => { answerTextRef.current = answerText }, [answerText])

  // Session timer
  useEffect(() => {
    if (sessionComplete) return
    const interval = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => clearInterval(interval)
  }, [sessionComplete])

  // Reset per-answer timer when question changes
  useEffect(() => {
    questionStartRef.current = Date.now()
    setAnswerElapsed(0)
    autoSubmittedRef.current = false
  }, [questionIndex])

  // Per-answer elapsed ticker
  useEffect(() => {
    if (!currentQuestion || sessionComplete) return
    const interval = setInterval(() => {
      setAnswerElapsed(Math.floor((Date.now() - questionStartRef.current) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [currentQuestion, sessionComplete])

  // Speed Round auto-submit at time limit
  useEffect(() => {
    if (!isSpeedRound || !timeLimit || !currentQuestion || autoSubmittedRef.current || submitting) return
    if (answerElapsed >= timeLimit) {
      autoSubmittedRef.current = true
      const text = answerTextRef.current.trim() || '[Time expired, no answer submitted]'
      submitAnswerWithText(text)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answerElapsed, isSpeedRound, timeLimit, currentQuestion, submitting])

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  const answerTimeRemaining = timeLimit ? timeLimit - answerElapsed : null
  const timeWarning = answerTimeRemaining !== null && answerTimeRemaining <= 30 && answerTimeRemaining > 0
  const timeExpired = answerTimeRemaining !== null && answerTimeRemaining <= 0

  async function submitAnswerWithText(text: string) {
    if (!currentQuestion || !text.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/interview/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: session.id,
          question_text: currentQuestion,
          answer_text: text,
          persona: session.persona ?? 'The Skeptic',
          question_index: questionIndex,
        }),
      })
      const data = await res.json()
      if (!res.ok) return

      const newAnswer: Answer = {
        id: data.answer_id,
        question_text: currentQuestion,
        answer_text: text,
        score: data.feedback?.score ?? null,
        feedback: data.feedback,
        created_at: new Date().toISOString(),
      }
      setAnswers(prev => [...prev, newAnswer])
      setLastInCharacterFlag(data.in_character_flag)
      setAnswerText('')

      // LP probe (Bar Raiser)
      if (hasLpProbe && data.lp_probe_question) {
        setLpProbes(prev => ({ ...prev, [questionIndex]: data.lp_probe_question }))
      }

      // Warmup detection (Exhausted Senior PM)
      if (hasWarmup && !warmedUp && (data.feedback?.score ?? 0) >= 4) {
        setWarmedUp(true)
      }

      if (data.session_complete) {
        setCurrentQuestion(null)
      } else if (hasSilence && (data.feedback?.score ?? 5) <= 2 && data.next_question) {
        // Skeptic: 3s typing pause before next question appears
        setSilenceActive(true)
        setTimeout(() => {
          setSilenceActive(false)
          setCurrentQuestion(data.next_question)
          setQuestionIndex(data.question_index)
        }, 3000)
      } else {
        setCurrentQuestion(data.next_question)
        setQuestionIndex(data.question_index)
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function submitAnswer() {
    if (!answerText.trim()) return
    await submitAnswerWithText(answerText)
  }

  async function completeSession() {
    setCompleting(true)
    try {
      const res = await fetch('/api/interview/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: session.id }),
      })
      const data = await res.json()
      if (res.ok) {
        setDebrief(data.debrief)
        setSessionComplete(true)

        if (data.should_trigger_pattern_analysis) {
          await fetch('/api/interview/pattern-analysis', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ company: session.company }),
          })
        }
      }
    } finally {
      setCompleting(false)
    }
  }

  if (sessionComplete && debrief) {
    return (
      <DebriefClient
        session={session}
        answers={answers}
        debrief={debrief as Parameters<typeof DebriefClient>[0]['debrief']}
        onBack={() => router.push('/interview')}
      />
    )
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: session.pressure_mode ? 'oklch(0.08 0.025 264)' : undefined }}>
      {/* Main conversation area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <div className="flex items-center gap-3">
            <div>
              <span className="font-semibold">{session.company}</span>
              <span className="text-muted-foreground mx-2">·</span>
              <span className="text-muted-foreground text-sm">{session.round_type.replace('_', ' ')}</span>
            </div>
            {session.pressure_mode && (
              <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/25 text-amber-300">
                <Zap size={10} />
                Pressure Mode
              </span>
            )}
            {session.persona && (
              <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-violet-500/15 border border-violet-500/25 text-violet-300">
                {session.persona}
              </span>
            )}
            {warmedUp && !warmedUpShown && (
              <motion.span
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onAnimationComplete={() => setWarmedUpShown(true)}
                className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-300"
              >
                Interviewer engaged
              </motion.span>
            )}
          </div>
          <div className="flex items-center gap-4">
            {/* Per-answer timer (Speed Round / personas with time limits) */}
            {timeLimit && currentQuestion && (
              <div className={`flex items-center gap-1.5 text-sm font-mono font-semibold transition-colors ${
                timeExpired ? 'text-red-400' : timeWarning ? 'text-amber-400' : 'text-muted-foreground'
              }`}>
                <Timer size={13} className={timeWarning || timeExpired ? 'animate-pulse' : ''} />
                {answerTimeRemaining !== null && answerTimeRemaining > 0
                  ? formatTime(answerTimeRemaining)
                  : '0:00'}
              </div>
            )}
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Clock size={13} />
              {formatTime(elapsed)}
            </div>
            <span className="text-xs text-muted-foreground">
              {answers.length}/{questions.length} answered
            </span>
          </div>
        </div>

        {/* Conversation */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Hidden scorer notice */}
          {isHiddenScorer && answers.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-xl bg-violet-500/8 border border-violet-500/15 text-xs text-violet-300 text-center"
            >
              The Friendly Deceiver appears supportive, but is running a strict internal evaluation you won&apos;t see until the debrief.
            </motion.div>
          )}

          {/* Past Q&A pairs */}
          {answers.map((answer, i) => (
            <div key={answer.id ?? i} className="space-y-3">
              {/* Interviewer question */}
              <div className="flex gap-3">
                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white ${
                  warmedUp && i >= answers.length - 1
                    ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                    : 'bg-gradient-to-br from-indigo-500 to-violet-600'
                }`}>
                  I
                </div>
                <div className="flex-1 p-4 rounded-2xl rounded-tl-sm bg-white/5 border border-white/8">
                  <p className="text-sm text-foreground/90">{answer.question_text}</p>
                </div>
              </div>
              {/* User answer */}
              <div className="flex gap-3 justify-end">
                <div className="flex-1 max-w-[85%] p-4 rounded-2xl rounded-tr-sm bg-indigo-500/10 border border-indigo-500/15">
                  <p className="text-sm text-foreground/90">{answer.answer_text}</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex-shrink-0 flex items-center justify-center text-xs font-bold text-white">
                  S
                </div>
              </div>
              {/* Feedback */}
              {answer.feedback && (
                <FeedbackPanel
                  feedback={answer.feedback}
                  inCharacterFlag={i === answers.length - 1 ? lastInCharacterFlag : null}
                  collapsed={collapsedFeedback[i] ?? false}
                  onToggle={() => setCollapsedFeedback(prev => ({ ...prev, [i]: !prev[i] }))}
                />
              )}
              {/* LP probe (Bar Raiser) */}
              {lpProbes[i] && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex-shrink-0 flex items-center justify-center text-xs font-bold text-white">
                    I
                  </div>
                  <div className="flex-1 p-4 rounded-2xl rounded-tl-sm bg-violet-500/10 border border-violet-500/20">
                    <div className="text-[10px] font-semibold text-violet-400 uppercase tracking-wider mb-1">LP Probe</div>
                    <p className="text-sm text-foreground/90">{lpProbes[i]}</p>
                  </div>
                </motion.div>
              )}
            </div>
          ))}

          {/* Silence indicator (Skeptic after weak answer) */}
          <AnimatePresence>
            {silenceActive && <SilenceIndicator />}
          </AnimatePresence>

          {/* Current question */}
          {currentQuestion && !silenceActive && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3"
            >
              <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white ${
                warmedUp ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : 'bg-gradient-to-br from-indigo-500 to-violet-600'
              }`}>
                I
              </div>
              <div className="flex-1 p-4 rounded-2xl rounded-tl-sm bg-white/5 border border-white/8">
                <p className="text-sm text-foreground/90">{currentQuestion}</p>
              </div>
            </motion.div>
          )}

          {/* Latest in-character flag (when no next question) */}
          {lastInCharacterFlag && !currentQuestion && !silenceActive && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex-shrink-0 flex items-center justify-center text-xs font-bold text-white">
                I
              </div>
              <div className="flex-1 p-4 rounded-2xl rounded-tl-sm bg-amber-500/10 border border-amber-500/20">
                <p className="text-sm text-amber-200 italic">&quot;{lastInCharacterFlag}&quot;</p>
              </div>
            </div>
          )}

          {/* No more questions */}
          {!currentQuestion && !silenceActive && !sessionComplete && (
            <div className="text-center py-6 space-y-3">
              <p className="text-muted-foreground text-sm">All questions answered. Ready to see your debrief?</p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={completeSession}
                disabled={completing}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-semibold text-sm shadow-lg disabled:opacity-50"
              >
                {completing ? 'Generating debrief…' : 'End session & get debrief'}
              </motion.button>
            </div>
          )}
        </div>

        {/* Answer input */}
        {currentQuestion && !silenceActive && (
          <div className={`border-t border-white/8 px-6 py-4 space-y-2 transition-all ${
            timeExpired ? 'opacity-50 pointer-events-none' : ''
          }`}>
            {/* Speed Round countdown bar */}
            {isSpeedRound && timeLimit && (
              <div className="w-full h-1 rounded-full bg-white/8 overflow-hidden mb-3">
                <motion.div
                  className={`h-full rounded-full transition-colors ${
                    timeWarning || timeExpired ? 'bg-red-500' : 'bg-indigo-500'
                  }`}
                  style={{ width: `${Math.max(0, ((timeLimit - answerElapsed) / timeLimit) * 100)}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            )}
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={answerText}
                onChange={e => setAnswerText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && e.metaKey) submitAnswer()
                }}
                rows={4}
                placeholder={isSpeedRound ? `Your answer… (${answerTimeRemaining ?? 0}s remaining, ⌘+Enter to submit)` : 'Your answer… (⌘+Enter to submit)'}
                className={`w-full px-4 py-3 rounded-xl bg-white/5 border text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:bg-white/6 transition-colors resize-none pr-12 ${
                  timeWarning ? 'border-amber-500/40 focus:border-amber-500/60' :
                  timeExpired ? 'border-red-500/40' :
                  'border-white/10 focus:border-indigo-500/50'
                }`}
              />
              <button
                onClick={submitAnswer}
                disabled={submitting || !answerText.trim()}
                className="absolute bottom-3 right-3 p-2 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 disabled:opacity-30 transition-colors"
              >
                <Send size={14} />
              </button>
            </div>
            <RealtimeHints text={answerText} />
          </div>
        )}
      </div>

      {/* Right panel: Playbook */}
      {playbook && (
        <div className="w-72 flex-shrink-0 border-l border-white/8 flex flex-col">
          <button
            onClick={() => setPlaybookOpen(v => !v)}
            className="flex items-center gap-2 px-4 py-4 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors border-b border-white/8"
          >
            <BookOpen size={13} />
            {session.company} Playbook
            {playbookOpen ? <ChevronUp size={11} className="ml-auto" /> : <ChevronDown size={11} className="ml-auto" />}
          </button>
          <AnimatePresence>
            {playbookOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 overflow-y-auto px-4 py-4 space-y-4 text-xs"
              >
                {[
                  { label: 'Interview Format', content: playbook.interview_format },
                  { label: 'What They Test', content: playbook.what_they_test },
                  { label: 'Insider Tips', content: playbook.insider_tips },
                  { label: 'Your Amazon Angle', content: playbook.user_specific_angle },
                  ...(playbook.india_context ? [{ label: 'India Context', content: playbook.india_context }] : []),
                  ...(playbook.comp_context_inr ? [{ label: 'Comp Range (INR)', content: playbook.comp_context_inr }] : []),
                ].map(section => (
                  <div key={section.label}>
                    <div className="text-muted-foreground font-semibold uppercase tracking-wider text-[10px] mb-1">{section.label}</div>
                    <p className="text-foreground/75 leading-relaxed">{section.content}</p>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
