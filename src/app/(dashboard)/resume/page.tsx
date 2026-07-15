export const dynamic = 'force-dynamic'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ResumeClient from '@/components/resume/ResumeClient'

export default async function ResumePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()

  const [storiesRes, applicationsRes] = await Promise.all([
    admin.from('story_bank').select('id, title, outcome, owner_framing_score').eq('user_id', user.id).order('owner_framing_score', { ascending: false }).limit(10),
    admin.from('applications').select('id, company, role, status').eq('user_id', user.id).order('applied_at', { ascending: false }).limit(20),
  ])

  return (
    <ResumeClient
      stories={storiesRes.data ?? []}
      recentApplications={applicationsRes.data ?? []}
    />
  )
}
