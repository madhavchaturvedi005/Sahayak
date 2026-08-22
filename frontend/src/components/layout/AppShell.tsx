'use client'

import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { DeskSidebar } from './DeskSidebar'

const DESK_PREFIXES = ['/desk', '/grievance/lodge', '/grievance/lodge-pension', '/grievance/reminder', '/grievance/rate']

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, ready } = useAuth()
  const pathname = usePathname()
  const onDesk = DESK_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))

  if (!ready || !user || !onDesk) {
    return <>{children}</>
  }

  return (
    <div className="page-wrap grid items-start gap-6 pb-8 lg:grid-cols-[280px_minmax(0,1fr)]">
      <DeskSidebar />
      <div className="min-w-0">{children}</div>
    </div>
  )
}
