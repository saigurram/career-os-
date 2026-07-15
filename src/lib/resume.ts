// Pure functions for resume builder logic.

export const RESUME_TRACKS = ['ops_platform', 'ai_data', 'enterprise_saas', 'base'] as const
export type ResumeTrack = typeof RESUME_TRACKS[number]

export const TRACK_LABELS: Record<ResumeTrack, string> = {
  ops_platform: 'Ops / Platform PM',
  ai_data: 'AI / Data PM',
  enterprise_saas: 'Enterprise SaaS PM',
  base: 'Base (Balanced)',
}

export const TRACK_DESCRIPTIONS: Record<ResumeTrack, string> = {
  ops_platform: 'Leads with Amazon Transportation, logistics at scale, 500M+ packages, platform vision, multi-team roadmaps',
  ai_data: 'Leads with GenAI work (Kiro, Amazon Q agents), real-time data systems, AI product decisions at PM depth',
  enterprise_saas: 'Leads with B2B stakeholder influence, cross-org delivery, roadmap ownership for 8+ downstream teams',
  base: 'Balanced across all dimensions. Use when no specific job tailoring has been applied.',
}

export const TRACK_ANGLES: Record<ResumeTrack, string[]> = {
  ops_platform: [
    'Led roadmap for services handling 500M+ packages annually',
    'Drove platform vision adopted by 8+ downstream teams',
    'Owned supply chain optimization at Amazon Transportation scale',
    'Defined APIs and platform contracts for multi-team dependency resolution',
  ],
  ai_data: [
    'Architected internal AI agents using Claude and Amazon Q integrations',
    'Built real-time data systems tracking 100+ KPIs at latency-sensitive scale',
    'Led GenAI product decisions — model selection, context management, prompt engineering at PM depth',
    'Drove 3X productivity gains through AI tooling adoption across the organization',
  ],
  enterprise_saas: [
    'Influenced decisions across 3+ partner teams without direct authority',
    'Owned product roadmap with 8+ downstream dependency teams',
    'Led VP-level reviews with consistent delivery against cross-org commitments',
    'Drove adoption of new algorithms across multiple stakeholder groups through data-led narrative',
  ],
  base: [
    'Senior PM (L6) at Amazon Transportation Services with 7+ years PM experience',
    'Built and shipped products at logistics scale — 500M+ packages annually',
    'Strong GenAI PM depth combined with domain expertise in ops and platform thinking',
    'Targeting Principal PM roles in Hyderabad — available for relocation',
  ],
}

export function getTrackLabel(track: ResumeTrack): string {
  return TRACK_LABELS[track]
}

export function getTrackDescription(track: ResumeTrack): string {
  return TRACK_DESCRIPTIONS[track]
}

export function selectBestTrackForJob(jdText: string): ResumeTrack {
  const text = jdText.toLowerCase()
  const scores: Record<ResumeTrack, number> = {
    ops_platform: 0,
    ai_data: 0,
    enterprise_saas: 0,
    base: 0,
  }

  // ops/platform signals
  if (text.includes('logistics') || text.includes('supply chain') || text.includes('operations')) scores.ops_platform += 3
  if (text.includes('platform') || text.includes('infrastructure') || text.includes('api')) scores.ops_platform += 2
  if (text.includes('transportation') || text.includes('fulfillment') || text.includes('last mile')) scores.ops_platform += 2

  // ai/data signals
  if (text.includes('ai') || text.includes('machine learning') || text.includes('llm')) scores.ai_data += 3
  if (text.includes('data') || text.includes('analytics') || text.includes('ml')) scores.ai_data += 2
  if (text.includes('genai') || text.includes('generative') || text.includes('nlp')) scores.ai_data += 2

  // enterprise saas signals
  if (text.includes('saas') || text.includes('b2b') || text.includes('enterprise')) scores.enterprise_saas += 3
  if (text.includes('stakeholder') || text.includes('cross-functional') || text.includes('partner')) scores.enterprise_saas += 2
  if (text.includes('roadmap') || text.includes('product strategy') || text.includes('go-to-market')) scores.enterprise_saas += 1

  const best = (Object.entries(scores) as [ResumeTrack, number][])
    .sort((a, b) => b[1] - a[1])[0]

  return best[1] > 0 ? best[0] : 'base'
}

export function buildTailoringPrompt(
  track: ResumeTrack,
  jdText: string,
  userBackground: string,
  storyTitles: string[]
): { systemPrompt: string; userMessage: string } {
  const trackAngles = TRACK_ANGLES[track].join('\n')
  const storiesSection = storyTitles.length > 0
    ? `Available story bank entries: ${storyTitles.slice(0, 5).join(', ')}`
    : 'No story bank entries yet'

  const systemPrompt = `You are CareerOS, helping a Senior PM tailor their resume for a specific job application.

LANGUAGE RULES — ABSOLUTE:
- Owner language only: led, drove, built, defined, owned, architected, launched
- NEVER: helped, supported, assisted, contributed to, collaborated on

NDA RULES — ABSOLUTE:
- NEVER use: Falcon, Vega, DEFCON, Turbo Merge (operational details)
- Use generic descriptions: "container consolidation program", "computer vision platform", etc.

AUTHENTICITY RULES — NEVER generate:
- "Passionate about" / "thought leader" / "game-changing" / "transformative"
- Unsubstantiated superlatives without impact numbers
- Vague claims without specifics

OUTPUT FORMAT: Respond ONLY with valid JSON. No markdown. No extra keys.
{
  "summary": "<3-sentence professional summary, owner framing, specific to this track and JD>",
  "achievements": [
    "<achievement 1: led X, drove Y, impact Z — with specific number>",
    "<achievement 2: owned X, resulted in Y — specific>",
    "<achievement 3: architected X, enabling Y — specific>"
  ],
  "skills_section": "<comma-separated list of 8-10 relevant skills, prioritized for this JD>",
  "tailoring_note": "<one sentence: what you changed vs the base version and why it fits this JD>"
}`

  const userMessage = `Tailor resume for track: ${TRACK_LABELS[track]}

USER BACKGROUND:
${userBackground}

TRACK ANGLES TO LEAD WITH:
${trackAngles}

${storiesSection}

JOB DESCRIPTION:
${jdText.slice(0, 1500)}

Generate a tailored resume section using owner language throughout. Impact numbers required in every achievement bullet. NDA-clean — no internal Amazon names.`

  return { systemPrompt, userMessage }
}

export function isNdaSafeForResume(text: string): boolean {
  const banned = /\b(falcon|vega|defcon|turbo\s*merge)\b/i
  return !banned.test(text)
}
