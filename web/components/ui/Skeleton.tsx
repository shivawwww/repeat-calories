export default function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-cream-deep/70 ${className}`} />
}
