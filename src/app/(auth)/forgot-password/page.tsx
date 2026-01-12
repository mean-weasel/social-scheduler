'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) {
        setError(error.message)
      } else {
        setSuccess(true)
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md w-full space-y-8 p-8 text-center">
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <h2 className="text-xl font-semibold text-green-800 dark:text-green-200 mb-2">
              Check your email
            </h2>
            <p className="text-green-700 dark:text-green-300">
              We&apos;ve sent a password reset link to <strong>{email}</strong>.
              Click the link in the email to reset your password.
            </p>
          </div>
          <Link href="/login" className="text-amber-600 hover:text-amber-500 font-medium">
            Back to sign in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Reset your password
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Enter your email and we&apos;ll send you a reset link
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="you@example.com"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
          >
            {loading ? 'Sending...' : 'Send reset link'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          Remember your password?{' '}
          <Link href="/login" className="text-amber-600 hover:text-amber-500 font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
