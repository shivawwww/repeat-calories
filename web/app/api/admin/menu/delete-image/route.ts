import { NextRequest } from 'next/server'
import { getCurrentAdmin } from '@/lib/auth'
import { success, fail } from '@/lib/apiResponse'
import { deleteMenuImage } from '@/lib/menuImages'

export async function DELETE(req: NextRequest) {
  const admin = await getCurrentAdmin()
  if (!admin) return fail('Unauthorized', 403)

  const body = await req.json().catch(() => null)
  const id = body?.id
  if (!id) return fail('id is required', 400)

  await deleteMenuImage(id)
  return success('Image deleted', { id })
}
