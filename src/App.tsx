import { Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { Dashboard } from '@/pages/Dashboard'
import { Editor } from '@/pages/Editor'
import { Posts } from '@/pages/Posts'
import { Settings } from '@/pages/Settings'
import { useScheduleChecker } from '@/hooks/useScheduleChecker'

export default function App() {
  // Check for due posts and send notifications
  useScheduleChecker()

  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="posts" element={<Posts />} />
        <Route path="new" element={<Editor />} />
        <Route path="edit/:id" element={<Editor />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
