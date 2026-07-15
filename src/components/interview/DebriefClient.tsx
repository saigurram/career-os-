'use client'

import { motion } from 'framer-motion'
import { ArrowLeft, TrendingUp, TrendingDown, AlertCircle, CheckCircle, Wrench } from 'lucide-react'

interface DebriefData {
  overall_score: number
  best_answer: {
    question: string
    answer: string
    why: string
  }
  weakest_answer: {
    question: string
    answer: string
    what_was_missing: string
  }
  session_pattern: string
  fixes: string[]
}

interface Session {
  id: string
  company: string
  round_type: string
  pressure_mode: boolean
  persona?: string
}

interface Answer {
  score: number | null
}

interface Props {
  session: Session
  answers: Answer[]
  debrief: DebriefData
  onBack: () => void
}

function ScoreGauge({ score }: { score: number }) {
  const pct = (score / 10) * 100
  const color = score >= 8 ? '#10b981' : score >= 5 ? '#f59e0b' : '#ef4444'
  const grade = score >= 8 ? 'Strong' : score >= 5 ? 'Developing' : 'Needs Work'
  const r = 52
  const circ = 2 * Math.PI * r
  const half = circ / 2

  return (
    <div className="flex flex-col items-center">
      <svg width={140} height={80} viewBox="0 0 140 85">
        <path
          d={`M 14 76 A ${r} ${r} 0 0 1 126 76`}
          fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={10} strokeLinecap="round"
        />
        <path
          d={`M 14 76 A ${r} ${r} 0 0 1 126 76`}
          fill="none" stroke={color} strokeWidth={10} strokeLinecap="round"
          strokeDasharray={`${(pct / 100) * half} ${half}`}
        />
        <text x={70} y={72} textAnchor="middle" style={{ fontSize: 24, fontWeight: 800, fill: color }}>{score.toFixed(1)}</text>
        <text x={70} y={84} textAnchor="middle" style={{ fontSize: 10, fill: '#6b7280' }}>{grade}</text>
      </svg>
      <span className="text-xs text-muted-foreground">Overall Score (out of 10)</span>
    </div>
  )
}

export function DebriefClient({ session, answers, debrief, onBack }: Props) {
  const scoredAnswers = answers.filter(a => a.score !== null)
  const avgScore = scoredAnswers.length
    ? scoredAnswers.reduce((s, a) => s + (a.score ?? 0), 0) / scoredAnswers.length
    : 0

  return (
    <div className="min-h-screen p-8 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <motion.button
          whileHover={{ x: -2 }}
          whileTap={{ scale: 0.97 }}
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={15} />
          Back
        </motion.button>
        <div>
          <h1 className="text-2xl font-bold">Session Debrief</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {session.company} · {session.round_type.replace('_', ' ')}
            {session.pressure_mode && ' · ⚡ Pressure Mode'}
          </p>
        </div>
      </div>

      {/* Friendly Deceiver reveal */}
      {session.persona === 'The Friendly Deceiver' && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-violet-500/25 bg-violet-500/8 p-5 space-y-3"
        >
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-xs font-bold text-white">
              FD
            </div>
            <div>
              <div className="text-sm font-bold text-violet-300">The Friendly Deceiver: Reveal</div>
              <div className="text-xs text-muted-foreground">Behind the supportive tone, here&apos;s what I was actually evaluating</div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 pt-1">
            {[
              { label: 'Owner Language', desc: 'Led/drove/built/owned. Did you claim your work?' },
              { label: 'Impact Numbers', desc: 'Quantified outcomes. Did every story have a metric?' },
              { label: 'Answer Specificity', desc: 'Real situations. Not vague or hypothetical answers.' },
            ].map(item => (
              <div key={item.label} className="p-3 rounded-xl bg-white/4 border border-white/8">
                <div className="text-xs font-semibold text-violet-300 mb-1">{item.label}</div>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground italic">
            The warmth was real, but it was never the standard. The score below reflects the actual bar.
          </p>
        </motion.div>
      )}

      {/* Score + pattern */}
      <div className="grid grid-cols-2 gap-6">
        <div className="rounded-2xl border border-white/8 bg-white/3 p-6 flex flex-col items-center justify-center">
          <ScoreGauge score={debrief.overall_score} />
        </div>
        <div className="rounded-2xl border border-white/8 bg-white/3 p-6 flex flex-col justify-center space-y-2">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Session Pattern</div>
          <p className="text-sm text-foreground leading-relaxed">{debrief.session_pattern}</p>
          <div className="text-xs text-muted-foreground pt-1">
            {scoredAnswers.length} answers · avg score {avgScore.toFixed(1)}/5
          </div>
        </div>
      </div>

      {/* Best + weakest */}
      <div className="grid grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 space-y-3"
        >
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
            <TrendingUp size={13} />
            Best Answer
          </div>
          <div className="text-xs text-muted-foreground font-medium">Q: {debrief.best_answer.question}</div>
          <p className="text-sm text-foreground/80 line-clamp-3 italic border-l-2 border-emerald-500/30 pl-3">
            &quot;{debrief.best_answer.answer}&quot;
          </p>
          <div className="flex items-start gap-1.5 text-xs text-emerald-300">
            <CheckCircle size={12} className="flex-shrink-0 mt-0.5" />
            {debrief.best_answer.why}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5 space-y-3"
        >
          <div className="flex items-center gap-2 text-red-400 text-xs font-semibold uppercase tracking-wider">
            <TrendingDown size={13} />
            Weakest Answer
          </div>
          <div className="text-xs text-muted-foreground font-medium">Q: {debrief.weakest_answer.question}</div>
          <p className="text-sm text-foreground/80 line-clamp-3 italic border-l-2 border-red-500/30 pl-3">
            &quot;{debrief.weakest_answer.answer}&quot;
          </p>
          <div className="flex items-start gap-1.5 text-xs text-red-300">
            <AlertCircle size={12} className="flex-shrink-0 mt-0.5" />
            {debrief.weakest_answer.what_was_missing}
          </div>
        </motion.div>
      </div>

      {/* 3 fixes */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl border border-white/8 bg-white/3 p-6 space-y-4"
      >
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          <Wrench size={13} />
          3 Things to Fix Before the Real Loop
        </div>
        <div className="space-y-3">
          {debrief.fixes.map((fix, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 + i * 0.05 }}
              className="flex items-start gap-3 p-3 rounded-xl bg-white/3 border border-white/6"
            >
              <span className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-white mt-0.5">
                {i + 1}
              </span>
              <p className="text-sm text-foreground/85">{fix}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* CTA */}
      <div className="flex gap-3">
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={onBack}
          className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-sm font-medium hover:bg-white/8 transition-colors"
        >
          Back to Setup
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => window.location.reload()}
          className="flex-1 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-sm font-semibold shadow-lg shadow-indigo-500/20"
        >
          Run Another Session
        </motion.button>
      </div>
    </div>
  )
}
