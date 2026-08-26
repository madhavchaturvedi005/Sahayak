'use client'

import { useEffect, useMemo, useState } from 'react'
import { Flame, Shield } from 'lucide-react'
import { CmIssuePanel } from '@/components/cm/CmIssuePanel'
import { MaharashtraMap } from '@/components/cm/MaharashtraMap'
import { GlassCard } from '@/components/ui/GlassCard'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { api, type DeskMap, type Grievance } from '@/lib/api'
import { isRapid, managerChain, mappedIssues, slaProgress, stateIssues, trendingIssues } from '@/lib/cm'

export default function CmOfficePage() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [rows, setRows] = useState<Grievance[]>([])
  const [desk, setDesk] = useState<DeskMap | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.adminGrievances().then(setRows).catch((err) => setError(err instanceof Error ? err.message : 'Could not load'))
    api.adminDeskMap().then(setDesk).catch(() => setDesk(null))
  }, [])

  const open = useMemo(() => stateIssues(rows), [rows])
  const pins = useMemo(() => mappedIssues(rows), [rows])
  const trending = useMemo(() => trendingIssues(open).slice(0, 8), [open])
  const rapid = open.filter(isRapid)
  const overdue = open.filter((row) => row.sla_overdue)
  const selected = rows.find((row) => row.id === selectedId) || null
  const officers = desk?.levels.flatMap((level) => level.people.map((person) => ({ ...person, levelTitle: level.title }))) || []

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-slate">
          {t('cmOfficeKicker')}
          {user ? ` · ${user.name}` : ''}
        </p>
        <h1 className="text-[32px] font-bold">{t('cmOfficeTitle')}</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate">{t('cmOfficeLead')}</p>
      </div>

      {error && <p className="text-sm text-attention">{error}</p>}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label={t('cmStatewideOpen')} value={open.length} tone="bg-indigo text-white" />
        <Kpi label={t('cmRapidCount')} value={rapid.length} tone="bg-amber text-white" />
        <Kpi label={t('cmOverdue')} value={overdue.length} tone="bg-attention text-white" />
        <Kpi label={t('cmOfficersOnDuty')} value={officers.length} tone="bg-indigo text-white" />
      </section>

      <section className="grid items-start gap-4 xl:grid-cols-[minmax(300px,380px)_minmax(0,1fr)]">
        <CmIssuePanel issue={selected} desk={desk} />
        <MaharashtraMap issues={pins} selectedId={selectedId} onSelect={(issue) => setSelectedId(issue.id)} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
        <GlassCard hover={false}>
          <div className="mb-4 flex items-center gap-2">
            <Flame className="h-4 w-4 text-amber" />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-amber">{t('cmTrendingKicker')}</p>
              <h2 className="text-lg font-semibold">{t('cmTrendingTitle')}</h2>
            </div>
          </div>
          <ul className="space-y-3">
            {trending.length === 0 ? (
              <li className="text-sm text-slate">{t('cmNoTrending')}</li>
            ) : (
              trending.map((issue) => {
                const sla = slaProgress(issue)
                const chain = managerChain(issue, desk)
                return (
                  <li key={issue.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(issue.id)}
                      className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                        selectedId === issue.id ? 'border-amber/50 bg-amber/10' : 'border-line bg-white/70 hover:bg-white'
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <p className="text-sm font-semibold leading-snug text-indigo">{issue.subject}</p>
                        {isRapid(issue) && (
                          <span className="rounded-full bg-attention/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-attention">
                            {t('cmRapidBadge')}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-slate">
                        {[issue.village, issue.district].filter(Boolean).join(', ') || issue.registration_id}
                        {' · '}
                        {t('cmRaiseMix', { b: issue.backer_count || 0, p: issue.push_count || 0 })}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-slate">
                        <span>
                          {t('cmDaysDone')}: {sla.daysCompleted}
                        </span>
                        <span>
                          {t('cmDaysLeftLabel')}: {sla.daysRemaining}
                        </span>
                        <span>{issue.escalation_label}</span>
                      </div>
                      <ol className="mt-2 flex flex-wrap gap-1.5">
                        {chain.map((seat) => (
                          <li
                            key={`${issue.id}-${seat.role}`}
                            className={`rounded-full px-2 py-0.5 text-[10px] ${
                              seat.current ? 'bg-amber text-indigo' : 'bg-indigo/10 text-indigo'
                            }`}
                          >
                            {seat.name}
                          </li>
                        ))}
                      </ol>
                    </button>
                  </li>
                )
              })
            )}
          </ul>
        </GlassCard>

        <GlassCard hover={false}>
          <div className="mb-4 flex items-center gap-2">
            <Shield className="h-4 w-4 text-amber" />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-amber">{t('cmRosterKicker')}</p>
              <h2 className="text-lg font-semibold">{t('cmRosterTitle')}</h2>
            </div>
          </div>
          <ul className="space-y-2">
            {officers.map((person) => (
              <li key={person.id} className="rounded-xl border border-line bg-white/70 px-3 py-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-indigo">{person.name}</p>
                    <p className="text-xs text-slate">{person.desk_title || person.levelTitle}</p>
                  </div>
                  <span className="rounded-full bg-indigo/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-indigo">
                    {person.role === 'cm' ? t('deskCm') : person.role === 'supervisor' ? t('deskSupervisor') : t('deskField')}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate">
                  {person.mobile} · {t('cmHolding', { n: person.open_assigned })}
                </p>
              </li>
            ))}
          </ul>
        </GlassCard>
      </section>
    </div>
  )
}

function Kpi({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className={`rounded-panel p-6 shadow-glass ${tone}`}>
      <p className="text-sm text-white/75">{label}</p>
      <p className="mt-2 text-4xl font-bold">{value}</p>
    </div>
  )
}
