import Link from 'next/link'
import { Facebook, Youtube } from 'lucide-react'
import { NIC_CREDIT } from '@/lib/content'

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
      <path d="M18.9 2H22l-6.8 7.8L23 22h-6.5l-5.1-6.7L6 22H2.9l7.3-8.4L1 2h6.6l4.6 6.1L18.9 2Zm-1.1 18h1.8L6.3 3.9H4.4L17.8 20Z" />
    </svg>
  )
}

const BADGES = [
  '150 Years of Mahatma Gandhi',
  'Digital India Awards 2018',
  'GOI Web Directory',
  'National Portal of India',
  'Digital India',
  'india.gov.in',
  'NIC',
]

export function SiteFooter() {
  return (
    <footer className="relative z-10 mt-16 w-full">
      <div className="w-full">
        <div className="glass-panel rounded-none border-x-0 px-4 py-10 sm:px-6 lg:px-10 xl:px-14 2xl:px-20">
          <div className="mb-8 flex justify-center gap-4">
            <a
              href="https://www.facebook.com"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-indigo/10 text-indigo"
              aria-label="Facebook"
            >
              <Facebook className="h-4 w-4" />
            </a>
            <a
              href="https://x.com"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-indigo/10 text-indigo"
              aria-label="X"
            >
              <XIcon />
            </a>
            <a
              href="https://www.youtube.com"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-indigo/10 text-indigo"
              aria-label="YouTube"
            >
              <Youtube className="h-4 w-4" />
            </a>
          </div>

          <p className="mx-auto max-w-3xl text-center text-sm leading-relaxed text-slate">{NIC_CREDIT}</p>

          <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm">
            <Link href="/disclaimer">Disclaimer</Link>
            <Link href="/policies">Website Policies</Link>
            <Link href="/web-information-manager">Web Information Manager</Link>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {BADGES.map((badge) => (
              <div
                key={badge}
                className="flex min-h-16 items-center justify-center rounded-card border border-white/40 bg-white/40 px-2 text-center text-[11px] font-semibold leading-tight text-indigo"
              >
                {badge}
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-col items-center justify-between gap-2 border-t border-white/30 pt-6 text-xs text-slate md:flex-row">
            <p>Version 7.0.01092019.0.0 · Compatible with Chrome, Firefox, Edge, Safari · 1440 × 900</p>
            <p>Last updated 21-08-2026 · Visitors 1,84,32,901</p>
          </div>
          <p className="mt-3 text-center text-xs text-slate">
            Sahayak is an independent companion interface. Official filing happens on{' '}
            <a href="https://pgportal.gov.in" className="underline">
              pgportal.gov.in
            </a>
            .
          </p>
        </div>
      </div>
    </footer>
  )
}
