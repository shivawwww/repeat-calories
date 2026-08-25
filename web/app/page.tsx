import Link from 'next/link'
import Image from 'next/image'
import { getCurrentUser } from '@/lib/auth'
import Hero from '@/components/landing/Hero'

const PILLARS = [
  {
    icon: '🥦',
    title: 'Clean Ingredients',
    body: 'No shortcuts, no fillers — every meal is cooked fresh from ingredients you can actually pronounce.',
  },
  {
    icon: '📈',
    title: 'Consistent Results',
    body: 'Same great macros, every single order — so your nutrition plan doesn’t have to guess.',
  },
  {
    icon: '⚖️',
    title: 'Balanced Nutrition',
    body: 'Protein, carbs and fibre measured on every plate — logged right there on the label.',
  },
]

const STEPS = [
  {
    step: '01',
    title: 'Pick your meals',
    body: 'Browse lunch & dinner menus with full macro breakdowns for every dish.',
  },
  {
    step: '02',
    title: 'Order before cutoff',
    body: 'Lunch orders close 10:00 AM, dinner 4:00 PM IST — for fresh, same-day delivery.',
  },
  {
    step: '03',
    title: 'Rep. Eat. Repeat.',
    body: 'We deliver hot & fresh across Coimbatore. Track orders in real time, right to your door.',
  },
]

export default async function LandingPage() {
  const user = await getCurrentUser()
  const ctaHref = user ? '/menu' : '/signup'
  const ctaLabel = user ? 'Go to Menu' : 'Get Started'

  return (
    <div className="flex-1">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5 sm:px-10 lg:px-16">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="Repeat Calories" width={40} height={40} className="rounded-xl" priority />
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <Link
              href="/menu"
              className="rounded-full bg-green px-5 py-2.5 font-display text-sm font-semibold uppercase tracking-wide text-cream-soft transition-colors hover:bg-green-dark"
            >
              Menu
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-full px-4 py-2.5 font-display text-sm font-semibold uppercase tracking-wide text-ink transition-colors hover:bg-cream-deep/60"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-orange px-5 py-2.5 font-display text-sm font-semibold uppercase tracking-wide text-cream-soft transition-colors hover:bg-orange-dark"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </nav>

      <Hero ctaHref={ctaHref} ctaLabel={ctaLabel} />

      {/* Why We Stand Out */}
      <section className="mx-auto max-w-6xl px-6 py-16 sm:px-10 lg:px-16">
        <div className="text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-orange">Why We Stand Out</span>
          <h2 className="mt-2 font-display text-3xl font-semibold text-ink sm:text-4xl">Built for people who track their reps</h2>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          {PILLARS.map((p) => (
            <div
              key={p.title}
              className="rounded-3xl border border-cream-deep bg-cream-soft p-7 shadow-sm shadow-ink/5 transition-transform hover:-translate-y-1"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-soft text-2xl">{p.icon}</div>
              <h3 className="mt-4 font-display text-lg font-semibold text-ink">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-green-soft/50 py-16">
        <div className="mx-auto max-w-6xl px-6 sm:px-10 lg:px-16">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-green">How It Works</span>
            <h2 className="mt-2 font-display text-3xl font-semibold text-ink sm:text-4xl">From cart to doorstep</h2>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.step} className="relative rounded-3xl bg-cream-soft p-7">
                <span className="font-display text-4xl font-bold text-orange-soft">{s.step}</span>
                <h3 className="mt-3 font-display text-lg font-semibold text-ink">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA banner */}
      <section className="mx-auto max-w-6xl px-6 py-16 sm:px-10 lg:px-16">
        <div className="relative overflow-hidden rounded-[36px] bg-green px-8 py-14 text-center shadow-xl shadow-green/20 sm:px-16">
          <div aria-hidden className="pointer-events-none absolute -left-10 -top-10 h-56 w-56 rounded-full bg-white/5" />
          <div aria-hidden className="pointer-events-none absolute -right-16 -bottom-16 h-72 w-72 rounded-full bg-white/5" />
          <h2 className="relative font-display text-3xl font-semibold text-cream-soft sm:text-4xl">
            Fuel your rep. Fuel your life.
          </h2>
          <p className="relative mx-auto mt-3 max-w-lg text-sm text-cream-soft/80">
            Join Coimbatore&apos;s cleanest cloud kitchen and never break your streak on nutrition again.
          </p>
          <Link
            href={ctaHref}
            className="relative mt-7 inline-flex items-center justify-center rounded-full bg-orange px-8 py-3.5 font-display text-sm font-semibold uppercase tracking-wide text-cream-soft shadow-lg transition-all active:scale-[0.97] hover:bg-orange-dark"
          >
            {ctaLabel}
          </Link>
        </div>
      </section>

      <footer className="border-t border-cream-deep px-6 py-10 sm:px-10 lg:px-16">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="Repeat Calories" width={32} height={32} className="rounded-lg" />
            <span className="text-sm text-ink-soft">© {new Date().getFullYear()} Repeat Calories, Coimbatore</span>
          </div>
          <div className="flex items-center gap-5 text-sm font-semibold text-ink-soft">
            <Link href="/menu" className="hover:text-green">
              Menu
            </Link>
            <Link href="/login" className="hover:text-green">
              Sign In
            </Link>
            <a href="https://wa.me/919940749456" target="_blank" rel="noopener noreferrer" className="hover:text-green">
              WhatsApp
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
