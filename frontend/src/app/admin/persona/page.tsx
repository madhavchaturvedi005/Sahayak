'use client'

import { useEffect, useState } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { useAuth } from '@/context/AuthContext'
import { api, type PersonaConfig } from '@/lib/api'
import { isAdmin } from '@/lib/roles'
import { formatDate } from '@/lib/utils'

export default function AdminPersonaPage() {
  const { user } = useAuth()
  const [config, setConfig] = useState<PersonaConfig | null>(null)
  const [name, setName] = useState('Sahayak')
  const [instructions, setInstructions] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!isAdmin(user)) return
    api
      .adminPersona()
      .then((row) => {
        setConfig(row)
        setName(row.display_name)
        setInstructions(row.instructions)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load persona'))
  }, [user])

  if (!isAdmin(user)) {
    return (
      <GlassCard>
        <p className="text-sm text-slate">Only the administrator can edit the Sahayak persona.</p>
      </GlassCard>
    )
  }

  async function save() {
    setBusy(true)
    setError('')
    setDone('')
    try {
      const saved = await api.adminSavePersona({ display_name: name, instructions })
      setConfig(saved)
      setName(saved.display_name)
      setInstructions(saved.instructions)
      setDone('Persona saved. Chat and voice will use this on the next reply.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save persona')
    } finally {
      setBusy(false)
    }
  }

  const editedBy = config?.updated_by_name && config.updated_at

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber">Sahayak</p>
        <h1 className="mt-1 text-[32px] font-bold">Persona config</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate">
          This is how the assistant talks — name, tone, and rules. Voice lodging tools stay in place even if you
          change the wording.
        </p>
      </div>

      <GlassCard hover={false}>
        {editedBy ? (
          <p className="rounded-card bg-indigo/8 px-4 py-3 text-sm text-indigo">
            Last edited by <span className="font-semibold">{config.updated_by_name}</span>
            {' · '}
            {formatDate(config.updated_at!)}
            {user?.id === config.updated_by_id ? ' · you' : ''}
          </p>
        ) : (
          <p className="rounded-card bg-indigo/5 px-4 py-3 text-sm text-slate">
            Not edited yet — using the default Sahayak persona. The first save will show who changed it.
          </p>
        )}

        {error && <p className="mt-4 text-sm text-attention">{error}</p>}
        {done && <p className="mt-4 text-sm text-success">{done}</p>}

        <div className="mt-6 space-y-4">
          <div>
            <label className="label" htmlFor="persona-name">
              Display name
            </label>
            <input
              id="persona-name"
              className="field max-w-md"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="persona-instructions">
              Instructions
            </label>
            <textarea
              id="persona-instructions"
              className="field min-h-[320px] font-mono text-sm leading-relaxed"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
            />
          </div>
          <button type="button" className="btn-primary" disabled={busy || name.trim().length < 2} onClick={save}>
            {busy ? 'Saving…' : 'Save persona'}
          </button>
        </div>
      </GlassCard>
    </div>
  )
}
