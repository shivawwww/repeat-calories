import Image from 'next/image'
import Link from 'next/link'

export default function Logo({ size = 44, href = '/menu' }: { size?: number; href?: string | null }) {
  const img = (
    <Image
      src="/logo.png"
      alt="Repeat Calories"
      width={size}
      height={size}
      className="rounded-2xl"
      priority
    />
  )
  if (!href) return img
  return (
    <Link href={href} className="inline-flex shrink-0 items-center transition-transform active:scale-95">
      {img}
    </Link>
  )
}
