import { useEffect, useRef, useState, useCallback } from 'react'

type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error'

interface UseAutoSaveOptions {
  data: unknown
  onSave: () => void | Promise<void>
  delay?: number
  enabled?: boolean
}

export function useAutoSave({
  data,
  onSave,
  delay = 3000,
  enabled = true,
}: UseAutoSaveOptions) {
  const [status, setStatus] = useState<AutoSaveStatus>('idle')
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastDataRef = useRef<string>('')
  const isFirstRender = useRef(true)

  // Serialize data for comparison
  const serializedData = JSON.stringify(data)

  const save = useCallback(async () => {
    setStatus('saving')
    try {
      await onSave()
      setStatus('saved')
      // Reset to idle after 2 seconds
      setTimeout(() => setStatus('idle'), 2000)
    } catch {
      setStatus('error')
    }
  }, [onSave])

  useEffect(() => {
    // Skip first render
    if (isFirstRender.current) {
      isFirstRender.current = false
      lastDataRef.current = serializedData
      return
    }

    // Skip if disabled
    if (!enabled) return

    // Skip if data hasn't changed
    if (serializedData === lastDataRef.current) return

    // Update last data
    lastDataRef.current = serializedData

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Set new timeout
    timeoutRef.current = setTimeout(save, delay)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [serializedData, delay, enabled, save])

  return { status, save }
}
