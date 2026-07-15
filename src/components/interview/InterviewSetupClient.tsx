'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, TrendingUp, RefreshCw, Lock, ChevronRight, Zap } from 'lucide-react'
import { INTERVIEW_PERSONAS, type InterviewPersona } from '@/lib/interview'
import { getDifficultyRangeForSession } from '@/lib/interview-questions'
import { shouldRegeneratePlaybook, type CompanyEntry } from '@/lib/company-playbooks'

const ROUND_TYPES = [
  { id: 'product_sense', label: 'Product Sense' },
  { id: 'execution_metrics', label: 'Execution & Metrics' },
  { id: 'behavioral', label: 'Behavioral / Leadership' },
  { id: 'strategy_design', label: 'Strategy & Design' },
  { id: 'full_loop', label: 'Full Loop (mixed)' },
]

const TIER_COLORS: Record<number, string> = {
  1: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
  2: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  3: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
}

const TIER_LABELS: Record<number, string> = {
  1: 'Tier 1',
  2: 'Tier 2 · India',
  3: 'Tier 3',
}

interface Session {
  id: string
  company: string
  round_type: string
  pressure_mode: boolean
  started_at: string
  completed_at: string | null
  overall_score: number | null
}

interface Props {
  companies: readonly CompanyEntry[]
  sessions: Session[]
  playbookFreshness: Record<string, string>
  sessionCountByCompany: Record<string, number>
  pressureModeUnlocked: boolean
  completedUnitCount: number
}

function ScoreRing({ score }: { score: number }) {
  const pct = (score / 10) * 100
  const color = score >= 8 ? '#10b981' : score >= 5 ? '#f59e0b' : '#ef4444'
  const r = 18
  const circ = 2 * Math.PI * r
  return (
    <svg width={44} height={44} className="rotate-[-90deg]">
      <circle cx={22} cy={22} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={4} />
      <circle cx={22} cy={22} r={r} fill="none" stroke={color} strokeWidth={4}
        strokeDasharray={`${(pct / 100) * circ} ${circ}`} strokeLinecap="round" />
      <text x={22} y={22} textAnchor="middle" dominantBaseline="central"
        className="rotate-90" style={{ transform: 'rotate(90deg)', transformOrigin: '22px 22px', fontSize: 11, fill: color, fontWeight: 700 }}>
        {score.toFixed(1)}
      </text>
    </svg>
  )
}

