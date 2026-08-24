'use client'

import { useEffect, useState } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { useAuth } from '@/context/AuthContext'
import { api, type AdminConfig } from '@/lib/api'
import { isAdmin } from '@/lib/roles'

export default function AdminConfigPage() {
  const { user } = useAuth()
  const [config, setConfig] = useState<AdminConfig | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isAdmin(user)) return
    api
      .adminConfig()
      .then(setConfig)
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load config'))
  }, [user])

  if (!isAdmin(user)) {
    return (
      <GlassCard>
        <p className="text-sm text-slate">Only the administrator can view this config.</p>
      </GlassCard>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[32px] font-bold">Admin config</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate">
          These values come from the server environment. Change <code>ADMIN_NAME</code>, <code>ADMIN_MOBILE</code>,{' '}
          <code>ADMIN_EMAIL</code>, and <code>ADMIN_PASSWORD</code> in <code>.env</code>, then restart the backend. The
          seeded administrator is updated on start. Passwords are never shown here.
        </p>
      </div>
      <GlassCard>
        {error && <p className="mb-4 text-sm text-attention">{error}</p>}
        <dl className="grid gap-4 md:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate">Administrator name</dt>
            <dd className="mt-1 text-base font-semibold text-indigo">{config?.admin_name || '—'}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate">Mobile</dt>
            <dd className="mt-1 text-base font-semibold text-indigo">{config?.admin_mobile || '—'}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate">Email</dt>
            <dd className="mt-1 text-base font-semibold text-indigo">{config?.admin_email || '—'}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-slate">Environment</dt>
            <dd className="mt-1 text-base font-semibold text-indigo">{config?.environment || '—'}</dd>
          </div>
        </dl>
      </GlassCard>
    </div>
  )
}
