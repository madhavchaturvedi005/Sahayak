'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { ADMIN_STATUSES, api, type Grievance } from '@/lib/api'
import { formatDate } from '@/lib/utils'

export default function AdminGrievancePage() {
  const params = useParams<{ id: string }>()
  const registrationId = decodeURIComponent(params.id || '')
  const [row, setRow] = useState<Grievance | null>(null)
  const [status, setStatus] = useState('Under Process')
  const [title, setTitle] = useState('')
  const [detail, setDetail] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!registrationId) return
    api
      .adminGrievance(registrationId)
      .then((item) => {
        setRow(item)
        setStatus(item.status)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Not found'))
  }, [registrationId])

  async function onAction(e: React.FormEvent) {
    e.preventDefault()
    if (!row) return
    setBusy(true)
    setError('')
    setInfo('')
    try {
      const updated = await api.adminAction(row.registration_id, { status, title, detail })
      setRow(updated)
      setTitle('')
      setDetail('')
      setInfo(`Status is now ${updated.status}. The citizen can see this on the status page.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update')
    } finally {
      setBusy(false)
    }
  }

  if (!row) {
    return (
      <GlassCard>
        <p className="text-sm text-slate">{error || 'Loading…'}</p>
        <Link href="/admin/grievances" className="mt-4 inline-block text-sm font-semibold">
          Back to grievances
        </Link>
      </GlassCard>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/grievances" className="text-sm font-semibold">
          All grievances
        </Link>
        <h1 className="mt-2 text-[28px] font-bold">{row.registration_id}</h1>
        <p className="mt-1 text-sm text-slate">
          {row.name} · {row.mobile} · received {formatDate(row.created_at)}
        </p>
        <p className="mt-2 text-sm font-medium text-indigo">
          {row.escalation_label || 'Field officer'}
          {row.assigned_name ? ` · ${row.assigned_name}` : ''}
          {row.sla_overdue ? ' · 21-day window missed' : ''}
        </p>
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <GlassCard>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate">{row.ministry}</p>
          <h2 className="mt-1 text-[22px] font-semibold">{row.subject}</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ink">{row.description}</p>
          {row.village || row.district ? (
            <p className="mt-4 text-sm text-slate">
              {[row.street, row.village, row.ward, row.district].filter(Boolean).join(', ')}
            </p>
          ) : null}
          <div className="mt-6 space-y-4 border-t border-white/40 pt-5">
            <h3 className="text-base font-semibold">Action history</h3>
            {row.events.length === 0 ? (
              <p className="text-sm text-slate">No events yet.</p>
            ) : (
              row.events.map((event) => (
                <div key={event.id} className="rounded-xl bg-white/50 p-4">
                  <p className="text-sm font-semibold text-indigo">{event.title}</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-slate">{event.detail}</p>
                  <p className="mt-2 text-xs text-slate">{formatDate(event.created_at)}</p>
                </div>
              ))
            )}
          </div>
        </GlassCard>
        <GlassCard>
          <h2 className="text-[22px] font-semibold">Take action</h2>
          <p className="mt-1 text-sm text-slate">Current status: {row.status}</p>
          {error && <p className="mt-3 text-sm text-attention">{error}</p>}
          {info && <p className="mt-3 text-sm text-success">{info}</p>}
          <form className="mt-5 space-y-4" onSubmit={onAction}>
            <div>
              <label className="label" htmlFor="status">
                New status
              </label>
              <select id="status" className="field" value={status} onChange={(e) => setStatus(e.target.value)}>
                {ADMIN_STATUSES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="title">
                Event title (optional)
              </label>
              <input id="title" className="field" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="detail">
                Officer remark
              </label>
              <textarea
                id="detail"
                className="field min-h-32"
                required
                minLength={8}
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                placeholder="What action was taken, and what should the citizen know?"
              />
            </div>
            <button className="btn-primary w-full" disabled={busy}>
              Save action
            </button>
          </form>
          {(row.escalation_level || 1) < 3 ? (
            <button
              type="button"
              className="btn-secondary mt-3 w-full"
              disabled={busy}
              onClick={async () => {
                setBusy(true)
                setError('')
                setInfo('')
                try {
                  const updated = await api.adminEscalate(row.registration_id)
                  setRow(updated)
                  setStatus(updated.status)
                  setInfo(`Moved to ${updated.escalation_label}. Now with ${updated.assigned_name || 'the next desk'}.`)
                } catch (err) {
                  setError(err instanceof Error ? err.message : 'Could not escalate')
                } finally {
                  setBusy(false)
                }
              }}
            >
              Escalate to next desk
            </button>
          ) : null}
          <Link
            href={`/status/${encodeURIComponent(row.registration_id)}`}
            className="mt-4 inline-block text-sm font-semibold"
          >
            View citizen status page
          </Link>
        </GlassCard>
      </div>
    </div>
  )
}
