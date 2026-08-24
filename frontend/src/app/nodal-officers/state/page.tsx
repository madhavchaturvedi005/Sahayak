'use client'

import { useEffect, useState } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { useLanguage } from '@/context/LanguageContext'
import { api, type Officer } from '@/lib/api'

export default function StateOfficersPage() {
  const { t } = useLanguage()
  const [rows, setRows] = useState<Officer[]>([])

  useEffect(() => {
    api.officers('state').then(setRows).catch(() => setRows([]))
  }, [])

  return (
    <div className="page-wrap space-y-6 pb-16">
      <h1 className="text-[32px] font-bold">{t('officersState')}</h1>
      <div className="grid gap-4">
        {rows.map((row) => (
          <GlassCard key={row.id} className="md:flex md:items-center md:justify-between">
            <div>
              <p className="text-sm text-amber">{row.state}</p>
              <h2 className="text-lg font-semibold">{row.organisation}</h2>
              <p className="text-slate">{row.name}</p>
            </div>
            <div className="mt-3 text-sm md:mt-0 md:text-right">
              <p>{row.email}</p>
              <p>{row.phone}</p>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  )
}
