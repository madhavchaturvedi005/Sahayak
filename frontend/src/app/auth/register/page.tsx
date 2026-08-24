'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { api } from '@/lib/api'

export default function RegisterPage() {
  const router = useRouter()
  const { setSession } = useAuth()
  const { t } = useLanguage()
  const [form, setForm] = useState({ name: '', mobile: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const payload = await api.register(form)
      setSession(payload)
      router.push('/desk')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page-wrap pb-16">
      <GlassCard>
        <h1 className="text-[32px] font-bold">{t('registerTitle')}</h1>
        <p className="mt-2 text-sm text-slate">{t('registerLead')}</p>
        {error && <p className="mt-4 text-sm text-attention">{error}</p>}
        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="label" htmlFor="name">{t('fullName')}</label>
              <input id="name" className="field" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="label" htmlFor="mobile">{t('mobile')}</label>
              <input id="mobile" className="field" required minLength={10} value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
            </div>
            <div>
              <label className="label" htmlFor="email">{t('emailOptional')}</label>
              <input id="email" type="email" className="field" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="label" htmlFor="password">{t('password')}</label>
              <input id="password" type="password" className="field" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
          </div>
          <button className="btn-primary" disabled={busy}>
            {t('createAccount')}
          </button>
        </form>
        <p className="mt-6 text-sm text-slate">
          {t('alreadyRegistered')} <Link href="/auth/signin">{t('signIn')}</Link>
        </p>
      </GlassCard>
    </div>
  )
}
