import { describe, it, expect } from 'vitest'
import {
  INTERVIEW_PERSONAS,
  PERSONA_DEFINITIONS,
  getPersonaTimeLimitSeconds,
  getPersonaQuestionCount,
  isPersonaHiddenScorer,
  hasPersonaSilenceIndicator,
  hasPersonaWarmup,
  hasPersonaLpProbe,
  type InterviewPersona,
} from '@/lib/interview'

// ─── PersonaDefinition field completeness ─────────────────────────────────────

describe('PersonaDefinition completeness after extension', () => {
  it('every persona has all 10 required fields', () => {
    const REQUIRED_FIELDS = [
      'name', 'description', 'behavior', 'pressure_escalation',
      'contributor_language_response', 'time_limit_seconds', 'question_count',
      'has_hidden_scoring', 'has_silence_indicator', 'has_warmup', 'lp_probe',
    ]
    for (const persona of INTERVIEW_PERSONAS) {
      const def = PERSONA_DEFINITIONS[persona]
      for (const field of REQUIRED_FIELDS) {
        expect(def).toHaveProperty(field)
      }
    }
  })

  it('question_count is a positive integer for all personas', () => {
    for (const persona of INTERVIEW_PERSONAS) {
      const count = PERSONA_DEFINITIONS[persona].question_count
      expect(typeof count).toBe('number')
      expect(count).toBeGreaterThan(0)
      expect(Number.isInteger(count)).toBe(true)
    }
  })

  it('time_limit_seconds is number or null for all personas', () => {
    for (const persona of INTERVIEW_PERSONAS) {
      const limit = PERSONA_DEFINITIONS[persona].time_limit_seconds
      expect(limit === null || typeof limit === 'number').toBe(true)
      if (limit !== null) expect(limit).toBeGreaterThan(0)
    }
  })
})

// ─── getPersonaTimeLimitSeconds ───────────────────────────────────────────────

describe('getPersonaTimeLimitSeconds', () => {
  it('The Skeptic has 180s limit', () => {
    expect(getPersonaTimeLimitSeconds('The Skeptic')).toBe(180)
  })

  it('The Exhausted Senior PM has 120s limit (cuts off if rambling)', () => {
    expect(getPersonaTimeLimitSeconds('The Exhausted Senior PM')).toBe(120)
  })

  it('The Bar Raiser has 180s limit', () => {
    expect(getPersonaTimeLimitSeconds('The Bar Raiser')).toBe(180)
  })

  it('The Technical PM has 180s limit', () => {
    expect(getPersonaTimeLimitSeconds('The Technical PM')).toBe(180)
  })

  it('The Friendly Deceiver has 180s limit', () => {
    expect(getPersonaTimeLimitSeconds('The Friendly Deceiver')).toBe(180)
  })

  it('The Speed Round has 120s limit (hard cutoff per answer)', () => {
    expect(getPersonaTimeLimitSeconds('The Speed Round')).toBe(120)
  })

  it('Speed Round and Exhausted Senior PM share the shortest limit', () => {
    const limits = INTERVIEW_PERSONAS.map(p => getPersonaTimeLimitSeconds(p)).filter(l => l !== null) as number[]
    const shortest = Math.min(...limits)
    expect(shortest).toBe(120)
  })
})

// ─── getPersonaQuestionCount ──────────────────────────────────────────────────

describe('getPersonaQuestionCount', () => {
  it('The Speed Round has 8 questions', () => {
    expect(getPersonaQuestionCount('The Speed Round')).toBe(8)
  })

  it('all other personas have 5 questions', () => {
    const others: InterviewPersona[] = [
      'The Skeptic', 'The Exhausted Senior PM', 'The Bar Raiser',
      'The Technical PM', 'The Friendly Deceiver',
    ]
    for (const p of others) {
      expect(getPersonaQuestionCount(p)).toBe(5)
    }
  })

  it('Speed Round has the most questions of any persona', () => {
    const counts = INTERVIEW_PERSONAS.map(p => getPersonaQuestionCount(p))
    expect(Math.max(...counts)).toBe(8)
  })
})

// ─── isPersonaHiddenScorer ────────────────────────────────────────────────────

