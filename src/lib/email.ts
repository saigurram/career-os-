// Pure HTML email template builders. No external dependencies — all testable.

export interface WeeklyDigestData {
  userName: string
  currentUnitNumber: number
  currentUnitTheme: string
  streak: number
  topJobs: { title: string; company: string; fitScore: number | null }[]
}

export interface FollowUpNudgeData {
  userName: string
  company: string
  role: string
  daysAgo: number
  applicationId: string
  appUrl: string
}

export interface ApplicationReminderData {
  userName: string
  company: string
  role: string
  eventType: 'loop' | 'hm_round' | 'recruiter_screen'
  daysUntil: number
  appUrl: string
}

const BG_COLOR = '#0e0f1a'
const TEXT_COLOR = '#e2e8f0'
const MUTED_COLOR = '#64748b'

function emailWrapper(content: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>CareerOS</title>
</head>
<body style="margin:0;padding:0;background-color:${BG_COLOR};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:32px 16px;">
    <!-- Logo -->
    <div style="margin-bottom:32px;">
      <span style="font-size:20px;font-weight:700;background:linear-gradient(to right,#818cf8,#a78bfa);-webkit-background-clip:text;color:transparent;">
        CareerOS
      </span>
    </div>
    ${content}
    <!-- Footer -->
    <div style="margin-top:40px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.08);">
      <p style="margin:0;font-size:12px;color:${MUTED_COLOR};">
        CareerOS · Hyderabad job search engine · Offer target: June 2027
      </p>
    </div>
  </div>
</body>
</html>`
}

export function buildWeeklyDigestHtml(data: WeeklyDigestData): string {
  const jobRows = data.topJobs.slice(0, 5).map(job => {
    const fitBadge = job.fitScore != null
      ? `<span style="font-size:11px;color:${job.fitScore >= 80 ? '#34d399' : job.fitScore >= 60 ? '#fbbf24' : '#f87171'};">${job.fitScore}% fit</span>`
      : ''
    return `
      <div style="padding:12px;border-radius:8px;border:1px solid rgba(255,255,255,0.08);margin-bottom:8px;">
        <div style="font-size:13px;font-weight:600;color:${TEXT_COLOR};">${job.title}</div>
        <div style="font-size:12px;color:${MUTED_COLOR};margin-top:2px;">${job.company} ${fitBadge}</div>
      </div>`
  }).join('')

  const content = `
    <h1 style="font-size:22px;font-weight:700;color:${TEXT_COLOR};margin:0 0 4px;">
      Weekly update, ${data.userName}
    </h1>
    <p style="font-size:14px;color:${MUTED_COLOR};margin:0 0 24px;">
      ${data.streak} day streak · Unit ${data.currentUnitNumber} active
    </p>

    <!-- Current unit -->
    <div style="background:rgba(79,70,229,0.08);border:1px solid rgba(79,70,229,0.2);border-radius:12px;padding:16px;margin-bottom:24px;">
      <p style="margin:0;font-size:12px;color:#818cf8;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Current unit</p>
      <p style="margin:4px 0 0;font-size:15px;font-weight:600;color:${TEXT_COLOR};">Unit ${data.currentUnitNumber}: ${data.currentUnitTheme}</p>
    </div>

    <!-- Job digest -->
    <h2 style="font-size:15px;font-weight:600;color:${TEXT_COLOR};margin:0 0 12px;">Top jobs this week</h2>
    ${jobRows || `<p style="font-size:13px;color:${MUTED_COLOR};">No active jobs in feed this week.</p>`}

    <div style="margin-top:24px;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'https://careeros.vercel.app'}/dashboard"
         style="display:inline-block;padding:12px 24px;background:linear-gradient(to right,#4f46e5,#7c3aed);color:white;border-radius:8px;font-size:14px;font-weight:600;text-decoration:none;">
        Open CareerOS
      </a>
    </div>`

  return emailWrapper(content)
}

export function buildFollowUpNudgeHtml(data: FollowUpNudgeData): string {
  const content = `
    <h1 style="font-size:22px;font-weight:700;color:${TEXT_COLOR};margin:0 0 4px;">
      Time to follow up
    </h1>
    <p style="font-size:14px;color:${MUTED_COLOR};margin:0 0 24px;">
      ${data.userName}, you applied ${data.daysAgo} days ago — no response yet
    </p>

    <div style="background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.2);border-radius:12px;padding:16px;margin-bottom:24px;">
      <p style="margin:0;font-size:13px;font-weight:600;color:${TEXT_COLOR};">${data.role}</p>
      <p style="margin:4px 0 0;font-size:12px;color:${MUTED_COLOR};">${data.company}</p>
    </div>

    <p style="font-size:14px;color:${TEXT_COLOR};line-height:1.6;">
      A short follow-up email today increases response rates significantly. Check CareerOS for a draft.
    </p>

    <div style="margin-top:24px;">
      <a href="${data.appUrl}"
         style="display:inline-block;padding:12px 24px;background:linear-gradient(to right,#4f46e5,#7c3aed);color:white;border-radius:8px;font-size:14px;font-weight:600;text-decoration:none;">
        Open Tracker
      </a>
    </div>`

  return emailWrapper(content)
}

export function buildApplicationReminderHtml(data: ApplicationReminderData): string {
  const EVENT_LABELS: Record<string, string> = {
    loop: 'Interview loop',
    hm_round: 'HM round',
    recruiter_screen: 'Recruiter screen',
  }
  const eventLabel = EVENT_LABELS[data.eventType] ?? 'Interview'

  const content = `
    <h1 style="font-size:22px;font-weight:700;color:${TEXT_COLOR};margin:0 0 4px;">
      ${eventLabel} in ${data.daysUntil} day${data.daysUntil === 1 ? '' : 's'}
    </h1>
    <p style="font-size:14px;color:${MUTED_COLOR};margin:0 0 24px;">
      ${data.userName}, run a mock session today so you are ready
    </p>

    <div style="background:rgba(139,92,246,0.08);border:1px solid rgba(139,92,246,0.2);border-radius:12px;padding:16px;margin-bottom:24px;">
      <p style="margin:0;font-size:13px;font-weight:600;color:${TEXT_COLOR};">${data.role} at ${data.company}</p>
      <p style="margin:4px 0 0;font-size:12px;color:${MUTED_COLOR};">${eventLabel} · ${data.daysUntil} day${data.daysUntil === 1 ? '' : 's'} away</p>
    </div>

    <div style="margin-top:24px;">
      <a href="${data.appUrl}"
         style="display:inline-block;padding:12px 24px;background:linear-gradient(to right,#4f46e5,#7c3aed);color:white;border-radius:8px;font-size:14px;font-weight:600;text-decoration:none;">
        Start Mock Interview
      </a>
    </div>`

  return emailWrapper(content)
}
