export default function StatCard({
  label,
  value,
  icon,
  tone = 'orange',
}: {
  label: string
  value: string
  icon: string
  tone?: 'orange' | 'green' | 'gold'
}) {
  const toneClass = { orange: 'bg-orange-soft text-orange-dark', green: 'bg-green-soft text-green-dark', gold: 'bg-gold/15 text-gold' }[tone]

  return (
    <div className="rounded-3xl border border-cream-deep bg-cream-soft p-6">
      <div className={`flex h-10 w-10 items-center justify-center rounded-2xl text-lg ${toneClass}`}>{icon}</div>
      <p className="stat-figure mt-4 font-display text-3xl font-bold text-ink">{value}</p>
      <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-ink-soft">{label}</p>
    </div>
  )
}
