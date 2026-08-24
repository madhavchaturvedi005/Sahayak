'use client'

import Link from 'next/link'
import { GlassCard } from '@/components/ui/GlassCard'
import { useLanguage } from '@/context/LanguageContext'

const STEPS = [
  ['Lodge', 'Citizen files a public or pension grievance with a department and category.'],
  ['Acknowledge', 'A registration number is issued and a field officer is assigned on this portal.'],
  ['Field desk', 'The field officer has 21 days. If they miss it, the file goes to a supervisor.'],
  ['Supervisor', 'The supervisor presses the field officer and takes the case. Another 21 days.'],
  ['CM office', 'If the supervisor also misses the window, the file goes to the Chief Minister’s Office.'],
  ['Appeal', 'If unsatisfied after a reply, the citizen can still use the nodal authority for appeal.'],
]

export default function RedressProcessPage() {
  const { t } = useLanguage()
  return (
    <div className="page-wrap space-y-6 pb-16">
      <h1 className="text-[32px] font-bold">{t('redressFlow')}</h1>
      <div className="space-y-4">
        {STEPS.map(([title, body], i) => (
          <GlassCard key={title} className="flex gap-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber text-sm font-bold text-white">
              {i + 1}
            </div>
            <div>
              <h2 className="text-lg font-semibold">{title}</h2>
              <p className="mt-1 text-sm leading-relaxed text-slate">{body}</p>
            </div>
          </GlassCard>
        ))}
      </div>
      <Link href="/escalation-map" className="btn-primary">
        {t('openDeskMap')}
      </Link>
    </div>
  )
}
