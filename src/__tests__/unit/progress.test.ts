import { describe, it, expect } from 'vitest'

// Progress calculation logic
function calculateTaskCompletion(progress: Array<{
  learn_done: boolean
  create_done: boolean
  outreach_done: boolean
  reflect_done: boolean
}>): { completedTasks: number; totalTasks: number; percentage: number } {
  const totalTasks = progress.length * 4
  const completedTasks = progress.reduce((acc, unit) => {
    return acc +
      (unit.learn_done ? 1 : 0) +
      (unit.create_done ? 1 : 0) +
      (unit.outreach_done ? 1 : 0) +
      (unit.reflect_done ? 1 : 0)
  }, 0)
  return {
    completedTasks,
    totalTasks,
    percentage: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
  }
}

function calculateUnitCompletion(progress: Array<{
  learn_done: boolean
  create_done: boolean
  outreach_done: boolean
  reflect_done: boolean
}>): { completedUnits: number; totalUnits: number; percentage: number } {
  const totalUnits = progress.length
  const completedUnits = progress.filter(
    u => u.learn_done && u.create_done && u.outreach_done && u.reflect_done
  ).length
  return {
    completedUnits,
    totalUnits,
    percentage: totalUnits > 0 ? Math.round((completedUnits / totalUnits) * 100) : 0,
  }
}

function calculatePaceStatus(
  completedTasks: number,
  totalTasks: number,
  phase2StartDate: Date,
  today: Date = new Date()
): { daysRemaining: number; tasksRemaining: number; onTrack: boolean; message: string } {
  const daysRemaining = Math.max(0, Math.ceil((phase2StartDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)))
  const tasksRemaining = totalTasks - completedTasks
  const onTrack = tasksRemaining <= daysRemaining

  return {
    daysRemaining,
    tasksRemaining,
    onTrack,
    message: onTrack
      ? `Jan 15 is ${daysRemaining} days away. ${tasksRemaining} tasks remaining. You're on track.`
      : `Jan 15 is ${daysRemaining} days away. ${tasksRemaining} tasks remaining. Complete ${tasksRemaining - daysRemaining} extra tasks to catch up.`,
  }
}

describe('Task completion tracking', () => {
  it('calculates 0% when no tasks done', () => {
    const progress = Array(34).fill({ learn_done: false, create_done: false, outreach_done: false, reflect_done: false })
    const { percentage, totalTasks } = calculateTaskCompletion(progress)
    expect(percentage).toBe(0)
    expect(totalTasks).toBe(136)
  })

  it('calculates 100% when all tasks done', () => {
    const progress = Array(34).fill({ learn_done: true, create_done: true, outreach_done: true, reflect_done: true })
    const { percentage, completedTasks } = calculateTaskCompletion(progress)
    expect(percentage).toBe(100)
    expect(completedTasks).toBe(136)
  })

  it('calculates 25% when only Learn tasks done across all units', () => {
    const progress = Array(34).fill({ learn_done: true, create_done: false, outreach_done: false, reflect_done: false })
    const { percentage } = calculateTaskCompletion(progress)
    expect(percentage).toBe(25)
  })

  it('handles partial unit completion correctly', () => {
    const progress = [
      { learn_done: true, create_done: true, outreach_done: false, reflect_done: false }, // 2 tasks
      { learn_done: false, create_done: false, outreach_done: false, reflect_done: false }, // 0 tasks
    ]
    const { completedTasks, totalTasks } = calculateTaskCompletion(progress)
    expect(completedTasks).toBe(2)
    expect(totalTasks).toBe(8)
  })

  it('never returns percentage above 100', () => {
    const progress = Array(34).fill({ learn_done: true, create_done: true, outreach_done: true, reflect_done: true })
    const { percentage } = calculateTaskCompletion(progress)
    expect(percentage).toBeLessThanOrEqual(100)
  })
})

describe('Unit completion tracking', () => {
  it('marks unit complete only when all 4 tasks done', () => {
    const progress = [
      { learn_done: true, create_done: true, outreach_done: true, reflect_done: true },  // complete
      { learn_done: true, create_done: true, outreach_done: true, reflect_done: false },  // not complete
    ]
    const { completedUnits } = calculateUnitCompletion(progress)
    expect(completedUnits).toBe(1)
  })

  it('counts 0 complete units when all are partial', () => {
    const progress = Array(34).fill({ learn_done: true, create_done: false, outreach_done: false, reflect_done: false })
    const { completedUnits } = calculateUnitCompletion(progress)
    expect(completedUnits).toBe(0)
  })
})

describe('Pace status', () => {
  it('shows on track when tasks remaining <= days remaining', () => {
    const today = new Date('2026-06-01')
    const phase2Start = new Date('2027-01-15')
    const { onTrack } = calculatePaceStatus(0, 136, phase2Start, today)
    // 228 days remaining, 136 tasks — on track
    expect(onTrack).toBe(true)
  })

  it('shows off track when tasks remaining > days remaining', () => {
    const today = new Date('2027-01-10')
    const phase2Start = new Date('2027-01-15')
    const { onTrack } = calculatePaceStatus(0, 136, phase2Start, today)
    // 5 days remaining, 136 tasks — not on track
    expect(onTrack).toBe(false)
  })

  it('shows 0 days remaining after phase 2 start date', () => {
    const today = new Date('2027-02-01')
    const phase2Start = new Date('2027-01-15')
    const { daysRemaining } = calculatePaceStatus(100, 136, phase2Start, today)
    expect(daysRemaining).toBe(0)
  })
})
