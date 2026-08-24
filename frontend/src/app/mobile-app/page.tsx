'use client'

import { GlassCard } from '@/components/ui/GlassCard'
import { useLanguage } from '@/context/LanguageContext'

export default function MobileAppPage() {
  const { t } = useLanguage()
  return (
    <div className="page-wrap pb-16">
      <GlassCard>
        <h1 className="text-[32px] font-bold">{t('mobileApp')}</h1>
        <p className="mt-3 leading-relaxed">{t('mobileAppBody')}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a className="btn-secondary" href="https://play.google.com/store" target="_blank" rel="noreferrer">
            Google Play
          </a>
          <a className="btn-secondary" href="https://web.umang.gov.in" target="_blank" rel="noreferrer">
            UMANG
          </a>
        </div>
      </GlassCard>
    </div>
  )
}
