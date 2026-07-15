import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import { APPLICATION_STAGES } from '@/lib/applications'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { status, notes, next_action, next_action_due, key_contact } = body

  // Validate status if provided
  if (status && !APPLICATION_STAGES.includes(status)) {
    return NextResponse.json({ error: `Invalid status: ${status}` }, { status: 400 })
  }

  const admin = createAdminClient()

  // Verify ownership
  const { data: app } = await admin
    .from('applications')
    .select('id, user_id')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (!app) return NextResponse.json({ error: 'Application not found' }, { status: 404 })

  const updates: Record<string, unknown> = {}
  if (status !== undefined) updates.status = status
  if (notes !== undefined) updates.notes = notes
  if (next_action !== undefined) updates.next_action = next_action
  if (next_action_due !== undefined) updates.next_action_due = next_action_due
  if (key_contact !== undefined) updates.key_contact = key_contact

  const { data, error } = await admin
    .from('applications')
    .update(updates)
    .eq('id', params.id)
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ application: data })
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()

  const { error } = await admin
    .from('applications')
    .delete()
    .eq('id', params.id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ deleted: true })
}
