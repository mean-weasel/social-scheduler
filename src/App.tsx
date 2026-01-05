import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { Dashboard } from '@/pages/Dashboard'
import { Editor } from '@/pages/Editor'
import { Posts } from '@/pages/Posts'
import { Campaigns } from '@/pages/Campaigns'
import { CampaignDetail } from '@/pages/CampaignDetail'
import { Settings } from '@/pages/Settings'
import { useScheduleChecker } from '@/hooks/useScheduleChecker'
import { usePostsStore } from '@/lib/storage'

export default function App() {
  const fetchPosts = usePostsStore((state) => state.fetchPosts)
  const initialized = usePostsStore((state) => state.initialized)

  // Fetch posts on app load
  useEffect(() => {
    if (!initialized) {
      fetchPosts()
    }
  }, [fetchPosts, initialized])

  // Check for due posts and send notifications
  useScheduleChecker()

  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="posts" element={<Posts />} />
        <Route path="campaigns" element={<Campaigns />} />
        <Route path="campaigns/:id" element={<CampaignDetail />} />
        <Route path="new" element={<Editor />} />
        <Route path="edit/:id" element={<Editor />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
