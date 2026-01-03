import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface NotificationState {
  enabled: boolean
  notifiedPostIds: string[] // Track which posts we've already notified about
}

interface NotificationActions {
  setEnabled: (enabled: boolean) => void
  markNotified: (postId: string) => void
  clearNotified: (postId: string) => void
}

export const useNotificationStore = create<NotificationState & NotificationActions>()(
  persist(
    (set) => ({
      enabled: true,
      notifiedPostIds: [],

      setEnabled: (enabled) => set({ enabled }),

      markNotified: (postId) =>
        set((state) => ({
          notifiedPostIds: [...state.notifiedPostIds, postId],
        })),

      clearNotified: (postId) =>
        set((state) => ({
          notifiedPostIds: state.notifiedPostIds.filter((id) => id !== postId),
        })),
    }),
    {
      name: 'social-scheduler-notifications',
    }
  )
)

export function getNotificationPermission(): NotificationPermission {
  if (!('Notification' in window)) {
    return 'denied'
  }
  return Notification.permission
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications')
    return 'denied'
  }

  if (Notification.permission === 'granted') {
    return 'granted'
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission()
    return permission
  }

  return Notification.permission
}

export function sendNotification(title: string, options?: NotificationOptions): void {
  if (!('Notification' in window)) {
    return
  }

  if (Notification.permission !== 'granted') {
    return
  }

  new Notification(title, {
    icon: '/vite.svg', // Default app icon
    ...options,
  })
}
