import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  nextStatus,
  isFollowUpDue,
  daysSinceSent,
  validateOutreachMessage,
  STATUS_ORDER,
  STATUS_LABELS,
  STATUS_COLORS,
} from '@/lib/outreach'

describe('nextStatus', () => {
  it('drafted → sent', () => {
    expect(nextStatus('drafted')).toBe('sent')
  })

  it('sent → replied', () => {
    expect(nextStatus('sent')).toBe('replied')
  })

  it('replied → meeting_set', () => {
    expect(nextStatus('replied')).toBe('meeting_set')
  })

  it('meeting_set → closed', () => {
    expect(nextStatus('meeting_set')).toBe('closed')
  })

  it('closed → null (terminal state)', () => {
    expect(nextStatus('closed')).toBeNull()
  })

  it('STATUS_ORDER covers all statuses', () => {
    expect(STATUS_ORDER).toHaveLength(5)
    expect(STATUS_ORDER[0]).toBe('drafted')
    expect(STATUS_ORDER[STATUS_ORDER.length - 1]).toBe('closed')
  })
})

describe('isFollowUpDue', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-10T12:00:00Z'))
  })
  afterEach(() => { vi.useRealTimers() })

  it('returns false for null sentAt', () => {
    expect(isFollowUpDue(null)).toBe(false)
  })

  it('returns false if sent less than 7 days ago', () => {
    const sentAt = new Date('2026-06-05T12:00:00Z').toISOString() // 5 days ago
    expect(isFollowUpDue(sentAt)).toBe(false)
  })

  it('returns true if sent exactly 7 days ago', () => {
    const sentAt = new Date('2026-06-03T12:00:00Z').toISOString() // 7 days ago
    expect(isFollowUpDue(sentAt)).toBe(true)
  })

  it('returns true if sent more than 7 days ago', () => {
    const sentAt = new Date('2026-05-01T12:00:00Z').toISOString() // 40 days ago
    expect(isFollowUpDue(sentAt)).toBe(true)
  })
})

describe('daysSinceSent', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-10T12:00:00Z'))
  })
  afterEach(() => { vi.useRealTimers() })

  it('returns null for null sentAt', () => {
    expect(daysSinceSent(null)).toBeNull()
  })

  it('returns 0 for sent today', () => {
    const sentAt = new Date('2026-06-10T08:00:00Z').toISOString()
    expect(daysSinceSent(sentAt)).toBe(0)
  })

  it('returns 3 for sent 3 days ago', () => {
    const sentAt = new Date('2026-06-07T12:00:00Z').toISOString()
    expect(daysSinceSent(sentAt)).toBe(3)
  })

  it('returns a non-negative number', () => {
    const sentAt = new Date('2026-06-01T12:00:00Z').toISOString()
    expect(daysSinceSent(sentAt)).toBeGreaterThanOrEqual(0)
  })
})

describe('validateOutreachMessage', () => {
  it('passes a clean 4-sentence message', () => {
    const msg = `I read your post about Uber's dispatch optimization work in Hyderabad — the part about reducing pickup ETAs by 18% caught my attention.
I drove a similar real-time routing challenge at Amazon, building a platform that cut transportation costs by ₹12Cr annually.
I'm targeting Lead PM roles at Uber Hyderabad and think there's genuine overlap between what you've built and the problems I've been solving.
Would you be open to a 20-minute call in the next two weeks?`
    const { valid, violations } = validateOutreachMessage(msg)
    expect(valid).toBe(true)
    expect(violations).toHaveLength(0)
  })

  it('flags "pick your brain"', () => {
    const msg = "Hi, I'd love to pick your brain about your work at Uber."
    const { valid, violations } = validateOutreachMessage(msg)
    expect(valid).toBe(false)
    expect(violations.some(v => /pick your brain/i.test(v))).toBe(true)
  })

  it('flags contributor language: "helped"', () => {
    const msg = "I helped the team ship a logistics feature last year."
    const { valid, violations } = validateOutreachMessage(msg)
    expect(valid).toBe(false)
    expect(violations.some(v => /contributor/i.test(v))).toBe(true)
  })

  it('flags "passionate about"', () => {
    const msg = "I am passionate about AI and product management."
    const { valid, violations } = validateOutreachMessage(msg)
    expect(valid).toBe(false)
    expect(violations.some(v => /passionate/i.test(v))).toBe(true)
  })

  it('flags "excited to share"', () => {
    const msg = "I am excited to share my recent work with you."
    const { valid, violations } = validateOutreachMessage(msg)
    expect(valid).toBe(false)
    expect(violations.length).toBeGreaterThan(0)
  })

  it('flags message with more than 5 sentences', () => {
    const msg = [
      'Sentence one about their work.',
      'Sentence two about my work.',
      'Sentence three about why connect.',
      'Sentence four context.',
      'Sentence five more context.',
      'Sentence six the ask.',
    ].join(' ')
    const { valid, violations } = validateOutreachMessage(msg)
    expect(valid).toBe(false)
    expect(violations.some(v => /sentences/i.test(v))).toBe(true)
  })

  it('does not flag "contributed" in non-contributor context', () => {
    // "contributed to" is the banned pattern, not "contribution"
    const msg = `Your contribution to Uber's ops platform was noted.
I drove a similar initiative at Amazon.
I'm targeting Lead PM roles at Uber.
Would you have 20 minutes to connect?`
    const { valid } = validateOutreachMessage(msg)
    expect(valid).toBe(true)
  })
})

describe('STATUS_LABELS', () => {
  it('has a label for every status', () => {
    for (const status of STATUS_ORDER) {
      expect(STATUS_LABELS[status]).toBeTruthy()
    }
  })
})

describe('STATUS_COLORS', () => {
  it('has a color class for every status', () => {
    for (const status of STATUS_ORDER) {
      expect(STATUS_COLORS[status]).toBeTruthy()
    }
  })
})
