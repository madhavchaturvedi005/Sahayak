'use client'

import { GlassCard } from '@/components/ui/GlassCard'
import { useLanguage } from '@/context/LanguageContext'

export default function AppealDeskPage() {
  const { t } = useLanguage()
  return (
    <div className="space-y-6">
      <h1 className="text-[32px] font-bold">{t('appealDashboard')}</h1>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-panel bg-indigo p-6 text-white">
          <p className="text-sm text-white/70">{t('totalAppeals')}</p>
          <p className="mt-2 text-4xl font-bold">0</p>
        </div>
        <div className="rounded-panel bg-attention p-6 text-white">
          <p className="text-sm text-white/80">{t('appealsPending')}</p>
          <p className="mt-2 text-4xl font-bold">0</p>
        </div>
        <div className="rounded-panel bg-success p-6 text-white">
          <p className="text-sm text-white/80">{t('appealsClosed')}</p>
          <p className="mt-2 text-4xl font-bold">0</p>
        </div>
      </div>
      <GlassCard>
        <h2 className="mb-4 text-[22px] font-semibold">{t('listOfAppeals')}</h2>
        <p className="py-8 text-center text-sm text-slate">{t('noTableData')}</p>
      </GlassCard>
    </div>
  )
}
