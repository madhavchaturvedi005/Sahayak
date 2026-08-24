'use client'

import { GlassCard } from '@/components/ui/GlassCard'
import { useLanguage } from '@/context/LanguageContext'

export default function ContactPage() {
  const { t } = useLanguage()
  return (
    <div className="page-wrap space-y-6 pb-16">
      <h1 className="text-[32px] font-bold">{t('contact')}</h1>
      <GlassCard>
        <h2 className="text-[22px] font-semibold">{t('contactDarpg')}</h2>
        <p className="mt-3 leading-relaxed text-slate">{t('contactAddress')}</p>
        <p className="mt-4 text-sm">{t('contactPhone')}</p>
      </GlassCard>
      <GlassCard>
        <h2 className="text-[22px] font-semibold">{t('techSupport')}</h2>
        <p className="mt-3 text-sm leading-relaxed text-slate">{t('techSupportBody')}</p>
      </GlassCard>
    </div>
  )
}
