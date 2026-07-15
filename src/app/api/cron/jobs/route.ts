import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

const ADZUNA_APP_ID = process.env.ADZUNA_APP_ID!
const ADZUNA_API_KEY = process.env.ADZUNA_API_KEY!

const SEARCH_TERMS = ['Senior Product Manager', 'Principal Product Manager', 'Lead Product Manager', 'Staff Product Manager']
const LOCATIONS = ['Hyderabad', '']  // '' = all India for remote roles

interface AdzunaJob {
  id: string
  title: string
  company: { display_name: string }
  location: { display_name: string; area: string[] }
  description: string
  redirect_url: string
  created: string
  salary_min?: number
  salary_max?: number
  contract_time?: string
}

interface AdzunaResponse {
  results: AdzunaJob[]
  count: number
}

function estimateLevel(title: string): string {
  const t = title.toLowerCase()
  if (t.includes('principal') || t.includes('staff')) return 'Principal PM'
  if (t.includes('lead') || t.includes('group')) return 'Lead PM'
  if (t.includes('senior') || t.includes('sr')) return 'Senior PM'
  if (t.includes('director')) return 'Director PM'
  return 'Senior PM'
}

function estimateComp(title: string, company: string): number | null {
  // Rough INR benchmarks for Hyderabad senior PM roles
  const c = company.toLowerCase()
  const t = title.toLowerCase()
  if (c.includes('amazon')) return t.includes('principal') ? 18000000 : 15000000
  if (c.includes('google')) return t.includes('principal') ? 20000000 : 16000000
  if (c.includes('microsoft')) return t.includes('principal') ? 13000000 : 10000000
  if (c.includes('uber')) return 16000000
  if (c.includes('experian')) return 13000000
  if (c.includes('servicenow')) return 14000000
  return null
}

function isRemote(location: AdzunaJob['location'], title: string): boolean {
  const loc = location.display_name.toLowerCase()
  const areas = location.area.join(' ').toLowerCase()
  return loc.includes('remote') || areas.includes('remote') || title.toLowerCase().includes('remote')
}

function isValidLevel(title: string): boolean {
  const t = title.toLowerCase()
  // Must be at or above Senior PM — exclude junior/associate
  if (t.includes('associate') || t.includes('junior') || t.includes('jr.')) return false
  return (
    t.includes('senior') || t.includes('sr ') || t.includes('sr.') ||
    t.includes('principal') || t.includes('lead') || t.includes('staff') ||
    t.includes('director') || t.includes('head of product')
  )
}

export async function GET(request: Request) {
  // Verify cron secret in production
  const authHeader = request.headers.get('authorization')
  if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any
  const fetched: string[] = []
  const errors: string[] = []

  for (const term of SEARCH_TERMS) {
    for (const location of LOCATIONS) {
      try {
        const params = new URLSearchParams({
          app_id: ADZUNA_APP_ID,
          app_key: ADZUNA_API_KEY,
          results_per_page: '20',
          what: term,
          'content-type': 'application/json',
        })
        if (location) params.set('where', location)

        const url = `https://api.adzuna.com/v1/api/jobs/in/search/1?${params}`
        const res = await fetch(url)
        if (!res.ok) {
          errors.push(`Adzuna error for "${term}" / "${location}": ${res.status}`)
          continue
        }

        const data: AdzunaResponse = await res.json()

        for (const job of data.results) {
          if (!isValidLevel(job.title)) continue

          const jobLocation = job.location.display_name
          const remote = isRemote(job.location, job.title)

          // Hyderabad OR remote only — hard filter
          const inHyderabad = jobLocation.toLowerCase().includes('hyderabad') ||
            job.location.area.some((a: string) => a.toLowerCase().includes('hyderabad'))
          if (!inHyderabad && !remote) continue

          await supabase.from('jobs').upsert({
            id: `adzuna-${job.id}`,
            title: job.title,
            company: job.company.display_name,
            location: remote ? `${jobLocation} (Remote)` : jobLocation,
            level_estimate: estimateLevel(job.title),
            comp_estimate_inr: estimateComp(job.title, job.company.display_name),
            jd_text: job.description.slice(0, 1000),
            source_url: job.redirect_url,
            posted_at: job.created,
            is_active: true,
            is_remote: remote,
          }, { onConflict: 'id', ignoreDuplicates: true })

          fetched.push(job.id)
        }
      } catch (e) {
        errors.push(`Error for "${term}": ${e}`)
      }
    }
  }

  // Mark stale jobs inactive (not fetched in last 10 days)
  const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
  await supabase.from('jobs').update({ is_active: false }).lt('fetched_at', tenDaysAgo)

  return NextResponse.json({
    fetched: fetched.length,
    errors,
    timestamp: new Date().toISOString(),
  })
}
