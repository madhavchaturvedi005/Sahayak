'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { isAdmin, isCm, isStaff } from '@/lib/roles'

const ADMIN_ONLY_PREFIXES = ['/admin/users', '/admin/config', '/admin/persona']

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, ready } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const onSignIn = pathname === '/admin/signin'
  const adminOnlyRoute = ADMIN_ONLY_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))

  useEffect(() => {
    if (!ready) return
    if (onSignIn) {
      if (isStaff(user)) router.replace(isCm(user) ? '/admin/cm' : '/admin')
      return
    }
    if (!user) {
      router.replace('/admin/signin')
      return
    }
    if (!isStaff(user)) {
      router.replace('/desk')
      return
    }
    if (isCm(user) && pathname === '/admin') {
      router.replace('/admin/cm')
      return
    }
    if (adminOnlyRoute && !isAdmin(user)) router.replace(isCm(user) ? '/admin/cm' : '/admin')
  }, [ready, user, onSignIn, adminOnlyRoute, router])

  if (!ready) {
    return <div className="h-40 animate-shimmer rounded-panel bg-[linear-gradient(90deg,#e8ebf2,#f7f8fa,#e8ebf2)] bg-[length:200%_100%]" />
  }
  if (onSignIn) return <>{children}</>
  if (!user || !isStaff(user)) return null
  if (adminOnlyRoute && !isAdmin(user)) return null
  return <>{children}</>
}
