'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { ADMIN_STATUSES, api, type Grievance } from '@/lib/api'
import { formatDate } from '@/lib/utils'

function GrievancesTable() {
  const searchParams = useSearchParams()
  const initialStatus = searchParams.get('status') || ''
  const [status, setStatus] = useState(initialStatus)
  const [q, setQ] = useState('')
  const [rows, setRows] = useState<Grievance[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    setStatus(initialStatus)
  }, [initialStatus])

  useEffect(() => {
    api
      .adminGrievances({ status: status || undefined, q: q || undefined })
      .then(setRows)
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load grievances'))
  }, [status, q])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[32px] font-bold">All grievances</h1>
        <p className="mt-1 text-sm text-slate">Search by registration number, subject, citizen, or ministry.</p>
      </div>
      <GlassCard>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <input className="field max-w-xs" placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} />
          <select className="field max-w-[220px]" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            {ADMIN_STATUSES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
        {error && <p className="mb-4 text-sm text-attention">{error}</p>}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/40 text-slate">
                <th className="py-3 pr-3">Registration</th>
                <th className="py-3 pr-3">Citizen</th>
                <th className="py-3 pr-3">Subject</th>
                <th className="py-3 pr-3">Desk</th>
                <th className="py-3 pr-3">Community</th>
                <th className="py-3 pr-3">Received</th>
                <th className="py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate">
                    No grievances match these filters.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="border-b border-white/30">
                    <td className="py-3 pr-3">
                      <Link href={`/admin/grievances/${encodeURIComponent(row.registration_id)}`}>{row.registration_id}</Link>
                    </td>
                    <td className="py-3 pr-3">{row.name}</td>
                    <td className="py-3 pr-3">{row.subject}</td>
                    <td className="py-3 pr-3">
                      <p>{row.escalation_label || 'Field officer'}</p>
                      <p className="text-xs text-slate">{row.assigned_name || '—'}</p>
                    </td>
                    <td className="py-3 pr-3 text-xs">
                      <p>Backed {row.backer_count || 0}</p>
                      <p>Push {row.push_count || 0}</p>
                      {(row.pending_raise_count || 0) > 0 ? <p className="text-amber">Pending {row.pending_raise_count}</p> : null}
                      {row.priority_crossed ? <p className="font-semibold text-attention">Priority</p> : null}
                    </td>
                    <td className="py-3 pr-3">{formatDate(row.created_at)}</td>
                    <td className="py-3">{row.status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  )
}

export default function AdminGrievancesPage() {
  return (
    <Suspense fallback={<div className="h-40 animate-shimmer rounded-panel bg-[linear-gradient(90deg,#e8ebf2,#f7f8fa,#e8ebf2)] bg-[length:200%_100%]" />}>
      <GrievancesTable />
    </Suspense>
  )
}
