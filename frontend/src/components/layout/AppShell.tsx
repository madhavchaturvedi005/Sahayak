'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { isStaff } from '@/lib/roles'
import { AdminSidebar } from './AdminSidebar'
import { DeskSidebar } from './DeskSidebar'

const DESK_PREFIXES = ['/desk', '/grievance/lodge', '/grievance/lodge-pension', '/grievance/reminder', '/grievance/rate']

const SHIMMER = 'h-40 animate-shimmer rounded-panel bg-[linear-gradient(90deg,#e8ebf2,#f7f8fa,#e8ebf2)] bg-[length:200%_100%]'

function AuthGate({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { user, ready } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!ready) return
    if (!user) {
      const dest = adminOnly ? '/admin/signin' : `/auth/signin?next=${encodeURIComponent(pathname)}`
      router.replace(dest)
    } else if (adminOnly && !isStaff(user)) {
      router.replace('/')
    }
  }, [ready, user, router, pathname, adminOnly])

  if (!ready || !user || (adminOnly && !isStaff(user))) {
    return (
      <div className="page-wrap pb-8">
        <div className={SHIMMER} />
      </div>
    )
  }

  return <>{children}</>
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, ready } = useAuth()
  const pathname = usePathname()
  const onDesk = DESK_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))
  const onAdmin = pathname.startsWith('/admin') && pathname !== '/admin/signin'

  if (onAdmin) {
    return (
      <AuthGate adminOnly>
        <div className="page-wrap grid items-start gap-6 pb-12 lg:grid-cols-[280px_minmax(0,1fr)]">
          <AdminSidebar />
          <div className="min-w-0">{children}</div>
        </div>
      </AuthGate>
    )
  }

  if (onDesk) {
    return (
      <AuthGate>
        <div className="page-wrap grid items-start gap-6 pb-12 lg:grid-cols-[280px_minmax(0,1fr)]">
          <DeskSidebar />
          <div className="min-w-0">{children}</div>
        </div>
      </AuthGate>
    )
  }

  // Public pages — pass through; pages add their own page-wrap
  if (!ready || !user) {
    return <>{children}</>
  }

  return <>{children}</>
}
