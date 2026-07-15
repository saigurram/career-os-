import type { CompanyTier } from '@/lib/interview-questions'

// ─── Company registry (names + tiers — never content, content is dynamic) ─────

export interface CompanyEntry {
  company: string
  tier: CompanyTier
  // Tier 2 only
  india_specific?: boolean
}

export const PLAYBOOK_COMPANIES: CompanyEntry[] = [
  // Tier 1 — 100+ questions, full playbook
  { company: 'Google', tier: 1 },
  { company: 'Uber', tier: 1 },
  { company: 'Microsoft', tier: 1 },
  { company: 'Experian', tier: 1 },
  { company: 'ServiceNow', tier: 1 },
  { company: 'Amazon L7', tier: 1 },
  // Tier 2 — 60+ questions, India-specific context
  { company: 'Flipkart', tier: 2, india_specific: true },
  { company: 'PhonePe', tier: 2, india_specific: true },
  { company: 'Swiggy', tier: 2, india_specific: true },
  { company: 'Zomato', tier: 2, india_specific: true },
  { company: 'CRED', tier: 2, india_specific: true },
  { company: 'Meesho', tier: 2, india_specific: true },
  { company: 'Razorpay', tier: 2, india_specific: true },
  // Tier 3 — 30+ questions, basic playbook
  { company: 'Salesforce', tier: 3 },
  { company: 'SAP', tier: 3 },
  { company: 'Oracle', tier: 3 },
  { company: 'Freshworks', tier: 3 },
  { company: 'PayPal', tier: 3 },
  { company: 'InMobi', tier: 3 },
] as const

export function getCompanyEntry(company: string): CompanyEntry | undefined {
  return PLAYBOOK_COMPANIES.find(c => c.company === company)
}

export function getCompaniesByTier(tier: CompanyTier): CompanyEntry[] {
  return PLAYBOOK_COMPANIES.filter(c => c.tier === tier)
}

// ─── Playbook shape ───────────────────────────────────────────────────────────

export interface CompanyPlaybook {
  company: string
  tier: CompanyTier
  interview_format: string
  what_they_test: string
  common_mistakes: string
  insider_tips: string
  user_specific_angle: string
  india_context: string | null
  comp_context_inr: string | null
  generated_at: string
}

export function validatePlaybook(p: unknown): p is CompanyPlaybook {
  if (!p || typeof p !== 'object') return false
  const r = p as unknown as Record<string, unknown>
  const requiredStrings = ['company', 'interview_format', 'what_they_test',
    'common_mistakes', 'insider_tips', 'user_specific_angle', 'generated_at']
  for (const field of requiredStrings) {
    if (typeof r[field] !== 'string' || !(r[field] as string).trim()) return false
  }
  if (typeof r.tier !== 'number' || ![1, 2, 3].includes(r.tier as number)) return false
  return true
}

export function parseGeneratedPlaybook(raw: unknown): CompanyPlaybook | null {
  if (!validatePlaybook(raw)) return null
  const r = raw as unknown as Record<string, unknown>
  return {
    company: r.company as string,
    tier: r.tier as CompanyTier,
    interview_format: r.interview_format as string,
    what_they_test: r.what_they_test as string,
    common_mistakes: r.common_mistakes as string,
    insider_tips: r.insider_tips as string,
    user_specific_angle: r.user_specific_angle as string,
    india_context: typeof r.india_context === 'string' ? r.india_context : null,
    comp_context_inr: typeof r.comp_context_inr === 'string' ? r.comp_context_inr : null,
    generated_at: r.generated_at as string,
  }
}

// ─── Freshness check ──────────────────────────────────────────────────────────

export function shouldRegeneratePlaybook(
  generatedAt: string | null,
  maxAgeDays = 30
): boolean {
  if (!generatedAt) return true
  const age = Date.now() - new Date(generatedAt).getTime()
  return age > maxAgeDays * 24 * 60 * 60 * 1000
}

// ─── Prompt builder ───────────────────────────────────────────────────────────

export function buildPlaybookPrompt(
  company: string,
  tier: CompanyTier,
  userBackground: string
): string {
  const entry = getCompanyEntry(company)
  const isIndiaStartup = entry?.india_specific ?? false

  const indiaSection = isIndiaStartup ? `
INDIA-SPECIFIC CONTEXT REQUIRED:
- Interview style at ${company}: faster, less structured than Big Tech. Describe the actual process.
- Speed vs process trade-offs: how does ${company}'s PM culture balance velocity against rigor?
- Growth stage context: what problems are PMs actually solving there right now?
- Compensation context (INR, Hyderabad market, Principal PM level): include current realistic ranges.
- Include this in the "india_context" and "comp_context_inr" fields.` : ''

  const amazonAngle = tier === 1 ? `
SAI-SPECIFIC ANGLE REQUIRED:
The user is a Senior PM at Amazon (L6, Hyderabad, Transportation Services / logistics ops domain).
In "user_specific_angle", explain:
- How her Amazon logistics/ops background maps to ${company}'s domain and problems
- Which of her experiences (dispatch optimization, sort center ops, supply chain) are most relevant
- What she should lead with, and what gaps she needs to address before interviewing here` : ''

  return `You are a senior tech recruiter and PM hiring expert. Generate a comprehensive interview playbook for ${company} targeted at a Senior PM (Amazon L6) preparing for Principal PM roles in Hyderabad.

Search your knowledge for the most current interview patterns, Glassdoor reports, and PM community posts about ${company} PM interviews in 2025-2026.

${userBackground}${indiaSection}${amazonAngle}

OUTPUT: Respond with valid JSON only — no markdown:
{
  "company": "${company}",
  "tier": ${tier},
  "interview_format": "<rounds, timing, structure — be specific about number of rounds and what each tests>",
  "what_they_test": "<what ${company} specifically evaluates in PM interviews — differs from generic PM interviews>",
  "common_mistakes": "<the top 3-4 mistakes PM candidates make at ${company} specifically>",
  "insider_tips": "<culture signals, what they value, how to stand out — things not in official job postings>",
  "user_specific_angle": "<how Sai's Amazon background maps to ${company}'s domain — specific and actionable>",
  "india_context": ${isIndiaStartup ? '"<India-specific interview culture, speed vs process, growth stage context>"' : 'null'},
  "comp_context_inr": ${isIndiaStartup ? '"<current realistic INR comp range for Principal PM level at this company in Hyderabad>"' : 'null'},
  "generated_at": "${new Date().toISOString()}"
}`
}
