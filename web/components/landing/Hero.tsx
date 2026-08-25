'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion, type Variants } from 'framer-motion'

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.11, delayChildren: 0.05 } },
}

const item: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
}

export default function Hero({ ctaHref, ctaLabel }: { ctaHref: string; ctaLabel: string }) {
  return (
    <section className="relative overflow-hidden px-6 pb-20 pt-8 sm:px-10 lg:px-16">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 top-10 h-96 w-96 rounded-full bg-orange-soft/70 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 top-40 h-80 w-80 rounded-full bg-green-soft blur-3xl"
      />

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative mx-auto flex max-w-6xl flex-col-reverse items-center gap-14 lg:flex-row lg:items-center lg:gap-8"
      >
        <div className="relative z-10 flex flex-1 flex-col items-center text-center lg:items-start lg:text-left">
          <motion.span
            variants={item}
            className="inline-flex items-center gap-2 rounded-full bg-green-soft px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-green-dark"
          >
            🌿 Cloud Kitchen · Coimbatore
          </motion.span>

          <motion.h1
            variants={item}
            className="mt-5 font-display text-5xl font-semibold leading-[1.05] text-ink sm:text-6xl lg:text-7xl"
          >
            <span className="text-orange">Rep.</span> <span className="text-green">Eat.</span>{' '}
            <span className="text-orange">Repeat.</span>
          </motion.h1>

          <motion.p variants={item} className="mt-5 max-w-md text-lg leading-relaxed text-ink-soft">
            Macro-balanced meals, cooked fresh and delivered across Coimbatore. Healthy meals, stronger you —
            every single day.
          </motion.p>

          <motion.div variants={item} className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
            <Link
              href={ctaHref}
              className="inline-flex items-center justify-center rounded-full bg-orange px-8 py-3.5 font-display text-base font-semibold uppercase tracking-wide text-cream-soft shadow-lg shadow-orange/30 transition-all active:scale-[0.97] hover:bg-orange-dark"
            >
              {ctaLabel}
            </Link>
            <Link
              href="/menu"
              className="inline-flex items-center justify-center rounded-full border-2 border-green px-8 py-3.5 font-display text-base font-semibold uppercase tracking-wide text-green transition-all active:scale-[0.97] hover:bg-green-soft"
            >
              View Menu
            </Link>
          </motion.div>

          <motion.div variants={item} className="mt-9 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm font-medium text-ink-soft lg:justify-start">
            <span>🔥 Same-day lunch &amp; dinner</span>
            <span>🧭 Macros on every meal</span>
            <span>🚴 Delivered across Coimbatore</span>
          </motion.div>
        </div>

        <motion.div variants={item} className="relative flex flex-1 justify-center">
          <div className="relative w-full max-w-md">
            <div className="overflow-hidden rounded-[36px] border border-cream-deep bg-white shadow-2xl shadow-ink/10">
              <Image
                src="/brand/packaging-hero.jpg"
                alt="Repeat Calories packaging — meal trays, pouches and bag"
                width={1280}
                height={853}
                className="h-auto w-full object-cover"
                priority
              />
            </div>

            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -left-6 top-8 rounded-2xl border border-cream-deep bg-cream-soft px-4 py-3 shadow-lg shadow-ink/10 sm:-left-10"
            >
              <p className="stat-figure text-lg font-bold text-green-dark">32g</p>
              <p className="text-[10px] font-bold uppercase tracking-wide text-ink-soft">Protein</p>
            </motion.div>

            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
              className="absolute -right-4 bottom-10 rounded-2xl border border-cream-deep bg-cream-soft px-4 py-3 shadow-lg shadow-ink/10 sm:-right-8"
            >
              <p className="stat-figure text-lg font-bold text-orange-dark">420</p>
              <p className="text-[10px] font-bold uppercase tracking-wide text-ink-soft">Calories</p>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  )
}
