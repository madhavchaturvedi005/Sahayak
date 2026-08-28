'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, MapPin, ShieldCheck } from 'lucide-react'
import { useAssistant } from '@/context/AssistantContext'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { api } from '@/lib/api'
import { safeNext } from '@/lib/auth-next'
import { homeForUser, isStaff } from '@/lib/roles'
import { saveVoiceMemory, loadVoiceMemory } from '@/lib/voice-memory'

export function CitizenAuthScreen({ startOnSignup = false }: { startOnSignup?: boolean }) {
  const router = useRouter()
  const search = useSearchParams()
  const { user, ready, setSession } = useAuth()
  const { t } = useLanguage()
  const { registerLoginGuide, takePendingLodge, peekPendingLodge } = useAssistant()
  const next = safeNext(search.get('next'))
  const [panel, setPanel] = useState<'signin' | 'signup'>(startOnSignup || search.get('signup') === '1' ? 'signup' : 'signin')
  const [mode, setMode] = useState<'password' | 'otp'>('otp')
  const [mobile, setMobile] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)
  const [registerForm, setRegisterForm] = useState({ name: '', mobile: '', email: '', password: '' })
  const mobileRef = useRef(mobile)
  const passwordRef = useRef(password)
  const otpRef = useRef(otp)
  const signedInNowRef = useRef(false)
  const [fromSahayak, setFromSahayak] = useState(false)
  mobileRef.current = mobile
  passwordRef.current = password
  otpRef.current = otp

  function afterAuth(role?: string) {
    signedInNowRef.current = true
    const pending = takePendingLodge()
    if (loadVoiceMemory().resumeAfterAuth || pending) {
      saveVoiceMemory({ justSignedIn: true, resumeAfterAuth: true })
    }
    const dest = pending || next
    if (dest) {
      router.push(dest)
      return
    }
    router.push(isStaff({ role }) ? homeForUser({ role }) : '/desk')
  }

  useEffect(() => {
    const mem = loadVoiceMemory()
    setFromSahayak(Boolean(mem.resumeAfterAuth || peekPendingLodge()))
  }, [peekPendingLodge])

  useEffect(() => {
    if (!ready || !user || signedInNowRef.current) return
    const pending = peekPendingLodge()
    router.replace(next || pending || homeForUser(user))
  }, [ready, user, next, peekPendingLodge, router])

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
        afterAuth(payload.user.role)
        return `Signed in as ${payload.user.name}.`
      },
      signInPassword: async () => {
        const payload = await api.login({ mobile: mobileRef.current, password: passwordRef.current })
        setSession(payload)
        afterAuth(payload.user.role)
        return `Signed in as ${payload.user.name}.`
      },
    })
    return () => registerLoginGuide(null)
  }, [registerLoginGuide, takePendingLodge, setSession, router, next])

  async function onPassword(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const payload = await api.login({ mobile, password })
      setSession(payload)
      afterAuth(payload.user.role)
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
      afterAuth(payload.user.role)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'OTP failed')
    } finally {
      setBusy(false)
    }
  }

  async function onRegister(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const payload = await api.register(registerForm)
      setSession(payload)
      afterAuth(payload.user.role)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setBusy(false)
    }
  }

  const intent = next.includes('/nearby')
    ? t('authIntentNearby')
    : next.includes('/grievance/lodge')
      ? t('authIntentLodge')
      : t('authIntentGeneric')

  return (
    <div className="page-wrap pb-16">
      <div className="mx-auto max-w-lg overflow-hidden rounded-panel bg-white shadow-glass lg:mx-0 lg:max-w-none lg:grid lg:grid-cols-2">
        <aside className="relative hidden bg-gradient-to-br from-indigo-soft via-indigo to-indigo-deep px-10 py-12 text-white lg:block">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber">{t('authBrandKicker')}</p>
          <h1 className="mt-3 text-[28px] font-bold leading-tight text-white md:text-[32px]">{t('authWhyTitle')}</h1>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-white/85">{t('authWhyBody')}</p>
          <p className="mt-5 rounded-xl bg-white/10 px-4 py-3 text-sm font-medium text-amber-glow ring-1 ring-white/15">
            {intent}
          </p>
          <ul className="mt-8 space-y-4">
            <InfoPoint icon={ShieldCheck} text={t('authInfoTrack')} />
            <InfoPoint icon={MapPin} text={t('authInfoRaise')} />
            <InfoPoint icon={CheckCircle2} text={t('authInfoName')} />
          </ul>
          <p className="mt-10 text-xs leading-relaxed text-white/60">{t('authWhyFoot')}</p>
        </aside>

        <div className="px-5 py-6 sm:px-6 md:px-10 md:py-12">
          {fromSahayak && (
            <div className="mb-5 flex items-start gap-3 rounded-2xl border border-indigo/15 bg-indigo/5 px-4 py-3">
              <img src="/avatar.png" alt="" className="h-10 w-10 shrink-0 rounded-full object-cover object-top" />
              <div>
                <p className="text-sm font-semibold text-indigo">{t('authSahayakTitle')}</p>
                <p className="mt-0.5 text-sm leading-relaxed text-slate">{t('authSahayakBody')}</p>
              </div>
            </div>
          )}
          <div className="inline-flex w-full rounded-full bg-indigo/8 p-1 sm:w-auto">
            <button
              type="button"
              className={`flex-1 rounded-full px-4 py-2.5 text-sm font-semibold sm:flex-none sm:py-2 ${panel === 'signin' ? 'bg-indigo text-white' : 'text-indigo'}`}
              onClick={() => {
                setPanel('signin')
                setError('')
              }}
            >
              {t('signIn')}
            </button>
            <button
              type="button"
              className={`flex-1 rounded-full px-4 py-2.5 text-sm font-semibold sm:flex-none sm:py-2 ${panel === 'signup' ? 'bg-indigo text-white' : 'text-indigo'}`}
              onClick={() => {
                setPanel('signup')
                setError('')
              }}
            >
              {t('signUp')}
            </button>
          </div>

          {panel === 'signin' ? (
            <div>
              <h2 className="mt-6 text-2xl font-bold">{t('signIn')}</h2>
              <p className="mt-2 text-sm text-slate">{t('signInLead')}</p>
              <div className="mt-5 inline-flex rounded-full bg-white/50 p-1 ring-1 ring-line">
                <button
                  type="button"
                  className={`rounded-full px-4 py-2 text-sm font-semibold ${mode === 'otp' ? 'bg-indigo text-white' : ''}`}
                  onClick={() => setMode('otp')}
                >
                  {t('mobileOtp')}
                </button>
                <button
                  type="button"
                  className={`rounded-full px-4 py-2 text-sm font-semibold ${mode === 'password' ? 'bg-indigo text-white' : ''}`}
                  onClick={() => setMode('password')}
                >
                  {t('password')}
                </button>
              </div>

              {error && <p className="mt-4 text-sm text-attention">{error}</p>}
              {info && <p className="mt-4 text-sm text-success">{info}</p>}

              {mode === 'password' ? (
                <form className="mt-6 space-y-4" onSubmit={onPassword}>
                  <div>
                    <label className="label" htmlFor="mobile">
                      {t('mobile')}
                    </label>
                    <input id="mobile" className="field" value={mobile} onChange={(e) => setMobile(e.target.value)} />
                  </div>
                  <div>
                    <label className="label" htmlFor="password">
                      {t('password')}
                    </label>
                    <input
                      id="password"
                      type="password"
                      className="field"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  <button className="btn-primary w-full" disabled={busy}>
                    {t('signIn')}
                  </button>
                </form>
              ) : (
                <form className="mt-6 space-y-4" onSubmit={sent ? verify : requestOtp}>
                  <div>
                    <label className="label" htmlFor="otp-mobile">
                      {t('mobile')}
                    </label>
                    <input id="otp-mobile" className="field" value={mobile} onChange={(e) => setMobile(e.target.value)} />
                  </div>
                  {sent && (
                    <div>
                      <label className="label" htmlFor="otp">
                        {t('otp')}
                      </label>
                      <input id="otp" className="field" value={otp} onChange={(e) => setOtp(e.target.value)} />
                    </div>
                  )}
                  <button className="btn-primary w-full" disabled={busy}>
                    {sent ? t('verifyOtp') : t('sendOtp')}
                  </button>
                </form>
              )}

              <p className="mt-6 text-sm text-slate">
                {t('newHere')}{' '}
                <button type="button" className="font-semibold text-indigo" onClick={() => { setPanel('signup'); setError('') }}>
                  {t('register')}
                </button>
              </p>
              <p className="mt-2 text-sm text-slate">
                {t('officerQ')} <Link href="/admin/signin">{t('openOfficerDesk')}</Link>
              </p>
            </div>
          ) : (
            <RegisterPanel
              form={registerForm}
              setForm={setRegisterForm}
              error={error}
              busy={busy}
              onSubmit={onRegister}
              onClose={() => { setPanel('signin'); setError('') }}
            />
          )}
        </div>
      </div>
    </div>
  )
}

