import { describe, it, expect } from 'vitest'
import {
  isContentStale,
  buildSmartRefreshReasons,
  shouldShowSmartRefreshBanner,
  smartRefreshBannerMessage,
  getTaskSizeLabel,
  getTaskSizeTooltip,
  buildCurriculumGenerationPrompt,
  type SmartRefreshReason,
  type CurriculumGenerationInputs,
} from '@/lib/curriculum'

// ─── isContentStale ───────────────────────────────────────────────────────────

describe('isContentStale', () => {
  it('returns true for null (no content ever generated)', () => {
    expect(isContentStale(null)).toBe(true)
  })

  it('returns false for fresh content (1 day old)', () => {
    const oneDayAgo = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    expect(isContentStale(oneDayAgo)).toBe(false)
  })

  it('returns false for 13-day-old content (within 14-day window)', () => {
    const thirteenDaysAgo = new Date(Date.now() - 13 * 24 * 60 * 60 * 1000).toISOString()
    expect(isContentStale(thirteenDaysAgo)).toBe(false)
  })

  it('returns true for 15-day-old content (past 14-day window)', () => {
    const fifteenDaysAgo = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
    expect(isContentStale(fifteenDaysAgo)).toBe(true)
  })

  it('returns false for just-generated content', () => {
    expect(isContentStale(new Date().toISOString())).toBe(false)
  })

  it('respects custom maxAgeDays', () => {
    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    expect(isContentStale(fiveDaysAgo, 7)).toBe(false)
    expect(isContentStale(fiveDaysAgo, 4)).toBe(true)
  })
})

// ─── buildSmartRefreshReasons ─────────────────────────────────────────────────

const BASE_PARAMS = {
  generatedAt: new Date().toISOString(),
  skillScoresUpdatedAt: null,
  lastGeneratedSkillScores: null,
  currentSkillScores: { genai_fluency: 6, platform_thinking: 8 },
  activeJobSkillTags: [],
  unitSkillDimensions: ['genai', 'platform'],
}

describe('buildSmartRefreshReasons', () => {
  it('returns empty array when no reasons apply', () => {
    const reasons = buildSmartRefreshReasons(BASE_PARAMS)
    expect(reasons).toHaveLength(0)
  })

  it('returns content_stale when content is 15+ days old', () => {
    const fifteenDaysAgo = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
    const reasons = buildSmartRefreshReasons({ ...BASE_PARAMS, generatedAt: fifteenDaysAgo })
    expect(reasons).toContain('content_stale')
  })

  it('returns new_job_skill when active job tags overlap unit dimensions', () => {
    const reasons = buildSmartRefreshReasons({
      ...BASE_PARAMS,
      activeJobSkillTags: ['genai', 'machine learning'],
      unitSkillDimensions: ['genai_fluency', 'data_analytics'],
    })
    expect(reasons).toContain('new_job_skill')
  })

  it('does not return new_job_skill when no overlap', () => {
    const reasons = buildSmartRefreshReasons({
      ...BASE_PARAMS,
      activeJobSkillTags: ['sales', 'finance'],
      unitSkillDimensions: ['platform_thinking'],
    })
    expect(reasons).not.toContain('new_job_skill')
  })

  it('returns skill_scores_changed when scores updated after content generation', () => {
    const contentGeneratedAt = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    const scoresUpdatedAt = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    const reasons = buildSmartRefreshReasons({
      ...BASE_PARAMS,
      generatedAt: contentGeneratedAt,
      skillScoresUpdatedAt: scoresUpdatedAt,
      lastGeneratedSkillScores: { genai_fluency: 5, platform_thinking: 8 },
      currentSkillScores: { genai_fluency: 6, platform_thinking: 8 },
    })
    expect(reasons).toContain('skill_scores_changed')
  })

  it('does not return skill_scores_changed when scores unchanged (delta < 0.5)', () => {
    const contentGeneratedAt = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    const scoresUpdatedAt = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    const reasons = buildSmartRefreshReasons({
      ...BASE_PARAMS,
      generatedAt: contentGeneratedAt,
      skillScoresUpdatedAt: scoresUpdatedAt,
      lastGeneratedSkillScores: { genai_fluency: 6.2, platform_thinking: 8 },
      currentSkillScores: { genai_fluency: 6.4, platform_thinking: 8 },
    })
    expect(reasons).not.toContain('skill_scores_changed')
  })

  it('does not return skill_scores_changed when scores updated before content was generated', () => {
    const scoresUpdatedAt = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    const contentGeneratedAt = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    const reasons = buildSmartRefreshReasons({
      ...BASE_PARAMS,
      generatedAt: contentGeneratedAt,
      skillScoresUpdatedAt: scoresUpdatedAt,
      lastGeneratedSkillScores: { genai_fluency: 5, platform_thinking: 7 },
      currentSkillScores: { genai_fluency: 6, platform_thinking: 8 },
    })
    expect(reasons).not.toContain('skill_scores_changed')
  })

  it('can return multiple reasons simultaneously', () => {
    const fifteenDaysAgo = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
    const reasons = buildSmartRefreshReasons({
      ...BASE_PARAMS,
      generatedAt: fifteenDaysAgo,
      activeJobSkillTags: ['genai'],
      unitSkillDimensions: ['genai_fluency'],
    })
    expect(reasons).toContain('content_stale')
    expect(reasons).toContain('new_job_skill')
    expect(reasons.length).toBeGreaterThanOrEqual(2)
  })
})

// ─── shouldShowSmartRefreshBanner ─────────────────────────────────────────────

