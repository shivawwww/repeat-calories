import Image from 'next/image'
import Link from 'next/link'

// The source brand file (logo.png) bakes in ~40% vertical padding around the
// mark, which made it look tiny no matter how large the square was rendered.
// These are pre-cropped, transparent-background exports (see public/logo*.png)
// sized to their actual artwork bounds, so a given `height` renders the mark
// itself at that height instead of mostly empty cream padding.
const NATURAL: Record<Variant, { w: number; h: number; src: string }> = {
  wordmark: { w: 1004, h: 395, src: '/logo-wordmark.png' },
  full: { w: 1024, h: 473, src: '/logo-mark.png' },
}

type Variant = 'wordmark' | 'full'

export default function Logo({
  height = 40,
  href = '/menu',
  variant = 'wordmark',
}: {
  height?: number
  href?: string | null
  variant?: Variant
}) {
  const { w, h, src } = NATURAL[variant]
  const width = Math.round((height / h) * w)

  const img = <Image src={src} alt="Repeat Calories" width={width} height={height} priority />

  if (!href) return img
  return (
    <Link href={href} className="inline-flex shrink-0 items-center transition-transform active:scale-95">
      {img}
    </Link>
  )
}
