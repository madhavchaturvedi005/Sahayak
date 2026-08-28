'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Copy, Phone } from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import { RaiseVerifyPanel } from '@/components/grievance/RaiseVerifyPanel'
import { api, type BackerStats, type Grievance } from '@/lib/api'

export default function BackPage() {
  const params = useParams<{ reg: string | string[] }>()
  const reg = Array.isArray(params.reg) ? params.reg.join('/') : decodeURIComponent(params.reg ?? '')
  const [row, setRow] = useState<Grievance | null>(null)
  const [stats, setStats] = useState<BackerStats | null>(null)
  const [error, setError] = useState('')
  const [ivrStep, setIvrStep] = useState(0)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!reg) return
    Promise.all([api.getGrievance(reg), api.backers(reg)])
      .then(([g, s]) => {
        setRow(g)
        setStats(s)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Not found'))
  }, [reg])

  const shareUrl = useMemo(() => {
    if (typeof window === 'undefined') return `/back/${reg}`
    return `${window.location.origin}/back/${reg}`
  }, [reg])

  async function copyLink() {
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (error) {
    return (
      <div className="page-wrap mx-auto max-w-[800px] pb-16">
        <GlassCard>
          <h1 className="text-[28px] font-bold">Not found</h1>
          <p className="mt-2 text-slate">{error}</p>
          <Link href="/nearby" className="btn-secondary mt-6 inline-flex">
            Find nearby problems
          </Link>
        </GlassCard>
      </div>
    )
  }

  if (!row) {
    return (
      <div className="page-wrap mx-auto max-w-[800px] pb-16">
        <div className="h-40 animate-pulse rounded-panel bg-indigo/5" />
      </div>
    )
  }

  return (
    <div className="page-wrap mx-auto max-w-[800px] space-y-6 pb-16">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber">Jan Samarthan</p>
        <h1 className="mt-2 text-[32px] font-bold leading-tight">Raise this location complaint</h1>
        <p className="mt-2 text-base text-slate">
          Pass the phone, share the link, or use the labelled missed-call IVR simulator. Verified raises push
          priority; pending ones do not.
        </p>
      </div>

      <GlassCard hover={false}>
        <p className="text-xs font-medium text-slate">Registration</p>
        <p className="mt-1 break-all text-xl font-semibold text-indigo">{row.registration_id}</p>
        <p className="mt-2 font-medium">{row.subject}</p>
        <p className="mt-1 text-sm text-slate">
          {[row.street, row.village, row.ward, row.district].filter(Boolean).join(', ') || 'Place not pinned'}
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          <span className="rounded-full bg-indigo/8 px-3 py-1 font-semibold text-indigo">
            Backed {row.backer_count || 0}
          </span>
          <span className="rounded-full bg-success/12 px-3 py-1 font-semibold text-success">
            On-site {row.push_count || 0}
          </span>
          <span className="rounded-full bg-amber/15 px-3 py-1 font-semibold text-amber">
            Pending {row.pending_raise_count || 0}
          </span>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <button type="button" className="btn-secondary" onClick={copyLink}>
            <Copy className="h-4 w-4" />
            {copied ? 'Copied' : 'Copy share link'}
          </button>
          <Link href={`/status/${row.registration_id}`} className="btn-secondary">
            View status
          </Link>
        </div>
      </GlassCard>

      <RaiseVerifyPanel
        registrationId={row.registration_id}
        mode="remote"
        defaultVillage={row.village}
        defaultWard={row.ward}
        onDone={async () => {
          const s = await api.backers(row.registration_id)
          setStats(s)
          const g = await api.getGrievance(row.registration_id)
          setRow(g)
        }}
      />

      <GlassCard hover={false}>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber">IVR simulator (labelled mock)</p>
        <h2 className="mt-1 text-[22px] font-semibold">Missed-call endorsement</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate">
          Demo only — no real telephony. Pretend a feature phone gives a missed call; the system calls back and
          you press 1 to raise.
        </p>
        <div className="mt-5 rounded-card bg-indigo/5 p-4 font-mono text-sm">
          {ivrStep === 0 && <p>Dial ··· ··· 4242 and hang up (missed call).</p>}
          {ivrStep === 1 && (
            <p>
              Callback: &quot;Press 1 if the problem in {row.village || 'this place'} still affects you. Press 2 to
              hear again.&quot;
            </p>
          )}
          {ivrStep === 2 && (
            <p className="text-success">
              Recorded as pending raise for last dialler. Complete mock OTP 123456 in the form above to verify and
              push.
            </p>
          )}
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button type="button" className="btn-secondary" onClick={() => setIvrStep(1)}>
            <Phone className="h-4 w-4" />
            Simulate missed call
          </button>
          <button type="button" className="btn-primary" disabled={ivrStep < 1} onClick={() => setIvrStep(2)}>
            Press 1 — yes, it affects me
          </button>
          <button type="button" className="btn-secondary" onClick={() => setIvrStep(0)}>
            Reset
          </button>
        </div>
      </GlassCard>

      {stats && (
        <GlassCard hover={false}>
          <h2 className="text-[22px] font-semibold">Transparent breakdown</h2>
          <p className="mt-2 text-sm text-slate">
            {stats.verified_count} verified · {stats.pending_count} pending · {stats.onsite_count} on-site ·{' '}
            {stats.distinct_mobiles} distinct mobiles
            {stats.avg_distance_m != null ? ` · avg ${stats.avg_distance_m} m` : ''}
          </p>
          {stats.priority_crossed && (
            <p className="mt-3 rounded-card bg-attention/10 px-3 py-2 text-sm font-medium text-attention">
              Priority threshold crossed — interim reply due on the officer desk.
            </p>
          )}
          <ul className="mt-4 divide-y divide-indigo/10">
            {stats.backers.slice(0, 12).map((b) => (
              <li key={b.id} className="flex flex-wrap justify-between gap-2 py-2 text-sm">
                <span>
                  {b.name || 'Resident'} · ···{b.mobile.slice(-4)} · {b.kind} · {b.source}
                </span>
                <span className={b.status === 'verified' ? 'text-success' : 'text-amber'}>{b.status}</span>
              </li>
            ))}
          </ul>
        </GlassCard>
      )}
    </div>
  )
}
