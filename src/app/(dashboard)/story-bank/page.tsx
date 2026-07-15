import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import StoryBankClient from '@/components/story-bank/StoryBankClient'
import type { Tables } from '@/types/database'

export const dynamic = 'force-dynamic'

export default async function StoryBankPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [storiesRes, blockedNamesRes] = await Promise.all([
    supabase
      .from('story_bank')
      .select('*')
      .eq('user_id', user.id)
      .order('owner_framing_score', { ascending: false, nullsFirst: false }),
    supabase
      .from('blocked_names')
      .select('internal_name, generic_replacement, safe_for_external')
      .eq('user_id', user.id),
  ])

  const stories = (storiesRes.data ?? []) as Tables<'story_bank'>[]
  const blockedNames = blockedNamesRes.data ?? []

  return (
    <StoryBankClient
      stories={stories}
      blockedNames={blockedNames}
      userId={user.id}
    />
  )
}
