import { describe, it, expect } from 'vitest'
import {
  buildWeeklyDigestHtml,
  buildFollowUpNudgeHtml,
  buildApplicationReminderHtml,
  type WeeklyDigestData,
  type FollowUpNudgeData,
  type ApplicationReminderData,
} from '@/lib/email'

// ─── buildWeeklyDigestHtml ────────────────────────────────────────────────────

describe('buildWeeklyDigestHtml', () => {
  const baseData: WeeklyDigestData = {
    userName: 'Ujwal',
    currentUnitNumber: 5,
    currentUnitTheme: 'GenAI PM Depth',
    streak: 12,
    topJobs: [
      { title: 'Principal PM', company: 'Google', fitScore: 85 },
      { title: 'Lead PM', company: 'Uber', fitScore: 67 },
      { title: 'Staff PM', company: 'Stripe', fitScore: 45 },
    ],
  }

  it('returns a valid HTML string', () => {
    const html = buildWeeklyDigestHtml(baseData)
    expect(html).toContain('<!DOCTYPE html>')
    expect(html).toContain('</html>')
  })

  it('includes user name', () => {
    const html = buildWeeklyDigestHtml(baseData)
    expect(html).toContain('Ujwal')
  })

  it('includes streak count', () => {
    const html = buildWeeklyDigestHtml(baseData)
    expect(html).toContain('12')
  })

  it('includes current unit number', () => {
    const html = buildWeeklyDigestHtml(baseData)
    expect(html).toContain('Unit 5')
  })

  it('includes current unit theme', () => {
    const html = buildWeeklyDigestHtml(baseData)
    expect(html).toContain('GenAI PM Depth')
  })

  it('renders top jobs (up to 5)', () => {
    const html = buildWeeklyDigestHtml(baseData)
    expect(html).toContain('Principal PM')
    expect(html).toContain('Google')
    expect(html).toContain('Uber')
  })

  it('shows fit score badge for jobs with fitScore', () => {
    const html = buildWeeklyDigestHtml(baseData)
    expect(html).toContain('85% fit')
  })

  it('applies green color for high fit scores (80+)', () => {
    const html = buildWeeklyDigestHtml(baseData)
    expect(html).toContain('#34d399') // emerald for 85
  })

  it('applies amber color for medium fit scores (60-79)', () => {
    const html = buildWeeklyDigestHtml(baseData)
    expect(html).toContain('#fbbf24') // amber for 67
  })

  it('applies red color for low fit scores (<60)', () => {
    const html = buildWeeklyDigestHtml(baseData)
    expect(html).toContain('#f87171') // red for 45
  })

  it('shows empty state when no jobs', () => {
    const html = buildWeeklyDigestHtml({ ...baseData, topJobs: [] })
    expect(html).toContain('No active jobs')
  })

  it('skips fitScore badge when fitScore is null', () => {
    const data: WeeklyDigestData = {
      ...baseData,
      topJobs: [{ title: 'PM', company: 'X', fitScore: null }],
    }
    const html = buildWeeklyDigestHtml(data)
    expect(html).not.toContain('% fit')
  })

  it('limits to 5 jobs even if more provided', () => {
    const manyJobs = Array.from({ length: 10 }, (_, i) => ({
      title: `Job ${i}`,
      company: `Co ${i}`,
      fitScore: 70,
    }))
    const html = buildWeeklyDigestHtml({ ...baseData, topJobs: manyJobs })
    // Only first 5 job titles should appear (Job 0 through Job 4)
    expect(html).toContain('Job 4')
    expect(html).not.toContain('Job 5')
  })

  it('includes CareerOS branding', () => {
    const html = buildWeeklyDigestHtml(baseData)
    expect(html).toContain('CareerOS')
  })
})

// ─── buildFollowUpNudgeHtml ───────────────────────────────────────────────────

describe('buildFollowUpNudgeHtml', () => {
  const baseData: FollowUpNudgeData = {
    userName: 'Ujwal',
    company: 'Experian',
    role: 'Principal PM',
    daysAgo: 8,
    applicationId: 'app-123',
    appUrl: 'https://careeros.vercel.app/tracker',
  }

  it('returns valid HTML', () => {
    const html = buildFollowUpNudgeHtml(baseData)
    expect(html).toContain('<!DOCTYPE html>')
  })

  it('includes user name', () => {
    const html = buildFollowUpNudgeHtml(baseData)
    expect(html).toContain('Ujwal')
  })

  it('includes company name', () => {
    const html = buildFollowUpNudgeHtml(baseData)
    expect(html).toContain('Experian')
  })

  it('includes role', () => {
    const html = buildFollowUpNudgeHtml(baseData)
    expect(html).toContain('Principal PM')
  })

  it('includes days ago count', () => {
    const html = buildFollowUpNudgeHtml(baseData)
    expect(html).toContain('8 days ago')
  })

  it('includes app URL', () => {
    const html = buildFollowUpNudgeHtml(baseData)
    expect(html).toContain('https://careeros.vercel.app/tracker')
  })

  it('has a follow-up call to action', () => {
    const html = buildFollowUpNudgeHtml(baseData)
    expect(html.toLowerCase()).toContain('follow')
  })
})

// ─── buildApplicationReminderHtml ─────────────────────────────────────────────

describe('buildApplicationReminderHtml', () => {
  const baseData: ApplicationReminderData = {
    userName: 'Ujwal',
    company: 'ServiceNow',
    role: 'Sr Staff PM',
    eventType: 'loop',
    daysUntil: 3,
    appUrl: 'https://careeros.vercel.app/tracker',
  }

  it('returns valid HTML', () => {
    const html = buildApplicationReminderHtml(baseData)
    expect(html).toContain('<!DOCTYPE html>')
  })

  it('includes user name', () => {
    const html = buildApplicationReminderHtml(baseData)
    expect(html).toContain('Ujwal')
  })

  it('includes company and role', () => {
    const html = buildApplicationReminderHtml(baseData)
    expect(html).toContain('ServiceNow')
    expect(html).toContain('Sr Staff PM')
  })

  it('renders loop as "Interview loop"', () => {
    const html = buildApplicationReminderHtml(baseData)
    expect(html).toContain('Interview loop')
  })

  it('renders hm_round as "HM round"', () => {
    const html = buildApplicationReminderHtml({ ...baseData, eventType: 'hm_round' })
    expect(html).toContain('HM round')
  })

  it('renders recruiter_screen as "Recruiter screen"', () => {
    const html = buildApplicationReminderHtml({ ...baseData, eventType: 'recruiter_screen' })
    expect(html).toContain('Recruiter screen')
  })

  it('shows correct days until', () => {
    const html = buildApplicationReminderHtml(baseData)
    expect(html).toContain('3 day')
  })

  it('uses singular "day" when daysUntil is 1', () => {
    const html = buildApplicationReminderHtml({ ...baseData, daysUntil: 1 })
    expect(html).toContain('1 day')
    // Should NOT have "1 days" (plural)
    const matches = html.match(/1 days/g)
    expect(matches).toBeNull()
  })

  it('includes app URL', () => {
    const html = buildApplicationReminderHtml(baseData)
    expect(html).toContain('https://careeros.vercel.app/tracker')
  })

  it('includes mock interview CTA', () => {
    const html = buildApplicationReminderHtml(baseData)
    expect(html.toLowerCase()).toContain('mock')
  })
})
