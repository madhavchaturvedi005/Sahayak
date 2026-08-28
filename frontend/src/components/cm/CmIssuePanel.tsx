'use client'

import Link from 'next/link'
import { Clock3, MapPin, Shield, Users } from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import { useLanguage } from '@/context/LanguageContext'
import { firstPhoto, managerChain, slaProgress, trendScore } from '@/lib/cm'
import type { DeskMap, Grievance } from '@/lib/api'

export function CmIssuePanel({
  issue,
  desk,
}: {
  issue: Grievance | null
  desk: DeskMap | null
}) {
  const { t } = useLanguage()

  if (!issue) {
    return (
      <GlassCard hover={false} className="flex h-full min-h-[520px] flex-col justify-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber">{t('cmMapHintKicker')}</p>
        <h2 className="mt-2 text-2xl font-semibold">{t('cmMapHintTitle')}</h2>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate">{t('cmMapHintBody')}</p>
      </GlassCard>
    )
  }

  const photo = firstPhoto(issue)
  const sla = slaProgress(issue)
  const chain = managerChain(issue, desk)
  const place = [issue.street, issue.village, issue.district].filter(Boolean).join(', ')

  return (
    <GlassCard hover={false} className="flex h-full min-h-[520px] flex-col overflow-hidden !p-0">
      <div className="relative h-44 shrink-0 bg-indigo">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-white/70">{t('cmNoPhoto')}</div>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-indigo via-indigo/70 to-transparent px-5 pb-4 pt-12">
          <p className="font-mono text-[11px] text-amber">{issue.registration_id}</p>
          <h2 className="mt-1 text-lg font-semibold leading-snug text-white">{issue.subject}</h2>
        </div>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
        <div className="flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-wide">
          <span className="rounded-full bg-indigo/10 px-2.5 py-1 text-indigo">{issue.status}</span>
          <span className="rounded-full bg-amber/15 px-2.5 py-1 text-amber">{issue.escalation_label || t('deskField')}</span>
          {trendScore(issue) >= 12 && (
            <span className="rounded-full bg-attention/10 px-2.5 py-1 text-attention">{t('cmRapidBadge')}</span>
          )}
        </div>

        <p className="text-sm leading-relaxed text-slate">{issue.description}</p>

        {place && (
          <p className="flex items-start gap-2 text-sm text-slate">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-amber" />
            {place}
          </p>
        )}

        <div className="grid grid-cols-3 gap-2">
          <Metric label={t('cmBackers')} value={issue.backer_count || 0} />
          <Metric label={t('cmPushes')} value={issue.push_count || 0} />
          <Metric label={t('cmPendingRaise')} value={issue.pending_raise_count || 0} />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between text-xs text-slate">
            <span className="inline-flex items-center gap-1.5">
              <Clock3 className="h-3.5 w-3.5 text-amber" />
              {t('cmSlaWindow')}
            </span>
            <span className={sla.overdue ? 'text-attention' : ''}>
              {sla.overdue ? t('slaOverdue') : t('cmDaysLeft', { n: sla.daysRemaining })}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-indigo/10">
            <div
              className={`h-full rounded-full ${sla.overdue ? 'bg-attention' : 'bg-amber'}`}
              style={{ width: `${Math.max(8, sla.pct)}%` }}
            />
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
            <p className="rounded-xl bg-white/80 px-3 py-2">
              <span className="block text-[11px] uppercase tracking-wide text-slate">{t('cmDaysDone')}</span>
              <span className="text-lg font-semibold text-indigo">{t('cmDayCount', { n: sla.daysCompleted })}</span>
            </p>
            <p className="rounded-xl bg-white/80 px-3 py-2">
              <span className="block text-[11px] uppercase tracking-wide text-slate">{t('cmDaysLeftLabel')}</span>
              <span className="text-lg font-semibold text-indigo">{t('cmDayCount', { n: sla.daysRemaining })}</span>
            </p>
          </div>
        </div>

        <div>
          <p className="mb-2 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-amber">
            <Shield className="h-3.5 w-3.5" />
            {t('cmManagerList')}
          </p>
          <ol className="space-y-2">
            {chain.map((seat) => (
              <li
                key={`${seat.role}-${seat.name}`}
                className={`rounded-xl border px-3 py-2.5 ${
                  seat.current ? 'border-amber/40 bg-amber/10' : 'border-line bg-white/70'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-indigo">{seat.name}</p>
                  {seat.current && (
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-amber">{t('cmResponsible')}</span>
                  )}
                </div>
                <p className="text-xs text-slate">
                  {seat.role === 'officer' ? t('deskField') : seat.role === 'supervisor' ? t('deskSupervisor') : t('deskCm')}
                  {seat.title ? ` · ${seat.title}` : ''}
                </p>
              </li>
            ))}
          </ol>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate">
          <Users className="h-3.5 w-3.5" />
          {issue.ministry}
        </div>

        <Link href={`/admin/grievances/${issue.registration_id}`} className="btn-primary w-full">
          {t('cmOpenFile')}
        </Link>
      </div>
    </GlassCard>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-white/80 px-2.5 py-2 text-center">
      <p className="text-lg font-semibold text-indigo">{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-slate">{label}</p>
    </div>
  )
}
