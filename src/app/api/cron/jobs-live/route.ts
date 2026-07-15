import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// Only runs every 10 min but fires only when at least one user is in phase2.
// Shares the same Adzuna fetch logic as the weekly cron — but fetches 5 fresh
// jobs (not 20) to stay within rate limits on frequent calls.
const ADZUNA_APP_ID = process.env.ADZUNA_APP_ID!
const ADZUNA_API_KEY = process.env.ADZUNA_API_KEY!

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
}

function estimateLevel(title: string): string {
  const t = title.toLowerCase()
  if (t.includes('principal') || t.includes('staff')) return 'Principal PM'
  if (t.includes('lead') || t.includes('group')) return 'Lead PM'
  if (t.includes('director')) return 'Director PM'
  return 'Senior PM'
}

function estimateComp(title: string, company: string): number | null {
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
  return loc.includes('remote') || title.toLowerCase().includes('remote')
}

function isValidLevel(title: string): boolean {
  const t = title.toLowerCase()
  if (t.includes('associate') || t.includes('junior') || t.includes('jr.')) return false
  return (
    t.includes('senior') || t.includes('sr ') || t.includes('sr.') ||
    t.includes('principal') || t.includes('lead') || t.includes('staff') ||
    t.includes('director') || t.includes('head of product')
  )
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()

  // Only run if at least one user is in phase2
  const { count } = await admin
    .from('users')
    .select('id', { count: 'exact', head: true })
    .eq('phase', 'phase2')

  if (!count || count === 0) {
    return NextResponse.json({ message: 'No phase2 users — skipped', fetched: 0 })
  }

  const fetched: string[] = []
  const errors: string[] = []

  try {
    const params = new URLSearchParams({
      app_id: ADZUNA_APP_ID,
      app_key: ADZUNA_API_KEY,
      results_per_page: '5',
      what: 'Senior Product Manager Hyderabad',
      'content-type': 'application/json',
    })

    const url = `https://api.adzuna.com/v1/api/jobs/in/search/1?${params}`
    const res = await fetch(url, { cache: 'no-store' })

    if (res.ok) {
      const data: { results: AdzunaJob[] } = await res.json()
      for (const job of data.results) {
        if (!isValidLevel(job.title)) continue

        const jobLocation = job.location.display_name
        const remote = isRemote(job.location, job.title)
        const inHyderabad = jobLocation.toLowerCase().includes('hyderabad') ||
          job.location.area.some((a: string) => a.toLowerCase().includes('hyderabad'))

        if (!inHyderabad && !remote) continue

        await admin.from('jobs').upsert({
          id: `adzuna-${job.id}`,
          title: job.title,
          company: job.company.display_name,
          location: remote ? `${jobLocation} (Remote)` : jobLocation,
          level_estimate: estimateLevel(job.title),
          comp_estimate_inr: estimateComp(job.title, job.company.display_name),
          jd_text: job.description.slice(0, 1000),
          source_url: job.redirect_url,
          posted_at: job.created,
          fetched_at: new Date().toISOString(),
          is_active: true,
          is_remote: remote,
        }, { onConflict: 'id', ignoreDuplicates: true })

        fetched.push(job.id)
      }
    } else {
      errors.push(`Adzuna error: ${res.status}`)
    }
  } catch (e) {
    errors.push(`Fetch error: ${e}`)
  }

  return NextResponse.json({ fetched: fetched.length, errors, timestamp: new Date().toISOString() })
}
