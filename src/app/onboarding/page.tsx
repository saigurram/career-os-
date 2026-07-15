'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { GlassCard } from '@/components/dashboard/GlassCard'
import { ChevronRight, ChevronLeft, CheckCircle2 } from 'lucide-react'

const DIMENSIONS = [
  {
    id: 'genai_fluency',
    label: 'GenAI PM fluency',
    question: 'Describe your experience shipping or building AI-powered products. What have you owned end-to-end?',
    preseeded: 'Built internal AI agents at Amazon (Kiro, Amazon Q integration). Used Claude and OpenAI APIs for personal projects. 90% AI usage at work, 3X productivity gain. No customer-facing AI shipped yet.',
    score: 6,
  },
  {
    id: 'platform_thinking',
    label: 'Platform product thinking',
    question: 'Describe a platform product you owned. What was the platform vision you defined?',
    preseeded: 'Led platform vision for Amazon Transportation Services products. Drove multi-team dependencies, defined APIs consumed by 8+ downstream teams. Owned the roadmap for services handling 500M+ packages annually.',
    score: 8,
  },
  {
    id: 'executive_communication',
    label: 'Executive communication',
    question: 'Share an example of presenting to VP/SVP level. What feedback have you received on your communication style?',
    preseeded: 'Regular VP-level reviews at Amazon. Feedback: strong in my own product context, tendency toward contributor language when presenting on cross-org work ("we helped" vs "I drove"). Working to close this gap.',
    score: 6,
  },
  {
    id: 'stakeholder_influence',
    label: 'Stakeholder influence',
    question: 'Describe a time you influenced a decision you didn\'t have authority over. What was your approach?',
    preseeded: 'Strong within own product scope. Drove adoption of new fulfillment algorithm across 3 partner teams through data-led narrative and executive alignment. Cross-org influence is a growth area beyond my direct portfolio.',
    score: 7,
  },
  {
    id: 'data_analytics',
    label: 'Data & analytics depth',
    question: 'What data systems have you owned or worked closely with? How do you use data to make product decisions?',
    preseeded: 'Real-time data systems for transportation ops, latency-sensitive metrics at scale. Built dashboards tracking 100+ KPIs. SQL fluent, work with data engineers daily. Strong quantitative grounding in all decisions.',
    score: 8,
  },
  {
    id: 'domain_depth',
    label: 'Domain depth (ops/logistics)',
    question: 'What makes you a domain expert in operations and logistics? What do you know that most PMs don\'t?',
    preseeded: 'Amazon Transportation Services for 4+ years. Deep knowledge of sort center operations, last-mile routing, fulfillment algorithms, capacity planning at scale. Know the real constraints: labor, vehicle capacity, time windows. Not just the textbook version.',
    score: 9,
  },
  {
    id: 'external_visibility',
    label: 'External visibility',
    question: 'What is your current public presence? LinkedIn, writing, GitHub, conference talks, awards?',
    preseeded: 'One industry award (Turbo Merge consolidation program, can reference with context). LinkedIn profile exists but minimal original content. No public writing, no conference talks, no GitHub portfolio. This is a major gap to close.',
    score: 4,
  },
]

