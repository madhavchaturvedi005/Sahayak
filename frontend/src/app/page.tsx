'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Ban,
  ChevronLeft,
  ChevronRight,
  Info,
  LayoutDashboard,
  Mail,
  MessageCircle,
  Mic,
  Phone,
  Search,
  UserRound,
} from 'lucide-react'
import { CommunityDoors } from '@/components/home/CommunityDoors'
import { TransparencyDesk } from '@/components/home/TransparencyDesk'
import { GlassCard } from '@/components/ui/GlassCard'
import { useAssistant } from '@/context/AssistantContext'
import { useAuth } from '@/context/AuthContext'
import { api, type Grievance, type NewsItem } from '@/lib/api'
import { useLanguage } from '@/context/LanguageContext'
import {
  ABOUT_CPGRAMS,
  ABOUT_CPGRAMS_HI,
  EMAIL_DISCLAIMER,
  EMAIL_DISCLAIMER_HI,
  EXCLUSIONS,
  EXCLUSIONS_HI,
  FALLBACK_NEWS,
  NOTE_CSC,
  NOTE_CSC_HI,
  NOTE_DPG,
  NOTE_DPG_HI,
  SLIDES,
} from '@/lib/content'
import { STATUS_HI, formatDateLocale, translateLookup } from '@/lib/i18n'
import { unlockAudio } from '@/lib/voice'

