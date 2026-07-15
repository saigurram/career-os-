import { describe, it, expect } from 'vitest'

const CONTRIBUTOR_PATTERNS = [
  /\bhelped\b/gi,
  /\bsupported\b/gi,
  /\bassisted\b/gi,
  /\bcontributed to\b/gi,
  /\bcollaborated on\b/gi,
]

const BANNED_PHRASES = [
  /passionate about/gi,
  /thought leader/gi,
  /game.changing/gi,
  /excited to share/gi,
  /humbled and honored/gi,
  /in today.s fast.paced world/gi,
  /synergy/gi,
]

function checkOwnerLanguage(text: string): { passed: boolean; violations: string[] } {
  const violations: string[] = []
  for (const pattern of CONTRIBUTOR_PATTERNS) {
    if (pattern.test(text)) violations.push(`Contributor language: ${pattern.source}`)
  }
  return { passed: violations.length === 0, violations }
}

function checkAuthenticity(text: string): { passed: boolean; violations: string[] } {
  const violations: string[] = []
  for (const pattern of BANNED_PHRASES) {
    if (pattern.test(text)) violations.push(`Banned phrase: ${pattern.source}`)
  }
  return { passed: violations.length === 0, violations }
}

describe('Owner language checker', () => {
  it('flags "helped" as contributor language', () => {
    const { passed, violations } = checkOwnerLanguage('I helped the team ship this feature.')
    expect(passed).toBe(false)
    expect(violations.length).toBeGreaterThan(0)
  })

  it('flags "supported" as contributor language', () => {
    const { passed } = checkOwnerLanguage('I supported the initiative.')
    expect(passed).toBe(false)
  })

  it('flags "assisted" as contributor language', () => {
    const { passed } = checkOwnerLanguage('I assisted in the launch.')
    expect(passed).toBe(false)
  })

  it('flags "contributed to" as contributor language', () => {
    const { passed } = checkOwnerLanguage('I contributed to the platform strategy.')
    expect(passed).toBe(false)
  })

  it('passes clean owner-framed text', () => {
    const { passed } = checkOwnerLanguage('I led the platform vision and drove a 40% improvement in throughput.')
    expect(passed).toBe(true)
  })

  it('passes text with "helped" in a different context (e.g. product helped users)', () => {
    // "helped" referring to the product helping users is acceptable
    // Only flag when user uses "helped" to describe their own role
    const { passed } = checkOwnerLanguage('The platform helped 500 associates process packages faster.')
    // This is ambiguous — the check should flag it and let user decide
    // For now we flag all instances to be safe
    expect(passed).toBe(false)
  })
})

describe('Authenticity checker', () => {
  it('flags "passionate about"', () => {
    const { passed } = checkAuthenticity('I am passionate about AI products.')
    expect(passed).toBe(false)
  })

  it('flags "thought leader"', () => {
    const { passed } = checkAuthenticity('I am a thought leader in logistics.')
    expect(passed).toBe(false)
  })

  it('flags "game-changing"', () => {
    const { passed } = checkAuthenticity('This is a game-changing product.')
    expect(passed).toBe(false)
  })

  it('flags "excited to share"', () => {
    const { passed } = checkAuthenticity("I'm excited to share my latest project.")
    expect(passed).toBe(false)
  })

  it('passes clean, specific, authentic text', () => {
    const { passed } = checkAuthenticity(
      'I built a computer vision system that cut container dwell time by 33%. Here is what I learned.'
    )
    expect(passed).toBe(true)
  })
})
