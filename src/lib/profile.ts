// User profile type definitions and utilities

/**
 * Get initials for avatar display
 * Prioritizes display_name, falls back to email, then 'U'
 */
export function getInitials(displayName?: string | null, email?: string | null): string {
  if (displayName && displayName.trim()) {
    return displayName.trim().charAt(0).toUpperCase()
  }
  if (email) {
    return email.charAt(0).toUpperCase()
  }
  return 'U'
}
