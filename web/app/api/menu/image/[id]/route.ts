import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { MenuItemImageDoc } from '@/types/db'

export const runtime = 'nodejs'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const db = await getDb()
  const doc = await db.collection<MenuItemImageDoc>('menu_item_images').findOne({ _id: id })
  if (!doc) return new NextResponse('Not found', { status: 404 })

  const bytes = doc.data instanceof Uint8Array ? doc.data : Buffer.from((doc.data as unknown as { buffer: Uint8Array }).buffer)

  return new NextResponse(new Blob([bytes as BlobPart]), {
    headers: {
      'Content-Type': doc.mime_type,
      // Content is immutable once uploaded (a re-upload gets a new id), so cache hard.
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
