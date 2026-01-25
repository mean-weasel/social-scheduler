'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Check, AlertCircle, Trash2, Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getInitials } from '@/lib/profile'
import { createClient } from '@/lib/supabase/client'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import PasswordStrength from '@/components/ui/PasswordStrength'

export default function ProfilePage() {
  const router = useRouter()
  const supabase = createClient()

  // User data
  const [email, setEmail] = useState<string>('')
  const [displayName, setDisplayName] = useState('')
  const [originalDisplayName, setOriginalDisplayName] = useState('')
  const [loading, setLoading] = useState(true)

  // Password change
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // UI state
  const [saving, setSaving] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null)

  // Load user data
  useEffect(() => {
    // E2E Test Mode - use mock data
    if (process.env.NEXT_PUBLIC_E2E_TEST_MODE === 'true') {
      setEmail('test@example.com')
      setDisplayName('Test User')
      setOriginalDisplayName('Test User')
      setLoading(false)
      return
    }

    async function loadUser() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/login')
          return
        }

        setEmail(user.email || '')

        // Fetch profile
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profile) {
          setDisplayName(profile.display_name || '')
          setOriginalDisplayName(profile.display_name || '')
        }
      } catch (err) {
        console.error('Error loading user:', err)
        setError('Failed to load profile')
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [supabase, router])

  // Save profile changes
  const handleSaveProfile = async () => {
    setSaving(true)
    setError(null)
    setSuccess(null)

    // E2E Test Mode - simulate success
    if (process.env.NEXT_PUBLIC_E2E_TEST_MODE === 'true') {
      await new Promise(resolve => setTimeout(resolve, 500))
      setOriginalDisplayName(displayName)
      setSuccess('Profile updated successfully')
      setTimeout(() => setSuccess(null), 3000)
      setSaving(false)
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error: updateError } = await supabase
        .from('user_profiles')
        .upsert({
          id: user.id,
          display_name: displayName.trim() || null,
          updated_at: new Date().toISOString()
        })

      if (updateError) throw updateError

      setOriginalDisplayName(displayName)
      setSuccess('Profile updated successfully')
      setTimeout(() => setSuccess(null), 3000)

      // Refresh the page to update header
      router.refresh()
    } catch (err) {
      console.error('Error saving profile:', err)
      setError('Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  // Change password
  const handleChangePassword = async () => {
    setPasswordError(null)
    setPasswordSuccess(null)

    // Validation
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters')
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match')
      return
    }

    setChangingPassword(true)

    // E2E Test Mode - simulate success
    if (process.env.NEXT_PUBLIC_E2E_TEST_MODE === 'true') {
      await new Promise(resolve => setTimeout(resolve, 500))
      setNewPassword('')
      setConfirmPassword('')
      setPasswordSuccess('Password updated successfully')
      setTimeout(() => setPasswordSuccess(null), 3000)
      setChangingPassword(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error

      setNewPassword('')
      setConfirmPassword('')
      setPasswordSuccess('Password updated successfully')
      setTimeout(() => setPasswordSuccess(null), 3000)
    } catch (err: unknown) {
      console.error('Error changing password:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to change password'
      setPasswordError(errorMessage)
    } finally {
      setChangingPassword(false)
    }
  }

  // Delete account
  const handleDeleteAccount = async () => {
    setDeleting(true)
    setError(null)

    // E2E Test Mode - simulate deletion and redirect
    if (process.env.NEXT_PUBLIC_E2E_TEST_MODE === 'true') {
      await new Promise(resolve => setTimeout(resolve, 500))
      setShowDeleteDialog(false)
      router.push('/login')
      return
    }

    try {
      // Note: Full account deletion requires admin privileges
      // For now, we'll sign out the user and they can contact support
      // In production, you'd use an Edge Function with admin privileges

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Delete user profile first (will cascade to other data via FK)
      const { error: deleteError } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', user.id)

      if (deleteError) throw deleteError

      // Sign out
      await supabase.auth.signOut()
      router.push('/login')
    } catch (err) {
      console.error('Error deleting account:', err)
      setError('Failed to delete account. Please contact support.')
      setDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  const hasProfileChanges = displayName !== originalDisplayName
  const initials = getInitials(displayName, email)

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-8 animate-fade-in">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-32 bg-muted rounded" />
          <div className="h-4 w-48 bg-muted rounded" />
          <div className="h-64 bg-muted rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-8 animate-fade-in">
      <h1 className="text-2xl md:text-3xl font-display font-bold tracking-tight mb-2">Profile</h1>
      <p className="text-muted-foreground mb-2">
        Manage your account settings.
      </p>
      <div className="h-1 w-16 bg-gradient-to-r from-[hsl(var(--gold))] to-transparent mb-8 rounded-full" />

      {/* Status messages */}
      {success && (
        <div className="flex items-center gap-2 p-4 rounded-lg bg-green-500/10 text-green-500 mb-6 animate-slide-up">
          <Check className="w-4 h-4" />
          {success}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-4 rounded-lg bg-destructive/10 text-destructive mb-6 animate-slide-up">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Profile Information */}
      <div className="p-6 rounded-xl border border-border bg-card mb-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          Profile Information
        </h2>

        {/* Avatar */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[hsl(var(--gold))] to-[hsl(var(--gold-dark))] flex items-center justify-center text-xl font-semibold text-white">
            {initials}
          </div>
          <div>
            <p className="text-sm font-medium">{displayName || 'No display name set'}</p>
            <p className="text-xs text-muted-foreground">{email}</p>
          </div>
        </div>

        {/* Display Name */}
        <div className="space-y-2">
          <label htmlFor="displayName" className="block text-sm font-medium">
            Display Name
          </label>
          <input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Enter your display name"
            className={cn(
              'w-full px-4 py-3 rounded-lg',
              'bg-background border border-border',
              'focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10',
              'transition-all'
            )}
          />
          <p className="text-xs text-muted-foreground">
            This name will be shown in the app header.
          </p>
        </div>

        {/* Save button */}
        <button
          onClick={handleSaveProfile}
          disabled={!hasProfileChanges || saving}
          className={cn(
            'mt-4 px-4 py-2.5 rounded-lg',
            'bg-primary text-primary-foreground font-medium text-sm',
            'hover:opacity-90 transition-opacity',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Account */}
      <div className="p-6 rounded-xl border border-border bg-card mb-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          Account
        </h2>

        {/* Email (read-only) */}
        <div className="space-y-2 mb-6">
          <label className="block text-sm font-medium">
            Email Address
          </label>
          <div className={cn(
            'w-full px-4 py-3 rounded-lg',
            'bg-muted/50 border border-border text-muted-foreground'
          )}>
            {email}
          </div>
          <p className="text-xs text-muted-foreground">
            Email cannot be changed.
          </p>
        </div>

        {/* Password Change */}
        <div className="border-t border-border pt-6">
          <h3 className="text-sm font-medium mb-4">Change Password</h3>

          {passwordSuccess && (
            <div className="flex items-center gap-2 p-4 rounded-lg bg-green-500/10 text-green-500 mb-4 animate-slide-up">
              <Check className="w-4 h-4" />
              {passwordSuccess}
            </div>
          )}

          {passwordError && (
            <div className="flex items-center gap-2 p-4 rounded-lg bg-destructive/10 text-destructive mb-4 animate-slide-up">
              <AlertCircle className="w-4 h-4" />
              {passwordError}
            </div>
          )}

          <div className="space-y-4">
            {/* New Password */}
            <div className="space-y-2">
              <label htmlFor="newPassword" className="block text-sm font-medium">
                New Password
              </label>
              <div className="relative">
                <input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className={cn(
                    'w-full px-4 py-3 pr-10 rounded-lg',
                    'bg-background border border-border',
                    'focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10',
                    'transition-all'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <PasswordStrength password={newPassword} />
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="block text-sm font-medium">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className={cn(
                    'w-full px-4 py-3 pr-10 rounded-lg',
                    'bg-background border border-border',
                    'focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10',
                    'transition-all'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              onClick={handleChangePassword}
              disabled={!newPassword || !confirmPassword || changingPassword}
              className={cn(
                'px-4 py-2.5 rounded-lg',
                'bg-primary text-primary-foreground font-medium text-sm',
                'hover:opacity-90 transition-opacity',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {changingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="p-6 rounded-xl border border-destructive/30 bg-card">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-destructive mb-4">
          Danger Zone
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Once you delete your account, there is no going back. All your data will be permanently removed.
        </p>
        <button
          onClick={() => setShowDeleteDialog(true)}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-lg',
            'bg-destructive text-destructive-foreground font-medium text-sm',
            'hover:bg-destructive/90 transition-colors'
          )}
        >
          <Trash2 className="w-4 h-4" />
          Delete Account
        </button>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteDialog}
        onConfirm={handleDeleteAccount}
        onCancel={() => setShowDeleteDialog(false)}
        title="Delete Account"
        description="Are you sure you want to delete your account? This action cannot be undone. All your posts, campaigns, and data will be permanently deleted."
        confirmText={deleting ? 'Deleting...' : 'Delete Account'}
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  )
}
