/**
 * Crops the circular fork/knife/leaf mark out of public/logo-mark.png (the
 * full wordmark) and applies a circular alpha mask, since the mark sits
 * tightly kerned against neighbouring letters in the source art with no
 * clean rectangular gap to crop against.
 *
 * Re-run this any time the source logo changes:
 *   node scripts/generate-favicon.mjs
 */
import sharp from 'sharp'
import fs from 'node:fs'

const CROP = { left: 428, top: 210, width: 180, height: 180 }
const MASK_CX = 84
const MASK_CY = 90
const RADIUS = 66

const cropped = await sharp('public/logo-mark.png').extract(CROP).toBuffer()

const maskSvg = Buffer.from(
  `<svg width="${CROP.width}" height="${CROP.height}"><circle cx="${MASK_CX}" cy="${MASK_CY}" r="${RADIUS}" fill="#fff"/></svg>`
)

const masked = await sharp(cropped)
  .composite([{ input: maskSvg, blend: 'dest-in' }])
  .png()
  .toBuffer()

await sharp(masked).resize(180, 180).toFile('app/icon.png')

const sizes = [16, 32, 48]
const pngBuffers = await Promise.all(sizes.map((s) => sharp(masked).resize(s, s).png().toBuffer()))

// Minimal hand-rolled ICO container (PNG-compressed frames, supported since
// Vista) — no extra dependency needed just to bundle a few PNGs into one file.
function buildIco(images) {
  const headerSize = 6
  const dirEntrySize = 16
  const header = Buffer.alloc(headerSize)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(images.length, 4)

  let offset = headerSize + dirEntrySize * images.length
  const dirEntries = []
  const dataChunks = []
  for (const { size, buf } of images) {
    const entry = Buffer.alloc(dirEntrySize)
    entry.writeUInt8(size === 256 ? 0 : size, 0)
    entry.writeUInt8(size === 256 ? 0 : size, 1)
    entry.writeUInt16LE(1, 4)
    entry.writeUInt16LE(32, 6)
    entry.writeUInt32LE(buf.length, 8)
    entry.writeUInt32LE(offset, 12)
    dirEntries.push(entry)
    dataChunks.push(buf)
    offset += buf.length
  }
  return Buffer.concat([header, ...dirEntries, ...dataChunks])
}

fs.writeFileSync('app/favicon.ico', buildIco(sizes.map((s, i) => ({ size: s, buf: pngBuffers[i] }))))

console.log('Wrote app/favicon.ico and app/icon.png')
