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
// Valid UUID for test user (used in E2E tests)
const TEST_USER_ID = '00000000-0000-0000-0000-000000000001'

export async function requireAuth(): Promise<{ userId: string }> {
  // In test mode (non-production only), use a consistent test user ID
  if (isTestMode()) {
    return { userId: TEST_USER_ID }
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
    return { userId: TEST_USER_ID }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return { userId: user?.id || null }
}

/**
 * Validate that a user owns a specific project.
 * Returns the project if found and owned by user, throws error otherwise.
 *
 * @param projectId - The project ID to check
 * @param userId - The user ID that should own the project
 * @throws Error with 'Project not found' if project doesn't exist or isn't owned
 */
export async function validateProjectOwnership(
  projectId: string,
  userId: string
): Promise<{ id: string; name: string }> {
  const supabase = await createClient()

  const { data: project, error } = await supabase
    .from('projects')
    .select('id, name')
    .eq('id', projectId)
    .eq('user_id', userId)
    .single()

  if (error || !project) {
    throw new Error('Project not found')
  }

  return project
}

/**
 * Validate that a user owns a specific campaign.
 * Returns the campaign if found and owned by user, throws error otherwise.
 *
 * @param campaignId - The campaign ID to check
 * @param userId - The user ID that should own the campaign
 * @throws Error with 'Campaign not found' if campaign doesn't exist or isn't owned
 */
export async function validateCampaignOwnership(
  campaignId: string,
  userId: string
): Promise<{ id: string; name: string; projectId: string | null }> {
  const supabase = await createClient()

  const { data: campaign, error } = await supabase
    .from('campaigns')
    .select('id, name, project_id')
    .eq('id', campaignId)
    .eq('user_id', userId)
    .single()

  if (error || !campaign) {
    throw new Error('Campaign not found')
  }

  return {
    id: campaign.id,
    name: campaign.name,
    projectId: campaign.project_id
  }
}
