import type { Metadata } from 'next'
import '../index.css'

export const metadata: Metadata = {
  title: 'Social Scheduler',
  description: 'Schedule and manage your social media posts',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans">{children}</body>
    </html>
  )
}
