'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { useAssistant } from '@/context/AssistantContext'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { api } from '@/lib/api'
import { isStaff } from '@/lib/roles'

export default function SignInPage() {
  const router = useRouter()
  const { setSession } = useAuth()
  const { t } = useLanguage()
  const { registerLoginGuide, takePendingLodge } = useAssistant()
  const [mode, setMode] = useState<'password' | 'otp'>('otp')
  const [mobile, setMobile] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)
  const mobileRef = useRef(mobile)
  const passwordRef = useRef(password)
  const otpRef = useRef(otp)
  mobileRef.current = mobile
  passwordRef.current = password
  otpRef.current = otp

  function afterLogin(role?: string) {
    if (isStaff({ role })) {
      router.push('/admin')
      return
    }
    router.push(takePendingLodge() || '/desk')
  }

  useEffect(() => {
    registerLoginGuide({
      setMode,
      setMobile,
      setOtp,
      setPassword,
      sendOtp: async () => {
        const res = await api.requestOtp(mobileRef.current)
        setSent(true)
        setInfo(res.message)
        return res.message
      },
      verifyOtp: async () => {
        const payload = await api.verifyOtp(mobileRef.current, otpRef.current)
        setSession(payload)
        afterLogin(payload.user.role)
        return `Signed in as ${payload.user.name}.`
      },
      signInPassword: async () => {
        const payload = await api.login({ mobile: mobileRef.current, password: passwordRef.current })
        setSession(payload)
        afterLogin(payload.user.role)
        return `Signed in as ${payload.user.name}.`
      },
    })
    return () => registerLoginGuide(null)
  }, [registerLoginGuide, takePendingLodge, setSession, router])

  async function onPassword(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const payload = await api.login({ mobile, password })
      setSession(payload)
      afterLogin(payload.user.role)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed')
    } finally {
      setBusy(false)
    }
  }

  async function requestOtp(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const res = await api.requestOtp(mobile)
      setInfo(res.message)
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send OTP')
    } finally {
      setBusy(false)
    }
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const payload = await api.verifyOtp(mobile, otp)
      setSession(payload)
      afterLogin(payload.user.role)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'OTP failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page-wrap pb-16">
      <GlassCard>
        <h1 className="text-[32px] font-bold">{t('signIn')}</h1>
        <p className="mt-2 text-sm text-slate">{t('signInLead')}</p>
        <div className="mt-5 inline-flex rounded-full bg-white/50 p-1">
          <button type="button" className={`rounded-full px-4 py-2 text-sm font-semibold ${mode === 'otp' ? 'bg-indigo text-white' : ''}`} onClick={() => setMode('otp')}>
            {t('mobileOtp')}
          </button>
          <button type="button" className={`rounded-full px-4 py-2 text-sm font-semibold ${mode === 'password' ? 'bg-indigo text-white' : ''}`} onClick={() => setMode('password')}>
            {t('password')}
          </button>
        </div>

        {error && <p className="mt-4 text-sm text-attention">{error}</p>}
        {info && <p className="mt-4 text-sm text-success">{info}</p>}

        {mode === 'password' ? (
          <form className="mt-6 space-y-4" onSubmit={onPassword}>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="label" htmlFor="mobile">{t('mobile')}</label>
                <input id="mobile" className="field" value={mobile} onChange={(e) => setMobile(e.target.value)} />
              </div>
              <div>
                <label className="label" htmlFor="password">{t('password')}</label>
                <input id="password" type="password" className="field" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
            </div>
            <button className="btn-primary" disabled={busy}>
              {t('signIn')}
            </button>
          </form>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={sent ? verify : requestOtp}>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="label" htmlFor="otp-mobile">{t('mobile')}</label>
                <input id="otp-mobile" className="field" value={mobile} onChange={(e) => setMobile(e.target.value)} />
              </div>
              {sent && (
                <div>
                  <label className="label" htmlFor="otp">{t('otp')}</label>
                  <input id="otp" className="field" value={otp} onChange={(e) => setOtp(e.target.value)} />
                </div>
              )}
            </div>
            <button className="btn-primary" disabled={busy}>
              {sent ? t('verifyOtp') : t('sendOtp')}
            </button>
          </form>
        )}

        <p className="mt-6 text-sm text-slate">
          {t('newHere')} <Link href="/auth/register">{t('register')}</Link>
        </p>
        <p className="mt-2 text-sm text-slate">
          {t('officerQ')} <Link href="/admin/signin">{t('openOfficerDesk')}</Link>
        </p>
      </GlassCard>
    </div>
  )
}
