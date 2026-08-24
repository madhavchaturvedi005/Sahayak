'use client'

import { GlassCard } from '@/components/ui/GlassCard'
import { useLanguage } from '@/context/LanguageContext'

export default function PoliciesPage() {
  const { t } = useLanguage()
  return (
    <div className="page-wrap pb-16">
      <GlassCard>
        <h1 className="text-[32px] font-bold">{t('footerPolicies')}</h1>
        <ul className="mt-4 list-disc space-y-3 pl-5 leading-relaxed">
          <li>{t('policy1')}</li>
          <li>{t('policy2')}</li>
          <li>{t('policy3')}</li>
          <li>{t('policy4')}</li>
          <li>{t('policy5')}</li>
        </ul>
      </GlassCard>
    </div>
  )
}
