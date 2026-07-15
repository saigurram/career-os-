import { describe, it, expect } from 'vitest'
import {
  COMP_BENCHMARKS,
  getBenchmark,
  getTotalComp,
  croreToInr,
  inrToCrore,
  formatCrore,
  computeCounterRange,
  getBatnaFraming,
  getCounterEmailAnchor,
} from '@/lib/negotiation'

// ─── Benchmark data ───────────────────────────────────────────────────────────

describe('COMP_BENCHMARKS', () => {
  it('has at least 4 companies', () => {
    expect(COMP_BENCHMARKS.length).toBeGreaterThanOrEqual(4)
  })

  it('includes Amazon India', () => {
    expect(COMP_BENCHMARKS.some(b => b.company.includes('Amazon'))).toBe(true)
  })

  it('all benchmarks have minCr < maxCr', () => {
    for (const b of COMP_BENCHMARKS) {
      expect(b.minCr).toBeLessThan(b.maxCr)
    }
  })

  it('all benchmarks have positive values', () => {
    for (const b of COMP_BENCHMARKS) {
      expect(b.minCr).toBeGreaterThan(0)
      expect(b.maxCr).toBeGreaterThan(0)
    }
  })
})

describe('getBenchmark', () => {
  it('finds Amazon benchmark case-insensitively', () => {
    const b = getBenchmark('amazon')
    expect(b).not.toBeNull()
    expect(b?.company).toContain('Amazon')
  })

  it('finds Google benchmark', () => {
    const b = getBenchmark('Google')
    expect(b).not.toBeNull()
  })

  it('returns null for unknown company', () => {
    expect(getBenchmark('UnknownXYZCorp')).toBeNull()
  })

  it('finds Microsoft by first word', () => {
    const b = getBenchmark('Microsoft')
    expect(b).not.toBeNull()
    expect(b?.company).toContain('Microsoft')
  })
})

// ─── Conversion utils ─────────────────────────────────────────────────────────

describe('croreToInr', () => {
  it('converts 1 crore to 10M INR', () => {
    expect(croreToInr(1)).toBe(10_000_000)
  })

  it('converts 1.5 crore correctly', () => {
    expect(croreToInr(1.5)).toBe(15_000_000)
  })

  it('handles fractional crore', () => {
    expect(croreToInr(0.5)).toBe(5_000_000)
  })
})

describe('inrToCrore', () => {
  it('converts 10M INR to 1 crore', () => {
    expect(inrToCrore(10_000_000)).toBe(1)
  })

  it('converts 15M INR to 1.5 crore', () => {
    expect(inrToCrore(15_000_000)).toBe(1.5)
  })
})

describe('formatCrore', () => {
  it('formats 1 crore as ₹1.00Cr', () => {
    expect(formatCrore(10_000_000)).toBe('₹1.00Cr')
  })

  it('formats 1.5 crore as ₹1.50Cr', () => {
    expect(formatCrore(15_000_000)).toBe('₹1.50Cr')
  })

  it('formats amounts below 1 crore in lakhs', () => {
    const result = formatCrore(5_000_000) // 50L
    expect(result).toContain('L')
    expect(result).toContain('₹')
  })
})

describe('getTotalComp', () => {
  it('sums all components', () => {
    expect(getTotalComp(5_000_000, 1_000_000, 2_000_000, 500_000)).toBe(8_500_000)
  })

  it('handles zero bonus components', () => {
    expect(getTotalComp(5_000_000, 0, 0, 0)).toBe(5_000_000)
  })
})

// ─── computeCounterRange ──────────────────────────────────────────────────────

describe('computeCounterRange', () => {
  const offerInr = 10_000_000 // 1 Cr

  it('target is 15% above offer', () => {
    const result = computeCounterRange(offerInr, null)
    expect(result.targetInr).toBe(Math.round(offerInr * 1.15))
  })

  it('high is 20% above offer', () => {
    const result = computeCounterRange(offerInr, null)
    expect(result.highInr).toBe(Math.round(offerInr * 1.20))
  })

  it('low is 8% above offer', () => {
    const result = computeCounterRange(offerInr, null)
    expect(result.lowInr).toBe(Math.round(offerInr * 1.08))
  })

  it('percentAboveOffer is always 15', () => {
    const result = computeCounterRange(offerInr, null)
    expect(result.percentAboveOffer).toBe(15)
  })

  it('caps target at benchmark max when benchmark exists', () => {
    const benchmark = { company: 'Test', level: 'L7', minCr: 0.5, maxCr: 1.1 }
    const highOffer = 10_000_000 // 1Cr — 15% above = 1.15Cr, but benchmark max is 1.1Cr
    const result = computeCounterRange(highOffer, benchmark)
    const benchmarkMaxInr = croreToInr(benchmark.maxCr)
    expect(result.targetInr).toBeLessThanOrEqual(benchmarkMaxInr)
    expect(result.highInr).toBeLessThanOrEqual(benchmarkMaxInr)
  })

  it('does not cap when offer is well below benchmark', () => {
    const benchmark = { company: 'Test', level: 'L7', minCr: 2.0, maxCr: 3.0 }
    const lowOffer = 5_000_000 // 50L — well below benchmark
    const result = computeCounterRange(lowOffer, benchmark)
    expect(result.targetInr).toBe(Math.round(lowOffer * 1.15))
  })
})

// ─── getBatnaFraming ──────────────────────────────────────────────────────────

describe('getBatnaFraming', () => {
  it('mentions Amazon in base framing', () => {
    const result = getBatnaFraming('SomeCompany', null)
    expect(result).toContain('Amazon')
  })

  it('includes benchmark midpoint when benchmark exists', () => {
    const benchmark = { company: 'Google India', level: 'Senior PM', minCr: 1.3, maxCr: 2.2 }
    const result = getBatnaFraming('Google', benchmark)
    expect(result).toContain('Google India')
    expect(result).toContain('₹')
  })

  it('returns base string without benchmark', () => {
    const result = getBatnaFraming('Unknown', null)
    expect(result).toContain('BATNA')
    expect(result).not.toContain('Market midpoint')
  })
})

// ─── getCounterEmailAnchor ────────────────────────────────────────────────────

describe('getCounterEmailAnchor', () => {
  const offerInr = 10_000_000
  const counter = { lowInr: 10_800_000, highInr: 12_000_000, targetInr: 11_500_000, percentAboveOffer: 15 }

  it('references benchmark level when available', () => {
    const benchmark = { company: 'Google India', level: 'Senior PM', minCr: 1.3, maxCr: 2.2 }
    const result = getCounterEmailAnchor(offerInr, benchmark, counter)
    expect(result).toContain('Senior PM')
  })

  it('includes formatted target comp', () => {
    const result = getCounterEmailAnchor(offerInr, null, counter)
    expect(result).toContain('₹')
  })

  it('falls back to Amazon platform framing without benchmark', () => {
    const result = getCounterEmailAnchor(offerInr, null, counter)
    expect(result).toContain('Amazon')
  })

  it('uses owner framing — no passive voice', () => {
    const result = getCounterEmailAnchor(offerInr, null, counter)
    expect(result.toLowerCase()).not.toContain('helped')
    expect(result.toLowerCase()).not.toContain('supported')
  })
})
