'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  KanbanSquare, ChevronRight, ChevronLeft, AlertCircle, Clock,
  ExternalLink, Trash2, StickyNote, MessageSquare,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/dashboard/GlassCard'
import {
  APPLICATION_STAGES, STAGE_LABELS, STAGE_COLORS,
  getNextStage, getPrevStage, getDaysInStage,
  shouldShowFollowUpNudge, shouldShowMockNudge,
  getNextActionSuggestion, fitScoreBadgeClass,
  type ApplicationStage,
} from '@/lib/applications'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Application {
  id: string
  job_id: string
  status: string
  company: string | null
  role: string | null
  fit_score: number | null
  applied_at: string | null
  next_action: string | null
  next_action_due: string | null
  key_contact: string | null
  notes: string | null
}

interface Props {
  applications: Application[]
}

export default function TrackerClient({ applications: initialApps }: Props) {
  const router = useRouter()
  const [apps, setApps] = useState(initialApps)
  const [editingNotes, setEditingNotes] = useState<string | null>(null)
  const [notesText, setNotesText] = useState('')

  const byStage = APPLICATION_STAGES.reduce<Record<string, Application[]>>((acc, stage) => {
    acc[stage] = apps.filter(a => a.status === stage)
    return acc
  }, {})

  async function moveStage(app: Application, direction: 'next' | 'prev') {
    const current = app.status as ApplicationStage
    const next = direction === 'next' ? getNextStage(current) : getPrevStage(current)
    if (!next) return

    setApps(prev => prev.map(a => a.id === app.id ? { ...a, status: next } : a))

    await fetch(`/api/applications/${app.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    })

    router.refresh()
  }

  async function deleteApp(id: string) {
    setApps(prev => prev.filter(a => a.id !== id))
    await fetch(`/api/applications/${id}`, { method: 'DELETE' })
    router.refresh()
  }

  async function saveNotes(id: string) {
    setApps(prev => prev.map(a => a.id === id ? { ...a, notes: notesText } : a))
    setEditingNotes(null)
    await fetch(`/api/applications/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: notesText }),
    })
  }

  const totalActive = apps.filter(a => a.status !== 'closed').length

  return (
    <div className="px-6 py-8 max-w-full mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Application Tracker</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {totalActive} active · {apps.filter(a => a.status === 'offer' || a.status === 'negotiating').length} offers
          </p>
        </div>
        <Link href="/jobs">
          <Button className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 border-0 text-sm">
            Browse Jobs
          </Button>
        </Link>
      </div>

      {apps.length === 0 ? (
        <GlassCard className="text-center py-16">
          <KanbanSquare size={40} className="mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-white font-medium mb-1">No applications yet</p>
          <p className="text-sm text-muted-foreground mb-4">
            Add jobs from the job feed to start tracking.
          </p>
          <Link href="/jobs">
            <Button className="bg-gradient-to-r from-indigo-600 to-violet-600 border-0">
              Browse Jobs
            </Button>
          </Link>
        </GlassCard>
      ) : (
        /* Kanban board — horizontal scroll */
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {APPLICATION_STAGES.map(stage => {
              const cards = byStage[stage] ?? []
              return (
                <div key={stage} className="w-64 flex-shrink-0">
                  {/* Column header */}
                  <div className="flex items-center justify-between mb-3 px-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white uppercase tracking-wide">
                        {STAGE_LABELS[stage]}
                      </span>
                      {cards.length > 0 && (
                        <Badge className="text-xs bg-white/10 border-white/10 text-muted-foreground h-4 px-1.5">
                          {cards.length}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Cards */}
                  <div className="space-y-3">
                    <AnimatePresence>
                      {cards.map(app => {
                        const followUp = shouldShowFollowUpNudge(stage, app.applied_at)
                        const mockNudge = shouldShowMockNudge(stage, app.next_action_due)
                        const days = getDaysInStage(app.applied_at)
                        const suggestion = getNextActionSuggestion(stage)

                        return (
                          <motion.div
                            key={app.id}
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                          >
                            <div className={`rounded-xl border p-3 ${STAGE_COLORS[stage]}`}>
                              {/* Nudge alerts */}
                              {followUp && (
                                <div className="flex items-center gap-1.5 mb-2 text-xs text-amber-400 bg-amber-500/10 rounded-lg px-2 py-1.5">
                                  <AlertCircle size={11} />
                                  Follow up now — {days} days since applied
                                </div>
                              )}
                              {mockNudge && (
                                <div className="flex items-center gap-1.5 mb-2 text-xs text-violet-400 bg-violet-500/10 rounded-lg px-2 py-1.5">
                                  <Clock size={11} />
                                  Interview soon — run a mock today
                                </div>
                              )}

                              {/* Company + role */}
                              <p className="text-sm font-semibold text-white truncate">
                                {app.company ?? 'Unknown company'}
                              </p>
                              <p className="text-xs text-muted-foreground truncate mb-2">
                                {app.role ?? 'Product Manager'}
                              </p>

                              {/* Fit score + days */}
                              <div className="flex items-center gap-2 mb-3">
                                {app.fit_score != null && (
                                  <Badge className={`text-xs border h-4 px-1.5 ${fitScoreBadgeClass(app.fit_score)}`}>
                                    {app.fit_score}%
                                  </Badge>
                                )}
                                <span className="text-xs text-muted-foreground">{days}d in stage</span>
                              </div>

                              {/* Next action suggestion */}
                              <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                                {suggestion}
                              </p>

                              {/* Notes */}
                              {editingNotes === app.id ? (
                                <div className="mb-3">
                                  <textarea
                                    value={notesText}
                                    onChange={e => setNotesText(e.target.value)}
                                    className="w-full text-xs bg-black/20 border border-white/10 rounded-lg p-2 text-white resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                                    rows={3}
                                    placeholder="Add notes…"
                                    autoFocus
                                  />
                                  <div className="flex gap-1.5 mt-1">
                                    <button onClick={() => saveNotes(app.id)} className="text-xs text-indigo-400 hover:text-indigo-300">Save</button>
                                    <button onClick={() => setEditingNotes(null)} className="text-xs text-muted-foreground hover:text-white">Cancel</button>
                                  </div>
                                </div>
                              ) : app.notes ? (
                                <p
                                  className="text-xs text-muted-foreground mb-3 italic cursor-pointer hover:text-white transition-colors"
                                  onClick={() => { setEditingNotes(app.id); setNotesText(app.notes ?? '') }}
                                >
                                  {app.notes}
                                </p>
                              ) : null}

                              {/* Actions */}
                              <div className="flex items-center justify-between pt-2 border-t border-white/8">
                                <div className="flex items-center gap-1">
                                  {/* Prev stage */}
                                  {getPrevStage(stage) && (
                                    <button
                                      onClick={() => moveStage(app, 'prev')}
                                      className="p-1 rounded hover:bg-white/10 text-muted-foreground hover:text-white transition-colors"
                                      title={`Move to ${STAGE_LABELS[getPrevStage(stage)!]}`}
                                    >
                                      <ChevronLeft size={13} />
                                    </button>
                                  )}
                                  {/* Next stage */}
                                  {getNextStage(stage) && (
                                    <button
                                      onClick={() => moveStage(app, 'next')}
                                      className="p-1 rounded hover:bg-white/10 text-muted-foreground hover:text-white transition-colors"
                                      title={`Move to ${STAGE_LABELS[getNextStage(stage)!]}`}
                                    >
                                      <ChevronRight size={13} />
                                    </button>
                                  )}
                                </div>

                                <div className="flex items-center gap-1">
                                  {/* Notes */}
                                  <button
                                    onClick={() => { setEditingNotes(app.id); setNotesText(app.notes ?? '') }}
                                    className="p-1 rounded hover:bg-white/10 text-muted-foreground hover:text-white transition-colors"
                                    title="Add notes"
                                  >
                                    <StickyNote size={13} />
                                  </button>
                                  {/* Interview prep deep link */}
                                  {app.company && (
                                    <Link href={`/interview?company=${encodeURIComponent(app.company)}`}>
                                      <button className="p-1 rounded hover:bg-white/10 text-muted-foreground hover:text-white transition-colors" title="Interview prep">
                                        <MessageSquare size={13} />
                                      </button>
                                    </Link>
                                  )}
                                  {/* Offer stage: open negotiation coach */}
                                  {(stage === 'offer' || stage === 'negotiating') && (
                                    <Link href={`/negotiate?application_id=${app.id}&company=${encodeURIComponent(app.company ?? '')}&role=${encodeURIComponent(app.role ?? '')}`}>
                                      <button className="p-1 rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors" title="Open Negotiation Coach">
                                        <ExternalLink size={13} />
                                      </button>
                                    </Link>
                                  )}
                                  {/* Delete */}
                                  <button
                                    onClick={() => deleteApp(app.id)}
                                    className="p-1 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
                                    title="Remove"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )
                      })}
                    </AnimatePresence>

                    {/* Empty column placeholder */}
                    {cards.length === 0 && (
                      <div className="rounded-xl border border-dashed border-white/8 p-4 text-center">
                        <p className="text-xs text-muted-foreground/40">Empty</p>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
