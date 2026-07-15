import type { BlockedNameEntry } from '@/lib/nda'

export const CAREEROS_RULES = `You are CareerOS, a senior career coach for a Senior PM at Amazon (L6, Hyderabad) targeting Principal PM roles.

LANGUAGE RULES — ALWAYS:
- Owner language only: led, drove, built, defined, owned, architected, launched
- NEVER: helped, supported, assisted, contributed to, collaborated on (unless describing someone else's work)

JOB RULES — ALWAYS:
- Only suggest/show roles at or above Senior PM level (Lead PM, Staff PM, Principal PM, or higher)
- Only show roles at or above Amazon L6 Hyderabad comp (floor ₹80L/year)
- Hyderabad OR remote only — never suggest relocation to Bangalore or other cities
- All comp in INR, Hyderabad-market specific — never USD, never US market benchmarks

AUTHENTICITY RULES — NEVER generate:
- "Passionate about" / "thought leader" / "game-changing" / "transformative"
- "I'm excited to share" / "humbled and honored"
- "In today's fast-paced world" or any sentence anyone else could have written
- Unsubstantiated superlatives or vague impact claims
- Numbered lists for everything or "First... Second... In conclusion..." structure

CURRICULUM RULES:
- Never hardcode curriculum content — always generate fresh based on current inputs
- Always check feature_flags before assigning tasks that require app features
- Always pull from uncovered AI concepts list when selecting the week's concept
- Always check active job feed for skills to prioritize`

export function buildSystemPrompt(
  userName: string,
  currentCompany: string,
  targetLevel: string,
  blockedNames: BlockedNameEntry[]
): string {
  const ndaSection = blockedNames.length > 0
    ? `\nNDA RULES — NEVER include in external outputs:\n${blockedNames
        .filter(b => !b.safe_for_external)
        .map(b => `- "${b.internal_name}" → replace with "${b.generic_replacement}"`)
        .join('\n')}`
    : ''

  return `${CAREEROS_RULES}${ndaSection}

Current user: ${userName}, ${currentCompany}, targeting ${targetLevel} in Hyderabad by June 2027.`
}

// Pillar rotation: 6 pillars, rotate every 6 units
export const CURRICULUM_PILLARS = [
  'GenAI & AI concepts',
  'Platform & Principal PM thinking',
  'Executive communication & owner framing',
  'Hyderabad market & target company knowledge',
  'Interview readiness & story building',
  'Application materials & external visibility',
] as const

export type CurriculumPillar = typeof CURRICULUM_PILLARS[number]

export function getPillarForUnit(unitNumber: number): CurriculumPillar {
  const index = (unitNumber - 1) % CURRICULUM_PILLARS.length
  return CURRICULUM_PILLARS[index]
}

export interface GeneratedUnitContent {
  learn_resource_title: string
  learn_resource_url: string
  learn_resource_format: string        // 'Video' | 'Article' | 'Podcast'
  learn_resource_minutes: number
  learn_why: string
  learn_prompt: string
  create_task: string
  create_type: string
  create_opening_line: string
  create_good_looks_like: string
  create_nda_note: string              // empty string when no NDA risk
  outreach_who: string
  outreach_linkedin_search: string
  outreach_message_draft: string
  ai_concept_name: string
  reflect_question: string
}

// Non-empty string fields
const REQUIRED_STRING_FIELDS = [
  'learn_resource_title', 'learn_resource_url', 'learn_resource_format',
  'learn_why', 'learn_prompt',
  'create_task', 'create_type', 'create_opening_line', 'create_good_looks_like',
  'outreach_who', 'outreach_linkedin_search', 'outreach_message_draft',
  'ai_concept_name', 'reflect_question',
] as const

export function parseGeneratedContent(raw: unknown): GeneratedUnitContent | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const r = raw as Record<string, unknown>

  for (const field of REQUIRED_STRING_FIELDS) {
    if (typeof r[field] !== 'string' || !(r[field] as string).trim()) return null
  }
  // create_nda_note: must be a string but may be empty
  if (typeof r['create_nda_note'] !== 'string') return null
  // learn_resource_minutes: must be a number
  if (typeof r['learn_resource_minutes'] !== 'number') return null

  return {
    learn_resource_title: r.learn_resource_title as string,
    learn_resource_url: r.learn_resource_url as string,
    learn_resource_format: r.learn_resource_format as string,
    learn_resource_minutes: r.learn_resource_minutes as number,
    learn_why: r.learn_why as string,
    learn_prompt: r.learn_prompt as string,
    create_task: r.create_task as string,
    create_type: r.create_type as string,
    create_opening_line: r.create_opening_line as string,
    create_good_looks_like: r.create_good_looks_like as string,
    create_nda_note: r.create_nda_note as string,
    outreach_who: r.outreach_who as string,
    outreach_linkedin_search: r.outreach_linkedin_search as string,
    outreach_message_draft: r.outreach_message_draft as string,
    ai_concept_name: r.ai_concept_name as string,
    reflect_question: r.reflect_question as string,
  }
}

// ─── Display helpers (pure, testable) ────────────────────────────────────────

export function extractDomain(url: string): string {
  try {
    const { hostname } = new URL(url)
    return hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

export function buildLinkedInSearchUrl(criteria: string): string {
  const words = criteria
    .split(/\s+/)
    .filter(w => w.length > 4)
    .slice(0, 5)
    .join(' ')
  return `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(words)}`
}

export function hasNdaRisk(text: string): boolean {
  return /\b(falcon|vega|defcon|turbo\s?merge|internal|confidential|code\s?name)\b/i.test(text)
}
