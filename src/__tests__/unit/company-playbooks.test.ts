import { describe, it, expect } from 'vitest'
import {
  PLAYBOOK_COMPANIES,
  getCompanyEntry,
  getCompaniesByTier,
  validatePlaybook,
  parseGeneratedPlaybook,
  shouldRegeneratePlaybook,
  buildPlaybookPrompt,
  type CompanyPlaybook,
} from '@/lib/company-playbooks'

// ─── Company registry ─────────────────────────────────────────────────────────

describe('PLAYBOOK_COMPANIES registry', () => {
  it('total is 19 companies', () => {
    expect(PLAYBOOK_COMPANIES).toHaveLength(19)
  })

  it('no duplicate company names', () => {
    const names = PLAYBOOK_COMPANIES.map(c => c.company)
    const unique = new Set(names)
    expect(unique.size).toBe(19)
  })

  it('all tiers are 1, 2, or 3', () => {
    for (const c of PLAYBOOK_COMPANIES) {
      expect([1, 2, 3]).toContain(c.tier)
    }
  })

  it('getCompanyEntry finds a known company', () => {
    expect(getCompanyEntry('Google')).toBeDefined()
    expect(getCompanyEntry('Google')?.tier).toBe(1)
  })

  it('getCompanyEntry returns undefined for unknown company', () => {
    expect(getCompanyEntry('Unknown Corp')).toBeUndefined()
  })
})

// ─── Tier breakdown ───────────────────────────────────────────────────────────

describe('tier breakdown', () => {
  it('Tier 1: exactly 6 companies', () => {
    expect(getCompaniesByTier(1)).toHaveLength(6)
  })

  it('Tier 2: exactly 7 companies', () => {
    expect(getCompaniesByTier(2)).toHaveLength(7)
  })

  it('Tier 3: exactly 6 companies', () => {
    expect(getCompaniesByTier(3)).toHaveLength(6)
  })

  it('Tier 1 companies are correct', () => {
    const t1 = getCompaniesByTier(1).map(c => c.company)
    for (const name of ['Google', 'Uber', 'Microsoft', 'Experian', 'ServiceNow', 'Amazon L7']) {
      expect(t1).toContain(name)
    }
  })

  it('Tier 2 companies are correct', () => {
    const t2 = getCompaniesByTier(2).map(c => c.company)
    for (const name of ['Flipkart', 'PhonePe', 'Swiggy', 'Zomato', 'CRED', 'Meesho', 'Razorpay']) {
      expect(t2).toContain(name)
    }
  })

  it('Tier 3 companies are correct', () => {
    const t3 = getCompaniesByTier(3).map(c => c.company)
    for (const name of ['Salesforce', 'SAP', 'Oracle', 'Freshworks', 'PayPal', 'InMobi']) {
      expect(t3).toContain(name)
    }
  })
})

// ─── validatePlaybook ─────────────────────────────────────────────────────────

const VALID_T1: CompanyPlaybook = {
  company: 'Google',
  tier: 1,
  interview_format: '5 rounds: recruiter screen, 2 product sense, 1 execution, 1 behavioral.',
  what_they_test: 'Goals-first framework, structured problem solving, user empathy at scale.',
  common_mistakes: 'Jumping to solutions before defining success metrics. Ignoring constraints.',
  insider_tips: 'They value "what does good look like" before "how do we get there".',
  user_specific_angle: 'Amazon logistics maps well to Google supply chain and Maps infrastructure.',
  india_context: null,
  comp_context_inr: null,
  generated_at: new Date().toISOString(),
}

const VALID_T2: CompanyPlaybook = {
  company: 'Swiggy',
  tier: 2,
  interview_format: '3 rounds: hiring manager, cross-functional, bar raiser.',
  what_they_test: 'Speed, 0-to-1 thinking, ambiguity comfort, execution over perfection.',
  common_mistakes: 'Over-engineering solutions. Too much process for a startup context.',
  insider_tips: 'Swiggy values PMs who can operate at 70% information. Ship and learn.',
  user_specific_angle: 'Amazon last-mile experience maps directly to Swiggy dark store ops.',
  india_context: 'Fast-moving. Less structured than Big Tech. Expect ambiguity.',
  comp_context_inr: 'Principal PM: ₹90L–₹1.4Cr total comp in Hyderabad.',
  generated_at: new Date().toISOString(),
}

describe('validatePlaybook', () => {
  it('returns true for a valid Tier 1 playbook', () => {
    expect(validatePlaybook(VALID_T1)).toBe(true)
  })

  it('returns true for a valid Tier 2 playbook with India context', () => {
    expect(validatePlaybook(VALID_T2)).toBe(true)
  })

  it('returns false for null', () => {
    expect(validatePlaybook(null)).toBe(false)
  })

  it('returns false if any required string field is empty', () => {
    expect(validatePlaybook({ ...VALID_T1, interview_format: '' })).toBe(false)
    expect(validatePlaybook({ ...VALID_T1, common_mistakes: '   ' })).toBe(false)
  })

  it('returns false if tier is invalid', () => {
    expect(validatePlaybook({ ...VALID_T1, tier: 4 })).toBe(false)
    expect(validatePlaybook({ ...VALID_T1, tier: 0 })).toBe(false)
  })

  it('returns false if company is empty', () => {
    expect(validatePlaybook({ ...VALID_T1, company: '' })).toBe(false)
  })
})

