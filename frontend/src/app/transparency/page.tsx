'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Clock3,
  FileCheck2,
  FolderOpen,
  Hourglass,
  Scale,
  Sparkles,
  TriangleAlert,
} from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import { api, type TransparencyStats } from '@/lib/api'
import { useLanguage } from '@/context/LanguageContext'
import { MINISTRY_HI, daysLabel, formatDateTimeLocale, translateLookup } from '@/lib/i18n'
import { share } from '@/lib/transparency'

const ICONS = {
  registered: FileCheck2,
  open: FolderOpen,
  avg: Clock3,
  delayed: TriangleAlert,
  onTime: Hourglass,
  appealed: Scale,
} as const

export default function TransparencyPage() {
  const { lang, t } = useLanguage()
  const [stats, setStats] = useState<TransparencyStats | null>(null)

  useEffect(() => {
    api.transparency().then(setStats).catch(() => setStats(null))
  }, [])

  const pulse = useMemo(() => {
    if (!stats || !stats.registered) {
      return { onTime: 0, late: 0, open: 0, lateCount: 0 }
    }
    const lateCount = Math.max(0, stats.resolved - stats.fulfilled_within_days)
    return {
      onTime: share(stats.fulfilled_within_days, stats.registered),
      late: share(lateCount, stats.registered),
      open: share(stats.open, stats.registered),
      lateCount,
    }
  }, [stats])

  const maxFiled = stats?.ministries.reduce((n, row) => Math.max(n, row.count), 0) || 1
  const counted = stats?.updated_at ? formatDateTimeLocale(stats.updated_at, lang) : null
  const tiles = [
    { key: 'registered' as const, label: t('tileRegistered'), hint: t('tileRegisteredHint'), value: stats ? String(stats.registered) : '—', tone: 'bg-indigo text-white' },
    { key: 'open' as const, label: t('tileOpen'), hint: t('tileOpenHint'), value: stats ? String(stats.open) : '—', tone: 'bg-indigo-soft text-white' },
    { key: 'avg' as const, label: t('tileAvg'), hint: t('tileAvgHint'), value: stats ? daysLabel(stats.avg_resolution_days, lang) : '—', tone: 'bg-indigo-deep text-white' },
    { key: 'delayed' as const, label: t('tileDelayed'), hint: t('tileDelayedHint'), value: stats ? String(stats.delayed) : '—', tone: 'bg-amber text-white' },
    { key: 'onTime' as const, label: t('tileOnTime'), hint: t('tileOnTimeHint'), value: stats ? String(stats.fulfilled_within_days) : '—', tone: 'bg-success text-white' },
    { key: 'appealed' as const, label: t('tileAppealed'), hint: t('tileAppealedHint'), value: stats ? String(stats.appealed) : '—', tone: 'bg-indigo text-white' },
  ]

  return (
    <div className="page-wrap space-y-6 pb-16">
      <section className="relative overflow-hidden rounded-panel glass-indigo px-6 py-8 md:px-10 md:py-10">
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-amber/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
        <div className="relative">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white">
              <span className="h-2 w-2 animate-pulse rounded-full bg-amber" />
              {t('liveFromDesk')}
            </span>
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-white/85 hover:text-white">
              <ArrowLeft className="h-4 w-4" />
              {t('home')}
            </Link>
          </div>
          <h1 className="mt-5 max-w-2xl text-[32px] font-bold leading-tight text-white md:text-[40px]">
            {t('howDeskWorking')}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/80 md:text-base">{t('transparencyLead')}</p>
          <p className="mt-5 text-xs text-white/60">{counted ? t('lastCounted', { when: counted }) : t('counting')}</p>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-12">
        <GlassCard hover={false} className="lg:col-span-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber">{t('deskPulse')}</p>
          <p className="mt-3 text-5xl font-bold tabular-nums text-indigo md:text-6xl">
            {stats ? stats.registered : '—'}
          </p>
          <p className="mt-2 text-sm text-slate">{t('grievancesRegisteredOnDesk')}</p>
          <div className="mt-6 flex h-3 overflow-hidden rounded-full bg-indigo/10">
            <div className="bg-success transition-all" style={{ width: `${pulse.onTime}%` }} />
            <div className="bg-amber transition-all" style={{ width: `${pulse.late}%` }} />
            <div className="bg-indigo/40 transition-all" style={{ width: `${pulse.open}%` }} />
          </div>
          <ul className="mt-4 space-y-2 text-sm">
            <li className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 text-slate">
                <span className="h-2.5 w-2.5 rounded-full bg-success" />
                {t('closedOnTime')}
              </span>
              <span className="font-semibold tabular-nums text-indigo">
                {stats ? stats.fulfilled_within_days : '—'} · {pulse.onTime}%
              </span>
            </li>
            <li className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 text-slate">
                <span className="h-2.5 w-2.5 rounded-full bg-amber" />
                {t('closedLate')}
              </span>
              <span className="font-semibold tabular-nums text-indigo">
                {stats ? pulse.lateCount : '—'} · {pulse.late}%
              </span>
            </li>
            <li className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 text-slate">
                <span className="h-2.5 w-2.5 rounded-full bg-indigo/40" />
                {t('stillOpen')}
              </span>
              <span className="font-semibold tabular-nums text-indigo">
                {stats ? stats.open : '—'} · {pulse.open}%
              </span>
            </li>
          </ul>
        </GlassCard>

        <div className="grid gap-3 sm:grid-cols-2 lg:col-span-7">
          {tiles.map((tile) => {
            const Icon = ICONS[tile.key]
            return (
              <div
                key={tile.key}
                className="rounded-panel border border-white/50 bg-white/40 p-5 shadow-glass backdrop-blur-xl"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-3xl font-bold tabular-nums text-indigo">{tile.value}</p>
                  <span className={`rounded-full p-2 ${tile.tone}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                </div>
                <p className="mt-3 text-sm font-semibold text-indigo">{tile.label}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate">{tile.hint}</p>
              </div>
            )
          })}
        </div>
      </div>

      <GlassCard hover={false}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber">{t('departments')}</p>
            <h2 className="mt-2 text-[22px] font-semibold">{t('whereComplaintsGoing')}</h2>
            <p className="mt-1 text-sm text-slate">{t('sameFilesSplit')}</p>
          </div>
        </div>

        {!stats || stats.ministries.length === 0 ? (
          <p className="mt-8 text-sm text-slate">{t('noGrievancesOnDesk')}</p>
        ) : (
          <ul className="mt-6 space-y-5">
            {stats.ministries.map((row, index) => (
              <li key={row.ministry}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-semibold text-indigo">
                    <span className="mr-2 text-xs font-bold text-amber">{String(index + 1).padStart(2, '0')}</span>
                    {translateLookup(MINISTRY_HI, row.ministry, lang)}
                  </p>
                  <p className="text-xs text-slate">{t('avgShort', { days: daysLabel(row.avg_resolution_days, lang) })}</p>
                </div>
                <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-indigo/10">
                  <div
                    className="h-full rounded-full bg-indigo transition-all"
                    style={{ width: `${Math.max(8, (row.count / maxFiled) * 100)}%` }}
                  />
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-semibold">
                  <span className="rounded-full bg-indigo/10 px-2.5 py-1 text-indigo">{t('filedN', { n: row.count })}</span>
                  <span className="rounded-full bg-indigo/5 px-2.5 py-1 text-slate">{t('openN', { n: row.open })}</span>
                  <span className="rounded-full bg-success/10 px-2.5 py-1 text-success">{t('onTimeN', { n: row.fulfilled })}</span>
                  <span className="rounded-full bg-amber/15 px-2.5 py-1 text-amber">{t('delayedN', { n: row.delayed })}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </GlassCard>

      <GlassCard hover={false}>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-amber" />
          <h2 className="text-[22px] font-semibold">{t('howNumbersCounted')}</h2>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {tiles.map((tile) => {
            const Icon = ICONS[tile.key]
            return (
              <div key={`how-${tile.key}`} className="rounded-card border border-white/50 bg-white/35 p-4">
                <Icon className="h-4 w-4 text-amber" />
                <p className="mt-3 text-sm font-semibold text-indigo">{tile.label}</p>
                <p className="mt-1 text-sm leading-relaxed text-slate">{tile.hint}</p>
              </div>
            )
          })}
        </div>
      </GlassCard>
    </div>
  )
}
