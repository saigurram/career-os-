import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import OutreachClient from '@/components/outreach/OutreachClient'
import type { Tables } from '@/types/database'

export const dynamic = 'force-dynamic'

export default async function OutreachPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [contactsRes, unitRes, userRes] = await Promise.all([
    supabase
      .from('outreach_contacts')
      .select('*')
      .eq('user_id', user.id)
      .order('sent_at', { ascending: false, nullsFirst: false }),
    supabase
      .from('user_unit_progress')
      .select('unit_id')
      .eq('user_id', user.id)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false })
      .limit(1),
    supabase.from('users').select('name, current_company, target_level').eq('id', user.id).single(),
  ])

  const contacts = (contactsRes.data ?? []) as Tables<'outreach_contacts'>[]
  const userName = userRes.data?.name ?? 'Sai'
  const currentCompany = userRes.data?.current_company ?? 'Amazon'
  const targetLevel = userRes.data?.target_level ?? 'Principal PM'

  // Find current active unit number for context
  let currentUnitNumber = 1
  if (unitRes.data && unitRes.data.length > 0) {
    const unitId = unitRes.data[0].unit_id
    const { data: unit } = await supabase
      .from('curriculum_units')
      .select('unit_number, primary_theme')
      .eq('id', unitId)
      .single()
    if (unit) currentUnitNumber = unit.unit_number
  }

  return (
    <OutreachClient
      contacts={contacts}
      userId={user.id}
      userName={userName}
      currentCompany={currentCompany}
      targetLevel={targetLevel}
      currentUnitNumber={currentUnitNumber}
    />
  )
}
