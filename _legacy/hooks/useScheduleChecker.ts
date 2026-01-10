import { useEffect } from 'react'
import { usePostsStore } from '@/lib/storage'
import {
  useNotificationStore,
  sendNotification,
  getNotificationPermission,
} from '@/lib/notifications'
import { isDue, getPostPreviewText } from '@/lib/posts'

const CHECK_INTERVAL = 60 * 1000 // Check every 60 seconds

export function useScheduleChecker() {
  const posts = usePostsStore((state) => state.posts)
  const { enabled, notifiedPostIds, markNotified } = useNotificationStore()

  useEffect(() => {
    if (!enabled) return

    const checkForDuePosts = () => {
      if (getNotificationPermission() !== 'granted') return

      const scheduledPosts = posts.filter((p) => p.status === 'scheduled')

      scheduledPosts.forEach((post) => {
        if (isDue(post) && !notifiedPostIds.includes(post.id)) {
          const previewText = getPostPreviewText(post)
          const truncatedText =
            previewText.length > 100
              ? previewText.slice(0, 100) + '...'
              : previewText

          sendNotification('Post is due!', {
            body: truncatedText || 'A scheduled post is ready',
            tag: post.id, // Prevents duplicate notifications for same post
          })

          markNotified(post.id)
        }
      })
    }

    // Check immediately on mount
    checkForDuePosts()

    // Then check periodically
    const interval = setInterval(checkForDuePosts, CHECK_INTERVAL)

    return () => clearInterval(interval)
  }, [posts, enabled, notifiedPostIds, markNotified])
}
