'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BookMarked, Plus, Sparkles, CheckCircle2, AlertTriangle, XCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { GlassCard } from '@/components/dashboard/GlassCard'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { hasBlockedNames, type BlockedNameEntry } from '@/lib/nda'
import type { Tables } from '@/types/database'

interface ReviewResult {
  owner_framing_score: number
  violations: string[]
  rewrite: string
  nda_flags: string[]
}

interface Props {
  stories: Tables<'story_bank'>[]
  blockedNames: BlockedNameEntry[]
  userId: string
}

const AMAZON_LPS = [
  'Customer Obsession', 'Ownership', 'Invent and Simplify', 'Are Right A Lot',
  'Learn and Be Curious', 'Hire and Develop the Best', 'Insist on the Highest Standards',
  'Think Big', 'Bias for Action', 'Frugality', 'Earn Trust', 'Dive Deep',
  'Have Backbone; Disagree and Commit', 'Deliver Results', 'Strive to be Earth\'s Best Employer',
  'Success and Scale Bring Broad Responsibility',
]

const TARGET_COMPANIES = ['Google', 'Uber', 'Microsoft', 'Experian', 'ServiceNow', 'Amazon L7']

const stagger = { animate: { transition: { staggerChildren: 0.06 } } }
const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25 } },
}

function scoreBadgeColor(score: number | null) {
  if (score === null) return 'text-muted-foreground bg-white/5 border-white/10'
  if (score >= 80) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
  if (score >= 60) return 'text-amber-400 bg-amber-500/10 border-amber-500/20'
  return 'text-red-400 bg-red-500/10 border-red-500/20'
}

const emptyForm = {
  title: '', situation: '', what_i_drove: '',
  outcome: '', impact_number: '',
  lps: [] as string[], companies: [] as string[],
}