export default function HomePage() {
  const { user, ready } = useAuth()
  const { openChat, openVoice } = useAssistant()
  const { lang, t } = useLanguage()
  const router = useRouter()
  const hi = lang === 'hi'
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
    <div className="page-wrap space-y-10 pb-8">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <section className="relative min-h-[320px] overflow-hidden rounded-panel lg:col-span-8 lg:min-h-[420px] xl:min-h-[460px]">
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
          <div className="pointer-events-none absolute inset-y-0 left-0 w-[62%] bg-gradient-to-r from-indigo/70 via-indigo/35 to-transparent backdrop-blur-md [mask-image:linear-gradient(to_right,black_58%,transparent)]" />
          <div className="relative z-10 flex h-full min-h-[320px] w-full max-w-md flex-col justify-end p-5 sm:p-7 lg:min-h-[420px] lg:justify-center xl:min-h-[460px]">
            <span className="mb-2 inline-flex w-fit rounded-full border border-white/35 bg-white/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white">
              {hi ? current.tagHi : current.tag}
            </span>
            <h1 className="text-[24px] font-bold leading-tight text-white md:text-[28px]">{hi ? current.titleHi : current.title}</h1>
            <p className="mt-2 text-sm leading-relaxed text-white/90">{hi ? current.bodyHi : current.body}</p>
            <ul className="mt-3 space-y-1.5">
              {(hi ? current.pointsHi : current.points).map((point) => (
                <li key={point} className="flex gap-2 text-[13px] leading-relaxed text-white/90">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-white" />
                  {point}
                </li>
              ))}
            </ul>
            <div className="mt-4 inline-flex w-fit max-w-full items-stretch overflow-hidden rounded-lg bg-white shadow-amber">
              <Link
                href={current.href}
                className="inline-flex h-9 max-w-[11.5rem] items-center justify-center bg-amber px-2.5 text-center text-xs font-semibold leading-none text-white hover:brightness-105 sm:max-w-[13rem] sm:px-3"
              >
                <span className="truncate">{hi ? current.actionHi : current.action}</span>
              </Link>
              <button
                type="button"
                className="inline-flex h-9 shrink-0 items-center justify-center gap-1 border-l border-indigo/15 bg-indigo px-2.5 text-xs font-semibold leading-none text-white sm:px-3"
                onClick={async () => {
                  await unlockAudio()
                  openVoice()
                }}
              >
                <Mic className="h-3.5 w-3.5 shrink-0" />
                <span className="whitespace-nowrap">{t('speak')}</span>
              </button>
              <button
                type="button"
                className="inline-flex h-9 shrink-0 items-center justify-center gap-1 border-l border-indigo/10 bg-white px-2.5 text-xs font-semibold leading-none text-indigo sm:px-3"
                onClick={openChat}
              >
                <MessageCircle className="h-3.5 w-3.5 shrink-0" />
                <span className="whitespace-nowrap">{t('type')}</span>
              </button>
            </div>
            <div className="mt-6 flex gap-2">
              {SLIDES.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={t('slideN', { n: i + 1 })}
                  onClick={() => setSlide(i)}
                  className={`h-2 rounded-full transition ${i === slide ? 'w-8 bg-amber' : 'w-2 bg-white/50'}`}
                />
              ))}
            </div>
          </div>
          <div className="absolute bottom-5 right-5 z-20 flex gap-2">
            <button
              type="button"
              aria-label={t('previousSlide')}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm"
              onClick={() => setSlide((s) => (s - 1 + SLIDES.length) % SLIDES.length)}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label={t('nextSlide')}
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
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber">{t('welcomeBack')}</p>
              <h2 className="mt-2 text-xl font-semibold">{t('helpYouName', { name: user.name.split(' ')[0] })}</h2>
              <p className="mt-2 text-sm text-slate">{t('helpYouBody')}</p>
              <div className="mt-5 flex flex-col gap-2">
                <Link href="/grievance/lodge" className="btn-primary w-full">
                  {t('lodgeAGrievance')}
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
                  {t('speakWithSahayak')}
                </button>
                <Link href="/desk" className="btn-secondary w-full">
                  <LayoutDashboard className="h-4 w-4" />
                  {t('openMyDashboard')}
                </Link>
              </div>
            </GlassCard>
          ) : (
            <GlassCard className="flex flex-1 flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo/10 text-indigo">
                <UserRound className="h-7 w-7" />
              </div>
              <h2 className="mb-2 text-xl font-semibold">{t('registerLogin')}</h2>
              <p className="mb-5 text-sm text-slate">{t('registerLoginBody')}</p>
              <Link href="/auth/signin" className="btn-primary w-full">
                {t('loginNow')}
              </Link>
            </GlassCard>
          )}
          <GlassCard className="flex flex-1 flex-col items-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber/15 text-amber">
              <Search className="h-7 w-7" />
            </div>
            <h2 className="mb-2 text-xl font-semibold">{t('viewStatus')}</h2>
            <p className="mb-5 text-sm text-slate">{t('viewStatusBody')}</p>
            <form
              className="flex w-full"
              onSubmit={(e) => {
                e.preventDefault()
                if (reg.trim()) router.push(`/status/${encodeURIComponent(reg.trim())}`)
              }}
            >
              <input
                className="field rounded-r-none"
                placeholder={t('enterReg')}
                value={reg}
                onChange={(e) => setReg(e.target.value)}
              />
              <button type="submit" className="btn-secondary rounded-l-none px-3" aria-label={t('searchStatus')}>
                <Search className="h-4 w-4" />
              </button>
            </form>
          </GlassCard>
          <GlassCard className="flex flex-1 flex-col items-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo/10 text-indigo">
              <Phone className="h-7 w-7" />
            </div>
            <h2 className="mb-2 text-xl font-semibold">{t('contact')}</h2>
            <p className="mb-5 text-sm text-slate">
              {hi ? 'नोडल अधिकारी, हेल्पलाइन और विभागवार संपर्क।' : 'Nodal officers, helpline, and department contacts.'}
            </p>
            <Link href="/contact" className="btn-secondary w-full">
              {t('openContacts')}
            </Link>
          </GlassCard>
        </div>
      </div>

      <CommunityDoors />

      <TransparencyDesk />

      {user && (
        <GlassCard>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber">
                {hi ? 'आपका डेस्क' : 'Your desk'}
              </p>
              <h2 className="mt-1 text-[22px] font-semibold">{t('yourGrievances')}</h2>
            </div>
            <Link href="/desk" className="text-sm font-semibold">
              {t('seeAll')}
            </Link>
          </div>
          {grievances.length === 0 ? (
            <p className="text-sm text-slate">
              {t('noGrievancesYet')}
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
                    {translateLookup(STATUS_HI, row.status, lang)} · {formatDateLocale(row.created_at, lang)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </GlassCard>
      )}

      <div className="flex items-start gap-3 rounded-card glass-panel px-5 py-4 text-sm leading-relaxed text-indigo">
        <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-amber/15 text-amber">
          <Mail className="h-4 w-4" />
        </span>
        <p>{hi ? EMAIL_DISCLAIMER_HI : EMAIL_DISCLAIMER}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <GlassCard className="lg:col-span-7">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-amber">
            <Info className="h-4 w-4" />
            {hi ? 'पोर्टल के बारे में' : 'About the portal'}
          </p>
          <h2 className="mb-4 mt-1.5 text-[22px] font-semibold">{t('aboutCpgrams')}</h2>
          <p className="text-base leading-relaxed text-ink/90">{hi ? ABOUT_CPGRAMS_HI : ABOUT_CPGRAMS}</p>
          <Link href="/about" className="mt-4 inline-flex text-sm font-semibold">
            {t('readMore')}
          </Link>
        </GlassCard>

        <GlassCard className="lg:col-span-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber">
            {hi ? 'ताज़ा जानकारी' : 'Updates'}
          </p>
          <h2 className="mb-4 mt-1.5 text-[22px] font-semibold">{t('whatsNew')}</h2>
          <ul className="space-y-3">
            {news.map((item) => (
              <li key={item.id} className="border-b border-white/40 pb-3 last:border-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-amber">
                  {formatDateLocale(item.published_on, lang)}
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
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-amber">
          <Ban className="h-4 w-4" />
          {hi ? 'ध्यान दें' : 'Good to know'}
        </p>
        <h2 className="mb-4 mt-1.5 text-[22px] font-semibold">{t('issuesNotTaken')}</h2>
        <ul className="grid gap-3 md:grid-cols-2">
          {(hi ? EXCLUSIONS_HI : EXCLUSIONS).map((item) => (
            <li key={item} className="flex gap-3 text-base leading-relaxed">
              <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-indigo" />
              {item}
            </li>
          ))}
        </ul>
        <div className="mt-6 space-y-3 text-sm leading-relaxed text-slate">
          <p>
            <span className="font-semibold text-indigo">{t('note1')}</span> {hi ? NOTE_DPG_HI : NOTE_DPG}{' '}
            <Link href="/appeal/authority">{t('clickHere')}</Link>
          </p>
          <p>
            <span className="font-semibold text-indigo">{t('note2')}</span> {hi ? NOTE_CSC_HI : NOTE_CSC}
          </p>
        </div>
      </GlassCard>

    </div>
  )
}
