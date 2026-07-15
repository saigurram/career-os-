import { describe, it, expect } from 'vitest'

// NDA substitution logic — mirrors what Claude Code should build in lib/nda.ts
function substituteBlockedNames(
  text: string,
  blockedNames: Array<{ internal_name: string; generic_replacement: string; safe_for_external: boolean }>
): { output: string; substitutions: string[] } {
  let output = text
  const substitutions: string[] = []

  for (const entry of blockedNames) {
    const regex = new RegExp(entry.internal_name, 'gi')
    if (regex.test(output) && !entry.safe_for_external) {
      output = output.replace(regex, entry.generic_replacement)
      substitutions.push(`${entry.internal_name} → ${entry.generic_replacement}`)
    }
  }

  return { output, substitutions }
}

const SEEDED_BLOCKED_NAMES = [
  { internal_name: 'Falcon', generic_replacement: 'computer vision and edge computing platform for real-time fill rate optimization', safe_for_external: false },
  { internal_name: 'Vega', generic_replacement: 'micro-fulfillment platform extending sort center order cutoff and throughput', safe_for_external: false },
  { internal_name: 'DEFCON', generic_replacement: 'AR-assisted dual-side package handling automation system', safe_for_external: false },
  { internal_name: 'Turbo Merge', generic_replacement: 'container consolidation program', safe_for_external: false },
]

describe('NDA substitution', () => {
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
      'Vega extended order cutoff time at 83 sort centers.',
      SEEDED_BLOCKED_NAMES
    )
    expect(output).not.toContain('Vega')
    expect(output).toContain('micro-fulfillment platform')
  })

  it('is case-insensitive — catches falcon, FALCON, Falcon', () => {
    const inputs = ['falcon improved throughput', 'FALCON improved throughput', 'Falcon improved throughput']
    for (const input of inputs) {
      const { output } = substituteBlockedNames(input, SEEDED_BLOCKED_NAMES)
      expect(output.toLowerCase()).not.toContain('falcon')
    }
  })

  it('replaces all occurrences in a single string', () => {
    const { output } = substituteBlockedNames(
      'Falcon is great. We use Falcon daily.',
      SEEDED_BLOCKED_NAMES
    )
    expect(output).not.toContain('Falcon')
    expect(output.match(/computer vision and edge computing platform/g)).toHaveLength(2)
  })

  it('handles multiple different blocked names in one string', () => {
    const { output, substitutions } = substituteBlockedNames(
      'I built Falcon and Vega at Amazon.',
      SEEDED_BLOCKED_NAMES
    )
    expect(output).not.toContain('Falcon')
    expect(output).not.toContain('Vega')
    expect(substitutions).toHaveLength(2)
  })

  it('does not modify text with no blocked names', () => {
    const input = 'I led a platform that improved efficiency by 40%.'
    const { output, substitutions } = substituteBlockedNames(input, SEEDED_BLOCKED_NAMES)
    expect(output).toBe(input)
    expect(substitutions).toHaveLength(0)
  })

  it('handles empty string input', () => {
    const { output } = substituteBlockedNames('', SEEDED_BLOCKED_NAMES)
    expect(output).toBe('')
  })

  it('does not replace a name marked safe_for_external', () => {
    const safeEntry = [{ internal_name: 'TurboMerge', generic_replacement: 'consolidation program', safe_for_external: true }]
    const { output } = substituteBlockedNames('We won an award for TurboMerge.', safeEntry)
    expect(output).toContain('TurboMerge')
  })
})
