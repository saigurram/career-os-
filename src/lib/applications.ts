// Pure functions for application tracker logic. All side-effect free and testable.

export const APPLICATION_STAGES = [
  'spotted',
  'interested',
  'applied',
  'recruiter_screen',
  'hm_round',
  'loop',
  'offer',
  'negotiating',
  'closed',
] as const

export type ApplicationStage = typeof APPLICATION_STAGES[number]

export const STAGE_LABELS: Record<ApplicationStage, string> = {
  spotted: 'Spotted',
  interested: 'Interested',
  applied: 'Applied',
  recruiter_screen: 'Recruiter Screen',
  hm_round: 'HM Round',
  loop: 'Loop',
  offer: 'Offer',
  negotiating: 'Negotiating',
  closed: 'Closed',
}

export const STAGE_COLORS: Record<ApplicationStage, string> = {
  spotted: 'text-muted-foreground border-white/10 bg-white/3',
  interested: 'text-blue-300 border-blue-500/20 bg-blue-500/5',
  applied: 'text-indigo-300 border-indigo-500/20 bg-indigo-500/5',
  recruiter_screen: 'text-violet-300 border-violet-500/20 bg-violet-500/5',
  hm_round: 'text-purple-300 border-purple-500/20 bg-purple-500/5',
  loop: 'text-amber-300 border-amber-500/20 bg-amber-500/5',
  offer: 'text-emerald-300 border-emerald-500/20 bg-emerald-500/5',
  negotiating: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
  closed: 'text-muted-foreground border-white/5 bg-white/2',
}

export function getStageIndex(stage: ApplicationStage): number {
  return APPLICATION_STAGES.indexOf(stage)
}

export function getNextStage(stage: ApplicationStage): ApplicationStage | null {
  const idx = getStageIndex(stage)
  if (idx === -1 || idx >= APPLICATION_STAGES.length - 1) return null
  return APPLICATION_STAGES[idx + 1]
}

export function getPrevStage(stage: ApplicationStage): ApplicationStage | null {
  const idx = getStageIndex(stage)
  if (idx <= 0) return null
  return APPLICATION_STAGES[idx - 1]
}

export function getDaysInStage(appliedAt: string | null, today: Date = new Date()): number {
  if (!appliedAt) return 0
  const ms = today.getTime() - new Date(appliedAt).getTime()
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)))
}

export function shouldShowFollowUpNudge(
  status: ApplicationStage,
  appliedAt: string | null,
  today: Date = new Date()
): boolean {
  if (status !== 'applied') return false
  return getDaysInStage(appliedAt, today) >= 7
}

export function shouldShowMockNudge(
  status: ApplicationStage,
  nextActionDue: string | null,
  today: Date = new Date()
): boolean {
  if (!['hm_round', 'loop'].includes(status)) return false
  if (!nextActionDue) return false
  const due = new Date(nextActionDue)
  const daysUntil = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  return daysUntil >= 0 && daysUntil <= 3
}

export function getNextActionSuggestion(stage: ApplicationStage): string {
  const suggestions: Record<ApplicationStage, string> = {
    spotted: 'Research the company and role',
    interested: 'Tailor your resume and prepare outreach',
    applied: 'Send a follow-up email in 7 days if no response',
    recruiter_screen: 'Prepare 2-min elevator pitch and comp expectations',
    hm_round: 'Run a mock interview session before the call',
    loop: 'Run a full mock loop with pressure mode',
    offer: 'Open negotiation coach and prepare counter offer',
    negotiating: 'Send counter email within 48 hours',
    closed: 'Update story bank with learnings from this process',
  }
  return suggestions[stage]
}

export function fitScoreBadgeClass(score: number | null): string {
  if (!score) return 'text-muted-foreground bg-white/5 border-white/10'
  if (score >= 80) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
  if (score >= 60) return 'text-amber-400 bg-amber-500/10 border-amber-500/20'
  return 'text-red-400 bg-red-500/10 border-red-500/20'
}

export function isActiveStage(stage: ApplicationStage): boolean {
  return !['closed'].includes(stage)
}
