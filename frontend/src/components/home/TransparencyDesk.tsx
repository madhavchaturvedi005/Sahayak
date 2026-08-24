'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
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
    { label: t('registered'), value: stats ? String(stats.registered) : '—' },
    { label: t('avgResolve'), value: stats ? daysLabel(stats.avg_resolution_days, lang) : '—' },
    { label: t('delayed'), value: stats ? String(stats.delayed) : '—' },
    { label: t('onTime'), value: stats ? String(stats.fulfilled_within_days) : '—' },
    { label: t('appeals'), value: stats ? String(stats.appealed) : '—' },
  ]

  return (
    <section aria-labelledby="transparency-heading">
      <GlassCard hover={false} className="py-5 md:py-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber">{t('transparency')}</p>
            <h2 id="transparency-heading" className="mt-1 text-lg font-semibold md:text-xl">
              {t('howDeskWorking')}
            </h2>
          </div>
          <Link href="/transparency" className="btn-secondary h-10 px-4 text-sm">
            {t('more')}
          </Link>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {strip.map((item) => (
            <div key={item.label} className="rounded-card bg-indigo/5 px-3 py-3">
              <p className="text-xl font-bold tabular-nums text-indigo">{item.value}</p>
              <p className="mt-0.5 text-xs text-slate">{item.label}</p>
            </div>
          ))}
        </div>
      </GlassCard>
    </section>
  )
}