describe('shouldShowSmartRefreshBanner', () => {
  it('returns true when reasons exist and not dismissed', () => {
    expect(shouldShowSmartRefreshBanner(['content_stale'], false)).toBe(true)
  })

  it('returns false when dismissed, even with reasons', () => {
    expect(shouldShowSmartRefreshBanner(['content_stale'], true)).toBe(false)
  })

  it('returns false when no reasons, not dismissed', () => {
    expect(shouldShowSmartRefreshBanner([], false)).toBe(false)
  })

  it('returns false when no reasons and dismissed', () => {
    expect(shouldShowSmartRefreshBanner([], true)).toBe(false)
  })
})

// ─── smartRefreshBannerMessage ────────────────────────────────────────────────

describe('smartRefreshBannerMessage', () => {
  it('prioritizes new_job_skill message', () => {
    const msg = smartRefreshBannerMessage(['new_job_skill', 'content_stale'])
    expect(msg.toLowerCase()).toContain('job')
  })

  it('uses skill score message when that is the only reason', () => {
    const msg = smartRefreshBannerMessage(['skill_scores_changed'])
    expect(msg.toLowerCase()).toContain('skill')
  })

  it('falls back to stale message when only content_stale', () => {
    const msg = smartRefreshBannerMessage(['content_stale'])
    expect(msg.toLowerCase()).toMatch(/old|week|current/)
  })
})

// ─── getTaskSizeLabel ─────────────────────────────────────────────────────────

describe('getTaskSizeLabel', () => {
  it('learn → M', () => expect(getTaskSizeLabel('learn')).toBe('M'))
  it('create → L', () => expect(getTaskSizeLabel('create')).toBe('L'))
  it('outreach → S', () => expect(getTaskSizeLabel('outreach')).toBe('S'))
  it('reflect → S', () => expect(getTaskSizeLabel('reflect')).toBe('S'))
})

// ─── getTaskSizeTooltip ───────────────────────────────────────────────────────

describe('getTaskSizeTooltip', () => {
  it('L tooltip mentions 60-90 min', () => expect(getTaskSizeTooltip('L')).toMatch(/60|90/))
  it('M tooltip mentions 20-30 min', () => expect(getTaskSizeTooltip('M')).toMatch(/20|30/))
  it('S tooltip mentions 5-10 min', () => expect(getTaskSizeTooltip('S')).toMatch(/5|10/))
})

// ─── buildCurriculumGenerationPrompt ─────────────────────────────────────────

const BASE_INPUTS: CurriculumGenerationInputs = {
  unitNumber: 5,
  unitTheme: 'GenAI product design',
  pillar: 'GenAI & AI concepts',
  aiConceptName: 'How LLMs work (tokens, context windows, attention)',
  aiConceptTier: 1,
  currentDate: '2026-05-30',
  skillScores: { genai_fluency: 6, platform_thinking: 8, executive_communication: 6 },
  genaiBaselineScore: 5,
  domainScore: 7,
  externalVisibilityScore: 4,
  currentRole: 'Senior PM',
  currentLevel: 'L6',
  targetLevel: 'Principal PM',
  targetLocation: 'Hyderabad',
  offerDeadline: 'June 2027',
  yearsExperience: 8,
  completedUnitNumbers: [1, 2, 3, 4],
  bankedStoryTitles: [],
  publishedArtifactTitles: [],
  uncoveredConceptNames: [],
  jobContext: 'Staff PM at Uber: LLM-powered dispatch optimization',
  previousUnitSummaries: [],
}

describe('buildCurriculumGenerationPrompt', () => {
  it('includes unit number', () => {
    const { userMessage } = buildCurriculumGenerationPrompt(BASE_INPUTS)
    expect(userMessage).toContain('5')
  })

  it('includes unit theme', () => {
    const { userMessage } = buildCurriculumGenerationPrompt(BASE_INPUTS)
    expect(userMessage).toContain('GenAI product design')
  })

  it('includes pillar', () => {
    const { userMessage } = buildCurriculumGenerationPrompt(BASE_INPUTS)
    expect(userMessage).toContain('GenAI & AI concepts')
  })

  it('includes AI concept name', () => {
    const { userMessage } = buildCurriculumGenerationPrompt(BASE_INPUTS)
    expect(userMessage).toContain('How LLMs work')
  })

  it('includes current date', () => {
    const { userMessage } = buildCurriculumGenerationPrompt(BASE_INPUTS)
    expect(userMessage).toContain('2026-05-30')
  })

  it('includes completed units', () => {
    const { userMessage } = buildCurriculumGenerationPrompt(BASE_INPUTS)
    expect(userMessage).toContain('1, 2, 3, 4')
  })

  it('includes job context', () => {
    const { userMessage } = buildCurriculumGenerationPrompt(BASE_INPUTS)
    expect(userMessage).toContain('Uber')
  })

  it('prioritizes low skill scores as gaps', () => {
    const { userMessage } = buildCurriculumGenerationPrompt(BASE_INPUTS)
    // genai_fluency: 6/10 and executive_communication: 6/10 are below 7
    expect(userMessage).toMatch(/genai_fluency|executive_communication/)
  })

  it('shows "none" when no completed units', () => {
    const { userMessage } = buildCurriculumGenerationPrompt({ ...BASE_INPUTS, completedUnitNumbers: [] })
    expect(userMessage).toContain('none')
  })

  it('specifies valid JSON output format in system prompt', () => {
    const { systemPrompt } = buildCurriculumGenerationPrompt(BASE_INPUTS)
    expect(systemPrompt).toContain('learn_resource_title')
    expect(systemPrompt).toContain('reflect_question')
  })
})
