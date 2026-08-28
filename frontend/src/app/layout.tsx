import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { AppShell } from '@/components/layout/AppShell'
import { Assistant } from '@/components/ai/Assistant'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Sahayak CPGRAMS',
  description:
    'Centralized Public Grievance Redress And Monitoring System — lodge, track, and appeal public grievances.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans`}>
        <Providers>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[80] focus:rounded-btn focus:bg-white focus:px-4 focus:py-2"
          >
            मुख्य सामग्री पर जाएँ / Skip to main content
          </a>
          <SiteHeader />
          <main id="main-content" className="relative z-10 min-h-screen pt-6 md:pt-8">
            <AppShell>{children}</AppShell>
          </main>
          <SiteFooter />
          <Assistant />
        </Providers>
      </body>
    </html>
  )
}
