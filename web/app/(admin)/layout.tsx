import AdminSidebar from '@/components/layout/AdminSidebar'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-1 flex-col sm:flex-row">
      <AdminSidebar />
      <main className="flex-1 bg-cream px-5 py-6 sm:px-8 sm:py-8">{children}</main>
    </div>
  )
}
