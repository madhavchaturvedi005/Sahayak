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
  const [busy, setBusy] = useState(false)

  const canSubmit = id.trim().length > 0 && message.trim().length > 0

  return (
    <div className="space-y-6">
      <GlassCard>
        <h1 className="text-[32px] font-bold">Reminder / Clarification</h1>
        <p className="mt-2 text-sm text-slate">Send a reminder or clarification against an existing registration number.</p>
        {error && <p className="mt-3 text-sm text-attention">{error}</p>}
        {done && <p className="mt-3 text-sm text-success">{done}</p>}
        <form
          className="mt-6 space-y-4"
          onSubmit={async (e) => {
            e.preventDefault()
            const trimmedId = id.trim()
            const trimmedMsg = message.trim()
            if (!trimmedId || !trimmedMsg) {
              setError('Please enter both a registration number and a message.')
              return
            }
            setError('')
            setBusy(true)
            try {
              const row = await api.reminder(trimmedId, trimmedMsg)
              setDone(`Reminder recorded for ${row.registration_id}. Count: ${row.reminder_count}.`)
              setMessage('')
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Failed')
            } finally {
              setBusy(false)
            }
          }}
        >
          <div>
            <label className="label" htmlFor="id">Registration number</label>
            <input id="id" className="field" value={id} onChange={(e) => setId(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="msg">Clarification</label>
            <textarea
              id="msg"
              className="field min-h-32"
              placeholder="Describe what is still unresolved or what additional information you are providing."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
          <button className="btn-primary" disabled={!canSubmit || busy}>
            {busy ? 'Sending…' : 'Send reminder'}
          </button>
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
