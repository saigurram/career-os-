import { describe, it, expect } from 'vitest'

function calculateStreak(completionDates: Date[], today: Date = new Date()): number {
  if (completionDates.length === 0) return 0

  // Get unique dates (day-level, in IST)
  const uniqueDays = Array.from(new Set(
    completionDates.map(d => d.toISOString().split('T')[0])
  )).sort().reverse()

  if (uniqueDays.length === 0) return 0

  const todayStr = today.toISOString().split('T')[0]
  const yesterdayStr = new Date(today.getTime() - 86400000).toISOString().split('T')[0]

  // Streak must include today or yesterday to be active
  if (uniqueDays[0] !== todayStr && uniqueDays[0] !== yesterdayStr) return 0

  let streak = 0
  let currentDate = new Date(uniqueDays[0])

  for (const day of uniqueDays) {
    const dayDate = new Date(day)
    const diff = Math.round((currentDate.getTime() - dayDate.getTime()) / 86400000)
    if (diff <= 1) {
      streak++
      currentDate = dayDate
    } else {
      break
    }
  }

  return streak
}

describe('Streak calculation', () => {
  it('returns 0 for no completion dates', () => {
    expect(calculateStreak([], new Date('2026-06-10'))).toBe(0)
  })

  it('returns 1 for single task done today', () => {
    const today = new Date('2026-06-10')
    expect(calculateStreak([today], today)).toBe(1)
  })

  it('returns streak for consecutive days', () => {
    const today = new Date('2026-06-10')
    const dates = [
      new Date('2026-06-10'),
      new Date('2026-06-09'),
      new Date('2026-06-08'),
    ]
    expect(calculateStreak(dates, today)).toBe(3)
  })

  it('breaks streak on gap day', () => {
    const today = new Date('2026-06-10')
    const dates = [
      new Date('2026-06-10'),
      new Date('2026-06-09'),
      new Date('2026-06-07'), // gap — missing June 8
    ]
    expect(calculateStreak(dates, today)).toBe(2)
  })

  it('keeps streak alive if last completion was yesterday', () => {
    const today = new Date('2026-06-10')
    const dates = [new Date('2026-06-09')] // yesterday only
    expect(calculateStreak(dates, today)).toBe(1)
  })

  it('resets streak if last completion was 2+ days ago', () => {
    const today = new Date('2026-06-10')
    const dates = [new Date('2026-06-07')] // 3 days ago
    expect(calculateStreak(dates, today)).toBe(0)
  })

  it('multiple tasks on same day count as one streak day', () => {
    const today = new Date('2026-06-10')
    // Use explicit UTC (Z suffix) to avoid timezone day-boundary issues
    const dates = [
      new Date('2026-06-10T09:00:00Z'),
      new Date('2026-06-10T14:00:00Z'),
      new Date('2026-06-10T20:00:00Z'),
    ]
    expect(calculateStreak(dates, today)).toBe(1)
  })
})
