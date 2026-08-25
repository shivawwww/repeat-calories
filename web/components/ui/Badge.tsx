type Tone = 'green' | 'orange' | 'red' | 'gold' | 'neutral'

const TONES: Record<Tone, string> = {
  green: 'bg-green-soft text-green-dark',
  orange: 'bg-orange-soft text-orange-dark',
  red: 'bg-red-soft text-red',
  gold: 'bg-gold/15 text-gold',
  neutral: 'bg-cream-deep text-ink-soft',
}

export default function Badge({ tone = 'neutral', children }: { tone?: Tone; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${TONES[tone]}`}>
      {children}
    </span>
  )
}
