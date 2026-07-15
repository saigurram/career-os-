import { ExternalLink, Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Tables } from '@/types/database'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface JobCardProps {
  job: Tables<'jobs'>
  phase2?: boolean
}

function fitColor(score: number | null) {
  if (!score) return 'text-muted-foreground'
  if (score >= 80) return 'text-emerald-400'
  if (score >= 60) return 'text-amber-400'
  return 'text-red-400'
}

function formatComp(inr: number | null) {
  if (!inr) return null
  const cr = inr / 10000000
  if (cr >= 1) return `₹${cr.toFixed(1)}Cr`
  const lakh = inr / 100000
  return `₹${lakh.toFixed(0)}L`
}

export function JobCard({ job, phase2 = false }: JobCardProps) {
  const router = useRouter()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createClient() as any

  async function addToTracker() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('applications').insert({
      user_id: user.id,
      job_id: job.id,
      company: job.company,
      role: job.title,
      fit_score: job.fit_score,
      status: 'spotted',
    })
    router.push('/tracker')
  }

  return (
    <div data-testid="job-card" className="flex items-start gap-3 p-3 rounded-xl bg-white/3 border border-white/5 hover:bg-white/5 hover:border-white/10 transition-all group">
      {/* Company initial */}
      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500/20 to-violet-500/20 flex items-center justify-center flex-shrink-0 border border-white/10">
        <span className="text-xs font-bold text-indigo-300">
          {job.company.charAt(0).toUpperCase()}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-medium text-white truncate">{job.title}</p>
            <p className="text-xs text-muted-foreground">{job.company}</p>
          </div>
          <a
            href={job.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
            onClick={e => e.stopPropagation()}
          >
            <ExternalLink size={13} className="text-muted-foreground hover:text-white" />
          </a>
        </div>

        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <Badge variant="secondary" className="text-xs bg-white/5 border-white/10 text-muted-foreground h-5 px-1.5">
            {job.location}
          </Badge>
          {job.level_estimate && (
            <Badge variant="secondary" className="text-xs bg-indigo-500/10 border-indigo-500/20 text-indigo-300 h-5 px-1.5">
              {job.level_estimate}
            </Badge>
          )}
          {job.comp_estimate_inr && (
            <span className="text-xs text-emerald-400 font-medium">
              {formatComp(job.comp_estimate_inr)}
            </span>
          )}
          {job.fit_score != null && (
            <span className={`text-xs font-medium ${phase2 ? '' : 'ml-auto'} ${fitColor(job.fit_score)}`}>
              {job.fit_score}% fit
            </span>
          )}
        </div>
      </div>

      {phase2 && (
        <Button
          size="sm"
          variant="ghost"
          onClick={addToTracker}
          className="flex-shrink-0 h-7 w-7 p-0 text-muted-foreground hover:text-indigo-400 hover:bg-indigo-500/10"
          title="Add to tracker"
        >
          <Plus size={14} />
        </Button>
      )}
    </div>
  )
}
