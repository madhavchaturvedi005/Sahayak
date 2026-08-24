'use client'

import { useEffect, useState } from 'react'
import { EscalationMap } from '@/components/desk/EscalationMap'
import { GlassCard } from '@/components/ui/GlassCard'
import { useLanguage } from '@/context/LanguageContext'
import { api, type DeskMap, type Grievance } from '@/lib/api'

export default function AdminEscalationPage() {
  const { t } = useLanguage()
  const [data, setData] = useState<DeskMap | null>(null)
  const [community, setCommunity] = useState<Grievance[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .adminDeskMap()
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load map'))
    api.adminGrievances().then(setCommunity).catch(() => setCommunity([]))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[32px] font-bold">{t('deskMap')}</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate">{t('deskMapLead')}</p>
      </div>
      {error ? <p className="text-sm text-attention">{error}</p> : null}
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
