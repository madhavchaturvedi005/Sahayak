'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { useAuth } from '@/context/AuthContext'
import { api, type AdminOverview, type Grievance } from '@/lib/api'
import { formatDate } from '@/lib/utils'

export default function AdminDashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<AdminOverview | null>(null)
  const [rows, setRows] = useState<Grievance[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    function load() {
      api.adminOverview().then(setStats).catch((err) => setError(err instanceof Error ? err.message : 'Could not load overview'))
      api.adminGrievances().then((list) => setRows(list.slice(0, 8))).catch(() => setRows([]))
    }
    load()
    const timer = setInterval(load, 30_000)
    return () => clearInterval(timer)
  }, [])

  const cards = [
    { label: 'Registered', value: stats?.registered ?? '—', href: '/admin/grievances', tone: 'bg-indigo text-white' },
    { label: 'Open', value: stats?.open ?? '—', href: '/admin/grievances', tone: 'bg-amber text-white' },
    { label: 'Under process', value: stats?.under_process ?? '—', href: '/admin/grievances?status=Under%20Process', tone: 'bg-indigo text-white' },
    { label: 'Delayed', value: stats?.delayed ?? '—', href: '/admin/grievances', tone: 'bg-attention text-white' },
    { label: 'Resolved', value: stats?.resolved ?? '—', href: '/admin/grievances?status=Resolved', tone: 'bg-success text-white' },
    { label: 'Appeals', value: stats?.appealed ?? '—', href: '/admin/appeals', tone: 'bg-indigo text-white' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-slate">Officer desk{user ? ` · ${user.name}` : ''}</p>
        <h1 className="text-[32px] font-bold">Administration</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate">
          Take action on grievances registered on this portal. Status changes appear on the citizen status page.
        </p>
      </div>
      {error && <p className="text-sm text-attention">{error}</p>}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <Link key={card.label} href={card.href} className={`rounded-panel p-6 shadow-glass ${card.tone}`}>
            <p className="text-sm text-white/75">{card.label}</p>
            <p className="mt-2 text-4xl font-bold">{card.value}</p>
          </Link>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-panel bg-white/70 p-6 shadow-glass">
          <p className="text-sm text-slate">Citizens</p>
          <p className="mt-1 text-3xl font-bold text-indigo">{stats?.citizens ?? '—'}</p>
        </div>
        <div className="rounded-panel bg-white/70 p-6 shadow-glass">
          <p className="text-sm text-slate">Officers</p>
          <p className="mt-1 text-3xl font-bold text-indigo">{stats?.officers ?? '—'}</p>
        </div>
      </div>
      <GlassCard>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-[22px] font-semibold">Latest registrations</h2>
          <Link href="/admin/grievances" className="text-sm font-semibold">
            View all
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/40 text-slate">
                <th className="py-3 pr-3">Registration</th>
                <th className="py-3 pr-3">Citizen</th>
                <th className="py-3 pr-3">Ministry</th>
                <th className="py-3 pr-3">Received</th>
                <th className="py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate">
                    No grievances yet.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="border-b border-white/30">
                    <td className="py-3 pr-3">
                      <Link href={`/admin/grievances/${row.registration_id}`}>{row.registration_id}</Link>
                    </td>
                    <td className="py-3 pr-3">{row.name}</td>
                    <td className="py-3 pr-3">{row.ministry}</td>
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
