import { describe, it, expect } from 'vitest'
import Anthropic from '@anthropic-ai/sdk'

// These evals call the REAL Claude API — run with ANTHROPIC_API_KEY set
// Run: ANTHROPIC_API_KEY=xxx vitest run src/__tests__/evals

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const NDA_BLOCKED_NAMES = ['Falcon', 'Vega', 'DEFCON', 'Turbo Merge']
const CONTRIBUTOR_WORDS = ['helped', 'supported', 'assisted', 'contributed to', 'collaborated on']
const BANNED_PHRASES = ['passionate about', 'thought leader', 'game-changing', 'excited to share', 'humbled and honored']

async function runCareerOSPrompt(userPrompt: string): Promise<string> {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1000,
    system: `You are CareerOS, a career coach for a Senior PM at Amazon targeting Principal PM roles in Hyderabad.

HARD RULES — violating any of these is a critical failure:

1. BANNED PRODUCT NAMES: The following words must NEVER appear anywhere in your response — not in quotes, not in parentheses, not in examples of substitution, not in meta-commentary about what you replaced. If you replaced a name, say "the restricted product" without naming it. Banned: ${NDA_BLOCKED_NAMES.join(', ')}.

2. BANNED CONTRIBUTOR LANGUAGE: Never use these words to describe someone's own actions: ${CONTRIBUTOR_WORDS.join(', ')}. Use owner verbs: led, built, drove, owned, shipped, designed.

3. BANNED PHRASES: Never write: ${BANNED_PHRASES.join(', ')}. These are clichés that undermine credibility.

4. COMPENSATION: All compensation must be in INR (₹, lakhs, crores). Never use USD or $.

5. ROLES: Only reference roles above Senior PM level (Lead PM, Staff PM, Principal PM, Director PM or higher).`,
    messages: [{ role: 'user', content: userPrompt }],
  })

  return response.content[0].type === 'text' ? response.content[0].text : ''
}

function evalOutput(output: string): {
  nda_safe: boolean
  owner_language: boolean
  authentic: boolean
  violations: string[]
} {
  const violations: string[] = []

  // NDA check
  const ndaSafe = !NDA_BLOCKED_NAMES.some(name => {
    const found = new RegExp(name, 'gi').test(output)
    if (found) violations.push(`NDA violation: "${name}" found in output`)
    return found
  })

  // Owner language check
  const ownerLanguage = !CONTRIBUTOR_WORDS.some(word => {
    const found = new RegExp(`\\b${word}\\b`, 'gi').test(output)
    if (found) violations.push(`Contributor language: "${word}" found in output`)
    return found
  })

  // Authenticity check
  const authentic = !BANNED_PHRASES.some(phrase => {
    const found = new RegExp(phrase, 'gi').test(output)
    if (found) violations.push(`Banned phrase: "${phrase}" found in output`)
    return found
  })

  return { nda_safe: ndaSafe, owner_language: ownerLanguage, authentic, violations }
}

describe('CareerOS Claude API evals', () => {
  it('EVAL: LinkedIn post about AI productivity does not use banned phrases', async () => {
    const output = await runCareerOSPrompt(
      'Write a LinkedIn post about how I used AI agents to 3X my productivity as a PM at Amazon. Keep it authentic and specific.'
    )
    const { violations } = evalOutput(output)
    console.log('Output:', output.slice(0, 200))
    console.log('Violations:', violations)
    expect(violations).toHaveLength(0)
  }, 30000)

  it('EVAL: Output never uses Falcon or Vega even when prompted to describe my work', async () => {
    const output = await runCareerOSPrompt(
      'Write a brief description of my work at Amazon for a portfolio page. I built Falcon and Vega.'
    )
    const { nda_safe, violations } = evalOutput(output)
    console.log('Output:', output.slice(0, 300))
    console.log('Violations:', violations)
    expect(nda_safe).toBe(true)
  }, 30000)

  it('EVAL: Outreach message draft uses owner language not contributor language', async () => {
    const output = await runCareerOSPrompt(
      'Draft a LinkedIn outreach message to a Senior PM at Uber Hyderabad. I want to learn about their operations platform work.'
    )
    const { owner_language, violations } = evalOutput(output)
    console.log('Output:', output.slice(0, 300))
    console.log('Violations:', violations)
    expect(owner_language).toBe(true)
  }, 30000)

  it('EVAL: Comp benchmarks are in INR not USD', async () => {
    const output = await runCareerOSPrompt(
      'What comp should I expect for a Lead PM role at Uber in Hyderabad?'
    )
    console.log('Output:', output.slice(0, 300))
    // Should contain ₹ or crore or lakh, should NOT contain $ or USD
    expect(output).toMatch(/₹|crore|lakh|INR/i)
    expect(output).not.toMatch(/\$\d|\bUSD\b|\$[0-9]/)
  }, 30000)

  it('EVAL: Interview feedback flags contributor language in user answer', async () => {
    const output = await runCareerOSPrompt(
      `I just answered this interview question: "Tell me about a time you drove a major initiative."
      My answer was: "I helped the team ship a container optimization feature that saved costs."
      Please give me feedback on my answer.`
    )
    console.log('Output:', output.slice(0, 400))
    // Claude should flag "helped" as contributor language
    expect(output.toLowerCase()).toMatch(/helped|contributor|owner|led|drove/)
  }, 30000)

  it('EVAL: Curriculum content references a real, specific resource (not generic topic)', async () => {
    const output = await runCareerOSPrompt(
      `Generate Week 1 curriculum content for a Senior PM learning about GenAI.
      The Learn resource must be a specific named article, talk, or paper with a URL or clear source.
      Return JSON: { "learn_resource_title": "", "learn_resource_url": "", "learn_prompt": "" }`
    )
    console.log('Output:', output.slice(0, 400))
    // Should contain a URL or specific source
    expect(output).toMatch(/http|\.com|substack|youtube|github/i)
  }, 30000)
})
