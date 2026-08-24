'use client'

import { usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { isStaff } from '@/lib/roles'
import { AdminSidebar } from './AdminSidebar'
import { DeskSidebar } from './DeskSidebar'

const DESK_PREFIXES = ['/desk', '/grievance/lodge', '/grievance/lodge-pension', '/grievance/reminder', '/grievance/rate']

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, ready } = useAuth()
  const pathname = usePathname()
  const onDesk = DESK_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))
  const onAdmin = pathname.startsWith('/admin') && pathname !== '/admin/signin'

  if (!ready || !user) {
    return <>{children}</>
  }

  if (onAdmin && isStaff(user)) {
    return (
      <div className="page-wrap grid items-start gap-6 pb-8 lg:grid-cols-[280px_minmax(0,1fr)]">
        <AdminSidebar />
        <div className="min-w-0">{children}</div>
      </div>
    )
  }

  if (!onDesk) {
    return <>{children}</>
  }

  return (
    <div className="page-wrap grid items-start gap-6 pb-8 lg:grid-cols-[280px_minmax(0,1fr)]">
      <DeskSidebar />
      <div className="min-w-0">{children}</div>
    </div>
  )
}
