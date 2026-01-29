'use client'

import { useState, useEffect } from 'react'
import { Bell, BellOff, Sun, Moon, Monitor, Check, AlertCircle } from 'lucide-react'
import { useTheme, Theme } from '@/lib/theme'
import {
  useNotificationStore,
  getNotificationPermission,
  requestNotificationPermission,
} from '@/lib/notifications'
import { cn } from '@/lib/utils'
import { IOSToggleSwitch } from '@/components/ui/IOSToggleSwitch'

const THEME_OPTIONS: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
]

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const { enabled: notificationsEnabled, setEnabled: setNotificationsEnabled } =
    useNotificationStore()
  const [notificationPermission, setNotificationPermission] =
    useState<NotificationPermission>('default')
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    setNotificationPermission(getNotificationPermission())
  }, [])

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
    </div>
  )
}
