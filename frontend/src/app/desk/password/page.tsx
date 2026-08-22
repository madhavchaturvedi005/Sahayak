'use client'

import { useState } from 'react'
import Link from 'next/link'
import { GlassCard } from '@/components/ui/GlassCard'
import { api } from '@/lib/api'

export default function PasswordPage() {
  const [oldPassword, setOld] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState('')

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[32px] font-bold">Change Account Password</h1>
        <Link href="/desk" className="btn-secondary">
          Back to home page
        </Link>
      </div>
      <GlassCard>
        <p className="mb-4 text-sm text-attention">Fields marked with * are mandatory</p>
        {error && <p className="mb-3 text-sm text-attention">{error}</p>}
        {done && <p className="mb-3 text-sm text-success">{done}</p>}
        <form
          className="grid max-w-xl gap-4"
          onSubmit={async (e) => {
            e.preventDefault()
            setError('')
            if (next !== confirm) {
              setError('New password and confirm password must match.')
              return
            }
            try {
              await api.changePassword(oldPassword, next)
              setDone('Password updated.')
              setOld('')
              setNext('')
              setConfirm('')
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Could not update password')
            }
          }}
        >
          <div>
            <label className="label" htmlFor="old">Old password *</label>
            <input id="old" type="password" className="field" required value={oldPassword} onChange={(e) => setOld(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="new">New password *</label>
            <input id="new" type="password" className="field" required minLength={6} value={next} onChange={(e) => setNext(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="confirm">Confirm password *</label>
            <input id="confirm" type="password" className="field" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </div>
          <button className="btn-primary">Submit</button>
        </form>
      </GlassCard>
    </div>
  )
}
