'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { useAuth } from '@/context/AuthContext'
import { api, type Grievance } from '@/lib/api'
import { formatDate } from '@/lib/utils'

export default function GrievanceDeskPage() {
  const { user } = useAuth()
  const [rows, setRows] = useState<Grievance[]>([])
  const [q, setQ] = useState('')

  useEffect(() => {
    api.listGrievances().then(setRows).catch(() => setRows([]))
  }, [])

  const filtered = rows.filter(
    (r) =>
      r.registration_id.toLowerCase().includes(q.toLowerCase()) ||
      r.subject.toLowerCase().includes(q.toLowerCase()) ||
      r.status.toLowerCase().includes(q.toLowerCase())
  )
  const stats = useMemo(() => {
    const pending = rows.filter((r) => !/clos|resolv/i.test(r.status)).length
    const closed = rows.length - pending
    return { total: rows.length, pending, closed }
  }, [rows])

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-slate">Welcome{user ? `, ${user.name}` : ''}</p>
        <h1 className="text-[32px] font-bold">Grievance Dashboard</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-panel bg-indigo p-6 text-white shadow-glass">
          <p className="text-sm text-white/70">Total grievances registered</p>
          <p className="mt-2 text-4xl font-bold">{stats.total}</p>
        </div>
        <div className="rounded-panel bg-amber p-6 text-white shadow-amber">
          <p className="text-sm text-white/80">Pending</p>
          <p className="mt-2 text-4xl font-bold">{stats.pending}</p>
        </div>
        <div className="rounded-panel bg-success p-6 text-white">
          <p className="text-sm text-white/80">Closed</p>
          <p className="mt-2 text-4xl font-bold">{stats.closed}</p>
        </div>
      </div>
      <GlassCard>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-[22px] font-semibold">List of grievances</h2>
          <input className="field max-w-xs" placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/40 text-slate">
                <th className="py-3 pr-3">Sn.</th>
                <th className="py-3 pr-3">Registration number</th>
                <th className="py-3 pr-3">Received</th>
                <th className="py-3 pr-3">Description</th>
                <th className="py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate">
                    No data available in table.
                  </td>
                </tr>
              ) : (
                filtered.map((row, i) => (
                  <tr key={row.id} className="border-b border-white/30">
                    <td className="py-3 pr-3">{i + 1}</td>
                    <td className="py-3 pr-3">
                      <Link href={`/status/${encodeURIComponent(row.registration_id)}`}>{row.registration_id}</Link>
                    </td>
                    <td className="py-3 pr-3">{formatDate(row.created_at)}</td>
                    <td className="py-3 pr-3">{row.subject}</td>
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
