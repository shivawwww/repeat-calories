import Link from 'next/link'
import Image from 'next/image'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-1 items-center justify-center overflow-hidden bg-cream px-4 py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-orange-soft blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -right-16 h-80 w-80 rounded-full bg-green-soft blur-3xl"
      />

      <div className="relative w-full max-w-md">
        <Link href="/" className="mx-auto mb-6 flex w-fit items-center justify-center transition-transform active:scale-95">
          <Image src="/logo.png" alt="Repeat Calories" width={96} height={96} className="rounded-3xl" priority />
        </Link>
        <div className="relative rounded-3xl border border-cream-deep bg-cream-soft p-7 shadow-xl shadow-ink/5 sm:p-9">
          {children}
        </div>
      </div>
    </div>
  )
}
