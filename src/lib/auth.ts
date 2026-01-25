import { createClient } from './supabase/server'

/**
 * Check if we're running in test mode.
 * IMPORTANT: Test mode is only allowed when NODE_ENV is NOT 'production'.
 * This prevents accidental RLS bypass in production environments.
 */
export function isTestMode(): boolean {
  // Safety check: Never allow test mode in production
  if (process.env.NODE_ENV === 'production') {
    return false
  }
  return process.env.E2E_TEST_MODE === 'true'
}

/**
 * Require authentication for API routes.
 * Returns the authenticated user's ID or throws a 401-style error.
 *
 * In test mode (non-production only), returns a test user ID.
 *
 * @throws Error with message 'Unauthorized' if not authenticated
 */
export async function requireAuth(): Promise<{ userId: string }> {
  // In test mode (non-production only), use a consistent test user ID
  if (isTestMode()) {
    return { userId: 'test-user-id' }
  }

  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error('Unauthorized')
  }

  return { userId: user.id }
}

/**
 * Helper to get user ID or null (for optional auth scenarios).
 * Useful for routes that can work with or without authentication.
 */
export async function getOptionalAuth(): Promise<{ userId: string | null }> {
  if (isTestMode()) {
    return { userId: 'test-user-id' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return { userId: user?.id || null }
}
