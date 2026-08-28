'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Maximize2, Minimize2, X } from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import type { DeskMap, Grievance } from '@/lib/api'
import { CmIssuePanel } from './CmIssuePanel'

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
  selectedIssue,
  desk,
}: {
  issues: Grievance[]
  selectedId?: string | null
  onSelect: (issue: Grievance) => void
  selectedIssue?: Grievance | null
  desk?: DeskMap | null
}) {
  const { t } = useLanguage()
  const [fullscreen, setFullscreen] = useState(false)

  useEffect(() => {
    if (!fullscreen) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setFullscreen(false) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [fullscreen])

  useEffect(() => {
    document.body.style.overflow = fullscreen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [fullscreen])

  const header = (
    <div className="flex items-center justify-between border-b border-line px-5 py-4">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-amber">{t('cmStateMapKicker')}</p>
        <h2 className="text-lg font-semibold">{t('cmStateMapTitle')}</h2>
      </div>
      <button
        type="button"
        onClick={() => setFullscreen((v) => !v)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-white text-indigo shadow-sm transition hover:bg-indigo/5"
        title={fullscreen ? 'Exit fullscreen' : 'Fullscreen map'}
        aria-label={fullscreen ? 'Exit fullscreen' : 'Fullscreen map'}
      >
        {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
      </button>
    </div>
  )

  if (fullscreen && typeof document !== 'undefined') {
    return createPortal(
      <div className="fixed inset-0 z-[9999] flex flex-col bg-white">
        {header}
        <div className="relative flex flex-1 overflow-hidden">
          {/* Map */}
          <div className="flex-1 overflow-hidden">
            <LeafletIssueMap issues={issues} selectedId={selectedId} onSelect={onSelect} />
          </div>

          {/* Detail side panel — slides in when an issue is selected */}
          <div
            className={`absolute right-0 top-0 z-10 flex h-full w-full max-w-sm flex-col overflow-hidden bg-white shadow-[-4px_0_24px_rgba(27,42,74,0.14)] transition-transform duration-300 ease-in-out sm:relative sm:max-w-[360px] sm:shadow-none ${
              selectedIssue ? 'translate-x-0' : 'translate-x-full sm:hidden'
            }`}
          >
            {selectedIssue && (
              <button
                type="button"
                className="absolute right-3 top-3 z-20 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-indigo shadow sm:hidden"
                onClick={() => onSelect({ ...selectedIssue, id: '' } as Grievance)}
                aria-label="Close detail panel"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <div className="flex-1 overflow-y-auto">
              <CmIssuePanel issue={selectedIssue ?? null} desk={desk ?? null} />
            </div>
          </div>
        </div>
      </div>,
      document.body
    )
  }

  return (
    <div className="overflow-hidden rounded-panel bg-white shadow-glass">
      {header}
      <div className="h-[560px] w-full">
        <LeafletIssueMap issues={issues} selectedId={selectedId} onSelect={onSelect} />
      </div>
    </div>
  )
}
