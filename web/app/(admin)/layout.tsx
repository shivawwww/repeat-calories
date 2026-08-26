import AdminSidebar from '@/components/layout/AdminSidebar'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-dvh flex-col overflow-hidden sm:flex-row">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto bg-cream px-5 py-6 sm:px-8 sm:py-8">{children}</main>
    </div>
  )
}
