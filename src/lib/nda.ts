export interface BlockedNameEntry {
  internal_name: string
  generic_replacement: string
  safe_for_external: boolean
}

export interface SubstitutionResult {
  output: string
  substitutions: string[]
}

export function substituteBlockedNames(
  text: string,
  blockedNames: BlockedNameEntry[]
): SubstitutionResult {
  let output = text
  const substitutions: string[] = []

  for (const entry of blockedNames) {
    if (entry.safe_for_external) continue
    const regex = new RegExp(entry.internal_name, 'gi')
    if (regex.test(output)) {
      output = output.replace(new RegExp(entry.internal_name, 'gi'), entry.generic_replacement)
      substitutions.push(`${entry.internal_name} → ${entry.generic_replacement}`)
    }
  }

  return { output, substitutions }
}

export function hasBlockedNames(text: string, blockedNames: BlockedNameEntry[]): boolean {
  return blockedNames
    .filter(e => !e.safe_for_external)
    .some(e => new RegExp(e.internal_name, 'gi').test(text))
}

export const SEEDED_BLOCKED_NAMES: BlockedNameEntry[] = [
  {
    internal_name: 'Falcon',
    generic_replacement: 'computer vision and edge computing platform for real-time fill rate optimization',
    safe_for_external: false,
  },
  {
    internal_name: 'Vega',
    generic_replacement: 'micro-fulfillment platform extending sort center order cutoff and throughput',
    safe_for_external: false,
  },
  {
    internal_name: 'DEFCON',
    generic_replacement: 'AR-assisted dual-side package handling automation system',
    safe_for_external: false,
  },
  {
    internal_name: 'Turbo Merge',
    generic_replacement: 'container consolidation program',
    safe_for_external: false,
  },
]
