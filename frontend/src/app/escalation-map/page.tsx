'use client'

import { useEffect, useState } from 'react'
import { EscalationMap } from '@/components/desk/EscalationMap'
import { GlassCard } from '@/components/ui/GlassCard'
import { useLanguage } from '@/context/LanguageContext'
import { api, type DeskMap, type Grievance } from '@/lib/api'

export default function EscalationMapPage() {
  const { t } = useLanguage()
  const [data, setData] = useState<DeskMap | null>(null)
  const [community, setCommunity] = useState<Grievance[]>([])

  useEffect(() => {
    api.deskMap().then(setData).catch(() => setData(null))
    api
      .listGrievances()
      .then(setCommunity)
      .catch(() => {
        api.adminGrievances().then(setCommunity).catch(() => setCommunity([]))
      })
  }, [])

  return (
    <div className="page-wrap space-y-6 pb-16">
      <div>
        <h1 className="text-[32px] font-bold">{t('deskMap')}</h1>
        <p className="mt-2 max-w-3xl leading-relaxed text-slate">{t('deskMapLead')}</p>
      </div>
      {data ? (
        <EscalationMap data={data} community={community} />
      ) : (
        <GlassCard>
          <p className="text-slate">{t('loading')}</p>
        </GlassCard>
      )}
    </div>
  )
}
