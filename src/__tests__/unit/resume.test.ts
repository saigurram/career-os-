import { describe, it, expect } from 'vitest'
import {
  RESUME_TRACKS,
  TRACK_LABELS,
  TRACK_DESCRIPTIONS,
  getTrackLabel,
  getTrackDescription,
  selectBestTrackForJob,
  buildTailoringPrompt,
  isNdaSafeForResume,
  type ResumeTrack,
} from '@/lib/resume'

// ─── Track metadata ────────────────────────────────────────────────────────────

describe('RESUME_TRACKS', () => {
  it('has 4 tracks', () => {
    expect(RESUME_TRACKS).toHaveLength(4)
  })

  it('includes base as a track', () => {
    expect(RESUME_TRACKS).toContain('base')
  })

  it('has labels for every track', () => {
    for (const track of RESUME_TRACKS) {
      expect(TRACK_LABELS[track]).toBeTruthy()
    }
  })

  it('has descriptions for every track', () => {
    for (const track of RESUME_TRACKS) {
      expect(TRACK_DESCRIPTIONS[track]).toBeTruthy()
    }
  })
})

describe('getTrackLabel', () => {
  it('returns correct label for ops_platform', () => {
    expect(getTrackLabel('ops_platform')).toContain('Ops')
  })

  it('returns correct label for ai_data', () => {
    expect(getTrackLabel('ai_data')).toContain('AI')
  })

  it('returns Base for base track', () => {
    expect(getTrackLabel('base')).toContain('Base')
  })
})

describe('getTrackDescription', () => {
  it('ops_platform mentions Amazon Transportation or logistics', () => {
    const desc = getTrackDescription('ops_platform').toLowerCase()
    expect(desc).toMatch(/amazon|logistics|platform/)
  })

  it('ai_data mentions GenAI or AI', () => {
    const desc = getTrackDescription('ai_data').toLowerCase()
    expect(desc).toMatch(/genai|ai|data/)
  })
})

// ─── selectBestTrackForJob ─────────────────────────────────────────────────────

describe('selectBestTrackForJob', () => {
  it('selects ops_platform for logistics JD', () => {
    const jd = 'Senior PM for our logistics and supply chain platform team. Transportation and fulfillment experience required.'
    expect(selectBestTrackForJob(jd)).toBe('ops_platform')
  })

  it('selects ai_data for AI/ML JD', () => {
    const jd = 'Principal PM for our AI and machine learning platform. LLM and generative AI experience required. Data analytics background valued.'
    expect(selectBestTrackForJob(jd)).toBe('ai_data')
  })

  it('selects enterprise_saas for B2B SaaS JD', () => {
    const jd = 'Lead PM for enterprise SaaS platform. B2B product experience, stakeholder management, cross-functional roadmap ownership.'
    expect(selectBestTrackForJob(jd)).toBe('enterprise_saas')
  })

  it('returns base for generic/empty JD', () => {
    expect(selectBestTrackForJob('')).toBe('base')
    expect(selectBestTrackForJob('product manager role')).toBe('base')
  })
})

// ─── buildTailoringPrompt ─────────────────────────────────────────────────────

describe('buildTailoringPrompt', () => {
  const track: ResumeTrack = 'ops_platform'
  const jd = 'Senior PM for logistics platform team'
  const bg = 'Senior PM (L6) at Amazon Transportation Services'
  const stories = ['Led fulfillment algo', 'Built sortation platform']

  it('returns systemPrompt and userMessage', () => {
    const result = buildTailoringPrompt(track, jd, bg, stories)
    expect(result).toHaveProperty('systemPrompt')
    expect(result).toHaveProperty('userMessage')
  })

  it('systemPrompt contains owner language rule', () => {
    const { systemPrompt } = buildTailoringPrompt(track, jd, bg, stories)
    expect(systemPrompt).toContain('led')
  })

  it('systemPrompt contains NDA rule', () => {
    const { systemPrompt } = buildTailoringPrompt(track, jd, bg, stories)
    expect(systemPrompt.toLowerCase()).toContain('nda')
  })

  it('userMessage contains track name', () => {
    const { userMessage } = buildTailoringPrompt(track, jd, bg, stories)
    expect(userMessage).toContain('Ops')
  })

  it('userMessage includes story titles', () => {
    const { userMessage } = buildTailoringPrompt(track, jd, bg, stories)
    expect(userMessage).toContain('Led fulfillment algo')
  })

  it('shows "No story bank" when stories array is empty', () => {
    const { userMessage } = buildTailoringPrompt(track, jd, bg, [])
    expect(userMessage).toContain('No story bank')
  })

  it('truncates JD to 1500 chars', () => {
    const longJd = 'x'.repeat(3000)
    const { userMessage } = buildTailoringPrompt(track, longJd, bg, [])
    // Split on the marker, then take only the JD text (before the next blank line)
    const afterMarker = userMessage.split('JOB DESCRIPTION:\n')[1] ?? ''
    const jdText = afterMarker.split('\n\n')[0]
    expect(jdText.length).toBeLessThanOrEqual(1500)
  })
})

// ─── isNdaSafeForResume ───────────────────────────────────────────────────────

describe('isNdaSafeForResume', () => {
  it('flags Falcon (case insensitive)', () => {
    expect(isNdaSafeForResume('I worked on Falcon at Amazon')).toBe(false)
    expect(isNdaSafeForResume('falcon platform')).toBe(false)
  })

  it('flags Vega', () => {
    expect(isNdaSafeForResume('Led the Vega rollout')).toBe(false)
  })

  it('flags DEFCON', () => {
    expect(isNdaSafeForResume('DEFCON system')).toBe(false)
  })

  it('flags Turbo Merge', () => {
    expect(isNdaSafeForResume('Turbo Merge consolidation')).toBe(false)
    expect(isNdaSafeForResume('TurboMerge program')).toBe(false)
  })

  it('passes clean text', () => {
    expect(isNdaSafeForResume('Led a container consolidation program that reduced costs by 18%')).toBe(true)
    expect(isNdaSafeForResume('Architected logistics optimization platform')).toBe(true)
  })
})
