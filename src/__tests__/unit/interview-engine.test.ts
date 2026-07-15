import { describe, it, expect } from 'vitest'
import {
  INTERVIEW_PERSONAS,
  PERSONA_DEFINITIONS,
  hasContributorLanguage,
  hasOwnerLanguage,
  hasImpactNumber,
  isAnswerTooLong,
  parseFeedback,
  parseDebrief,
  parsePatternAnalysis,
  averageScore,
  scoreToGrade,
  type InterviewPersona,
  type AnswerFeedback,
  type SessionDebrief,
} from '@/lib/interview'

// ─── Personas ─────────────────────────────────────────────────────────────────

describe('INTERVIEW_PERSONAS', () => {
  it('has exactly 6 personas', () => {
    expect(INTERVIEW_PERSONAS).toHaveLength(6)
  })

  it('includes all required persona names', () => {
    const names = [...INTERVIEW_PERSONAS]
    expect(names).toContain('The Skeptic')
    expect(names).toContain('The Exhausted Senior PM')
    expect(names).toContain('The Bar Raiser')
    expect(names).toContain('The Technical PM')
    expect(names).toContain('The Friendly Deceiver')
    expect(names).toContain('The Speed Round')
  })

  it('every persona has a definition', () => {
    for (const name of INTERVIEW_PERSONAS) {
      expect(PERSONA_DEFINITIONS[name]).toBeDefined()
    }
  })

  it('every persona definition has required fields', () => {
    for (const name of INTERVIEW_PERSONAS) {
      const def = PERSONA_DEFINITIONS[name]
      expect(typeof def.description).toBe('string')
      expect(def.description.length).toBeGreaterThan(10)
      expect(typeof def.behavior).toBe('string')
      expect(def.behavior.length).toBeGreaterThan(10)
      expect(typeof def.pressure_escalation).toBe('string')
      expect(def.pressure_escalation.length).toBeGreaterThan(10)
      expect(typeof def.contributor_language_response).toBe('string')
      expect(def.contributor_language_response.length).toBeGreaterThan(10)
    }
  })

  it('Bar Raiser mentions LP or Leadership Principle', () => {
    const br = PERSONA_DEFINITIONS['The Bar Raiser']
    const text = `${br.behavior} ${br.pressure_escalation}`
    expect(text.toLowerCase()).toMatch(/leadership principle|lp\b|l7|bar raiser/i)
  })

  it('Speed Round mentions time constraint', () => {
    const sr = PERSONA_DEFINITIONS['The Speed Round']
    const text = `${sr.behavior} ${sr.pressure_escalation}`
    expect(text).toMatch(/\d+\s*second|time|wrap/i)
  })
})

// ─── Contributor language detection ───────────────────────────────────────────

describe('hasContributorLanguage', () => {
  it('detects "helped"', () => {
    const result = hasContributorLanguage('I helped the team deliver the roadmap.')
    expect(result.found).toBe(true)
    expect(result.phrases).toContain('helped')
  })

  it('detects "supported"', () => {
    const result = hasContributorLanguage('I supported the launch.')
    expect(result.found).toBe(true)
    expect(result.phrases).toContain('supported')
  })

  it('detects "assisted"', () => {
    const result = hasContributorLanguage('I assisted with the rollout.')
    expect(result.found).toBe(true)
    expect(result.phrases).toContain('assisted')
  })

  it('detects "contributed"', () => {
    const result = hasContributorLanguage('I contributed to improving fill rates.')
    expect(result.found).toBe(true)
    expect(result.phrases).toContain('contributed')
  })

  it('detects "collaborated"', () => {
    const result = hasContributorLanguage('I collaborated with engineering.')
    expect(result.found).toBe(true)
    expect(result.phrases).toContain('collaborated')
  })

  it('returns false for clean owner language', () => {
    const result = hasContributorLanguage('I led the team and drove 40% improvement.')
    expect(result.found).toBe(false)
    expect(result.phrases).toHaveLength(0)
  })

  it('is case-insensitive', () => {
    expect(hasContributorLanguage('HELPED the team').found).toBe(true)
    expect(hasContributorLanguage('Supported the launch').found).toBe(true)
  })

  it('detects multiple phrases in one answer', () => {
    const result = hasContributorLanguage('I helped design and supported the launch.')
    expect(result.phrases).toContain('helped')
    expect(result.phrases).toContain('supported')
    expect(result.phrases.length).toBeGreaterThanOrEqual(2)
  })

  it('returns empty phrases array when none found', () => {
    const result = hasContributorLanguage('I built and launched the platform.')
    expect(result.phrases).toHaveLength(0)
  })
})

