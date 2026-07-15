'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, Wand2, Copy, Check, Sparkles, AlertCircle } from 'lucide-react'
import { GlassCard } from '@/components/dashboard/GlassCard'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  RESUME_TRACKS, TRACK_LABELS, TRACK_DESCRIPTIONS, isNdaSafeForResume,
  type ResumeTrack,
} from '@/lib/resume'

interface Story {
  id: string
  title: string | null
  outcome: string | null
  owner_framing_score: number | null
}

interface Application {
  id: string
  company: string | null
  role: string | null
  status: string | null
}

interface ResumeResult {
  track: ResumeTrack
  summary: string
  achievements: string[]
  skills_section: string
  tailoring_note: string
}

interface Props {
  stories: Story[]
  recentApplications: Application[]
}

export default function ResumeClient({ stories, recentApplications }: Props) {
  const [jdText, setJdText] = useState('')
  const [trackOverride, setTrackOverride] = useState<ResumeTrack | ''>('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ResumeResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [ndaWarning, setNdaWarning] = useState(false)

  async function handleGenerate() {
    if (!jdText.trim()) return

    if (!isNdaSafeForResume(jdText)) {
      setNdaWarning(true)
      return
    }
    setNdaWarning(false)
    setError(null)
    setLoading(true)
    setResult(null)

    try {
      const res = await fetch('/api/resume/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jdText, trackOverride: trackOverride || undefined }),
      })
      if (!res.ok) throw new Error('Generation failed')
      const data = await res.json()
      setResult(data)
    } catch {
      setError('Failed to generate resume. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function copyText(text: string, field: string) {
    await navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const trackColor: Record<ResumeTrack, string> = {
    ops_platform: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    ai_data: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
    enterprise_saas: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    base: 'text-muted-foreground bg-white/5 border-white/10',
  }

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/10 border border-indigo-500/20">
            <FileText size={20} className="text-indigo-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Resume Builder</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Paste a job description and CareerOS tailors your resume to the role — NDA-clean, owner-framed, impact-led.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Input */}
        <div className="lg:col-span-2 space-y-5">
          {/* JD input */}
          <GlassCard className="p-5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-3">
              Job Description
            </label>
            <textarea
              value={jdText}
              onChange={e => setJdText(e.target.value)}
              className="w-full h-48 text-sm bg-black/20 border border-white/10 rounded-xl p-3 text-white resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500/50 placeholder:text-muted-foreground/40"
              placeholder="Paste the full job description here…"
            />
            {ndaWarning && (
              <div className="flex items-start gap-2 mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                <AlertCircle size={13} className="mt-0.5 shrink-0" />
                JD contains an NDA-protected internal name. Remove it before generating.
              </div>
            )}
          </GlassCard>

          {/* Track override */}
          <GlassCard className="p-5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-3">
              Resume Track <span className="text-muted-foreground/50 font-normal normal-case">(auto-detected from JD if blank)</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['', ...RESUME_TRACKS] as Array<ResumeTrack | ''>).map(track => (
                <button
                  key={track}
                  onClick={() => setTrackOverride(track)}
                  className={`text-left px-3 py-2.5 rounded-xl border text-xs font-medium transition-all ${
                    trackOverride === track
                      ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                      : 'bg-white/3 border-white/8 text-muted-foreground hover:border-white/20 hover:text-white'
                  }`}
                >
                  {track === '' ? 'Auto-detect' : TRACK_LABELS[track]}
                </button>
              ))}
            </div>
          </GlassCard>

          {/* Generate button */}
          <Button
            onClick={handleGenerate}
            disabled={!jdText.trim() || loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 border-0 h-11 text-sm font-semibold"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                >
                  <Wand2 size={15} />
                </motion.div>
                Tailoring resume…
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Sparkles size={15} />
                Generate Tailored Resume
              </span>
            )}
          </Button>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          {/* Result */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="space-y-4"
              >
                {/* Track badge */}
                <div className="flex items-center gap-2">
                  <Badge className={`text-xs border px-3 py-1 ${trackColor[result.track]}`}>
                    {TRACK_LABELS[result.track]}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{TRACK_DESCRIPTIONS[result.track]}</span>
                </div>

                {/* Summary */}
                <ResultSection
                  title="Professional Summary"
                  onCopy={() => copyText(result.summary, 'summary')}
                  copied={copiedField === 'summary'}
                >
                  <p className="text-sm text-white leading-relaxed">{result.summary}</p>
                </ResultSection>

                {/* Achievements */}
                <ResultSection
                  title="Impact Achievements"
                  onCopy={() => copyText(result.achievements.map(a => `• ${a}`).join('\n'), 'achievements')}
                  copied={copiedField === 'achievements'}
                >
                  <ul className="space-y-2">
                    {result.achievements.map((a, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-white">
                        <span className="text-indigo-400 mt-0.5">•</span>
                        <span className="leading-relaxed">{a}</span>
                      </li>
                    ))}
                  </ul>
                </ResultSection>

                {/* Skills */}
                <ResultSection
                  title="Skills"
                  onCopy={() => copyText(result.skills_section, 'skills')}
                  copied={copiedField === 'skills'}
                >
                  <p className="text-sm text-white leading-relaxed">{result.skills_section}</p>
                </ResultSection>

                {/* Tailoring note */}
                <GlassCard className="p-4">
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1.5">Tailoring note</p>
                  <p className="text-xs text-muted-foreground italic">{result.tailoring_note}</p>
                </GlassCard>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right: Context panel */}
        <div className="space-y-5">
          {/* Story bank preview */}
          <GlassCard className="p-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Story Bank ({stories.length})
            </h3>
            {stories.length === 0 ? (
              <p className="text-xs text-muted-foreground/50">No stories yet. Add them in Story Bank.</p>
            ) : (
              <div className="space-y-2">
                {stories.slice(0, 6).map(story => (
                  <div key={story.id} className="flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground truncate">{story.title}</span>
                    {story.owner_framing_score != null && (
                      <Badge className={`text-xs border h-4 px-1.5 shrink-0 ${
                        story.owner_framing_score >= 80 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
                        story.owner_framing_score >= 60 ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' :
                        'text-red-400 bg-red-500/10 border-red-500/20'
                      }`}>
                        {story.owner_framing_score}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </GlassCard>

          {/* Recent applications for quick JD lookup */}
          {recentApplications.length > 0 && (
            <GlassCard className="p-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Recent Applications
              </h3>
              <div className="space-y-2">
                {recentApplications.slice(0, 8).map(app => (
                  <div key={app.id} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400/60 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-white truncate">{app.company}</p>
                      <p className="text-xs text-muted-foreground truncate">{app.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          {/* Rules reminder */}
          <GlassCard className="p-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Output rules
            </h3>
            <ul className="space-y-1.5">
              {[
                'Owner language: led, drove, built, owned',
                'NDA-clean: no Falcon, Vega, DEFCON, Turbo Merge',
                'Every achievement needs an impact number',
                'No cringe: no "passionate about" or "thought leader"',
              ].map((rule, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                  <span className="text-emerald-400 mt-0.5">✓</span>
                  {rule}
                </li>
              ))}
            </ul>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}

function ResultSection({
  title,
  children,
  onCopy,
  copied,
}: {
  title: string
  children: React.ReactNode
  onCopy: () => void
  copied: boolean
}) {
  return (
    <GlassCard className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</h3>
        <button
          onClick={onCopy}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-white transition-colors"
        >
          {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      {children}
    </GlassCard>
  )
}
