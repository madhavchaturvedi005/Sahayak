'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { api, type AdminAppeal } from '@/lib/api'
import { formatDate } from '@/lib/utils'

export default function AdminAppealsPage() {
  const [rows, setRows] = useState<AdminAppeal[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .adminAppeals()
      .then(setRows)
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load appeals'))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[32px] font-bold">Appeals</h1>
        <p className="mt-1 text-sm text-slate">Appeals filed by citizens against a closed or resolved grievance.</p>
      </div>
      <GlassCard>
        {error && <p className="mb-4 text-sm text-attention">{error}</p>}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/40 text-slate">
                <th className="py-3 pr-3">Appeal</th>
                <th className="py-3 pr-3">Registration</th>
                <th className="py-3 pr-3">Subject</th>
                <th className="py-3 pr-3">Filed</th>
                <th className="py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate">
                    No appeals filed.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.appeal_id} className="border-b border-white/30">
                    <td className="py-3 pr-3">{row.appeal_id}</td>
                    <td className="py-3 pr-3">
                      <Link href={`/admin/grievances/${row.registration_id}`}>{row.registration_id}</Link>
                    </td>
                    <td className="py-3 pr-3">
                      <p>{row.subject}</p>
                      <p className="mt-1 text-xs text-slate">{row.reason}</p>
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
