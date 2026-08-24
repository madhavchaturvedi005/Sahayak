'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { useLanguage } from '@/context/LanguageContext'
import { cn } from '@/lib/utils'

function StatusSearch() {
  const params = useSearchParams()
  const router = useRouter()
  const { t } = useLanguage()
  const kind = params.get('kind') === 'appeal' ? 'appeal' : 'grievance'
  const [id, setId] = useState('')

  return (
    <div className="page-wrap space-y-6 pb-16">
      <h1 className="text-[32px] font-bold">{t('viewStatus')}</h1>
      <div className="inline-flex rounded-full glass-panel p-1">
        <button
          type="button"
          className={cn('rounded-full px-5 py-2 text-sm font-semibold', kind === 'grievance' && 'bg-indigo text-white')}
          onClick={() => router.replace('/status?kind=grievance')}
        >
          {t('grievance')}
        </button>
        <button
          type="button"
          className={cn('rounded-full px-5 py-2 text-sm font-semibold', kind === 'appeal' && 'bg-indigo text-white')}
          onClick={() => router.replace('/status?kind=appeal')}
        >
          {t('appeal')}
        </button>
      </div>
      <GlassCard>
        <p className="mb-4 text-slate">
          {kind === 'grievance'
            ? t('statusGrievanceHint')
            : t('statusAppealHint')}
        </p>
        <label className="label" htmlFor="reg">
          {kind === 'grievance' ? t('registrationNumber') : t('appealNumber')}
        </label>
        <input id="reg" className="field" value={id} onChange={(e) => setId(e.target.value)} />
        <button
          type="button"
          className="btn-primary mt-5"
          disabled={!id.trim()}
          onClick={() => router.push(`/status/${encodeURIComponent(id.trim())}?kind=${kind}`)}
        >
          {t('checkStatus')}
        </button>
        <p className="mt-4 text-xs text-slate">{t('demoGrievance')}</p>
      </GlassCard>
    </div>
  )
}

export default function StatusPage() {
  return (
    <Suspense>
      <StatusSearch />
    </Suspense>
  )
}