// ─── Owner language detection ─────────────────────────────────────────────────

describe('hasOwnerLanguage', () => {
  it('detects "led"', () => expect(hasOwnerLanguage('I led the redesign.')).toBe(true))
  it('detects "drove"', () => expect(hasOwnerLanguage('I drove a 40% improvement.')).toBe(true))
  it('detects "built"', () => expect(hasOwnerLanguage('I built the platform from scratch.')).toBe(true))
  it('detects "owned"', () => expect(hasOwnerLanguage('I owned the roadmap.')).toBe(true))
  it('detects "defined"', () => expect(hasOwnerLanguage('I defined the strategy.')).toBe(true))
  it('detects "architected"', () => expect(hasOwnerLanguage('I architected the solution.')).toBe(true))
  it('detects "launched"', () => expect(hasOwnerLanguage('I launched the feature.')).toBe(true))

  it('returns false for contributor-only language', () => {
    expect(hasOwnerLanguage('I helped the team on this project.')).toBe(false)
  })
})

// ─── Impact number detection ──────────────────────────────────────────────────

describe('hasImpactNumber', () => {
  it('detects percentage improvement', () => {
    expect(hasImpactNumber('Reduced latency by 40%.')).toBe(true)
  })

  it('detects multiplier', () => {
    expect(hasImpactNumber('Increased throughput 3x.')).toBe(true)
  })

  it('detects INR units', () => {
    expect(hasImpactNumber('Saved 2 crore in operational costs.')).toBe(true)
  })

  it('detects user counts', () => {
    expect(hasImpactNumber('Onboarded 50,000 users in Q1.')).toBe(true)
  })

  it('detects time reductions', () => {
    expect(hasImpactNumber('Cut processing from 48 hours to 12 hours.')).toBe(true)
  })

  it('returns false for vague claims', () => {
    expect(hasImpactNumber('Significantly improved the user experience.')).toBe(false)
  })

  it('returns false for empty string', () => {
    expect(hasImpactNumber('')).toBe(false)
  })
})

// ─── Answer length check ──────────────────────────────────────────────────────

describe('isAnswerTooLong', () => {
  it('returns false for short answer', () => {
    const answer = 'I led the project and delivered on time.'
    expect(isAnswerTooLong(answer)).toBe(false)
  })

  it('returns false exactly at limit', () => {
    const answer = Array(250).fill('word').join(' ')
    expect(isAnswerTooLong(answer, 250)).toBe(false)
  })

  it('returns true one word over limit', () => {
    const answer = Array(251).fill('word').join(' ')
    expect(isAnswerTooLong(answer, 250)).toBe(true)
  })

  it('uses 250-word default', () => {
    const under = Array(249).fill('word').join(' ')
    const over = Array(251).fill('word').join(' ')
    expect(isAnswerTooLong(under)).toBe(false)
    expect(isAnswerTooLong(over)).toBe(true)
  })

  it('handles empty string', () => {
    expect(isAnswerTooLong('')).toBe(false)
  })
})

// ─── parseFeedback ────────────────────────────────────────────────────────────

describe('parseFeedback', () => {
  const VALID: AnswerFeedback = {
    score: 4,
    what_landed: 'Strong owner framing throughout.',
    what_missed: 'No impact number on the outcome.',
    better_version: 'Led the redesign that reduced latency by 40%, unblocking 3 downstream teams.',
  }

  it('parses a valid feedback object', () => {
    const result = parseFeedback(VALID)
    expect(result).not.toBeNull()
    expect(result!.score).toBe(4)
  })

  it('returns null for null input', () => {
    expect(parseFeedback(null)).toBeNull()
  })

  it('returns null for non-object', () => {
    expect(parseFeedback('string')).toBeNull()
    expect(parseFeedback(42)).toBeNull()
  })

  it('returns null if score is out of range', () => {
    expect(parseFeedback({ ...VALID, score: 0 })).toBeNull()
    expect(parseFeedback({ ...VALID, score: 6 })).toBeNull()
  })

  it('returns null if any string field is empty', () => {
    expect(parseFeedback({ ...VALID, what_landed: '' })).toBeNull()
    expect(parseFeedback({ ...VALID, what_missed: '   ' })).toBeNull()
  })

  it('accepts all valid score values 1-5', () => {
    for (let s = 1; s <= 5; s++) {
      expect(parseFeedback({ ...VALID, score: s })).not.toBeNull()
    }
  })
})

// ─── parseDebrief ─────────────────────────────────────────────────────────────

