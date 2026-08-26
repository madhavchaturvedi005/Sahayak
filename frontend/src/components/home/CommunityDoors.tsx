'use client'

import Link from 'next/link'
import { ArrowRight, HeartHandshake, MapPin, ShieldCheck, UserRound } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'

type Door = {
  href: string
  icon: typeof UserRound
  tag: string
  tagHi: string
  title: string
  titleHi: string
  body: string
  bodyHi: string
  cta: string
  ctaHi: string
}

const DOORS: Door[] = [
  {
    href: '/grievance/lodge',
    icon: UserRound,
    tag: 'For myself',
    tagHi: 'खुद के लिए',
    title: 'File in my own name',
    titleHi: 'अपने नाम से दर्ज करूँ',
    body: 'Start a fresh public grievance by voice or form.',
    bodyHi: 'आवाज़ या फ़ॉर्म से नई शिकायत दर्ज करें।',
    cta: 'Start filing',
    ctaHi: 'दर्ज करें',
  },
  {
    href: '/nearby',
    icon: MapPin,
    tag: 'For my area',
    tagHi: 'मेरे इलाके के लिए',
    title: 'Back a problem near me',
    titleHi: 'पास की समस्या का समर्थन',
    body: 'Join an existing complaint — on-site or remotely.',
    bodyHi: 'मौजूदा शिकायत से जुड़ें — जगह पर या दूर से।',
    cta: 'Find nearby',
    ctaHi: 'पास देखें',
  },
]

export function CommunityDoors() {
  const { lang } = useLanguage()
  const hi = lang === 'hi'

  return (
    <section aria-labelledby="doors-heading">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber">
            Jan Samarthan · {hi ? 'समुदाय-समर्थित' : 'Community-powered'}
          </p>
          <h2 id="doors-heading" className="mt-2 text-[26px] font-bold leading-tight md:text-[28px]">
            {hi ? 'आज कौन शिकायत कर रहा है?' : "Who's filing today?"}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate">
            {hi
              ? 'तीन रास्ते चुनें — खुद के लिए, किसी की मदद करते हुए, या इलाके की साझा समस्या के लिए। समर्थन सत्यापन के बाद ही प्राथमिकता बढ़ाता है।'
              : 'Pick one of three paths — for yourself, while helping someone, or for a shared problem in your area. Support lifts priority only after it is verified.'}
          </p>
        </div>
        <span className="hidden items-center gap-1.5 rounded-full border border-line bg-white/70 px-3 py-1.5 text-xs font-medium text-indigo sm:inline-flex">
          <ShieldCheck className="h-3.5 w-3.5 text-success" />
          {hi ? 'सत्यापन-पहले प्राथमिकता' : 'Verify-before-push'}
        </span>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-5">
        {/* Flagship — helping someone */}
        <Link
          href="/grievance/lodge?helper=1"
          className="group relative flex flex-col overflow-hidden rounded-panel bg-gradient-to-br from-indigo-soft via-indigo to-indigo-deep p-6 text-white shadow-glass-lg transition duration-300 ease-calm hover:-translate-y-1 md:p-8 lg:col-span-3"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-amber/25 blur-3xl transition group-hover:bg-amber/35"
          />
          <div className="relative flex items-center justify-between">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-amber/25 text-amber-glow ring-1 ring-amber/40">
              <HeartHandshake className="h-6 w-6" />
            </span>
            <span className="rounded-full bg-amber px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-indigo-deep shadow-amber">
              {hi ? 'मुख्य सुविधा' : 'Flagship'}
            </span>
          </div>
          <h3 className="relative mt-5 text-[22px] font-bold leading-tight text-white">
            {hi ? 'मैं किसी की मदद कर रहा/रही हूँ' : "I'm helping someone who can't type"}
          </h3>
          <p className="relative mt-2 max-w-md text-sm leading-relaxed text-white/85">
            {hi
              ? 'CSC ऑपरेटर, परिवार या पड़ोसी — अनपढ़ या बुज़ुर्ग नागरिक के लिए आवाज़ से फ़ॉर्म भरें, सहमति लें और शिकायत दर्ज करें।'
              : 'CSC operator, family, or neighbour — file by voice for an elderly or non-literate citizen, capture consent, and lodge it in their name.'}
          </p>
          <div className="relative mt-5 flex flex-wrap gap-2">
            {(hi ? ['आवाज़ से', 'सहमति दर्ज', 'बहु-भाषी'] : ['Voice-led', 'Consent captured', 'Multilingual']).map(
              (chip) => (
                <span
                  key={chip}
                  className="rounded-full bg-white/12 px-3 py-1 text-xs font-medium text-white/90 ring-1 ring-white/15"
                >
                  {chip}
                </span>
              )
            )}
          </div>
          <span className="relative mt-auto flex items-center gap-2 pt-6 text-sm font-semibold text-amber-glow">
            {hi ? 'सहायता से दर्ज करें' : 'Start assisted filing'}
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
          </span>
        </Link>

        {/* Two supporting doors */}
        <div className="grid gap-4 lg:col-span-2">
          {DOORS.map((door) => {
            const Icon = door.icon
            return (
              <Link
                key={door.href}
                href={door.href}
                className="group relative flex flex-col rounded-panel border border-white/60 bg-white/70 p-5 shadow-glass transition duration-300 ease-calm hover:-translate-y-1 hover:border-indigo/25 hover:bg-white/90 md:p-6"
              >
                <div className="flex items-center justify-between">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-indigo/10 text-indigo transition group-hover:bg-indigo group-hover:text-white">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate">
                    {hi ? door.tagHi : door.tag}
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-semibold leading-tight text-indigo">
                  {hi ? door.titleHi : door.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate">{hi ? door.bodyHi : door.body}</p>
                <span className="mt-auto flex items-center gap-2 pt-4 text-sm font-semibold text-indigo">
                  {hi ? door.ctaHi : door.cta}
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
