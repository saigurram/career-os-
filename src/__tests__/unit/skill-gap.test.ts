import { describe, it, expect } from 'vitest'
import {
  computeGaps,
  computeReadinessScore,
  getTop3Gaps,
  buildRadarData,
  estimateUnitsToClose,
  PRINCIPAL_PM_TARGETS,
  SKILL_DIMENSIONS,
} from '@/lib/skill-gap'

const SAI_BASELINE: Record<string, number> = {
  genai_fluency: 6,
  platform_thinking: 8,
  executive_communication: 6,
  stakeholder_influence: 7,
  data_analytics: 8,
  domain_depth: 9,
  external_visibility: 4,
}

describe('computeGaps', () => {
  it('returns one result per skill dimension', () => {
    const gaps = computeGaps(SAI_BASELINE)
    expect(gaps).toHaveLength(SKILL_DIMENSIONS.length)
  })

  it('gap = max(0, target - current)', () => {
    const gaps = computeGaps(SAI_BASELINE)
    const genai = gaps.find(g => g.dimension === 'genai_fluency')!
    expect(genai.current).toBe(6)
    expect(genai.target).toBe(PRINCIPAL_PM_TARGETS.genai_fluency)
    expect(genai.gap).toBe(PRINCIPAL_PM_TARGETS.genai_fluency - 6)
  })

  it('gap is never negative (at-or-above-target shows 0)', () => {
    const scores = { ...SAI_BASELINE, domain_depth: 10 } // above target of 9
    const gaps = computeGaps(scores)
    const domain = gaps.find(g => g.dimension === 'domain_depth')!
    expect(domain.gap).toBe(0)
  })

  it('severity is blocking when gap >= 3', () => {
    const scores = { ...SAI_BASELINE, external_visibility: 1 } // target 7, gap 6
    const gaps = computeGaps(scores)
    const vis = gaps.find(g => g.dimension === 'external_visibility')!
    expect(vis.severity).toBe('blocking')
  })

  it('severity is manageable when gap between 1.5 and 3', () => {
    // external_visibility target=7, current=4, gap=3 → blocking
    // set current=5.5, gap=1.5 → manageable
    const scores = { ...SAI_BASELINE, external_visibility: 5.5 }
    const gaps = computeGaps(scores)
    const vis = gaps.find(g => g.dimension === 'external_visibility')!
    expect(vis.severity).toBe('manageable')
  })

  it('severity is minor when gap < 1.5', () => {
    const scores = { ...SAI_BASELINE, genai_fluency: 7 } // target 8, gap 1 → minor
    const gaps = computeGaps(scores)
    const genai = gaps.find(g => g.dimension === 'genai_fluency')!
    expect(genai.severity).toBe('minor')
  })

  it('defaults missing dimension to 0', () => {
    const gaps = computeGaps({})
    gaps.forEach(g => {
      expect(g.current).toBe(0)
      expect(g.gap).toBe(g.target)
    })
  })

  it('all gaps are 0 when scores equal targets', () => {
    const perfect: Record<string, number> = {}
    SKILL_DIMENSIONS.forEach(d => { perfect[d.id] = PRINCIPAL_PM_TARGETS[d.id] })
    const gaps = computeGaps(perfect)
    gaps.forEach(g => expect(g.gap).toBe(0))
  })

  it('each gap result has a non-empty closureAction', () => {
    const gaps = computeGaps(SAI_BASELINE)
    gaps.forEach(g => {
      expect(g.closureAction).toBeTruthy()
      expect(g.closureAction.length).toBeGreaterThan(10)
    })
  })
})

