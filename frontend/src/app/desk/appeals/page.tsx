'use client'

import { GlassCard } from '@/components/ui/GlassCard'

export default function AppealDeskPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-[32px] font-bold">Appeal Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-panel bg-indigo p-6 text-white">
          <p className="text-sm text-white/70">Total appeals lodged</p>
          <p className="mt-2 text-4xl font-bold">0</p>
        </div>
        <div className="rounded-panel bg-attention p-6 text-white">
          <p className="text-sm text-white/80">Appeals pending</p>
          <p className="mt-2 text-4xl font-bold">0</p>
        </div>
        <div className="rounded-panel bg-success p-6 text-white">
          <p className="text-sm text-white/80">Appeals closed</p>
          <p className="mt-2 text-4xl font-bold">0</p>
        </div>
      </div>
      <GlassCard>
        <h2 className="mb-4 text-[22px] font-semibold">List of appeals</h2>
        <p className="py-8 text-center text-sm text-slate">No data available in table.</p>
      </GlassCard>
    </div>
  )
}
