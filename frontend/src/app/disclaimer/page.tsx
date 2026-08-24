'use client'

import { GlassCard } from '@/components/ui/GlassCard'
import { useLanguage } from '@/context/LanguageContext'
import { EMAIL_DISCLAIMER, EMAIL_DISCLAIMER_HI, NOTE_CSC, NOTE_CSC_HI } from '@/lib/content'

export default function DisclaimerPage() {
  const { lang, t } = useLanguage()
  const hi = lang === 'hi'
  return (
    <div className="page-wrap pb-16">
      <GlassCard>
        <h1 className="text-[32px] font-bold">{t('footerDisclaimer')}</h1>
        <p className="mt-4 leading-relaxed">{hi ? EMAIL_DISCLAIMER_HI : EMAIL_DISCLAIMER}</p>
        <p className="mt-4 leading-relaxed">{hi ? NOTE_CSC_HI : NOTE_CSC}</p>
        <p className="mt-4 leading-relaxed text-slate">{t('disclaimerExtra')}</p>
      </GlassCard>
    </div>
  )
}