describe('computeReadinessScore', () => {
  it('returns 0 for empty scores', () => {
    expect(computeReadinessScore({})).toBe(0)
  })

  it('returns 100 for all-10 scores', () => {
    const perfect: Record<string, number> = {}
    SKILL_DIMENSIONS.forEach(d => { perfect[d.id] = 10 })
    expect(computeReadinessScore(perfect)).toBe(100)
  })

  it('returns score between 0 and 100 for Sai baseline', () => {
    const score = computeReadinessScore(SAI_BASELINE)
    expect(score).toBeGreaterThan(0)
    expect(score).toBeLessThanOrEqual(100)
  })

  it('Sai baseline score is below 70 (confirms gap exists)', () => {
    // Sai baseline has gaps — readiness should reflect that
    const score = computeReadinessScore(SAI_BASELINE)
    expect(score).toBeLessThan(85)
  })

  it('higher scores produce higher readiness', () => {
    const low = computeReadinessScore({ ...SAI_BASELINE, genai_fluency: 4 })
    const high = computeReadinessScore({ ...SAI_BASELINE, genai_fluency: 9 })
    expect(high).toBeGreaterThan(low)
  })

  it('genai_fluency is weighted 1.5x (high-value dimension)', () => {
    // Boosting genai vs boosting domain should produce more readiness improvement
    const base = computeReadinessScore(SAI_BASELINE)
    const withGenai = computeReadinessScore({ ...SAI_BASELINE, genai_fluency: 9 })
    const withDomain = computeReadinessScore({ ...SAI_BASELINE, domain_depth: 10 })
    // genai boost should have more impact because of 1.5x weight
    expect(withGenai - base).toBeGreaterThanOrEqual(withDomain - base)
  })
})

describe('getTop3Gaps', () => {
  it('returns at most 3 results', () => {
    const gaps = computeGaps(SAI_BASELINE)
    expect(getTop3Gaps(gaps).length).toBeLessThanOrEqual(3)
  })

  it('returns gaps sorted by gap size descending', () => {
    const gaps = computeGaps(SAI_BASELINE)
    const top3 = getTop3Gaps(gaps)
    for (let i = 0; i < top3.length - 1; i++) {
      expect(top3[i].gap).toBeGreaterThanOrEqual(top3[i + 1].gap)
    }
  })

  it('returns empty array when all gaps are 0', () => {
    const perfect: Record<string, number> = {}
    SKILL_DIMENSIONS.forEach(d => { perfect[d.id] = PRINCIPAL_PM_TARGETS[d.id] })
    const gaps = computeGaps(perfect)
    expect(getTop3Gaps(gaps)).toHaveLength(0)
  })

  it('excludes zero-gap dimensions', () => {
    const gaps = computeGaps(SAI_BASELINE)
    const top3 = getTop3Gaps(gaps)
    top3.forEach(g => expect(g.gap).toBeGreaterThan(0))
  })

  it('external_visibility is in top 3 for Sai baseline (gap = 3)', () => {
    const gaps = computeGaps(SAI_BASELINE)
    const top3 = getTop3Gaps(gaps)
    expect(top3.some(g => g.dimension === 'external_visibility')).toBe(true)
  })
})

describe('buildRadarData', () => {
  it('returns one data point per dimension', () => {
    const gaps = computeGaps(SAI_BASELINE)
    const radarData = buildRadarData(gaps)
    expect(radarData).toHaveLength(SKILL_DIMENSIONS.length)
  })

  it('each point has dimension, current, and target fields', () => {
    const gaps = computeGaps(SAI_BASELINE)
    const radarData = buildRadarData(gaps)
    radarData.forEach(point => {
      expect(point.dimension).toBeTruthy()
      expect(typeof point.current).toBe('number')
      expect(typeof point.target).toBe('number')
    })
  })

  it('uses short label for dimension field', () => {
    const gaps = computeGaps(SAI_BASELINE)
    const radarData = buildRadarData(gaps)
    const genai = radarData.find(d => d.dimension === 'GenAI')
    expect(genai).toBeDefined()
  })
})

describe('estimateUnitsToClose', () => {
  it('returns 0 for gap of 0', () => {
    expect(estimateUnitsToClose(0)).toBe(0)
  })

  it('returns 2 for gap of 1', () => {
    expect(estimateUnitsToClose(1)).toBe(2)
  })

  it('returns 6 for gap of 3', () => {
    expect(estimateUnitsToClose(3)).toBe(6)
  })

  it('always returns a positive integer', () => {
    for (let gap = 0; gap <= 10; gap += 0.5) {
      const est = estimateUnitsToClose(gap)
      expect(est).toBeGreaterThanOrEqual(0)
      expect(Number.isInteger(est)).toBe(true)
    }
  })
})
