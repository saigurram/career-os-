import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Curriculum content is now generated on-demand per unit via /api/curriculum/generate.
  return NextResponse.json({ message: 'Curriculum content is generated on-demand. Cron disabled.', generated: 0 })
}
