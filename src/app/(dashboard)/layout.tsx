import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppHeader, FloatingActionButton } from './components/AppHeader'
import { BottomNav } from './components/BottomNav'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />

      {/* Main content - bottom padding for mobile nav */}
      <main className="flex-1 pb-20 md:pb-0">
        {children}
      </main>

      {/* FAB for new post - hidden on mobile (replaced by bottom nav) */}
      <FloatingActionButton />

      {/* Bottom navigation for mobile */}
      <BottomNav />
    </div>
  )
}
