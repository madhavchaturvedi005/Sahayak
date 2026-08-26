'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowUpRight, CheckCircle2, Clock, FileText, Scale, TriangleAlert } from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import { useLanguage } from '@/context/LanguageContext'
import { api, type TransparencyStats } from '@/lib/api'
import { daysLabel } from '@/lib/i18n'

export function TransparencyDesk() {
  const { lang, t } = useLanguage()
  const [stats, setStats] = useState<TransparencyStats | null>(null)

  useEffect(() => {
    api.transparency().then(setStats).catch(() => setStats(null))
  }, [])

  const strip = [
    { label: t('registered'), value: stats ? String(stats.registered) : '—', icon: FileText, tone: 'text-indigo' },
    {
      label: t('avgResolve'),
      value: stats ? daysLabel(stats.avg_resolution_days, lang) : '—',
      icon: Clock,
      tone: 'text-indigo',
    },
    { label: t('delayed'), value: stats ? String(stats.delayed) : '—', icon: TriangleAlert, tone: 'text-attention' },
    {
      label: t('onTime'),
      value: stats ? String(stats.fulfilled_within_days) : '—',
      icon: CheckCircle2,
      tone: 'text-success',
    },
    { label: t('appeals'), value: stats ? String(stats.appealed) : '—', icon: Scale, tone: 'text-indigo' },
  ]

  return (
    <section aria-labelledby="transparency-heading">
      <GlassCard hover={false} className="py-5 md:py-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-amber">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success/70" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
              </span>
              {t('transparency')}
            </p>
            <h2 id="transparency-heading" className="mt-1.5 text-lg font-semibold md:text-xl">
              {t('howDeskWorking')}
            </h2>
          </div>
          <Link
            href="/transparency"
            className="inline-flex items-center gap-1.5 rounded-btn border border-indigo/15 bg-white/70 px-4 py-2 text-sm font-semibold text-indigo transition hover:bg-white"
          >
            {t('more')}
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
          {strip.map((item) => {
            const Icon = item.icon
            return (
              <div
                key={item.label}
                className="group rounded-card border border-white/60 bg-white/60 px-3 py-3.5 transition hover:border-indigo/20 hover:bg-white/85"
              >
                <div className="flex items-center justify-between">
                  <p className="text-2xl font-bold tabular-nums text-indigo">{item.value}</p>
                  <Icon className={`h-4 w-4 ${item.tone}`} />
                </div>
                <p className="mt-1 text-xs leading-snug text-slate">{item.label}</p>
              </div>
            )
          })}
        </div>
      </GlassCard>
    </section>
  )
}
