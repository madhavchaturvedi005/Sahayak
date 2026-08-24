'use client'

import { useEffect, useMemo, useState } from 'react'
import { Mail, MapPin, Phone } from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import { useLanguage } from '@/context/LanguageContext'
import { api, type Officer } from '@/lib/api'

export default function AppealAuthorityPage() {
  const { t } = useLanguage()
  const [rows, setRows] = useState<Officer[]>([])
  const [q, setQ] = useState('')

  useEffect(() => {
    api.officers('appeal').then(setRows).catch(() => setRows([]))
  }, [])

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return rows
    return rows.filter((row) =>
      [row.organisation, row.name, row.designation, row.address, row.email, row.phone, row.state]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(needle))
    )
  }, [q, rows])

  return (
    <div className="page-wrap space-y-6 pb-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-3xl">
          <h1 className="text-[32px] font-bold">{t('officersAppeal')}</h1>
          <p className="mt-2 leading-relaxed text-slate">{t('appealAuthorityLead')}</p>
        </div>
        <p className="text-sm font-medium text-amber">{t('showingAuthorities', { n: filtered.length })}</p>
      </div>

      <GlassCard>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <input
            className="field md:max-w-md"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('searchAuthorities')}
          />
          <p className="text-sm text-attention">{t('emailSymbolNote')}</p>
        </div>
      </GlassCard>

      {filtered.length === 0 ? (
        <GlassCard>
          <p className="text-slate">{t('noAuthorities')}</p>
        </GlassCard>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((row) => (
            <GlassCard key={row.id} className="flex flex-col">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-amber">{t('organisation')}</p>
              <h2 className="mt-1 text-xl font-semibold leading-snug">{row.organisation}</h2>

              <div className="mt-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate">{t('officerName')}</p>
                <p className="mt-1 font-medium text-indigo">{row.name}</p>
                <p className="text-sm text-slate">{row.designation}</p>
              </div>

              {row.address ? (
                <div className="mt-5 flex gap-2 text-sm leading-relaxed text-slate">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-amber" />
                  <p>{row.address}</p>
                </div>
              ) : null}

              <div className="mt-auto border-t border-white/40 pt-4">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate">
                  {t('contactDetails')}
                </p>
                <div className="space-y-1.5 text-sm">
                  {row.phone ? (
                    <p className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-amber" />
                      <a href={`tel:${row.phone.replace(/[^+\d]/g, '')}`}>{row.phone}</a>
                    </p>
                  ) : null}
                  {row.email ? (
                    <p className="flex items-center gap-2 break-all">
                      <Mail className="h-4 w-4 shrink-0 text-amber" />
                      <a href={`mailto:${row.email}`}>{row.email}</a>
                    </p>
                  ) : null}
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  )
}
