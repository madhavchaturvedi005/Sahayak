'use client'

import dynamic from 'next/dynamic'
import { useLanguage } from '@/context/LanguageContext'
import type { Grievance } from '@/lib/api'

const LeafletIssueMap = dynamic(() => import('./LeafletIssueMap'), {
  ssr: false,
  loading: () => <MapSkeleton />,
})

function MapSkeleton() {
  const { t } = useLanguage()
  return (
    <div className="flex h-[560px] items-center justify-center bg-[#e8eef4] text-sm text-slate">
      {t('cmStateMapTitle')}…
    </div>
  )
}

export function MaharashtraMap({
  issues,
  selectedId,
  onSelect,
}: {
  issues: Grievance[]
  selectedId?: string | null
  onSelect: (issue: Grievance) => void
}) {
  const { t } = useLanguage()
  return (
    <div className="overflow-hidden rounded-panel bg-white shadow-glass">
      <div className="border-b border-line px-5 py-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-amber">{t('cmStateMapKicker')}</p>
        <h2 className="text-lg font-semibold">{t('cmStateMapTitle')}</h2>
      </div>
      <div className="h-[560px] w-full">
        <LeafletIssueMap issues={issues} selectedId={selectedId} onSelect={onSelect} />
      </div>
    </div>
  )
}
