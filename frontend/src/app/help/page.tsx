'use client'

import { useState } from 'react'
import Link from 'next/link'
import { GlassCard } from '@/components/ui/GlassCard'
import { useLanguage } from '@/context/LanguageContext'
import { FAQS } from '@/lib/content'
import { api } from '@/lib/api'

export default function HelpPage() {
  const { lang, t } = useLanguage()
  const hi = lang === 'hi'
  const [complaint, setComplaint] = useState('')
  const [reply, setReply] = useState('')
  const [result, setResult] = useState<{
    addressed: boolean
    reason: string
    appeal_draft: string
    missing?: string[]
  } | null>(null)
  const [error, setError] = useState('')

  return (
    <div className="page-wrap space-y-8 pb-16">
      <div className="text-center">
        <h1 className="text-[32px] font-bold md:text-5xl">{t('helpToday')}</h1>
        <p className="mx-auto mt-3 max-w-2xl text-slate">{t('helpLead')}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <GlassCard>
          <h2 className="text-xl font-semibold">{t('registrationLogin')}</h2>
          <p className="mt-2 text-sm text-slate">{t('registrationLoginBody')}</p>
          <Link href="/auth/signin" className="mt-4 inline-flex text-sm font-semibold">
            {t('openSignIn')}
          </Link>
        </GlassCard>
        <GlassCard className="md:col-span-2">
          <h2 className="text-xl font-semibold">{t('lodgingAGrievance')}</h2>
          <p className="mt-2 text-sm text-slate">{t('lodgingBody')}</p>
          <div className="mt-4 flex gap-3">
            <Link href="/grievance/lodge" className="btn-secondary">{t('public')}</Link>
            <Link href="/grievance/lodge-pension" className="btn-secondary">{t('pension')}</Link>
          </div>
        </GlassCard>
        <GlassCard>
          <h2 className="text-xl font-semibold">{t('trackingStatus')}</h2>
          <p className="mt-2 text-sm text-slate">{t('trackingBody')}</p>
          <Link href="/status" className="mt-4 inline-flex text-sm font-semibold">
            {t('viewStatus')}
          </Link>
        </GlassCard>
        <GlassCard>
          <h2 className="text-xl font-semibold">{t('redressalTime')}</h2>
          <p className="mt-2 text-sm text-slate">{t('redressalTimeBody')}</p>
        </GlassCard>
        <GlassCard>
          <h2 className="text-xl font-semibold">{t('appealProcess')}</h2>
          <p className="mt-2 text-sm text-slate">{t('appealProcessBody')}</p>
          <Link href="/appeal/authority" className="mt-4 inline-flex text-sm font-semibold">
            {t('nodalAuthority')}
          </Link>
        </GlassCard>
      </div>

      <GlassCard>
        <h2 className="mb-4 text-[22px] font-semibold">{t('faqs')}</h2>
        <dl className="space-y-5">
          {FAQS.map((item) => (
            <div key={item.q}>
              <dt className="font-semibold">{hi ? item.qHi : item.q}</dt>
              <dd className="mt-1 text-sm leading-relaxed text-slate">{hi ? item.aHi : item.a}</dd>
            </div>
          ))}
        </dl>
      </GlassCard>

      <GlassCard>
        <h2 id="resolution" className="text-[22px] font-semibold">
          {t('resolutionCheck')}
        </h2>
        <p className="mt-2 text-sm text-slate">{t('resolutionCheckLead')}</p>
        {error && <p className="mt-3 text-sm text-attention">{error}</p>}
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label className="label" htmlFor="complaint">{t('originalComplaint')}</label>
            <textarea id="complaint" className="field min-h-40" value={complaint} onChange={(e) => setComplaint(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="reply">{t('departmentReply')}</label>
            <textarea id="reply" className="field min-h-40" value={reply} onChange={(e) => setReply(e.target.value)} />
          </div>
        </div>
        <button
          type="button"
          className="btn-primary mt-4"
          onClick={async () => {
            setError('')
            try {
              setResult(await api.resolutionCheck(complaint, reply))
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Check failed')
            }
          }}
        >
          {t('checkReply')}
        </button>
        {result && (
          <div className="mt-6 rounded-card bg-white/70 p-4">
            <p className="font-semibold">{result.addressed ? t('looksReal') : t('brushOff')}</p>
            <p className="mt-2 text-sm text-slate">{result.reason}</p>
            {result.missing && result.missing.length > 0 && !result.addressed && (
              <ul className="mt-3 space-y-1 text-sm text-slate">
                {result.missing.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
            {result.appeal_draft && (
              <>
                <pre className="mt-4 whitespace-pre-wrap text-sm">{result.appeal_draft}</pre>
                <button type="button" className="btn-secondary mt-3" onClick={() => navigator.clipboard.writeText(result.appeal_draft)}>
                  {t('copyAppealDraft')}
                </button>
              </>
            )}
          </div>
        )}
      </GlassCard>
    </div>
  )
}
