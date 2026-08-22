'use client'

import { useEffect, useState } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { NOTE_DPG } from '@/lib/content'
import { api, type Officer } from '@/lib/api'

export default function AppealAuthorityPage() {
  const [rows, setRows] = useState<Officer[]>([])

  useEffect(() => {
    api.officers('appeal').then(setRows).catch(() => setRows([]))
  }, [])

  return (
    <div className="page-wrap space-y-6 pb-16">
      <h1 className="text-[32px] font-bold">Nodal Authority for Appeal</h1>
      <GlassCard>
        <p className="leading-relaxed">{NOTE_DPG}</p>
      </GlassCard>
      {rows.map((row) => (
        <GlassCard key={row.id}>
          <p className="text-sm text-amber">{row.designation}</p>
          <h2 className="text-xl font-semibold">{row.organisation}</h2>
          <p className="mt-2">{row.name}</p>
          <p className="mt-1 text-sm text-slate">
            {row.email}
            <br />
            {row.phone}
          </p>
        </GlassCard>
      ))}
    </div>
  )
}
