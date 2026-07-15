import { describe, it, expect } from 'vitest'

function shouldBePhase2(phase2StartDate: Date, today: Date = new Date()): boolean {
  return today >= phase2StartDate
}

function getPhase(phase2StartDate: Date, currentPhase: string, today: Date = new Date()): string {
  if (currentPhase === 'phase2') return 'phase2'
  if (shouldBePhase2(phase2StartDate, today)) return 'phase2'
  return 'phase1'
}

describe('Phase transition logic', () => {
  const phase2Date = new Date('2027-01-15')

  it('stays phase1 before Jan 15 2027', () => {
    const today = new Date('2026-12-31')
    expect(getPhase(phase2Date, 'phase1', today)).toBe('phase1')
  })

  it('transitions to phase2 ON Jan 15 2027', () => {
    const today = new Date('2027-01-15')
    expect(getPhase(phase2Date, 'phase1', today)).toBe('phase2')
  })

  it('is phase2 after Jan 15 2027', () => {
    const today = new Date('2027-06-01')
    expect(getPhase(phase2Date, 'phase1', today)).toBe('phase2')
  })

  it('stays phase2 once set, even before the date', () => {
    const today = new Date('2026-06-01')
    expect(getPhase(phase2Date, 'phase2', today)).toBe('phase2')
  })

  it('handles user-changed phase2 start date correctly', () => {
    const earlyDate = new Date('2026-11-01')
    const today = new Date('2026-11-15')
    expect(getPhase(earlyDate, 'phase1', today)).toBe('phase2')
  })
})
