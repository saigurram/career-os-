import { describe, it, expect } from 'vitest'
import {
  substituteBlockedNames,
  hasBlockedNames,
  SEEDED_BLOCKED_NAMES,
  type BlockedNameEntry,
} from '@/lib/nda'

// NDA substitution tests (lib/nda.ts)
describe('substituteBlockedNames', () => {
  it('replaces Falcon with generic replacement', () => {
    const { output, substitutions } = substituteBlockedNames(
      'I built Falcon to optimize fill rates.',
      SEEDED_BLOCKED_NAMES
    )
    expect(output).not.toContain('Falcon')
    expect(output).toContain('computer vision and edge computing platform')
    expect(substitutions).toHaveLength(1)
  })

  it('replaces Vega with generic replacement', () => {
    const { output } = substituteBlockedNames(
      'Vega extended order cutoff at 83 sort centers.',
      SEEDED_BLOCKED_NAMES
    )
    expect(output).not.toContain('Vega')
    expect(output).toContain('micro-fulfillment platform')
  })

  it('replaces DEFCON with generic replacement', () => {
    const { output } = substituteBlockedNames('DEFCON improved handling accuracy.', SEEDED_BLOCKED_NAMES)
    expect(output).not.toContain('DEFCON')
    expect(output).toContain('AR-assisted')
  })

  it('replaces Turbo Merge with generic replacement', () => {
    const { output } = substituteBlockedNames('Turbo Merge improved container utilization.', SEEDED_BLOCKED_NAMES)
    expect(output).not.toContain('Turbo Merge')
    expect(output).toContain('container consolidation')
  })

  it('is case-insensitive — catches falcon, FALCON, Falcon', () => {
    for (const variant of ['falcon', 'FALCON', 'Falcon']) {
      const { output } = substituteBlockedNames(`${variant} improved throughput`, SEEDED_BLOCKED_NAMES)
      expect(output.toLowerCase()).not.toContain('falcon')
    }
  })

  it('replaces ALL occurrences in a single string', () => {
    const { output } = substituteBlockedNames(
      'Falcon is great. We use Falcon daily.',
      SEEDED_BLOCKED_NAMES
    )
    expect(output).not.toContain('Falcon')
    expect(output.match(/computer vision and edge computing platform/g)).toHaveLength(2)
  })

  it('handles multiple blocked names in one string', () => {
    const { output, substitutions } = substituteBlockedNames(
      'I built Falcon and Vega at Amazon.',
      SEEDED_BLOCKED_NAMES
    )
    expect(output).not.toContain('Falcon')
    expect(output).not.toContain('Vega')
    expect(substitutions).toHaveLength(2)
  })

  it('does not modify clean text with no blocked names', () => {
    const input = 'I led a platform that improved efficiency by 40%.'
    const { output, substitutions } = substituteBlockedNames(input, SEEDED_BLOCKED_NAMES)
    expect(output).toBe(input)
    expect(substitutions).toHaveLength(0)
  })

  it('handles empty string input', () => {
    const { output } = substituteBlockedNames('', SEEDED_BLOCKED_NAMES)
    expect(output).toBe('')
  })

  it('does NOT replace a name marked safe_for_external', () => {
    const safeEntry: BlockedNameEntry[] = [{
      internal_name: 'TurboMerge',
      generic_replacement: 'consolidation program',
      safe_for_external: true,
    }]
    const { output } = substituteBlockedNames('We won an award for TurboMerge.', safeEntry)
    expect(output).toContain('TurboMerge')
  })

  it('returns empty substitutions array when no replacements made', () => {
    const { substitutions } = substituteBlockedNames('Clean text here.', SEEDED_BLOCKED_NAMES)
    expect(substitutions).toHaveLength(0)
  })

  it('substitution entries follow "internal → replacement" format', () => {
    const { substitutions } = substituteBlockedNames('I built Falcon at Amazon.', SEEDED_BLOCKED_NAMES)
    expect(substitutions[0]).toMatch(/Falcon.*→/)
  })
})

describe('hasBlockedNames', () => {
  it('returns true when text contains a blocked name', () => {
    expect(hasBlockedNames('I built Falcon.', SEEDED_BLOCKED_NAMES)).toBe(true)
  })

  it('returns false when text has no blocked names', () => {
    expect(hasBlockedNames('I built a vision platform.', SEEDED_BLOCKED_NAMES)).toBe(false)
  })

  it('is case-insensitive', () => {
    expect(hasBlockedNames('falcon is fast', SEEDED_BLOCKED_NAMES)).toBe(true)
  })

  it('ignores safe_for_external entries', () => {
    const safeOnly: BlockedNameEntry[] = [{
      internal_name: 'SafeName',
      generic_replacement: 'replacement',
      safe_for_external: true,
    }]
    expect(hasBlockedNames('I used SafeName here.', safeOnly)).toBe(false)
  })

  it('returns false for empty text', () => {
    expect(hasBlockedNames('', SEEDED_BLOCKED_NAMES)).toBe(false)
  })

  it('detects Vega', () => {
    expect(hasBlockedNames('Vega launched in 83 sort centers.', SEEDED_BLOCKED_NAMES)).toBe(true)
  })
})

// Story owner framing score thresholds
describe('owner framing score thresholds', () => {
  function ownerFramingColorLabel(score: number | null): string {
    if (score === null) return 'unreviewed'
    if (score >= 80) return 'strong'
    if (score >= 60) return 'needs-work'
    return 'poor'
  }

  it('90 is strong framing', () => {
    expect(ownerFramingColorLabel(90)).toBe('strong')
  })

  it('80 is strong framing (boundary)', () => {
    expect(ownerFramingColorLabel(80)).toBe('strong')
  })

  it('79 is needs-work', () => {
    expect(ownerFramingColorLabel(79)).toBe('needs-work')
  })

  it('60 is needs-work (boundary)', () => {
    expect(ownerFramingColorLabel(60)).toBe('needs-work')
  })

  it('59 is poor', () => {
    expect(ownerFramingColorLabel(59)).toBe('poor')
  })

  it('null is unreviewed', () => {
    expect(ownerFramingColorLabel(null)).toBe('unreviewed')
  })

  it('0 is poor', () => {
    expect(ownerFramingColorLabel(0)).toBe('poor')
  })
})

describe('NDA seeded names', () => {
  it('has 4 seeded entries', () => {
    expect(SEEDED_BLOCKED_NAMES).toHaveLength(4)
  })

  it('all seeded names are marked not safe_for_external', () => {
    SEEDED_BLOCKED_NAMES.forEach(e => {
      expect(e.safe_for_external).toBe(false)
    })
  })

  it('all seeded names have non-empty generic_replacement', () => {
    SEEDED_BLOCKED_NAMES.forEach(e => {
      expect(e.generic_replacement.length).toBeGreaterThan(10)
    })
  })

  it('covers Falcon, Vega, DEFCON, Turbo Merge', () => {
    const names = SEEDED_BLOCKED_NAMES.map(e => e.internal_name)
    expect(names).toContain('Falcon')
    expect(names).toContain('Vega')
    expect(names).toContain('DEFCON')
    expect(names).toContain('Turbo Merge')
  })
})
