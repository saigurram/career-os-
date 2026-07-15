import { describe, it, expect } from 'vitest'
import { extractDomain, buildLinkedInSearchUrl, hasNdaRisk, parseGeneratedContent } from '@/lib/claude'
import type { GeneratedUnitContent } from '@/lib/claude'

// ─── extractDomain ────────────────────────────────────────────────────────────

describe('extractDomain', () => {
  it('returns hostname for a standard URL', () => {
    expect(extractDomain('https://arxiv.org/abs/1706.03762')).toBe('arxiv.org')
  })

  it('strips www. prefix', () => {
    expect(extractDomain('https://www.youtube.com/watch?v=abc123')).toBe('youtube.com')
  })

  it('handles URLs with paths and query strings', () => {
    expect(extractDomain('https://hbr.org/2024/01/some-article?ref=home')).toBe('hbr.org')
  })

  it('returns subdomains that are not www', () => {
    expect(extractDomain('https://research.google.com/blog/foo')).toBe('research.google.com')
  })

  it('returns the raw string when input is not a valid URL', () => {
    expect(extractDomain('not-a-url')).toBe('not-a-url')
  })

  it('returns empty string for empty input', () => {
    expect(extractDomain('')).toBe('')
  })
})

// ─── buildLinkedInSearchUrl ───────────────────────────────────────────────────

describe('buildLinkedInSearchUrl', () => {
  it('returns a LinkedIn people search URL', () => {
    const url = buildLinkedInSearchUrl('Senior PM at Flipkart working on logistics')
    expect(url).toContain('linkedin.com/search/results/people/')
  })

  it('URL-encodes the keyword string', () => {
    const url = buildLinkedInSearchUrl('Principal Product Manager')
    expect(url).toContain('keywords=')
    expect(url).not.toContain(' ')
  })

  it('uses only words longer than 4 characters', () => {
    // short words like "at", "on", "PM" should be filtered
    const url = buildLinkedInSearchUrl('PM at go Flipkart search ranking')
    expect(url).toContain('Flipkart')
    expect(url).toContain('search')
    expect(url).toContain('ranking')
    // "at" and "go" are ≤4 chars, should be excluded
    const keywords = decodeURIComponent(url.split('keywords=')[1])
    const words = keywords.split(' ')
    words.forEach(w => expect(w.length).toBeGreaterThan(4))
  })

  it('caps at 5 keywords', () => {
    const url = buildLinkedInSearchUrl('Principal Product Manager Marketplace Dispatch Routing Algorithm Optimization')
    const keywords = decodeURIComponent(url.split('keywords=')[1])
    expect(keywords.split(' ').length).toBeLessThanOrEqual(5)
  })

  it('handles empty criteria gracefully', () => {
    const url = buildLinkedInSearchUrl('')
    expect(url).toContain('linkedin.com')
  })
})

// ─── hasNdaRisk ───────────────────────────────────────────────────────────────

describe('hasNdaRisk', () => {
  it('detects "falcon" (lowercase)', () => {
    expect(hasNdaRisk('we used falcon for CV inference')).toBe(true)
  })

  it('detects "Falcon" (capitalized)', () => {
    expect(hasNdaRisk('Falcon is our internal CV platform')).toBe(true)
  })

  it('detects "vega"', () => {
    expect(hasNdaRisk('vega handles the data pipeline')).toBe(true)
  })

  it('detects "DEFCON"', () => {
    expect(hasNdaRisk('we ran DEFCON simulations before launch')).toBe(true)
  })

  it('detects "Turbo Merge"', () => {
    expect(hasNdaRisk('used Turbo Merge for the release')).toBe(true)
  })

  it('detects "turbomerge" (no space)', () => {
    expect(hasNdaRisk('turbomerge was the tool')).toBe(true)
  })

  it('detects "internal"', () => {
    expect(hasNdaRisk('this is based on an internal tool')).toBe(true)
  })

  it('detects "confidential"', () => {
    expect(hasNdaRisk('this contains confidential information')).toBe(true)
  })

  it('detects "code name"', () => {
    expect(hasNdaRisk('the code name was redacted')).toBe(true)
  })

  it('returns false for clean, external-safe text', () => {
    expect(hasNdaRisk('Write a LinkedIn post about transformer-based search ranking')).toBe(false)
  })

  it('returns false for empty string', () => {
    expect(hasNdaRisk('')).toBe(false)
  })
})

