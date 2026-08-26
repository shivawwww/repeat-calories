import Logo from '@/components/ui/Logo'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex h-dvh flex-1 items-center justify-center overflow-x-hidden overflow-y-auto bg-cream px-4 py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-orange-soft blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -right-16 h-80 w-80 rounded-full bg-green-soft blur-3xl"
      />

      <div className="relative w-full max-w-md">
        <div className="mx-auto mb-6 flex w-fit">
          <Logo href="/" variant="full" height={76} />
        </div>
        <div className="relative rounded-3xl border border-cream-deep bg-cream-soft p-7 shadow-xl shadow-ink/5 sm:p-9">
          {children}
        </div>
      </div>
    </div>
  )
}
