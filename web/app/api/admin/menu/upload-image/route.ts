import { NextRequest } from 'next/server'
import { getCurrentAdmin } from '@/lib/auth'
import { success, fail } from '@/lib/apiResponse'
import { saveMenuImage } from '@/lib/menuImages'

export const runtime = 'nodejs'

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024

export async function POST(req: NextRequest) {
  const admin = await getCurrentAdmin()
  if (!admin) return fail('Unauthorized', 403)

  const form = await req.formData().catch(() => null)
  const file = form?.get('file')
  if (!file || !(file instanceof Blob)) return fail('file is required', 400)

  if (!file.type.startsWith('image/')) return fail('Only image files are allowed', 400)
  if (file.size > MAX_UPLOAD_BYTES) return fail('Image must be under 10MB', 400)

  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const { id, url, size } = await saveMenuImage(buffer)
    return success('Image uploaded', { id, url, size }, { status: 201 })
  } catch (e) {
    return fail(e instanceof Error ? e.message : 'Could not process image', 400)
  }
}