function RegisterPanel({
  form,
  setForm,
  error,
  busy,
  onSubmit,
  onClose,
}: {
  form: { name: string; mobile: string; email: string; password: string }
  setForm: (next: { name: string; mobile: string; email: string; password: string }) => void
  error: string
  busy: boolean
  onSubmit: (e: React.FormEvent) => void
  onClose: () => void
}) {
  const { t } = useLanguage()
  return (
    <>
      <h2 className="mt-6 text-2xl font-bold">{t('registerTitle')}</h2>
      <p className="mt-2 text-sm text-slate">{t('registerLead')}</p>
      {error && <p className="mt-4 text-sm text-attention">{error}</p>}
      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <div>
          <label className="label" htmlFor="reg-name">
            {t('fullName')}
          </label>
          <input
            id="reg-name"
            className="field"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div>
          <label className="label" htmlFor="reg-mobile">
            {t('mobile')}
          </label>
          <input
            id="reg-mobile"
            className="field"
            required
            minLength={10}
            value={form.mobile}
            onChange={(e) => setForm({ ...form, mobile: e.target.value })}
          />
        </div>
        <div>
          <label className="label" htmlFor="reg-email">
            {t('emailOptional')}
          </label>
          <input
            id="reg-email"
            type="email"
            className="field"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>
        <div>
          <label className="label" htmlFor="reg-password">
            {t('password')}
          </label>
          <input
            id="reg-password"
            type="password"
            className="field"
            required
            minLength={6}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </div>
        <button className="btn-primary w-full" disabled={busy}>
          {t('createAccount')}
        </button>
      </form>
      <p className="mt-6 text-sm text-slate">
        {t('alreadyRegistered')}{' '}
        <button type="button" className="font-semibold text-indigo" onClick={onClose}>
          {t('signIn')}
        </button>
      </p>
    </>
  )
}

function InfoPoint({ icon: Icon, text }: { icon: typeof ShieldCheck; text: string }) {
  return (
    <li className="flex items-start gap-3 text-sm leading-relaxed text-white/90">
      <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-amber/20 text-amber-glow">
        <Icon className="h-4 w-4" />
      </span>
      {text}
    </li>
  )
}
