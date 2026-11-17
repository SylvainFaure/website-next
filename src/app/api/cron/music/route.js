import { revalidatePath } from 'next/cache'
import { collectHistory } from '@/service/music/history'
import { sameSecret } from '@/service/music/oauth'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

// Called every hour by a Supabase cron job with "Authorization: Bearer <CRON_SECRET>".
export async function GET(request) {
  const token = request.headers.get('authorization')?.replace(/^Bearer /, '')
  if (!sameSecret(token, process.env.CRON_SECRET)) return new Response('Unauthorized', { status: 401 })

  const result = await collectHistory()
  if (result.ok) revalidatePath('/music')
  return Response.json(result, { status: result.ok ? 200 : 500 })
}
