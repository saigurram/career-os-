import type { OutreachStatus } from '@/types/database'

export const STATUS_ORDER: OutreachStatus[] = [
  'drafted', 'sent', 'replied', 'meeting_set', 'closed',
]

export const STATUS_LABELS: Record<OutreachStatus, string> = {
  drafted: 'Drafted',
  sent: 'Sent',
  replied: 'Replied',
  meeting_set: 'Meeting Set',
  closed: 'Closed',
}

export const STATUS_COLORS: Record<OutreachStatus, string> = {
  drafted: 'text-muted-foreground bg-white/5 border-white/10',
  sent: 'text-blue-300 bg-blue-500/10 border-blue-500/20',
  replied: 'text-violet-300 bg-violet-500/10 border-violet-500/20',
  meeting_set: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20',
  closed: 'text-muted-foreground bg-white/5 border-white/10',
}

export function nextStatus(current: OutreachStatus): OutreachStatus | null {
  const idx = STATUS_ORDER.indexOf(current)
  if (idx === -1 || idx >= STATUS_ORDER.length - 1) return null
  return STATUS_ORDER[idx + 1]
}

export function isFollowUpDue(sentAt: string | null): boolean {
  if (!sentAt) return false
  const sent = new Date(sentAt).getTime()
  const now = Date.now()
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000
  return now - sent >= sevenDaysMs
}

export function daysSinceSent(sentAt: string | null): number | null {
  if (!sentAt) return null
  const sent = new Date(sentAt).getTime()
  return Math.floor((Date.now() - sent) / (24 * 60 * 60 * 1000))
}

// Message quality checks — mirrors Claude system prompt rules
export function validateOutreachMessage(message: string): { valid: boolean; violations: string[] } {
  const violations: string[] = []

  if (/pick your brain/i.test(message)) {
    violations.push('"pick your brain" — use a specific ask instead')
  }
  if (/\bhelped\b|\bsupported\b|\bassisted\b|\bcontributed to\b/i.test(message)) {
    violations.push('Contributor language detected — use owner framing (led/drove/built/owned)')
  }
  const BANNED = [
    { pattern: /passionate about/i, label: '"passionate about"' },
    { pattern: /thought leader/i, label: '"thought leader"' },
    { pattern: /game.changing/i, label: '"game-changing"' },
    { pattern: /excited to share/i, label: '"excited to share"' },
  ]
  for (const { pattern, label } of BANNED) {
    if (pattern.test(message)) {
      violations.push(`Banned phrase ${label} detected — keep it specific and direct`)
    }
  }

  const sentences = message.split(/[.!?]+/).filter(s => s.trim().length > 5)
  if (sentences.length > 5) {
    violations.push(`Message is ${sentences.length} sentences — keep to 4 or fewer`)
  }

  return { valid: violations.length === 0, violations }
}

export const OUTREACH_TEMPLATES = [
  { id: 'cold_pm_peer', label: 'Cold PM peer' },
  { id: 'amazon_internal', label: 'Amazon India internal transfer' },
  { id: 'recruiter', label: 'Recruiter' },
  { id: 'us_india_relocation', label: 'US→India relocation peer' },
  { id: 'follow_up_7day', label: '7-day follow-up' },
  { id: 'post_call_thankyou', label: 'Post-call thank you' },
] as const

export type OutreachTemplateId = typeof OUTREACH_TEMPLATES[number]['id']
