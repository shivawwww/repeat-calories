// Small line-icon set — consistent 1.8 stroke weight, rounded caps, no external icon library.
type IconProps = { className?: string }
const base = 'stroke-current'

export function IconMenu({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={`${base} ${className}`} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 6.5c0-1 .8-2 2.2-2 1.6 0 2.3 1.2 2.3 3.2 0 2.6-1 4-2.3 4-1.2 0-1.9-.7-2.1-1.6M6.3 11.7V19M4 19h4.6" />
      <path d="M13.5 4.5v14.5M18.5 4.5c-1.6 0-2.7 1.4-2.7 3.6s1 3.4 2.2 3.6c-.9.2-2.2 1-2.2 3.4 0 2 1.1 3.4 2.7 3.4s2.7-1.4 2.7-3.4c0-2.4-1.3-3.2-2.2-3.4 1.2-.2 2.2-1.4 2.2-3.6s-1.1-3.6-2.7-3.6z" />
    </svg>
  )
}

export function IconCart({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={`${base} ${className}`} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 4h2l2.4 12.2a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.6L21 8H6" />
      <circle cx="9.5" cy="20" r="1.4" />
      <circle cx="17" cy="20" r="1.4" />
    </svg>
  )
}

export function IconReceipt({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={`${base} ${className}`} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3h12v18l-2.5-1.5L13 21l-2.5-1.5L8 21l-2-1.5V3z" />
      <path d="M9 8h6M9 12h6M9 16h3.5" />
    </svg>
  )
}

export function IconUser({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={`${base} ${className}`} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20c1.4-3.6 4.3-5.5 7.5-5.5s6.1 1.9 7.5 5.5" />
    </svg>
  )
}

export function IconLogout({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={`${base} ${className}`} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3M16 16l4-4-4-4M20 12H9" />
    </svg>
  )
}

export function IconPlus({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={`${base} ${className}`} strokeWidth={2.4} strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

export function IconMinus({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={`${base} ${className}`} strokeWidth={2.4} strokeLinecap="round">
      <path d="M5 12h14" />
    </svg>
  )
}

export function IconMapPin({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={`${base} ${className}`} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21s7-6.5 7-11.5a7 7 0 0 0-14 0C5 14.5 12 21 12 21z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </svg>
  )
}

export function IconCheck({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={`${base} ${className}`} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12.5l5 5L20 6" />
    </svg>
  )
}

export function IconChevronRight({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={`${base} ${className}`} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 5l7 7-7 7" />
    </svg>
  )
}

export function IconTrash({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={`${base} ${className}`} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-8 0 .6 12.5A2 2 0 0 0 8.6 21h6.8a2 2 0 0 0 2-1.9L18 7" />
    </svg>
  )
}

export function IconSearch({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={`${base} ${className}`} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.8-3.8" />
    </svg>
  )
}

export function IconGrid({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={`${base} ${className}`} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="7" height="7" rx="1.5" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" />
      <rect x="13" y="13" width="7" height="7" rx="1.5" />
    </svg>
  )
}

export function IconChart({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={`${base} ${className}`} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20V10M11 20V4M18 20v-7" />
    </svg>
  )
}

export function IconUsers({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={`${base} ${className}`} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19c1-3 3-4.5 5.5-4.5S13.5 16 14.5 19" />
      <circle cx="17" cy="9" r="2.4" />
      <path d="M15.8 14.2c1.9.3 3.3 1.7 4 4.3" />
    </svg>
  )
}

export function IconBell({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={`${base} ${className}`} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 10a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 14 6 10z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </svg>
  )
}
