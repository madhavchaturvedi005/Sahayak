'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'

export default function RegisterPage() {
  const router = useRouter()
  const { setSession } = useAuth()
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
        <h1 className="text-[32px] font-bold">Register</h1>
        <p className="mt-2 text-sm text-slate">Create a Sahayak account. This is not an official CPGRAMS login.</p>
        {error && <p className="mt-4 text-sm text-attention">{error}</p>}
        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="label" htmlFor="name">Full name</label>
              <input id="name" className="field" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="label" htmlFor="mobile">Mobile</label>
              <input id="mobile" className="field" required minLength={10} value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
            </div>
            <div>
              <label className="label" htmlFor="email">Email (optional)</label>
              <input id="email" type="email" className="field" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="label" htmlFor="password">Password</label>
              <input id="password" type="password" className="field" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
          </div>
          <button className="btn-primary" disabled={busy}>
            Create account
          </button>
        </form>
        <p className="mt-6 text-sm text-slate">
          Already registered? <Link href="/auth/signin">Sign in</Link>
        </p>
      </GlassCard>
    </div>
  )
}