export default function StoryBankClient({ stories, blockedNames, userId }: Props) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createClient() as any
  const router = useRouter()

  const [localStories, setLocalStories] = useState(stories)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [reviewing, setReviewing] = useState<string | null>(null)
  const [reviews, setReviews] = useState<Record<string, ReviewResult>>({})

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title || !form.situation || !form.what_i_drove || !form.outcome) return
    setSaving(true)

    const { data, error } = await supabase.from('story_bank').insert({
      user_id: userId,
      title: form.title,
      situation: form.situation,
      what_i_drove: form.what_i_drove,
      outcome: form.outcome,
      impact_number: form.impact_number || null,
      lp_map: form.lps.reduce((acc: Record<string, boolean>, lp: string) => ({ ...acc, [lp]: true }), {}),
      company_map: form.companies.reduce((acc: Record<string, boolean>, c: string) => ({ ...acc, [c]: true }), {}),
    }).select().single()

    if (!error && data) {
      setLocalStories(prev => [data, ...prev])
      setShowForm(false)
      setForm(emptyForm)
      router.refresh()
    }
    setSaving(false)
  }

  async function requestReview(story: Tables<'story_bank'>) {
    setReviewing(story.id)
    try {
      const res = await fetch('/api/story-bank/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storyId: story.id }),
      })
      if (res.ok) {
        const review: ReviewResult = await res.json()
        setReviews(prev => ({ ...prev, [story.id]: review }))
        // Update score in local state
        setLocalStories(prev =>
          prev.map(s => s.id === story.id ? { ...s, owner_framing_score: review.owner_framing_score } : s)
        )
        setExpandedId(story.id)
      }
    } finally {
      setReviewing(null)
    }
  }

  function toggleLP(lp: string) {
    setForm(prev => ({
      ...prev,
      lps: prev.lps.includes(lp) ? prev.lps.filter(l => l !== lp) : [...prev.lps, lp],
    }))
  }

  function toggleCompany(company: string) {
    setForm(prev => ({
      ...prev,
      companies: prev.companies.includes(company) ? prev.companies.filter(c => c !== company) : [...prev.companies, company],
    }))
  }

  const ndaWarningStories = localStories.filter(s =>
    hasBlockedNames(`${s.situation} ${s.what_i_drove} ${s.outcome}`, blockedNames)
  )

  return (
    <div className="px-8 py-8 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div {...fadeUp} initial="initial" animate="animate" className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <BookMarked size={22} className="text-indigo-400" />
              <h1 className="text-2xl font-bold text-white">Story Bank</h1>
            </div>
            <p className="text-muted-foreground text-sm">
              Interview-ready stories · Owner framing enforced · NDA checked before any external use
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border bg-gradient-to-r from-indigo-500/20 to-violet-500/20 border-indigo-500/30 text-indigo-300 hover:from-indigo-500/30 hover:to-violet-500/30 transition-all"
          >
            <Plus size={15} />
            Add Story
          </button>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <GlassCard className="text-center py-4">
          <p className="text-3xl font-bold text-white">{localStories.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Total stories</p>
        </GlassCard>
        <GlassCard className="text-center py-4">
          <p className="text-3xl font-bold text-emerald-400">{localStories.filter(s => (s.owner_framing_score ?? 0) >= 80).length}</p>
          <p className="text-xs text-muted-foreground mt-1">Strong framing (80+)</p>
        </GlassCard>
        <GlassCard className={`text-center py-4 ${ndaWarningStories.length > 0 ? 'border-amber-500/20 bg-amber-500/5' : ''}`}>
          <p className={`text-3xl font-bold ${ndaWarningStories.length > 0 ? 'text-amber-400' : 'text-white'}`}>{ndaWarningStories.length}</p>
          <p className="text-xs text-muted-foreground mt-1">NDA check needed</p>
        </GlassCard>
      </div>

      {/* Add form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mb-6"
          >
            <GlassCard className="border-indigo-500/20">
              <h2 className="text-sm font-semibold text-white mb-4">Add a story</h2>
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Story title *</label>
                  <input
                    value={form.title}
                    onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                    placeholder="Real-time routing platform, cut costs by ₹12Cr"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-muted-foreground/40 focus:outline-none focus:border-indigo-500/40"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Situation * <span className="opacity-50">(context, what was the problem)</span></label>
                  <textarea
                    value={form.situation}
                    onChange={e => setForm(p => ({ ...p, situation: e.target.value }))}
                    rows={2}
                    placeholder="Amazon Transportation was losing ₹20Cr/year to inefficient last-mile routing decisions made without real-time data..."
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-muted-foreground/40 focus:outline-none focus:border-indigo-500/40 resize-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">What I drove * <span className="opacity-50">(your actions, use owner language: led/drove/built/owned)</span></label>
                  <textarea
                    value={form.what_i_drove}
                    onChange={e => setForm(p => ({ ...p, what_i_drove: e.target.value }))}
                    rows={3}
                    placeholder="I defined the product vision, drove alignment with 3 engineering teams, and built the prioritization framework that sequenced the roadmap..."
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-muted-foreground/40 focus:outline-none focus:border-indigo-500/40 resize-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Outcome * <span className="opacity-50">(what changed, what you delivered)</span></label>
                  <textarea
                    value={form.outcome}
                    onChange={e => setForm(p => ({ ...p, outcome: e.target.value }))}
                    rows={2}
                    placeholder="Launched in 3 markets, reduced routing cost by 18% in Q1, adopted by 83 sort centers within 6 months..."
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-muted-foreground/40 focus:outline-none focus:border-indigo-500/40 resize-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Impact number <span className="opacity-50">(optional: ₹ saved, % improved, X users, etc.)</span></label>
                  <input
                    value={form.impact_number}
                    onChange={e => setForm(p => ({ ...p, impact_number: e.target.value }))}
                    placeholder="₹12Cr annual savings, 18% cost reduction"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-muted-foreground/40 focus:outline-none focus:border-indigo-500/40"
                  />
                </div>
                {/* LP map */}
                <div>
                  <label className="text-xs text-muted-foreground mb-2 block">Amazon LPs demonstrated <span className="opacity-50">(select all that apply)</span></label>
                  <div className="flex flex-wrap gap-1.5">
                    {AMAZON_LPS.map(lp => (
                      <button
                        key={lp}
                        type="button"
                        onClick={() => toggleLP(lp)}
                        className={`px-2.5 py-1 rounded-lg text-xs border transition-all ${
                          form.lps.includes(lp)
                            ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-300'
                            : 'bg-white/3 border-white/10 text-muted-foreground hover:border-white/20'
                        }`}
                      >
                        {lp}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Company map */}
                <div>
                  <label className="text-xs text-muted-foreground mb-2 block">Relevant for companies</label>
                  <div className="flex flex-wrap gap-1.5">
                    {TARGET_COMPANIES.map(company => (
                      <button
                        key={company}
                        type="button"
                        onClick={() => toggleCompany(company)}
                        className={`px-2.5 py-1 rounded-lg text-xs border transition-all ${
                          form.companies.includes(company)
                            ? 'bg-violet-500/20 border-violet-500/30 text-violet-300'
                            : 'bg-white/3 border-white/10 text-muted-foreground hover:border-white/20'
                        }`}
                      >
                        {company}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {saving ? 'Saving…' : 'Save story'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowForm(false); setForm(emptyForm) }}
                    className="px-4 py-2 rounded-lg bg-white/5 text-muted-foreground text-sm hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stories list */}
      {localStories.length === 0 ? (
        <GlassCard className="text-center py-16">
          <BookMarked size={40} className="mx-auto text-muted-foreground/20 mb-3" />
          <p className="text-muted-foreground">No stories yet</p>
          <p className="text-sm text-muted-foreground/60 mt-1">Add your first story to get owner framing review from Claude</p>
        </GlassCard>
      ) : (
        <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-4">
          {localStories.map(story => {
            const ndaFlag = hasBlockedNames(`${story.situation} ${story.what_i_drove} ${story.outcome}`, blockedNames)
            const review = reviews[story.id]
            const lps = story.lp_map && typeof story.lp_map === 'object'
              ? Object.keys(story.lp_map as Record<string, boolean>).filter(k => (story.lp_map as Record<string, boolean>)[k])
              : []
            const companies = story.company_map && typeof story.company_map === 'object'
              ? Object.keys(story.company_map as Record<string, boolean>).filter(k => (story.company_map as Record<string, boolean>)[k])
              : []

            return (
              <motion.div key={story.id} variants={fadeUp}>
                <GlassCard className={`${ndaFlag ? 'border-amber-500/20' : ''}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="text-sm font-semibold text-white">{story.title}</h3>
                        {ndaFlag && (
                          <Badge className="text-xs border text-amber-300 bg-amber-500/10 border-amber-500/20">
                            NDA check needed
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{story.outcome}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {story.impact_number && (
                          <Badge className="text-xs bg-emerald-500/10 border-emerald-500/20 text-emerald-400">
                            {story.impact_number}
                          </Badge>
                        )}
                        {lps.slice(0, 3).map(lp => (
                          <Badge key={lp} className="text-xs bg-indigo-500/10 border-indigo-500/20 text-indigo-300">{lp}</Badge>
                        ))}
                        {companies.map(c => (
                          <Badge key={c} className="text-xs bg-violet-500/10 border-violet-500/20 text-violet-300">{c}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {story.owner_framing_score !== null && (
                        <Badge className={`text-xs border ${scoreBadgeColor(story.owner_framing_score)}`}>
                          {story.owner_framing_score}/100
                        </Badge>
                      )}
                      <button
                        onClick={() => requestReview(story)}
                        disabled={reviewing === story.id}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                          reviewing === story.id
                            ? 'bg-white/5 border-white/10 text-muted-foreground cursor-not-allowed'
                            : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300 hover:bg-indigo-500/20 cursor-pointer'
                        }`}
                      >
                        <Sparkles size={11} className={reviewing === story.id ? 'animate-pulse' : ''} />
                        {reviewing === story.id ? 'Reviewing…' : story.owner_framing_score !== null ? 'Re-review' : 'Request Review'}
                      </button>
                      <button
                        onClick={() => setExpandedId(p => p === story.id ? null : story.id)}
                        className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-muted-foreground hover:text-white transition-colors"
                      >
                        {expandedId === story.id ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      </button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {expandedId === story.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-4 pt-4 border-t border-white/8 space-y-4">
                          {/* Story details */}
                          <div className="space-y-3">
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Situation</p>
                              <p className="text-xs text-white/80">{story.situation}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">What I drove</p>
                              <p className="text-xs text-white/80">{story.what_i_drove}</p>
                            </div>
                          </div>

                          {/* Claude review */}
                          {review && (
                            <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4 space-y-3">
                              <div className="flex items-center justify-between">
                                <p className="text-xs font-medium text-white">Claude review</p>
                                <Badge className={`text-xs border ${scoreBadgeColor(review.owner_framing_score)}`}>
                                  {review.owner_framing_score}/100 framing score
                                </Badge>
                              </div>
                              {review.violations.length > 0 && (
                                <div>
                                  <p className="text-xs text-red-400 mb-1.5 flex items-center gap-1">
                                    <XCircle size={11} /> Violations ({review.violations.length})
                                  </p>
                                  <ul className="space-y-1">
                                    {review.violations.map((v, i) => (
                                      <li key={i} className="text-xs text-red-300/80">• {v}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              {review.nda_flags.length > 0 && (
                                <div>
                                  <p className="text-xs text-amber-400 mb-1.5 flex items-center gap-1">
                                    <AlertTriangle size={11} /> NDA flags
                                  </p>
                                  <ul className="space-y-1">
                                    {review.nda_flags.map((f, i) => (
                                      <li key={i} className="text-xs text-amber-300/80">• {f}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              {review.violations.length === 0 && review.nda_flags.length === 0 && (
                                <p className="text-xs text-emerald-400 flex items-center gap-1">
                                  <CheckCircle2 size={11} /> Clean owner framing · NDA safe
                                </p>
                              )}
                              {review.rewrite && (
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1.5">Suggested rewrite</p>
                                  <div className="bg-white/3 rounded-lg px-3 py-2 border border-white/8">
                                    <p className="text-xs text-white/80 whitespace-pre-wrap">{review.rewrite}</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </GlassCard>
              </motion.div>
            )
          })}
        </motion.div>
      )}
    </div>
  )
}
