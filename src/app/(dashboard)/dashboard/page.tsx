import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        Dashboard
      </h1>
      <p className="text-gray-600 dark:text-gray-400">
        Welcome, {user?.email}!
      </p>
      <p className="mt-4 text-gray-500 dark:text-gray-500">
        Next.js + Supabase migration in progress. This is a placeholder page.
      </p>
    </div>
  )
}
