'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HandCoins, Wand2, Copy, Check, AlertCircle, TrendingUp, Shield, Target } from 'lucide-react'
import { GlassCard } from '@/components/dashboard/GlassCard'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCrore, croreToInr, type CompBenchmark, type CounterRange } from '@/lib/negotiation'

interface OfferApp {
  id: string
  company: string | null
  role: string | null
  status: string | null
}

interface Props {
  initialCompany: string
  initialRole: string
  applicationId: string
  offerApplications: OfferApp[]
  benchmarks: CompBenchmark[]
}

interface NegotiateResult {
  counter_email: string
  call_script: string
  key_leverage: string
  red_lines: string
  counter: CounterRange
  benchmark: CompBenchmark | null
}

function InrInput({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div>
      <label className="text-xs text-muted-foreground block mb-1">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">₹</span>
        <input
          type="number"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full bg-black/20 border border-white/10 rounded-xl pl-7 pr-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50 placeholder:text-muted-foreground/40"
          placeholder="0"
          min="0"
        />
      </div>
    </div>
  )
}

export default function NegotiationClient({
  initialCompany,
  initialRole,
  offerApplications,
  benchmarks,
}: Props) {
  const [company, setCompany] = useState(initialCompany)
  const [role, setRole] = useState(initialRole)
  const [baseInr, setBaseInr] = useState('')
  const [bonusInr, setBonusInr] = useState('')
  const [rsuInr, setRsuInr] = useState('')
  const [joiningInr, setJoiningInr] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<NegotiateResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const totalOffer = (Number(baseInr) || 0) + (Number(bonusInr) || 0) + (Number(rsuInr) || 0) + (Number(joiningInr) || 0)

  const matchedBenchmark = benchmarks.find(b =>
    company.toLowerCase().includes(b.company.split(' ')[0].toLowerCase())
  ) ?? null

  async function handleGenerate() {
    if (!company || !role || !baseInr) return
    setError(null)
    setLoading(true)
    setResult(null)

    try {
      const res = await fetch('/api/negotiate/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company,
          role,
          baseInr: Number(baseInr),
          bonusInr: Number(bonusInr) || 0,
          rsuInr: Number(rsuInr) || 0,
          joiningBonusInr: Number(joiningInr) || 0,
        }),
      })
      if (!res.ok) throw new Error('Generation failed')
      const data = await res.json()
      setResult(data)
    } catch {
      setError('Failed to generate strategy. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function copyText(text: string, field: string) {
    await navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const canGenerate = company.trim() && role.trim() && Number(baseInr) > 0

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/20">
            <HandCoins size={20} className="text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Negotiation Coach</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Enter the offer details — CareerOS generates a counter email and call script anchored to market benchmarks.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Input */}
        <div className="lg:col-span-2 space-y-5">
          {/* Quick select from tracker */}
          {offerApplications.length > 0 && (
            <GlassCard className="p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">From Tracker</p>
              <div className="flex flex-wrap gap-2">
                {offerApplications.map(app => (
                  <button
                    key={app.id}
                    onClick={() => {
                      setCompany(app.company ?? '')
                      setRole(app.role ?? '')
                    }}
                    className="text-xs px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-muted-foreground hover:text-white hover:border-white/20 transition-colors"
                  >
                    {app.company} · {app.role}
                  </button>
                ))}
              </div>
            </GlassCard>
          )}

          {/* Company + role */}
          <GlassCard className="p-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Company</label>
                <input
                  value={company}
                  onChange={e => setCompany(e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                  placeholder="e.g. Google India"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Role</label>
                <input
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                  placeholder="e.g. Principal PM"
                />
              </div>
            </div>
          </GlassCard>

          {/* Comp breakdown */}
          <GlassCard className="p-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Offer Breakdown (INR / year)</p>
            <div className="grid grid-cols-2 gap-4">
              <InrInput label="Base salary" value={baseInr} onChange={setBaseInr} />
              <InrInput label="Annual bonus" value={bonusInr} onChange={setBonusInr} />
              <InrInput label="RSU (annualized)" value={rsuInr} onChange={setRsuInr} />
              <InrInput label="Joining bonus (amort.)" value={joiningInr} onChange={setJoiningInr} />
            </div>

            {totalOffer > 0 && (
              <div className="mt-4 pt-4 border-t border-white/8 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total offer</span>
                <span className="text-lg font-bold text-white">{formatCrore(totalOffer)}</span>
              </div>
            )}
          </GlassCard>

          <Button
            onClick={handleGenerate}
            disabled={!canGenerate || loading}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 border-0 h-11 text-sm font-semibold"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                  <Wand2 size={15} />
                </motion.div>
                Generating strategy…
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <TrendingUp size={15} />
                Generate Negotiation Strategy
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
                transition={{ duration: 0.25 }}
                className="space-y-4"
              >
                {/* Counter summary */}
                <GlassCard className="p-5">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Counter Strategy</p>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Low', value: formatCrore(result.counter.lowInr), color: 'text-amber-400' },
                      { label: 'Target', value: formatCrore(result.counter.targetInr), color: 'text-emerald-400' },
                      { label: 'High anchor', value: formatCrore(result.counter.highInr), color: 'text-violet-400' },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="text-center p-3 rounded-xl bg-white/3 border border-white/8">
                        <p className="text-xs text-muted-foreground mb-1">{label}</p>
                        <p className={`text-base font-bold ${color}`}>{value}</p>
                      </div>
                    ))}
                  </div>
                  {result.benchmark && (
                    <div className="mt-3 p-2.5 rounded-lg bg-indigo-500/8 border border-indigo-500/15 text-xs text-indigo-300">
                      Market: {result.benchmark.level} at {result.benchmark.company} = {formatCrore(croreToInr(result.benchmark.minCr))} – {formatCrore(croreToInr(result.benchmark.maxCr))}
                    </div>
                  )}
                </GlassCard>

                {/* Key leverage */}
                <GlassCard className="p-4">
                  <div className="flex items-start gap-2">
                    <Target size={14} className="text-emerald-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Key leverage</p>
                      <p className="text-sm text-white">{result.key_leverage}</p>
                    </div>
                  </div>
                </GlassCard>

                {/* Counter email */}
                <NegotiateSection
                  title="Counter Email"
                  onCopy={() => copyText(result.counter_email, 'email')}
                  copied={copiedField === 'email'}
                >
                  <p className="text-sm text-white leading-relaxed whitespace-pre-wrap">{result.counter_email}</p>
                </NegotiateSection>

                {/* Call script */}
                <NegotiateSection
                  title="Negotiation Call Script"
                  onCopy={() => copyText(result.call_script, 'call')}
                  copied={copiedField === 'call'}
                >
                  <p className="text-sm text-white leading-relaxed whitespace-pre-wrap">{result.call_script}</p>
                </NegotiateSection>

                {/* Red lines — private */}
                <GlassCard className="p-4 border-red-500/20">
                  <div className="flex items-start gap-2">
                    <Shield size={14} className="text-red-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-red-400/80 uppercase tracking-wider mb-1">Red line (private — never reveal aloud)</p>
                      <p className="text-sm text-red-300/80 italic">{result.red_lines}</p>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right: Benchmark panel */}
        <div className="space-y-5">
          {matchedBenchmark && (
            <GlassCard className="p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Market Benchmark</p>
              <p className="text-sm font-semibold text-white mb-0.5">{matchedBenchmark.company}</p>
              <p className="text-xs text-muted-foreground mb-3">{matchedBenchmark.level}</p>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Min</span>
                  <span className="text-white">{formatCrore(croreToInr(matchedBenchmark.minCr))}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Mid</span>
                  <span className="text-emerald-400 font-semibold">
                    {formatCrore(croreToInr((matchedBenchmark.minCr + matchedBenchmark.maxCr) / 2))}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Max</span>
                  <span className="text-white">{formatCrore(croreToInr(matchedBenchmark.maxCr))}</span>
                </div>
              </div>
            </GlassCard>
          )}

          <GlassCard className="p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">All Benchmarks</p>
            <div className="space-y-2">
              {benchmarks.map(b => (
                <div key={b.company} className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs text-white truncate">{b.company.replace(' India', '')}</p>
                    <p className="text-xs text-muted-foreground truncate">{b.level}</p>
                  </div>
                  <Badge className="text-xs border border-white/10 bg-white/5 text-muted-foreground shrink-0">
                    {b.minCr}–{b.maxCr}Cr
                  </Badge>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard className="p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">BATNA</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Continue at Amazon L6 Hyderabad while applying to other Principal PM roles.
              Your walk-away power is real — use it.
            </p>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}

function NegotiateSection({
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
