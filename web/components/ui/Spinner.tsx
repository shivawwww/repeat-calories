export default function Spinner({ className = 'h-6 w-6 text-green' }: { className?: string }) {
  return <span className={`inline-block animate-spin rounded-full border-2 border-current border-t-transparent ${className}`} />
}
