export const SKILL_DIMENSIONS = [
  { id: 'genai_fluency', label: 'GenAI Fluency', short: 'GenAI' },
  { id: 'platform_thinking', label: 'Platform Thinking', short: 'Platform' },
  { id: 'executive_communication', label: 'Exec Communication', short: 'Exec Comms' },
  { id: 'stakeholder_influence', label: 'Stakeholder Influence', short: 'Influence' },
  { id: 'data_analytics', label: 'Data & Analytics', short: 'Data' },
  { id: 'domain_depth', label: 'Domain Depth', short: 'Domain' },
  { id: 'external_visibility', label: 'External Visibility', short: 'Visibility' },
] as const

export type SkillDimensionId = typeof SKILL_DIMENSIONS[number]['id']

// Principal PM targets per PRD baseline
export const PRINCIPAL_PM_TARGETS: Record<SkillDimensionId, number> = {
  genai_fluency: 8,
  platform_thinking: 9,
  executive_communication: 8,
  stakeholder_influence: 8,
  data_analytics: 8,
  domain_depth: 9,
  external_visibility: 7,
}

export interface GapResult {
  dimension: SkillDimensionId
  label: string
  short: string
  current: number
  target: number
  gap: number
  severity: 'blocking' | 'manageable' | 'minor'
  closureAction: string
}

const CLOSURE_ACTIONS: Record<SkillDimensionId, string> = {
  genai_fluency: 'Complete Tier 1–2 AI concept units and ship one GenAI-powered proof-of-work',
  platform_thinking: 'Write a platform vision doc and map it to a Hyderabad target company problem',
  executive_communication: 'Rewrite 3 impact bullets in owned-outcome framing; do 2 outreach cycles with reviewed messages',
  stakeholder_influence: 'Add 2 cross-org influence stories to story bank with measurable outcomes',
  data_analytics: 'Build one public data-driven case study using real signals from the job feed',
  domain_depth: 'Document platform expertise in a Notion doc or GitHub repo linked from portfolio',
  external_visibility: 'Publish 3 LinkedIn posts from Create tasks; activate portfolio shareable URL',
}

export function computeGaps(
  skillScores: Record<string, number>,
  targets: Record<SkillDimensionId, number> = PRINCIPAL_PM_TARGETS
): GapResult[] {
  return SKILL_DIMENSIONS.map(dim => {
    const current = skillScores[dim.id] ?? 0
    const target = targets[dim.id]
    const gap = Math.max(0, target - current)
    const severity: GapResult['severity'] =
      gap >= 3 ? 'blocking' : gap >= 1.5 ? 'manageable' : 'minor'
    return {
      dimension: dim.id,
      label: dim.label,
      short: dim.short,
      current,
      target,
      gap,
      severity,
      closureAction: CLOSURE_ACTIONS[dim.id],
    }
  })
}

// Weighted readiness: genai + platform + exec_comms are 1.5x weighted
const DIMENSION_WEIGHTS: Record<SkillDimensionId, number> = {
  genai_fluency: 1.5,
  platform_thinking: 1.5,
  executive_communication: 1.5,
  stakeholder_influence: 1.0,
  data_analytics: 1.0,
  domain_depth: 1.0,
  external_visibility: 0.8,
}

export function computeReadinessScore(skillScores: Record<string, number>): number {
  let weightedSum = 0
  let totalWeight = 0
  for (const dim of SKILL_DIMENSIONS) {
    const score = skillScores[dim.id] ?? 0
    const weight = DIMENSION_WEIGHTS[dim.id]
    weightedSum += score * weight
    totalWeight += weight
  }
  const avg = totalWeight > 0 ? weightedSum / totalWeight : 0
  // Scale 0–10 to 0–100
  return Math.round((avg / 10) * 100)
}

export function getTop3Gaps(gaps: GapResult[]): GapResult[] {
  return [...gaps]
    .filter(g => g.gap > 0)
    .sort((a, b) => b.gap - a.gap)
    .slice(0, 3)
}

export interface RadarDataPoint {
  dimension: string
  current: number
  target: number
}

export function buildRadarData(gaps: GapResult[]): RadarDataPoint[] {
  return gaps.map(g => ({
    dimension: g.short,
    current: g.current,
    target: g.target,
  }))
}

export function estimateUnitsToClose(gap: number): number {
  // Roughly 1 unit closes ~0.5 points on the dimension
  return Math.ceil(gap / 0.5)
}
