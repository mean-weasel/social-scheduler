import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import '../index.css'

// eslint-disable-next-line react-refresh/only-export-components -- metadata export is required by Next.js App Router
export const metadata: Metadata = {
  title: 'Bullhorn',
  description: 'Schedule and manage your social media posts',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans">
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