describe('parseDebrief', () => {
  const VALID: SessionDebrief = {
    overall_score: 7,
    best_answer: {
      question: 'Tell me about a time you led a platform product.',
      answer: 'I led the logistics routing platform that processed 2M orders daily.',
      why: 'Strong owner language, concrete scale, clear outcome.',
    },
    weakest_answer: {
      question: 'How do you prioritize competing roadmap items?',
      answer: 'I helped the team evaluate options.',
      what_was_missing: 'Contributor language — no ownership, no decision framework, no metric.',
    },
    session_pattern: 'Strong on execution stories, consistently weak on strategy questions.',
    fixes: [
      'Add impact numbers to every behavioral answer.',
      'Replace "I helped" with "I drove" or "I defined" throughout.',
      'Prepare a 2-minute strategy framework story with a real outcome.',
    ],
  }

  it('parses a valid debrief object', () => {
    const result = parseDebrief(VALID)
    expect(result).not.toBeNull()
    expect(result!.overall_score).toBe(7)
    expect(result!.fixes).toHaveLength(3)
  })

  it('returns null for null input', () => {
    expect(parseDebrief(null)).toBeNull()
  })

  it('returns null if overall_score out of range', () => {
    expect(parseDebrief({ ...VALID, overall_score: 0 })).toBeNull()
    expect(parseDebrief({ ...VALID, overall_score: 11 })).toBeNull()
  })

  it('requires exactly 3 fixes', () => {
    expect(parseDebrief({ ...VALID, fixes: ['only one fix'] })).toBeNull()
    expect(parseDebrief({ ...VALID, fixes: ['a', 'b', 'c', 'd'] })).toBeNull()
  })

  it('returns null if fixes contain empty strings', () => {
    expect(parseDebrief({ ...VALID, fixes: ['good fix', '', 'another fix'] })).toBeNull()
  })

  it('returns null if session_pattern is empty', () => {
    expect(parseDebrief({ ...VALID, session_pattern: '' })).toBeNull()
  })

  it('returns null if best_answer is missing fields', () => {
    const bad = { ...VALID, best_answer: { question: 'Q' } }
    expect(parseDebrief(bad)).toBeNull()
  })
})

// ─── parsePatternAnalysis ─────────────────────────────────────────────────────

describe('parsePatternAnalysis', () => {
  const VALID = {
    sessions_analyzed: 3,
    recurring_issue: 'Missing impact numbers in behavioral answers.',
    example_from_session: 'Session 2, Q3: "Improved the process" with no metric attached.',
    how_to_fix: 'Before every behavioral answer, ask yourself: what moved by how much because of this?',
  }

  it('parses a valid pattern analysis', () => {
    const result = parsePatternAnalysis(VALID)
    expect(result).not.toBeNull()
    expect(result!.sessions_analyzed).toBe(3)
  })

  it('returns null for null input', () => {
    expect(parsePatternAnalysis(null)).toBeNull()
  })

  it('returns null if sessions_analyzed < 1', () => {
    expect(parsePatternAnalysis({ ...VALID, sessions_analyzed: 0 })).toBeNull()
  })

  it('returns null if any required field is empty string', () => {
    expect(parsePatternAnalysis({ ...VALID, recurring_issue: '' })).toBeNull()
    expect(parsePatternAnalysis({ ...VALID, how_to_fix: '' })).toBeNull()
  })
})

// ─── averageScore ─────────────────────────────────────────────────────────────

describe('averageScore', () => {
  it('returns 0 for empty array', () => {
    expect(averageScore([])).toBe(0)
  })

  it('returns single value unchanged', () => {
    expect(averageScore([7])).toBe(7)
  })

  it('computes correct average', () => {
    expect(averageScore([4, 6, 8])).toBeCloseTo(6)
  })

  it('handles all same values', () => {
    expect(averageScore([5, 5, 5])).toBe(5)
  })
})

// ─── scoreToGrade ─────────────────────────────────────────────────────────────

describe('scoreToGrade', () => {
  it('10 is strong', () => expect(scoreToGrade(10)).toBe('strong'))
  it('8 is strong (boundary)', () => expect(scoreToGrade(8)).toBe('strong'))
  it('7.9 is needs-work', () => expect(scoreToGrade(7.9)).toBe('needs-work'))
  it('5 is needs-work (boundary)', () => expect(scoreToGrade(5)).toBe('needs-work'))
  it('4.9 is poor', () => expect(scoreToGrade(4.9)).toBe('poor'))
  it('1 is poor', () => expect(scoreToGrade(1)).toBe('poor'))
  it('0 is poor', () => expect(scoreToGrade(0)).toBe('poor'))
})
