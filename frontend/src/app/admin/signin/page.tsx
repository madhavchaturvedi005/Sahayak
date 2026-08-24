'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { api } from '@/lib/api'
import { isStaff } from '@/lib/roles'

export default function AdminSignInPage() {
  const router = useRouter()
  const { setSession } = useAuth()
  const { t } = useLanguage()
  const [mobile, setMobile] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const payload = await api.login({ mobile, password })
      if (!isStaff(payload.user)) {
        setError(t('officerOnly'))
        return
      }
      setSession(payload)
      router.push('/admin')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page-wrap pb-16">
      <GlassCard className="mx-auto max-w-xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-amber">{t('officerDesk')}</p>
        <h1 className="mt-1 text-[32px] font-bold">{t('officerSignIn')}</h1>
        <p className="mt-2 text-sm text-slate">{t('officerSignInLead')}</p>
        {error && <p className="mt-4 text-sm text-attention">{error}</p>}
        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="label" htmlFor="admin-mobile">
              {t('mobile')}
            </label>
            <input
              id="admin-mobile"
              className="field"
              inputMode="numeric"
              autoComplete="username"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="admin-password">
              {t('password')}
            </label>
            <input
              id="admin-password"
              type="password"
              className="field"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button className="btn-primary" disabled={busy}>
            {t('openOfficerDesk')}
          </button>
        </form>
        <p className="mt-6 text-sm text-slate">
          {t('citizenQ')} <Link href="/auth/signin">{t('signInHere')}</Link>
        </p>
      </GlassCard>
    </div>
  )
}
