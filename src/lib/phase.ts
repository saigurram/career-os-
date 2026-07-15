// Pure functions for phase transition logic. All side-effect free and testable.

export type Phase = 'phase1' | 'phase2'

export const PHASE2_START_DATE = new Date('2027-01-15')
export const OFFER_DEADLINE = new Date('2027-06-30')

export function getPhase(
  currentPhase: Phase,
  phase2StartDate: Date | string | null,
  today: Date = new Date()
): Phase {
  if (currentPhase === 'phase2') return 'phase2'
  const startDate = phase2StartDate ? new Date(phase2StartDate) : PHASE2_START_DATE
  return today >= startDate ? 'phase2' : 'phase1'
}

export function daysUntilPhase2(
  phase2StartDate: Date | string | null,
  today: Date = new Date()
): number {
  const startDate = phase2StartDate ? new Date(phase2StartDate) : PHASE2_START_DATE
  const ms = startDate.getTime() - today.getTime()
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)))
}

export function daysUntilDeadline(today: Date = new Date()): number {
  const ms = OFFER_DEADLINE.getTime() - today.getTime()
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)))
}

export function daysInPhase2(
  phase2StartDate: Date | string | null,
  today: Date = new Date()
): number {
  const startDate = phase2StartDate ? new Date(phase2StartDate) : PHASE2_START_DATE
  const ms = today.getTime() - startDate.getTime()
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)))
}

export interface Phase1Stats {
  unitsCompleted: number
  artifactsPublished: number
  storiesBanked: number
  outreachContacts: number
  aiConceptsCovered: number
}

export function getPhase2Label(today: Date = new Date()): string {
  const days = daysUntilDeadline(today)
  if (days > 180) return `${days} days to offer deadline`
  if (days > 90) return `${days} days to June 2027`
  if (days > 30) return `${days} days left — crunch time`
  return `${days} days — final push`
}
