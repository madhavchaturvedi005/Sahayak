'use client'

import { useEffect, useState } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { useAuth } from '@/context/AuthContext'
import { api, type AdminUser } from '@/lib/api'
import { isAdmin } from '@/lib/roles'
import { formatDate } from '@/lib/utils'

const ROLES = ['citizen', 'officer', 'admin']

export default function AdminUsersPage() {
  const { user } = useAuth()
  const [rows, setRows] = useState<AdminUser[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isAdmin(user)) return
    api
      .adminUsers()
      .then(setRows)
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load users'))
  }, [user])

  async function changeRole(id: string, role: string) {
    setError('')
    try {
      const updated = await api.adminSetRole(id, role)
      setRows((current) => current.map((row) => (row.id === updated.id ? updated : row)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not change role')
    }
  }

  if (!isAdmin(user)) {
    return (
      <GlassCard>
        <p className="text-sm text-slate">Only the administrator can change roles.</p>
      </GlassCard>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[32px] font-bold">Users and roles</h1>
        <p className="mt-1 text-sm text-slate">Promote a citizen to officer, or keep administrator access limited.</p>
      </div>
      <GlassCard>
        {error && <p className="mb-4 text-sm text-attention">{error}</p>}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/40 text-slate">
                <th className="py-3 pr-3">Name</th>
                <th className="py-3 pr-3">Mobile</th>
                <th className="py-3 pr-3">Joined</th>
                <th className="py-3">Role</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-white/30">
                  <td className="py-3 pr-3">
                    <p className="font-medium">{row.name}</p>
                    <p className="text-xs text-slate">{row.email || '—'}</p>
                  </td>
                  <td className="py-3 pr-3">{row.mobile}</td>
                  <td className="py-3 pr-3">{formatDate(row.created_at)}</td>
                  <td className="py-3">
                    <select className="field max-w-[160px]" value={row.role} onChange={(e) => changeRole(row.id, e.target.value)}>
                      {ROLES.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  )
}
