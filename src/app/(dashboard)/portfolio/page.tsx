export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PortfolioClient from '@/components/portfolio/PortfolioClient'

export default async function PortfolioPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: artifacts } = await supabase
    .from('pow_artifacts')
    .select('*')
    .eq('user_id', user.id)
    .order('published_at', { ascending: false })

  const { data: units } = await supabase
    .from('curriculum_units')
    .select('id, unit_number, primary_theme')
    .order('unit_number')

  return <PortfolioClient artifacts={artifacts ?? []} units={units ?? []} userId={user.id} />
}
