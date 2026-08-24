'use client'

import { GlassCard } from '@/components/ui/GlassCard'
import { useLanguage } from '@/context/LanguageContext'

export default function WimPage() {
  const { t } = useLanguage()
  return (
    <div className="page-wrap pb-16">
      <GlassCard>
        <h1 className="text-[32px] font-bold">{t('footerWim')}</h1>
        <p className="mt-4 leading-relaxed">{t('wimLead')}</p>
        <p className="mt-4 text-sm text-slate">{t('wimExtra')}</p>
      </GlassCard>
    </div>
  )
}
