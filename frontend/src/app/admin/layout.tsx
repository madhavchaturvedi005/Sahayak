'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { isStaff } from '@/lib/roles'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, ready } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const onSignIn = pathname === '/admin/signin'

  useEffect(() => {
    if (!ready) return
    if (onSignIn) {
      if (isStaff(user)) router.replace('/admin')
      return
    }
    if (!user) {
      router.replace('/admin/signin')
      return
    }
    if (!isStaff(user)) router.replace('/desk')
  }, [ready, user, onSignIn, router])

  if (!ready) {
    return <div className="h-40 animate-shimmer rounded-panel bg-[linear-gradient(90deg,#e8ebf2,#f7f8fa,#e8ebf2)] bg-[length:200%_100%]" />
  }
  if (onSignIn) return <>{children}</>
  if (!user || !isStaff(user)) return null
  return <>{children}</>
}
