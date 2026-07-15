export const dynamic = 'force-dynamic'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NegotiationClient from '@/components/negotiate/NegotiationClient'
import { COMP_BENCHMARKS } from '@/lib/negotiation'

interface Props {
  searchParams: Promise<{ company?: string; role?: string; application_id?: string }>
}

export default async function NegotiatePage({ searchParams }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const company = params.company ?? ''
  const role = params.role ?? ''
  const applicationId = params.application_id ?? ''

  // Fetch recent offers from applications
  const admin = createAdminClient()
  const { data: offerApps } = await admin
    .from('applications')
    .select('id, company, role, status')
    .eq('user_id', user.id)
    .in('status', ['offer', 'negotiating'])
    .order('applied_at', { ascending: false })

  return (
    <NegotiationClient
      initialCompany={company}
      initialRole={role}
      applicationId={applicationId}
      offerApplications={offerApps ?? []}
      benchmarks={COMP_BENCHMARKS}
    />
  )
}