// ─── parseGeneratedContent — all 11 fields ────────────────────────────────────

const FULL_CONTENT: GeneratedUnitContent = {
  learn_resource_title: 'Attention Is All You Need',
  learn_resource_url: 'https://www.youtube.com/results?search_query=attention+transformers+PM',
  learn_resource_format: 'Video',
  learn_resource_minutes: 12,
  learn_why: 'Understanding attention mechanisms lets you scope transformer-based features accurately.',
  learn_prompt: 'While watching, focus on: what the attention mechanism does and one PM-relevant implication.',
  create_task: 'Write a 150-word LinkedIn post explaining transformers for a PM audience.',
  create_type: 'linkedin_post',
  create_opening_line: 'I asked our AI feature to read six months of data. It confidently answered about week one.',
  create_good_looks_like: 'Strong: Names a concrete product decision and explains the PM implication.\nWeak: Explains transformers generically with no actionable PM insight.',
  create_nda_note: '',
  outreach_who: 'Connect with a PM at Uber Hyderabad who works on dispatch or marketplace ML systems.',
  outreach_linkedin_search: 'Principal PM Uber Hyderabad dispatch ML',
  outreach_message_draft: 'Hi [Name], I saw your talk on dispatch ML and it aligns with transformer research I\'ve been doing. I built a LinkedIn post explaining attention for PMs and would love your feedback. Would you be open to a 20-minute call? Totally fine if timing doesn\'t work.',
  ai_concept_name: 'How LLMs work (tokens, context windows, attention)',
  reflect_question: 'What is one decision you would change if you had understood transformers 12 months earlier?',
}

describe('parseGeneratedContent — full 16-field schema', () => {
  it('returns non-null for a complete valid object', () => {
    expect(parseGeneratedContent(FULL_CONTENT)).not.toBeNull()
  })

  it('maps all 11 fields correctly', () => {
    const result = parseGeneratedContent(FULL_CONTENT)
    expect(result?.learn_why).toBe(FULL_CONTENT.learn_why)
    expect(result?.create_good_looks_like).toBe(FULL_CONTENT.create_good_looks_like)
    expect(result?.outreach_message_draft).toBe(FULL_CONTENT.outreach_message_draft)
    expect(result?.learn_resource_title).toBe(FULL_CONTENT.learn_resource_title)
    expect(result?.reflect_question).toBe(FULL_CONTENT.reflect_question)
  })

  it('returns null when learn_why is missing', () => {
    const { learn_why: _, ...without } = FULL_CONTENT
    expect(parseGeneratedContent(without)).toBeNull()
  })

  it('returns null when create_good_looks_like is missing', () => {
    const { create_good_looks_like: _, ...without } = FULL_CONTENT
    expect(parseGeneratedContent(without)).toBeNull()
  })

  it('returns null when outreach_message_draft is missing', () => {
    const { outreach_message_draft: _, ...without } = FULL_CONTENT
    expect(parseGeneratedContent(without)).toBeNull()
  })

  it('returns null when learn_why is empty string', () => {
    expect(parseGeneratedContent({ ...FULL_CONTENT, learn_why: '' })).toBeNull()
  })

  it('returns null when create_good_looks_like is whitespace only', () => {
    expect(parseGeneratedContent({ ...FULL_CONTENT, create_good_looks_like: '   ' })).toBeNull()
  })

  it('returns null when outreach_message_draft is not a string', () => {
    expect(parseGeneratedContent({ ...FULL_CONTENT, outreach_message_draft: 42 })).toBeNull()
  })

  it('returns null for null input', () => {
    expect(parseGeneratedContent(null)).toBeNull()
  })

  it('returns null for non-object input', () => {
    expect(parseGeneratedContent('string')).toBeNull()
    expect(parseGeneratedContent(42)).toBeNull()
    expect(parseGeneratedContent([])).toBeNull()
  })

  it('returns null when ai_concept_name is missing', () => {
    const { ai_concept_name: _, ...without } = FULL_CONTENT
    expect(parseGeneratedContent(without)).toBeNull()
  })
})
