import { describe, it, expect } from 'vitest'
import {
  parseFitAnalysis,
  deriveRecommendation,
  severityFromGapSize,
  fitScoreColor,
  recommendationColor,
} from '@/lib/fit-analyzer'

const VALID_ANALYSIS = {
  fit_score: 72,
  strengths: [
    { skill: 'Data & Analytics', story_suggestion: 'Use the real-time data platform story' },
    { skill: 'Platform thinking', story_suggestion: 'Reference the sort-center throughput platform' },
    { skill: 'Domain depth', story_suggestion: 'Ops/logistics expertise maps directly' },
  ],
  gaps: [
    { skill: 'GenAI PM fluency', severity: 'manageable', action: 'Ship one GenAI proof-of-work' },
    { skill: 'External visibility', severity: 'blocking', action: 'Publish 3 LinkedIn posts' },
    { skill: 'Executive communication', severity: 'minor', action: 'Rewrite 2 bullets in owner framing' },
  ],
  recommendation: 'Close gap first',
  resume_note: 'Lead with the real-time data platform angle',
}

describe('parseFitAnalysis', () => {
  it('parses a valid analysis object', () => {
    const result = parseFitAnalysis(VALID_ANALYSIS)
    expect(result).not.toBeNull()
    expect(result!.fit_score).toBe(72)
    expect(result!.strengths).toHaveLength(3)
    expect(result!.gaps).toHaveLength(3)
    expect(result!.recommendation).toBe('Close gap first')
    expect(result!.resume_note).toBe('Lead with the real-time data platform angle')
  })

  it('returns null for null input', () => {
    expect(parseFitAnalysis(null)).toBeNull()
  })

  it('returns null for non-object input', () => {
    expect(parseFitAnalysis('not an object')).toBeNull()
    expect(parseFitAnalysis(42)).toBeNull()
  })

  it('defaults fit_score to 0 if missing', () => {
    const { fit_score: _, ...noScore } = VALID_ANALYSIS
    const result = parseFitAnalysis(noScore)
    expect(result!.fit_score).toBe(0)
  })

  it('defaults strengths to [] if missing', () => {
    const result = parseFitAnalysis({ ...VALID_ANALYSIS, strengths: undefined })
    expect(result!.strengths).toEqual([])
  })

  it('defaults gaps to [] if missing', () => {
    const result = parseFitAnalysis({ ...VALID_ANALYSIS, gaps: undefined })
    expect(result!.gaps).toEqual([])
  })

  it('derives recommendation from fit_score if recommendation is invalid', () => {
    const result = parseFitAnalysis({ ...VALID_ANALYSIS, recommendation: 'INVALID' })
    expect(['Apply now', 'Close gap first', 'Skip']).toContain(result!.recommendation)
  })

  it('filters out malformed strengths entries', () => {
    const result = parseFitAnalysis({
      ...VALID_ANALYSIS,
      strengths: [
        { skill: 'Good strength', story_suggestion: 'Use story X' },
        { missing_skill: true }, // malformed
        null,
      ],
    })
    expect(result!.strengths).toHaveLength(1)
  })

  it('preserves valid recommendation strings', () => {
    for (const rec of ['Apply now', 'Close gap first', 'Skip']) {
      const result = parseFitAnalysis({ ...VALID_ANALYSIS, recommendation: rec })
      expect(result!.recommendation).toBe(rec)
    }
  })
})

describe('deriveRecommendation', () => {
  it('returns "Apply now" for score >= 75', () => {
    expect(deriveRecommendation(75)).toBe('Apply now')
    expect(deriveRecommendation(90)).toBe('Apply now')
    expect(deriveRecommendation(100)).toBe('Apply now')
  })

  it('returns "Close gap first" for score 50-74', () => {
    expect(deriveRecommendation(50)).toBe('Close gap first')
    expect(deriveRecommendation(60)).toBe('Close gap first')
    expect(deriveRecommendation(74)).toBe('Close gap first')
  })

  it('returns "Skip" for score < 50', () => {
    expect(deriveRecommendation(49)).toBe('Skip')
    expect(deriveRecommendation(0)).toBe('Skip')
    expect(deriveRecommendation(30)).toBe('Skip')
  })

  it('boundary: score exactly 75 is "Apply now"', () => {
    expect(deriveRecommendation(75)).toBe('Apply now')
  })

  it('boundary: score exactly 50 is "Close gap first"', () => {
    expect(deriveRecommendation(50)).toBe('Close gap first')
  })
})

describe('severityFromGapSize', () => {
  it('blocking for gap >= 3', () => {
    expect(severityFromGapSize(3)).toBe('blocking')
    expect(severityFromGapSize(5)).toBe('blocking')
  })

  it('manageable for gap 1.5 to 2.9', () => {
    expect(severityFromGapSize(1.5)).toBe('manageable')
    expect(severityFromGapSize(2)).toBe('manageable')
    expect(severityFromGapSize(2.9)).toBe('manageable')
  })

  it('minor for gap < 1.5', () => {
    expect(severityFromGapSize(0)).toBe('minor')
    expect(severityFromGapSize(1)).toBe('minor')
    expect(severityFromGapSize(1.4)).toBe('minor')
  })
})

describe('fitScoreColor', () => {
  it('returns emerald for score >= 80', () => {
    expect(fitScoreColor(80)).toBe('emerald')
    expect(fitScoreColor(95)).toBe('emerald')
  })

  it('returns amber for score 60-79', () => {
    expect(fitScoreColor(60)).toBe('amber')
    expect(fitScoreColor(79)).toBe('amber')
  })

  it('returns red for score < 60', () => {
    expect(fitScoreColor(59)).toBe('red')
    expect(fitScoreColor(0)).toBe('red')
  })
})

describe('recommendationColor', () => {
  it('returns emerald for "Apply now"', () => {
    expect(recommendationColor('Apply now')).toBe('emerald')
  })

  it('returns amber for "Close gap first"', () => {
    expect(recommendationColor('Close gap first')).toBe('amber')
  })

  it('returns red for "Skip"', () => {
    expect(recommendationColor('Skip')).toBe('red')
  })
})
