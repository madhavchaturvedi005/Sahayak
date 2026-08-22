'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { GlassCard } from '@/components/ui/GlassCard'
import { api } from '@/lib/api'
import { formatDate } from '@/lib/utils'

export default function ActivityPage() {
  const [rows, setRows] = useState<{ id: string; action: string; ip_address: string; created_at: string }[]>([])

  useEffect(() => {
    api.activity().then(setRows).catch(() => setRows([]))
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[32px] font-bold">Account Activity</h1>
        <Link href="/desk" className="btn-secondary">
          Back to home page
        </Link>
      </div>
      <GlassCard>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/40 text-slate">
                <th className="py-3 pr-3">Action</th>
                <th className="py-3 pr-3">Date & time</th>
                <th className="py-3">IP address</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-slate">
                    No activity yet.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="border-b border-white/30">
                    <td className="py-3 pr-3">{row.action}</td>
                    <td className="py-3 pr-3">{formatDate(row.created_at)}</td>
                    <td className="py-3">{row.ip_address || '—'}</td>
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
