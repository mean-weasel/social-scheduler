'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle, X } from 'lucide-react'

/**
 * Shows a success banner when ?verified=true is in the URL.
 * This component should always be rendered in the layout so it can
 * catch the verification success redirect from the auth callback.
 */
export function VerificationSuccessBanner() {
  const searchParams = useSearchParams()
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (searchParams.get('verified') === 'true') {
      setShow(true)
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname)
      // Auto-dismiss after 5 seconds
      const timer = setTimeout(() => setShow(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [searchParams])

  if (!show) return null

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-green-500/10 text-green-600 dark:text-green-500 border-b border-green-500/20">
      <CheckCircle className="w-5 h-5 flex-shrink-0" />
      <p className="flex-1 text-sm font-medium">Email verified successfully!</p>
      <button
        onClick={() => setShow(false)}
        className="p-1 hover:bg-green-500/10 rounded transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
