import { describe, it, expect } from 'vitest'
import {
  getPhase,
  daysUntilPhase2,
  daysUntilDeadline,
  daysInPhase2,
  getPhase2Label,
  PHASE2_START_DATE,
  OFFER_DEADLINE,
} from '@/lib/phase'

// ─── getPhase ─────────────────────────────────────────────────────────────────

describe('getPhase', () => {
  const phase2Date = new Date('2027-01-15')

  it('returns phase1 before Jan 15 2027', () => {
    expect(getPhase('phase1', phase2Date, new Date('2026-12-31'))).toBe('phase1')
  })

  it('returns phase2 ON Jan 15 2027', () => {
    expect(getPhase('phase1', phase2Date, new Date('2027-01-15'))).toBe('phase2')
  })

  it('returns phase2 after Jan 15 2027', () => {
    expect(getPhase('phase1', phase2Date, new Date('2027-06-01'))).toBe('phase2')
  })

  it('returns phase2 when already phase2, even before the date', () => {
    expect(getPhase('phase2', phase2Date, new Date('2026-06-01'))).toBe('phase2')
  })

  it('falls back to default PHASE2_START_DATE when phase2StartDate is null', () => {
    const dayBefore = new Date(PHASE2_START_DATE.getTime() - 24 * 60 * 60 * 1000)
    expect(getPhase('phase1', null, dayBefore)).toBe('phase1')
    expect(getPhase('phase1', null, PHASE2_START_DATE)).toBe('phase2')
  })

  it('handles early custom phase2 start date', () => {
    const earlyDate = new Date('2026-11-01')
    expect(getPhase('phase1', earlyDate, new Date('2026-10-31'))).toBe('phase1')
    expect(getPhase('phase1', earlyDate, new Date('2026-11-15'))).toBe('phase2')
  })

  it('accepts phase2StartDate as ISO string', () => {
    expect(getPhase('phase1', '2027-01-15', new Date('2027-01-15'))).toBe('phase2')
  })
})

// ─── daysUntilPhase2 ──────────────────────────────────────────────────────────

describe('daysUntilPhase2', () => {
  it('returns positive days before phase2', () => {
    const today = new Date('2026-12-15')
    const days = daysUntilPhase2(new Date('2027-01-15'), today)
    expect(days).toBe(31)
  })

  it('returns 0 on phase2 start day', () => {
    expect(daysUntilPhase2(new Date('2027-01-15'), new Date('2027-01-15'))).toBe(0)
  })

  it('returns 0 after phase2 start (never negative)', () => {
    expect(daysUntilPhase2(new Date('2027-01-15'), new Date('2027-06-01'))).toBe(0)
  })
})

// ─── daysUntilDeadline ────────────────────────────────────────────────────────

describe('daysUntilDeadline', () => {
  it('returns positive days before the June 2027 deadline', () => {
    const days = daysUntilDeadline(new Date('2027-01-15'))
    expect(days).toBeGreaterThan(150)
    expect(days).toBeLessThan(180)
  })

  it('returns 0 on the deadline day', () => {
    expect(daysUntilDeadline(OFFER_DEADLINE)).toBe(0)
  })

  it('never goes negative', () => {
    expect(daysUntilDeadline(new Date('2028-01-01'))).toBe(0)
  })
})

// ─── daysInPhase2 ─────────────────────────────────────────────────────────────

describe('daysInPhase2', () => {
  it('returns 0 on phase2 start day', () => {
    expect(daysInPhase2(new Date('2027-01-15'), new Date('2027-01-15'))).toBe(0)
  })

  it('returns days elapsed since phase2 started', () => {
    expect(daysInPhase2(new Date('2027-01-15'), new Date('2027-02-14'))).toBe(30)
  })

  it('returns 0 before phase2 starts (never negative)', () => {
    expect(daysInPhase2(new Date('2027-01-15'), new Date('2026-12-01'))).toBe(0)
  })
})

// ─── getPhase2Label ───────────────────────────────────────────────────────────

describe('getPhase2Label', () => {
  it('shows days to offer deadline for far dates', () => {
    const label = getPhase2Label(new Date('2027-01-15'))
    expect(label).toMatch(/\d+ days/)
  })

  it('shows crunch time message within 90 days', () => {
    const label = getPhase2Label(new Date('2027-04-01'))
    expect(label.toLowerCase()).toMatch(/days/)
  })

  it('shows final push within 30 days', () => {
    const label = getPhase2Label(new Date('2027-06-10'))
    expect(label).toMatch(/\d+ days/)
    expect(label).toContain('final push')
  })
})
