import { createServerClient, createClient as createSupabaseClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  // In E2E test mode, use service role key to bypass RLS
  if (process.env.E2E_TEST_MODE === 'true' && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        cookies: {
          getAll() { return [] },
          setAll() {},
        },
      }
    )
  }

  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from Server Component - cookies can only be modified in
            // a Server Action or Route Handler
          }
        },
      },
    }
  )
}
