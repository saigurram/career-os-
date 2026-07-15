'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Briefcase, MapPin, TrendingUp, ExternalLink, RefreshCw, Sparkles, ChevronDown, ChevronUp, CheckCircle2, AlertTriangle, XCircle, Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { GlassCard } from '@/components/dashboard/GlassCard'
import type { Tables } from '@/types/database'
import type { FitAnalysis } from '@/lib/fit-analyzer'
import { parseFitAnalysis, fitScoreColor } from '@/lib/fit-analyzer'
import { createClient } from '@/lib/supabase/client'
import type { Phase } from '@/lib/phase'

interface Props {
  jobs: Tables<'jobs'>[]
  phase?: Phase
}

function fitBadgeColor(score: number | null) {
  if (!score) return 'text-muted-foreground bg-white/5 border-white/10'
  if (score >= 80) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
  if (score >= 60) return 'text-amber-400 bg-amber-500/10 border-amber-500/20'
  return 'text-red-400 bg-red-500/10 border-red-500/20'
}

function formatComp(inr: number | null) {
  if (!inr) return null
  const cr = inr / 10000000
  if (cr >= 1) return `₹${cr.toFixed(1)}Cr`
  const lakh = inr / 100000
  return `₹${lakh.toFixed(0)}L`
}

function severityIcon(severity: string) {
  if (severity === 'blocking') return <XCircle size={12} className="text-red-400" />
  if (severity === 'manageable') return <AlertTriangle size={12} className="text-amber-400" />
  return <CheckCircle2 size={12} className="text-emerald-400" />
}

function severityColor(s: string) {
  if (s === 'blocking') return 'text-red-300 bg-red-500/8 border-red-500/20'
  if (s === 'manageable') return 'text-amber-300 bg-amber-500/8 border-amber-500/20'
  return 'text-emerald-300 bg-emerald-500/8 border-emerald-500/20'
}

function recColor(rec: string) {
  if (rec === 'Apply now') return 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20'
  if (rec === 'Close gap first') return 'text-amber-300 bg-amber-500/10 border-amber-500/20'
  return 'text-red-300 bg-red-500/10 border-red-500/20'
}

interface JobCardProps {
  job: Tables<'jobs'>
  phase2?: boolean
}

