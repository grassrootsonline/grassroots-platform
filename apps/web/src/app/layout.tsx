import type { Metadata } from 'next'
import '@/styles/globals.css'
import { DevNav } from '@/components/dev/dev-nav'

export const metadata: Metadata = {
  title: 'Grassroots — A home for AI builders',
  description: 'Share what you\'re building with the AI builder community.',
}

const isDev = process.env.NEXT_PUBLIC_APP_ENV !== 'production'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css"
        />
      </head>
      <body>
        {children}
        {isDev && <DevNav />}
      </body>
    </html>
  )
}
