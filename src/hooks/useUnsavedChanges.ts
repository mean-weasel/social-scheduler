import { useEffect, useCallback } from 'react'

interface UseUnsavedChangesOptions {
  isDirty: boolean
  message?: string
}

export function useUnsavedChanges({
  isDirty,
  message = 'You have unsaved changes. Are you sure you want to leave?',
}: UseUnsavedChangesOptions) {
  // Handle browser close/refresh
  useEffect(() => {
    if (!isDirty) return

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = message
      return message
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty, message])

  // Helper to check if navigation should be blocked
  const confirmNavigation = useCallback(() => {
    if (!isDirty) return true
    return window.confirm(message)
  }, [isDirty, message])

  return { confirmNavigation }
}
