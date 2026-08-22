'use client'

import { useState } from 'react'
import Link from 'next/link'
import { GlassCard } from '@/components/ui/GlassCard'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'

export default function ProfilePage() {
  const { user, setSession } = useAuth()
  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [error, setError] = useState('')
  const [done, setDone] = useState('')

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[32px] font-bold">Edit Profile</h1>
        <Link href="/desk" className="btn-secondary">
          Back to home page
        </Link>
      </div>
      <GlassCard>
        <p className="mb-4 text-sm text-attention">Fields marked with * are mandatory</p>
        {error && <p className="mb-3 text-sm text-attention">{error}</p>}
        {done && <p className="mb-3 text-sm text-success">{done}</p>}
        <form
          className="grid gap-4 md:grid-cols-2"
          onSubmit={async (e) => {
            e.preventDefault()
            setError('')
            try {
              const updated = await api.updateProfile({ name, email: email || undefined })
              const token = localStorage.getItem('sahayak_token')
              if (token) setSession({ access_token: token, token_type: 'bearer', user: updated })
              setDone('Profile saved.')
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Could not save')
            }
          }}
        >
          <div>
            <label className="label" htmlFor="name">Name *</label>
            <input id="name" className="field" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="mobile">Mobile</label>
            <input id="mobile" className="field" value={user?.mobile || ''} disabled />
          </div>
          <div className="md:col-span-2">
            <label className="label" htmlFor="email">E-mail address</label>
            <input id="email" type="email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <button className="btn-primary">Submit</button>
          </div>
        </form>
      </GlassCard>
    </div>
  )
}
