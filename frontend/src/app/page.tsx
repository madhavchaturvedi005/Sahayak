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
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Mic,
  Phone,
  Search,
  ThumbsUp,
  UserRound,
} from 'lucide-react'
import { CommunityDoors } from '@/components/home/CommunityDoors'
import { TransparencyDesk } from '@/components/home/TransparencyDesk'
import { GlassCard } from '@/components/ui/GlassCard'
import { useAssistant } from '@/context/AssistantContext'
import { useAuth } from '@/context/AuthContext'
import { api, type Grievance, type NearbyGrievance, type NewsItem } from '@/lib/api'
import { useLanguage } from '@/context/LanguageContext'
import { useLocation } from '@/context/LocationContext'
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
import { homeForUser, isStaff } from '@/lib/roles'

export default function HomePage() {
  const { user, ready } = useAuth()
  const { openChat, openVoice } = useAssistant()
  const { lang, t } = useLanguage()
  const { lat, lon, hasLocation, label: locationLabel, requesting: locationBusy, denied: locationDenied, request: requestLocation } = useLocation()
  const router = useRouter()
  const hi = lang === 'hi'
  const [slide, setSlide] = useState(0)
  const [news, setNews] = useState<NewsItem[]>(FALLBACK_NEWS)
  const [reg, setReg] = useState('')
  const [grievances, setGrievances] = useState<Grievance[]>([])
  const [nearby, setNearby] = useState<NearbyGrievance[]>([])
  const [nearbyLoading, setNearbyLoading] = useState(false)

  useEffect(() => {
    if (ready && isStaff(user)) {
      router.replace(homeForUser(user))
    }
  }, [ready, user, router])

  useEffect(() => {
    api.news().then(setNews).catch(() => setNews(FALLBACK_NEWS))
  }, [])

  useEffect(() => {
    if (!user) {
      setGrievances([])
      return
    }
    function load() {
      api.listGrievances().then(setGrievances).catch(() => setGrievances([]))
    }
    load()
    const timer = setInterval(load, 30_000)
    return () => clearInterval(timer)
  }, [user])

  useEffect(() => {
    if (!hasLocation || lat == null || lon == null) {
      setNearby([])
      return
    }
    setNearbyLoading(true)
    api.nearby({ lat, lon, radius_m: 5000 })
      .then(setNearby)
      .catch(() => setNearby([]))
      .finally(() => setNearbyLoading(false))
  }, [hasLocation, lat, lon])

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
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-indigo/80 via-indigo/35 to-transparent backdrop-blur-[2px] lg:inset-y-0 lg:left-0 lg:right-auto lg:w-[62%] lg:bg-gradient-to-r lg:from-indigo/70 lg:via-indigo/35 lg:to-transparent lg:backdrop-blur-md lg:[mask-image:linear-gradient(to_right,black_58%,transparent)]" />
          <div className="relative z-10 flex h-full min-h-[320px] w-full max-w-lg flex-col justify-end p-5 sm:p-7 lg:min-h-[420px] lg:justify-center xl:min-h-[460px]">
            <span className="mb-2 inline-flex w-fit rounded-full border border-white/35 bg-white/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white">
              {hi ? current.tagHi : current.tag}
            </span>
            <h1 className="text-[28px] font-bold leading-tight text-white sm:text-[34px] md:text-[38px]">{hi ? current.titleHi : current.title}</h1>
            <p className="mt-2 text-base leading-relaxed text-white/90">{hi ? current.bodyHi : current.body}</p>
            <ul className="mt-3 space-y-2">
              {(hi ? current.pointsHi : current.points).map((point) => (
                <li key={point} className="flex items-start gap-2 text-sm leading-relaxed text-white/90">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber" />
                  {point}
                </li>
              ))}
            </ul>
            <div className="mt-5 inline-flex w-fit max-w-full flex-wrap items-stretch gap-2">
              <Link
                href={current.href}
                className="inline-flex h-11 items-center justify-center rounded-btn bg-amber px-5 text-sm font-semibold text-white shadow-amber hover:brightness-105"
              >
                {hi ? current.actionHi : current.action}
              </Link>
              <button
                type="button"
                className="inline-flex h-11 items-center justify-center gap-1.5 rounded-btn bg-white/20 px-4 text-sm font-semibold text-white ring-1 ring-white/30 backdrop-blur-sm hover:bg-white/30"
                onClick={async () => {
                  await unlockAudio()
                  openVoice()
                }}
              >
                <Mic className="h-3.5 w-3.5 shrink-0" />
                {t('speak')}
              </button>
              <button
                type="button"
                className="inline-flex h-11 items-center justify-center gap-1.5 rounded-btn bg-white/10 px-4 text-sm font-semibold text-white ring-1 ring-white/20 backdrop-blur-sm hover:bg-white/20"
                onClick={openChat}
              >
                <MessageCircle className="h-3.5 w-3.5 shrink-0" />
                {t('type')}
              </button>
            </div>
            <div className="mt-5 flex gap-2">
              {SLIDES.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={t('slideN', { n: i + 1 })}
                  onClick={() => setSlide(i)}
                  className={`h-2 rounded-full transition-all duration-300 ${i === slide ? 'w-8 bg-amber' : 'w-2 bg-white/50'}`}
                />
              ))}
            </div>
          </div>
          <div className="absolute bottom-5 right-5 z-20 hidden gap-2 sm:flex">
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

        <div className="flex flex-col gap-4 lg:col-span-4 lg:gap-6">
        {ready && user ? (
          <GlassCard className="flex flex-col">
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
          <GlassCard className="flex flex-col items-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo/10 text-indigo">
              <UserRound className="h-7 w-7" />
            </div>
            <h2 className="mb-2 text-xl font-semibold">{t('registerLogin')}</h2>
            <p className="mb-5 text-sm text-slate">{t('registerLoginBody')}</p>
            <div className="flex w-full gap-2">
              <Link href="/auth/signin" className="btn-primary flex-1">
                {t('signIn')}
              </Link>
              <Link href="/auth/register" className="btn-secondary flex-1">
                {t('signUp')}
              </Link>
            </div>
          </GlassCard>
        )}
        <GlassCard className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber/15 text-amber">
            <Search className="h-7 w-7" />
          </div>
          <h2 className="mb-2 text-xl font-semibold">{t('viewStatus')}</h2>
          <p className="mb-5 text-sm text-slate">{t('viewStatusBody')}</p>
          <form
            className="flex w-full"
            onSubmit={(e) => {
              e.preventDefault()
              if (reg.trim()) router.push(`/status/${reg.trim()}`)
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
        <GlassCard className="flex flex-col items-center text-center">
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

      {/* Nearby problems section */}
      <GlassCard>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-amber">
              <MapPin className="h-3.5 w-3.5" />
              {hi ? 'आसपास की समस्याएँ' : 'Problems near you'}
            </p>
            <h2 className="mt-1 text-[22px] font-semibold">
              {hi ? 'आपके क्षेत्र की शिकायतें' : 'Grievances in your area'}
            </h2>
            {hasLocation && locationLabel && (
              <p className="mt-0.5 text-sm text-slate">
                {hi ? `5 किमी के दायरे में — ${locationLabel}` : `Within 5 km of ${locationLabel}`}
              </p>
            )}
          </div>
          {hasLocation && (
            <Link href="/nearby" className="text-sm font-semibold">
              {hi ? 'सभी देखें' : 'See all'}
            </Link>
          )}
        </div>

        {!hasLocation ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber/10 text-amber">
              <MapPin className="h-6 w-6" />
            </div>
            <p className="max-w-xs text-sm text-slate">
              {hi
                ? 'अपने आसपास की शिकायतें देखने और उन्हें सपोर्ट करने के लिए अपनी लोकेशन दें।'
                : 'Share your location to see grievances near you and add your support.'}
            </p>
            {locationDenied ? (
              <p className="text-xs text-slate/70">
                {hi ? 'ब्राउज़र में लोकेशन की अनुमति दें, फिर से प्रयास करें।' : 'Enable location in your browser settings and try again.'}
              </p>
            ) : (
              <button
                type="button"
                onClick={requestLocation}
                disabled={locationBusy}
                className="btn-primary gap-2"
              >
                {locationBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
                {locationBusy
                  ? (hi ? 'लोकेशन मिल रही है…' : 'Getting location…')
                  : (hi ? 'लोकेशन शेयर करें' : 'Share my location')}
              </button>
            )}
          </div>
        ) : nearbyLoading ? (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate">
            <Loader2 className="h-4 w-4 animate-spin" />
            {hi ? 'लोड हो रहा है…' : 'Loading…'}
          </div>
        ) : nearby.length === 0 ? (
          <p className="py-4 text-sm text-slate">
            {hi ? 'आपके 5 किमी के दायरे में कोई सक्रिय शिकायत नहीं मिली।' : 'No active grievances found within 5 km of your location.'}
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {nearby.slice(0, 6).map((item) => {
              const place = [item.village, item.ward, item.district].filter(Boolean).join(', ')
              const distKm = item.distance_m != null ? (item.distance_m / 1000).toFixed(1) : null
              return (
                <li key={item.registration_id} className="flex flex-col gap-2 rounded-xl border border-white/40 bg-white/30 p-4 shadow-sm">
                  <p className="line-clamp-2 text-sm font-semibold leading-snug">{item.subject}</p>
                  {place && (
                    <p className="flex items-center gap-1 text-xs text-slate">
                      <MapPin className="h-3 w-3 shrink-0" />
                      {place}{distKm ? ` · ${distKm} km` : ''}
                    </p>
                  )}
                  <div className="mt-auto flex items-center justify-between gap-2 pt-1">
                    <span className="flex items-center gap-1 text-xs text-slate">
                      <ThumbsUp className="h-3 w-3" />
                      {item.backer_count} {hi ? 'समर्थन' : 'backers'}
                    </span>
                    <Link
                      href={`/back/${item.registration_id}`}
                      className="inline-flex items-center gap-1 rounded-lg bg-indigo px-3 py-1.5 text-xs font-semibold text-white hover:brightness-110"
                    >
                      <ThumbsUp className="h-3 w-3" />
                      {hi ? 'समर्थन दें' : 'Back this'}
                    </Link>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </GlassCard>

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
                    <Link href={`/status/${row.registration_id}`} className="font-semibold">
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
