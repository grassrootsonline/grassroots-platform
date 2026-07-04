import type { Metadata } from 'next'
import '@/styles/globals.css'
import { DevNav } from '@/components/dev/dev-nav'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Analytics } from '@vercel/analytics/next'

export const metadata: Metadata = {
  title: 'Grassroots — A home for AI builders',
  description: 'Share what you\'re building with the AI builder community.',
}

const isDev = process.env.NEXT_PUBLIC_APP_ENV !== 'production'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Inter:wght@400;500&display=swap"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.19.0/dist/tabler-icons.min.css"
        />
      </head>
      <body>
        {children}
        {isDev && <DevNav />}
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  )
}
