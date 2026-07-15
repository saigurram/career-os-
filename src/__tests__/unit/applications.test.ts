import { describe, it, expect } from 'vitest'
import {
  APPLICATION_STAGES,
  STAGE_LABELS,
  getStageIndex,
  getNextStage,
  getPrevStage,
  getDaysInStage,
  shouldShowFollowUpNudge,
  shouldShowMockNudge,
  getNextActionSuggestion,
  fitScoreBadgeClass,
  isActiveStage,
  type ApplicationStage,
} from '@/lib/applications'

// ─── Stage ordering ───────────────────────────────────────────────────────────

describe('APPLICATION_STAGES', () => {
  it('has 9 stages', () => {
    expect(APPLICATION_STAGES).toHaveLength(9)
  })

  it('starts with spotted and ends with closed', () => {
    expect(APPLICATION_STAGES[0]).toBe('spotted')
    expect(APPLICATION_STAGES[APPLICATION_STAGES.length - 1]).toBe('closed')
  })

  it('has offer before negotiating', () => {
    expect(getStageIndex('offer')).toBeLessThan(getStageIndex('negotiating'))
  })

  it('has loop before offer', () => {
    expect(getStageIndex('loop')).toBeLessThan(getStageIndex('offer'))
  })
})

describe('STAGE_LABELS', () => {
  it('has a label for every stage', () => {
    for (const stage of APPLICATION_STAGES) {
      expect(STAGE_LABELS[stage]).toBeTruthy()
    }
  })
})

// ─── Navigation ───────────────────────────────────────────────────────────────

describe('getNextStage', () => {
  it('spotted → interested', () => expect(getNextStage('spotted')).toBe('interested'))
  it('applied → recruiter_screen', () => expect(getNextStage('applied')).toBe('recruiter_screen'))
  it('offer → negotiating', () => expect(getNextStage('offer')).toBe('negotiating'))
  it('closed has no next', () => expect(getNextStage('closed')).toBeNull())
})

describe('getPrevStage', () => {
  it('interested → spotted', () => expect(getPrevStage('interested')).toBe('spotted'))
  it('loop → hm_round', () => expect(getPrevStage('loop')).toBe('hm_round'))
  it('spotted has no prev', () => expect(getPrevStage('spotted')).toBeNull())
})

// ─── getDaysInStage ───────────────────────────────────────────────────────────

describe('getDaysInStage', () => {
  it('returns 0 for null date', () => {
    expect(getDaysInStage(null)).toBe(0)
  })

  it('returns 7 for an application created 7 days ago', () => {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    expect(getDaysInStage(sevenDaysAgo)).toBe(7)
  })

  it('returns 0 for today', () => {
    expect(getDaysInStage(new Date().toISOString())).toBe(0)
  })
})

// ─── shouldShowFollowUpNudge ──────────────────────────────────────────────────

describe('shouldShowFollowUpNudge', () => {
  const sixDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
  const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()

  it('returns false for non-applied stages', () => {
    expect(shouldShowFollowUpNudge('interested', eightDaysAgo)).toBe(false)
    expect(shouldShowFollowUpNudge('recruiter_screen', eightDaysAgo)).toBe(false)
  })

  it('returns false when applied but less than 7 days', () => {
    expect(shouldShowFollowUpNudge('applied', sixDaysAgo)).toBe(false)
  })

  it('returns true when applied 7+ days ago', () => {
    expect(shouldShowFollowUpNudge('applied', eightDaysAgo)).toBe(true)
  })

  it('returns false for null appliedAt', () => {
    expect(shouldShowFollowUpNudge('applied', null)).toBe(false)
  })
})

// ─── shouldShowMockNudge ──────────────────────────────────────────────────────

describe('shouldShowMockNudge', () => {
  const in2Days = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
  const in5Days = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
  const yesterday = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()

  it('returns false for non-interview stages', () => {
    expect(shouldShowMockNudge('applied', in2Days)).toBe(false)
    expect(shouldShowMockNudge('offer', in2Days)).toBe(false)
  })

  it('returns true when loop in 2 days', () => {
    expect(shouldShowMockNudge('loop', in2Days)).toBe(true)
  })

  it('returns true when hm_round in 3 days', () => {
    expect(shouldShowMockNudge('hm_round', in2Days)).toBe(true)
  })

  it('returns false when interview is 5 days away', () => {
    expect(shouldShowMockNudge('loop', in5Days)).toBe(false)
  })

  it('returns false when null nextActionDue', () => {
    expect(shouldShowMockNudge('loop', null)).toBe(false)
  })
})

// ─── getNextActionSuggestion ──────────────────────────────────────────────────

describe('getNextActionSuggestion', () => {
  it('returns a non-empty string for every stage', () => {
    for (const stage of APPLICATION_STAGES) {
      const suggestion = getNextActionSuggestion(stage)
      expect(suggestion).toBeTruthy()
      expect(suggestion.length).toBeGreaterThan(10)
    }
  })

  it('offer stage mentions negotiation', () => {
    const s = getNextActionSuggestion('offer').toLowerCase()
    expect(s).toMatch(/negotiat/)
  })

  it('loop stage mentions mock', () => {
    const s = getNextActionSuggestion('loop').toLowerCase()
    expect(s).toMatch(/mock/)
  })
})

// ─── fitScoreBadgeClass ───────────────────────────────────────────────────────

describe('fitScoreBadgeClass', () => {
  it('returns muted for null score', () => {
    expect(fitScoreBadgeClass(null)).toContain('muted')
  })

  it('returns emerald for score >= 80', () => {
    expect(fitScoreBadgeClass(85)).toContain('emerald')
  })

  it('returns amber for score 60-79', () => {
    expect(fitScoreBadgeClass(70)).toContain('amber')
  })

  it('returns red for score < 60', () => {
    expect(fitScoreBadgeClass(45)).toContain('red')
  })
})

// ─── isActiveStage ────────────────────────────────────────────────────────────

describe('isActiveStage', () => {
  it('closed is not active', () => {
    expect(isActiveStage('closed')).toBe(false)
  })

  it('all other stages are active', () => {
    const active: ApplicationStage[] = ['spotted', 'interested', 'applied', 'recruiter_screen', 'hm_round', 'loop', 'offer', 'negotiating']
    for (const s of active) {
      expect(isActiveStage(s)).toBe(true)
    }
  })
})
