'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Info, LayoutDashboard, MessageCircle, Mic, Phone, Search, UserRound } from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import { useAssistant } from '@/context/AssistantContext'
import { useAuth } from '@/context/AuthContext'
import { api, type Grievance, type NewsItem } from '@/lib/api'
import {
  ABOUT_CPGRAMS,
  EMAIL_DISCLAIMER,
  EXCLUSIONS,
  FALLBACK_NEWS,
  NOTE_CSC,
  NOTE_DPG,
  SLIDES,
} from '@/lib/content'
import { formatDate } from '@/lib/utils'
import { unlockAudio } from '@/lib/voice'

export default function HomePage() {
  const { user, ready } = useAuth()
  const { openChat, openVoice } = useAssistant()
  const [slide, setSlide] = useState(0)
  const [news, setNews] = useState<NewsItem[]>(FALLBACK_NEWS)
  const [reg, setReg] = useState('')
  const [grievances, setGrievances] = useState<Grievance[]>([])

  useEffect(() => {
    api.news().then(setNews).catch(() => setNews(FALLBACK_NEWS))
  }, [])

  useEffect(() => {
    if (!user) {
      setGrievances([])
      return
    }
    api.listGrievances().then(setGrievances).catch(() => setGrievances([]))
  }, [user])

  useEffect(() => {
    const id = window.setInterval(() => setSlide((s) => (s + 1) % SLIDES.length), 7000)
    return () => window.clearInterval(id)
  }, [])

  const current = SLIDES[slide]

  return (
    <div className="page-wrap space-y-8 pb-8">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <section className="relative min-h-[360px] overflow-hidden rounded-panel lg:col-span-8 lg:min-h-[500px] xl:min-h-[580px]">
          {SLIDES.map((item, i) => (
            <img
              key={item.image}
              src={item.image}
              alt=""
              className={`absolute inset-0 h-full w-full object-cover object-[78%_center] transition-opacity duration-500 ease-calm ${
                i === slide ? 'opacity-100' : 'opacity-0'
              }`}
            />
          ))}
          <div className="absolute inset-y-0 left-0 w-[55%] bg-gradient-to-r from-indigo/35 via-indigo/10 to-transparent" />
          <div className="relative z-10 flex h-full min-h-[360px] max-w-md flex-col justify-end p-6 sm:p-8 lg:min-h-[500px] lg:justify-center xl:min-h-[580px]">
            <span className="mb-3 inline-flex w-fit rounded-full border border-white/35 bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white">
              {current.tag}
            </span>
            <h1 className="text-[28px] font-bold leading-tight text-white md:text-[32px]">{current.title}</h1>
            <p className="mt-2 text-sm text-white/85">{current.hindi}</p>
            <p className="mt-3 text-sm leading-relaxed text-white/90">{current.body}</p>
            <ul className="mt-4 space-y-2">
              {current.points.map((point) => (
                <li key={point} className="flex gap-2.5 text-sm leading-relaxed text-white/90">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-white" />
                  {point}
                </li>
              ))}
            </ul>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link href={current.href} className="btn-primary">
                {current.action}
              </Link>
              <button
                type="button"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-btn bg-indigo px-5 text-base font-semibold text-white"
                onClick={async () => {
                  await unlockAudio()
                  openVoice()
                }}
              >
                <Mic className="h-4 w-4" />
                Speak
              </button>
              <button type="button" className="btn-secondary" onClick={openChat}>
                <MessageCircle className="h-4 w-4" />
                Type
              </button>
            </div>
            <div className="mt-6 flex gap-2">
              {SLIDES.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Slide ${i + 1}`}
                  onClick={() => setSlide(i)}
                  className={`h-2 rounded-full transition ${i === slide ? 'w-8 bg-amber' : 'w-2 bg-white/50'}`}
                />
              ))}
            </div>
          </div>
          <div className="absolute bottom-5 right-5 z-20 flex gap-2">
            <button
              type="button"
              aria-label="Previous slide"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm"
              onClick={() => setSlide((s) => (s - 1 + SLIDES.length) % SLIDES.length)}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Next slide"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm"
              onClick={() => setSlide((s) => (s + 1) % SLIDES.length)}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </section>

        <div className="order-first flex flex-col gap-6 lg:order-none lg:col-span-4">
          {ready && user ? (
            <GlassCard className="flex flex-1 flex-col">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber">Welcome back</p>
              <h2 className="mt-2 text-xl font-semibold">How can I help you, {user.name.split(' ')[0]}?</h2>
              <p className="mt-2 text-sm text-slate">
                Lodge a new grievance, check one you already filed, or talk to Sahayak in your own language.
              </p>
              <div className="mt-5 flex flex-col gap-2">
                <Link href="/desk/lodge" className="btn-primary w-full">
                  Lodge a grievance
                </Link>
                <button
                  type="button"
                  className="btn-secondary w-full"
                  onClick={async () => {
                    await unlockAudio()
                    openVoice()
                  }}
                >
                  <Mic className="h-4 w-4" />
                  Speak with Sahayak
                </button>
                <Link href="/desk" className="btn-secondary w-full">
                  <LayoutDashboard className="h-4 w-4" />
                  Open my dashboard
                </Link>
              </div>
            </GlassCard>
          ) : (
            <GlassCard className="flex flex-1 flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo/10 text-indigo">
                <UserRound className="h-7 w-7" />
              </div>
              <h2 className="mb-2 text-xl font-semibold">Register / Login</h2>
              <p className="mb-5 text-sm text-slate">Access your dashboard to lodge and track grievances.</p>
              <Link href="/auth/signin" className="btn-primary w-full">
                Login now
              </Link>
            </GlassCard>
          )}
          <GlassCard className="flex flex-1 flex-col items-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber/15 text-amber">
              <Search className="h-7 w-7" />
            </div>
            <h2 className="mb-2 text-xl font-semibold">View Status</h2>
            <p className="mb-5 text-sm text-slate">Check progress with your registration number.</p>
            <form
              className="flex w-full"
              onSubmit={(e) => {
                e.preventDefault()
                if (reg.trim()) window.location.href = `/status/${encodeURIComponent(reg.trim())}`
              }}
            >
              <input
                className="field rounded-r-none"
                placeholder="Enter registration no."
                value={reg}
                onChange={(e) => setReg(e.target.value)}
              />
              <button type="submit" className="btn-secondary rounded-l-none px-3" aria-label="Search status">
                <Search className="h-4 w-4" />
              </button>
            </form>
          </GlassCard>
          <GlassCard className="flex flex-1 flex-col items-center text-center lg:hidden">
            <Phone className="mb-3 h-8 w-8 text-indigo" />
            <h2 className="mb-2 text-xl font-semibold">Contact Us</h2>
            <Link href="/contact" className="btn-secondary w-full">
              Open contacts
            </Link>
          </GlassCard>
        </div>
      </div>

      {user && (
        <GlassCard>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-[22px] font-semibold">Your grievances</h2>
            <Link href="/desk" className="text-sm font-semibold">
              See all
            </Link>
          </div>
          {grievances.length === 0 ? (
            <p className="text-sm text-slate">
              You have not filed anything in Sahayak yet. Lodge a grievance or tap the avatar and just describe the
              problem.
            </p>
          ) : (
            <ul className="divide-y divide-white/40">
              {grievances.slice(0, 4).map((row) => (
                <li key={row.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div>
                    <Link href={`/status/${encodeURIComponent(row.registration_id)}`} className="font-semibold">
                      {row.registration_id}
                    </Link>
                    <p className="text-sm text-slate">{row.subject}</p>
                  </div>
                  <p className="text-sm text-slate">
                    {row.status} · {formatDate(row.created_at)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </GlassCard>
      )}

      <div className="rounded-card glass-panel px-5 py-3 text-sm text-indigo">
        {EMAIL_DISCLAIMER}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <GlassCard className="lg:col-span-7">
          <h2 className="mb-4 flex items-center gap-2 text-[22px] font-semibold">
            <Info className="h-5 w-5 text-amber" />
            About CPGRAMS
          </h2>
          <p className="text-base leading-relaxed text-ink/90">{ABOUT_CPGRAMS}</p>
          <Link href="/about" className="mt-4 inline-flex text-sm font-semibold">
            Read more
          </Link>
        </GlassCard>

        <GlassCard className="lg:col-span-5">
          <h2 className="mb-4 text-[22px] font-semibold">What’s New</h2>
          <ul className="space-y-3">
            {news.map((item) => (
              <li key={item.id} className="border-b border-white/40 pb-3 last:border-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-amber">
                  {formatDate(item.published_on)}
                </p>
                <a href={item.href} className="mt-1 block text-sm leading-relaxed hover:underline">
                  {item.title} {item.size_label && `(${item.size_label})`}
                </a>
              </li>
            ))}
          </ul>
        </GlassCard>
      </div>

      <GlassCard>
        <h2 className="mb-4 text-[22px] font-semibold">Issues which are not taken up for redress</h2>
        <ul className="grid gap-3 md:grid-cols-2">
          {EXCLUSIONS.map((item) => (
            <li key={item} className="flex gap-3 text-base leading-relaxed">
              <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-indigo" />
              {item}
            </li>
          ))}
        </ul>
        <div className="mt-6 space-y-3 text-sm leading-relaxed text-slate">
          <p>
            <span className="font-semibold text-indigo">Note 1.</span> {NOTE_DPG}{' '}
            <Link href="/appeal/authority">Click here</Link>
          </p>
          <p>
            <span className="font-semibold text-indigo">Note 2.</span> {NOTE_CSC}
          </p>
        </div>
      </GlassCard>

      <div className="hidden grid-cols-3 gap-6 lg:grid">
        <GlassCard className="flex flex-col items-center text-center">
          {user ? (
            <>
              <LayoutDashboard className="mb-3 h-8 w-8 text-indigo" />
              <Link href="/desk" className="btn-secondary">
                My dashboard
              </Link>
            </>
          ) : (
            <>
              <UserRound className="mb-3 h-8 w-8 text-indigo" />
              <Link href="/auth/signin" className="btn-secondary">
                Register / Login
              </Link>
            </>
          )}
        </GlassCard>
        <GlassCard className="flex flex-col items-center text-center">
          <Search className="mb-3 h-8 w-8 text-indigo" />
          <Link href={user ? '/desk' : '/status'} className="btn-secondary">
            {user ? 'My grievances' : 'View Status'}
          </Link>
        </GlassCard>
        <GlassCard className="flex flex-col items-center text-center">
          <Phone className="mb-3 h-8 w-8 text-indigo" />
          <Link href="/contact" className="btn-secondary">
            Contact Us
          </Link>
        </GlassCard>
      </div>
    </div>
  )
}