export function InterviewSetupClient({
  companies,
  sessions,
  playbookFreshness,
  sessionCountByCompany,
  pressureModeUnlocked,
  completedUnitCount,
}: Props) {
  const router = useRouter()
  const [selectedCompany, setSelectedCompany] = useState<CompanyEntry | null>(null)
  const [selectedRound, setSelectedRound] = useState<string>('')
  const [selectedPersona, setSelectedPersona] = useState<InterviewPersona | ''>('')
  const [pressureMode, setPressureMode] = useState(false)
  const [starting, setStarting] = useState(false)
  const [refreshing, setRefreshing] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [tier1Open, setTier1Open] = useState(true)
  const [tier2Open, setTier2Open] = useState(false)
  const [tier3Open, setTier3Open] = useState(false)

  const tier1 = companies.filter(c => c.tier === 1)
  const tier2 = companies.filter(c => c.tier === 2)
  const tier3 = companies.filter(c => c.tier === 3)

  async function handleStart() {
    if (!selectedCompany || !selectedRound || !selectedPersona) return
    setStarting(true)
    setError(null)
    try {
      const res = await fetch('/api/interview/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: selectedCompany.company,
          round_type: selectedRound,
          persona: selectedPersona,
          pressure_mode: pressureMode,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      router.push(`/interview/session/${data.session_id}`)
    } catch {
      setError('Failed to start session. Try again.')
    } finally {
      setStarting(false)
    }
  }

  async function handleRefreshPlaybook(company: string) {
    setRefreshing(company)
    await fetch('/api/interview/refresh-playbook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ company }),
    })
    setRefreshing(null)
    router.refresh()
  }

  function CompanyGrid({ items }: { items: readonly CompanyEntry[] }) {
    return (
      <div className="grid grid-cols-3 gap-2">
        {items.map(c => {
          const active = selectedCompany?.company === c.company
          const sessionCount = sessionCountByCompany[c.company] ?? 0
          const diffRange = getDifficultyRangeForSession(sessionCount + 1)
          const playbookAge = playbookFreshness[c.company]
          const stale = shouldRegeneratePlaybook(playbookAge ?? null)

          return (
            <motion.button
              key={c.company}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setSelectedCompany(c)}
              className={`relative p-3 rounded-xl border text-left transition-all ${
                active
                  ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-200'
                  : 'bg-white/3 border-white/8 hover:border-white/15 text-foreground'
              }`}
            >
              <div className="text-sm font-semibold truncate">{c.company}</div>
              <div className="flex items-center gap-1.5 mt-1">
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${TIER_COLORS[c.tier]}`}>
                  {TIER_LABELS[c.tier]}
                </span>
                {sessionCount > 0 && (
                  <span className="text-[10px] text-muted-foreground">{sessionCount} session{sessionCount > 1 ? 's' : ''}</span>
                )}
              </div>
              {sessionCount > 0 && (
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  Difficulty {diffRange.min}–{diffRange.max}
                </div>
              )}
              {stale && (
                <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-amber-400" title="Playbook needs refresh" />
              )}
            </motion.button>
          )
        })}
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
          Interview Prep
        </h1>
        <p className="text-muted-foreground mt-1">
          {sessions.filter(s => s.completed_at).length} sessions completed · Claude plays the interviewer
        </p>
      </div>

      <div className="grid grid-cols-5 gap-8">
        {/* Left: Setup form */}
        <div className="col-span-3 space-y-6">
          {/* Company picker */}
          <div className="rounded-2xl border border-white/8 bg-white/3 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Company</h2>

            {/* Tier 1 */}
            <div>
              <button
                onClick={() => setTier1Open(v => !v)}
                className="flex items-center gap-2 text-xs font-semibold text-violet-400 mb-2 hover:text-violet-300 transition-colors"
              >
                <ChevronRight size={12} className={`transition-transform ${tier1Open ? 'rotate-90' : ''}`} />
                TIER 1: Full playbook + 100+ questions
              </button>
              {tier1Open && <CompanyGrid items={tier1} />}
            </div>

            {/* Tier 2 */}
            <div>
              <button
                onClick={() => setTier2Open(v => !v)}
                className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-2 hover:text-emerald-300 transition-colors"
              >
                <ChevronRight size={12} className={`transition-transform ${tier2Open ? 'rotate-90' : ''}`} />
                TIER 2: India-first + INR context + 60+ questions
              </button>
              {tier2Open && <CompanyGrid items={tier2} />}
            </div>

            {/* Tier 3 */}
            <div>
              <button
                onClick={() => setTier3Open(v => !v)}
                className="flex items-center gap-2 text-xs font-semibold text-blue-400 mb-2 hover:text-blue-300 transition-colors"
              >
                <ChevronRight size={12} className={`transition-transform ${tier3Open ? 'rotate-90' : ''}`} />
                TIER 3: Basic playbook + 30+ questions
              </button>
              {tier3Open && <CompanyGrid items={tier3} />}
            </div>
          </div>

          {/* Round type */}
          <div className="rounded-2xl border border-white/8 bg-white/3 p-5 space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Round Type</h2>
            <div className="grid grid-cols-2 gap-2">
              {ROUND_TYPES.map(r => (
                <motion.button
                  key={r.id}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedRound(r.id)}
                  className={`py-2.5 px-3 rounded-xl border text-sm font-medium text-left transition-all ${
                    selectedRound === r.id
                      ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-200'
                      : 'bg-white/3 border-white/8 hover:border-white/15 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {r.label}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Persona */}
          <div className="rounded-2xl border border-white/8 bg-white/3 p-5 space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Interviewer Persona</h2>
            <div className="grid grid-cols-2 gap-2">
              {INTERVIEW_PERSONAS.map(p => (
                <motion.button
                  key={p}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedPersona(p)}
                  className={`py-2.5 px-3 rounded-xl border text-sm font-medium text-left transition-all ${
                    selectedPersona === p
                      ? 'bg-violet-500/15 border-violet-500/40 text-violet-200'
                      : 'bg-white/3 border-white/8 hover:border-white/15 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {p}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Pressure mode */}
          <div className="rounded-2xl border border-white/8 bg-white/3 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Zap size={18} className={pressureModeUnlocked ? 'text-amber-400' : 'text-muted-foreground'} />
              <div>
                <div className="text-sm font-semibold">Pressure Mode</div>
                <div className="text-xs text-muted-foreground">
                  {pressureModeUnlocked
                    ? 'Claude challenges every answer and pushes back on claims'
                    : `Unlocks at unit 20 (${Math.max(0, 20 - completedUnitCount)} units away)`}
                </div>
              </div>
            </div>
            {pressureModeUnlocked ? (
              <button
                onClick={() => setPressureMode(v => !v)}
                className={`relative w-11 h-6 rounded-full transition-colors ${pressureMode ? 'bg-amber-500' : 'bg-white/10'}`}
              >
                <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${pressureMode ? 'left-6' : 'left-1'}`} />
              </button>
            ) : (
              <Lock size={16} className="text-muted-foreground" />
            )}
          </div>

          {error && (
            <div className="text-red-400 text-sm px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20">
              {error}
            </div>
          )}

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleStart}
            disabled={!selectedCompany || !selectedRound || !selectedPersona || starting}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-semibold text-sm shadow-lg shadow-indigo-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
          >
            {starting ? 'Generating questions…' : 'Start Session →'}
          </motion.button>
        </div>

        {/* Right: Recent sessions + playbook status */}
        <div className="col-span-2 space-y-5">
          {/* Selected company playbook info */}
          <AnimatePresence>
            {selectedCompany && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="rounded-2xl border border-white/8 bg-white/3 p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{selectedCompany.company} Playbook</span>
                  <button
                    onClick={() => handleRefreshPlaybook(selectedCompany.company)}
                    disabled={refreshing === selectedCompany.company}
                    className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw size={11} className={refreshing === selectedCompany.company ? 'animate-spin' : ''} />
                    {refreshing === selectedCompany.company ? 'Updating…' : 'Refresh'}
                  </button>
                </div>
                {playbookFreshness[selectedCompany.company] ? (
                  <p className="text-xs text-muted-foreground">
                    Last updated: {new Date(playbookFreshness[selectedCompany.company]).toLocaleDateString()}
                    {shouldRegeneratePlaybook(playbookFreshness[selectedCompany.company]) && (
                      <span className="text-amber-400 ml-1">· Stale, will auto-refresh on next session</span>
                    )}
                  </p>
                ) : (
                  <p className="text-xs text-amber-400">No playbook yet. Will generate when you start your first session.</p>
                )}
                {selectedCompany.tier === 2 && (
                  <div className="text-xs text-emerald-400">
                    India-specific context + INR comp ranges included
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Recent sessions */}
          <div className="rounded-2xl border border-white/8 bg-white/3 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Clock size={13} />
              Recent Sessions
            </h3>
            {sessions.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">No sessions yet. Start your first one.</p>
            ) : (
              <div className="space-y-2">
                {sessions.slice(0, 8).map(s => (
                  <motion.button
                    key={s.id}
                    whileHover={{ x: 2 }}
                    onClick={() => router.push(`/interview/session/${s.id}`)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl bg-white/3 hover:bg-white/6 border border-white/6 transition-colors text-left"
                  >
                    <div>
                      <div className="text-xs font-semibold">{s.company}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {s.round_type.replace('_', ' ')} · {s.pressure_mode ? '⚡ Pressure' : 'Standard'}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {s.overall_score !== null ? (
                        <ScoreRing score={s.overall_score} />
                      ) : (
                        <span className="text-[10px] text-amber-400">In progress</span>
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </div>

          {/* Stats */}
          {sessions.length > 0 && (
            <div className="rounded-2xl border border-white/8 bg-white/3 p-4 space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <TrendingUp size={13} />
                Progress
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Sessions done', value: sessions.filter(s => s.completed_at).length },
                  { label: 'Companies covered', value: new Set(sessions.map(s => s.company)).size },
                  {
                    label: 'Avg score',
                    value: (() => {
                      const scored = sessions.filter(s => s.overall_score !== null)
                      if (!scored.length) return '–'
                      const avg = scored.reduce((sum, s) => sum + (s.overall_score ?? 0), 0) / scored.length
                      return avg.toFixed(1)
                    })(),
                  },
                  { label: 'Pressure sessions', value: sessions.filter(s => s.pressure_mode && s.completed_at).length },
                ].map(stat => (
                  <div key={stat.label} className="text-center p-2 rounded-xl bg-white/3">
                    <div className="text-lg font-bold text-indigo-300">{stat.value}</div>
                    <div className="text-[10px] text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
