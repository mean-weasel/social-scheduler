'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Bell,
  BellOff,
  Sun,
  Moon,
  Monitor,
  Check,
  AlertCircle,
  BarChart3,
  Plus,
  Trash2,
  Loader2,
} from 'lucide-react'
import { useTheme, Theme } from '@/lib/theme'
import {
  useNotificationStore,
  getNotificationPermission,
  requestNotificationPermission,
} from '@/lib/notifications'
import { cn } from '@/lib/utils'
import { IOSToggleSwitch } from '@/components/ui/IOSToggleSwitch'
import { useAnalyticsStore, useAnalyticsConnections } from '@/lib/analyticsStore'
import { ConnectAnalyticsModal } from '@/components/analytics/ConnectAnalyticsModal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

const THEME_OPTIONS: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
]

export default function SettingsPage() {
  const searchParams = useSearchParams()
  const { theme, setTheme } = useTheme()
  const { enabled: notificationsEnabled, setEnabled: setNotificationsEnabled } =
    useNotificationStore()
  const [notificationPermission, setNotificationPermission] =
    useState<NotificationPermission>('default')
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Analytics state
  const [showConnectModal, setShowConnectModal] = useState(false)
  const [authData, setAuthData] = useState<{
    accessToken: string
    refreshToken: string
    tokenExpiresAt: string
    scopes: string[]
  } | undefined>(undefined)
  const [connectionToDelete, setConnectionToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const { fetchConnections, deleteConnection, loading: analyticsLoading } = useAnalyticsStore()
  const connections = useAnalyticsConnections()

  useEffect(() => {
    setNotificationPermission(getNotificationPermission())
    fetchConnections()
  }, [fetchConnections])

  // Handle OAuth callback params
  useEffect(() => {
    const analyticsAuth = searchParams.get('analytics_auth')
    const authDataParam = searchParams.get('auth_data')
    const errorParam = searchParams.get('error')

    if (analyticsAuth === 'success' && authDataParam) {
      try {
        const decoded = JSON.parse(
          Buffer.from(authDataParam, 'base64url').toString()
        )
        setAuthData(decoded)
        setShowConnectModal(true)

        // Clean up URL params
        window.history.replaceState({}, '', '/settings')
      } catch (err) {
        console.error('Failed to parse auth data:', err)
        setError('Failed to complete authentication')
      }
    } else if (errorParam) {
      const errorMessages: Record<string, string> = {
        unauthorized: 'Please sign in to connect Google Analytics',
        oauth_denied: 'Google Analytics access was denied',
        missing_code: 'OAuth callback missing authorization code',
        not_configured: 'Google Analytics integration is not configured',
        token_exchange_failed: 'Failed to exchange authorization code',
        missing_tokens: 'Failed to receive access tokens',
        callback_failed: 'OAuth callback failed',
      }
      setError(errorMessages[errorParam] || 'Connection failed')

      // Clean up URL params
      window.history.replaceState({}, '', '/settings')
    }
  }, [searchParams])

  const handleRequestPermission = async () => {
    const permission = await requestNotificationPermission()
    setNotificationPermission(permission)
    if (permission === 'granted') {
      setSuccess('Notifications enabled!')
      setTimeout(() => setSuccess(null), 3000)
    }
  }

  const handleToggleNotifications = (enabled: boolean) => {
    setNotificationsEnabled(enabled)
  }

  const handleConnectAnalytics = () => {
    setAuthData(undefined)
    setShowConnectModal(true)
  }

  const handleConnectSuccess = () => {
    setAuthData(undefined)
    fetchConnections()
    setSuccess('Google Analytics connected successfully!')
    setTimeout(() => setSuccess(null), 3000)
  }

  const handleDeleteConnection = async () => {
    if (!connectionToDelete) return

    setIsDeleting(true)
    try {
      await deleteConnection(connectionToDelete)
      setSuccess('Analytics connection removed')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError((err as Error).message || 'Failed to remove connection')
    } finally {
      setIsDeleting(false)
      setConnectionToDelete(null)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-8 animate-fade-in">
      <h1 className="text-2xl md:text-3xl font-display font-bold tracking-tight mb-2">Settings</h1>
      <p className="text-muted-foreground mb-2">
        Configure your preferences.
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
          <button
            onClick={() => setError(null)}
            className="ml-auto text-sm hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Theme */}
      <div className="p-6 rounded-xl border border-border bg-card mb-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          Appearance
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Choose your preferred color scheme.
        </p>
        <div className="flex gap-2">
          {THEME_OPTIONS.map((option) => {
            const Icon = option.icon
            const isActive = theme === option.value
            return (
              <button
                key={option.value}
                onClick={() => setTheme(option.value)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg',
                  'text-sm font-medium transition-all',
                  'border-2',
                  isActive
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground'
                )}
              >
                <Icon className="w-4 h-4" />
                {option.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Notifications */}
      <div className="p-6 rounded-xl border border-border bg-card mb-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          Notifications
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Get notified when your scheduled posts are due.
        </p>

        {notificationPermission === 'denied' ? (
          <div className="flex items-center gap-2 p-4 rounded-lg bg-destructive/10 text-destructive">
            <AlertCircle className="w-4 h-4" />
            <div>
              <p className="font-medium">Notifications blocked</p>
              <p className="text-sm opacity-80">
                Please enable notifications in your browser settings.
              </p>
            </div>
          </div>
        ) : notificationPermission === 'default' ? (
          <button
            onClick={handleRequestPermission}
            className={cn(
              'flex items-center gap-2 px-4 py-3 rounded-lg w-full',
              'bg-primary text-primary-foreground font-medium text-sm',
              'hover:opacity-90 transition-opacity'
            )}
          >
            <Bell className="w-4 h-4" />
            Enable Notifications
          </button>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-green-500">
              <Check className="w-4 h-4" />
              Browser notifications enabled
            </div>
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-border bg-background">
              {notificationsEnabled ? (
                <Bell className="w-5 h-5 text-[hsl(var(--gold))] flex-shrink-0" />
              ) : (
                <BellOff className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              )}
              <IOSToggleSwitch
                checked={notificationsEnabled}
                onChange={handleToggleNotifications}
                label="Post reminders"
                description="Notify when scheduled posts are due"
              />
            </div>
          </div>
        )}
      </div>

      {/* Analytics */}
      <div className="p-6 rounded-xl border border-border bg-card mb-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          Analytics
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Connect Google Analytics to view website metrics in your dashboard.
        </p>

        {analyticsLoading && connections.length === 0 ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : connections.length > 0 ? (
          <div className="space-y-3">
            {connections.map((connection) => (
              <div
                key={connection.id}
                className="flex items-center justify-between p-3 rounded-lg border border-border bg-background"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <div className="font-medium">
                      {connection.propertyName || `Property ${connection.propertyId}`}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      ID: {connection.propertyId}
                      {connection.syncStatus === 'error' && (
                        <span className="ml-2 text-destructive">Sync error</span>
                      )}
                      {connection.syncStatus === 'success' && (
                        <span className="ml-2 text-green-500">Connected</span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setConnectionToDelete(connection.id)}
                  className={cn(
                    'p-2 rounded-lg',
                    'text-muted-foreground hover:text-destructive',
                    'hover:bg-destructive/10 transition-colors'
                  )}
                  title="Remove connection"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}

            <button
              onClick={handleConnectAnalytics}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-lg w-full',
                'border border-dashed border-border',
                'text-muted-foreground hover:text-foreground',
                'hover:border-primary/50 transition-all'
              )}
            >
              <Plus className="w-4 h-4" />
              Add another property
            </button>
          </div>
        ) : (
          <button
            onClick={handleConnectAnalytics}
            className={cn(
              'flex items-center gap-2 px-4 py-3 rounded-lg w-full',
              'bg-blue-500 text-white font-medium text-sm',
              'hover:bg-blue-600 transition-colors'
            )}
          >
            <BarChart3 className="w-4 h-4" />
            Connect Google Analytics
          </button>
        )}
      </div>

      {/* About */}
      <div className="p-6 rounded-xl border border-border bg-card">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          About
        </h2>
        <ul className="space-y-3 text-sm text-muted-foreground">
          <li className="flex items-start gap-3">
            <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
              1
            </span>
            <span>Create and organize your social media post ideas.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
              2
            </span>
            <span>Schedule posts and get reminded when they&apos;re due.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
              3
            </span>
            <span>All data is stored locally in your browser.</span>
          </li>
        </ul>
      </div>

      {/* Connect Analytics Modal */}
      <ConnectAnalyticsModal
        open={showConnectModal}
        onClose={() => {
          setShowConnectModal(false)
          setAuthData(undefined)
        }}
        authData={authData}
        onSuccess={handleConnectSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!connectionToDelete}
        onConfirm={handleDeleteConnection}
        onCancel={() => setConnectionToDelete(null)}
        title="Remove Analytics Connection"
        description="Are you sure you want to remove this Google Analytics connection? You can reconnect it later."
        confirmText={isDeleting ? 'Removing...' : 'Remove'}
        variant="danger"
      />
    </div>
  )
}