const BLOCKED_NAMES = [
  { internal_name: 'Falcon', generic_replacement: 'computer vision and edge computing platform for real-time fill rate optimization', safe_for_external: false, notes: 'Internal codename, never use externally' },
  { internal_name: 'Vega', generic_replacement: 'micro-fulfillment platform extending sort center order cutoff and throughput', safe_for_external: false, notes: 'Internal codename, never use externally' },
  { internal_name: 'DEFCON', generic_replacement: 'AR-assisted dual-side package handling automation system', safe_for_external: false, notes: 'Internal codename, never use externally' },
  { internal_name: 'Turbo Merge', generic_replacement: 'container consolidation program', safe_for_external: true, notes: 'Award reference OK; operational details not OK' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0) // 0 = profile, 1–7 = dimensions, 8 = done
  const [name, setName] = useState('Sai')
  const [responses, setResponses] = useState(
    DIMENSIONS.map(d => ({ id: d.id, response: d.preseeded, score: d.score }))
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()
  const totalSteps = DIMENSIONS.length + 2 // profile + 7 dimensions + done

  async function handleComplete() {
    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    // Update user name + profile
    const skillScores = Object.fromEntries(responses.map(r => [r.id, r.score]))
    const genaiScore = responses.find(r => r.id === 'genai_fluency')?.score ?? 0

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any

    const profileRes = await sb.from('users').update({ name }).eq('id', user.id)

    await sb.from('user_profile').upsert({
      user_id: user.id,
      skill_scores: skillScores,
      genai_baseline_score: genaiScore,
      years_experience: 7,
      last_reassessed_at: new Date().toISOString(),
    })

    await sb.from('intake_responses').insert(
      DIMENSIONS.map((d: typeof DIMENSIONS[number], i: number) => ({
        user_id: user.id,
        dimension: d.id,
        question: d.question,
        response: responses[i].response,
        score: responses[i].score,
      }))
    )

    await sb.from('blocked_names').insert(
      BLOCKED_NAMES.map((b: typeof BLOCKED_NAMES[number]) => ({ ...b, user_id: user.id }))
    )

    if (profileRes.error) {
      setError(profileRes.error.message)
      setLoading(false)
      return
    }

    setStep(totalSteps - 1)
    setTimeout(() => router.push('/dashboard'), 1500)
  }

  const dimIndex = step - 1
  const currentDim = DIMENSIONS[dimIndex]

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12" style={{ background: 'oklch(0.10 0.02 264)' }}>
      {/* Progress bar */}
      <div className="w-full max-w-2xl mb-8">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
          <span>Intake assessment</span>
          <span>{Math.min(step, DIMENSIONS.length + 1)} / {DIMENSIONS.length + 1}</span>
        </div>
        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
            animate={{ width: `${(Math.min(step, DIMENSIONS.length + 1) / (DIMENSIONS.length + 1)) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div
            key="profile"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-2xl"
          >
            <GlassCard>
              <h1 className="text-2xl font-bold text-white mb-1">Welcome to CareerOS</h1>
              <p className="text-muted-foreground mb-6">
                A 15-minute intake sets your dynamic baseline. Everything after this is personalized to you.
              </p>
              <div className="space-y-4">
                <div>
                  <Label className="text-zinc-300">Your name</Label>
                  <Input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="mt-1.5 bg-white/5 border-white/10 text-white"
                    placeholder="First name"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Next: 7 dimensions assessed to set your skill baseline. Your responses are pre-seeded, review and adjust as needed.
                </p>
              </div>
              <Button
                onClick={() => setStep(1)}
                className="mt-6 w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 border-0"
              >
                Start assessment <ChevronRight size={16} className="ml-1" />
              </Button>
            </GlassCard>
          </motion.div>
        )}

        {step >= 1 && step <= DIMENSIONS.length && currentDim && (
          <motion.div
            key={`dim-${step}`}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-2xl"
          >
            <GlassCard>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-indigo-400 uppercase tracking-wide">
                  Dimension {step} of {DIMENSIONS.length}
                </span>
              </div>
              <h2 className="text-xl font-bold text-white mb-1">{currentDim.label}</h2>
              <p className="text-sm text-muted-foreground mb-5">{currentDim.question}</p>

              <Textarea
                value={responses[dimIndex].response}
                onChange={e => {
                  const next = [...responses]
                  next[dimIndex] = { ...next[dimIndex], response: e.target.value }
                  setResponses(next)
                }}
                rows={5}
                className="bg-white/5 border-white/10 text-white text-sm resize-none"
              />

              {/* Score slider */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>Self-assessment score</span>
                  <span className="text-indigo-400 font-semibold text-sm">{responses[dimIndex].score}/10</span>
                </div>
                <input
                  type="range" min={1} max={10} step={1}
                  value={responses[dimIndex].score}
                  onChange={e => {
                    const next = [...responses]
                    next[dimIndex] = { ...next[dimIndex], score: Number(e.target.value) }
                    setResponses(next)
                  }}
                  className="w-full accent-indigo-500"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Beginner</span><span>Expert</span>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button variant="ghost" onClick={() => setStep(s => s - 1)} className="text-muted-foreground hover:text-white">
                  <ChevronLeft size={16} className="mr-1" /> Back
                </Button>
                <Button
                  onClick={() => step === DIMENSIONS.length ? handleComplete() : setStep(s => s + 1)}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 border-0"
                >
                  {loading ? 'Saving…' : step === DIMENSIONS.length ? 'Complete assessment' : 'Next'}
                  <ChevronRight size={16} className="ml-1" />
                </Button>
              </div>
              {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
            </GlassCard>
          </motion.div>
        )}

        {step >= totalSteps - 1 && (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl text-center"
          >
            <GlassCard>
              <CheckCircle2 size={48} className="mx-auto text-emerald-400 mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Baseline set</h2>
              <p className="text-muted-foreground">Redirecting to your dashboard…</p>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