describe('isPersonaHiddenScorer', () => {
  it('The Friendly Deceiver is the only hidden scorer', () => {
    expect(isPersonaHiddenScorer('The Friendly Deceiver')).toBe(true)
  })

  it('all other personas are NOT hidden scorers', () => {
    const others: InterviewPersona[] = [
      'The Skeptic', 'The Exhausted Senior PM', 'The Bar Raiser',
      'The Technical PM', 'The Speed Round',
    ]
    for (const p of others) {
      expect(isPersonaHiddenScorer(p)).toBe(false)
    }
  })

  it('exactly one persona is a hidden scorer', () => {
    const hiddenScorers = INTERVIEW_PERSONAS.filter(p => isPersonaHiddenScorer(p))
    expect(hiddenScorers).toHaveLength(1)
    expect(hiddenScorers[0]).toBe('The Friendly Deceiver')
  })
})

// ─── hasPersonaSilenceIndicator ───────────────────────────────────────────────

describe('hasPersonaSilenceIndicator', () => {
  it('The Skeptic has silence indicator (3s typing pause after weak answer)', () => {
    expect(hasPersonaSilenceIndicator('The Skeptic')).toBe(true)
  })

  it('all other personas do NOT have silence indicator', () => {
    const others: InterviewPersona[] = [
      'The Exhausted Senior PM', 'The Bar Raiser', 'The Technical PM',
      'The Friendly Deceiver', 'The Speed Round',
    ]
    for (const p of others) {
      expect(hasPersonaSilenceIndicator(p)).toBe(false)
    }
  })

  it('exactly one persona has silence indicator', () => {
    const withIndicator = INTERVIEW_PERSONAS.filter(p => hasPersonaSilenceIndicator(p))
    expect(withIndicator).toHaveLength(1)
    expect(withIndicator[0]).toBe('The Skeptic')
  })
})

// ─── hasPersonaWarmup ─────────────────────────────────────────────────────────

describe('hasPersonaWarmup', () => {
  it('The Exhausted Senior PM warms up after a crisp answer', () => {
    expect(hasPersonaWarmup('The Exhausted Senior PM')).toBe(true)
  })

  it('all other personas do NOT have warmup behavior', () => {
    const others: InterviewPersona[] = [
      'The Skeptic', 'The Bar Raiser', 'The Technical PM',
      'The Friendly Deceiver', 'The Speed Round',
    ]
    for (const p of others) {
      expect(hasPersonaWarmup(p)).toBe(false)
    }
  })

  it('exactly one persona has warmup', () => {
    const withWarmup = INTERVIEW_PERSONAS.filter(p => hasPersonaWarmup(p))
    expect(withWarmup).toHaveLength(1)
    expect(withWarmup[0]).toBe('The Exhausted Senior PM')
  })
})

// ─── hasPersonaLpProbe ────────────────────────────────────────────────────────

describe('hasPersonaLpProbe', () => {
  it('The Bar Raiser probes LP after every behavioral answer', () => {
    expect(hasPersonaLpProbe('The Bar Raiser')).toBe(true)
  })

  it('all other personas do NOT have LP probe', () => {
    const others: InterviewPersona[] = [
      'The Skeptic', 'The Exhausted Senior PM', 'The Technical PM',
      'The Friendly Deceiver', 'The Speed Round',
    ]
    for (const p of others) {
      expect(hasPersonaLpProbe(p)).toBe(false)
    }
  })

  it('Bar Raiser behavior mentions LP or Leadership Principle', () => {
    const behavior = PERSONA_DEFINITIONS['The Bar Raiser'].behavior
    expect(behavior).toMatch(/Leadership Principle|LP/i)
  })
})

// ─── Persona behavior content checks ─────────────────────────────────────────

describe('persona behavior content', () => {
  it('Exhausted Senior PM behavior mentions warmup cue', () => {
    const behavior = PERSONA_DEFINITIONS['The Exhausted Senior PM'].behavior
    expect(behavior.toLowerCase()).toMatch(/warm|okay|useful/)
  })

  it('Friendly Deceiver behavior mentions hidden scoring / not revealing', () => {
    const behavior = PERSONA_DEFINITIONS['The Friendly Deceiver'].behavior
    expect(behavior.toLowerCase()).toMatch(/never reveal|internal scor|not reveal/)
  })

  it('Speed Round behavior mentions time cutoff', () => {
    const behavior = PERSONA_DEFINITIONS['The Speed Round'].behavior
    expect(behavior.toLowerCase()).toMatch(/time|cut off|minute/)
  })

  it('Speed Round has 8 questions and 25-minute session (mentioned in description)', () => {
    const desc = PERSONA_DEFINITIONS['The Speed Round'].description
    expect(desc).toMatch(/8 questions|25 minutes/)
  })

  it('Skeptic has silence_indicator but NOT lp_probe', () => {
    const def = PERSONA_DEFINITIONS['The Skeptic']
    expect(def.has_silence_indicator).toBe(true)
    expect(def.lp_probe).toBe(false)
  })
})
