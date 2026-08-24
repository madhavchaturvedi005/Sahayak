'use client'

import { GlassCard } from '@/components/ui/GlassCard'
import { useLanguage } from '@/context/LanguageContext'
import { ABOUT_CPGRAMS, ABOUT_CPGRAMS_HI, EXCLUSIONS, EXCLUSIONS_HI, NOTE_CSC, NOTE_CSC_HI, NOTE_DPG, NOTE_DPG_HI } from '@/lib/content'

export default function AboutPage() {
  const { lang, t } = useLanguage()
  const hi = lang === 'hi'
  return (
    <div className="page-wrap space-y-6 pb-16">
      <h1 className="text-[32px] font-bold">{t('about')}</h1>
      <GlassCard>
        <h2 className="mb-4 text-[22px] font-semibold">{t('aboutCpgrams')}</h2>
        <p className="text-base leading-relaxed">{hi ? ABOUT_CPGRAMS_HI : ABOUT_CPGRAMS}</p>
      </GlassCard>
      <GlassCard>
        <h2 className="mb-4 text-[22px] font-semibold">{t('aboutSahayak')}</h2>
        <p className="text-base leading-relaxed">{t('aboutSahayakBody')}</p>
      </GlassCard>
      <GlassCard>
        <h2 className="mb-4 text-[22px] font-semibold">{t('issuesNotTaken')}</h2>
        <ul className="space-y-2">
          {(hi ? EXCLUSIONS_HI : EXCLUSIONS).map((item) => (
            <li key={item} className="flex gap-3">
              <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-indigo" />
              {item}
            </li>
          ))}
        </ul>
        <p className="mt-6 text-sm text-slate">{hi ? NOTE_DPG_HI : NOTE_DPG}</p>
        <p className="mt-3 text-sm text-slate">{hi ? NOTE_CSC_HI : NOTE_CSC}</p>
      </GlassCard>
    </div>
  )
}
