'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ArrowLeft, MapPin } from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import { RaiseVerifyPanel } from '@/components/grievance/RaiseVerifyPanel'
import { api, type BackerStats, type Grievance } from '@/lib/api'
import { useLanguage } from '@/context/LanguageContext'
import { Suspense } from 'react'

function NearbyRaiseInner() {
  const search = useSearchParams()
  const { lang } = useLanguage()
  const hi = lang === 'hi'
  const reg = (search.get('id') || '').trim()
  const requestedMode = search.get('mode') === 'onsite' ? 'onsite' : 'remote'
  const [row, setRow] = useState<Grievance | null>(null)
  const [stats, setStats] = useState<BackerStats | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!reg) {
      setError(hi ? 'पंजीकरण संख्या नहीं मिली।' : 'Missing registration number.')
      return
    }
    Promise.all([api.getGrievance(reg), api.backers(reg)])
      .then(([g, s]) => {
        setRow(g)
        setStats(s)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Not found'))
  }, [reg, hi])

  if (error) {
    return (
      <div className="page-wrap mx-auto max-w-[800px] pb-16">
        <GlassCard>
          <h1 className="text-[28px] font-bold">{hi ? 'नहीं मिला' : 'Not found'}</h1>
          <p className="mt-2 text-slate">{error}</p>
          <Link href="/nearby" className="btn-secondary mt-6 inline-flex">
            {hi ? 'पास की शिकायतें' : 'Back to nearby'}
          </Link>
        </GlassCard>
      </div>
    )
  }

  if (!row) {
    return (
      <div className="page-wrap mx-auto max-w-[800px] pb-16">
        <div className="h-40 animate-shimmer rounded-panel bg-[linear-gradient(90deg,#e8ebf2,#f7f8fa,#e8ebf2)] bg-[length:200%_100%]" />
      </div>
    )
  }

  return (
    <div className="page-wrap mx-auto max-w-[800px] space-y-6 pb-16">
      <div>
        <Link href="/nearby" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate hover:text-indigo">
          <ArrowLeft className="h-4 w-4" />
          {hi ? 'पास की शिकायतें' : 'Nearby complaints'}
        </Link>
        <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-amber">Jan Samarthan</p>
        <h1 className="mt-2 text-[32px] font-bold leading-tight">
          {hi ? 'इस शिकायत को बढ़ाएँ' : 'Raise this complaint'}
        </h1>
        <p className="mt-2 text-base leading-relaxed text-slate">
          {hi
            ? 'सत्यापन पूरा होने के बाद ही अधिकारी की प्राथमिकता बढ़ेगी।'
            : 'Officer priority rises only after your raise is verified.'}
        </p>
      </div>

      <GlassCard hover={false}>
        <p className="text-xs font-medium text-slate">{hi ? 'पंजीकरण' : 'Registration'}</p>
        <p className="mt-1 break-all text-xl font-semibold text-indigo">{row.registration_id}</p>
        <p className="mt-2 font-medium">{row.subject}</p>
        <p className="mt-1 flex items-start gap-1.5 text-sm text-slate">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-indigo" />
          {[row.street, row.village, row.ward, row.district].filter(Boolean).join(', ') ||
            (hi ? 'जगह पिन नहीं है' : 'Place not pinned')}
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          <span className="rounded-full bg-indigo/8 px-3 py-1 font-semibold text-indigo">
            {hi ? 'समर्थन' : 'Backed'} {row.backer_count || 0}
          </span>
          <span className="rounded-full bg-success/12 px-3 py-1 font-semibold text-success">
            {hi ? 'ऑन-साइट' : 'On-site'} {row.push_count || 0}
          </span>
          <span className="rounded-full bg-amber/15 px-3 py-1 font-semibold text-amber">
            {hi ? 'लंबित' : 'Pending'} {row.pending_raise_count || 0}
          </span>
        </div>
      </GlassCard>

      <RaiseVerifyPanel
        registrationId={row.registration_id}
        mode={requestedMode}
        defaultVillage={row.village}
        defaultWard={row.ward}
        onDone={async () => {
          const [g, s] = await Promise.all([api.getGrievance(row.registration_id), api.backers(row.registration_id)])
          setRow(g)
          setStats(s)
        }}
      />

      {stats?.priority_crossed && (
        <p className="rounded-card bg-attention/10 px-4 py-3 text-sm font-medium text-attention">
          {hi
            ? 'प्राथमिकता सीमा पार — अधिकारी डेस्क पर अंतरिम जवाब अपेक्षित है।'
            : 'Priority threshold crossed — an interim reply is due on the officer desk.'}
        </p>
      )}
    </div>
  )
}

export default function NearbyRaisePage() {
  return (
    <Suspense
      fallback={
        <div className="page-wrap mx-auto max-w-[800px] pb-16">
          <div className="h-40 animate-shimmer rounded-panel bg-[linear-gradient(90deg,#e8ebf2,#f7f8fa,#e8ebf2)] bg-[length:200%_100%]" />
        </div>
      }
    >
      <NearbyRaiseInner />
    </Suspense>
  )
}
