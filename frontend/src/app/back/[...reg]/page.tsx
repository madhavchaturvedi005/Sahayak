'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Copy, MapPin, Share2, ThumbsUp, Users } from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import { RaiseVerifyPanel } from '@/components/grievance/RaiseVerifyPanel'
import { api, type BackerStats, type Grievance } from '@/lib/api'

export default function BackPage() {
  const params = useParams<{ reg: string | string[] }>()
  const reg = Array.isArray(params.reg) ? params.reg.join('/') : decodeURIComponent(params.reg ?? '')
  const [row, setRow] = useState<Grievance | null>(null)
  const [stats, setStats] = useState<BackerStats | null>(null)
  const [error, setError] = useState('')
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

  const place = [row.street, row.village, row.ward, row.district].filter(Boolean).join(', ')

  return (
    <div className="page-wrap mx-auto max-w-[800px] space-y-6 pb-16">
      {/* Page header */}
      <div>
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-amber">
          <Users className="h-3.5 w-3.5" />
          Jan Samarthan
        </p>
        <h1 className="mt-2 text-[32px] font-bold leading-tight">Support this complaint</h1>
        <p className="mt-2 text-base text-slate">
          Add your voice to this grievance. Verified supporters increase officer priority and are shown in the
          transparency breakdown below.
        </p>
      </div>

      {/* Complaint summary */}
      <GlassCard hover={false}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate">Registration ID</p>
            <p className="mt-1 break-all text-xl font-semibold text-indigo">{row.registration_id}</p>
            <p className="mt-2 text-base font-medium">{row.subject}</p>
            {place && (
              <p className="mt-1 flex items-center gap-1.5 text-sm text-slate">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                {place}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="flex items-center gap-1 rounded-full bg-indigo/8 px-3 py-1 font-semibold text-indigo">
              <ThumbsUp className="h-3.5 w-3.5" />
              {row.backer_count || 0} backers
            </span>
            <span className="rounded-full bg-success/12 px-3 py-1 font-semibold text-success">
              {row.push_count || 0} on-site
            </span>
            {(row.pending_raise_count || 0) > 0 && (
              <span className="rounded-full bg-amber/15 px-3 py-1 font-semibold text-amber">
                {row.pending_raise_count} pending
              </span>
            )}
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <button type="button" className="btn-primary gap-2" onClick={copyLink}>
            {copied ? <Share2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Link copied!' : 'Copy share link'}
          </button>
          <Link href={`/status/${row.registration_id}`} className="btn-secondary">
            View complaint status
          </Link>
        </div>
      </GlassCard>

      {/* Raise / verify panel */}
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

      {/* Transparency breakdown */}
      {stats && (
        <GlassCard hover={false}>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber">Transparency</p>
          <h2 className="mt-1 text-[22px] font-semibold">Supporter breakdown</h2>
          <div className="mt-3 flex flex-wrap gap-4 text-sm">
            <span className="text-success font-semibold">{stats.verified_count} verified</span>
            <span className="text-amber font-semibold">{stats.pending_count} pending</span>
            <span className="text-indigo font-semibold">{stats.onsite_count} on-site</span>
            <span className="text-slate">{stats.distinct_mobiles} distinct mobiles</span>
            {stats.avg_distance_m != null && (
              <span className="text-slate">avg {stats.avg_distance_m} m from site</span>
            )}
          </div>
          {stats.priority_crossed && (
            <p className="mt-4 rounded-card bg-attention/10 px-4 py-3 text-sm font-medium text-attention">
              Priority threshold crossed — the officer desk has been flagged for an interim reply.
            </p>
          )}
          {stats.backers.length > 0 && (
            <ul className="mt-4 divide-y divide-indigo/10">
              {stats.backers.slice(0, 12).map((b) => (
                <li key={b.id} className="flex flex-wrap justify-between gap-2 py-2.5 text-sm">
                  <span className="text-ink">
                    {b.name || 'Resident'} · ···{b.mobile.slice(-4)}
                    <span className="ml-2 text-slate capitalize">{b.kind} · {b.source}</span>
                  </span>
                  <span className={b.status === 'verified' ? 'font-medium text-success' : 'font-medium text-amber capitalize'}>
                    {b.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </GlassCard>
      )}
    </div>
  )
}
