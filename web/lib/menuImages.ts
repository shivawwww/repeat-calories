import sharp from 'sharp'
import { v4 as uuidv4 } from 'uuid'
import { getDb } from '@/lib/db'
import { nowIST } from '@/lib/datetime'
import { MenuItemImageDoc } from '@/types/db'

const MAX_DIMENSION = 1000
const WEBP_QUALITY = 72
const MAX_STORED_BYTES = 400_000 // keep each image well under the Atlas free-tier budget

export function imageUrlFor(id: string): string {
  return `/api/menu/image/${id}`
}

// Resizes + re-encodes to WebP so a phone photo (often several MB) shrinks to
// tens of KB before it ever touches Mongo — the whole point of storing images
// in the DB itself instead of a separate blob store.
export async function saveMenuImage(rawBuffer: Buffer): Promise<{ id: string; url: string; size: number }> {
  const compressed = await sharp(rawBuffer)
    .rotate()
    .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer()

  if (compressed.length > MAX_STORED_BYTES) {
    throw new Error('Image is too large even after compression — try a smaller photo')
  }

  const doc: MenuItemImageDoc = {
    _id: uuidv4(),
    mime_type: 'image/webp',
    data: compressed,
    size: compressed.length,
    created_at: nowIST(),
  }

  const db = await getDb()
  await db.collection<MenuItemImageDoc>('menu_item_images').insertOne(doc)

  return { id: doc._id, url: imageUrlFor(doc._id), size: doc.size }
}

export async function deleteMenuImage(id: string): Promise<void> {
  const db = await getDb()
  await db.collection<MenuItemImageDoc>('menu_item_images').deleteOne({ _id: id })
}

// Given a menu item's `images` array (a mix of "/api/menu/image/{id}" URLs and
// legacy static paths like "/meals/placeholder.jpg"), pulls out the ids of any
// DB-stored images so callers can clean up orphans when images are removed/replaced.
export function extractStoredImageIds(urls: string[]): string[] {
  return urls
    .map((url) => url.match(/^\/api\/menu\/image\/([^/?]+)/)?.[1])
    .filter((id): id is string => !!id)
}
