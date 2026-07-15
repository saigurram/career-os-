export type FitSeverity = 'blocking' | 'manageable' | 'minor'
export type FitRecommendation = 'Apply now' | 'Close gap first' | 'Skip'

export interface FitStrength {
  skill: string
  story_suggestion: string
}

export interface FitGap {
  skill: string
  severity: FitSeverity
  action: string
}

export interface FitAnalysis {
  fit_score: number
  strengths: FitStrength[]
  gaps: FitGap[]
  recommendation: FitRecommendation
  resume_note: string
}

export function parseFitAnalysis(raw: unknown): FitAnalysis | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  const fit_score = typeof r.fit_score === 'number' ? r.fit_score : 0
  const strengths: FitStrength[] = Array.isArray(r.strengths)
    ? r.strengths.filter(s => s && typeof s.skill === 'string')
    : []
  const gaps: FitGap[] = Array.isArray(r.gaps)
    ? r.gaps.filter(g => g && typeof g.skill === 'string')
    : []
  const recommendation = isValidRecommendation(r.recommendation)
    ? r.recommendation
    : deriveRecommendation(fit_score)
  const resume_note = typeof r.resume_note === 'string' ? r.resume_note : ''
  return { fit_score, strengths, gaps, recommendation, resume_note }
}

function isValidRecommendation(v: unknown): v is FitRecommendation {
  return v === 'Apply now' || v === 'Close gap first' || v === 'Skip'
}

export function deriveRecommendation(fitScore: number): FitRecommendation {
  if (fitScore >= 75) return 'Apply now'
  if (fitScore >= 50) return 'Close gap first'
  return 'Skip'
}

export function severityFromGapSize(gap: number): FitSeverity {
  if (gap >= 3) return 'blocking'
  if (gap >= 1.5) return 'manageable'
  return 'minor'
}

export function fitScoreColor(score: number): string {
  if (score >= 80) return 'emerald'
  if (score >= 60) return 'amber'
  return 'red'
}

export function recommendationColor(rec: FitRecommendation): string {
  if (rec === 'Apply now') return 'emerald'
  if (rec === 'Close gap first') return 'amber'
  return 'red'
}