// ─── parseGeneratedPlaybook ───────────────────────────────────────────────────

describe('parseGeneratedPlaybook', () => {
  it('returns a playbook for valid Tier 1 input', () => {
    const result = parseGeneratedPlaybook(VALID_T1)
    expect(result).not.toBeNull()
    expect(result!.company).toBe('Google')
    expect(result!.tier).toBe(1)
    expect(result!.india_context).toBeNull()
  })

  it('returns a playbook for valid Tier 2 input with India context', () => {
    const result = parseGeneratedPlaybook(VALID_T2)
    expect(result).not.toBeNull()
    expect(result!.india_context).toBe('Fast-moving. Less structured than Big Tech. Expect ambiguity.')
    expect(result!.comp_context_inr).toContain('₹')
  })

  it('returns null for invalid input', () => {
    expect(parseGeneratedPlaybook(null)).toBeNull()
    expect(parseGeneratedPlaybook({ company: 'Google' })).toBeNull()
  })

  it('sets india_context to null when field is missing', () => {
    const { india_context: _, ...noIndia } = VALID_T1
    const result = parseGeneratedPlaybook(noIndia)
    expect(result).not.toBeNull()
    expect(result!.india_context).toBeNull()
  })
})

// ─── shouldRegeneratePlaybook ─────────────────────────────────────────────────

describe('shouldRegeneratePlaybook', () => {
  it('returns true for null (never generated)', () => {
    expect(shouldRegeneratePlaybook(null)).toBe(true)
  })

  it('returns false for a fresh playbook (1 day old)', () => {
    const oneDayAgo = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    expect(shouldRegeneratePlaybook(oneDayAgo)).toBe(false)
  })

  it('returns false for a 29-day-old playbook (within 30-day window)', () => {
    const twentyNineDaysAgo = new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString()
    expect(shouldRegeneratePlaybook(twentyNineDaysAgo)).toBe(false)
  })

  it('returns true for a 31-day-old playbook (stale)', () => {
    const thirtyOneDaysAgo = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString()
    expect(shouldRegeneratePlaybook(thirtyOneDaysAgo)).toBe(true)
  })

  it('respects custom maxAgeDays parameter', () => {
    const sixDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
    expect(shouldRegeneratePlaybook(sixDaysAgo, 7)).toBe(false)
    expect(shouldRegeneratePlaybook(sixDaysAgo, 5)).toBe(true)
  })

  it('just-generated playbook is never stale', () => {
    expect(shouldRegeneratePlaybook(new Date().toISOString())).toBe(false)
  })
})

// ─── buildPlaybookPrompt ──────────────────────────────────────────────────────

describe('buildPlaybookPrompt', () => {
  it('includes the company name', () => {
    const prompt = buildPlaybookPrompt('Google', 1, 'Senior PM at Amazon')
    expect(prompt).toContain('Google')
  })

  it('includes the tier', () => {
    const prompt = buildPlaybookPrompt('Google', 1, 'Senior PM at Amazon')
    expect(prompt).toContain('1')
  })

  it('includes user background', () => {
    const prompt = buildPlaybookPrompt('Google', 1, 'Senior PM at Amazon, L6, Hyderabad')
    expect(prompt).toContain('Senior PM at Amazon')
  })

  it('Tier 2 prompt includes India-specific instructions', () => {
    const prompt = buildPlaybookPrompt('Swiggy', 2, 'Senior PM at Amazon')
    expect(prompt.toLowerCase()).toContain('india')
    expect(prompt).toContain('india_context')
    expect(prompt).toContain('comp_context_inr')
  })

  it('Tier 1 prompt includes Sai-specific Amazon angle instructions', () => {
    const prompt = buildPlaybookPrompt('Google', 1, 'Senior PM at Amazon')
    expect(prompt).toContain('SAI-SPECIFIC')
    expect(prompt).toContain('Amazon')
  })

  it('Tier 3 prompt does NOT include India-specific section', () => {
    const prompt = buildPlaybookPrompt('Salesforce', 3, 'Senior PM at Amazon')
    expect(prompt).not.toContain('INDIA-SPECIFIC CONTEXT REQUIRED')
  })

  it('Tier 2 prompt sets india_context and comp_context_inr as non-null in output schema', () => {
    const prompt = buildPlaybookPrompt('PhonePe', 2, 'Senior PM at Amazon')
    expect(prompt).not.toContain('"india_context": null')
    expect(prompt).not.toContain('"comp_context_inr": null')
  })

  it('Tier 1 prompt sets india_context as null in output schema', () => {
    const prompt = buildPlaybookPrompt('Microsoft', 1, 'Senior PM at Amazon')
    expect(prompt).toContain('"india_context": null')
    expect(prompt).toContain('"comp_context_inr": null')
  })
})
