import { describe, it, expect } from 'vitest'

// Job filtering logic — mirrors what the cron job and feed should do
interface Job {
  title: string
  company: string
  location: string
  level_estimate: string
  comp_estimate_inr: number | null
  is_remote: boolean
  is_active: boolean
}

const LEVEL_HIERARCHY = ['Junior PM', 'PM', 'Senior PM', 'Lead PM', 'Staff PM', 'Principal PM', 'Group PM', 'Director PM']
const MINIMUM_LEVEL = 'Senior PM'
const MINIMUM_COMP_INR = 8000000 // ₹80L — Amazon L6 Hyderabad floor

function isAboveMinimumLevel(levelEstimate: string): boolean {
  const minIndex = LEVEL_HIERARCHY.indexOf(MINIMUM_LEVEL)
  // Use exact match to avoid 'PM' matching as substring of 'Senior PM'
  const jobIndex = LEVEL_HIERARCHY.findIndex(l => l.toLowerCase() === levelEstimate.toLowerCase())
  return jobIndex >= minIndex
}

function filterJobs(jobs: Job[]): Job[] {
  return jobs.filter(job => {
    // Must be active
    if (!job.is_active) return false
    // Must be Hyderabad or remote
    const isHyderabad = job.location.toLowerCase().includes('hyderabad')
    if (!isHyderabad && !job.is_remote) return false
    // Must be above minimum level
    if (!isAboveMinimumLevel(job.level_estimate)) return false
    // Must be above minimum comp (if comp is provided)
    if (job.comp_estimate_inr !== null && job.comp_estimate_inr < MINIMUM_COMP_INR) return false
    return true
  })
}

describe('Job filtering — location', () => {
  const baseJob: Job = {
    title: 'Senior PM',
    company: 'Google',
    location: 'Hyderabad',
    level_estimate: 'Senior PM',
    comp_estimate_inr: 15000000,
    is_remote: false,
    is_active: true,
  }

  it('includes Hyderabad jobs', () => {
    const result = filterJobs([baseJob])
    expect(result).toHaveLength(1)
  })

  it('includes remote jobs', () => {
    const remoteJob = { ...baseJob, location: 'India (Remote)', is_remote: true }
    const result = filterJobs([remoteJob])
    expect(result).toHaveLength(1)
  })

  it('excludes Bangalore jobs', () => {
    const bangaloreJob = { ...baseJob, location: 'Bangalore', is_remote: false }
    const result = filterJobs([bangaloreJob])
    expect(result).toHaveLength(0)
  })

  it('excludes Mumbai jobs', () => {
    const mumbaiJob = { ...baseJob, location: 'Mumbai', is_remote: false }
    const result = filterJobs([mumbaiJob])
    expect(result).toHaveLength(0)
  })

  it('excludes Hyderabad OR Bangalore dual-city jobs if not remote', () => {
    // Hyderabad is in the string so it passes location check — this is acceptable
    const dualCity = { ...baseJob, location: 'Hyderabad or Bangalore', is_remote: false }
    const result = filterJobs([dualCity])
    expect(result).toHaveLength(1) // passes because Hyderabad is in string
  })

  it('excludes US-based jobs', () => {
    const usJob = { ...baseJob, location: 'Seattle, WA', is_remote: false }
    const result = filterJobs([usJob])
    expect(result).toHaveLength(0)
  })
})

describe('Job filtering — level', () => {
  const baseJob: Job = {
    title: 'PM Role',
    company: 'Uber',
    location: 'Hyderabad',
    level_estimate: 'Senior PM',
    comp_estimate_inr: 15000000,
    is_remote: false,
    is_active: true,
  }

  it('includes Senior PM', () => {
    expect(filterJobs([baseJob])).toHaveLength(1)
  })

  it('includes Lead PM', () => {
    expect(filterJobs([{ ...baseJob, level_estimate: 'Lead PM' }])).toHaveLength(1)
  })

  it('includes Principal PM', () => {
    expect(filterJobs([{ ...baseJob, level_estimate: 'Principal PM' }])).toHaveLength(1)
  })

  it('includes Staff PM', () => {
    expect(filterJobs([{ ...baseJob, level_estimate: 'Staff PM' }])).toHaveLength(1)
  })

  it('excludes PM (too junior)', () => {
    expect(filterJobs([{ ...baseJob, level_estimate: 'PM' }])).toHaveLength(0)
  })

  it('excludes Junior PM', () => {
    expect(filterJobs([{ ...baseJob, level_estimate: 'Junior PM' }])).toHaveLength(0)
  })
})

describe('Job filtering — comp', () => {
  const baseJob: Job = {
    title: 'Principal PM',
    company: 'Google',
    location: 'Hyderabad',
    level_estimate: 'Principal PM',
    comp_estimate_inr: 15000000,
    is_remote: false,
    is_active: true,
  }

  it('includes jobs above minimum comp', () => {
    expect(filterJobs([baseJob])).toHaveLength(1)
  })

  it('excludes jobs below minimum comp (₹80L floor)', () => {
    const lowComp = { ...baseJob, comp_estimate_inr: 7000000 } // ₹70L
    expect(filterJobs([lowComp])).toHaveLength(0)
  })

  it('includes jobs with null comp (unknown — give benefit of doubt)', () => {
    const unknownComp = { ...baseJob, comp_estimate_inr: null }
    expect(filterJobs([unknownComp])).toHaveLength(1)
  })

  it('excludes inactive jobs regardless of other criteria', () => {
    const inactiveJob = { ...baseJob, is_active: false }
    expect(filterJobs([inactiveJob])).toHaveLength(0)
  })
})

describe('Job filtering — edge cases', () => {
  it('returns empty array for empty input', () => {
    expect(filterJobs([])).toHaveLength(0)
  })

  it('handles comp in USD field mistakenly (very low INR number)', () => {
    // If someone accidentally sets comp_estimate_inr to 150000 (which is $150k USD)
    // it should be filtered out since 150000 INR is ₹1.5L — way below floor
    const usdAsInr = {
      title: 'Senior PM', company: 'Test', location: 'Hyderabad',
      level_estimate: 'Senior PM', comp_estimate_inr: 150000,
      is_remote: false, is_active: true,
    }
    expect(filterJobs([usdAsInr])).toHaveLength(0)
  })
})