function JobCardRow({ job, phase2 = false }: JobCardProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createClient() as any
  const [analyzing, setAnalyzing] = useState(false)
  const [adding, setAdding] = useState(false)
  const [added, setAdded] = useState(false)
  const [analysis, setAnalysis] = useState<FitAnalysis | null>(
    job.fit_analysis ? parseFitAnalysis(job.fit_analysis) : null
  )
  const [currentFitScore, setCurrentFitScore] = useState<number | null>(job.fit_score)
  const [expanded, setExpanded] = useState(false)

  async function addToTracker() {
    setAdding(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      await supabase.from('applications').insert({
        user_id: user.id,
        job_id: job.id,
        company: job.company,
        role: job.title,
        fit_score: currentFitScore,
        status: 'spotted',
      })
      setAdded(true)
    } finally {
      setAdding(false)
    }
  }

  async function analyzefit() {
    setAnalyzing(true)
    try {
      const res = await fetch(`/api/fit-analysis/${job.id}`, { method: 'POST' })
      if (res.ok) {
        const data: FitAnalysis = await res.json()
        setAnalysis(data)
        setCurrentFitScore(data.fit_score)
        setExpanded(true)
      }
    } finally {
      setAnalyzing(false)
    }
  }

  const colorKey = fitScoreColor(currentFitScore ?? 0)

  return (
    <GlassCard className="hover:border-white/15 transition-all group" data-testid="job-card">
      <div className="flex items-start gap-4">
        {/* Company initial */}
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 flex items-center justify-center flex-shrink-0 border border-white/10">
          <span className="text-sm font-bold text-indigo-300">
            {job.company.charAt(0).toUpperCase()}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-white">{job.title}</h3>
              <p className="text-sm text-muted-foreground">{job.company}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {currentFitScore != null && (
                <Badge className={`text-xs border ${fitBadgeColor(currentFitScore)}`}>
                  {currentFitScore}% fit
                </Badge>
              )}
              {phase2 && (
                <button
                  onClick={addToTracker}
                  disabled={adding || added}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all
                    ${added
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 cursor-default'
                      : adding
                      ? 'bg-white/5 border-white/10 text-muted-foreground cursor-not-allowed'
                      : 'bg-violet-500/10 border-violet-500/20 text-violet-300 hover:bg-violet-500/20 cursor-pointer'
                    }`}
                >
                  <Plus size={11} />
                  {added ? 'Tracked' : adding ? 'Adding…' : 'Track'}
                </button>
              )}
              <button
                onClick={analyzefit}
                disabled={analyzing}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all
                  ${analyzing
                    ? 'bg-white/5 border-white/10 text-muted-foreground cursor-not-allowed'
                    : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300 hover:bg-indigo-500/20 cursor-pointer'
                  }`}
              >
                <Sparkles size={11} className={analyzing ? 'animate-pulse' : ''} />
                {analyzing ? 'Analyzing…' : analysis ? 'Re-analyze' : 'Analyze Fit'}
              </button>
              {analysis && (
                <button
                  onClick={() => setExpanded(e => !e)}
                  className="text-muted-foreground hover:text-white transition-colors"
                >
                  {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                </button>
              )}
              <a
                href={job.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <ExternalLink size={14} className="text-muted-foreground hover:text-white" />
              </a>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin size={11} /> {job.location}
            </span>
            {job.level_estimate && (
              <Badge className="bg-indigo-500/10 border-indigo-500/20 text-indigo-300 text-xs">
                {job.level_estimate}
              </Badge>
            )}
            {job.is_remote && (
              <Badge className="bg-emerald-500/10 border-emerald-500/20 text-emerald-400 text-xs">
                Remote
              </Badge>
            )}
            {job.comp_estimate_inr && (
              <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
                <TrendingUp size={11} /> {formatComp(job.comp_estimate_inr)}
              </span>
            )}
            {job.posted_at && (
              <span className="text-xs text-muted-foreground ml-auto">
                {new Date(job.posted_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </span>
            )}
          </div>

          {job.jd_text && !expanded && (
            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{job.jd_text}</p>
          )}
        </div>
      </div>

      {/* Fit analysis panel */}
      <AnimatePresence>
        {analysis && expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-4 pt-4 border-t border-white/8 space-y-4">
              {/* Score + recommendation */}
              <div className="flex items-center gap-3">
                <div className={`flex items-center justify-center w-12 h-12 rounded-xl border text-${colorKey}-400 bg-${colorKey}-500/10 border-${colorKey}-500/20`}>
                  <span className="text-lg font-bold">{analysis.fit_score}</span>
                </div>
                <div>
                  <Badge className={`text-xs border ${recColor(analysis.recommendation)}`}>
                    {analysis.recommendation}
                  </Badge>
                  {analysis.resume_note && (
                    <p className="text-xs text-muted-foreground mt-1">{analysis.resume_note}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Strengths */}
                <div>
                  <p className="text-xs font-medium text-emerald-400 mb-2">Strengths</p>
                  <div className="space-y-2">
                    {analysis.strengths.map((s, i) => (
                      <div key={i} className="rounded-lg border border-emerald-500/15 bg-emerald-500/5 px-3 py-2">
                        <p className="text-xs font-medium text-white">{s.skill}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{s.story_suggestion}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Gaps */}
                <div>
                  <p className="text-xs font-medium text-red-400 mb-2">Gaps</p>
                  <div className="space-y-2">
                    {analysis.gaps.map((g, i) => (
                      <div key={i} className={`rounded-lg border px-3 py-2 ${severityColor(g.severity)}`}>
                        <div className="flex items-center gap-1.5 mb-0.5">
                          {severityIcon(g.severity)}
                          <p className="text-xs font-medium">{g.skill}</p>
                        </div>
                        <p className="text-xs opacity-80">{g.action}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </GlassCard>
  )
}

export default function JobsClient({ jobs: initialJobs, phase = 'phase1' }: Props) {
  const [filter, setFilter] = useState<'all' | 'remote' | 'hyderabad'>('all')
  const [liveJobs, setLiveJobs] = useState<Tables<'jobs'>[]>(initialJobs)
  const [newJobCount, setNewJobCount] = useState(0)
  const isPhase2 = phase === 'phase2'

  // Phase 2: subscribe to realtime job inserts
  useEffect(() => {
    if (!isPhase2) return
    const supabase = createClient()
    const channel = supabase
      .channel('live-jobs')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'jobs' },
        (payload) => {
          const newJob = payload.new as Tables<'jobs'>
          setLiveJobs(prev => {
            if (prev.some(j => j.id === newJob.id)) return prev
            setNewJobCount(c => c + 1)
            return [newJob, ...prev]
          })
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [isPhase2])

  const jobs = liveJobs

  const filtered = jobs.filter(j => {
    if (filter === 'remote') return j.is_remote
    if (filter === 'hyderabad') return j.location.toLowerCase().includes('hyderabad')
    return true
  })

  const nextMonday = (() => {
    const d = new Date()
    const day = d.getDay()
    const diff = (7 - day + 1) % 7 || 7
    d.setDate(d.getDate() + diff)
    return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })
  })()

  return (
    <div className="px-8 py-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {isPhase2 ? 'Live Job Feed' : 'Weekly Job Digest'}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isPhase2
              ? `Refreshes every 10 minutes · ${filtered.length} active roles · Hyderabad + Remote`
              : `Read-only in Phase 1 · Refreshes every Monday 9am IST · Next: ${nextMonday}`
            }
          </p>
        </div>
        <div className="flex items-center gap-2">
          {newJobCount > 0 && (
            <Badge className="bg-emerald-500/10 border-emerald-500/20 text-emerald-400 text-xs animate-pulse">
              +{newJobCount} new
            </Badge>
          )}
          <Badge className="bg-white/5 border-white/10 text-muted-foreground text-xs">
            {isPhase2
              ? <><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block mr-1.5 animate-pulse" />live</>
              : <><RefreshCw size={11} className="mr-1" />Monday 9am IST</>
            }
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {(['all', 'hyderabad', 'remote'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
              filter === f
                ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-300'
                : 'bg-white/3 border-white/10 text-muted-foreground hover:text-white hover:border-white/20'
            }`}
          >
            {f === 'all' ? 'All' : f === 'hyderabad' ? 'Hyderabad' : 'Remote'}
          </button>
        ))}
        <span className="ml-auto text-sm text-muted-foreground self-center">{filtered.length} roles</span>
      </div>

      {/* Job list */}
      {filtered.length === 0 ? (
        <GlassCard className="text-center py-16">
          <Briefcase size={40} className="mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground mb-1">No jobs yet</p>
          <p className="text-sm text-muted-foreground/60">The cron job fetches roles every Monday 9am IST</p>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {filtered.map((job, i) => (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <JobCardRow job={job} phase2={isPhase2} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
