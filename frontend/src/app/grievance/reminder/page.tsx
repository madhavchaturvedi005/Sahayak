'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { GlassCard } from '@/components/ui/GlassCard'
import { api } from '@/lib/api'

function ReminderForm() {
  const params = useSearchParams()
  const [id, setId] = useState(params.get('id') || '')
  const [message, setMessage] = useState('')
  const [done, setDone] = useState('')
  const [error, setError] = useState('')

  return (
    <div className="space-y-6">
      <GlassCard>
        <h1 className="text-[32px] font-bold">Reminder Clarification</h1>
        <p className="mt-2 text-sm text-slate">Send a reminder or clarification against an existing registration number.</p>
        {error && <p className="mt-3 text-sm text-attention">{error}</p>}
        {done && <p className="mt-3 text-sm text-success">{done}</p>}
        <form
          className="mt-6 space-y-4"
          onSubmit={async (e) => {
            e.preventDefault()
            setError('')
            try {
              const row = await api.reminder(id, message)
              setDone(`Reminder recorded for ${row.registration_id}. Count: ${row.reminder_count}.`)
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Failed')
            }
          }}
        >
          <div>
            <label className="label" htmlFor="id">Registration number</label>
            <input id="id" className="field" value={id} onChange={(e) => setId(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="msg">Clarification</label>
            <textarea id="msg" className="field min-h-32" value={message} onChange={(e) => setMessage(e.target.value)} />
          </div>
          <button className="btn-primary">Send reminder</button>
        </form>
      </GlassCard>
    </div>
  )
}

export default function ReminderPage() {
  return (
    <Suspense>
      <ReminderForm />
    </Suspense>
  )
}
